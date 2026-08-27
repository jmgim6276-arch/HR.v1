import assert from 'node:assert/strict';
import fs from 'node:fs';

const store = {
  unifiedWorkflowApproval: {
    approvedAt: new Date().toISOString(),
    privacyVersion: '2026-07-29',
  },
  greetingAutomationApproval: { approvedAt: new Date().toISOString(), privacyVersion: '2026-07-29' },
  replyAutomationApproval: { approvedAt: new Date().toISOString(), privacyVersion: '2026-07-29' },
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
const approve = () => {
  const now = new Date().toISOString();
  store.unifiedWorkflowApproval = { approvedAt: now, privacyVersion: '2026-07-29' };
  store.greetingAutomationApproval = { approvedAt: now, privacyVersion: '2026-07-29' };
  store.replyAutomationApproval = { approvedAt: now, privacyVersion: '2026-07-29' };
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

console.log('✅ 三模块开关、固定流水线、采集优先锁、持续监听、永久跳过与人工恢复全部通过');
