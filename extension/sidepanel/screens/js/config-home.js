/**
 * 岗位配置启动器（合并面板）。
 * 两张卡片分别跳转 打招呼配置(job-list) / 回复配置(reply-position-config)。
 * 通过 shell 的 NAVIGATE 消息让 content-frame 整页跳转，保留各页内部后续导航。
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
