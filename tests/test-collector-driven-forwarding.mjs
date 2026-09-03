import assert from 'node:assert/strict';

// P0 回归（2026-09-02）：联动模式的断点在 SW 转发层——编排器传了 drivenByReply，
// 但 startCollector 构建内容脚本配置时漏转发，CS normalizeConfig 恒得 false，
// 「回复打开会话→顺手收简历」从未生效。编排器层测试 mock 了 startResumeCollector，
// 盖不住这一跳，故这里直接测真实 startCollector → 内容脚本消息。

const store = {
  profileAuth: { accessToken: 'at', refreshToken: 'rt' },
  installationId: 'dev-1',
};
const chatTab = { id: 3, url: 'https://www.zhipin.com/web/chat', active: true };
const sentToTab = [];

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
      async remove(keys) { for (const key of [].concat(keys)) delete store[key]; },
    },
  },
  tabs: {
    async query() { return [chatTab]; },
    async get(id) { return id === chatTab.id ? chatTab : null; },
    async sendMessage(id, message) {
      assert.equal(id, chatTab.id);
      sentToTab.push(structuredClone(message));
      return { ok: true, state: 'running' };
    },
  },
  runtime: { onMessage: { addListener() {} }, onConnect: { addListener() {} } },
};

// 订阅在线校验走 fetch：返回有效登录 + active 订阅
globalThis.fetch = async () => ({
  ok: true,
  json: async () => ({ subscriptions: [{ status: 'active', ends_at: '2099-01-01T00:00:00Z' }] }),
});

const { startCollector } = await import('../extension/service-worker/resume-collector.mjs');

// 编排联动路径：回复模块开 → 编排器透传 drivenByReply: true（workflow-orchestrator 两处一致）
await startCollector({
  coordinatedMode: true,
  listenDurationMinutes: 120,
  scanIntervalSeconds: 60,
  intervalSeconds: 60,
  actionDelaySeconds: 4,
  maxPerRun: 100,
  autoSendReply: false,
  routeNonResumeReply: true,
  drivenByReply: true,
});
const drivenStart = sentToTab.find(m => m.action === 'rc_start');
assert.ok(drivenStart, 'startCollector 应向内容脚本发送 rc_start');
assert.equal(drivenStart.data.drivenByReply, true, 'drivenByReply 必须透传到内容脚本配置，否则联动模式不激活');
assert.equal(drivenStart.data.routeNonResumeReply, true);
assert.equal(drivenStart.data.coordinatedMode, true);
assert.equal(drivenStart.data.maxPerRun, 100);

// 反向：回复模块关（未传 drivenByReply）→ false，采集保持独立扫描
sentToTab.length = 0;
await startCollector({ coordinatedMode: true, maxPerRun: 5 });
const soloStart = sentToTab.find(m => m.action === 'rc_start');
assert.ok(soloStart, '第二次启动也应发送 rc_start');
assert.equal(soloStart.data.drivenByReply, false, '未传 drivenByReply 时内容脚本配置应为 false（独立扫描）');

console.log('test-collector-driven-forwarding: 全部断言通过');
