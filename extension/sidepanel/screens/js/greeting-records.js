/**
 * 打招呼记录页面脚本
 * 展示打招呼任务的历史记录，支持分页和CSV导出
 */
(function(){ 'use strict';

const PAGE_SIZE = 20;
let currentPage = 1;
let totalRecords = 0;

/**
 * 发送消息到 Service Worker
 * @param {string} action - 消息动作名称
 * @param {*} data - 消息数据
 * @returns {Promise<*>}
 */
async function qsw(action, data) {
  const result = await chrome.runtime.sendMessage({ action, data, requestId: 'grec_' + Date.now() });
  return result;
}

/** 转义HTML特殊字符，防止XSS */
function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text || '';
  return d.innerHTML;
}

/**
 * 加载指定页的记录数据并渲染
 * @param {number} page - 页码，从1开始
 */
async function loadPage(page) {
  currentPage = page;
  try {
    const result = await qsw('cmd_get_greeting_records', { page, pageSize: PAGE_SIZE });
    if (result) {
      totalRecords = result.total || 0;
      renderTable(result.records || [], result.total || 0);
    } else {
      renderTable([], 0);
    }
  } catch (err) {
    console.error('加载打招呼记录失败:', err);
    renderTable([], 0);
  }
}

/**
 * 渲染记录表格
 * @param {Array} records - 记录数据数组
 * @param {number} total - 总记录数
 */
function renderTable(records, total) {
  const thead = document.getElementById('tableHead');
  const tbody = document.getElementById('tableBody');
  const title = document.getElementById('recordTitle');
  const emptyState = document.getElementById('emptyState');

  title.textContent = `打招呼记录${total > 0 ? ` (${total})` : ''}`;
  tbody.innerHTML = '';

  if (records.length === 0) {
    thead.innerHTML = '';
    emptyState.style.display = 'block';
    document.getElementById('paginatorArea').style.display = 'none';
    return;
  }
  emptyState.style.display = 'none';

  // 渲染表头：姓名 | 岗位 | 匹配关键词 | 沟通时间
  thead.innerHTML = '<th style="width:22%">姓名</th><th style="width:30%">岗位</th><th style="width:25%">匹配关键词</th><th style="width:23%">沟通时间</th>';

  records.forEach(rec => {
    const tr = document.createElement('tr');
    const keywords = Array.isArray(rec.matchedKeywords) ? rec.matchedKeywords.join('、') : (rec.matchedKeywords || '');
    tr.innerHTML = `
      <td class="record-name">${escapeHtml(rec.name || '未知')}</td>
      <td class="record-job">${escapeHtml(rec.positionName || rec.jobName || '-')}</td>
      <td class="record-keywords">${escapeHtml(keywords || '-')}</td>
      <td class="record-time">${escapeHtml(rec.completeTime || '')}</td>
    `;
    tbody.appendChild(tr);
  });

  // 渲染分页
  renderPaginator(total);
}

/**
 * 渲染分页器
 * @param {number} total - 总记录数
 */
function renderPaginator(total) {
  const area = document.getElementById('paginatorArea');
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) { area.style.display = 'none'; return; }
  area.style.display = 'flex';
  area.innerHTML = '';

  const prev = document.createElement('button');
  prev.className = 'page-btn'; prev.textContent = '‹';
  prev.disabled = currentPage <= 1;
  prev.addEventListener('click', () => loadPage(currentPage - 1));
  area.appendChild(prev);

  for (let p = 1; p <= totalPages; p++) {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (p === currentPage ? ' active' : '');
    btn.textContent = p;
    btn.addEventListener('click', () => loadPage(p));
    area.appendChild(btn);
  }

  const next = document.createElement('button');
  next.className = 'page-btn'; next.textContent = '›';
  next.disabled = currentPage >= totalPages;
  next.addEventListener('click', () => loadPage(currentPage + 1));
  area.appendChild(next);
}

/** 导出记录为 CSV 文件 */
async function exportCSV() {
  try {
    const result = await qsw('cmd_export_greeting_records');
    if (result?.csv) {
      const dataUrl = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(result.csv);
      chrome.downloads.download({
        url: dataUrl,
        filename: result.filename || '打招呼记录.csv',
        saveAs: true
      });
    }
  } catch (err) { console.error('导出失败:', err); }
}

document.addEventListener('DOMContentLoaded', () => {
  loadPage(1);
  document.getElementById('btnExport').addEventListener('click', exportCSV);
});

})();
