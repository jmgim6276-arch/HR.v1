/**
 * 拟人频率合并页（设计层合并，不动数据）。
 * 打招呼频率(greetingTimeConfig) 与 回复频率(timeConfig) 是两个独立叶子页，
 * 此处用分段切换在同一页内嵌套展示；两页各自读写各自 key，互不干扰。
 */
(function () {
  'use strict';
  const frame = document.getElementById('subframe');
  document.querySelectorAll('.seg button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.seg button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.frame;
      if (frame && target && !frame.getAttribute('src').endsWith(target)) frame.setAttribute('src', target);
    });
  });
})();
