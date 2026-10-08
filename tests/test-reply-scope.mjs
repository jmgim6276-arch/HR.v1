import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// 岗位范围三态链（2026-09-02 拍板）：岗位列表开关 = 打招呼+自动回复总开关。
// 直测 service-worker/reply-scope.mjs 的 resolveReplyScope —— sw.js 两处启动检查
// （手动 :8975 / 定时 :10150）共用此函数；index.js 与 sidepanel 是同规则内联副本。

const { resolveReplyScope } = await import('../extension/service-worker/reply-scope.mjs');

// ① 客户场景：6 个岗位开 2 关 4，rpc 为空 → 白名单 = 开的 2 个（升级即生效，无需迁移）
{
  const jobs = [
    { id: 'j1', name: 'OPC创业管家（北京）', enabled: false },
    { id: 'j2', name: '财务经理（需具备乙方经验）', enabled: false },
    { id: 'j3', name: '暑期实习生（地推方向）', enabled: false },
    { id: 'j4', name: 'OPC创业管家', enabled: false },
    { id: 'j5', name: '财税顾问', enabled: true },
    { id: 'j6', name: '社群运营主管', enabled: true },
  ];
  const scope = resolveReplyScope(jobs, []);
  assert.equal(scope.mode, 'whitelist');
  assert.deepEqual(scope.entries.map(e => e.name), ['财税顾问', '社群运营主管']);
  assert.ok(scope.entries.every(e => e.enabled === true), '映射条目必须恒 enabled');
}

// ② jobConfigs 全关 → none 待机（灭"全关=全回"悖论：绝不回落全岗位）
{
  const scope = resolveReplyScope(
    [{ id: 'j1', name: '财税顾问', enabled: false }],
    [{ name: '财税顾问', enabled: true }] // rpc 即使有遗留启用条目，jobConfigs 在就以它为准
  );
  assert.equal(scope.mode, 'none');
  assert.deepEqual(scope.entries, []);
}

// ③ 同名 rpc 设置合并：autoReplyLimit 借过来，且名字归一化（NFKC/空白/大小写）后仍命中
{
  const scope = resolveReplyScope(
    [{ id: 'j1', name: '财税顾问', enabled: true }],
    [{ name: ' 财税顾问 ', enabled: false, autoReplyLimit: 9, keywordReply: false }]
  );
  assert.equal(scope.mode, 'whitelist');
  assert.equal(scope.entries[0].autoReplyLimit, 9, '同名 rpc 的 autoReplyLimit 必须并入');
  assert.equal(scope.entries[0].keywordReply, false, '其余设置字段原样并入');
  assert.equal(scope.entries[0].enabled, true, 'enabled 以岗位开关为准，覆盖 rpc 旧值');
}

// ④ 无 name 的岗位条目被过滤；enabled 缺省（undefined）视为开
{
  const scope = resolveReplyScope(
    [{ id: 'j1' }, { id: 'j2', name: '财税顾问' }],
    []
  );
  assert.equal(scope.mode, 'whitelist');
  assert.deepEqual(scope.entries.map(e => e.name), ['财税顾问']);
}

// ⑤ 遗留回退：jobConfigs 空 & rpc 有启用 → 旧白名单（1.5.0 前回复配置页老用户）
{
  const legacy = [{ name: '旧岗位', enabled: true, autoReplyLimit: 3 }];
  const scope = resolveReplyScope([], legacy);
  assert.equal(scope.mode, 'whitelist');
  assert.deepEqual(scope.entries, legacy);
}

// ⑥ 全岗位兜底：两者皆空 / jobConfigs 空且 rpc 全关 → all（新装与旧"全关"行为不变）
{
  assert.equal(resolveReplyScope([], []).mode, 'all');
  assert.equal(resolveReplyScope(undefined, null).mode, 'all');
  assert.equal(resolveReplyScope([], [{ name: 'x', enabled: false }]).mode, 'all');
}

// ⑦ 旧“关键词回复/AI 回复”开关只保留存量字段兼容，不再显示或参与启动判断。
{
  const configHtml = readFileSync(new URL('../extension/sidepanel/screens/greeting-config.html', import.meta.url), 'utf8');
  for (const id of ['replyKeywordReply', 'replyAiReply']) {
    const inputAt = configHtml.indexOf(`id="${id}"`);
    const hiddenLabelAt = configHtml.lastIndexOf('<label hidden', inputAt);
    assert.ok(inputAt > 0 && hiddenLabelAt > 0 && inputAt - hiddenLabelAt < 300, `${id} 应在活跃配置页隐藏`);
  }
  const workerSource = readFileSync(new URL('../extension/service-worker/sw.js', import.meta.url), 'utf8');
  const runningSource = readFileSync(new URL('../extension/sidepanel/screens/js/reply-running.js', import.meta.url), 'utf8');
  assert.doesNotMatch(workerSource, /keywordReply|aiReply/, '手动与定时启动不得再读取旧开关');
  assert.doesNotMatch(runningSource, /keywordReply|aiReply/, '旧运行页不得再用旧开关拦截启动');
}

console.log('test-reply-scope: 全部断言通过');
