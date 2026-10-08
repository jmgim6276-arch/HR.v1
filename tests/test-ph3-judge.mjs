// Ph3 离线单测：抽取 resume-collector.mjs 里的判断/幂等函数跑场景。
// 不依赖 chrome / fetch / DOM——把这两个全局桩掉后整体 import。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, '../extension/service-worker/resume-collector.mjs');
let src = readFileSync(file, 'utf8');

let pass = 0, fail = 0;
const ok = (cond, label) => { if (cond) { pass++; console.log('  ✅', label); } else { fail++; console.log('  ❌', label); } };

// 抽 normalizePositionName + matchJobByRules 的函数体，eval 成可调用对象
function extractFn(name) {
  let start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`找不到函数 ${name}`);
  if (src.slice(start - 6, start) === 'async ') start -= 6;
  // 从 start 起数花括号配对
  let i = src.indexOf('{', start), depth = 0, end = i;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  return src.slice(start, end);
}
const factory = new Function(
  `${extractFn('normalizePositionName')}\n${extractFn('matchJobByRules')}\nreturn { normalizePositionName, matchJobByRules };`
);
const { matchJobByRules } = factory();

console.log('▶ matchJobByRules 场景');
const configs = [
  { jobName: '健身教练', bossFilters: [{ name: '年龄', values: ['20-30'] }, { name: '学历', values: ['本科'] }], replyMessages: ['您好'] },
  { jobName: '美体师', bossFilters: [], replyMessages: ['您好'], isDefault: true },
];
ok(matchJobByRules('健身教练', { age: 25, education: '本科' }, configs)?.jobName === '健身教练', '职位命中+条件符合 → 该岗位');
ok(matchJobByRules('健身教练', { age: 40, education: '本科' }, configs) === null, '年龄越界 → null');
ok(matchJobByRules('健身教练', { age: 25, education: '高中' }, configs) === null, '学历不达本科 → null');
ok(matchJobByRules('不存在的岗位', { age: 25 }, configs)?.jobName === '美体师', '无匹配 → 走默认兜底岗');
ok(matchJobByRules('健身教练', { age: null, education: null }, configs)?.jobName === '健身教练', '读不到信息条 → 不误判（放行）');
ok(matchJobByRules('健身教练', { age: 25 }, []) === null, '无岗位配置 → null');
ok(matchJobByRules('健身教练教练', { age: 25, education: '本科' }, configs)?.jobName === '健身教练', '部分名互相包含 → 命中');

// 幂等窗逻辑（内联复刻 handleJudgeUnreadReply 的判定核心）
console.log('▶ 幂等窗判定');
const WINDOW = 10 * 60 * 1000;
const now = Date.now();
const isLocked = (ts) => ts && now - ts < WINDOW;
ok(isLocked(now - 60 * 1000) === true, '1 分钟前回复过 → 幂等跳过');
ok(isLocked(now - 30 * 60 * 1000) === false, '30 分钟前回复过 → 不锁（可回积压）');
ok(!isLocked(0), '无记录 → 不锁');

console.log('▶ 跨入口幂等领取');
const lockStore = {};
const chromeMock = {
  storage: {
    local: {
      async get(key) { return { [key]: structuredClone(lockStore[key]) }; },
      async set(values) { Object.assign(lockStore, structuredClone(values)); },
    },
  },
};
const lockFactory = new Function('chrome', `
  const REPLY_IDEM_KEY = 'replyIdemLocks';
  const REPLY_IDEM_WINDOW_MS = 10 * 60 * 1000;
  let replyClaimQueue = Promise.resolve();
  ${extractFn('serializeReplyClaim')}
  ${extractFn('pruneReplyLocks')}
  ${extractFn('claimReply')}
  ${extractFn('releaseReply')}
  return { claimReply, releaseReply };
`);
const { claimReply, releaseReply } = lockFactory(chromeMock);
const concurrent = await Promise.all([claimReply('candidate_1'), claimReply('candidate_1')]);
ok(concurrent.filter(item => item.ok).length === 1, '同一候选人两个入口并发 → 只有一个取得发送资格');
const winner = concurrent.find(item => item.ok);
ok((await claimReply('candidate_1')).ok === false, '同一候选人下一处理轮次 → 幂等跳过');
ok((await releaseReply('candidate_1', winner.token)).ok === true, '发送完全失败 → 可释放本人领取的锁');
ok((await claimReply('candidate_1')).ok === true, '释放失败发送锁后 → 允许重试');

const mainSource = readFileSync(join(here, '../extension/content-script/index.js'), 'utf8');
const mainClaimAt = mainSource.indexOf('action: "cmd_claim_reply"');
const mainSendAt = mainSource.indexOf('await this._sendAndLog', mainClaimAt);
ok(mainClaimAt > 0 && mainSendAt > mainClaimAt, '主回复入口在真实发送前领取幂等锁');
const collectorSource = readFileSync(join(here, '../extension/content-script/resume-collector.js'), 'utf8');
const collectorRouteAt = collectorSource.indexOf('async function routeToReplyJudgment');
const collectorClaimAt = collectorSource.indexOf("action: 'cmd_claim_reply'", collectorRouteAt);
const collectorSendAt = collectorSource.indexOf('sendReplyMessages(', collectorClaimAt);
ok(collectorClaimAt > collectorRouteAt && collectorSendAt > collectorClaimAt, '采集器回复入口在真实发送前领取同一把锁');

console.log(`\n结果：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
