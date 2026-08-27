/**
 * 回复频率配置页面脚本
 * 管理拟人回复延迟、等待间隔等设置
 * 光标离开输入框时自动校验并保存
 */
(function(){ 'use strict';
  const TIME_CONFIG_KEY = 'timeConfig';

  /**
   * 字段校验规则配置
   * 每个字段的 ID、允许范围和显示名称
   */
  const FIELD_RULES = {
    sendDelayMin: { min: 3, max: 30, label: '回复消息频率（最小）' },
    sendDelayMax: { min: 3, max: 30, label: '回复消息频率（最大）' },
    replyWait: { min: 15, max: 300, label: '等待候选人消息间隔' },
    userInterval: { min: 60, max: 300, label: '处理候选人间隔' },
    runDuration: { min: 1, max: 60, label: '连续运行时长' },
    pauseDuration: { min: 5, max: 120, label: '暂停时长' },
    maxRunDuration: { min: 1, max: 4, label: '单次运行最大时长' },
  };

  /**
   * 获取或创建字段的错误提示元素
   * @param {string} fieldId - 字段 ID
   * @returns {HTMLElement} 错误提示元素
   */
  function getErrorEl(fieldId) {
    const existing = document.getElementById(fieldId + '_error');
    if (existing) return existing;
    const el = document.createElement('div');
    el.id = fieldId + '_error';
    el.className = 'field-error';
    el.style.cssText = 'font-size:11px;color:var(--danger);margin-top:4px;display:none';
    // 插入到字段所在 .field 容器末尾
    const input = document.getElementById(fieldId);
    if (input) {
      const fieldContainer = input.closest('.field') || input.parentElement;
      fieldContainer.appendChild(el);
    }
    return el;
  }

  /**
   * 显示字段错误提示
   * @param {string} fieldId - 字段 ID
   * @param {string} msg - 错误信息
   */
  function showFieldError(fieldId, msg) {
    const el = getErrorEl(fieldId);
    el.textContent = '⚠ ' + msg;
    el.style.display = 'block';
    document.getElementById(fieldId).style.borderColor = 'var(--danger)';
  }

  /**
   * 隐藏字段错误提示
   * @param {string} fieldId - 字段 ID
   */
  function hideFieldError(fieldId) {
    const el = document.getElementById(fieldId + '_error');
    if (el) { el.style.display = 'none'; }
    const input = document.getElementById(fieldId);
    if (input) input.style.borderColor = 'var(--border)';
  }

  /**
   * 校验所有字段，返回是否全部通过
   * 不通过时显示字段级错误提示
   * @returns {boolean} 校验是否全部通过
   */
  function validateAll() {
    let allValid = true;

    // 1. 校验单个字段的范围限制
    Object.keys(FIELD_RULES).forEach(id => {
      const rule = FIELD_RULES[id];
      const el = document.getElementById(id);
      if (!el) return;
      const val = parseInt(el.value);
      if (isNaN(val) || val < rule.min || val > rule.max) {
        showFieldError(id, '允许范围：' + rule.min + '～' + rule.max);
        allValid = false;
      } else {
        hideFieldError(id);
      }
    });

    // 2. 校验 sendDelayMin 不能大于 sendDelayMax
    const minVal = parseInt(document.getElementById('sendDelayMin').value);
    const maxVal = parseInt(document.getElementById('sendDelayMax').value);
    if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
      showFieldError('sendDelayMin', '最小值不能大于最大值');
      showFieldError('sendDelayMax', '最小值不能大于最大值');
      allValid = false;
    }

    return allValid;
  }

  /**
   * 保存配置到 chrome.storage
   */
  async function saveConfig() {
    try {
      await chrome.storage.local.set({
        [TIME_CONFIG_KEY]: {
          sendDelayRange: [
            parseInt(document.getElementById('sendDelayMin').value),
            parseInt(document.getElementById('sendDelayMax').value)
          ],
          replyWait: parseInt(document.getElementById('replyWait').value),
          userIntervalSeconds: parseInt(document.getElementById('userInterval').value),
          runDurationMinutes: parseInt(document.getElementById('runDuration').value),
          pauseDurationMinutes: parseInt(document.getElementById('pauseDuration').value),
          maxRunDurationHours: parseInt(document.getElementById('maxRunDuration').value),
        }
      });
      showToast('✅ 已自动保存');
    } catch (err) {
      showToast('❌ 保存失败: ' + err.message);
    }
  }

  /**
   * 处理输入框失焦事件：校验 + 自动保存
   * @param {FocusEvent} e - 失焦事件
   */
  function handleBlur(e) {
    const el = e.target;
    if (!el.classList.contains('num')) return;

    // 校验全部字段
    if (validateAll()) {
      // 全部通过则自动保存
      saveConfig();
    }
  }

  /**
   * 从 chrome.storage 加载配置并填充表单
   */
  async function loadConfig() {
    try {
      const result = await chrome.storage.local.get(TIME_CONFIG_KEY);
      const cfg = result[TIME_CONFIG_KEY] || {};
      document.getElementById('sendDelayMin').value = cfg.sendDelayRange?.[0] ?? 3;
      document.getElementById('sendDelayMax').value = cfg.sendDelayRange?.[1] ?? 8;
      document.getElementById('replyWait').value = cfg.replyWait ?? 15;
      document.getElementById('userInterval').value = cfg.userIntervalSeconds ?? 60;
      document.getElementById('runDuration').value = cfg.runDurationMinutes ?? 60;
      document.getElementById('pauseDuration').value = cfg.pauseDurationMinutes ?? 10;
      document.getElementById('maxRunDuration').value = cfg.maxRunDurationHours ?? 4;

      // 清除所有错误状态
      Object.keys(FIELD_RULES).forEach(id => hideFieldError(id));
    } catch (err) { console.error(err); }
  }

  /** 显示 Toast 提示消息 */
  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 2500);
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadConfig();

    // 所有数字输入框绑定失焦事件：校验 + 自动保存
    document.querySelectorAll('.input.num').forEach(el => {
      el.addEventListener('blur', handleBlur);
    });
  });

})();
