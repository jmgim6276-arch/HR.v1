/**
 * 打招呼调试页面逻辑（增强版）
 * 外部 JS 文件（CSP 合规，替代内联脚本）
 *
 * 功能：测试 BOSS 直聘推荐页面的滚动加载功能，包含深度 iframe 和容器诊断
 *
 * 变更记录：
 * - 新增深度诊断：iframe 尺寸/overflow 分析、候选容器暴力扫描、诊断结论
 */
(function () {
  'use strict';

  /** 调试动作名（与 constants.js 一致） */
  const ACTION_DEBUG_SCROLL_TEST = 'cmd_debug_scroll_test';
  const ACTION_DEBUG_INSPECT_GREET = 'cmd_debug_inspect_greet';

  /**
   * 读取卡片/打招呼按钮结构（走插件消息，绕开页面 F12 反调试刷新）
   */
  async function runInspectGreet() {
    const btn = document.getElementById('btnInspectGreet');
    const wrap = document.getElementById('inspectWrap');
    const out = document.getElementById('inspectResult');
    if (!btn || !out) return;
    btn.disabled = true;
    btn.textContent = '⏳ 读取中...';
    try {
      const result = await chrome.runtime.sendMessage({ action: ACTION_DEBUG_INSPECT_GREET });
      if (wrap) wrap.style.display = 'block';
      out.textContent = JSON.stringify(result, null, 2);
      addLog('卡片/按钮结构读取完成', 'log-result');
    } catch (err) {
      if (wrap) wrap.style.display = 'block';
      out.textContent = '读取失败: ' + (err && err.message ? err.message : String(err));
      addLog('读取失败: ' + (err && err.message ? err.message : err), 'log-error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🔍 读取卡片/打招呼按钮结构';
    }
  }


  /* ─── DOM 引用 ─── */
  let btnScrollTest = null;
  let resultCard = null;
  let logContainer = null;
  let hintInfo = null;
  let hintSuccess = null;
  let hintError = null;

  // 诊断 DOM 引用
  let diagnosisBox = null;
  let frameTableBody = null;
  let frameTableWrap = null;
  let candidateTableBody = null;
  let candidateTableWrap = null;
  let allScrollableTableBody = null;
  let allScrollableTableWrap = null;

  /* ─── 日志 ─── */

  /**
   * 向日志容器追加一行日志
   * @param {string} msg - 日志文本
   * @param {string} [cls='log-debug'] - 颜色类名
   */
  function addLog(msg, cls) {
    if (cls === undefined) cls = 'log-debug';
    if (!logContainer) return;
    const line = document.createElement('div');
    line.className = 'log-line ' + cls;
    line.textContent = msg;
    logContainer.appendChild(line);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  /**
   * 重置日志（清除旧内容，显示等待消息）
   */
  function resetLog() {
    if (!logContainer) return;
    logContainer.innerHTML = '<div class="log-line log-debug">等待测试...</div>';
  }

  /* ─── Toast ─── */

  let _toastTimer = null;

  /**
   * 显示 Toast 提示
   * @param {string} msg - 提示文本
   * @param {number} [duration=2500] - 显示时长（毫秒）
   */
  function showToast(msg, duration) {
    if (duration === undefined) duration = 2500;
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { el.style.opacity = '0'; }, duration);
  }

  /* ─── 状态提示 ─── */

  /**
   * 显示状态提示（隐藏其他提示）
   * @param {string} type - 'info' | 'success' | 'error'
   * @param {string} html - HTML 内容
   */
  function showHint(type, html) {
    [hintInfo, hintSuccess, hintError].forEach(function (el) { el.classList.remove('visible'); });
    var target = type === 'info' ? hintInfo : type === 'success' ? hintSuccess : hintError;
    if (target) {
      target.innerHTML = html;
      target.classList.add('visible');
    }
  }

  /* ─── 隐藏所有诊断区 ─── */

  /**
   * 重置所有诊断区域（隐藏）
   */
  function resetDiagnostics() {
    // 隐藏诊断结论
    if (diagnosisBox) {
      diagnosisBox.classList.remove('visible');
      diagnosisBox.innerHTML = '';
    }
    document.getElementById('diagConclusion').open = false;

    // 隐藏 iframe 表
    if (frameTableWrap) frameTableWrap.classList.remove('visible');
    if (frameTableBody) frameTableBody.innerHTML = '';
    document.getElementById('diagFrames').open = false;

    // 隐藏候选容器表
    if (candidateTableWrap) candidateTableWrap.classList.remove('visible');
    if (candidateTableBody) candidateTableBody.innerHTML = '';
    document.getElementById('diagCandidates').open = false;

    // 隐藏暴力扫描表
    if (allScrollableTableWrap) allScrollableTableWrap.classList.remove('visible');
    if (allScrollableTableBody) allScrollableTableBody.innerHTML = '';
    document.getElementById('diagAllScrollable').open = false;

    // 隐藏概要卡片
    if (resultCard) resultCard.classList.remove('visible');
  }

  /* ─── 诊断结论渲染 ─── */

  /**
   * 渲染诊断结论文本（带颜色标记）
   * @param {string} diagnosisText - 诊断结论文本（含emoji标记的每行）
   */
  function renderDiagnosis(diagnosisText) {
    if (!diagnosisBox || !diagnosisText) return;
    var lines = diagnosisText.split('\n');
    var html = '';
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var cls = 'diag-line-info';
      if (line.startsWith('🔴')) cls = 'diag-line-red';
      else if (line.startsWith('🟢')) cls = 'diag-line-green';
      else if (line.startsWith('🟡') || line.startsWith('⚠️')) cls = 'diag-line-yellow';
      else if (line.startsWith('ℹ️')) cls = 'diag-line-info';
      html += '<div class="' + cls + '">' + escapeHtml(line) + '</div>';
    }
    diagnosisBox.innerHTML = html;
    diagnosisBox.classList.add('visible');
    document.getElementById('diagConclusion').open = true;
  }

  /**
   * 转义 HTML 实体（防止诊断文本中的标签被渲染）
   * @param {string} str - 原始文本
   * @returns {string} 转义后的文本
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ─── Iframe 表渲染 ─── */

  /**
   * 渲染 iframe 诊断表格
   * @param {Array} frames - iframe 诊断数据数组
   */
  function renderFrameTable(frames) {
    if (!frameTableBody || !frameTableWrap || !frames || frames.length === 0) return;

    var html = '';
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      var accessibleCls = f.accessible ? 'cell-yes' : 'cell-no';
      var canScroll = f.accessible && f.docScrollH > f.docClientH + 2;
      var scrollCls = canScroll ? 'cell-yes' : 'cell-no';
      html += '<tr>' +
        '<td>' + escapeHtml(f.name || f.id || '-') + '</td>' +
        '<td class="' + accessibleCls + '">' + (f.accessible ? '✅' : '❌') + '</td>' +
        '<td>' + (f.iframeW || '-') + '×' + (f.iframeH || '-') + '</td>' +
        '<td>' + escapeHtml(f.parentTag || '-') + '</td>' +
        '<td>' + (f.parentH != null ? f.parentH : '-') + '</td>' +
        '<td>' + escapeHtml(f.parentStyleOverflowY || '-') + '</td>' +
        '<td>' + (f.frameBoxH != null ? f.frameBoxH : '-') + '</td>' +
        '<td>' + (f.aliveWrapH != null ? f.aliveWrapH : '-') + '</td>' +
        '<td>' + escapeHtml(f.aliveWrapOverflowY || '-') + '</td>' +
        '<td>' + (f.docScrollH || '-') + '</td>' +
        '<td>' + (f.docClientH || '-') + '</td>' +
        '<td class="' + scrollCls + '">' + (canScroll ? '✅' : '❌') + '</td>' +
        '</tr>';
    }
    frameTableBody.innerHTML = html;
    frameTableWrap.classList.add('visible');
    document.getElementById('diagFrames').open = true;
  }

  /* ─── 候选容器表渲染 ─── */

  /**
   * 渲染候选滚动容器表格
   * @param {Array} candidates - 候选容器数据数组
   */
  function renderCandidateTable(candidates) {
    if (!candidateTableBody || !candidateTableWrap || !candidates || candidates.length === 0) return;

    var html = '';
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      var visibleCls = c.isVisible ? 'cell-yes' : 'cell-no';
      var scrollCls = c.canScroll ? 'cell-yes' : 'cell-no';
      var scrollPlusCls = c.canScrollWithOverflow ? 'cell-yes' : 'cell-no';
      var idOrClass = c.id ? '#' + c.id : '.' + (c.class || '').replace(/\s+/g, '.');
      html += '<tr>' +
        '<td>' + escapeHtml(c.doc || '') + '</td>' +
        '<td>' + escapeHtml(c.selector || '') + '</td>' +
        '<td>' + escapeHtml(c.tag || '') + '</td>' +
        '<td title="' + escapeHtml(c.class || '') + '">' + escapeHtml(idOrClass.slice(0, 40)) + '</td>' +
        '<td>' + escapeHtml(c.overflowY || '') + '</td>' +
        '<td>' + escapeHtml(c.height || '') + '</td>' +
        '<td>' + escapeHtml(c.maxHeight || '') + '</td>' +
        '<td>' + c.scrollHeight + '</td>' +
        '<td>' + c.clientHeight + '</td>' +
        '<td class="' + visibleCls + '">' + (c.isVisible ? '✅' : '❌') + '</td>' +
        '<td class="' + scrollCls + '">' + (c.canScroll ? '✅' : '❌') + '</td>' +
        '<td class="' + scrollPlusCls + '">' + (c.canScrollWithOverflow ? '✅' : '❌') + '</td>' +
        '</tr>';
    }
    candidateTableBody.innerHTML = html;
    candidateTableWrap.classList.add('visible');
    document.getElementById('diagCandidates').open = true;
  }

  /* ─── 暴力扫描表渲染 ─── */

  /**
   * 渲染暴力扫描发现的可滚动元素表格
   * @param {Array} items - 可滚动元素数组
   */
  function renderAllScrollableTable(items) {
    if (!allScrollableTableBody || !allScrollableTableWrap || !items || items.length === 0) return;

    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var visibleCls = it.isVisible ? 'cell-yes' : 'cell-no';
      var idOrClass = it.id ? '#' + it.id : '.' + (it.class || '').replace(/\s+/g, '.');
      html += '<tr>' +
        '<td>' + escapeHtml(it.doc || '') + '</td>' +
        '<td>' + escapeHtml(it.tag || '') + '</td>' +
        '<td title="' + escapeHtml(it.class || '') + '">' + escapeHtml(idOrClass.slice(0, 36)) + '</td>' +
        '<td>' + escapeHtml(it.overflowY || '') + '</td>' +
        '<td>' + escapeHtml(it.overflowX || '') + '</td>' +
        '<td>' + (it.scrollHeight || '-') + '</td>' +
        '<td>' + (it.clientHeight || '-') + '</td>' +
        '<td>' + (it.rectW || '-') + '×' + (it.rectH || '-') + '</td>' +
        '<td class="' + visibleCls + '">' + (it.isVisible ? '✅' : '❌') + '</td>' +
        '</tr>';
    }
    allScrollableTableBody.innerHTML = html;
    allScrollableTableWrap.classList.add('visible');
    document.getElementById('diagAllScrollable').open = true;
  }

  /* ─── 结果展示 ─── */

  /**
   * 用徽标更新 DOM 文本
   * @param {string} id - DOM 元素 ID
   * @param {string} text - 显示文本
   * @param {string} cls - 颜色类名
   */
  function setResultText(id, text, cls) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'result-value ' + (cls || '');
  }

  /**
   * 更新概要结果卡片
   * @param {Object} r - 完整的诊断结果对象
   */
  function showResult(r) {
    if (!resultCard) return;

    // 概要信息
    var s = r.summary || {};
    setResultText('rContainer', s.containerFound ? '✅ 找到' : '❌ 未找到', s.containerFound ? 'success' : 'fail');
    setResultText('rScroll', s.canScroll ? '✅ 可滚动' : '⏹️ 已到底或无法滚动', s.canScroll ? 'success' : 'warn');
    setResultText('rEndOfList', s.endOfList ? '✅ 已到底' : '❌ 未到底', s.endOfList ? 'success' : 'fail');
    setResultText('rDocCount', String(r.docContextCount || 0));
    setResultText('rFrameCount', String((r.frames && r.frames.length) || 0));

    resultCard.classList.add('visible');

    // 诊断结论
    renderDiagnosis(r.diagnosis);

    // Iframe 表
    renderFrameTable(r.frames);

    // 候选容器表
    renderCandidateTable(r.scrollCandidates);

    // 暴力扫描表
    renderAllScrollableTable(r.allScrollable);
  }

  /* ─── 核心测试逻辑 ─── */

  /**
   * 发送滚动测试命令到 Service Worker → Content Script
   * @returns {Promise<void>}
   */
  async function runScrollTest() {
    // 禁用按钮 + 更新状态
    btnScrollTest.disabled = true;
    btnScrollTest.textContent = '⏳ 深度诊断中...';
    showHint('info', '正在执行深度滚动诊断，请稍候...');
    resetDiagnostics();
    resetLog();
    addLog('发送深度诊断命令...');

    try {
      var result = await chrome.runtime.sendMessage({ action: ACTION_DEBUG_SCROLL_TEST });
      addLog('收到响应: ' + JSON.stringify({
        ok: result.ok,
        summary: result.summary,
        docContextCount: result.docContextCount,
        framesCount: result.frames ? result.frames.length : 0,
        scrollCandidatesCount: result.scrollCandidates ? result.scrollCandidates.length : 0,
        allScrollableCount: result.allScrollable ? result.allScrollable.length : 0,
        diagnosis: result.diagnosis ? result.diagnosis.slice(0, 100) + '...' : '',
      }), 'log-result');

      if (!result || !result.ok) {
        var errMsg = (result && result.error) || '未知错误';
        addLog('诊断失败: ' + errMsg, 'log-error');
        showHint('error', '❌ 深度诊断失败：<strong>' + errMsg + '</strong>');
        return;
      }

      // 展示概要
      var s = result.summary || {};
      var containerText = s.containerFound ? '找到可滚动容器' : '未找到候选容器';
      var scrollText = s.canScroll ? '滚动成功' : '无法继续滚动';
      var frameText = (result.frames && result.frames.length > 0) ? (result.frames.length + ' 个 iframe') : '无 iframe';
      var summaryHtml = '✅ ' + containerText + '，' + scrollText + '（' + frameText + '）';
      addLog('结果摘要: ' + summaryHtml, 'log-result');

      // 展示所有结果
      showResult(result);

      // 诊断成功 → 显示"测试滚动"按钮
      var btnNow = document.getElementById('btnScrollNow');
      if (btnNow) {
        btnNow.style.display = 'block';
        btnNow.disabled = false;
        btnNow.textContent = '⬇️ 测试 iframe 滚动';
      }

      showHint('success', summaryHtml);

      // 在日志中输出诊断结论
      if (result.diagnosis) {
        addLog('━━━ 诊断结论 ━━━', 'log-result');
        var lines = result.diagnosis.split('\n');
        for (var i = 0; i < lines.length; i++) {
          var lineCls = 'log-debug';
          if (lines[i].startsWith('🔴')) lineCls = 'log-error';
          else if (lines[i].startsWith('🟢')) lineCls = 'log-result';
          else if (lines[i].startsWith('🟡') || lines[i].startsWith('⚠️')) lineCls = 'log-warn';
          addLog(lines[i], lineCls);
        }
      }

    } catch (err) {
      addLog('通信异常: ' + err.message, 'log-error');
      showHint('error', '❌ 通信失败：<strong>' + err.message + '</strong><br>请确保：<br>• 已在 BOSS 直聘推荐页面<br>• 扩展已加载完成');
    } finally {
      btnScrollTest.disabled = false;
      btnScrollTest.textContent = '🔄 深度诊断';
    }
  }

  /* ─── 滚动测试（手动触发） ─── */

  /**
   * 显示滚动测试结果
   * @param {Object} r - 滚动测试结果
   */
  function showScrollTestResult(r) {
    var setText = function(id, val, cls) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = val;
      if (cls) el.className = 'result-value ' + cls;
    };
    setText('stContainer', r.containerName || 'iframe:recommendFrame');
    setText('stBefore', String(r.beforeScrollTop));
    setText('stAfter', String(r.afterScrollTop));
    setText('stScrollH', String(r.scrollHeight));
    setText('stClientH', String(r.clientHeight));
    setText('stScrolled', r.scrolled ? '✅ 已滚动' : '❌ 未滚动', r.scrolled ? 'success' : 'fail');
    setText('stCanScroll', r.canScroll ? '✅ 成功' : '❌ 失败', r.canScroll ? 'success' : 'fail');

    var resultBox = document.getElementById('scrollTestResult');
    if (resultBox) resultBox.style.display = 'block';
    document.getElementById('diagScrollTest').open = true;
  }

  /**
   * 执行手动滚动测试（发送命令到 CS 操作 iframe body）
   */
  async function runScrollNow() {
    var btn = document.getElementById('btnScrollNow');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = '⏳ 滚动执行中...';
    addLog('发送手动滚动命令...');

    try {
      var result = await chrome.runtime.sendMessage({ action: 'cmd_debug_scroll_now' });
      addLog('收到滚动结果: ' + JSON.stringify({
        ok: result.ok,
        scrolled: result.scrolled,
        before: result.beforeScrollTop,
        after: result.afterScrollTop,
        canScroll: result.canScroll,
      }), 'log-result');

      if (!result || !result.ok) {
        var errMsg = (result && result.error) || '未知错误';
        addLog('滚动失败: ' + errMsg, 'log-error');
        showHint('error', '❌ 滚动操作失败：<strong>' + errMsg + '</strong>');
        return;
      }

      showScrollTestResult(result);
      if (result.scrolled) {
        var movedBy = result.afterScrollTop - result.beforeScrollTop;
        addLog('✅ 滚动成功: 从 ' + result.beforeScrollTop + ' 到 ' + result.afterScrollTop + '（移动 ' + movedBy + 'px）', 'log-result');
        showHint('success', '✅ 滚动成功，页面已下移 ' + movedBy + 'px');
      } else {
        addLog('❌ 滚动后 scrollTop 未变化（可能已到底部）', 'log-warn');
        showHint('warn' in window ? 'warn' : 'info', '❌ scrollTop 未变化，列表可能已到底部或滚动目标不正确');
      }
    } catch (err) {
      addLog('通信异常: ' + err.message, 'log-error');
      showHint('error', '❌ 通信失败：<strong>' + err.message + '</strong>');
    } finally {
      btn.disabled = false;
      btn.textContent = '⬇️ 测试 iframe 滚动';
    }
  }

  /**
   * 检测当前页面是否为 BOSS 直聘推荐页面
   * 通过 chrome.tabs.query 检查活跃标签页的 URL
   * @returns {Promise<boolean>}
   */
  async function checkActiveTab() {
    try {
      var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      var tab = tabs && tabs[0];
      if (!tab || !tab.url) return false;
      var url = tab.url.toLowerCase();
      return url.indexOf('zhipin.com') !== -1 && (url.indexOf('/web/geek/recommend') !== -1 || url.indexOf('/web/chat/recommend') !== -1 || url.indexOf('/web/chat') !== -1);
    } catch (e) {
      return false;
    }
  }

  /**
   * 更新按钮状态（根据当前页面是否匹配）
   */
  async function updateButtonState() {
    var onBossPage = await checkActiveTab();
    btnScrollTest.disabled = !onBossPage;
    if (onBossPage) {
      btnScrollTest.textContent = '🔄 深度诊断';
      showHint('info', '已检测到 BOSS 直聘页面，可以执行深度诊断。');
    } else {
      btnScrollTest.textContent = '⚠️ 请在 BOSS 直聘推荐页面执行';
      showHint('info', '请在 <strong>BOSS 直聘推荐页面</strong>（<code>/web/geek/recommend</code>）使用此调试工具。');
      // 不在推荐页时隐藏滚动测试按钮
      var btnNow = document.getElementById('btnScrollNow');
      if (btnNow) btnNow.style.display = 'none';
    }
  }

  /* ─── 初始化 ─── */

  document.addEventListener('DOMContentLoaded', async function () {
    // 缓存 DOM 引用
    btnScrollTest = document.getElementById('btnScrollTest');
    resultCard = document.getElementById('resultCard');
    logContainer = document.getElementById('logContainer');
    hintInfo = document.getElementById('hintInfo');
    hintSuccess = document.getElementById('hintSuccess');
    hintError = document.getElementById('hintError');

    // 滚动测试按钮
    var btnScrollNow = document.getElementById('btnScrollNow');
    if (btnScrollNow) {
      btnScrollNow.addEventListener('click', runScrollNow);
    }

    // 诊断 DOM
    diagnosisBox = document.getElementById('diagnosisBox');
    frameTableBody = document.getElementById('frameTableBody');
    frameTableWrap = document.getElementById('frameTableWrap');
    candidateTableBody = document.getElementById('candidateTableBody');
    candidateTableWrap = document.getElementById('candidateTableWrap');
    allScrollableTableBody = document.getElementById('allScrollableTableBody');
    allScrollableTableWrap = document.getElementById('allScrollableTableWrap');

    if (!btnScrollTest) return;

    // 绑定测试按钮
    btnScrollTest.addEventListener('click', runScrollTest);

    // 绑定"读取卡片/按钮结构"按钮
    var btnInspectGreet = document.getElementById('btnInspectGreet');
    if (btnInspectGreet) btnInspectGreet.addEventListener('click', runInspectGreet);

    // 检测当前页面
    await updateButtonState();
  });
})();
