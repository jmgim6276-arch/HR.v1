import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../extension/content-script/resume-collector.js', import.meta.url), 'utf8');

function extractFunction(name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `未找到 ${name}`);
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let i = braceStart; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    if (char === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${name} 函数不完整`);
}

const textsMatch = source.match(/const RESUME_REQUEST_TEXTS = (\[[\s\S]*?\n\s*\]);/);
assert.ok(textsMatch, '未找到简历请求文案列表');
const previewTextsMatch = source.match(/const RESUME_PREVIEW_TEXTS = (\[[\s\S]*?\n\s*\]);/);
assert.ok(previewTextsMatch, '未找到简历预览文案列表');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext([
  'const document = { activeElement: null };',
  'function hasUnreadMarker(row) { return row?.unread === true; }',
  'function getCandidateMeta(row) { return { key: row?.key || "" }; }',
  `const RESUME_REQUEST_TEXTS = ${textsMatch[1]};`,
  `const RESUME_PREVIEW_TEXTS = ${previewTextsMatch[1]};`,
  extractFunction('compactUiText'),
  extractFunction('matchesResumeRequestContext'),
  extractFunction('matchesResumePreviewText'),
  extractFunction('classifyResumeTargetKind'),
  extractFunction('chooseResumeAcceptTarget'),
  extractFunction('isConversationRowSelected'),
  extractFunction('conversationRowMatchesKey'),
  extractFunction('isConversationConfirmationValid'),
  'globalThis.matches = matchesResumeRequestContext;',
  'globalThis.matchesPreview = matchesResumePreviewText;',
  'globalThis.classifyKind = classifyResumeTargetKind;',
  'globalThis.chooseTarget = chooseResumeAcceptTarget;',
  'globalThis.rowSelected = isConversationRowSelected;',
  'globalThis.confirmationValid = isConversationConfirmationValid;',
].join('\n'), sandbox);

const accepted = [
  '对方想发送附件简历给您，您是否同意',
  '对方想发送加密附件简历给您，您是否同意',
  '对方希望投递一份加密简历给您，是否同意？',
  ' 对方想发送 \n 加密附件简历给您 \n 拒绝  同意 ',
  '是否同意接收该候选人的简历',
];

const rejected = [
  '我同意你的观点',
  '点击预览附件简历',
  '简历已接收',
  '候选人发送了简历',
  '同意',
];

for (const text of accepted) assert.equal(sandbox.matches(text), true, `应识别：${text}`);
for (const text of rejected) assert.equal(sandbox.matches(text), false, `不应识别：${text}`);

const acceptedPreviewTexts = [
  '点击预览附件简历',
  '点击预览加密附件简历',
  '预览附件简历',
  '预览加密附件简历',
  ' 点击 \n 预览 加密 附件 简历 ',
];
const rejectedPreviewTexts = ['点击预览聊天记录', '下载附件简历', '预览合同'];
for (const text of acceptedPreviewTexts) assert.equal(sandbox.matchesPreview(text), true, `应识别预览：${text}`);
for (const text of rejectedPreviewTexts) assert.equal(sandbox.matchesPreview(text), false, `不应识别预览：${text}`);

function fakeRow({ className = '', unread = false, ariaSelected = '', ariaCurrent = '', key = 'candidate-b' } = {}) {
  return {
    isConnected: true,
    className,
    unread,
    key,
    parentElement: null,
    getAttribute(name) {
      if (name === 'aria-selected') return ariaSelected;
      if (name === 'aria-current') return ariaCurrent;
      return '';
    },
    contains() { return false; },
  };
}

// 场景 1：上一位候选人的按钮延迟消失。会话未确认前，即使按钮存在也不操作。
const reusedButton = {};
const reusedCardTarget = { button: reusedButton, signature: '对方想发送附件简历给您', kind: 'card', bottom: 500 };
assert.equal(sandbox.chooseTarget([reusedCardTarget], false), null, '会话未确认时不得点击延迟按钮');

// 场景 2：BOSS 复用同一按钮 DOM 和同一卡片文案。会话确认后应正常使用该按钮。
assert.equal(sandbox.chooseTarget([reusedCardTarget], true), reusedCardTarget, '候选人切换后必须允许复用的按钮 DOM');
const selectedRow = fakeRow({ className: 'friend-item active', unread: false });
assert.equal(sandbox.rowSelected(selectedRow), true, '应识别已选中的候选人行');
assert.equal(sandbox.confirmationValid({ mode: 'selected', row: selectedRow, expectedKey: 'candidate-b' }), true, '已选中会话应可通过点击前二次校验');
assert.equal(sandbox.confirmationValid({ mode: 'selected', row: selectedRow, expectedKey: 'candidate-c' }), false, '候选人行被虚拟列表复用后必须使确认失效');
const readRow = fakeRow({ className: 'friend-item', unread: false });
assert.equal(sandbox.confirmationValid({ mode: 'unread-cleared', row: readRow, expectedKey: 'candidate-b' }), true, '未读标记消失应可作为会话切换信号');

// 场景 3：新候选人聊天区加载缓慢。确认信号出现前始终不操作。
const slowLoadFrames = [false, false, false, true];
let slowLoadSelection = null;
for (const confirmed of slowLoadFrames) {
  slowLoadSelection = sandbox.chooseTarget([reusedCardTarget], confirmed);
  if (slowLoadSelection) break;
  await new Promise(resolve => setTimeout(resolve, 2));
}
assert.equal(slowLoadSelection, reusedCardTarget, '慢加载模拟中必须等到会话确认后才继续');

// 场景 4：卡片按钮和底部固按钮同时存在，必须选卡片。
assert.equal(sandbox.classifyKind(true, false, 180, 150), 'card', '高卡片+拒绝按钮应识别为消息卡片');
assert.equal(sandbox.classifyKind(true, true, 56, 68), 'fixed', '固定定位的矮操作栏应识别为底部入口');
const fixedTarget = { button: {}, signature: 'B候选人底部固定栏', kind: 'fixed', bottom: 920 };
assert.equal(sandbox.chooseTarget([fixedTarget, reusedCardTarget], true), reusedCardTarget, '卡片按钮必须优先于底部固定按钮');
assert.equal(sandbox.chooseTarget([fixedTarget], true), fixedTarget, '卡片不可用时允许底部固定按钮兜底');

assert.match(source, /queryAllDeep\('button, a, \[role="button"\], \.btn'\)/, '同意按钮应支持深层 DOM');
assert.doesNotMatch(source, /previousAcceptTargets|isFreshResumeAcceptTarget/, '不得再使用 DOM 对象新旧判断候选人切换');
assert.match(source, /await waitForConversationConfirmation\(row, wasUnread, meta\.key\)/, '应按候选人 key 等待目标会话确认');
assert.match(source, /await waitForResumeAcceptTarget\(conversationConfirmation\)/, '会话确认后应等待简历目标');
assert.match(source, /isConversationConfirmationValid\(conversationConfirmation\)/, '点击前应再次校验会话状态');

console.log('✅ DOM复用、会话慢加载、当前会话、卡片优先/底部兜底、加密预览全部通过');
