/**
 * 岗位配置页面逻辑
 * 外部 JS 文件（CSP 合规，替代内联脚本）
 * 管理自动回复的岗位级别配置列表，支持新增、复制、编辑、删除、启停
 */
(function () {
  'use strict';

  /** 存储键 */
  const CONFIG_KEY = 'replyPositionConfigs';
  const KB_KEY = 'generalKnowledgeBase';
  const DEFAULT_AUTO_REPLY_LIMIT = 5;
  const MAX_AUTO_REPLY_LIMIT = 20;

  /** 当前数据 */
  let configs = [];
  let editingId = null; // 编辑中的配置 ID，null 表示新增
  let deleteCallback = null;
  let chatHistory = []; // 大模型测试对话的历史
  let chatPositionIndex = -1; // 当前测试对话的岗位配置索引

  /* ========== 数据加载/保存 ========== */

  /**
   * 从 chrome.storage 加载岗位配置列表
   */
  async function loadConfigs() {
    try {
      const result = await chrome.storage.local.get(CONFIG_KEY);
      configs = result[CONFIG_KEY] || [];
      if (!Array.isArray(configs)) configs = [];
      let migrated = false;
      configs = configs.map((cfg) => {
        const normalizedLimit = normalizeAutoReplyLimit(cfg.autoReplyLimit);
        if (cfg.autoReplyLimit !== normalizedLimit) migrated = true;
        return { ...cfg, autoReplyLimit: normalizedLimit };
      });
      if (migrated) await saveConfigs();
      renderList();
    } catch (err) { console.error('加载岗位配置失败:', err); }
  }

  /**
   * 保存岗位配置列表到 chrome.storage
   */
  async function saveConfigs() {
    try {
      await chrome.storage.local.set({ [CONFIG_KEY]: configs });
    } catch (err) { console.error('保存岗位配置失败:', err); }
  }

  /**
   * 生成唯一 ID
   */
  function generateId() {
    return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  /* ========== 渲染 ========== */

  /**
   * 渲染岗位配置列表
   */
  function renderList() {
    const list = document.getElementById('configList');
    const empty = document.getElementById('emptyState');
    list.innerHTML = '';

    if (configs.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    configs.forEach((cfg, index) => {
      const card = document.createElement('div');
      card.className = 'config-card' + (cfg.enabled === false ? ' disabled' : '');
      card.dataset.index = index;

      card.innerHTML = `
        <label class="switch-sm" style="margin-top:2px" title="${cfg.enabled === false ? '已停用，点击启用' : '已启用，点击停用'}">
          <input type="checkbox" class="toggle-enabled" data-index="${index}" ${cfg.enabled !== false ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <div class="config-card-info">
          <div class="config-card-name">
            ${escapeHtml(cfg.name || '未命名')}
            <span class="badge" style="font-size:11px;color:var(--muted)">${cfg.enabled === false ? '已停用' : '已启用'}</span>
          </div>
          <div class="config-card-meta">执行顺序 ${index + 1} · 本轮最多自动回复 ${normalizeAutoReplyLimit(cfg.autoReplyLimit)} 人</div>
        </div>
        <div class="config-card-actions config-card-actions-lg">
          <button class="btn-icon icon-lg" data-action="view" data-index="${index}" title="查看详情">👁</button>
          <button class="btn-icon icon-lg" data-action="edit" data-index="${index}" title="编辑">✏️</button>
          <button class="btn-icon icon-lg" data-action="chat" data-index="${index}" title="测试大模型对话" style="color:var(--accent)">💬</button>
          <button class="btn-icon icon-lg" data-action="copy" data-index="${index}" title="复制">📋</button>
          <button class="btn-icon icon-lg danger" data-action="delete" data-index="${index}" title="删除">🗑</button>
        </div>
      `;
      list.appendChild(card);
    });
  }

  /* ========== CRUD 操作 ========== */

  /**
   * 打开新增模态框
   */
  function openAddModal() {
    editingId = null;
    document.getElementById('editModalTitle').textContent = '新增岗位配置';
    resetEditForm({ name: '', autoReplyLimit: DEFAULT_AUTO_REPLY_LIMIT, keywordReply: false, aiReply: true, positionKnowledgeBase: '', greetingMessages: [] });
    document.getElementById('editModal').classList.add('active');
  }

  /**
   * 打开编辑模态框
   * @param {number} index - 配置在数组中的索引
   */
  function openEditModal(index) {
    const cfg = configs[index];
    if (!cfg) return;
    editingId = cfg.id;
    document.getElementById('editModalTitle').textContent = '编辑岗位配置';
    resetEditForm(cfg);
    document.getElementById('editModal').classList.add('active');
  }

  /**
   * 重置编辑表单
   * @param {Object} cfg - 配置数据
   */
  function resetEditForm(cfg) {
    document.getElementById('editName').value = cfg.name || '';
    document.getElementById('editAutoReplyLimit').value = normalizeAutoReplyLimit(cfg.autoReplyLimit);
    setAutoReplyLimitValidity(true);
    document.getElementById('editKeywordReply').checked = cfg.keywordReply === true;
    document.getElementById('editAiReply').checked = cfg.aiReply !== false;
    document.getElementById('editKnowledgeBase').value = cfg.positionKnowledgeBase || '';
    renderGreetingList(cfg.greetingMessages || []);
  }

  /**
   * 关闭编辑模态框
   */
  function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editingId = null;
  }

  /**
   * 从编辑表单收集数据
   * @returns {Object} 配置数据
   */
  function collectFormData() {
    const name = document.getElementById('editName').value.trim();
    const autoReplyLimit = Number(document.getElementById('editAutoReplyLimit').value);
    const keywordReply = document.getElementById('editKeywordReply').checked;
    const aiReply = document.getElementById('editAiReply').checked;

    // 收集话术
    const greetingItems = document.querySelectorAll('#greetingList .greeting-item textarea');
    const greetingMessages = [];
    greetingItems.forEach(ta => {
      const val = ta.value.trim();
      if (val) greetingMessages.push(val);
    });

    const positionKnowledgeBase = document.getElementById('editKnowledgeBase').value.trim();

    return { name, autoReplyLimit, keywordReply, aiReply, positionKnowledgeBase, greetingMessages };
  }

  /**
   * 保存当前编辑的配置
   */
  function saveCurrentConfig() {
    const data = collectFormData();

    // 校验：岗位名称必填
    if (!data.name) {
      showToast('❌ 请填写岗位名称');
      document.getElementById('editName').focus();
      return;
    }

    if (!Number.isInteger(data.autoReplyLimit) || data.autoReplyLimit < 1 || data.autoReplyLimit > MAX_AUTO_REPLY_LIMIT) {
      setAutoReplyLimitValidity(false);
      showToast(`❌ 自动回复人数须为 1–${MAX_AUTO_REPLY_LIMIT} 的整数`);
      document.getElementById('editAutoReplyLimit').focus();
      return;
    }
    setAutoReplyLimitValidity(true);

    if (editingId) {
      // 编辑已有配置
      const index = configs.findIndex(c => c.id === editingId);
      if (index !== -1) {
        configs[index] = { ...configs[index], ...data };
      }
    } else {
      // 新增配置
      const newConfig = {
        id: generateId(),
        name: data.name,
        autoReplyLimit: data.autoReplyLimit,
        enabled: true,
        keywordReply: data.keywordReply,
        aiReply: data.aiReply,
        positionKnowledgeBase: data.positionKnowledgeBase,
        greetingMessages: data.greetingMessages,
      };
      configs.push(newConfig);
    }

    saveConfigs();
    renderList();
    closeEditModal();
    showToast('✅ 配置已保存');
  }

  /**
   * 复制岗位配置
   * @param {number} index - 配置索引
   */
  function copyConfig(index) {
    const cfg = configs[index];
    if (!cfg) return;
    const clone = { ...cfg, id: generateId(), name: cfg.name + ' (副本)', enabled: false };
    configs.push(clone);
    saveConfigs();
    renderList();
    showToast('📋 已复制岗位配置');
  }

  /**
   * 删除岗位配置
   * @param {number} index - 配置索引
   */
  function deleteConfig(index) {
    const cfg = configs[index];
    if (!cfg) return;
    showConfirmDialog(`确定要删除岗位配置「${escapeHtml(cfg.name)}」吗？`, () => {
      configs.splice(index, 1);
      saveConfigs();
      renderList();
      showToast('✅ 配置已删除');
    });
  }

  /**
   * 切换配置启用/停用状态
   * @param {number} index - 配置索引
   * @param {boolean} enabled - 是否启用
   */
  function toggleEnabled(index, enabled) {
    if (configs[index]) {
      configs[index].enabled = enabled;
      saveConfigs();
      renderList();
    }
  }

  /* ========== 话术管理 ========== */

  /**
   * 渲染话术列表（编辑模态框内）
   * @param {string[]} messages - 话术数组
   */
  function renderGreetingList(messages) {
    const list = document.getElementById('greetingList');
    list.innerHTML = '';
    if (!messages || messages.length === 0) {
      list.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:8px 0">暂无话术，点击上方「添加话术」按钮添加</div>';
      return;
    }
    messages.forEach((msg, i) => {
      const item = document.createElement('div');
      item.className = 'greeting-item';
      item.innerHTML = `
        <div class="greeting-num">${i + 1}</div>
        <textarea placeholder="输入话术内容...">${escapeHtml(msg)}</textarea>
        <button class="remove-greeting" title="删除此条话术">✕</button>
      `;
      list.appendChild(item);

      // 绑定删除事件
      item.querySelector('.remove-greeting').addEventListener('click', () => {
        item.remove();
        reindexGreetingNumbers();
      });

      // 绑定输入事件自动更新
      item.querySelector('textarea').addEventListener('input', () => {
        // 输入时无需操作，保存时统一收集
      });
    });
  }

  /**
   * 重新编号话术序号
   */
  function reindexGreetingNumbers() {
    const items = document.querySelectorAll('#greetingList .greeting-item');
    items.forEach((item, i) => {
      item.querySelector('.greeting-num').textContent = i + 1;
    });
  }

  /**
   * 添加一条话术
   */
  function addGreeting() {
    const list = document.getElementById('greetingList');
    // 移除空状态提示
    if (list.children.length === 1 && list.children[0].tagName === 'DIV' && !list.children[0].classList.contains('greeting-item')) {
      list.innerHTML = '';
    }
    const item = document.createElement('div');
    item.className = 'greeting-item';
    const num = list.children.length + 1;
    item.innerHTML = `
      <div class="greeting-num">${num}</div>
      <textarea placeholder="输入话术内容..."></textarea>
      <button class="remove-greeting" title="删除此条话术">✕</button>
    `;
    list.appendChild(item);

    item.querySelector('.remove-greeting').addEventListener('click', () => {
      item.remove();
      reindexGreetingNumbers();
    });

    // 聚焦新添加的话术
    setTimeout(() => {
      item.querySelector('textarea').focus();
      item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  /* ========== 大模型对话测试弹窗 ========== */

  /**
   * 打开大模型对话测试弹窗
   * 使用指定岗位配置的知识库进行对话测试
   * @param {number} index - 岗位配置索引
   */
  function openChatModal(index) {
    const cfg = configs[index];
    if (!cfg) return;
    chatPositionIndex = index;
    chatHistory = [];

    // 设置弹窗标题
    document.getElementById('chatModalTitle').textContent = `测试大模型对话 - ${escapeHtml(cfg.name || '未命名')}`;

    // 清空对话区域
    const body = document.getElementById('chatBody');
    body.innerHTML = `<div class="chat-msg system">开始测试大模型对话，将使用岗位知识库和通用知识库作为背景信息</div>`;

    document.getElementById('chatInput').value = '';
    document.getElementById('chatModal').classList.add('active');

    // 聚焦输入框
    setTimeout(() => document.getElementById('chatInput').focus(), 100);
  }

  /**
   * 关闭大模型对话测试弹窗
   */
  function closeChatModal() {
    document.getElementById('chatModal').classList.remove('active');
    chatPositionIndex = -1;
    chatHistory = [];
  }

  /**
   * 发送大模型测试对话消息
   * 调用逻辑与自动回复运行时的 LLM 调用一致（携带系统提示词和知识库）
   */
  async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    const body = document.getElementById('chatBody');

    // 移除系统提示（第一条）
    const systemMsg = body.querySelector('.chat-msg.system');
    if (systemMsg) systemMsg.remove();

    // 添加用户消息气泡
    body.innerHTML += `<div class="chat-msg user">${escapeHtml(msg)}</div>`;
    body.scrollTop = body.scrollHeight;

    chatHistory.push({ role: 'user', content: msg });

    try {
      // 获取大模型配置和通用知识库（托管模式：仅 userPrompt 等行为配置，密钥在服务端）
      const result = await chrome.storage.local.get(['modelConfig', KB_KEY]);
      const modelConfig = result.modelConfig || {};
      const generalKnowledgeBase = result[KB_KEY] || '';

      // 获取当前测试的岗位配置的知识库
      let positionKnowledgeBase = '';
      if (chatPositionIndex >= 0 && configs[chatPositionIndex]) {
        positionKnowledgeBase = configs[chatPositionIndex].positionKnowledgeBase || '';
      }

      // 显示加载中提示
      const loadingId = 'chat-loading-' + Date.now();
      body.innerHTML += `<div class="chat-loading" id="${loadingId}">🤔 思考中...</div>`;
      body.scrollTop = body.scrollHeight;

      // 调用大模型（通过 SW 代理，与自动回复运行时的逻辑一致）
      const response = await chrome.runtime.sendMessage({
        action: 'cmd_test_llm_chat',
        data: {
          messages: chatHistory,
          config: modelConfig,
          knowledgeBase: generalKnowledgeBase,
          positionKnowledgeBase: positionKnowledgeBase,
        }
      });

      // 移除加载中提示
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.remove();

      const data = response.data || response;
      const reply = data?.content || (data?.success ? '' : data?.error) || '调用失败，请检查配置';

      chatHistory.push({ role: 'assistant', content: reply });
      body.innerHTML += `<div class="chat-msg ai">${escapeHtml(reply)}</div>`;
      body.scrollTop = body.scrollHeight;
    } catch (err) {
      // 移除加载中提示
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.remove();

      body.innerHTML += `<div class="chat-msg ai" style="color:var(--danger)">❌ ${escapeHtml(err.message)}</div>`;
      body.scrollTop = body.scrollHeight;
    }
  }

  /* ========== 查看详情模态框 ========== */

  /**
   * 查看岗位配置详情
   * @param {number} index - 配置索引
   */
  function viewConfigDetail(index) {
    const cfg = configs[index];
    if (!cfg) return;

    const hasGreeting = Array.isArray(cfg.greetingMessages) && cfg.greetingMessages.length > 0;

    const detailHtml = `
      <div class="field" style="margin-bottom:12px">
        <label style="font-weight:600;font-size:13px;margin-bottom:4px">岗位名称</label>
        <div style="font-size:14px">${escapeHtml(cfg.name || '未命名')}</div>
      </div>
      <div class="field" style="margin-bottom:12px">
        <label style="font-weight:600;font-size:13px;margin-bottom:4px">状态</label>
        <div style="font-size:14px">${cfg.enabled !== false ? '✅ 已启用' : '⛔ 已停用'}</div>
      </div>
      <div class="field" style="margin-bottom:12px">
        <label style="font-weight:600;font-size:13px;margin-bottom:4px">执行顺序与人数</label>
        <div style="font-size:14px">第 ${index + 1} 个岗位 · 本轮最多自动回复 ${normalizeAutoReplyLimit(cfg.autoReplyLimit)} 人</div>
      </div>
      <div class="field" style="margin-bottom:12px">
        <label style="font-weight:600;font-size:13px;margin-bottom:4px">回复方式</label>
        <div style="font-size:14px">静态话术（大模型仅判断是否值得回复）</div>
      </div>
      <div class="field" style="margin-bottom:12px">
        <label style="font-weight:600;font-size:13px;margin-bottom:4px">岗位知识库</label>
        <div style="font-size:13px;white-space:pre-wrap;color:var(--muted);background:var(--surface);padding:8px;border-radius:6px;line-height:1.5">${cfg.positionKnowledgeBase ? escapeHtml(cfg.positionKnowledgeBase) : '(未配置)'}</div>
      </div>
      <div class="field">
        <label style="font-weight:600;font-size:13px;margin-bottom:4px">新招呼回复话术 ${hasGreeting ? '(' + cfg.greetingMessages.length + ' 条)' : ''}</label>
        ${hasGreeting
          ? cfg.greetingMessages.map((m, i) => `<div style="font-size:13px;background:var(--surface-warm);padding:6px 10px;border-radius:6px;margin-bottom:4px;line-height:1.5">${i + 1}. ${escapeHtml(m)}</div>`).join('')
          : '<div style="font-size:13px;color:var(--muted)">(未配置)</div>'
        }
      </div>
    `;

    // 使用确认弹窗样式展示（可复用的简单模态框）
    showConfirmDialog('', null, '岗位配置详情', detailHtml);
  }

  /* ========== 确认对话框 ========== */

  /**
   * 显示确认对话框或详情对话框
   * @param {string} message - 提示消息
   * @param {Function|null} onConfirm - 确认回调，null 时只显示关闭按钮
   * @param {string} title - 对话框标题
   * @param {string} [contentHtml] - 自定义内容 HTML（替代 message）
   */
  function showConfirmDialog(message, onConfirm, title, contentHtml) {
    const modal = document.getElementById('confirmModal');
    const msgEl = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('btnConfirmDelete');
    const cancelBtn = document.getElementById('btnCancelDelete');

    if (title) {
      modal.querySelector('.modal-header div').textContent = title;
    } else {
      modal.querySelector('.modal-header div').textContent = '确认操作';
    }

    if (contentHtml) {
      msgEl.innerHTML = contentHtml;
    } else {
      msgEl.textContent = message;
    }

    // 当 onConfirm 为 null 时，隐藏确认按钮（查看详情模式）
    if (onConfirm) {
      confirmBtn.style.display = 'inline-block';
      confirmBtn.textContent = '确认';
      deleteCallback = onConfirm;
    } else {
      confirmBtn.style.display = 'none';
      deleteCallback = null;
    }

    modal.classList.add('active');
  }

  /* ========== 工具函数 ========== */

  /**
   * HTML 转义
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function normalizeAutoReplyLimit(value) {
    const number = Number(value);
    if (!Number.isInteger(number)) return DEFAULT_AUTO_REPLY_LIMIT;
    return Math.min(MAX_AUTO_REPLY_LIMIT, Math.max(1, number));
  }

  function setAutoReplyLimitValidity(valid) {
    const input = document.getElementById('editAutoReplyLimit');
    const error = document.getElementById('autoReplyLimitError');
    if (!input || !error) return;
    input.setAttribute('aria-invalid', valid ? 'false' : 'true');
    error.classList.toggle('visible', !valid);
  }

  /**
   * 显示 Toast 提示
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

  /* ========== 事件绑定 ========== */

  document.addEventListener('DOMContentLoaded', () => {
    // 新增按钮
    document.getElementById('btnAdd').addEventListener('click', openAddModal);

    // 编辑模态框事件
    document.getElementById('btnCloseEditModal').addEventListener('click', closeEditModal);
    document.getElementById('btnCancelEdit').addEventListener('click', closeEditModal);
    document.getElementById('btnSaveConfig').addEventListener('click', saveCurrentConfig);
    document.getElementById('editAutoReplyLimit').addEventListener('blur', (event) => {
      const value = Number(event.target.value);
      setAutoReplyLimitValidity(Number.isInteger(value) && value >= 1 && value <= MAX_AUTO_REPLY_LIMIT);
    });
    document.getElementById('editAutoReplyLimit').addEventListener('input', () => setAutoReplyLimitValidity(true));

    // 话术添加
    document.getElementById('btnAddGreeting').addEventListener('click', addGreeting);

    // 大模型对话弹窗
    document.getElementById('btnSendChat').addEventListener('click', sendChatMessage);
    document.getElementById('chatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendChatMessage();
    });
    document.getElementById('btnCloseChatModal').addEventListener('click', closeChatModal);
    document.getElementById('chatModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeChatModal();
    });

    // 事件委托：配置卡片列表
    document.getElementById('configList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const index = parseInt(btn.dataset.index, 10);
      const action = btn.dataset.action;

      switch (action) {
        case 'view':
          viewConfigDetail(index);
          break;
        case 'edit':
          openEditModal(index);
          break;
        case 'chat':
          openChatModal(index);
          break;
        case 'copy':
          copyConfig(index);
          break;
        case 'delete':
          deleteConfig(index);
          break;
      }
    });

    // 事件委托：启用/停用开关
    document.getElementById('configList').addEventListener('change', (e) => {
      const toggle = e.target.closest('.toggle-enabled');
      if (!toggle) return;
      const index = parseInt(toggle.dataset.index, 10);
      toggleEnabled(index, toggle.checked);
    });

    // 确认对话框事件
    document.getElementById('btnConfirmDelete').addEventListener('click', () => {
      if (deleteCallback) deleteCallback();
      document.getElementById('confirmModal').classList.remove('active');
      deleteCallback = null;
    });
    document.getElementById('btnCancelDelete').addEventListener('click', () => {
      document.getElementById('confirmModal').classList.remove('active');
      deleteCallback = null;
    });

    // 点击模态框外部关闭
    document.getElementById('confirmModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        document.getElementById('confirmModal').classList.remove('active');
        deleteCallback = null;
      }
    });
    document.getElementById('editModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeEditModal();
    });

    // 加载数据
    loadConfigs();
  });
})();
