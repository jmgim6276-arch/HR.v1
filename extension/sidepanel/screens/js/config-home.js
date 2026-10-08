/**
 * 岗位配置启动器（合并面板）。
 * 通过岗位配置卡片进入统一的 job-list 页面。
 * 使用 shell 的 NAVIGATE 消息让 content-frame 整页跳转。
 */
(function () {
  'use strict';
  document.querySelectorAll('.cfg-card').forEach(card => {
    card.addEventListener('click', () => {
      try {
        window.parent.postMessage({ type: 'NAVIGATE', src: card.dataset.target }, '*');
      } catch (e) { /* 静默 */ }
    });
  });
})();
