import assert from 'node:assert/strict';
import fs from 'node:fs';

const store = {
  unifiedWorkflowApproval: {
    approvedAt: new Date().toISOString(),
    privacyVersion: '2026-10-08',
  },
  greetingAutomationApproval: { approvedAt: new Date().toISOString(), privacyVersion: '2026-10-08' },
  replyAutomationApproval: { approvedAt: new Date().toISOString(), privacyVersion: '2026-10-08' },
};
const runtimeListeners = [];
const alarmListeners = [];
const alarms = new Map();
let tab = { id: 7, url: 'https://www.zhipin.com/web/geek/recommend', status: 'complete', active: true };

globalThis.chrome = {
  storage: {
    local: {
      async get(keys) {
        if (typeof keys === 'string') return { [keys]: store[keys] };
        const result = {};
        for (const key of keys || []) result[key] = store[key];
        return result;
      },
      async set(values) { Object.assign(store, structuredClone(values)); },
    },
  },
  tabs: {
    async query(query) {
      if (query.active) return [tab];
      return [tab];
    },
    async update(id, patch) {
      assert.equal(id, tab.id);
      tab = { ...tab, ...patch, status: 'complete' };
      return tab;
    },
    async get(id) { return id === tab.id ? tab : null; },
    async sendMessage() { return { ok: true }; },
  },
  runtime: {
    onMessage: { addListener(listener) { runtimeListeners.push(listener); } },
  },
  alarms: {
    async create(name, info) { alarms.set(name, info); },
    async clear(name) { return alarms.delete(name); },
    onAlarm: { addListener(listener) { alarmListeners.push(listener); } },
  },
};

const calls = [];
let collectorStatus = { state: 'idle' };
const { createWorkflowOrchestrator } = await import('../extension/service-worker/workflow-orchestrator.mjs');
const orchestrator = createWorkflowOrchestrator({
  async runCommand(action) {
    calls.push(action);
    if (action === 'cmd_validate_subscription') return { valid: true };
    // 真实时序：回复引擎先广播 idle 状态上报，编排器的 await cmd_stop 还没返回
    // 就会收到。编排器必须按阶段忽略，否则把自己发起的停止误判成「意外停止」
    // 触发全局人工暂停（2026-08-28 真机回归：回打后流水线显示"需人工处理：用户已停止"）
    if (action === 'cmd_stop') {
      for (const listener of runtimeListeners) {
        listener({ action: 'status_report', data: { state: 'idle', statusText: '已停止' } });
      }
    }
    return { ok: true };
  },
  async startResumeCollector(config) {
    calls.push(['startResumeCollector', config]);
    collectorStatus = { state: 'running' };
    return { ok: true, state: 'running' };
  },
  async stopResumeCollector() {
    calls.push('stopResumeCollector');
    collectorStatus = { state: 'idle' };
    // 真实时序：采集内容脚本先广播「用户已停止」idle，再回 rc_stop 响应（同上）
    for (const listener of runtimeListeners) {
      listener({ action: 'rc_status_update', data: { state: 'idle', statusText: '用户已停止' } });
    }
    return { ok: true };
  },
  async resumeResumeCollector() {
    calls.push('resumeResumeCollector');
    collectorStatus = { state: 'running' };
    return { ok: true };
  },
  async getResumeCollectorStatus() { return collectorStatus; },
});
const h = orchestrator.handlers;
const tick = () => new Promise(resolve => setTimeout(resolve, 20));
const waitForRestart = () => new Promise(resolve => setTimeout(resolve, 900));
// ensureChatPage 在页面加载完成后固定等待 2.5s（编排器内建），消息触发的切监听必须等够
const waitForTransition = () => new Promise(resolve => setTimeout(resolve, 3500));
const approve = () => {
  const now = new Date().toISOString();
  store.unifiedWorkflowApproval = { approvedAt: now, privacyVersion: '2026-10-08' };
  store.greetingAutomationApproval = { approvedAt: now, privacyVersion: '2026-10-08' };
  store.replyAutomationApproval = { approvedAt: now, privacyVersion: '2026-10-08' };
};

// 关闭打招呼时应直接进入沟通页，并协调启动自动回复与简历采集。
approve();
calls.length = 0;
let status = await h.cmd_start_unified_workflow({
  modules: { greeting: false, reply: true, resume: true },
  listenDurationMinutes: 120,
  scanIntervalSeconds: 60,
});
assert.equal(status.stage, 'listening');
assert.equal(status.state, 'running');
assert.ok(calls.includes('cmd_start'));
const resumeStart = calls.find(item => Array.isArray(item) && item[0] === 'startResumeCollector');
assert.equal(resumeStart[1].coordinatedMode, true);
assert.equal(resumeStart[1].listenDurationMinutes, 120);
// 合并控制台：采集调参未传时保持原默认（行为零变化）
assert.equal(resumeStart[1].maxPerRun, 100);
assert.equal(resumeStart[1].intervalSeconds, 60);
assert.equal(resumeStart[1].autoSendReply, false);
// 联动模式（2026-08-31）：回复模块开 → 采集被回复驱动（drivenByReply），不独立扫列表
assert.equal('routeNonResumeReply' in resumeStart[1], false, '编排器不得让采集器回复非简历消息');
assert.equal(resumeStart[1].drivenByReply, true);

// 简历获得页面操作权时暂停回复，释放后恢复。
await h.cmd_workflow_resume_lock({ name: '测试候选人' });
await h.cmd_workflow_resume_unlock({ name: '测试候选人' });
assert.ok(calls.includes('cmd_pause'));
assert.ok(calls.includes('cmd_resume'));

// 自动回复正常结束一轮后，应在监听窗口内通过 alarm 再次拉起。
const startsBeforeRestart = calls.filter(item => item === 'cmd_start').length;
for (const listener of runtimeListeners) {
  listener({ action: 'status_report', data: { state: 'idle', statusText: '所有岗位已按顺序处理完成' } });
}
await tick();
assert.ok(alarms.has('unified-workflow-reply-restart'));
for (const listener of alarmListeners) listener({ name: 'unified-workflow-reply-restart' });
await waitForRestart();
assert.ok(calls.filter(item => item === 'cmd_start').length > startsBeforeRestart);

// 简历采集非正常退出不能静默结束，必须转成全局人工暂停。
for (const listener of runtimeListeners) {
  listener({ action: 'rc_status_update', data: { state: 'idle', statusText: '采集脚本意外停止' } });
}
await tick();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.state, 'paused');
await h.cmd_stop_unified_workflow();

// 只开启打招呼时，完成后直接结束，不启动或切换下游模块。
approve();
calls.length = 0;
tab = { ...tab, url: 'https://www.zhipin.com/web/geek/recommend' };
status = await h.cmd_start_unified_workflow({
  modules: { greeting: true, reply: false, resume: false },
});
assert.equal(status.stage, 'greeting');
assert.ok(calls.includes('cmd_start_greeting'));
for (const listener of runtimeListeners) {
  listener({ action: 'greeting_status_report', data: { state: 'idle', statusText: '所有岗位已按顺序处理完成' } });
}
await tick();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.stage, 'completed');
assert.equal(status.state, 'idle');
assert.ok(!calls.includes('cmd_start'));

// ── 循环模式（2026-08-28 拍板：打 N 个 ⇄ 监听回复，空转即回打）─────────────
const replyPassIdle = async () => {
  for (const listener of runtimeListeners) {
    listener({ action: 'status_report', data: { state: 'idle', statusText: '所有岗位已按顺序处理完成' } });
  }
  await waitForRestart();
};
const fireRestartAlarm = async () => {
  for (const listener of alarmListeners) listener({ name: 'unified-workflow-reply-restart' });
  await waitForRestart();
};
const greetingRoundDone = async (text = '所有岗位已按顺序处理完成') => {
  for (const listener of runtimeListeners) {
    listener({ action: 'greeting_status_report', data: { state: 'idle', statusText: text } });
  }
  await waitForTransition();
};

// 三开 + 每轮上限 2：打满即强停切监听；监听安全上限到点回打第二轮
approve();
calls.length = 0;
tab = { ...tab, url: 'https://www.zhipin.com/web/geek/recommend' };
status = await h.cmd_start_unified_workflow({
  modules: { greeting: true, reply: true, resume: true },
  listenDurationMinutes: 120,
  scanIntervalSeconds: 60,
  greetingCap: 2,
});
assert.equal(status.stage, 'greeting');
assert.equal(status.cycleCount, 1);
for (const listener of runtimeListeners) {
  listener({ action: 'new_greeting_record', data: { name: '候选人甲' } });
  listener({ action: 'new_greeting_record', data: { name: '候选人乙' } });
}
await tick();
assert.ok(calls.includes('cmd_stop_greeting'), '打满每轮上限应强停打招呼');
// 强停后引擎报"已停止"（不匹配完成文案），仍须按 capStopPending 切监听
await greetingRoundDone('已停止');
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.stage, 'listening');
assert.ok(calls.includes('cmd_start'));
// 监听安全上限到点 → 回打招呼第二轮（旧语义是 finish，已废弃）
for (const listener of alarmListeners) listener({ name: 'unified-workflow-deadline' });
await waitForRestart();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.stage, 'greeting');
assert.equal(status.cycleCount, 2);
assert.equal(status.state, 'running', '回打不得被停止引发的状态上报误判成人工暂停');
assert.ok(calls.filter(item => item === 'cmd_start_greeting').length >= 2);
assert.ok(calls.includes('cmd_stop'));
assert.ok(calls.includes('stopResumeCollector'));

// 第二轮 0 人（无新记录）→ 空轮 1；连续 2 个零活动回复轮 → 提前回打第三轮
await greetingRoundDone();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.stage, 'listening');
assert.equal(status.consecutiveEmptyRounds, 1);
await replyPassIdle();
assert.ok(alarms.has('unified-workflow-reply-restart'), '第 1 个空轮应只排重启闹钟');
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.stage, 'listening');
await fireRestartAlarm();
await replyPassIdle();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.stage, 'greeting');
assert.equal(status.cycleCount, 3);
assert.equal(status.state, 'running', '空转回打不得被停止引发的状态上报误判成人工暂停');

// 第三轮 0 人 → 空轮 2 → 空转回打第四轮；第四轮 0 人 → 空轮 3 → 最后一次监听
await greetingRoundDone();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.consecutiveEmptyRounds, 2);
await replyPassIdle();
await fireRestartAlarm();
await replyPassIdle();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.stage, 'greeting');
await greetingRoundDone();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.stage, 'listening');
assert.equal(status.consecutiveEmptyRounds, 3);
assert.equal(status.finalListen, true);
// 最后一次监听空转结束 → finish（不再回打）
await replyPassIdle();
await fireRestartAlarm();
await replyPassIdle();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.stage, 'completed');
assert.equal(status.state, 'idle');

// 回复活动（📤）与采集统计增长都能抑制空转回打
approve();
calls.length = 0;
status = await h.cmd_start_unified_workflow({
  modules: { greeting: true, reply: true, resume: true },
  listenDurationMinutes: 120,
  scanIntervalSeconds: 60,
  greetingCap: 0,
});
for (const listener of runtimeListeners) {
  listener({ action: 'new_greeting_record', data: { name: '候选人丙' } });
}
await tick();
await greetingRoundDone();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.stage, 'listening');
for (const listener of runtimeListeners) {
  listener({ action: 'running_log', data: { taskType: 'reply', level: 'info', message: '📤 自动回复 → 候选人丙：岗位「Java」1 条话术', time: Date.now() } });
  listener({ action: 'rc_status_update', data: { state: 'running', statusText: '运行中', stats: { collected: 1, saved: 1, updated: 0, skipped: 0, replied: 0 } } });
}
await tick();
await replyPassIdle();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.stage, 'listening', '有回复/采集活动不得回打');
assert.equal(status.consecutiveEmptyPasses, 0);
assert.ok(alarms.has('unified-workflow-reply-restart'), '有活动时应正常排重启闹钟');
await h.cmd_stop_unified_workflow();

// P1：暂停等待人工处理的时间不计入监听窗口（deadline 顺延）
approve();
calls.length = 0;
status = await h.cmd_start_unified_workflow({
  modules: { greeting: false, reply: true, resume: true },
  listenDurationMinutes: 120,
  scanIntervalSeconds: 60,
});
const deadlineBefore = status.deadlineAt;
for (const listener of runtimeListeners) {
  listener({ action: 'status_report', data: { state: 'idle', statusText: '操作频繁，请稍后再试' } });
}
await tick();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.state, 'paused');
assert.ok(status.pausedAt > 0);
await new Promise(resolve => setTimeout(resolve, 120));
approve();
status = await h.cmd_resume_unified_workflow();
assert.equal(status.state, 'running');
assert.equal(status.pausedAt, 0);
assert.ok(status.deadlineAt >= deadlineBefore + 100, `deadline 应按暂停时长顺延（实际差 ${status.deadlineAt - deadlineBefore}ms）`);
await h.cmd_stop_unified_workflow();

// 无打招呼模块：监听上限到点维持原 finish 语义
approve();
calls.length = 0;
status = await h.cmd_start_unified_workflow({
  modules: { greeting: false, reply: true, resume: true },
  listenDurationMinutes: 120,
  scanIntervalSeconds: 60,
});
for (const listener of alarmListeners) listener({ name: 'unified-workflow-deadline' });
await waitForRestart();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.stage, 'completed');


// 永久跳过记录必须支持人工恢复。
store.resumeCollectFailures = {
  candidate_1: { candidateKey: 'candidate_1', name: '候选人A', attempts: 3, permanent: true, updatedAt: Date.now() },
};
let failures = await h.cmd_get_resume_failures();
assert.equal(failures.length, 1);
await h.cmd_retry_resume_failure({ candidateKey: 'candidate_1' });
failures = await h.cmd_get_resume_failures();
assert.equal(failures.length, 0);

// 采集器实现契约：持续轮询、三次永久跳过、协调锁及人工暂停恢复。
const collectorSource = fs.readFileSync(new URL('../extension/content-script/resume-collector.js', import.meta.url), 'utf8');
assert.match(collectorSource, /scanIntervalSeconds/);
assert.match(collectorSource, /listenDurationMinutes/);
assert.match(collectorSource, /permanent:\s*attempts\s*>=\s*3/);
assert.match(collectorSource, /cmd_workflow_resume_lock/);
assert.match(collectorSource, /setStatus\('paused'/);
assert.match(collectorSource, /rc_reload_failures/);
assert.match(collectorSource, /scanNextConversationListPage/);

const collectorWorkerSource = fs.readFileSync(new URL('../extension/service-worker/resume-collector.mjs', import.meta.url), 'utf8');
assert.match(collectorWorkerSource, /attempt < 5/);
assert.match(collectorWorkerSource, /stableSnapshots >= 2/);
assert.doesNotMatch(collectorWorkerSource, /bestCaptured\.length >= 160/);

// 合并控制台：一键运行采集调参（上限/间隔/等待/自动回发）透传到采集器
await h.cmd_stop_unified_workflow();
await tick();
approve();
calls.length = 0;
status = await h.cmd_start_unified_workflow({
  modules: { greeting: false, reply: true, resume: true },
  listenDurationMinutes: 60,
  scanIntervalSeconds: 45,
  maxPerRun: 7,
  intervalSeconds: 90,
  actionDelaySeconds: 6,
  autoSendReply: true,
});
const resumeTuned = calls.find(item => Array.isArray(item) && item[0] === 'startResumeCollector');
assert.equal(resumeTuned[1].maxPerRun, 7);
assert.equal(resumeTuned[1].intervalSeconds, 90);
assert.equal(resumeTuned[1].actionDelaySeconds, 6);
assert.equal(resumeTuned[1].autoSendReply, true);
await h.cmd_stop_unified_workflow();

// 联动模式反向：回复模块关 → 采集保持独立扫描（drivenByReply=false）
await tick();
approve();
calls.length = 0;
status = await h.cmd_start_unified_workflow({
  modules: { greeting: false, reply: false, resume: true },
  listenDurationMinutes: 60,
  scanIntervalSeconds: 45,
});
const resumeSolo = calls.find(item => Array.isArray(item) && item[0] === 'startResumeCollector');
assert.equal(resumeSolo[1].drivenByReply, false);
assert.equal('routeNonResumeReply' in resumeSolo[1], false, '单独采集也不得回复非简历消息');
await h.cmd_stop_unified_workflow();

// ①无可用岗位属于正常空结果；②③开启时必须继续进入沟通监听，而不是人工暂停。
await tick();
approve();
calls.length = 0;
tab = { ...tab, url: 'https://www.zhipin.com/web/geek/recommend' };
status = await h.cmd_start_unified_workflow({
  modules: { greeting: true, reply: true, resume: true },
  listenDurationMinutes: 30,
  scanIntervalSeconds: 60,
});
for (const listener of runtimeListeners) {
  listener({ action: 'greeting_status_report', data: { state: 'idle', statusText: '无可用岗位配置' } });
}
await waitForTransition();
status = await h.cmd_get_unified_workflow_status();
assert.equal(status.state, 'running');
assert.equal(status.stage, 'listening');
assert.ok(calls.includes('cmd_start'), '①无岗位时仍应启动②自动回复');
assert.ok(calls.some(item => Array.isArray(item) && item[0] === 'startResumeCollector'), '①无岗位时仍应启动③简历采集');

// 子模块的真实判断与跳过原因必须进入统一运行日志，卡住时可直接定位。
for (const listener of runtimeListeners) {
  listener({ action: 'running_log', data: { taskType: 'reply', level: 'info', message: '⏭️ 跳过候选人丁：近期已自动回复，避免重复发送' } });
  listener({ action: 'rc_log', data: { level: 'warn', message: '候选人戊：未找到简历接收按钮，准备重试' } });
}
await tick();
status = await h.cmd_get_unified_workflow_status();
assert.ok(status.logs.some(item => item.message.includes('② 自动回复：⏭️ 跳过候选人丁')));
assert.ok(status.logs.some(item => item.message.includes('③ 简历采集：候选人戊')));
await h.cmd_stop_unified_workflow();

console.log('✅ 三模块开关、空岗位续跑、循环编排、跨模块诊断日志、采集优先锁、暂停顺延、永久跳过与人工恢复、采集联动开关全部通过');
