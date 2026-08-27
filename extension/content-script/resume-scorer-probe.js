/**
 * resume-scorer-probe.js —— 简历文本探针（独立、可复用版）
 *
 * 【用途】BOSS 直聘的简历正文是用 <canvas> 逐字绘制的（反爬手段），
 * 普通 DOM 抓取拿不到文字。本探针通过 Hook Canvas 的 fillText / strokeText，
 * 在页面把每个字画到画布之前先"截"下来，拼成简历全文，供打分模块使用。
 *
 * 【注入方式】必须在 manifest.json 里以：
 *   world: "MAIN"            —— 运行在页面 JS 上下文（否则 hook 不到页面的 Canvas）
 *   run_at: "document_start" —— 抢在页面脚本之前安装 hook
 *   all_frames: true         —— 简历常在 iframe 内渲染，要覆盖所有 frame
 * 声明注入。
 *
 * 【数据流】MAIN world 采集 → postMessage → ISOLATED world 的 content script
 *          → chrome.runtime.sendMessage → service worker 打分。
 *
 * 注意：本探针只"读"页面已经要渲染的文字，不额外发请求、不改页面行为，
 *       风险与原插件的探针一致（详见 README 的反爬说明）。
 */
(function () {
  if (window.__RESUME_SCORER_PROBE__) return;
  window.__RESUME_SCORER_PROBE__ = true;

  const BUS_KEY = '__RESUME_SCORER_DATA__';
  const store = window[BUS_KEY] || (window[BUS_KEY] = { texts: [], sessionId: '' });
  const texts = store.texts;
  const frameKey = store.frameKey || (store.frameKey = `frame_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

  const log = (...a) => console.log('[ResumeScorer/probe]', ...a);
  log('探针启动 @', location.href.slice(0, 80));

  // ── Hook Canvas 文字绘制 ─────────────────────────────
  function hook(name) {
    const proto = CanvasRenderingContext2D.prototype;
    const orig = proto[name];
    proto[name] = function () {
      try {
        const t = String(arguments[0] || '').trim();
        if (t) texts.push(t);
      } catch (e) {}
      return orig.apply(this, arguments);
    };
  }
  hook('fillText');
  hook('strokeText');
  log('✅ Canvas hook 已安装');

  function visibleText(el) {
    try {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (rect.width < 280 || rect.height < 180 || style.display === 'none' || style.visibility === 'hidden') return '';
      return String(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    } catch (_) {
      return '';
    }
  }

  function collectDomTexts() {
    const result = [];
    const selectors = [
      '.boss-popup__wrapper, .boss-popup, .dialog-lib-resume, .resume-detail-wrap, .resume-detail-page',
      '.resume-container, .geek-resume-wrap, [class*="resume-content"]',
    ];
    for (const selector of selectors) {
      let elements = [];
      try { elements = document.querySelectorAll(selector); } catch (_) { continue; }
      for (const el of elements) {
        const text = visibleText(el);
        const hasResumeText = /(?:个人优势|工作经历|教育经历|项目经历|求职意向|电话|手机|邮箱)/.test(text);
        let hasViewer = false;
        try { hasViewer = Boolean(el.querySelector('iframe, object, embed, canvas')); } catch (_) {}
        if (text.length >= 20 && (hasResumeText || hasViewer)) result.push(text);
      }
    }
    if (window !== window.top) {
      const bodyText = visibleText(document.body);
      const hrefHint = /(?:resume|attachment|preview|\.pdf(?:$|[?#])|c-resume)/i.test(location.href);
      const contentHint = /(?:个人优势|工作经历|教育经历|求职意向|电话|手机|邮箱)/.test(bodyText);
      const viewerHint = Boolean(document.querySelector('canvas, object, embed'));
      if (bodyText.length >= 20 && (hrefHint || contentHint || viewerHint)) result.push(bodyText);
    }
    return Array.from(new Set(result));
  }

  function getProbeEvidence(domTexts) {
    const combined = domTexts.join(' ');
    const sectionCount = [
      '个人优势', '工作经历', '教育经历', '项目经历',
      '求职目标', '求职意向', '核心优势', '专业技能',
    ].filter(item => combined.includes(item)).length;
    const hrefHint = /(?:resume|attachment|preview|\.pdf(?:$|[?#])|c-resume)/i.test(location.href);
    let hasLargeCanvas = false;
    try {
      hasLargeCanvas = Array.from(document.querySelectorAll('canvas')).some(canvas => {
        const rect = canvas.getBoundingClientRect();
        const style = getComputedStyle(canvas);
        return rect.width >= 300 && rect.height >= 220 && style.display !== 'none' && style.visibility !== 'hidden';
      });
    } catch (_) {}
    const visiblePopup = window === window.top && domTexts.length > 0;
    return {
      resumeLike: hrefHint || sectionCount >= 1 || visiblePopup || (window !== window.top && hasLargeCanvas),
      sectionCount,
      hrefHint,
      hasLargeCanvas,
    };
  }

  // ── 把采集到的文字广播给 ISOLATED world ──────────────
  function flush(includeDom = true) {
    const domTexts = includeDom ? collectDomTexts() : [];
    const evidence = getProbeEvidence(domTexts);
    const payload = {
      type: '__RESUME_SCORER_FLUSH',
      texts: texts.concat(domTexts),
      frameKey,
      sessionId: store.sessionId || '',
      frameUrl: location.href.slice(0, 500),
      canvasTextCount: texts.length,
      ...evidence,
    };
    try { window.postMessage(payload, '*'); } catch (e) {}
    try { window.parent && window.parent !== window && window.parent.postMessage(payload, '*'); } catch (e) {}
    try { window.top && window.top !== window && window.top.postMessage(payload, '*'); } catch (e) {}
    log(`🚀 广播 ${texts.length} 段文字`);
  }

  function forwardToChildFrames(payload) {
    try {
      for (let index = 0; index < window.frames.length; index++) {
        try { window.frames[index].postMessage(payload, '*'); } catch (_) {}
      }
    } catch (_) {}
  }

  // canvas 渲染是异步的，多次尝试推送（简历一般 2–15s 内画完）
  [2000, 5000, 10000].forEach((ms) => setTimeout(flush, ms));

  // 收到 ISOLATED world 的"请立即采集"信号时也推一次
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === '__RESUME_SCORER_REQUEST') {
      const sessionId = String(e.data.sessionId || '');
      if (sessionId && store.sessionId && sessionId !== store.sessionId) return;
      if (sessionId) store.sessionId = sessionId;
      flush();
      forwardToChildFrames({ type: '__RESUME_SCORER_REQUEST', sessionId: store.sessionId });
    }
  });

  // 切换候选人时清空，避免上一个人的文字混入
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === '__RESUME_SCORER_CLEAR') {
      store.sessionId = String(e.data.sessionId || '');
      texts.length = 0;
      forwardToChildFrames({ type: '__RESUME_SCORER_CLEAR', sessionId: store.sessionId });
      log('🧹 已清空缓存（切换候选人）');
    }
  });
})();
