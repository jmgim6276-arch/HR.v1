/**
 * 运行记录合并页（设计层合并，不动数据）。
 * 打招呼记录 与 回复记录 是两个独立叶子页（各读各的记录 key），
 * 此处用分段切换在同一页内嵌套展示。
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
