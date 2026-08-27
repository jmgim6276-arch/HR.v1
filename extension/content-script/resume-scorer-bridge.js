/**
 * resume-scorer-bridge.js —— ISOLATED world 桥接脚本
 *
 * 【用途】接收 MAIN world 探针广播的简历文字，缓存起来；
 * 当 sidepanel 发来"打分"请求时，把当前简历文本转交给 service worker 打分。
 *
 * 【注入方式】manifest.json 里以默认（ISOLATED）world、run_at: document_idle 注入，
 * 匹配 BOSS 直聘的简历/聊天页面。
 *
 * 如果你已经有 content-script/index.js，可把下面的 message 监听逻辑合并进去，
 * 不必单独再加一个文件。
 */
(function () {
  if (window.__RESUME_SCORER_BRIDGE__) return;
  window.__RESUME_SCORER_BRIDGE__ = true;

  const textsByFrame = new Map();
  let activeSessionId = '';

  function getFramesInRoot(root, output = [], seen = new Set()) {
    if (!root || seen.has(root)) return output;
    seen.add(root);
    try { output.push(...root.querySelectorAll('iframe')); } catch (_) {}
    let elements = [];
    try { elements = root.querySelectorAll('*'); } catch (_) { return output; }
    for (const el of elements) if (el.shadowRoot) getFramesInRoot(el.shadowRoot, output, seen);
    return output;
  }

  function frameSourceIsVisible(source, root = document, seen = new Set()) {
    if (source === window) return true;
    if (!root || seen.has(root)) return false;
    seen.add(root);
    const frames = getFramesInRoot(root);
    for (const frame of frames) {
      const rect = frame.getBoundingClientRect();
      const style = (frame.ownerDocument?.defaultView || window).getComputedStyle(frame);
      const frameVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      let isSource = false;
      try { isSource = frame.contentWindow === source; } catch (_) {}
      if (isSource) return frameVisible;
      if (!frameVisible) continue;
      try {
        if (frame.contentDocument && frameSourceIsVisible(source, frame.contentDocument, seen)) return true;
      } catch (_) {}
    }
    return false;
  }

  // 1) 接收 MAIN world 探针的数据
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (d && d.type === '__RESUME_SCORER_FLUSH' && Array.isArray(d.texts)) {
      if (activeSessionId && d.sessionId !== activeSessionId) return;
      if (!d.resumeLike || !frameSourceIsVisible(e.source)) return;
      const frameKey = String(d.frameKey || 'legacy-frame');
      textsByFrame.set(frameKey, {
        texts: d.texts,
        canvasTextCount: Number(d.canvasTextCount || 0),
        sectionCount: Number(d.sectionCount || 0),
        frameUrl: String(d.frameUrl || ''),
      });
      console.log('[ResumeScorer/bridge] 收到简历文字', d.texts.length, '段');
      return;
    }
    if (d && d.type === '__RESUME_SCORER_CLEAR') {
      activeSessionId = String(d.sessionId || '');
      textsByFrame.clear();
    }
  });

  // 2) 主动催探针推送
  function requestProbe(sessionId) {
    window.postMessage({ type: '__RESUME_SCORER_REQUEST', sessionId }, '*');
  }

  // 3) 把 canvas 文字碎片清洗成一段可读文本
  function buildResumeText(fragments) {
    // 去掉纯符号碎片、合并、去重相邻重复
    const cleaned = [];
    let prev = '';
    for (const f of fragments) {
      const t = (f || '').trim();
      if (!t) continue;
      if (t === prev) continue;
      cleaned.push(t);
      prev = t;
    }
    const separated = cleaned.join('\n');
    const shortFragmentRatio = cleaned.length
      ? cleaned.filter(item => item.length <= 2).length / cleaned.length
      : 0;
    if (cleaned.length >= 20 && shortFragmentRatio >= 0.55) {
      return `${separated}\n【连续绘制文本】\n${cleaned.join('')}`;
    }
    return separated;
  }

  function buildCompactText(fragments) {
    return fragments
      .map(item => String(item || '').trim())
      .filter(Boolean)
      .join('');
  }

  function getAllFragments() {
    const fragments = [];
    for (const frame of textsByFrame.values()) fragments.push(...frame.texts);
    return fragments;
  }

  function hasReliableFrame() {
    for (const frame of textsByFrame.values()) {
      if (frame.sectionCount >= 1 || frame.canvasTextCount >= 20 || frame.texts.join('').length >= 120) return true;
    }
    return false;
  }

  // 4) 响应 sidepanel/SW 的打分请求
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === 'RESUME_SCORER_COLLECT') {
      const requestedSessionId = String(msg.sessionId || activeSessionId || '');
      if (requestedSessionId && requestedSessionId !== activeSessionId) {
        activeSessionId = requestedSessionId;
        textsByFrame.clear();
      }
      requestProbe(requestedSessionId);
      // 给探针一点时间把最新一帧推过来
      setTimeout(() => {
        const fragments = getAllFragments();
        sendResponse({
          ok: true,
          resumeText: buildResumeText(fragments),
          compactText: buildCompactText(fragments),
          rawCount: fragments.length,
          frameCount: textsByFrame.size,
          reliable: hasReliableFrame(),
          sessionId: activeSessionId,
        });
      }, 400);
      return true; // 异步响应
    }
  });
})();
