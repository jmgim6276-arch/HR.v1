(function(){ 'use strict';

const PAGE_SIZE = 20;
let currentPage = 1;
let totalRecords = 0;

async function qsw(action, data) {
  const result = await chrome.runtime.sendMessage({ action, data, requestId: 'rec_' + Date.now() });
  return result;
}

async function loadPage(page) {
  currentPage = page;
  try {
    const result = await qsw('cmd_get_records', { page, pageSize: PAGE_SIZE });
    // result 可能为 undefined（无响应），此时也渲染空状态
    if (result) {
      totalRecords = result.total || 0;
      renderTable(result.records || [], result.total || 0);
    } else {
      renderTable([], 0);
    }
  } catch (err) {
    console.error('加载记录失败:', err);
    renderTable([], 0);
  }
}

function renderTable(records, total) {
  const thead = document.getElementById('tableHead');
  const tbody = document.getElementById('tableBody');
  const title = document.getElementById('recordTitle');
  const emptyState = document.getElementById('emptyState');

  title.textContent = `沟通记录${total > 0 ? ` (${total})` : ''}`;
  tbody.innerHTML = '';

  if (records.length === 0) {
    thead.innerHTML = '';
    emptyState.style.display = 'block';
    document.getElementById('paginatorArea').style.display = 'none';
    return;
  }
  emptyState.style.display = 'none';

  // 固定表头：姓名、岗位、沟通时间
  thead.innerHTML = '<th style="width:15%">姓名</th><th style="width:20%">岗位</th><th style="width:20%">沟通时间</th>';

  records.forEach(rec => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="record-name">${escapeHtml(rec.name || '未知')}</td>
      <td class="record-job">${escapeHtml(rec.positionName || '-')}</td>
      <td class="record-time">${escapeHtml(rec.completeTime || '')}</td>
    `;
    tbody.appendChild(tr);
  });

  // 分页
  renderPaginator(total);
}

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

async function exportCSV() {
  try {
    const result = await qsw('cmd_export_records');
    if (result?.csv) {
      const dataUrl = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(result.csv);
      chrome.downloads.download({ url: dataUrl, filename: result.filename || '沟通记录.csv', saveAs: true });
    }
  } catch (err) { console.error('导出失败:', err); }
}

function escapeHtml(text) { const d = document.createElement('div'); d.textContent = text || ''; return d.innerHTML; }

document.addEventListener('DOMContentLoaded', () => {
  loadPage(1);
  document.getElementById('btnExport').addEventListener('click', exportCSV);
});

})();
