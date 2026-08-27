/**
 * 打招呼频率配置页面脚本
 * 管理打招呼延迟、处理间隔等设置
 */
(function(){ 'use strict';
  const TIME_CONFIG_KEY = 'greetingTimeConfig';

  /** 从 chrome.storage 加载配置并填充表单 */
  async function loadConfig() {
    try {
      const result = await chrome.storage.local.get(TIME_CONFIG_KEY);
      const cfg = result[TIME_CONFIG_KEY] || {};
      document.getElementById('sendDelayMin').value = cfg.sendDelayRange?.[0] ?? 5;
      document.getElementById('sendDelayMax').value = cfg.sendDelayRange?.[1] ?? 8;
      document.getElementById('userInterval').value = cfg.userIntervalSeconds ?? 60;
      document.getElementById('greetInterval').value = cfg.greetIntervalSeconds ?? 120;
      document.getElementById('runDuration').value = cfg.runDurationMinutes ?? 60;
      document.getElementById('pauseDuration').value = cfg.pauseDurationMinutes ?? 5;
      document.getElementById('greetingMaxRunDuration').value = cfg.maxRunDurationHours ?? 4;
    } catch (err) { console.error(err); }
  }

  /**
   * 字段中文名与范围配置
   * 用于校验和保存时的错误提示
   */
  const FIELD_INFO = [
    { id: 'sendDelayMin', label: '连续发送消息最小间隔', min: 5, max: 30, unit: '秒' },
    { id: 'sendDelayMax', label: '连续发送消息最大间隔', min: 5, max: 30, unit: '秒' },
    { id: 'userInterval', label: '候选人处理间隔', min: 60, max: 300, unit: '秒' },
    { id: 'greetInterval', label: '打招呼间隔', min: 120, max: 600, unit: '秒' },
    { id: 'runDuration', label: '运行时长', min: 1, max: 60, unit: '分钟' },
    { id: 'pauseDuration', label: '暂停时长', min: 5, max: 120, unit: '分钟' },
    { id: 'greetingMaxRunDuration', label: '单次运行最大时长', min: 1, max: 4, unit: '小时' },
  ];

  /** 校验所有输入字段的合法性 */
  function validate() {
    let valid = true;
    FIELD_INFO.forEach(({id, min, max}) => {
      const el = document.getElementById(id);
      const val = parseInt(el.value);
      if (isNaN(val) || val < min || val > max) {
        el.style.borderColor = 'var(--danger)';
        valid = false;
      } else {
        el.style.borderColor = 'var(--border)';
      }
    });
    // 校验发送间隔 min <= max
    const minVal = parseInt(document.getElementById('sendDelayMin').value);
    const maxVal = parseInt(document.getElementById('sendDelayMax').value);
    if (minVal > maxVal) {
      document.getElementById('sendDelayMin').style.borderColor = 'var(--danger)';
      document.getElementById('sendDelayMax').style.borderColor = 'var(--danger)';
      valid = false;
    }
    return valid;
  }

  /** 获取字段的友好范围提示文字 */
  function getFieldHint(id, val) {
    const info = FIELD_INFO.find(f => f.id === id);
    if (!info) return '';
    if (isNaN(val)) return `「${info.label}」请输入有效数值`;
    if (val < info.min) return `「${info.label}」最小值为 ${info.min}${info.unit}，当前值 ${val}${info.unit} 过小`;
    if (val > info.max) return `「${info.label}」最大值为 ${info.max}${info.unit}，当前值 ${val}${info.unit} 过大`;
    return '';
  }

  /** 获取发送间隔大小关系提示 */
  function getSendDelayOrderHint() {
    const minVal = parseInt(document.getElementById('sendDelayMin').value);
    const maxVal = parseInt(document.getElementById('sendDelayMax').value);
    if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
      return '「连续发送消息最小间隔」不能大于「最大间隔」';
    }
    return '';
  }

  /** 收集所有校验错误信息 */
  function collectErrors() {
    const errors = [];
    FIELD_INFO.forEach(({id, label, min, max, unit}) => {
      const el = document.getElementById(id);
      const val = parseInt(el.value);
      if (isNaN(val)) {
        errors.push(`「${label}」请输入有效数值`);
      } else if (val < min) {
        errors.push(`「${label}」最小值为 ${min}${unit}，当前 ${val}${unit}`);
      } else if (val > max) {
        errors.push(`「${label}」最大值为 ${max}${unit}，当前 ${val}${unit}`);
      }
    });
    const minVal = parseInt(document.getElementById('sendDelayMin').value);
    const maxVal = parseInt(document.getElementById('sendDelayMax').value);
    if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
      errors.push('「连续发送消息最小间隔」不能大于「最大间隔」');
    }
    return errors;
  }

  // 为每个数字输入框绑定失焦校验与友好提示
  document.querySelectorAll('.input.num').forEach(el => {
    el.addEventListener('blur', function() {
      const id = this.id;
      const val = parseInt(this.value);

      // 先执行校验（改变边框颜色）
      validate();

      // 给出字段级友好提示
      let msg = getFieldHint(id, val);
      if (!msg) {
        if (id === 'sendDelayMin' || id === 'sendDelayMax') {
          msg = getSendDelayOrderHint();
        }
      }
      if (msg) {
        showToast('⚠️ ' + msg);
      }
    });
  });

  /** 保存按钮点击处理：校验数据并写入 chrome.storage */
  document.getElementById('saveBtn').addEventListener('click', async () => {
    if (!validate()) {
      const errors = collectErrors();
      showToast('⚠️ ' + errors[0]);
      return;
    }
    try {
      await chrome.storage.local.set({
        [TIME_CONFIG_KEY]: {
          sendDelayRange: [
            parseInt(document.getElementById('sendDelayMin').value),
            parseInt(document.getElementById('sendDelayMax').value)
          ],
          userIntervalSeconds: parseInt(document.getElementById('userInterval').value),
          greetIntervalSeconds: parseInt(document.getElementById('greetInterval').value),
          runDurationMinutes: parseInt(document.getElementById('runDuration').value),
          pauseDurationMinutes: parseInt(document.getElementById('pauseDuration').value),
          maxRunDurationHours: parseInt(document.getElementById('greetingMaxRunDuration').value),
        }
      });
      const btn = document.getElementById('saveBtn');
      btn.textContent = '✅ 已保存';
      btn.style.background = 'var(--success)';
      setTimeout(() => {
        btn.textContent = '保存间隔设置';
        btn.style.background = 'var(--accent)';
      }, 2000);
    } catch (err) { showToast('❌ 保存失败: ' + err.message); }
  });

  /** 显示 Toast 提示消息 */
  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 2500);
  }

  document.addEventListener('DOMContentLoaded', loadConfig);
})();
