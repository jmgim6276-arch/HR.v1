(function() {
  'use strict';

  const KEYWORD_RULES_KEY = 'keywordRules';
  let rules = [];
  let editingRuleId = null;

  /**
   * 从 chrome.storage 加载规则列表
   */
  async function loadRules() {
    try {
      const result = await chrome.storage.local.get(KEYWORD_RULES_KEY);
      rules = result[KEYWORD_RULES_KEY] || [];
      renderRules();
    } catch (err) { console.error('加载关键词规则失败:', err); }
  }

  /**
   * 将规则列表保存到 chrome.storage
   */
  async function saveRulesToStorage() {
    try {
      await chrome.storage.local.set({ [KEYWORD_RULES_KEY]: rules });
    } catch (err) { console.error('保存关键词规则失败:', err); }
  }

  /**
   * 渲染规则列表
   */
  function renderRules() {
    const list = document.getElementById('rulesList');
    const empty = document.getElementById('emptyState');
    list.innerHTML = '';

    if (rules.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    rules.forEach((rule) => {
      const card = document.createElement('div');
      card.className = 'rule-card';
      card.innerHTML = `
        <div class="rule-info">
          <div class="rule-name">${escapeHtml(rule.name)}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">关键词: ${(rule.keywords || []).join(', ')}</div>
        </div>
        <div class="rule-actions">
          <label class="status-toggle">
            <input type="checkbox" ${rule.enabled !== false ? 'checked' : ''} data-rule-id="${rule.id}">
            <span class="slider"></span>
          </label>
          <button class="btn-delete" title="删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      `;
      list.appendChild(card);
    });

    // 绑定启用开关切换事件
    document.querySelectorAll('.rule-card input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', async () => {
        const rule = rules.find(r => r.id === cb.dataset.ruleId);
        if (rule) {
          rule.enabled = cb.checked;
          await saveRulesToStorage();
        }
      });
    });
  }

  /**
   * 打开新增/编辑弹窗
   */
  function openModal() {
    editingRuleId = null;
    document.getElementById('modalTitle').textContent = '新增关键词规则';
    document.getElementById('ruleNameInput').value = '';
    document.getElementById('keywordContainer').querySelectorAll('.keyword-tag').forEach(t => t.remove());
    document.getElementById('phraseList').innerHTML = `
      <div class="phrase-item">
        <div class="phrase-num">1</div>
        <textarea class="textarea-ghost" placeholder="输入话术内容..."></textarea>
        <button class="btn btn-ghost" style="color:var(--muted);padding:4px">✕</button>
      </div>
    `;
    document.getElementById('ruleModal').style.display = 'flex';
  }

  /**
   * 关闭弹窗
   */
  function closeModal() {
    document.getElementById('ruleModal').style.display = 'none';
  }

  /**
   * 添加话术输入项
   */
  function addPhrase() {
    const count = document.getElementById('phraseList').children.length + 1;
    const div = document.createElement('div');
    div.className = 'phrase-item';
    div.innerHTML = `
      <div class="phrase-num">${count}</div>
      <textarea class="textarea-ghost" placeholder="输入话术内容..."></textarea>
      <button class="btn btn-ghost" style="color:var(--muted);padding:4px">✕</button>
    `;
    document.getElementById('phraseList').appendChild(div);
    reindexPhrases();
  }

  /**
   * 移除话术输入项
   * @param {HTMLElement} btn - 移除按钮元素
   */
  function removePhrase(btn) {
    const list = document.getElementById('phraseList');
    if (list.children.length > 1) {
      btn.parentElement.remove();
      reindexPhrases();
    }
  }

  /**
   * 重新编号话术序号
   */
  function reindexPhrases() {
    document.querySelectorAll('#phraseList .phrase-num').forEach((el, i) => { el.textContent = i + 1; });
  }

  /**
   * 获取已输入的关键词数组
   * @returns {string[]}
   */
  function getKeywords() {
    return Array.from(document.querySelectorAll('#keywordContainer .keyword-tag')).map(t => t.textContent.replace('×', '').trim()).filter(Boolean);
  }

  /**
   * 获取已输入的话术数组
   * @returns {string[]}
   */
  function getPhrases() {
    return Array.from(document.querySelectorAll('#phraseList .textarea-ghost')).map(t => t.value.trim()).filter(Boolean);
  }

  /**
   * 保存当前规则（新增或编辑）
   */
  function saveRule() {
    const name = document.getElementById('ruleNameInput').value.trim();
    const keywords = getKeywords();
    const phrases = getPhrases();
    if (!name) { showToast('请输入规则名称'); return; }
    if (keywords.length === 0) { showToast('请添加至少一个触发关键词'); return; }
    if (phrases.length === 0) { showToast('请添加至少一条回复话术'); return; }

    if (editingRuleId) {
      const rule = rules.find(r => r.id === editingRuleId);
      if (rule) { rule.name = name; rule.keywords = keywords; rule.replies = phrases; }
    } else {
      rules.push({
        id: 'rule_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name, enabled: true, keywords, replies: phrases
      });
    }
    saveRulesToStorage();
    renderRules();
    closeModal();
    showToast('✅ 规则已保存');
  }

  /**
   * 编辑指定规则
   * @param {string} id - 规则ID
   */
  function editRule(id) {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    editingRuleId = id;
    document.getElementById('modalTitle').textContent = '编辑关键词规则';
    document.getElementById('ruleNameInput').value = rule.name || '';

    // 填充关键词标签
    const container = document.getElementById('keywordContainer');
    container.querySelectorAll('.keyword-tag').forEach(t => t.remove());
    (rule.keywords || []).forEach(kw => {
      const tag = document.createElement('span');
      tag.className = 'keyword-tag';
      tag.innerHTML = `${escapeHtml(kw)} <span data-remove-keyword>×</span>`;
      container.insertBefore(tag, document.getElementById('keywordInput'));
    });

    // 填充话术列表
    const phraseList = document.getElementById('phraseList');
    phraseList.innerHTML = '';
    (rule.replies || ['']).forEach((reply, i) => {
      const div = document.createElement('div');
      div.className = 'phrase-item';
      div.innerHTML = `
        <div class="phrase-num">${i + 1}</div>
        <textarea class="textarea-ghost" placeholder="输入话术内容...">${escapeHtml(reply)}</textarea>
        <button class="btn btn-ghost" style="color:var(--muted);padding:4px">✕</button>
      `;
      phraseList.appendChild(div);
    });
    if (phraseList.children.length === 0) addPhrase();

    document.getElementById('ruleModal').style.display = 'flex';
  }

  /**
   * 删除规则
   * @param {string} id - 规则ID
   * @param {Event} event - 原始点击事件（用于阻止冒泡）
   */
  async function deleteRule(id, event) {
    event.stopPropagation();
    showConfirmDialog('确定删除该规则吗？', async () => {
      rules = rules.filter(r => r.id !== id);
      await saveRulesToStorage();
      renderRules();
      showToast('✅ 规则已删除');
    });
  }

  /**
   * HTML 转义，防止 XSS
   * @param {string} text - 原始文本
   * @returns {string} 转义后的 HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  /**
   * 将关键词输入框的内容按逗号拆分为多个标签（跳过已存在的重复项）
   * 支持中英文逗号分隔
   * @param {HTMLInputElement} input - 关键词输入框元素
   */
  function addKeywordTags(input) {
    const container = document.getElementById('keywordContainer');
    const rawValue = input.value.trim();
    if (!rawValue) return;

    // 按中英文逗号拆分，过滤空白
    const values = rawValue.split(/[,，]/).map(v => v.trim()).filter(Boolean);
    // 收集已存在的标签文本，避免重复
    const existingTexts = new Set(
      Array.from(container.querySelectorAll('.keyword-tag')).map(tag => {
        const textNode = Array.from(tag.childNodes).find(n => n.nodeType === 3);
        return textNode ? textNode.textContent.trim() : '';
      }).filter(Boolean)
    );

    for (const value of values) {
      if (existingTexts.has(value)) continue;
      existingTexts.add(value);
      const tag = document.createElement('span');
      tag.className = 'keyword-tag';
      tag.innerHTML = `${escapeHtml(value)} <span data-remove-keyword>×</span>`;
      container.insertBefore(tag, input);
    }
    input.value = '';
  }

  /**
   * 显示 Toast 提示消息
   * @param {string} msg - 提示内容
   * @param {number} duration - 显示时长（毫秒）
   */
  function showToast(msg, duration = 2500) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, duration);
  }

  /* 确认弹窗：替代浏览器 confirm */
  let _confirmCallback = null;

  function showConfirmDialog(message, onConfirm) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'flex';
    _confirmCallback = onConfirm;
  }

  /* ========== DOMContentLoaded 事件入口 ========== */
  document.addEventListener('DOMContentLoaded', () => {
    // --- 确认弹窗按钮事件 ---
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

    // --- 静态按钮绑定 ---
    document.getElementById('btnAddRule').addEventListener('click', openModal);
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnCancel').addEventListener('click', closeModal);
    document.getElementById('btnSave').addEventListener('click', saveRule);
    document.getElementById('btnAddPhrase').addEventListener('click', addPhrase);

    // 规则名称输入框回车保存
    document.getElementById('ruleNameInput').addEventListener('keyup', (e) => {
      if (e.key === 'Enter') saveRule();
    });

    // --- 关键词标签输入（支持回车或逗号分隔） ---
    const input = document.getElementById('keywordInput');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        e.preventDefault();
        addKeywordTags(input);
      }
    });
    // 失焦时自动将剩余文本转换为标签
    input.addEventListener('blur', () => {
      if (!input.value.trim()) return;
      addKeywordTags(input);
    });

    // --- 事件委托：删除关键词标签 ---
    document.getElementById('keywordContainer').addEventListener('click', (e) => {
      const removeSpan = e.target.closest('[data-remove-keyword]');
      if (removeSpan) {
        removeSpan.parentElement.remove();
      }
    });

    // --- 事件委托：删除话术 ---
    document.getElementById('phraseList').addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-ghost');
      if (btn) {
        removePhrase(btn);
      }
    });

    // --- 事件委托：规则列表操作 ---
    document.getElementById('rulesList').addEventListener('click', (e) => {
      // 点击开关区域不触发编辑
      if (e.target.closest('.status-toggle')) {
        e.stopPropagation();
        return;
      }

      // 删除按钮
      const deleteBtn = e.target.closest('.btn-delete');
      if (deleteBtn) {
        const card = deleteBtn.closest('.rule-card');
        const checkbox = card?.querySelector('input[type="checkbox"]');
        if (checkbox?.dataset.ruleId) {
          deleteRule(checkbox.dataset.ruleId, e);
        }
        return;
      }

      // 点击卡片编辑规则
      const card = e.target.closest('.rule-card');
      if (card) {
        // 使用 dataset 获取规则 ID（从复选框的 data-rule-id 读取）
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox?.dataset.ruleId) {
          editRule(checkbox.dataset.ruleId);
        }
      }
    });

    // 加载数据
    loadRules();
  });
})();
