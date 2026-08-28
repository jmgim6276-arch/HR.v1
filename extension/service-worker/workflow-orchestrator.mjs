/**
 * 三模块统一流水线：打招呼 -> 切换沟通页 -> 自动回复与简历采集协调监听。
 *
 * 本模块只负责编排，不复制各业务模块的筛选、回复或采集逻辑。
 */

const COMMAND = {
  START: 'cmd_start_unified_workflow',
  STOP: 'cmd_stop_unified_workflow',
  RESUME: 'cmd_resume_unified_workflow',
  STATUS: 'cmd_get_unified_workflow_status',
  FAILURES: 'cmd_get_resume_failures',
  RETRY_FAILURE: 'cmd_retry_resume_failure',
  REMOVE_FAILURE: 'cmd_remove_resume_failure',
  RESUME_LOCK: 'cmd_workflow_resume_lock',
  RESUME_UNLOCK: 'cmd_workflow_resume_unlock',
};

const RUNTIME_KEY = 'unifiedWorkflowRuntime';
const CONFIG_KEY = 'unifiedWorkflowConfig';
const APPROVAL_KEY = 'unifiedWorkflowApproval';
const FAILURE_KEY = 'resumeCollectFailures';
const PRIVACY_VERSION = '2026-07-29';
const DEADLINE_ALARM = 'unified-workflow-deadline';
const REPLY_RESTART_ALARM = 'unified-workflow-reply-restart';
const RISK_PATTERN = /安全验证|操作频繁|访问过于频繁|账号异常|请完成验证|登录|订阅|页面结构|页面已离开|无法确认|内容脚本|网络异常/i;
const GREETING_COMPLETE_PATTERN = /所有岗位已按顺序处理完成|全部岗位.*完成|处理完成/;
const LISTEN_COMPLETE_PATTERN = /持续监听窗口已完成|监听.*完成/;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function defaultRuntime() {
  return {
    state: 'idle',
    stage: 'idle',
    statusText: '等待启动',
    config: null,
    startedAt: 0,
    deadlineAt: 0,
    pausedStage: '',
    resumeLock: false,
    logs: [],
    moduleStates: { greeting: 'idle', reply: 'idle', resume: 'idle' },
    greetingCumulative: 0,
    greetingHighWaterMark: 0,
    greetingCap: 0,
  };
}

function normalizeConfig(input = {}) {
  const modules = {
    greeting: input.modules?.greeting !== false,
    reply: input.modules?.reply !== false,
    resume: input.modules?.resume !== false,
  };
  if (!modules.greeting && !modules.reply && !modules.resume) {
    throw new Error('请至少开启一个模块');
  }
  return {
    modules,
    listenDurationMinutes: Math.min(240, Math.max(1, Number(input.listenDurationMinutes) || 120)),
    scanIntervalSeconds: Math.min(300, Math.max(15, Number(input.scanIntervalSeconds) || 60)),
    greetingCap: Math.min(500, Math.max(0, Number(input.greetingCap) || 0)),
    // 简历采集调参（合并控制台后由一键运行采集折叠区提供；缺省保持原行为）
    intervalSeconds: Math.min(300, Math.max(60, Number(input.intervalSeconds) || 60)),
    actionDelaySeconds: Math.min(15, Math.max(4, Number(input.actionDelaySeconds) || 4)),
    maxPerRun: Math.min(200, Math.max(1, Number(input.maxPerRun) || 100)),
    autoSendReply: input.autoSendReply === true,
  };
}

function publicRuntime(runtime) {
  return JSON.parse(JSON.stringify(runtime));
}

export function createWorkflowOrchestrator({
  runCommand,
  startResumeCollector,
  stopResumeCollector,
  resumeResumeCollector,
  getResumeCollectorStatus,
  broadcast = () => {},
}) {
  let runtime = defaultRuntime();
  let transitionPromise = null;

  const ready = chrome.storage.local.get([RUNTIME_KEY, CONFIG_KEY]).then(stored => {
    const saved = stored[RUNTIME_KEY];
    if (saved && typeof saved === 'object') runtime = { ...defaultRuntime(), ...saved };
    if (!runtime.config && stored[CONFIG_KEY]) runtime.config = stored[CONFIG_KEY];
  });

  async function persist() {
    await chrome.storage.local.set({ [RUNTIME_KEY]: runtime });
  }

  function emitStatus() {
    broadcast('status_update', { ...publicRuntime(runtime), taskType: 'workflow' });
  }

  async function log(message, level = 'info') {
    const item = { time: Date.now(), level, message };
    runtime.logs.push(item);
    if (runtime.logs.length > 200) runtime.logs.splice(0, runtime.logs.length - 200);
    broadcast('running_log', { ...item, taskType: 'workflow' });
    await persist();
  }

  async function update(patch) {
    runtime = { ...runtime, ...patch };
    await persist();
    emitStatus();
  }

  async function requireApproval() {
    const approval = (await chrome.storage.local.get(APPROVAL_KEY))[APPROVAL_KEY];
    const approvedAt = approval?.approvedAt ? new Date(approval.approvedAt).getTime() : 0;
    if (!approval || approval.privacyVersion !== PRIVACY_VERSION || !approvedAt || Date.now() - approvedAt > 15 * 60 * 1000) {
      throw new Error('本次联动任务范围尚未确认，请重新点击一键启动并审核三个模块的执行范围');
    }
  }

  async function refreshModuleApprovals() {
    const keys = ['greetingAutomationApproval', 'replyAutomationApproval'];
    const stored = await chrome.storage.local.get(keys);
    const now = new Date().toISOString();
    const updates = {};
    for (const key of keys) {
      if (stored[key]) updates[key] = { ...stored[key], approvedAt: now, privacyVersion: PRIVACY_VERSION };
    }
    if (Object.keys(updates).length) await chrome.storage.local.set(updates);
  }

  async function findBossTab() {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (active?.url?.includes('zhipin.com')) return active;
    const tabs = await chrome.tabs.query({ url: ['https://www.zhipin.com/*'] });
    return tabs[0] || null;
  }

  async function waitForTabComplete(tabId, timeoutMs = 25000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const tab = await chrome.tabs.get(tabId).catch(() => null);
      if (tab?.status === 'complete') {
        await delay(2500);
        return tab;
      }
      await delay(500);
    }
    throw new Error('BOSS 沟通页面加载超时');
  }

  async function ensureChatPage() {
    let tab = await findBossTab();
    if (!tab) throw new Error('请先打开 BOSS 直聘页面');
    await chrome.tabs.update(tab.id, { active: true });
    if (!/^https:\/\/www\.zhipin\.com\/web\/chat/i.test(tab.url || '')) {
      tab = await chrome.tabs.update(tab.id, { url: 'https://www.zhipin.com/web/chat', active: true });
      await waitForTabComplete(tab.id);
    } else {
      await delay(800);
    }
    return tab;
  }

  async function scheduleDeadline() {
    const when = runtime.deadlineAt || Date.now() + runtime.config.listenDurationMinutes * 60 * 1000;
    await chrome.alarms.create(DEADLINE_ALARM, { when });
  }

  async function finish(statusText = '联动任务已完成') {
    if (runtime.state === 'idle' && runtime.stage === 'completed') return;
    await chrome.alarms.clear(DEADLINE_ALARM).catch(() => {});
    await chrome.alarms.clear(REPLY_RESTART_ALARM).catch(() => {});
    await update({ state: 'stopping', statusText: '正在结束联动任务' });
    if (runtime.config?.modules?.resume) await stopResumeCollector().catch(() => {});
    if (runtime.config?.modules?.reply) await runCommand('cmd_stop').catch(() => {});
    if (runtime.config?.modules?.greeting && runtime.stage === 'greeting') {
      await runCommand('cmd_stop_greeting').catch(() => {});
    }
    runtime.moduleStates = { ...runtime.moduleStates, reply: 'idle', resume: 'idle' };
    await update({ state: 'idle', stage: 'completed', statusText, resumeLock: false });
    await log(`✅ ${statusText}`);
  }

  async function pauseForManual(reason, stage = runtime.stage) {
    if (runtime.state === 'paused') return publicRuntime(runtime);
    if (runtime.config?.modules?.greeting) await runCommand('cmd_pause_greeting').catch(() => {});
    if (runtime.config?.modules?.reply) await runCommand('cmd_pause').catch(() => {});
    await update({ state: 'paused', pausedStage: stage, stage, statusText: `需人工处理：${reason}` });
    await log(`⏸ 流水线已暂停：${reason}`, 'warn');
    return publicRuntime(runtime);
  }

  async function enterListeningStage() {
    if (transitionPromise) return transitionPromise;
    transitionPromise = (async () => {
      if (!runtime.config.modules.reply && !runtime.config.modules.resume) {
        await finish('已启用的打招呼阶段完成');
        return;
      }
      await update({ state: 'running', stage: 'switching_to_chat', statusText: '正在切换到 BOSS 沟通页' });
      await log('打招呼阶段结束，正在切换到沟通页');
      await ensureChatPage();
      await refreshModuleApprovals();

      if (runtime.config.modules.reply) {
        await update({ statusText: '正在启动自动回复' });
        await runCommand('cmd_start');
        runtime.moduleStates.reply = 'running';
        await log('💬 自动回复已启动，消息将在简历采集期间排队');
      }

      if (runtime.config.modules.resume) {
        await update({ statusText: '正在启动持续简历采集' });
        await startResumeCollector({
          coordinatedMode: true,
          listenDurationMinutes: runtime.config.listenDurationMinutes,
          scanIntervalSeconds: runtime.config.scanIntervalSeconds,
          intervalSeconds: runtime.config.intervalSeconds,
          actionDelaySeconds: runtime.config.actionDelaySeconds,
          maxPerRun: runtime.config.maxPerRun,
          autoSendReply: runtime.config.autoSendReply === true,
          routeNonResumeReply: runtime.config.modules.reply === true,
        });
        runtime.moduleStates.resume = 'running';
        await log('📥 简历采集已启动；发现有效简历时将优先处理');
      }

      runtime.deadlineAt = Date.now() + runtime.config.listenDurationMinutes * 60 * 1000;
      await update({
        state: 'running',
        stage: 'listening',
        statusText: `自动回复与简历采集协调运行中（${runtime.config.listenDurationMinutes} 分钟）`,
      });
      await scheduleDeadline();
    })().catch(async err => {
      await pauseForManual(err.message, 'switching_to_chat');
      throw err;
    }).finally(() => {
      transitionPromise = null;
    });
    return transitionPromise;
  }

  async function start(configInput) {
    await ready;
    if (runtime.state === 'running') throw new Error('三模块联动任务已经在运行');
    await requireApproval();
    const config = normalizeConfig(configInput);
    const subscription = await runCommand('cmd_validate_subscription');
    if (!subscription?.valid) throw new Error(subscription?.message || '登录或订阅校验失败');

    runtime = {
      ...defaultRuntime(),
      state: 'running',
      stage: config.modules.greeting ? 'greeting' : 'switching_to_chat',
      statusText: config.modules.greeting ? '正在启动推荐牛人筛选与打招呼' : '正在进入沟通监听阶段',
      config,
      startedAt: Date.now(),
      moduleStates: { greeting: 'idle', reply: 'idle', resume: 'idle' },
      greetingCumulative: 0,
      greetingHighWaterMark: 0,
      greetingCap: config.greetingCap || 0,
    };
    await chrome.storage.local.set({ [CONFIG_KEY]: config, [RUNTIME_KEY]: runtime });
    emitStatus();
    await log(`▶ 一键联动已启动：打招呼=${config.modules.greeting ? '开' : '关'}，自动回复=${config.modules.reply ? '开' : '关'}，简历采集=${config.modules.resume ? '开' : '关'}`);

    if (config.modules.greeting) {
      await refreshModuleApprovals();
      try {
        await runCommand('cmd_start_greeting');
        runtime.moduleStates.greeting = 'running';
        await update({ statusText: '正在推荐牛人页面筛选、打招呼并索要简历' });
      } catch (err) {
        await pauseForManual(err.message, 'greeting');
        throw err;
      }
    } else {
      await enterListeningStage();
    }
    return publicRuntime(runtime);
  }

  async function stop() {
    await ready;
    await chrome.alarms.clear(DEADLINE_ALARM).catch(() => {});
    await chrome.alarms.clear(REPLY_RESTART_ALARM).catch(() => {});
    await update({ state: 'stopping', statusText: '正在停止全部模块' });
    await Promise.allSettled([
      runCommand('cmd_stop_greeting'),
      runCommand('cmd_stop'),
      stopResumeCollector(),
    ]);
    runtime.moduleStates = { greeting: 'idle', reply: 'idle', resume: 'idle' };
    await update({ state: 'idle', stage: 'stopped', statusText: '用户已停止联动任务', resumeLock: false });
    await log('⏹ 用户已停止整条流水线');
    return publicRuntime(runtime);
  }

  async function resume() {
    await ready;
    if (runtime.state !== 'paused') throw new Error('当前流水线不在暂停状态');
    await requireApproval();
    const pausedStage = runtime.pausedStage || runtime.stage;
    await refreshModuleApprovals();
    await update({ state: 'running', statusText: '正在从中断阶段恢复' });
    try {
      if (pausedStage === 'greeting') {
        try {
          await runCommand('cmd_resume_greeting');
        } catch (_) {
          await runCommand('cmd_start_greeting');
        }
        runtime.moduleStates.greeting = 'running';
        await update({ stage: 'greeting', pausedStage: '', statusText: '已恢复打招呼阶段' });
      } else {
        await ensureChatPage();
        if (runtime.config.modules.reply) {
          if (runtime.moduleStates.reply === 'idle') await runCommand('cmd_start');
          else {
            try { await runCommand('cmd_resume'); }
            catch (_) { await runCommand('cmd_start'); }
          }
          runtime.moduleStates.reply = 'running';
        }
        if (runtime.config.modules.resume) {
          const collectorStatus = await getResumeCollectorStatus();
          if (collectorStatus?.state === 'paused') await resumeResumeCollector();
          else if (collectorStatus?.state !== 'running') {
            await startResumeCollector({
              coordinatedMode: true,
              listenDurationMinutes: runtime.config.listenDurationMinutes,
              scanIntervalSeconds: runtime.config.scanIntervalSeconds,
              intervalSeconds: runtime.config.intervalSeconds,
              actionDelaySeconds: runtime.config.actionDelaySeconds,
              maxPerRun: runtime.config.maxPerRun,
              autoSendReply: runtime.config.autoSendReply === true,
              routeNonResumeReply: runtime.config.modules.reply === true,
            });
          }
          runtime.moduleStates.resume = 'running';
        }
        runtime.deadlineAt = Math.max(runtime.deadlineAt || 0, Date.now() + 60 * 1000);
        await update({ stage: 'listening', pausedStage: '', statusText: '已恢复协调监听' });
        await scheduleDeadline();
      }
      await log('▶ 人工确认完成，流水线已从中断阶段恢复');
      return publicRuntime(runtime);
    } catch (err) {
      await pauseForManual(err.message, pausedStage);
      throw err;
    }
  }

  async function getStatus() {
    await ready;
    return publicRuntime(runtime);
  }

  async function getFailures() {
    const records = (await chrome.storage.local.get(FAILURE_KEY))[FAILURE_KEY] || {};
    return Object.values(records).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  async function reloadFailuresInTab() {
    const tab = await findBossTab();
    if (tab) await chrome.tabs.sendMessage(tab.id, { action: 'rc_reload_failures' }).catch(() => {});
  }

  async function removeFailure(data = {}) {
    const key = String(data.candidateKey || '');
    if (!key) throw new Error('缺少候选人标识');
    const records = (await chrome.storage.local.get(FAILURE_KEY))[FAILURE_KEY] || {};
    delete records[key];
    await chrome.storage.local.set({ [FAILURE_KEY]: records });
    await reloadFailuresInTab();
    return { ok: true, failures: Object.values(records) };
  }

  async function lockForResume(data = {}) {
    await ready;
    if (runtime.state !== 'running' || runtime.stage !== 'listening' || runtime.resumeLock) return { ok: true };
    runtime.resumeLock = true;
    if (runtime.config?.modules?.reply) await runCommand('cmd_pause').catch(() => {});
    await update({ statusText: `简历采集优先：${data.name || '候选人'}（自动回复已排队）` });
    await log(`🔒 简历采集获得页面操作权：${data.name || data.candidateKey || '候选人'}`);
    return { ok: true };
  }

  async function unlockAfterResume(data = {}) {
    await ready;
    if (!runtime.resumeLock) return { ok: true };
    runtime.resumeLock = false;
    if (runtime.state === 'running' && runtime.stage === 'listening' && runtime.config?.modules?.reply) {
      if (runtime.moduleStates.reply === 'idle') {
        await refreshModuleApprovals();
        await runCommand('cmd_start').catch(() => {});
      } else {
        await runCommand('cmd_resume').catch(() => {});
      }
    }
    await update({ statusText: '自动回复与简历采集协调运行中' });
    await log(`🔓 简历采集已释放页面操作权：${data.name || data.candidateKey || '候选人'}`);
    return { ok: true };
  }

  async function observeMessage(message) {
    await ready;
    if (!message?.action || !message.data || runtime.state !== 'running') return;
    const data = message.data;
    if (message.action === 'greeting_status_report' && runtime.stage === 'greeting') {
      runtime.moduleStates.greeting = data.state || runtime.moduleStates.greeting;
      const progressMatch = (data.statusText || '').match(/打招呼进度\s+(\d+)\/(\d+)/);
      if (progressMatch) {
        const n = Number(progressMatch[1]);
        if (n < runtime.greetingHighWaterMark) {
          runtime.greetingCumulative += runtime.greetingHighWaterMark;
          runtime.greetingHighWaterMark = n;
        } else {
          runtime.greetingHighWaterMark = n;
        }
        const total = runtime.greetingCumulative + runtime.greetingHighWaterMark;
        if (runtime.greetingCap > 0 && total >= runtime.greetingCap && data.state === 'running') {
          await log(`🛑 打招呼已达编排上限 ${runtime.greetingCap} 人（已完成 ${total} 人），强制切换沟通页`);
          await runCommand('cmd_stop_greeting').catch(() => {});
          await persist();
          return;
        }
      }
      if (data.state === 'idle') {
        if (RISK_PATTERN.test(data.statusText || '')) await pauseForManual(data.statusText, 'greeting');
        else if (GREETING_COMPLETE_PATTERN.test(data.statusText || '') ||
                 (runtime.greetingCap > 0 && runtime.greetingCumulative + runtime.greetingHighWaterMark >= runtime.greetingCap)) {
          await enterListeningStage();
        } else await pauseForManual(data.statusText || '打招呼任务意外停止', 'greeting');
      } else {
        await persist();
      }
    }
    if (message.action === 'status_report' && runtime.stage === 'listening') {
      runtime.moduleStates.reply = data.state || runtime.moduleStates.reply;
      if (data.state === 'idle' && RISK_PATTERN.test(data.statusText || '')) {
        await pauseForManual(data.statusText, 'listening');
      } else if (data.state === 'idle' && runtime.config?.modules?.reply) {
        await persist();
        if (!runtime.resumeLock) {
          await chrome.alarms.create(REPLY_RESTART_ALARM, {
            when: Date.now() + runtime.config.scanIntervalSeconds * 1000,
          });
          await log(`自动回复本轮已结束，将在 ${runtime.config.scanIntervalSeconds} 秒后继续监听`);
        }
      } else await persist();
    }
    if (message.action === 'rc_status_update' && ['listening', 'switching_to_chat'].includes(runtime.stage)) {
      runtime.moduleStates.resume = data.state || runtime.moduleStates.resume;
      if (data.state === 'paused') await pauseForManual(data.statusText || '简历采集需要人工处理', 'listening');
      else if (data.state === 'idle' && LISTEN_COMPLETE_PATTERN.test(data.statusText || '')) await finish('协调监听窗口已完成');
      else if (data.state === 'idle') await pauseForManual(data.statusText || '简历采集意外停止', 'listening');
      else await persist();
    }
  }

  chrome.runtime.onMessage.addListener(message => {
    if (['greeting_status_report', 'status_report', 'rc_status_update'].includes(message?.action)) {
      observeMessage(message).catch(err => console.error('[Workflow] 状态处理失败:', err));
    }
    return false;
  });

  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === DEADLINE_ALARM) {
      ready.then(() => {
        if (runtime.state === 'running' && runtime.stage === 'listening') return finish('协调监听窗口已完成');
      }).catch(err => console.error('[Workflow] 截止时间处理失败:', err));
    }
    if (alarm.name === REPLY_RESTART_ALARM) {
      ready.then(async () => {
        if (runtime.state !== 'running' || runtime.stage !== 'listening' ||
            !runtime.config?.modules?.reply || runtime.resumeLock || Date.now() >= runtime.deadlineAt) return;
        await refreshModuleApprovals();
        await ensureChatPage();
        await runCommand('cmd_start');
        runtime.moduleStates.reply = 'running';
        await update({ statusText: '自动回复与简历采集协调运行中' });
        await log('💬 自动回复已进入下一轮监听');
      }).catch(err => pauseForManual(err.message, 'listening'));
    }
  });

  return {
    handlers: {
      [COMMAND.START]: start,
      [COMMAND.STOP]: stop,
      [COMMAND.RESUME]: resume,
      [COMMAND.STATUS]: getStatus,
      [COMMAND.FAILURES]: getFailures,
      [COMMAND.RETRY_FAILURE]: removeFailure,
      [COMMAND.REMOVE_FAILURE]: removeFailure,
      [COMMAND.RESUME_LOCK]: lockForResume,
      [COMMAND.RESUME_UNLOCK]: unlockAfterResume,
    },
  };
}
