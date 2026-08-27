/* eslint-disable */
// ============================================================================
//  selectors.js —— BOSS 页面选择器单一事实源（多候选降级）
// ----------------------------------------------------------------------------
//  目的：BOSS 前端改版时，只动这一个文件，不去 index.js 里捞针。
//  加载：manifest 中排在 index.js 之前；经典 content script，顶层 const SEL
//        进入共享全局词法环境，index.js（IIFE 内）直接读取。
//  ⚠️ 本文件【不得】出现 import/export —— 否则经典脚本抛 SyntaxError，连累 index.js。
//
//  格式约定：值一律用「逗号拼接字串」，与 index.js 现有 `X.split(",").map(trim)`
//  调用方式兼容；多个候选时，优先级语义由调用方决定（split 迭代 = 候选优先；
//  直接 querySelector(整串) = 文档序优先）。迁移时保持各站点原有语义不变。
//
//  分桶：chat(聊天页) / card(推荐卡片·职位搜索·筛选·详情) / page(页面结构·散点)。
//  —— 撞名说明：chat.SEND_BUTTON 与 card.SEND_BUTTON 是两个不同选择器，勿合并。
// ============================================================================

const SEL = {
  // ── chat.* ：聊天页导航 / 输入 / 姓名搜索（逐字对应原 index.js `j` 对象）──
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

  // ── card.* ：推荐卡片 / 职位搜索 / 筛选 / 详情弹窗 / 输入框（对应原 `C` 对象）──
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

  // ── page.* ：页面结构 + 原散落字面量（本次平移，字串与原值逐字一致）──
  page: {
    MENU: '.menu-list, dl.menu-list, nav, [class*="menu"], [class*="sidebar"], [class*="side-bar"], aside',
    APP_ROOT: '#app, #root, .app, .boss-app, [class*="app"]',
    UNREAD_BADGE:
      '[class*="unread"], [class*="badge"], [class*="dot"], [class*="notice"], [class*="count"], sup, [role="status"]',

    // 候选人信息条（会话顶部）：与 card.CARD_POSITION 不同场景，刻意不合（见 N2）
    POSITION_NAME: 'span.position-name',
    CONVERSATION_NAME: "[class*='name']",

    // 通用弹窗关闭：比 card.DETAIL_CLOSE（简历弹窗专用）更宽，刻意不合（见 N3）
    POPUP_CLOSE: '.boss-popup__close, [class*="close"], [class*="Close"]',
    POPUP_CLOSE_WIDE:
      'button, a, i, svg, [role="button"], .close, [class*="close"], [class*="Close"], [class*="back"], [class*="Back"]',

    // 聊天输入框：故意的「纯 id 精确检查」，优先于 card.RECOMMEND_INPUT 兜底（见 N4）
    CHAT_GLOBAL_INPUT: '#boss-chat-global-input',

    // 薪资筛选滑块（组件库 class，最脆；增强候选留真机验证，见下方 N1）
    SLIDER: '.vue-slider',
    SLIDER_DOT: '.vue-slider-dot',

    AVATAR: 'img.image-square',
    RECOMMEND_LIST_ITEM: 'ul li:not([style*="display: none"])',
    CONFIRM_BUTTONS:
      'button, [role="button"], .btn, .confirm, .submit, [class*="confirm"], [class*="submit"]',
    CONFIRM_BUTTONS_NARROW: 'button, .btn, [role="button"], .confirm, .submit',
  },
};

// ============================================================================
//  留待真机验证的增强候选（默认不启用；验证 OK 后逐条并进对应值）：
//   [N1] SLIDER:     '.vue-slider, [class*="slider"], [role="slider"]'
//        SLIDER_DOT: '.vue-slider-dot, [class*="slider-dot"]'
//   [N6] CONVERSATION_NAME 过宽：建议收窄为会话容器作用域后启用。
//  下一批待迁移（已盘点、字串已核对，但为守「最小 diff」本次不动调用点）：
//   · 内联候选数组：聊天列表项 / 职位筛选标签 / 会话消息文本（_getPositionPlan* 等）
//   · 结构性 querySelectorAll("*"/"iframe")、优先级 || 链（1902-04 会话容器）
// ============================================================================
