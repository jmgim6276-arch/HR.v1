/**
 * 初面反馈：独立展示呼波特电话话单回调。
 */
(function() {
  'use strict';

  let records = [];
  let loadError = '';
  let searchTimer = null;
  let toastTimer = null;

  async function sendToSW(action, data) {
    const api = window.parent && window.parent.__shellAPI;
    if (api && typeof api.sendToSW === 'function') {
      return api.sendToSW(action, data || {});
    }
    return chrome.runtime.sendMessage({ action, data: data || {} });
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function escapeAttr(value) {
    return escapeHtml(value)
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.opacity = '1';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2200);
  }

  function recordState(record) {
    if (record.callback || record.status === 'callback_received') return 'received';
    if (record.status === 'failed') return 'failed';
    return 'waiting';
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = typeof value === 'number'
      ? new Date(value * 1000)
      : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('zh-CN', { hour12: false });
  }

  function formatDuration(seconds, fallbackMinutes) {
    let total = Number(seconds);
    if (!Number.isFinite(total) && Number.isFinite(Number(fallbackMinutes))) {
      total = Number(fallbackMinutes) * 60;
    }
    if (!Number.isFinite(total) || total < 0) return '—';
    const minutes = Math.floor(total / 60);
    const remain = Math.round(total % 60);
    return minutes ? `${minutes}分${remain}秒` : `${remain}秒`;
  }

  function answerText(call) {
    const main = Number(call?.answerMainStatus);
    const sub = Number(call?.answerStatus);
    const subMap = {
      205: '拒接',
      206: '无应答',
      301: '已接听',
      302: '秒挂',
      303: '伪接通',
    };
    if (subMap[sub]) return subMap[sub];
    if (main === 3) return '已接通';
    if (main === 2) return '未接通';
    return '暂无结果';
  }

  function intentionText(call) {
    const value = Number(call?.intentionStatus);
    if (value === 2) return '有意向';
    if (value === 1) return '无意向';
    return '无结果';
  }

  function field(label, value, wide) {
    return `
      <div class="field ${wide ? 'wide' : ''}">
        <div class="field-label">${escapeHtml(label)}</div>
        <div class="field-value">${escapeHtml(value || '—')}</div>
      </div>
    `;
  }

  function tagList(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return '';
    const entries = Object.entries(data).filter(([, value]) => value !== '' && value != null);
    if (!entries.length) return '';
    return `<div class="tag-list">${entries.map(([key, value]) =>
      `<span class="data-tag">${escapeHtml(key)}：${escapeHtml(
        typeof value === 'object' ? JSON.stringify(value) : value
      )}</span>`
    ).join('')}</div>`;
  }

  function chatList(logs) {
    if (!Array.isArray(logs) || !logs.length) {
      return '<div class="waiting-copy">本次话单没有返回聊天记录。</div>';
    }
    return `<div class="chat-list">${logs.map(item => `
      <div class="chat-line">
        <span class="chat-role">${item?.role === 'assistant' ? '数字员工' : '候选人'}</span>
        <span>${escapeHtml(item?.text || '')}</span>
        ${item?.begin ? `<div class="candidate-meta">${escapeHtml(item.begin)}</div>` : ''}
      </div>
    `).join('')}</div>`;
  }

  function callbackCard(record) {
    const state = recordState(record);
    const callback = record.callback || {};
    const call = callback.call || {};
    const statusText = state === 'received'
      ? '已收到反馈'
      : (state === 'failed' ? '提交失败' : '等待初面');
    const phone = call.phone || record.phone || '';
    const summary = callback.key_summary || call.summary || callback.state_analysis || '';
    const tags = {
      ...(callback.intention_tag || {}),
      ...(callback.clue_attr || {}),
    };
    const recordUrl = /^https?:\/\//i.test(String(call.recordUrl || ''))
      ? String(call.recordUrl)
      : '';
    return `
      <article class="feedback-card">
        <div class="feedback-main">
          <div class="feedback-head">
            <div>
              <h2 class="candidate-name">${escapeHtml(record.name || '未命名候选人')}</h2>
              <div class="candidate-meta">${escapeHtml(record.position || call.position || '未填写岗位')} · ${escapeHtml(phone || '未填写电话')}</div>
            </div>
            <span class="status ${state}">${statusText}</span>
          </div>
          ${state === 'received' ? `
            <div class="call-strip">
              <span>接听：<b>${answerText(call)}</b></span>
              <span>意向：<b>${intentionText(call)}${call.intentionRank ? ` · ${escapeHtml(call.intentionRank)}级` : ''}</b></span>
              <span>时长：<b>${formatDuration(call.callDurationSeconds, call.callDuration)}</b></span>
              <span>呼叫：<b>${formatDate(call.callMakeTime)}</b></span>
            </div>
            ${summary ? `<p class="feedback-summary">${escapeHtml(summary)}</p>` : ''}
            <div class="field-grid">
              ${field('微信号', callback.wechat_number)}
              ${field('加微状态', Number(call.wechatStatus) === 1 ? '已加微信' : '未加微信')}
              ${field('职业状态', callback.employment_status)}
              ${field('技能类型', callback.skill_type)}
              ${field('学历信息', callback.education_background)}
              ${field('工作地点', callback.work_location)}
              ${field('薪酬福利', callback.compensation_benefits)}
              ${field('使用人员', callback.end_user || record.end_user)}
              ${field('匹配情况', callback.state_analysis, true)}
              ${field('提醒', callback.reminder, true)}
            </div>
            ${tagList(tags)}
            ${recordUrl ? `<a class="record-link" href="${escapeAttr(recordUrl)}" target="_blank" rel="noopener noreferrer">打开通话录音</a>` : ''}
          ` : `
            <div class="waiting-copy ${state === 'failed' ? 'failed-copy' : ''}">
              ${state === 'failed'
                ? escapeHtml(record.last_error || '线索提交失败，请回到人才库检查配置后重试。')
                : '人才线索已提交，等待呼波特完成电话初面并推送反馈。'}
            </div>
          `}
        </div>
        ${state === 'received' ? `
          <details class="details">
            <summary>查看聊天记录与话单详情</summary>
            <div class="details-body">
              <div class="field-grid">
                ${field('通话 ID', call.callId, true)}
                ${field('主叫号码', call.caller)}
                ${field('数字员工岗位', call.position)}
                ${field('呼叫时间', formatDate(call.callMakeTime))}
                ${field('振铃时间', formatDate(call.callRingTime))}
                ${field('应答时间', formatDate(call.callAnswerTime))}
                ${field('挂机时间', formatDate(call.callHangupTime))}
                ${field('微信坐席昵称', call.wechatSeatName)}
                ${field('微信坐席手机号', call.wechatSeatPhone)}
                ${field('线索标签', call.clueImportLabel)}
                ${field('线路状态码', call.sipStatus)}
                ${field('挂机类型', call.hangupType)}
              </div>
              ${chatList(callback.chat_logs)}
            </div>
          </details>
        ` : ''}
      </article>
    `;
  }

  function updateCounts() {
    const counts = { received: 0, waiting: 0, failed: 0 };
    records.forEach(record => { counts[recordState(record)] += 1; });
    document.getElementById('countReceived').textContent = counts.received;
    document.getElementById('countWaiting').textContent = counts.waiting;
    document.getElementById('countFailed').textContent = counts.failed;
  }

  function render() {
    updateCounts();
    const list = document.getElementById('feedbackList');
    if (loadError) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">暂时无法读取初面反馈</div>
          <div>${escapeHtml(loadError)}</div>
        </div>`;
      return;
    }
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    const filter = document.getElementById('statusFilter').value;
    const filtered = records.filter(record => {
      const state = recordState(record);
      if (filter !== 'all' && state !== filter) return false;
      if (!keyword) return true;
      const callback = record.callback || {};
      const call = callback.call || {};
      return [
        record.name, record.phone, record.position, record.end_user,
        callback.key_summary, callback.state_analysis, callback.reminder,
        call.summary, call.phone, call.position,
      ].some(value => String(value || '').toLowerCase().includes(keyword));
    });
    if (!filtered.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">${records.length ? '没有匹配的反馈' : '暂无初面反馈'}</div>
          <div>${records.length ? '请调整搜索词或状态筛选。' : '先在人才库提交候选人，电话初面完成后结果会显示在这里。'}</div>
        </div>`;
      return;
    }
    list.innerHTML = filtered.map(callbackCard).join('');
  }

  async function loadRecords(showSuccess) {
    const button = document.getElementById('refreshButton');
    button.disabled = true;
    button.textContent = '读取中';
    loadError = '';
    try {
      const result = await sendToSW('cmd_whobot_records', {});
      records = Array.isArray(result?.records) ? result.records : [];
      if (showSuccess) showToast('初面反馈已刷新');
    } catch (error) {
      records = [];
      loadError = error?.message || '未知错误';
    } finally {
      button.disabled = false;
      button.textContent = '刷新';
      render();
    }
  }

  async function loadConnection() {
    const state = document.getElementById('connectionState');
    try {
      const result = await sendToSW('cmd_whobot_status', {});
      const connected = result?.connected === true && result?.callback_configured === true;
      state.className = `connection ${connected ? 'connected' : 'error'}`;
      state.textContent = connected ? '话单回调已连接' : '话单回调未配置';
      state.title = result?.message || '';
    } catch (error) {
      state.className = 'connection error';
      state.textContent = '呼波特接口未配置';
      state.title = error?.message || '';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('refreshButton').addEventListener('click', () => loadRecords(true));
    document.getElementById('statusFilter').addEventListener('change', render);
    document.getElementById('searchInput').addEventListener('input', () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(render, 180);
    });
    loadConnection();
    loadRecords(false);
  });
})();
