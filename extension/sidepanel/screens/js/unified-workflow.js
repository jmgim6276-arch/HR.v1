(function () {
  'use strict';

  const PRIVACY_VERSION = '2026-07-29';
  const CONFIG_KEY = 'unifiedWorkflowConfig';
  const APPROVAL_KEY = 'unifiedWorkflowApproval';
  const $ = id => document.getElementById(id);
  let localLogsClearedAt = 0;

  const stageLabels = {
    idle: '未启动',
    greeting: '推荐牛人筛选并打招呼',
    switching_to_chat: '切换到沟通页',
    listening: '自动回复与简历采集协调监听',
    completed: '已完成',
    stopped: '已停止',
  };

  async function send(action, data) {
    const api = window.parent?.__shellAPI;
    if (api?.sendToSW) return api.sendToSW(action, data);
    const result = await chrome.runtime.sendMessage({ action, data });
    if (result?.error) throw new Error(result.error);
    return result;
  }

  function getConfig() {
    return {
      modules: {
        greeting: $('enableGreeting').checked,
        reply: $('enableReply').checked,
        resume: $('enableResume').checked,
      },
      listenDurationMinutes: Math.min(240, Math.max(1, Number($('listenDuration').value) || 120)),
      scanIntervalSeconds: Math.min(300, Math.max(15, Number($('scanInterval').value) || 60)),
      greetingCap: Math.min(500, Math.max(0, Number($('greetingCap').value) || 0)),
      // 简历采集调参（合并自原简历采集控制台）
      maxPerRun: Math.min(200, Math.max(1, Number($('rcMaxPerRun').value) || 100)),
      intervalSeconds: Math.min(300, Math.max(60, Number($('rcInterval').value) || 60)),
      actionDelaySeconds: Math.min(15, Math.max(4, Number($('rcActionDelay').value) || 4)),
      autoSendReply: $('rcAutoSend').checked === true,
    };
  }

  function renderModuleCards() {
    document.querySelectorAll('.module').forEach(card => {
      card.classList.toggle('enabled', $(`enable${card.dataset.module[0].toUpperCase()}${card.dataset.module.slice(1)}`).checked);
    });
  }

  async function loadConfig() {
    const stored = await chrome.storage.local.get(CONFIG_KEY);
    const config = stored[CONFIG_KEY];
    if (config) {
      $('enableGreeting').checked = config.modules?.greeting !== false;
      $('enableReply').checked = config.modules?.reply !== false;
      $('enableResume').checked = config.modules?.resume !== false;
      $('listenDuration').value = config.listenDurationMinutes || 120;
      $('scanInterval').value = config.scanIntervalSeconds || 60;
      if (config.greetingCap != null) $('greetingCap').value = config.greetingCap;
      if (config.maxPerRun != null) $('rcMaxPerRun').value = config.maxPerRun;
      if (config.intervalSeconds != null) $('rcInterval').value = config.intervalSeconds;
      if (config.actionDelaySeconds != null) $('rcActionDelay').value = config.actionDelaySeconds;
      $('rcAutoSend').checked = config.autoSendReply === true;
    }
    renderModuleCards();
  }

  async function confirmScope(config) {
    if (!Object.values(config.modules).some(Boolean)) {
      alert('请至少开启一个模块');
      return false;
    }
    const stored = await chrome.storage.local.get([
      'privacyConsent', 'jobConfigs', 'greetingConfigs', 'replyPositionConfigs', 'keywordRules', 'modelConfig',
    ]);
    const consent = stored.privacyConsent || {};
    if (consent.version !== PRIVACY_VERSION || !consent.acceptedAt) {
      alert('请先到个人中心同意最新隐私政策与数据处理说明');
      return false;
    }

    const jobs = (stored.jobConfigs || []).filter(item => item.enabled !== false);
    const greetingByJob = new Map((stored.greetingConfigs || []).map(item => [item.jobId, item]));
    const greetingJobs = jobs.filter(job => greetingByJob.has(job.id));
    const greetingTarget = greetingJobs.reduce((sum, job) => sum + Math.max(0, Number(greetingByJob.get(job.id)?.greetCount) || 0), 0);
    const replyConfigs = (stored.replyPositionConfigs || []).filter(item => item.enabled !== false);
    const modules = [
      config.modules.greeting ? (
        config.greetingCap > 0
          ? `打招呼：开启（${greetingJobs.length} 个岗位，编排上限 ${config.greetingCap} 人，达上限后自动切换沟通页）`
          : `打招呼：开启（${greetingJobs.length} 个岗位，计划上限 ${greetingTarget || '按岗位配置'} 人）`
      ) : '打招呼：关闭',
      config.modules.reply ? `自动回复：开启（${replyConfigs.length ? replyConfigs.map(item => item.name).filter(Boolean).join('、') : '全部已发布岗位'}）` : '自动回复：关闭',
      config.modules.resume ? '简历采集：开启（监听全部有效简历请求，失败三次永久跳过）' : '简历采集：关闭',
    ];
    const approved = window.confirm([
      '启动前请确认本次三模块联动范围', '', ...modules, '',
      `协调监听：${config.listenDurationMinutes} 分钟，每 ${config.scanIntervalSeconds} 秒扫描一次。`,
      '简历采集拥有页面操作优先级，期间自动回复消息进入队列。',
      '出现安全验证、操作频繁、登录失效或页面异常时将全局暂停。', '',
      '确认后将按上述范围自动运行，无需逐条确认。是否启动？',
    ].join('\n'));
    if (!approved) return false;

    const now = new Date().toISOString();
    const updates = {
      [CONFIG_KEY]: config,
      [APPROVAL_KEY]: {
        approvedAt: now,
        privacyVersion: PRIVACY_VERSION,
        recipientScope: 'configured-recommended-candidates-and-all-valid-resume-requests',
        modules: config.modules,
        listenDurationMinutes: config.listenDurationMinutes,
      },
    };
    if (config.modules.greeting) {
      updates.greetingAutomationApproval = {
        approvedAt: now,
        privacyVersion: PRIVACY_VERSION,
        positions: greetingJobs.map(job => job.name).filter(Boolean),
        recipientScope: 'recommended-candidates-matching-approved-job-filters',
        totalTarget: greetingTarget,
      };
    }
    if (config.modules.reply) {
      updates.replyAutomationApproval = {
        approvedAt: now,
        privacyVersion: PRIVACY_VERSION,
        mode: replyConfigs.length ? 'whitelist' : 'all',
        positions: replyConfigs.map(item => item.name).filter(Boolean),
        recipientScope: 'incoming-candidates-for-approved-positions',
      };
    }
    await chrome.storage.local.set(updates);
    return true;
  }

  const moduleStateLabels = { idle: '未启动', running: '运行中', paused: '已暂停', stopping: '停止中', completed: '已完成', stopped: '已停止' };
  function renderModuleState(module, state) {
    const key = module[0].toUpperCase() + module.slice(1);
    const textEl = $('status' + key);
    const dotEl = $('dot' + key);
    if (textEl) textEl.textContent = moduleStateLabels[state] || state || '未启动';
    if (dotEl) dotEl.className = `mdot ${state === 'running' ? 'running' : state === 'paused' ? 'paused' : ''}`;
  }

  async function refreshResumeStats() {
    try {
      const st = await send('cmd_get_resume_collect_status');
      const stats = st?.stats || {};
      const map = { statCollected: 'collected', statSaved: 'saved', statUpdated: 'updated', statSkipped: 'skipped', statReplied: 'replied' };
      for (const [id, key] of Object.entries(map)) {
        if (stats[key] !== undefined && $(id)) $(id).textContent = stats[key];
      }
    } catch (_) { /* 采集器未启动时忽略 */ }
  }

  function formatTime(value) {
    return new Date(value).toLocaleTimeString('zh-CN', { hour12: false });
  }

  function renderStatus(status) {
    const state = status?.state || 'idle';
    $('statusText').textContent = status?.statusText || '等待启动';
    $('stageText').textContent = `当前阶段：${stageLabels[status?.stage] || status?.stage || '未启动'}`;
    $('statusDot').className = `dot ${state === 'running' ? 'running' : state === 'paused' ? 'paused' : ''}`;
    $('btnStart').disabled = state === 'running' || state === 'paused';
    $('btnResume').hidden = state !== 'paused';
    $('btnStop').disabled = state === 'idle';
    document.querySelectorAll('.module input, .settings input').forEach(input => { input.disabled = state !== 'idle'; });

    const ms = status?.moduleStates || {};
    renderModuleState('greeting', ms.greeting);
    renderModuleState('reply', ms.reply);
    renderModuleState('resume', ms.resume);

    const logs = (status?.logs || []).filter(item => item.time >= localLogsClearedAt);
    const output = $('logOutput');
    if (!logs.length) output.innerHTML = '<div class="empty">暂无运行日志</div>';
    else {
      output.innerHTML = logs.map(item => `<div class="log-line ${item.level || ''}"><span>${formatTime(item.time)}</span> ${escapeHtml(item.message)}</div>`).join('');
      output.scrollTop = output.scrollHeight;
    }
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value || '');
    return div.innerHTML;
  }

  function escapeAttr(value) {
    return escapeHtml(value)
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function refreshStatus() {
    try { renderStatus(await send('cmd_get_unified_workflow_status')); }
    catch (err) { $('statusText').textContent = `状态读取失败：${err.message}`; }
  }

  async function refreshFailures() {
    const list = $('failureList');
    try {
      const failures = await send('cmd_get_resume_failures');
      const permanent = (failures || []).filter(item => item.permanent);
      if (!permanent.length) {
        list.innerHTML = '<div class="empty">暂无永久跳过记录</div>';
        return;
      }
      list.innerHTML = permanent.map(item => `
        <div class="failure">
          <div><strong>${escapeHtml(item.name || '未命名候选人')} · ${escapeHtml(item.position || '岗位未知')}</strong>
          <small>失败阶段：${escapeHtml(item.stage || 'unknown')} · ${item.attempts || 3}/3<br>${escapeHtml(item.lastError || '')}<br>${new Date(item.updatedAt).toLocaleString('zh-CN')}</small></div>
          <button class="secondary retry-failure" data-key="${escapeAttr(item.candidateKey)}">允许重试</button>
        </div>`).join('');
      list.querySelectorAll('.retry-failure').forEach(button => button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await send('cmd_retry_resume_failure', { candidateKey: button.dataset.key });
          await refreshFailures();
        } catch (err) { alert(`恢复失败：${err.message}`); }
      }));
    } catch (err) {
      list.innerHTML = `<div class="empty">读取失败：${escapeHtml(err.message)}</div>`;
    }
  }

  $('btnStart').addEventListener('click', async () => {
    const config = getConfig();
    if (!(await confirmScope(config))) return;
    $('btnStart').disabled = true;
    $('btnStart').textContent = '启动中...';
    try {
      renderStatus(await send('cmd_start_unified_workflow', config));
    } catch (err) {
      alert(`启动失败：${err.message}`);
      await refreshStatus();
    } finally {
      $('btnStart').textContent = '一键启动';
    }
  });

  $('btnResume').addEventListener('click', async () => {
    const approved = window.confirm('已完成人工处理并确认 BOSS 页面恢复正常？系统将从中断阶段继续。');
    if (!approved) return;
    const stored = await chrome.storage.local.get(APPROVAL_KEY);
    if (stored[APPROVAL_KEY]) {
      await chrome.storage.local.set({ [APPROVAL_KEY]: { ...stored[APPROVAL_KEY], approvedAt: new Date().toISOString() } });
    }
    try { renderStatus(await send('cmd_resume_unified_workflow')); }
    catch (err) { alert(`恢复失败：${err.message}`); await refreshStatus(); }
  });

  $('btnStop').addEventListener('click', async () => {
    if (!window.confirm('确定停止打招呼、自动回复和简历采集整条流水线？')) return;
    try { renderStatus(await send('cmd_stop_unified_workflow')); }
    catch (err) { alert(`停止失败：${err.message}`); }
  });

  $('btnClearLogs').addEventListener('click', () => { localLogsClearedAt = Date.now(); refreshStatus(); });
  $('btnRefreshFailures').addEventListener('click', refreshFailures);
  document.querySelectorAll('.module input').forEach(input => input.addEventListener('change', renderModuleCards));
  document.querySelectorAll('.detail-toggle').forEach(btn => btn.addEventListener('click', () => {
    const detail = $(btn.dataset.detail);
    if (!detail) return;
    const open = detail.classList.toggle('open');
    const base = btn.dataset.detail === 'detailResume' ? '调参·统计 ' : '详情 ';
    btn.textContent = base + (open ? '▴' : '▾');
  }));

  window.addEventListener('message', event => {
    if (event.data?.type === 'STATUS_UPDATE' && event.data?.taskType === 'workflow') refreshStatus();
    if (event.data?.type === 'RUNNING_LOG' && event.data?.taskType === 'workflow') refreshStatus();
  });

  Promise.all([loadConfig(), refreshStatus(), refreshFailures(), refreshResumeStats()]);
  setInterval(refreshStatus, 2000);
  setInterval(refreshResumeStats, 3000);
  setInterval(refreshFailures, 15000);
})();
