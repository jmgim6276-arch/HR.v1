import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const workerSource = readFileSync(join(here, '../extension/service-worker/resume-collector.mjs'), 'utf8');
const mainSource = readFileSync(join(here, '../extension/content-script/index.js'), 'utf8');
const collectorSource = readFileSync(join(here, '../extension/content-script/resume-collector.js'), 'utf8');

let pass = 0;
let fail = 0;
const ok = (condition, label) => {
  if (condition) {
    pass++;
    console.log('  ✅', label);
  } else {
    fail++;
    console.log('  ❌', label);
  }
};

function extractFn(source, name) {
  let start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`找不到函数 ${name}`);
  if (source.slice(start - 6, start) === 'async ') start -= 6;
  let index = source.indexOf('{', start);
  let depth = 0;
  let end = index;
  for (; index < source.length; index++) {
    if (source[index] === '{') depth++;
    else if (source[index] === '}') {
      depth--;
      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }
  return source.slice(start, end);
}

console.log('▶ 消息标识');
const messageKeyFactory = new Function(`
  ${extractFn(mainSource, 'Ee')}
  ${extractFn(mainSource, 'buildReplyMessageKey')}
  return buildReplyMessageKey;
`);
const buildReplyMessageKey = messageKeyFactory();
ok(buildReplyMessageKey('candidate_1', [{ mid: 1001, from: { uid: 'candidate_1' } }]) === 'mid_1001', '优先使用 BOSS 消息 mid');
ok(buildReplyMessageKey('candidate_1', [{ from: { uid: 'candidate_1' }, __replyMessageKey: 'visible_fp_1' }]) === 'visible_fp_1', '页面扫描缺少 mid 时使用预先生成的稳定标识');
const fallbackA = buildReplyMessageKey('candidate_1', [{ from: { uid: 'candidate_1' }, body: { text: '您好' }, time: 123 }]);
const fallbackB = buildReplyMessageKey('candidate_1', [{ from: { uid: 'candidate_1' }, body: { text: '您好' }, time: 123 }]);
const nextMessage = buildReplyMessageKey('candidate_1', [{ from: { uid: 'candidate_1' }, body: { text: '您好' }, time: 456 }]);
ok(fallbackA === fallbackB && fallbackA !== nextMessage, '无 mid 时使用稳定消息指纹');

console.log('▶ 消息级幂等领取');
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
  const REPLY_IDEM_RETENTION_MS = 24 * 60 * 60 * 1000;
  let replyClaimQueue = Promise.resolve();
  ${extractFn(workerSource, 'serializeReplyClaim')}
  ${extractFn(workerSource, 'pruneReplyLocks')}
  ${extractFn(workerSource, 'claimReply')}
  ${extractFn(workerSource, 'releaseReply')}
  return { claimReply, releaseReply };
`);
const { claimReply, releaseReply } = lockFactory(chromeMock);
const concurrent = await Promise.all([
  claimReply('candidate_1', 'mid_1001'),
  claimReply('candidate_1', 'mid_1001'),
]);
ok(concurrent.filter(item => item.ok).length === 1, '同一候选人的同一条消息并发进入 → 只允许一次');
const winner = concurrent.find(item => item.ok);
ok((await claimReply('candidate_1', 'mid_1001')).ok === false, '同一条消息再次处理 → 幂等跳过');
ok((await claimReply('candidate_1', 'mid_1002')).ok === true, '同一候选人的新消息 → 允许回复');
ok((await claimReply('candidate_2', 'mid_1001')).ok === true, '不同候选人的消息互不影响');
ok((await releaseReply('candidate_1', 'mid_1001', winner.token)).ok === true, '发送完全失败 → 释放本条消息的锁');
ok((await claimReply('candidate_1', 'mid_1001')).ok === true, '释放失败发送锁后 → 本条消息允许重试');
ok((await claimReply('candidate_1', '')).ok === false, '缺少消息标识时 fail-closed');

console.log('▶ 发送职责边界');
const mainClaimAt = mainSource.indexOf('action: "cmd_claim_reply"');
const mainSendAt = mainSource.indexOf('await this._sendAndLog', mainClaimAt);
ok(mainClaimAt > 0 && mainSendAt > mainClaimAt, '自动回复在发送前领取消息锁');
ok(/data:\s*\{ uid: String\(e\), messageKey: replyMessageKey \}/.test(mainSource), '自动回复把消息标识传给锁');
ok(!collectorSource.includes('routeToReplyJudgment'), '简历采集器不再路由自动回复');
ok(!collectorSource.includes("action: 'cmd_claim_reply'"), '简历采集器不再承担岗位自动回复发送');
const followupStart = collectorSource.indexOf('if (extractionResult?.ok && runtime.config.autoSendReply');
const followupEnd = collectorSource.indexOf("return { outcome: 'collected'", followupStart);
const followupSource = collectorSource.slice(followupStart, followupEnd);
ok(followupStart > 0 && followupSource.includes('sendReplyMessages(extractionResult.talent, meta)'), '简历入库后回执保持独立');
ok(!followupSource.includes('cmd_claim_reply'), '简历入库后回执不与岗位自动回复共用锁');

console.log(`\n结果：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
