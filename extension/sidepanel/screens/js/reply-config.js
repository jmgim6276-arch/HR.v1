/**
 * 大模型回复配置页面逻辑
 * 外部 JS 文件（CSP 合规，替代内联脚本）
 *
 * 变更记录：
 * - 移除沟通目标设置及相关逻辑
 * - 移除"保存配置"按钮，改为输入框失去焦点时自动保存
 */
(function () {
  'use strict';

  /** 存储键 */
  const MODEL_CONFIG_KEY = 'modelConfig';
  const KB_KEY = 'generalKnowledgeBase';

  /** 当前数据 */
  let modelConfig = { apiUrl: '', apiKey: '', model: 'deepseek-v4-flash', userPrompt: '', maxHistoryRounds: 20 };

  /**
   * 从 storage 读取表单数据并填充到页面
   */
  async function loadConfig() {
    try {
      const result = await chrome.storage.local.get([MODEL_CONFIG_KEY, KB_KEY]);
      modelConfig = result[MODEL_CONFIG_KEY] || modelConfig;

      document.getElementById('apiUrl').value = modelConfig.apiUrl || '';
      document.getElementById('apiKey').value = modelConfig.apiKey || '';
      document.getElementById('modelName').value = modelConfig.model || 'deepseek-v4-flash';
      document.getElementById('maxHistoryRounds').value = modelConfig.maxHistoryRounds ?? 20;
      document.getElementById('userPrompt').value = modelConfig.userPrompt || '';
      document.getElementById('generalKnowledgeBase').value = result[KB_KEY] || '';
    } catch (err) {
      console.error('加载配置失败:', err);
    }
  }

  /**
   * 自动保存：收集当前表单值写入 storage
   */
  async function autoSave() {
    const data = {
      apiUrl: document.getElementById('apiUrl').value.trim(),
      apiKey: document.getElementById('apiKey').value.trim(),
      model: document.getElementById('modelName').value.trim(),
      userPrompt: document.getElementById('userPrompt').value.trim(),
      maxHistoryRounds: parseInt(document.getElementById('maxHistoryRounds').value, 10) || 20,
    };

    try {
      await chrome.storage.local.set({
        [MODEL_CONFIG_KEY]: data,
        [KB_KEY]: document.getElementById('generalKnowledgeBase').value.trim(),
      });
      modelConfig = data;
      showToast('✅ 配置已自动保存');
    } catch (err) {
      showToast('❌ 保存失败: ' + err.message);
    }
  }

  /**
   * 为指定 input/textarea 绑定 blur 自动保存
   * @param {string} elementId - DOM 元素 ID
   */
  function bindAutoSave(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.addEventListener('blur', autoSave);
    }
  }

  /**
   * 测试连通性
   */
  async function testConnection() {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('modelName').value.trim();
    if (!apiUrl || !apiKey || !model) {
      document.getElementById('testResult').textContent = '请填写 API 地址、Key 和模型名称';
      return;
    }
    const btn = document.getElementById('btnTestConn');
    btn.textContent = '测试中...';
    btn.disabled = true;
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'cmd_test_llm_conn',
        data: { apiUrl, apiKey, model }
      });
      const data = result.data || result;
      if (data?.success) {
        document.getElementById('testResult').innerHTML = '<span style="color:var(--success)">✅ 连接成功</span>';
        document.getElementById('connStatus').style.display = 'inline';
      } else {
        document.getElementById('testResult').innerHTML = `<span style="color:var(--danger)">❌ ${data?.error || '连接失败'}</span>`;
        document.getElementById('connStatus').style.display = 'none';
      }
    } catch (err) {
      document.getElementById('testResult').textContent = '❌ ' + err.message;
    } finally {
      btn.textContent = '测试连通性';
      btn.disabled = false;
    }
  }

  /**
   * Toast 提示
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

  /**
   * 初始化
   */
  document.addEventListener('DOMContentLoaded', async () => {
    // 为所有配置输入框绑定 blur 自动保存（系统提示词已硬编码，不在页面上配置）
    const autoSaveFields = ['apiUrl', 'apiKey', 'modelName', 'maxHistoryRounds', 'userPrompt', 'generalKnowledgeBase'];
    autoSaveFields.forEach(bindAutoSave);

    // 测试连通性
    document.getElementById('btnTestConn').addEventListener('click', testConnection);

    // 加载配置
    await loadConfig();
  });
})();
