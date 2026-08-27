/**
 * inject-resume-probe.js — MAIN world 简历数据探针（Canvas 版）
 *
 * 通过 manifest.json content_scripts 声明注入：
 *   - world: "MAIN"        → 运行在页面 JS 上下文中
 *   - run_at: "document_start" → 在任何页面 JS 之前执行
 *   - all_frames: true     → 注入所有 iframe（含简历绑制 iframe）
 *
 * 职责：Hook CanvasRenderingContext2D.prototype.fillText / strokeText，
 * 拦截 iframe 内 canvas 绑制的简历文字，通过 postMessage 转发给 ISOLATED world。
 */
(function () {
  // 防止重复注入（改用独立守卫，避免旧版 `__BOSS_RESUME_PROBE_ACTIVE__` 影响）
  if (window.__BOSS_RESUME_PROBE_V2__) return;
  window.__BOSS_RESUME_PROBE_V2__ = true;

  const DATA_KEY = '__BOSS_RESUME_PROBE_DATA__';
  const state = window[DATA_KEY] || (window[DATA_KEY] = { data: {} });
  const data = state.data;

  /* ══════════════════════════════════════════════════════════════
     Canvas 文字拦截：Hook fillText / strokeText
     简历在 iframe 内通过 canvas 绑制渲染，拦截所有绑制到 canvas 上的文字
     通过日志输出每一步状态，便于排查数据获取链路
     ══════════════════════════════════════════════════════════════ */

  // 标识当前运行环境（主页面 or iframe）
  const frameLabel = (window.location?.pathname || '').includes('/web/frame/c-resume/')
    ? '🖼️ [resume iframe]'
    : '🏠 [main]';
  const log = (...args) => console.log(`[ResumeProbe] ${frameLabel}`, ...args);

  log('探针启动, location:', window.location.href.slice(0, 100));

  if (!data.__canvas_hook_active) {
    data.__canvas_hook_active = true;
    const canvasTexts = [];
    data.__canvas_texts = canvasTexts;
    log('✅ Canvas Hook 已安装 (fillText + strokeText)');

    // Hook fillText：拦截 canvas 绑制的主要文字
    const origFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function () {
      try {
        const text = String(arguments[0] || '');
        if (text.length > 0) {
          canvasTexts.push(text);
          // 每收集到 50 个文字片段时输出一次进度日志
          if (canvasTexts.length % 50 === 0) {
            log(`📝 已收集 ${canvasTexts.length} 段 canvas 文字`);
          }
        }
      } catch (e) {}
      return origFillText.apply(this, arguments);
    };

    // Hook strokeText：部分文字可能用描边方式绑制
    const origStrokeText = CanvasRenderingContext2D.prototype.strokeText;
    CanvasRenderingContext2D.prototype.strokeText = function () {
      try {
        const text = String(arguments[0] || '');
        if (text.length > 0) {
          canvasTexts.push(text);
        }
      } catch (e) {}
      return origStrokeText.apply(this, arguments);
    };

    // 自动延迟广播（不依赖 FLUSH 信号，iframe 内 canvas 渲染后主动推送）
    // 简历 canvas 通常在弹窗打开后 2-5 秒内完成首次绑制
    const autoBroadcast = () => {
      if (canvasTexts.length > 0) {
        log(`🚀 自动广播: ${canvasTexts.length} 段 canvas 文字`);
        broadcastProbeData();
      } else {
        log('⏳ 自动广播跳过（canvas 文字为空）');
      }
    };
    setTimeout(autoBroadcast, 3000);
    setTimeout(autoBroadcast, 8000);
    setTimeout(autoBroadcast, 15000);
  }

  /* ══════════════════════════════════════════════════════════════
     广播函数
     向当前 frame、parent、top 广播探针数据
     ══════════════════════════════════════════════════════════════ */

  function broadcastProbeData() {
    const payload = { type: '__BOSS_MAIN_WORLD_DATA', data: data };
    try { window.postMessage(payload, '*'); } catch (e) {}
    try { if (window.parent && window.parent !== window) window.parent.postMessage(payload, '*'); } catch (e) {}
    try { if (window.top && window.top !== window && window.top !== window.parent) window.top.postMessage(payload, '*'); } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     监听 ISOLATED world 的控制信号
     ══════════════════════════════════════════════════════════════ */

  // 1. 候选人切换信号：清除之前候选人的捕获数据
  window.addEventListener('message', function (event) {
    try {
      const d = event.data;
      if (d && d.type === '__BOSS_SET_CURRENT_CANDIDATE__' && d.geekId) {
        const geekId = String(d.geekId);
        if (geekId !== data.__current_geek_id) {
          data.__current_geek_id = geekId;
          // 清除之前候选人的数据（清空已有数组，保持引用不变）
          // 注意：不能用 data.__canvas_texts = [] 创建新数组，
          // 否则会断开与闭包中 canvasTexts 的引用，导致新文字无法被 ISOLATED world 收到
          if (data.__canvas_texts) data.__canvas_texts.length = 0;
        }
      }
    } catch (e) {}
  });

  // 2. 刷新信号：立即推送当前探针数据，并转发 FLUSH 给子 frame
  window.addEventListener('message', function (event) {
    try {
      if (event.data && event.data.type === '__BOSS_FLUSH_PROBE__') {
        log('📡 收到 FLUSH，当前 canvas 文字:', data.__canvas_texts?.length || 0, '段');
        broadcastProbeData();
        // 向子 frame 转发 FLUSH 信号（让 iframe probe 也广播自己的数据）
        // 注意：必须转发 FLUSH（而非 __BOSS_MAIN_WORLD_DATA），
        // 否则 iframe probe 不会触发 broadcastProbeData
        try {
          for (var i = 0; i < window.frames.length; i++) {
            try {
              window.frames[i].postMessage({ type: '__BOSS_FLUSH_PROBE__' }, '*');
            } catch (e) {}
          }
        } catch (e) {}
      }
    } catch (e) {}
  });

  // 初始推送
  broadcastProbeData();
})();
