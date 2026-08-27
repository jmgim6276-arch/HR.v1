/**
 * 沟通页未读简历采集器。
 *
 * 设计边界：
 * - 仅在用户从侧栏手动启动后运行；
 * - 只处理当前可见的未读会话，串行执行；
 * - 不调用未公开列表接口、不并发点击、不处理验证码；
 * - 达到单轮上限、没有未读、页面异常或连续失败时自动停止。
 */
(function () {
  'use strict';

  if (window.__BOSS_RESUME_COLLECTOR__) return;
  window.__BOSS_RESUME_COLLECTOR__ = true;

  const ACTION = {
    START: 'rc_start',
    RESUME: 'rc_resume',
    STOP: 'rc_stop',
    GET_STATUS: 'rc_get_status',
    RELOAD_FAILURES: 'rc_reload_failures',
    LOG: 'rc_log',
    STATUS: 'rc_status_update',
    EXTRACT: 'rc_extract_resume',
  };

  const RESUME_REQUEST_TEXTS = [
    '对方想发送附件简历给您',
    '对方想发送加密附件简历给您',
    '是否同意接收简历',
    '发送附件简历',
    '发送加密附件简历',
    '发送简历给您',
    '接收简历',
  ];
  const RESUME_PREVIEW_TEXT = '点击预览附件简历';
  const RESUME_PREVIEW_TEXTS = [
    '点击预览附件简历',
    '点击预览加密附件简历',
    '预览附件简历',
    '预览加密附件简历',
  ];
  const RISK_TEXTS = ['安全验证', '操作频繁', '访问过于频繁', '账号异常', '请完成验证'];
  const FAILURE_STORAGE_KEY = 'resumeCollectFailures';
  const GLOBAL_PAUSE_PATTERN = /安全验证|操作频繁|访问过于频繁|账号异常|请完成验证|登录|订阅|页面已离开|无法确认预览窗口|内容脚本|Extension context/i;

  const runtime = {
    state: 'idle',
    statusText: '等待启动',
    config: null,
    stats: { collected: 0, saved: 0, updated: 0, skipped: 0, replied: 0 },
    processedKeys: new Set(),
    stopRequested: false,
    consecutiveErrors: 0,
    extractionSessionId: '',
    deadlineAt: 0,
    currentStage: '',
    currentMeta: null,
    failureRecords: {},
    pausedAt: 0,
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    let current = el;
    const visited = new Set();
    while (current) {
      if (visited.has(current)) break;
      visited.add(current);
      const rect = current.getBoundingClientRect();
      const view = current.ownerDocument?.defaultView || window;
      const style = view.getComputedStyle(current);
      if (rect.width <= 0 || rect.height <= 0 || style.display === 'none' ||
          style.visibility === 'hidden' || Number(style.opacity || 1) <= 0) return false;
      if (current.parentElement) {
        current = current.parentElement;
        continue;
      }
      const queryRoot = current.getRootNode?.();
      if (queryRoot?.host) {
        current = queryRoot.host;
        continue;
      }
      try { current = view.frameElement; } catch (_) { current = null; }
    }
    return true;
  }

  function collectQueryRoots(root, roots = new Set()) {
    if (!root || roots.has(root)) return roots;
    roots.add(root);
    let elements = [];
    try { elements = root.querySelectorAll('*'); } catch (_) { return roots; }
    for (const el of elements) {
      if (el.shadowRoot) collectQueryRoots(el.shadowRoot, roots);
      if (el.tagName !== 'IFRAME') continue;
      try {
        if (el.contentDocument?.body) collectQueryRoots(el.contentDocument, roots);
      } catch (_) {
        // 跨域附件 iframe 由 all_frames 探针读取，这里只负责识别外层。
      }
    }
    return roots;
  }

  function getAllQueryRoots() {
    return Array.from(collectQueryRoots(document));
  }

  function queryAllDeep(selector, roots = getAllQueryRoots()) {
    const found = [];
    const seen = new Set();
    for (const root of roots) {
      let elements = [];
      try { elements = root.querySelectorAll(selector); } catch (_) { continue; }
      for (const el of elements) {
        if (!seen.has(el)) {
          seen.add(el);
          found.push(el);
        }
      }
    }
    return found;
  }

  function normalizeConfig(input) {
    const maxPerRun = Math.min(200, Math.max(1, Number(input?.maxPerRun) || 5));
    const intervalSeconds = Math.min(300, Math.max(60, Number(input?.intervalSeconds) || 60));
    const scanIntervalSeconds = Math.min(300, Math.max(15, Number(input?.scanIntervalSeconds) || 60));
    const listenDurationMinutes = Math.min(240, Math.max(1, Number(input?.listenDurationMinutes) || 120));
    const actionDelaySeconds = Math.min(15, Math.max(4, Number(input?.actionDelaySeconds) || 4));
    const coordinatedMode = input?.coordinatedMode === true;
    const autoSendReply = input?.autoSendReply === true;
    const replyMessages = (Array.isArray(input?.replyMessages) ? input.replyMessages : [])
      .map(item => String(item || '').trim().slice(0, 1000))
      .filter(Boolean)
      .slice(0, 5);
    return {
      maxPerRun,
      intervalSeconds,
      scanIntervalSeconds,
      listenDurationMinutes,
      actionDelaySeconds,
      coordinatedMode,
      autoSendReply,
      replyMessages,
      routeNonResumeReply: input?.routeNonResumeReply === true,
    };
  }

  function conversationFingerprint(meta) {
    return `${meta.key}|${String(meta.rowText || '').slice(-140)}`;
  }

  function setStage(stage, meta = runtime.currentMeta) {
    runtime.currentStage = stage;
    runtime.currentMeta = meta || null;
  }

  async function loadFailureRecords() {
    const stored = await chrome.storage.local.get(FAILURE_STORAGE_KEY);
    runtime.failureRecords = stored[FAILURE_STORAGE_KEY] || {};
  }

  async function persistFailureRecords() {
    await chrome.storage.local.set({ [FAILURE_STORAGE_KEY]: runtime.failureRecords });
  }

  function isPermanentlySkipped(meta) {
    return runtime.failureRecords[meta.key]?.permanent === true;
  }

  async function clearTransientFailure(meta) {
    const record = runtime.failureRecords[meta.key];
    if (!record || record.permanent) return;
    delete runtime.failureRecords[meta.key];
    await persistFailureRecords();
  }

  async function recordCandidateFailure(meta, error) {
    const previous = runtime.failureRecords[meta.key] || {};
    const attempts = Math.min(3, Math.max(0, Number(previous.attempts) || 0) + 1);
    const record = {
      candidateKey: meta.key,
      candidateId: meta.candidateId || '',
      name: meta.name || '未命名候选人',
      position: meta.position || '',
      attempts,
      stage: runtime.currentStage || 'unknown',
      lastError: String(error?.message || error || '未知错误').slice(0, 1000),
      updatedAt: Date.now(),
      permanent: attempts >= 3,
    };
    runtime.failureRecords[meta.key] = record;
    await persistFailureRecords();
    return record;
  }

  async function setCoordinationLock(locked, meta) {
    if (!runtime.config?.coordinatedMode) return;
    await sendRuntime({
      action: locked ? 'cmd_workflow_resume_lock' : 'cmd_workflow_resume_unlock',
      data: { candidateKey: meta?.key || '', name: meta?.name || '' },
    });
  }

  function snapshotStatus() {
    return {
      state: runtime.state,
      statusText: runtime.statusText,
      stats: { ...runtime.stats },
      config: runtime.config ? { ...runtime.config } : null,
    };
  }

  async function sendRuntime(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (err) {
      if (!String(err?.message || '').includes('Extension context invalidated')) {
        console.warn('[ResumeCollector] 消息发送失败:', err?.message || err);
      }
      return null;
    }
  }

  function log(message, level = 'info') {
    console.log('[ResumeCollector]', message);
    sendRuntime({ action: ACTION.LOG, data: { message, level, time: Date.now() } });
  }

  function setStatus(state, statusText) {
    runtime.state = state;
    runtime.statusText = statusText;
    sendRuntime({ action: ACTION.STATUS, data: snapshotStatus() });
  }

  function looksRed(color) {
    const m = String(color || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return false;
    const [, r, g, b] = m.map(Number);
    return r >= 180 && g <= 130 && b <= 130 && r > g * 1.35;
  }

  function hasUnreadMarker(row) {
    const markerSelector = [
      '[class*="unread"]', '[class*="badge"]', '[class*="dot"]',
      '[class*="notice"]', '[class*="count"]', 'sup', '[role="status"]',
    ].join(',');
    const markers = row.querySelectorAll(markerSelector);
    for (const marker of markers) {
      if (!isVisible(marker)) continue;
      const className = String(marker.className || '').toLowerCase();
      if (className.includes('unread')) return true;
      const rect = marker.getBoundingClientRect();
      if (rect.width > 38 || rect.height > 38) continue;
      const style = window.getComputedStyle(marker);
      const text = (marker.textContent || '').trim();
      const smallBadgeText = text === '' || /^\d{1,3}$/.test(text);
      if (smallBadgeText && (looksRed(style.backgroundColor) || looksRed(style.color))) return true;
    }
    return false;
  }

  function getConversationRows() {
    const selectors = [
      'div[id^="_"]',
      '.user-list-item',
      '.friend-item',
      '.chat-user-item',
      '[class*="friend-item"]',
    ];
    const seen = new Set();
    const rows = [];
    for (const selector of selectors) {
      for (const el of document.querySelectorAll(selector)) {
        if (seen.has(el) || !isVisible(el)) continue;
        const rect = el.getBoundingClientRect();
        if (rect.height < 36 || rect.height > 180 || rect.width < 160) continue;
        const id = el.id || '';
        const likelyConversation = /^_\d+-/.test(id) ||
          /(?:friend|user|geek|chat).*(?:item|card)|(?:item|card).*(?:friend|user|geek|chat)/i.test(String(el.className || ''));
        if (!likelyConversation || !hasUnreadMarker(el)) continue;
        seen.add(el);
        rows.push(el);
      }
    }
    return rows.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  }

  function findConversationScrollContainer() {
    const selectors = [
      '.user-list', '.friend-list', '.chat-list', '.chat-user-list',
      '[class*="user-list"]', '[class*="friend-list"]', '[class*="chat-list"]',
    ];
    const candidates = [];
    for (const selector of selectors) {
      for (const el of document.querySelectorAll(selector)) {
        if (!isVisible(el) || el.scrollHeight <= el.clientHeight + 40) continue;
        const rect = el.getBoundingClientRect();
        if (rect.height < 180 || rect.width < 160 || rect.width > 650 || rect.left > window.innerWidth * 0.6) continue;
        candidates.push(el);
      }
    }
    return candidates.sort((a, b) => b.clientHeight - a.clientHeight)[0] || null;
  }

  async function scanNextConversationListPage() {
    const container = findConversationScrollContainer();
    if (!container) return false;
    const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
    if (container.scrollTop < maxTop - 8) {
      const before = container.scrollTop;
      container.scrollTop = Math.min(maxTop, before + Math.max(160, Math.floor(container.clientHeight * 0.75)));
      container.dispatchEvent(new Event('scroll', { bubbles: true }));
      await sleep(1000);
      return container.scrollTop > before + 2;
    }
    if (container.scrollTop > 2) {
      container.scrollTop = 0;
      container.dispatchEvent(new Event('scroll', { bubbles: true }));
      await sleep(700);
    }
    return false;
  }

  function firstUsefulText(root, selectors) {
    for (const selector of selectors) {
      for (const el of root.querySelectorAll(selector)) {
        if (!isVisible(el)) continue;
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (text && text.length <= 50 && !/^\d{1,2}:\d{2}$/.test(text)) return text;
      }
    }
    return '';
  }

  function getCandidateMeta(row) {
    const id = row.id || row.getAttribute('data-id') || '';
    const uidMatch = id.match(/^_(\d+)-/) || String(row.dataset?.uid || '').match(/(\d+)/);
    const name = firstUsefulText(row, [
      '[class*="name"]', '.title', '[class*="title"]', 'strong', 'h4', 'h3',
    ]);
    const position = firstUsefulText(row, [
      '[class*="position"]', '[class*="job"]', '[class*="sub-title"]', '[class*="subtitle"]',
    ]);
    const text = (row.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240);
    return {
      candidateId: uidMatch ? uidMatch[1] : id,
      name,
      position,
      rowText: text,
      key: uidMatch ? uidMatch[1] : (id || `${name}|${position}|${text.slice(0, 80)}`),
    };
  }

  function pageHasRiskPrompt() {
    const text = (document.body?.innerText || '').slice(0, 30000);
    return RISK_TEXTS.find(token => text.includes(token)) || '';
  }

  function compactUiText(text) {
    return String(text || '').replace(/[\s\u200B-\u200D\uFEFF]+/g, '');
  }

  /**
   * 兼容 BOSS 对附件简历提示文案的小范围变化。
   * 为避免误点普通聊天里的“同意”，放宽匹配时仍必须同时出现：
   * 1. 简历；2. 发送/投递/提供/接收；3. 同意/拒绝/是否。
   */
  function matchesResumeRequestContext(text) {
    const compact = compactUiText(text);
    if (!compact || compact.length > 1200 || !compact.includes('简历')) return false;
    if (RESUME_REQUEST_TEXTS.some(token => compact.includes(compactUiText(token)))) return true;
    const hasTransferAction = /(?:发送|投递|提供|接收)/.test(compact);
    const hasConsentAction = /(?:是否|同意|拒绝)/.test(compact);
    return hasTransferAction && hasConsentAction;
  }

  function matchesResumePreviewText(text) {
    const compact = compactUiText(text);
    if (RESUME_PREVIEW_TEXTS.some(token => compact === compactUiText(token))) return true;
    return /^(?:点击)?预览(?:加密)?(?:附件)?简历$/.test(compact);
  }

  function findActionButtonInContext(context, expectedText) {
    if (!context?.querySelectorAll) return null;
    const buttons = context.querySelectorAll('button, a, [role="button"], .btn');
    for (const button of buttons) {
      if (isVisible(button) && compactUiText(button.textContent) === expectedText) return button;
    }
    return null;
  }

  function isFixedResumeActionBar(context, button) {
    let node = context;
    for (let depth = 0; node && depth < 6; depth++, node = node.parentElement) {
      try {
        const view = node.ownerDocument?.defaultView || window;
        const position = view.getComputedStyle(node).position;
        if (position === 'fixed' || position === 'sticky') return true;
      } catch (_) {}
    }
    try {
      const contextRect = context.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const view = context.ownerDocument?.defaultView || window;
      return contextRect.height <= 100 && buttonRect.width <= 100 &&
        contextRect.bottom >= view.innerHeight - 160;
    } catch (_) {
      return false;
    }
  }

  function classifyResumeTargetKind(hasRejectButton, fixedBar, contextHeight, buttonWidth) {
    const cardShape = hasRejectButton && !fixedBar && (contextHeight >= 90 || buttonWidth >= 100);
    return cardShape ? 'card' : (fixedBar ? 'fixed' : 'fallback');
  }

  function classifyResumeAcceptTarget(context, button) {
    const hasRejectButton = Boolean(findActionButtonInContext(context, '拒绝'));
    let contextHeight = 0;
    let buttonWidth = 0;
    let bottom = 0;
    try {
      const contextRect = context.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      contextHeight = contextRect.height;
      buttonWidth = buttonRect.width;
      bottom = buttonRect.bottom;
    } catch (_) {}
    const fixedBar = isFixedResumeActionBar(context, button);
    return {
      button,
      context,
      kind: classifyResumeTargetKind(hasRejectButton, fixedBar, contextHeight, buttonWidth),
      signature: compactUiText(context.textContent).slice(0, 1200),
      bottom,
    };
  }

  function chooseResumeAcceptTarget(targets, conversationConfirmed = true) {
    if (!conversationConfirmed) return null;
    const kindRank = { card: 3, fallback: 2, fixed: 1 };
    return targets
      .sort((a, b) =>
        (kindRank[b.kind] || 0) - (kindRank[a.kind] || 0) || b.bottom - a.bottom
      )[0] || null;
  }

  function findResumeAcceptTargets() {
    const targets = [];
    const clickables = queryAllDeep('button, a, [role="button"], .btn');
    for (const button of clickables) {
      if (!isVisible(button) || compactUiText(button.textContent) !== '同意') continue;
      let node = button;
      let context = null;
      for (let depth = 0; node && depth < 9; depth++, node = node.parentElement) {
        const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
        if (matchesResumeRequestContext(text)) {
          context = node;
          break;
        }
      }
      if (context) targets.push(classifyResumeAcceptTarget(context, button));
    }
    return targets;
  }

  function isConversationRowSelected(row) {
    if (!row?.isConnected) return false;
    let node = row;
    for (let depth = 0; node && depth < 2; depth++, node = node.parentElement) {
      if (node.getAttribute?.('aria-selected') === 'true' || node.getAttribute?.('aria-current') === 'true') return true;
      const className = String(node.className || '').toLowerCase();
      if (/(?:^|[\s_-])(?:active|selected|current)(?:$|[\s_-])/.test(className)) return true;
    }
    return false;
  }

  function conversationRowMatchesKey(row, expectedKey) {
    if (!row?.isConnected || !expectedKey) return false;
    return getCandidateMeta(row).key === expectedKey;
  }

  async function waitForConversationConfirmation(row, wasUnread, expectedKey, timeoutMs = 8000) {
    const startedAt = Date.now();
    while (!runtime.stopRequested && Date.now() - startedAt < timeoutMs) {
      if (!conversationRowMatchesKey(row, expectedKey)) return null;
      if (isConversationRowSelected(row)) return { mode: 'selected', row, expectedKey };
      if (wasUnread && !hasUnreadMarker(row)) return { mode: 'unread-cleared', row, expectedKey };
      try {
        if (row.contains(document.activeElement)) return { mode: 'focused', row, expectedKey };
      } catch (_) {}
      await sleep(250);
    }
    return null;
  }

  function isConversationConfirmationValid(confirmation) {
    const row = confirmation?.row;
    if (!conversationRowMatchesKey(row, confirmation?.expectedKey)) return false;
    if (confirmation.mode === 'selected') return isConversationRowSelected(row);
    if (confirmation.mode === 'unread-cleared') return !hasUnreadMarker(row);
    if (confirmation.mode === 'focused') {
      try { return row.contains(document.activeElement) || isConversationRowSelected(row); } catch (_) { return false; }
    }
    return false;
  }

  async function waitForResumeAcceptTarget(confirmation, timeoutMs = 8000) {
    const startedAt = Date.now();
    while (!runtime.stopRequested && Date.now() - startedAt < timeoutMs) {
      const risk = pageHasRiskPrompt();
      if (risk) throw new Error(`检测到“${risk}”，任务已停止，请人工确认页面状态`);
      const target = chooseResumeAcceptTarget(
        findResumeAcceptTargets(),
        isConversationConfirmationValid(confirmation),
      );
      if (target) return target;
      await sleep(400);
    }
    return null;
  }

  function findResumePreviewButton() {
    const candidates = [];
    const clickables = queryAllDeep(
      'button, a, [role="button"], [class*="btn"], [class*="button"]'
    );
    for (const button of clickables) {
      if (!isVisible(button)) continue;
      if (!matchesResumePreviewText(button.textContent)) continue;
      candidates.push(button);
    }
    candidates.sort((a, b) => a.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom);
    return candidates[candidates.length - 1] || null;
  }

  function countResumeSections(text) {
    const sections = ['个人优势', '工作经历', '教育经历', '项目经历', '求职目标', '求职意向', '核心优势', '专业技能'];
    return sections.filter(item => text.includes(item)).length;
  }

  function elementHasResumeSignature(el, allowGenericViewer = false) {
    if (!isVisible(el)) return false;
    const rect = el.getBoundingClientRect();
    const view = el.ownerDocument?.defaultView || window;
    const viewportArea = Math.max(1, view.innerWidth * view.innerHeight);
    const largeEnough = rect.width >= 320 && rect.height >= 260 &&
      rect.width * rect.height >= viewportArea * 0.12;
    const tag = el.tagName;
    const attrs = `${el.className || ''} ${el.id || ''} ${el.getAttribute?.('src') || ''}`.toLowerCase();
    const explicitResume = /(?:c-resume|resume-detail|resume-page|resume-content|geek-resume)/i.test(attrs);
    if (explicitResume && (largeEnough ||
        (['IFRAME', 'OBJECT', 'EMBED', 'CANVAS'].includes(tag) && rect.width >= 300 && rect.height >= 220))) return true;
    let hasModalContext = Boolean(el.closest?.(
      '.boss-popup, .boss-popup__wrapper, .boss-dialog__wrapper, .dialog-lib-resume, [role="dialog"], [class*="resume"]'
    ));
    try {
      let frame = el.ownerDocument?.defaultView?.frameElement;
      while (frame && !hasModalContext) {
        hasModalContext = Boolean(frame.closest?.(
          '.boss-popup, .boss-popup__wrapper, .boss-dialog__wrapper, .dialog-lib-resume, [role="dialog"], [class*="resume"]'
        ));
        frame = frame.ownerDocument?.defaultView?.frameElement;
      }
    } catch (_) {}
    if (tag === 'CANVAS' || tag === 'IFRAME' || tag === 'OBJECT' || tag === 'EMBED') {
      if (/resume|attachment|preview|\.pdf(?:$|[?#])/i.test(attrs)) return true;
      return largeEnough && hasModalContext;
    }
    let hasViewerChild = false;
    try { hasViewerChild = Boolean(el.querySelector('iframe, object, embed, canvas')); } catch (_) {}
    const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 5000);
    const hasResumeText = countResumeSections(text) >= 1 ||
      (/(?:电话|手机|邮箱)/.test(text) && /(?:岁|工作经验|期望薪资)/.test(text));
    return largeEnough && (hasResumeText || (allowGenericViewer && hasViewerChild && hasModalContext));
  }

  function findResumeRoot(options = {}) {
    const allowGenericViewer = options.allowGenericViewer === true;
    const baseline = options.baseline || null;
    const roots = getAllQueryRoots();
    const selectors = [
      'iframe[src*="c-resume"], iframe[src*="resume"], iframe[src*="preview"], iframe[src*="attachment"]',
      '.boss-dialog__wrapper.dialog-lib-resume, .dialog-lib-resume',
      '.resume-detail-wrap, .resume-right-side, .resume-detail-page, .resume-container, .geek-resume-wrap',
      '.boss-popup .resume-layout-wrap, .boss-popup__wrapper, .boss-popup',
      '[role="dialog"] iframe, [role="dialog"] object, [role="dialog"] embed, [role="dialog"] canvas',
      '[class*="resume"] canvas, iframe, object, embed, canvas',
    ];
    for (const selector of selectors) {
      const candidates = queryAllDeep(selector, roots)
        .filter(el => (!baseline || !baseline.has(el)) && elementHasResumeSignature(el, allowGenericViewer))
        .sort((a, b) => {
          const ar = a.getBoundingClientRect();
          const br = b.getBoundingClientRect();
          return (br.width * br.height) - (ar.width * ar.height);
        });
      if (candidates[0]) return candidates[0];
    }
    return null;
  }

  function snapshotVisibleViewerElements() {
    const roots = getAllQueryRoots();
    const selector = [
      '.boss-popup__wrapper', '.boss-popup', '.boss-dialog__wrapper', '[role="dialog"]',
      'iframe', 'object', 'embed', 'canvas', '.resume-detail-wrap', '.resume-detail-page',
    ].join(',');
    return new Set(queryAllDeep(selector, roots).filter(isVisible));
  }

  async function waitForResumeRoot(timeoutMs = 16000, options = {}) {
    const startedAt = Date.now();
    while (!runtime.stopRequested && Date.now() - startedAt < timeoutMs) {
      const root = findResumeRoot(options);
      if (root) return root;
      await sleep(500);
    }
    return null;
  }

  async function waitForResumeEntry(timeoutMs = 16000) {
    const startedAt = Date.now();
    while (!runtime.stopRequested && Date.now() - startedAt < timeoutMs) {
      const resumeRoot = findResumeRoot({ allowGenericViewer: false });
      if (resumeRoot) return { resumeRoot, previewButton: null };
      const previewButton = findResumePreviewButton();
      if (previewButton) return { resumeRoot: null, previewButton };
      await sleep(500);
    }
    return { resumeRoot: null, previewButton: null };
  }

  function getVisibleResumeText(root) {
    if (!root) return '';
    const container = root.tagName === 'IFRAME' ? root.parentElement :
      root.closest('.boss-popup__wrapper, .boss-popup, .boss-dialog__wrapper, .dialog-lib-resume, .resume-detail-wrap, .resume-right-side') || root;
    const chunks = [];
    const seen = new Set();
    const collect = (node) => {
      if (!node || seen.has(node)) return;
      seen.add(node);
      const text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) chunks.push(text);
      let frames = [];
      try { frames = node.querySelectorAll?.('iframe') || []; } catch (_) {}
      for (const frame of frames) {
        try { collect(frame.contentDocument?.body); } catch (_) {}
      }
      let elements = [];
      try { elements = node.querySelectorAll?.('*') || []; } catch (_) {}
      for (const el of elements) if (el.shadowRoot) collect(el.shadowRoot);
    };
    collect(container);
    return Array.from(new Set(chunks)).join(' ').replace(/\s+/g, ' ').trim().slice(0, 30000);
  }

  function getResumeViewerContext(root) {
    if (!root) return null;
    let anchor = root;
    try {
      let frame = root.ownerDocument?.defaultView?.frameElement;
      while (frame) {
        anchor = frame;
        frame = frame.ownerDocument?.defaultView?.frameElement;
      }
    } catch (_) {}
    return anchor.closest?.('.boss-popup') ||
      anchor.closest?.('.boss-dialog__wrapper') ||
      anchor.closest?.('[role="dialog"]') ||
      anchor.closest?.('.boss-popup__wrapper, .dialog-lib-resume, .resume-detail-wrap, .resume-right-side') ||
      anchor;
  }

  function getTopLevelElement(el) {
    if (!el) return null;
    let anchor = el;
    try {
      let frame = el.ownerDocument?.defaultView?.frameElement;
      while (frame) {
        anchor = frame;
        frame = frame.ownerDocument?.defaultView?.frameElement;
      }
    } catch (_) {}
    return anchor;
  }

  function findViewerCloseButton(context) {
    if (!context) return null;
    const selector = [
      '.boss-dialog__close',
      '.boss-popup__close',
      '[class*="viewer"] [class*="close"]',
      '[class*="resume"] [class*="close"]',
      '[aria-label="关闭"]',
      '[title="关闭"]',
    ].join(',');
    const contextRoots = Array.from(collectQueryRoots(context));
    const candidates = queryAllDeep(selector, contextRoots).filter(isVisible);
    const contextAnchor = getTopLevelElement(context);
    const contextRect = contextAnchor?.getBoundingClientRect?.();

    return candidates
      .map(button => {
        const anchor = getTopLevelElement(button);
        const rect = anchor?.getBoundingClientRect?.();
        let score = 0;
        try {
          if (context.contains(button) || context.contains(anchor)) score += 100;
        } catch (_) {}
        if (contextRect && rect) {
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          if (centerX >= contextRect.left - 8 && centerX <= contextRect.right + 8 &&
              centerY >= contextRect.top - 8 && centerY <= contextRect.bottom + 8) score += 40;
          const topRightDistance = Math.abs(contextRect.right - centerX) +
            Math.abs(contextRect.top - centerY);
          score += Math.max(0, 30 - topRightDistance / 12);
        }
        const label = `${button.getAttribute?.('aria-label') || ''} ${button.getAttribute?.('title') || ''}`;
        if (label.includes('关闭')) score += 20;
        return { button, score };
      })
      .sort((a, b) => b.score - a.score)[0]?.button || null;
  }

  function getViewerClosedReason(root, context, closeButton) {
    if (!root?.isConnected) return '简历内容节点已移除';
    if (!isVisible(root)) return '简历内容及其上层窗口已隐藏';
    if (context && !context.isConnected) return '预览窗口容器已移除';
    if (context && !isVisible(context)) return '预览窗口容器已隐藏';

    const previewButton = findResumePreviewButton();
    const visibleViewer = findResumeRoot({ allowGenericViewer: true });
    if (!visibleViewer && previewButton && isVisible(previewButton)) {
      return '聊天页附件预览入口已恢复';
    }
    if (closeButton && (!closeButton.isConnected || !isVisible(closeButton)) &&
        previewButton && isVisible(previewButton)) {
      return '关闭按钮消失且聊天页已恢复';
    }
    return '';
  }

  async function waitForViewerClosed(root, context, closeButton, timeoutMs = 7000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const reason = getViewerClosedReason(root, context, closeButton);
      if (reason) return reason;
      await sleep(250);
    }
    return '';
  }

  async function closeResumeViewer(root) {
    if (!root || !isVisible(root)) {
      return { closed: true, reason: '关闭前已确认预览窗口不可见' };
    }
    const context = getResumeViewerContext(root);
    if (!context) {
      return { closed: false, reason: '未找到预览窗口容器' };
    }
    const button = findViewerCloseButton(context);
    if (!button) {
      const alreadyClosed = getViewerClosedReason(root, context, null);
      return alreadyClosed
        ? { closed: true, reason: alreadyClosed }
        : { closed: false, reason: '未找到可确认归属于当前简历窗口的关闭按钮' };
    }

    setStatus('running', '正在关闭简历预览窗口');
    log('正在执行关闭简历预览窗口');
    button.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    await sleep(600);
    button.click();
    log('已点击简历预览关闭按钮，正在确认页面状态');

    const reason = await waitForViewerClosed(root, context, button);
    return reason
      ? { closed: true, reason }
      : { closed: false, reason: '关闭后简历内容、窗口容器和聊天页恢复信号均未确认' };
  }

  function interpolateReply(template, talent, meta) {
    const name = String(talent?.name || meta?.name || '您好').trim();
    const position = String(talent?.position || meta?.position || '').trim();
    return String(template || '')
      .replaceAll('{姓名}', name)
      .replaceAll('{岗位}', position)
      .trim();
  }

  function getComposerValue(composer) {
    if (!composer) return '';
    if (composer.tagName === 'INPUT' || composer.tagName === 'TEXTAREA') return String(composer.value || '').trim();
    return String(composer.innerText || composer.textContent || '').replace(/\u200B/g, '').trim();
  }

  function findChatComposer() {
    const selectors = [
      '#boss-chat-editor-input',
      '.conversation-editor [contenteditable="true"]',
      '.conversation-editor textarea',
      '.conversation-editor input[type="text"]',
    ];
    for (const selector of selectors) {
      const composer = Array.from(document.querySelectorAll(selector)).find(isVisible);
      if (composer) return composer;
    }
    return null;
  }

  async function waitForChatComposer(timeoutMs = 8000) {
    const startedAt = Date.now();
    while (!runtime.stopRequested && Date.now() - startedAt < timeoutMs) {
      const composer = findChatComposer();
      if (composer) return composer;
      await sleep(400);
    }
    return null;
  }

  function findChatSendButton(composer) {
    const editor = composer?.closest('.conversation-editor') || document;
    const candidates = editor.querySelectorAll('.submit, .submit-content, .btn-send, button, [role="button"]');
    for (const button of candidates) {
      if (!isVisible(button)) continue;
      const text = (button.textContent || '').replace(/\s+/g, '').trim();
      const isSend = text === '发送' || text === '提交' ||
        button.classList.contains('submit') || button.classList.contains('submit-content') || button.classList.contains('btn-send');
      const disabled = button.hasAttribute('disabled') || button.getAttribute('aria-disabled') === 'true' ||
        button.classList.contains('disabled') || button.classList.contains('btn-disabled');
      if (isSend && !disabled) return button;
    }
    return null;
  }

  async function fillChatComposer(composer, text) {
    composer.scrollIntoView({ block: 'center', behavior: 'auto' });
    composer.focus();
    if (composer.tagName === 'INPUT' || composer.tagName === 'TEXTAREA') {
      const prototype = composer.tagName === 'INPUT' ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (setter) setter.call(composer, '');
      else composer.value = '';
      composer.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
      for (const character of text) {
        const nextValue = `${composer.value || ''}${character}`;
        if (setter) setter.call(composer, nextValue);
        else composer.value = nextValue;
        composer.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          data: character,
          inputType: 'insertText',
        }));
        await sleep(55);
      }
    } else if (composer.isContentEditable) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(composer);
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand('delete', false);
      composer.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
      for (const character of text) {
        document.execCommand('insertText', false, character);
        composer.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          data: character,
          inputType: 'insertText',
        }));
        await sleep(55);
      }
    } else {
      throw new Error('消息输入框类型不受支持');
    }
    composer.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: text, inputType: 'insertText' }));
    composer.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(500);
    if (getComposerValue(composer) !== text.trim()) throw new Error('消息输入后校验失败');
  }

  async function waitForChatSendButton(composer, timeoutMs = 6000) {
    const startedAt = Date.now();
    while (!runtime.stopRequested && Date.now() - startedAt < timeoutMs) {
      const button = findChatSendButton(composer);
      if (button) return button;
      await sleep(300);
    }
    return null;
  }

  async function waitForComposerCleared(composer, timeoutMs = 6000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (!getComposerValue(composer)) return true;
      await sleep(300);
    }
    return false;
  }

  async function sendReplyMessages(talent, meta, messagesOverride) {
    const source = Array.isArray(messagesOverride) ? messagesOverride : runtime.config.replyMessages;
    const messages = source.map(template => interpolateReply(template, talent, meta)).filter(Boolean);
    if (!messages.length) throw new Error('回复话术替换变量后为空');
    const composer = await waitForChatComposer();
    if (!composer) throw new Error('未找到当前候选人的消息输入框');

    for (let index = 0; index < messages.length; index++) {
      if (runtime.stopRequested) return false;
      const risk = pageHasRiskPrompt();
      if (risk) throw new Error(`检测到“${risk}”，任务已停止，请人工确认页面状态`);
      setStatus('running', `准备回复：${talent?.name || meta?.name || '候选人'}（${index + 1}/${messages.length}）`);
      await sleep(Math.max(4, runtime.config.actionDelaySeconds) * 1000);
      if (runtime.stopRequested) return false;
      await fillChatComposer(composer, messages[index]);
      const sendButton = await waitForChatSendButton(composer);
      if (!sendButton) throw new Error(`第 ${index + 1} 条消息的发送按钮未就绪`);
      await sleep(800);
      sendButton.click();
      const cleared = await waitForComposerCleared(composer);
      if (!cleared) throw new Error(`第 ${index + 1} 条消息发送状态无法确认，为避免重复已停止后续话术`);
      log(`💬 已发送第 ${index + 1}/${messages.length} 条简历回复：${talent?.name || meta?.name || '候选人'}`);
    }
    return true;
  }

  // ── Ph3：未读积压路由（非简历 → 判断回复）────────────────────────
  // 采集器已串行打开该会话，此处读信息条（brief）与候选人最新消息（走 API，避免猜 DOM）。
  function readOpenConversationBrief() {
    const brief = { gender: '', age: null, years: null, education: '', position: '' };
    try { brief.position = (document.querySelector('span.position-name') || {}).textContent?.trim() || ''; } catch (_) {}
    let root =
      document.querySelector('.conversation-container') ||
      document.querySelector('.chat-conversation') ||
      document.querySelector("[class*='conversation']") ||
      document.body;
    let text = '';
    try { text = ((root && root.innerText) || '').replace(/\s+/g, ' ').slice(0, 800); } catch (_) {}
    const ma = text.match(/(\d{2})\s*岁/); if (ma) brief.age = parseInt(ma[1], 10);
    const my = text.match(/(\d{1,2})\s*年(?!\s*龄)/); if (my) brief.years = parseInt(my[1], 10);
    const me = text.match(/(博士|硕士|研究生|MBA|EMBA|本科|大专|专科|高中|中专|初中)/); if (me) brief.education = me[1];
    return brief;
  }

  async function fetchLastCandidateText(uid) {
    try {
      const url = `https://www.zhipin.com/wapi/zpchat/boss/historyMsg?src=0&gid=${uid}&maxMsgId=0&c=20&page=1`;
      const resp = await fetch(url, { method: 'GET', credentials: 'include', headers: { 'x-requested-with': 'XMLHttpRequest' } });
      if (!resp.ok) return '';
      const data = await resp.json();
      if (data.code !== 0 || !data.zpData) return '';
      const messages = data.zpData.messages || [];
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const fromUid = String(msg?.from?.uid ?? msg?.from?.id ?? '');
        const text = String(msg?.body?.text || '').trim();
        if (fromUid && String(uid) === fromUid && text) return text;
      }
      return '';
    } catch (_) {
      return '';
    }
  }

  async function routeToReplyJudgment(meta) {
    setStage('route_reply_judgment', meta);
    const uid = String(meta.candidateId || meta.key || '');
    if (!uid) {
      runtime.stats.skipped++;
      return { outcome: 'no_resume', meta };
    }
    const brief = readOpenConversationBrief();
    const lastText = await fetchLastCandidateText(uid);
    if (!lastText) {
      runtime.stats.skipped++;
      log(`⏭ ${meta.name || '该候选人'}无候选人文本消息，跳过`, 'info');
      return { outcome: 'no_text', meta };
    }
    const verdict = await sendRuntime({
      action: 'cmd_judge_unread_reply',
      data: { uid, brief, lastText },
    });
    if (!verdict || verdict.action !== 'reply') {
      runtime.stats.skipped++;
      log(`⏭ ${meta.name || '该候选人'}：${verdict?.reason || '判定不回复'}`, 'info');
      return { outcome: 'skip_reply', meta };
    }
    const validation = await chrome.runtime.sendMessage({ action: 'cmd_validate_subscription' });
    if (!validation?.valid) throw new Error(validation?.message || validation?.error || '登录或订阅已失效');
    setStage('route_reply_send', meta);
    const replied = await sendReplyMessages({ name: meta.name, position: meta.position }, meta, verdict.replyMessages);
    if (replied) {
      runtime.stats.replied++;
      await sendRuntime({ action: 'cmd_mark_replied', data: { uid } });
      log(`📤 积压回复 → ${meta.name || '候选人'}：岗位「${verdict.jobName || ''}」${verdict.replyMessages.length} 条话术`);
    }
    return { outcome: replied ? 'replied' : 'skip_reply', meta };
  }
  // ── Ph3 结束 ─────────────────────────────────────────────────────

  async function processUnreadRow(row) {
    const meta = getCandidateMeta(row);
    setStage('open_conversation', meta);
    await setCoordinationLock(true, meta);
    try {
      setStatus('running', `正在检查：${meta.name || '未命名候选人'}`);
      log(`正在打开未读会话：${meta.name || meta.key}`);

      row.scrollIntoView({ block: 'center', behavior: 'auto' });
      await sleep(runtime.config.actionDelaySeconds * 1000);
      if (runtime.stopRequested) return { outcome: 'stopped', meta };
      const wasUnread = hasUnreadMarker(row);
      const wasSelected = isConversationRowSelected(row);
      if (meta.candidateId) {
        window.postMessage({ type: '__BOSS_SET_CURRENT_CANDIDATE__', geekId: meta.candidateId }, '*');
      }
      row.click();
      const conversationConfirmation = wasSelected
        ? { mode: 'selected', row, expectedKey: meta.key }
        : await waitForConversationConfirmation(row, wasUnread, meta.key);
      if (!conversationConfirmation) {
        throw new Error(`${meta.name || '该候选人'}点击后未能确认会话已选中`);
      }
    // 选中状态出现后再留出一段聊天区渲染时间。BOSS 可以复用同一按钮 DOM，
    // 因此不再以 DOM 对象是否变化判断候选人切换。
    await sleep(2400);

      const risk = pageHasRiskPrompt();
      if (risk) throw new Error(`检测到“${risk}”，任务已停止，请人工确认页面状态`);

      // 重试时可能已经完成“同意”，先接续现有预览入口，避免把已接受的简历误判为无简历。
      let { resumeRoot, previewButton } = await waitForResumeEntry(1500);
      if (!resumeRoot && !previewButton) {
        // SPA 切换会话后消息区可能晚于候选人标题渲染，给简历卡片一个有上限的稳定等待。
        setStage('locate_resume_consent', meta);
        const acceptTarget = await waitForResumeAcceptTarget(conversationConfirmation);
        if (!acceptTarget) {
          // Ph3：非简历的未读会话，路由到"判断回复"（复用本采集器已打开的信息条上下文）
          if (runtime.config?.routeNonResumeReply) {
            return await routeToReplyJudgment(meta);
          }
          runtime.stats.skipped++;
          log(`⏭ ${meta.name || '该候选人'}未发现可确认的简历同意按钮`, 'info');
          return { outcome: 'no_resume', meta };
        }

        setStage('accept_resume', meta);
        setStatus('running', `等待同意简历：${meta.name || '候选人'}`);
        await sleep(runtime.config.actionDelaySeconds * 1000);
        if (runtime.stopRequested) return { outcome: 'stopped', meta };
        // 不使用数秒前缓存的 DOM 引用，点击前重新获取按钮并再次校验会话状态。
        const clickTarget = chooseResumeAcceptTarget(
          findResumeAcceptTargets(),
          isConversationConfirmationValid(conversationConfirmation),
        );
        if (!clickTarget?.button || !isVisible(clickTarget.button)) {
          runtime.stats.skipped++;
          throw new Error(`${meta.name || '候选人'}的简历同意按钮在点击前状态已变化，本次已安全跳过`);
        }
        clickTarget.button.click();
        const targetLabel = clickTarget.kind === 'card' ? '消息卡片' :
          (clickTarget.kind === 'fixed' ? '底部固定栏' : '兼容入口');
        log(`已通过${targetLabel}同意 ${meta.name || '候选人'} 的附件简历，等待附件预览入口`);
        ({ resumeRoot, previewButton } = await waitForResumeEntry());
      } else {
        log(`↻ ${meta.name || '候选人'}已存在附件预览入口，从上次中断阶段继续`);
      }

    const extractionSessionId = `resume_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    runtime.extractionSessionId = extractionSessionId;
    window.postMessage({ type: '__RESUME_SCORER_CLEAR', sessionId: extractionSessionId }, '*');
    setStage('wait_resume_preview', meta);
    setStatus('running', `等待附件简历：${meta.name || '候选人'}`);
    if (!resumeRoot && previewButton) {
      const riskAfterAccept = pageHasRiskPrompt();
      if (riskAfterAccept) throw new Error(`检测到“${riskAfterAccept}”，任务已停止，请人工确认页面状态`);
      previewButton.scrollIntoView({ block: 'center', behavior: 'auto' });
      setStatus('running', `等待预览附件：${meta.name || '候选人'}`);
      await sleep(runtime.config.actionDelaySeconds * 1000);
      if (runtime.stopRequested) return;
      const viewerBaseline = snapshotVisibleViewerElements();
      previewButton.click();
      log(`已点击 ${meta.name || '候选人'} 的“${RESUME_PREVIEW_TEXT}”，等待简历加载`);
      resumeRoot = await waitForResumeRoot(16000, {
        allowGenericViewer: true,
        baseline: viewerBaseline,
      });
    }
    if (!resumeRoot) {
      runtime.stats.skipped++;
      throw new Error(`${meta.name || '候选人'}的附件预览入口或简历页面未在限定时间内出现`);
    }

    let extractionResult = null;
    try {
      runtime.stats.collected++;
      setStage('extract_resume', meta);
      setStatus('running', `正在提取：${meta.name || '候选人'}`);
      await sleep(5500);
      const fallbackText = getVisibleResumeText(resumeRoot);
      const result = await sendRuntime({
        action: ACTION.EXTRACT,
        data: { ...meta, fallbackText, extractionSessionId },
      });

      if (!result?.ok) {
        runtime.stats.skipped++;
        throw new Error(result?.error || '简历信息提取失败');
      }
      extractionResult = result;
      if (result.saved) runtime.stats.saved++;
      else runtime.stats.updated++;
      const phoneHint = result.talent?.phone ? `，电话 ${result.talent.phone.slice(0, 3)}****${result.talent.phone.slice(-4)}` : '，未识别到电话';
      log(`📥 ${result.updated ? '已更新' : '已入库'}：${result.talent?.name || meta.name || '候选人'}${phoneHint}`);
    } finally {
      setStage('close_resume_viewer', meta);
      const closeResult = await closeResumeViewer(resumeRoot);
      if (!closeResult.closed) {
        runtime.stopRequested = true;
        throw new Error(`简历已处理，但无法确认预览窗口已关闭（${closeResult.reason}），为避免串人已立即停止后续处理`);
      }
      runtime.extractionSessionId = '';
      log(`✅ 已确认简历预览窗口关闭：${closeResult.reason}，继续后续流程`);
    }

    if (extractionResult?.ok && runtime.config.autoSendReply && runtime.config.replyMessages.length > 0) {
      setStage('resume_followup_reply', meta);
      try {
        const replyValidation = await chrome.runtime.sendMessage({
          action: 'cmd_validate_subscription',
        });
        if (!replyValidation?.valid) {
          throw new Error(replyValidation?.message || replyValidation?.error || '登录或订阅已失效');
        }
        const replied = await sendReplyMessages(extractionResult.talent, meta);
        if (replied) {
          runtime.stats.replied++;
          log(`💬 简历入库后自动回复完成：${extractionResult.talent?.name || meta.name || '候选人'}`);
        }
      } catch (err) {
        log(`自动回复失败（人才已保留在人才库）：${err.message}`, 'error');
        throw new Error(`人才已入库，但自动回复失败：${err.message}`);
      }
    }
    return { outcome: 'collected', meta };
    } finally {
      await setCoordinationLock(false, meta);
      runtime.currentMeta = null;
      runtime.currentStage = '';
    }
  }

  async function processRowWithRetries(row, initialMeta) {
    const fingerprint = conversationFingerprint(initialMeta);
    while (!runtime.stopRequested && runtime.state === 'running') {
      try {
        const result = await processUnreadRow(row);
        if (result?.outcome === 'stopped') return result;
        runtime.processedKeys.add(fingerprint);
        await clearTransientFailure(initialMeta);
        runtime.consecutiveErrors = 0;
        return result;
      } catch (err) {
        if (GLOBAL_PAUSE_PATTERN.test(String(err?.message || ''))) throw err;
        runtime.consecutiveErrors++;
        const record = await recordCandidateFailure(initialMeta, err);
        if (record.permanent) {
          runtime.stats.skipped++;
          runtime.processedKeys.add(fingerprint);
          log(`⛔ ${record.name}在“${record.stage}”阶段连续失败 3 次，已永久跳过：${record.lastError}`, 'error');
          return { outcome: 'permanent_skip', meta: initialMeta };
        }
        log(`↻ ${record.name}处理失败（${record.attempts}/3，阶段：${record.stage}），稍后重试：${record.lastError}`, 'warn');
        setStatus('running', `重试 ${record.name}（${record.attempts + 1}/3）`);
        await sleep(Math.max(2000, runtime.config.actionDelaySeconds * 1000));
      }
    }
    return { outcome: 'stopped', meta: initialMeta };
  }

  async function runLoop() {
    try {
      await loadFailureRecords();
      while (!runtime.stopRequested && runtime.state === 'running') {
        if (runtime.deadlineAt && Date.now() >= runtime.deadlineAt) {
          setStatus('idle', '持续监听窗口已完成');
          log(`持续监听 ${runtime.config.listenDurationMinutes} 分钟已完成，任务结束`);
          return;
        }
        if (!/https:\/\/www\.zhipin\.com\/web\/chat/i.test(location.href)) {
          throw new Error('页面已离开 BOSS 沟通页，任务自动停止');
        }
        const validation = await chrome.runtime.sendMessage({
          action: 'cmd_validate_subscription',
        });
        if (!validation?.valid) {
          throw new Error(validation?.message || validation?.error || '登录或订阅已失效，采集已停止');
        }
        const risk = pageHasRiskPrompt();
        if (risk) throw new Error(`检测到“${risk}”，任务自动停止`);
        if (runtime.processedKeys.size >= runtime.config.maxPerRun) {
          setStatus('idle', `已达到本轮处理上限 ${runtime.config.maxPerRun} 个未读会话`);
          log(`本轮已检查 ${runtime.config.maxPerRun} 个未读会话，达到上限并停止`);
          return;
        }

        const row = getConversationRows().find(el => {
          const meta = getCandidateMeta(el);
          return !runtime.processedKeys.has(conversationFingerprint(meta)) && !isPermanentlySkipped(meta);
        });
        if (!row) {
          if (await scanNextConversationListPage()) {
            setStatus('running', '正在扫描更多未读会话');
            continue;
          }
          const remainingMinutes = Math.max(1, Math.ceil((runtime.deadlineAt - Date.now()) / 60000));
          setStatus('running', `等待新的简历请求（剩余约 ${remainingMinutes} 分钟）`);
          await sleep(runtime.config.scanIntervalSeconds * 1000);
          continue;
        }

        await processRowWithRetries(row, getCandidateMeta(row));

        if (runtime.stopRequested) break;
        setStatus('running', `等待 ${runtime.config.intervalSeconds} 秒后检查下一位候选人`);
        await sleep(runtime.config.intervalSeconds * 1000);
      }
    } catch (err) {
      log(`任务暂停：${err.message}`, 'error');
      if (GLOBAL_PAUSE_PATTERN.test(String(err?.message || ''))) {
        runtime.pausedAt = Date.now();
        setStatus('paused', `需人工处理：${err.message}`);
      } else {
        setStatus('idle', `已停止：${err.message}`);
      }
    } finally {
      runtime.stopRequested = false;
      if (!['idle', 'paused'].includes(runtime.state)) setStatus('idle', '已停止');
    }
  }

  function start(config) {
    if (runtime.state === 'running') return snapshotStatus();
    if (!/https:\/\/www\.zhipin\.com\/web\/chat/i.test(location.href)) {
      throw new Error('请先打开 BOSS 直聘“沟通”页面');
    }
    runtime.config = normalizeConfig(config);
    runtime.stats = { collected: 0, saved: 0, updated: 0, skipped: 0, replied: 0 };
    runtime.processedKeys.clear();
    runtime.stopRequested = false;
    runtime.consecutiveErrors = 0;
    runtime.deadlineAt = Date.now() + runtime.config.listenDurationMinutes * 60 * 1000;
    runtime.pausedAt = 0;
    setStatus('running', '正在扫描当前可见的未读会话');
    const replyHint = runtime.config.autoSendReply
      ? `；入库后自动发送 ${runtime.config.replyMessages.length} 条回复`
      : '；入库后不自动回复';
    log(`简历采集已启动：监听 ${runtime.config.listenDurationMinutes} 分钟，每 ${runtime.config.scanIntervalSeconds} 秒扫描一次，本轮最多 ${runtime.config.maxPerRun} 条会话${replyHint}`);
    setTimeout(runLoop, 0);
    return snapshotStatus();
  }

  function stop() {
    runtime.stopRequested = true;
    setStatus('idle', '用户已停止');
    log('已收到停止指令');
    return snapshotStatus();
  }

  function resume() {
    if (runtime.state !== 'paused') return snapshotStatus();
    const risk = pageHasRiskPrompt();
    if (risk) throw new Error(`仍检测到“${risk}”，请先完成人工处理`);
    if (runtime.pausedAt && runtime.deadlineAt) {
      runtime.deadlineAt += Math.max(0, Date.now() - runtime.pausedAt);
    }
    runtime.pausedAt = 0;
    runtime.stopRequested = false;
    setStatus('running', '已恢复，继续监听简历请求');
    log('▶ 已从暂停阶段恢复简历采集');
    setTimeout(runLoop, 0);
    return snapshotStatus();
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    try {
      if (message?.action === ACTION.START) sendResponse({ ok: true, ...start(message.data) });
      else if (message?.action === ACTION.RESUME) sendResponse({ ok: true, ...resume() });
      else if (message?.action === ACTION.STOP) sendResponse({ ok: true, ...stop() });
      else if (message?.action === ACTION.GET_STATUS) sendResponse({ ok: true, ...snapshotStatus() });
      else if (message?.action === ACTION.RELOAD_FAILURES) {
        loadFailureRecords()
          .then(() => sendResponse({ ok: true }))
          .catch(err => sendResponse({ ok: false, error: err.message }));
        return true;
      }
      else return false;
    } catch (err) {
      sendResponse({ ok: false, error: err.message });
    }
    return false;
  });

  console.log('[ResumeCollector] 内容脚本已加载');
})();
