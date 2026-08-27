/* eslint-disable */
// ============================================================================
//  selectors-proposal.js —— 评审稿 v1（未接入 extension/，勿打包、勿改名引用）
// ============================================================================
//
//  目标：把 index.js 里 93 处 querySelector* 收敛为「单一事实源 + 多候选降级」，
//        BOSS 改版时只动这一个文件。
//
//  ⚠️ 本文件目前【未被任何代码引用】，纯评审骨架：不影响打包、不影响真机。
//
//  ── 请重点评审的三个决策 ─────────────────────────────────────────────
//
//  【A. 格式：沿用逗号拼接字串】
//      现有 55 处调用是 `C.XXX.split(",").map(s => s.trim())`。SEL 的值若也用
//      逗号字串，集成时只需 `const j = SEL.chat; const C = SEL.card;`，
//      那 55 处【一个字符都不用改】。改数组会动到全部调用点 → 不推荐（可日后清理）。
//
//  【B. 命名空间：按区域分桶，不能拍平】
//      盘点中发现 j 和 C 撞了一个 key：`SEND_BUTTON`
//        · j.SEND_BUTTON = '.conversation-editor .submit'          （聊天页发送）
//        · C.SEND_BUTTON = '.chat-op .btn-send, .btn-send, ...'      （推荐卡片发送）
//      两者不同 → 拍平会互相覆盖。故分为 chat.* / card.* / page.* 三桶。
//
//  【C. 迁移 vs 增强 严格分离】
//      · PART 1：逐字搬自现有 index.js（零行为变化，可放心合并）。
//      · PART 2：提议的新降级候选（一律注释掉），需真机验证 DOM 后才逐条启用。
//      中文一律写成字面字符（与原 \uXXXX 转义的字符串值完全相等）。
//  ────────────────────────────────────────────────────────────────────

const SEL = {

  // ╔════════════════════════════════════════════════════════════════╗
  // ║ PART 1 · 逐字迁移（零行为变化）                                   ║
  // ╚════════════════════════════════════════════════════════════════╝

  // ---- chat.* ：逐字搬自现有 `j` 对象（index.js L285）----
  chat: {
    SIDEBAR_CHAT_LINK: 'dl.menu-chat a[href^="/web/chat/index"]',
    ALL_GROUP: '.chat-label-item[title="全部"]',
    CHAT_INPUT: '#boss-chat-editor-input',
    SEND_BUTTON: '.conversation-editor .submit', // ← 与 card.SEND_BUTTON 不同，勿合并
    CHAT_CONTAINER: '.conversation-container',
    userItem: (i) => `div[id^="_${i}-"]`,
    MESSAGE_LIST: '[role="group"]',
    NAME_SEARCH_BTN: '.chat-search-btn',
    CHAT_JOB_SEARCH: '.chat-job-search',
    NAME_SEARCH_INPUT:
      'input.search-input, input[placeholder*="搜索姓名"], input[placeholder*="搜索"], input[placeholder*="姓名"]',
    NAME_SEARCH_RESULTS: '.geek-search-list',
    nameSearchResultItem: (i) =>
      `.geek-search-list ul li:not([style*="display: none"]):nth-child(${i})`,
    FIRST_VISIBLE_RESULT:
      '.geek-search-list ul li:not([style*="display: none"]):first-child',
  },

  // ---- card.* ：逐字搬自现有 `C` 对象（index.js L2049）----
  card: {
    CARD_LIST:
      '.recommend-list, .card-list, .candidate-list, [class*="list-wrap"], [class*="candidate-list"], [class*="geek-list"], .user-list, .chat-list, .friend-list, .session-list, [class*="user-list"], [class*="conversation-list"], [class*="session-list"], [class*="chat-list"]',
    CANDIDATE_LIST_SCROLL:
      '.recommend-list, .card-list, .candidate-list, [class*="list-wrap"], [class*="candidate-list"]',
    CARD_ITEM:
      'li.card-item, .candidate-card-wrap, .card-inner.common-wrap[data-geekid]',
    CARD_BUTTON:
      '.operate-side button, .button-chat-wrap button, button.btn-greet',
    GREET_BTN_TEXT: '打招呼',
    CARD_NAME:
      '.name-text, .username, span.name, [class*="name"]:not([class*="wrap"])',
    CARD_SCHOOL: '.school-tag, .school, [class*="school"]',
    CARD_POSITION:
      '.job-title, .position, [class*="position"], [class*="job-title"], [class*="jobName"], [class*="job-name"], .text-desc, [class*="text-desc"]',
    CARD_TEXT: '.card-inner, .candidate-card-wrap, [class*="card"]',
    CARD_CLICK_TARGET:
      '.card-inner.common-wrap[data-geekid], .card-inner.common-wrap, .candidate-card-wrap',
    DETAIL_CLOSE:
      '.boss-popup__close, .boss-dialog__wrapper.dialog-lib-resume .boss-dialog__close, .boss-dialog__wrapper.dialog-lib-resume [class*="close"], .dialog-lib-resume .boss-dialog__close, .dialog-lib-resume [class*="close"], .resume-detail-wrap [class*="close"], .resume-right-side [class*="close"], .resume-detail-wrap [class*="Close"], .resume-right-side [class*="Close"], .resume-detail-wrap [class*="back"], .resume-right-side [class*="back"], .resume-detail-wrap [class*="Back"], .resume-right-side [class*="Back"], .resume-detail-wrap svg, .resume-right-side svg, .resume-detail-wrap i, .resume-right-side i, .resume-detail-wrap button, .resume-right-side button',
    RECOMMEND_INPUT:
      '#boss-chat-global-input, #boss-chat-editor-input, .conversation-global-editor [contenteditable="true"], .bosschat-chat-input, .boss-chat-editor-input, [contenteditable="true"]',
    SEND_BUTTON: '.chat-op .btn-send, .btn-send, .submit, .submit-content', // ← 与 chat.SEND_BUTTON 不同
    CARD_CLICK_AREA:
      '.card-inner.common-wrap[data-geekid], .card-inner.common-wrap, .candidate-card-wrap',
    DETAIL_ROOT:
      '.boss-dialog__wrapper.dialog-lib-resume .resume-layout-wrap, .boss-dialog__wrapper.dialog-lib-resume, .dialog-lib-resume .resume-layout-wrap, .resume-detail-wrap, .resume-right-side',
    DETAIL_OVERLAY:
      '.boss-dialog__wrapper.dialog-lib-resume .boss-dialog__overlay, .boss-dialog__overlay, .el-overlay',
    JOB_SEARCH_ROOT:
      '.job-selecter-options, .ui-dropmenu-list:has(.job-selecter-options), .recommend-filter .filter-item, .filter-bar .filter-item, .drop-wrap, .filter-dropdown-wrap, .job-filter-wrap, .position-filter-wrap, [class*="job-filter"], [class*="position-filter"], .ui-dropmenu.job-selecter-wrap, .filter-panel, .filter-wrap, .recommend-filter',
    JOB_SEARCH_LABEL:
      '.ui-dropmenu-label, .filter-label, .label, .filter-name, [class*="filter-label"], [class*="drop-label"], .dropdown-label, .selected-text, [class*="selected-text"]',
    JOB_SEARCH_INPUT:
      '.ipt.chat-job-search, .chat-job-search, input[placeholder*="职位名称"], input[placeholder*="搜索"], input[placeholder*="岗位"], input[placeholder*="职位"], input[type="search"], .search-input input, .search-box input, .filter-search input, input.search-input, .job-search-input, [class*="search-input"]',
    JOB_SEARCH_OPTIONS:
      '.job-selecter-options .job-item, .job-list > .job-item, .job-item, .option, [class*="option"], [class*="job-item"], .dropdown-item, [class*="dropdown-item"], .list-item, .job-option, .filter-option, [class*="filter-option"]',
    JOB_SEARCH_EMPTY:
      '.search-job-empty, .job-selecter-options .empty, .no-data, .no-result',
    JOB_LIST:
      '.job-list, .option-list, .dropdown-list, .item-list, .filter-list',
    FILTER_TRIGGER:
      '.recommend-filter .filter-label-wrap, .op-filter .filter-label-wrap, .filter-label',
    FILTER_ITEM: '.filter-item',
    FILTER_OPTION: '.option, .default.option',
    FILTER_PANEL: '.filter-panel, .filter-wrap, .recommend-filter',
    FILTER_ITEM_NAME: '.name, .label',
    FILTER_CONFIRM: '确定',
  },

  // ---- page.* ：新增桶 —— 收编当前散落在 index.js 里的裸字面量 ----
  //      （每条右侧注释 = 现状调用行号 + 说明）
  page: {
    // 会话区容器：现状是 3 次独立 querySelector（1902/1903/1904）找同一目标 → 合并为一串候选
    CONVERSATION: '.conversation-container, .chat-conversation, [class*="conversation"]',

    // 岗位名（会话/卡片内）：现状 2 处（584, 1899）
    //   ⚠️ 与 card.CARD_POSITION 有重叠 → 见评审笔记 N2，倾向复用而非新增
    POSITION_NAME: 'span.position-name',

    // 未读角标：现状 1 处（1069），原文已是多候选，逐字
    UNREAD_BADGE:
      '[class*="unread"], [class*="badge"], [class*="dot"], [class*="notice"], [class*="count"], sup, [role="status"]',

    // 关闭弹窗：现状 2 处（3864, 3919）
    //   ⚠️ 3864 这串几乎是 card.DETAIL_CLOSE 的子集 → 见评审笔记 N3，倾向复用
    POPUP_CLOSE: '.boss-popup__close, [class*="close"], [class*="Close"]',
    POPUP_CLOSE_WIDE:
      'button, a, i, svg, [role="button"], .close, [class*="close"], [class*="Close"], [class*="back"], [class*="Back"]',

    // 搜索清除图标：现状 2 处（590, 591），图标 href，较稳
    SEARCH_CLOSE_ICON: 'use[href*="icon-search-close"], use[href*="search-close"]',

    // 侧栏/菜单：现状 1 处（361），已是多候选，逐字
    MENU: '.menu-list, dl.menu-list, nav, [class*="menu"], [class*="sidebar"], [class*="side-bar"], aside',

    // 应用根节点：现状 1 处（3114），已是多候选，逐字
    APP_ROOT: '#app, #root, .app, .boss-app, [class*="app"]',

    // 薪资筛选滑块：现状 2 处（3528, 3536）——⚠️ 最脆，组件库 class，见评审笔记 N1
    SLIDER: '.vue-slider',
    SLIDER_DOT: '.vue-slider-dot',

    // 推荐列表可见项（结构式）：现状 1 处（495）
    RECOMMEND_LIST_ITEM: 'ul li:not([style*="display: none"])',

    // 头像：现状 2 处（524 'img.image-square'；1161 是裸 'img'，语义不同，先只收 524）
    AVATAR: 'img.image-square',

    // 可点击元素兜底（语义，稳）：现状 4 处（2828, 2888, 3308, 3478）
    CLICKABLE: 'button, a, [role="button"]',
    CONFIRM_BUTTONS:
      'button, [role="button"], .btn, .confirm, .submit, [class*="confirm"], [class*="submit"]',
    CONFIRM_BUTTONS_NARROW: 'button, .btn, [role="button"], .confirm, .submit',

    // 聊天列表项（内联数组，1090 起）
    CHAT_LIST_ITEM: '.user-list-item, .friend-item, .chat-user-item, [class*="friend-item"]',

    // 职位筛选标签（内联数组，1215 起）
    JOB_FILTER_LABEL:
      '.chat-list-filter .ui-dropmenu-label, .job-selecter-label, .ui-dropmenu-label',

    // 卡片锚点（最稳，3 处 2854/2909/4026）：保持字面量即可，收编便于统一
    GEEK_ANCHOR: '[data-geekid]',
  },

  // ╔════════════════════════════════════════════════════════════════╗
  // ║ PART 2 · 提议的增强候选（默认注释掉，真机验证后才逐条启用）         ║
  // ║   原则：优先 data-* / 固定id / role / 语义属性，纯 class 最后。      ║
  // ╚════════════════════════════════════════════════════════════════╝
  //
  //  [N1] 滑块 —— 最脆，BOSS 换组件库即死。建议加语义兜底：
  //       page.SLIDER:     '.vue-slider, [class*="slider"], [role="slider"]'
  //       page.SLIDER_DOT: '.vue-slider-dot, [class*="slider-dot"], [role="slider"] [class*="dot"]'
  //
  //  [N2] 岗位名 —— POSITION_NAME 与 card.CARD_POSITION 重叠，建议删 POSITION_NAME、
  //       584/1899 两处直接改用 card.CARD_POSITION（多候选更抗变）。
  //
  //  [N3] 关闭弹窗 —— POPUP_CLOSE 几乎是 card.DETAIL_CLOSE 子集，建议 3864 改用
  //       card.DETAIL_CLOSE；3919 的 POPUP_CLOSE_WIDE 保留（更宽，用于不同场景）。
  //
  //  [N4] 聊天输入框 5 处字面量 '#boss-chat-global-input'（4171–4199）
  //       → card.RECOMMEND_INPUT 已含该 id，建议直接复用，删裸字面量。
  //
  //  [N5] 列表选择器 '.recommend-list, .card-list, .candidate-list...'
  //       在 C 对象之外又内联重复了 ≥3 处（4555/5525/5611）→ 统一改用
  //       card.CANDIDATE_LIST_SCROLL，消除重复。
  //
  //  [N6] GENERIC_NAME '[class*="name"]'（1909）过宽，易误伤。建议加作用域后启用：
  //       '.conversation-container [class*="name"], .chat-conversation [class*="name"]'
  //       ——需真机确认不误中其它元素。
};

// ============================================================================
//  极简解析助手（供那 ~25 处散点迁移调用；现有 55 处走 split(",") 的可不动）
// ============================================================================
//  解析 'card.CARD_ITEM' → 候选数组（沿用逗号字串 → 数组）
function selCandidates(key) {
  const [ns, name] = key.split('.');
  const v = (SEL[ns] || {})[name];
  if (typeof v !== 'string') throw new Error('[SEL] 非字串选择器: ' + key);
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}
//  首个命中元素（含跨候选降级）
function qs(key, root = document) {
  for (const s of selCandidates(key)) {
    const el = root.querySelector(s);
    if (el) return el;
  }
  return null;
}
//  全部命中（按候选顺序合并、去重）
function qsa(key, root = document) {
  const seen = new Set(), out = [];
  for (const s of selCandidates(key)) {
    for (const el of root.querySelectorAll(s)) {
      if (!seen.has(el)) { seen.add(el); out.push(el); }
    }
  }
  return out;
}

// ============================================================================
//  集成步骤（评审通过后、属“最小 diff”改动，需 node --check + 全量回归 + 真机五项）：
//    1. 本文件移入 extension/content-script/selectors.js，并在 manifest 的
//       content_scripts js 数组里排在 index.js 之前（经典脚本共享全局词法环境，
//       index.js 可直接读到 SEL / qs / qsa）。
//    2. index.js：`var j = {...}` → `var j = SEL.chat;`；`C = {...}` → `C = SEL.card;`
//       （55 处调用点零改动）。
//    3. 那 ~25 处散点字面量 → 改为 qs('page.XXX') / qsa('page.XXX')。
//    4. PART 2 的增强候选，逐条真机验证后启用。
// ============================================================================
//  注意：本文件【不要】加 import/export。集成后作为经典 content script 加载，
//  顶层 const SEL / qs / qsa 会进入共享全局词法环境，index.js（排在其后）直接可读。
//  一旦出现 export，经典脚本会抛 SyntaxError，连带 index.js 一起失效。
// ============================================================================
