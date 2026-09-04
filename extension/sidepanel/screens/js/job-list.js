/**
 * 岗位配置页面脚本
 * 管理招聘岗位列表，支持新增、编辑、复制、删除和启用/禁用
 */
(function() {
  'use strict';

  const JOBS_KEY = 'jobConfigs';
  let jobs = [];

  /**
   * 从 chrome.storage 加载岗位列表
   */
  async function loadJobs() {
    try {
      const result = await chrome.storage.local.get(JOBS_KEY);
      jobs = result[JOBS_KEY] || [];
    } catch (err) {
      console.error('加载岗位配置失败:', err);
      jobs = [];
    }
    renderJobs();
  }

  /**
   * 将岗位列表保存到 chrome.storage
   */
  async function saveJobs() {
    try {
      await chrome.storage.local.set({ [JOBS_KEY]: jobs });
    } catch (err) { console.error(err); }
  }

  /**
   * 渲染所有岗位卡片
   */
  function renderJobs() {
    const list = document.getElementById('jobList');
    const empty = document.getElementById('emptyState');
    const title = document.getElementById('jobTitle');
    list.innerHTML = '';
    if (jobs.length === 0) {
      empty.style.display = 'block';
      title.textContent = '岗位配置';
      return;
    }
    empty.style.display = 'none';
    title.textContent = `岗位配置 (${jobs.length})`;

    jobs.forEach((job) => {
      const card = document.createElement('div');
      card.className = 'job-item' + (job.enabled === false ? ' inactive' : '');
      card.innerHTML = `
        <div class="job-header">
          <div class="job-name">${escapeHtml(job.name)}</div>
          <label class="status-toggle">
            <input type="checkbox" ${job.enabled !== false ? 'checked' : ''} data-job-id="${job.id}">
            <span class="slider"></span>
          </label>
        </div>
        <div class="job-actions">
          <span class="action-icon info" data-action="detail" data-job-id="${job.id}">详情</span>
          <span class="action-icon" data-action="copy" data-job-id="${job.id}">复制</span>
          <span class="action-icon" data-action="edit" data-job-id="${job.id}">编辑</span>
          <span class="action-icon danger" data-action="delete" data-job-id="${job.id}">删除</span>
        </div>
      `;
      list.appendChild(card);
    });

    // 绑定开关事件
    document.querySelectorAll('.job-item input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', async () => {
        const job = jobs.find(j => j.id === cb.dataset.jobId);
        if (job) {
          job.enabled = cb.checked;
          await saveJobs();
          // 更新禁用态样式
          const item = cb.closest('.job-item');
          if (item) item.classList.toggle('inactive', !cb.checked);
        }
      });
    });
  }

  /**
   * 跳转到匹配规则配置页
   * @param {string} jobId - 岗位ID，null 表示新建
   */
  function navigateToConfig(jobId) {
    const src = jobId ? 'screens/greeting-config.html?jobId=' + jobId : 'screens/greeting-config.html';
    try {
      window.parent.postMessage({ type: 'NAVIGATE', src: src }, '*');
    } catch (e) {
      // 降级：通过 URL hash 或直接导航
      console.error('导航失败:', e);
    }
  }

  /**
   * 复制岗位配置（深拷贝并追加"（副本）"）
   * @param {string} id - 岗位 ID
   */
  async function copyJob(id) {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    const copy = JSON.parse(JSON.stringify(job));
    copy.id = 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    copy.name = job.name + '（副本）';
    copy.enabled = true;
    jobs.push(copy);
    await saveJobs();
    renderJobs();
    showToast('✅ 已复制');
  }

  /**
   * 删除岗位配置
   * @param {string} id - 岗位 ID
   */
  async function deleteJob(id) {
    showConfirmDialog('确定要删除该岗位配置吗？', async () => {
      const job = jobs.find(j => j.id === id);
      jobs = jobs.filter(j => j.id !== id);
      await saveJobs();
      // 同步删除同名回复设置（审查 F4）：否则"删全部岗位"后 rpc 遗留启用条目会翻成幽灵白名单
      try {
        const r = await chrome.storage.local.get('replyPositionConfigs');
        const list = (r.replyPositionConfigs || []).filter(c => (c.name || '') !== ((job && job.name) || ''));
        await chrome.storage.local.set({ replyPositionConfigs: list });
      } catch (e) { console.error(e); }
      renderJobs();
      showToast('✅ 已删除');
    });
  }

  /** 转义 HTML 特殊字符 */
  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
  }

  /** 显示 Toast 提示消息 */
  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 2500);
  }

  /* 确认弹窗 */
  let _confirmCallback = null;

  /**
   * 显示自定义确认弹窗
   * @param {string} message - 确认消息
   * @param {Function} onConfirm - 确认后的回调函数
   */
  function showConfirmDialog(message, onConfirm) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'flex';
    _confirmCallback = onConfirm;
  }

  /**
   * 跳转到岗位详情（只读模式，复用 greeting-config 页面）
   * @param {string} jobId - 岗位 ID
   */
  function navigateToDetail(jobId) {
    const src = 'screens/greeting-config.html?jobId=' + jobId + '&readonly=true';
    try {
      window.parent.postMessage({ type: 'NAVIGATE', src: src }, '*');
    } catch (e) {
      console.error('导航失败:', e);
    }
  }

  // DOM 就绪时初始化
  document.addEventListener('DOMContentLoaded', () => {
    // 确认弹窗按钮事件
    document.getElementById('confirmCancel').addEventListener('click', () => {
      document.getElementById('confirmModal').style.display = 'none';
      _confirmCallback = null;
    });
    document.getElementById('confirmOk').addEventListener('click', () => {
      document.getElementById('confirmModal').style.display = 'none';
      if (typeof _confirmCallback === 'function') {
        const cb = _confirmCallback;
        _confirmCallback = null;
        cb();
      }
    });
    document.getElementById('confirmModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        document.getElementById('confirmModal').style.display = 'none';
        _confirmCallback = null;
      }
    });

    loadJobs();

    // 新增岗位配置按钮
    document.getElementById('btnAddJob').addEventListener('click', () => navigateToConfig(null));

    // 通过事件委托绑定操作按钮
    document.getElementById('jobList').addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      const action = actionEl.dataset.action;
      const jobId = actionEl.dataset.jobId;
      if (action === 'detail') navigateToDetail(jobId);
      else if (action === 'copy') copyJob(jobId);
      else if (action === 'edit') navigateToConfig(jobId);
      else if (action === 'delete') deleteJob(jobId);
    });
  });

})();
