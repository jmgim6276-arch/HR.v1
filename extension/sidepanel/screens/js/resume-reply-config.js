(function () {
  'use strict';

  const STORAGE_KEY = 'resumeReplyConfig';
  const MAX_MESSAGES = 5;
  const MAX_LENGTH = 1000;
  const DEFAULT_CONFIG = {
    messages: ['您好{姓名}，您的简历已收到，我们会尽快查看，有进展会及时与您联系。'],
  };

  let toastTimer = null;

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = '1';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
  }

  function normalizeMessages(config) {
    if (Array.isArray(config?.messages)) {
      const messages = config.messages.map(item => String(item || '').slice(0, MAX_LENGTH)).slice(0, MAX_MESSAGES);
      return messages.length ? messages : [''];
    }
    if (typeof config?.content === 'string') return [config.content.slice(0, MAX_LENGTH)];
    return [...DEFAULT_CONFIG.messages];
  }

  function validateItem(item, showEmptyError) {
    const textarea = item.querySelector('textarea');
    const error = item.querySelector('.message-error');
    const empty = !textarea.value.trim();
    item.classList.toggle('invalid', showEmptyError && empty);
    textarea.setAttribute('aria-invalid', showEmptyError && empty ? 'true' : 'false');
    error.textContent = showEmptyError && empty ? '请填写这条回复内容，或删除该输入框。' : '';
    return !empty;
  }

  function renumberItems() {
    const items = Array.from(document.querySelectorAll('.message-item'));
    items.forEach((item, index) => {
      const textarea = item.querySelector('textarea');
      const label = item.querySelector('label');
      const remove = item.querySelector('.remove-message');
      const count = item.querySelector('.char-count');
      const id = `replyMessage${index + 1}`;
      textarea.id = id;
      label.htmlFor = id;
      label.textContent = `第 ${index + 1} 条回复`;
      remove.setAttribute('aria-label', `删除第 ${index + 1} 条回复`);
      count.textContent = `${textarea.value.length} / ${MAX_LENGTH}`;
    });
    document.getElementById('btnAddMessage').disabled = items.length >= MAX_MESSAGES;
    for (const item of items) item.querySelector('.remove-message').disabled = items.length === 1;
  }

  function createMessageItem(value = '') {
    const item = document.createElement('div');
    item.className = 'message-item';
    item.innerHTML = [
      '<div class="label-row">',
      '  <label></label>',
      '  <div class="message-actions">',
      `    <span class="char-count">0 / ${MAX_LENGTH}</span>`,
      '    <button class="remove-message" type="button">删除</button>',
      '  </div>',
      '</div>',
      `<textarea class="textarea" maxlength="${MAX_LENGTH}" style="min-height:96px" placeholder="输入发送给候选人的一条完整消息"></textarea>`,
      '<div class="message-error" role="alert"></div>',
    ].join('');
    const textarea = item.querySelector('textarea');
    textarea.value = value;
    textarea.addEventListener('input', () => {
      item.querySelector('.char-count').textContent = `${textarea.value.length} / ${MAX_LENGTH}`;
      validateItem(item, false);
    });
    textarea.addEventListener('blur', () => validateItem(item, true));
    item.querySelector('.remove-message').addEventListener('click', () => {
      if (document.querySelectorAll('.message-item').length <= 1) return;
      item.remove();
      renumberItems();
    });
    return item;
  }

  function applyConfig(config) {
    const list = document.getElementById('messageList');
    list.replaceChildren(...normalizeMessages(config).map(createMessageItem));
    renumberItems();
  }

  function getMessagesFromForm() {
    return Array.from(document.querySelectorAll('.message-item textarea')).map(textarea => textarea.value.trim());
  }

  function validateAll() {
    const items = Array.from(document.querySelectorAll('.message-item'));
    const valid = items.every(item => validateItem(item, true));
    if (!valid) items.find(item => item.classList.contains('invalid'))?.querySelector('textarea')?.focus();
    return valid;
  }

  async function loadConfig() {
    try {
      const stored = await chrome.storage.local.get(STORAGE_KEY);
      applyConfig(stored[STORAGE_KEY] || DEFAULT_CONFIG);
    } catch (err) {
      console.error('加载简历回复配置失败:', err);
      applyConfig(DEFAULT_CONFIG);
      showToast('加载配置失败');
    }
  }

  async function saveConfig() {
    if (!validateAll()) return showToast('请完善空白回复内容');
    const messages = getMessagesFromForm();
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: { messages, updatedAt: new Date().toISOString() } });
      showToast(`已保存 ${messages.length} 条回复话术`);
    } catch (err) {
      console.error('保存简历回复配置失败:', err);
      showToast('保存失败');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnAddMessage').addEventListener('click', () => {
      const list = document.getElementById('messageList');
      if (list.children.length >= MAX_MESSAGES) return showToast(`最多添加 ${MAX_MESSAGES} 条回复`);
      const item = createMessageItem('');
      list.appendChild(item);
      renumberItems();
      item.querySelector('textarea').focus();
    });
    document.getElementById('btnSave').addEventListener('click', saveConfig);
    document.getElementById('btnRestore').addEventListener('click', () => {
      applyConfig(DEFAULT_CONFIG);
      showToast('已恢复默认内容，点击保存后生效');
    });
    loadConfig();
  });
})();
