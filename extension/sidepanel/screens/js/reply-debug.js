/**
 * 调试设置页面逻辑
 * 外部 JS 文件（CSP 合规，替代内联脚本）
 *
 * 功能：设置候选人姓名过滤，启用后只处理指定候选人的消息
 */
(function () {
  'use strict';

  /** Storage 键名 */
  const DEV_NAME_FILTER_KEY = 'devNameFilter';
  const DEV_MODE_KEY = 'devMode';

  /**
   * 更新页面状态显示
   * 根据当前存储的姓名过滤值，更新状态指示灯和文字
   * @param {string} name - 当前设置的过滤姓名（空字符串表示无过滤）
   */
  function updateStatus(name) {
    const dot = document.getElementById('statusDot');
    const label = document.getElementById('statusLabel');

    if (name && name.trim()) {
      // 有过滤姓名 → 显示绿色激活状态
      dot.className = 'status-dot active';
      label.innerHTML = '当前已设置姓名过滤：<span class="status-name">' + escapeHtml(name.trim()) + '</span> — 仅处理此候选人的消息';
    } else {
      // 无过滤姓名 → 显示灰色未激活状态
      dot.className = 'status-dot inactive';
      label.textContent = '当前未设置姓名过滤，将处理所有候选人';
    }
  }

  /**
   * 加载当前存储的姓名过滤值并更新页面
   */
  async function loadNameFilter() {
    try {
      const result = await chrome.storage.local.get([DEV_NAME_FILTER_KEY]);
      const name = result[DEV_NAME_FILTER_KEY] || '';
      document.getElementById('nameFilterInput').value = name;
      updateStatus(name);
    } catch (err) {
      console.error('[调试] 加载姓名过滤配置失败:', err);
    }
  }

  /**
   * 保存姓名过滤值
   */
  async function saveNameFilter() {
    const name = document.getElementById('nameFilterInput').value.trim();
    try {
      await chrome.storage.local.set({ [DEV_NAME_FILTER_KEY]: name });
      updateStatus(name);
      showToast(name ? '✅ 已设置姓名过滤：' + name : '✅ 已清除姓名过滤');
    } catch (err) {
      showToast('❌ 保存失败: ' + err.message);
    }
  }

  /**
   * 清除姓名过滤
   */
  async function clearNameFilter() {
    document.getElementById('nameFilterInput').value = '';
    try {
      await chrome.storage.local.set({ [DEV_NAME_FILTER_KEY]: '' });
      updateStatus('');
      showToast('✅ 已清除姓名过滤');
    } catch (err) {
      showToast('❌ 清除失败: ' + err.message);
    }
  }

  /**
   * Toast 提示
   */
  let _toastTimer = null;

  function showToast(msg, duration = 2500) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { el.style.opacity = '0'; }, duration);
  }

  /**
   * HTML 转义
   * @param {string} text - 原始文本
   * @returns {string} 转义后的安全 HTML
   */
  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
  }

  /**
   * 初始化
   */
  document.addEventListener('DOMContentLoaded', async () => {
    // 保存按钮
    document.getElementById('btnSave').addEventListener('click', saveNameFilter);

    // 清除按钮
    document.getElementById('btnClear').addEventListener('click', clearNameFilter);

    // 支持回车键保存
    document.getElementById('nameFilterInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveNameFilter();
      }
    });

    // 加载配置
    await loadNameFilter();
  });
})();
