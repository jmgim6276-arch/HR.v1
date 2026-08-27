/**
 * 简历采集控制台页面脚本
 * 管理 Boss 页面简历采集任务的启动、停止和实时日志
 *
 * 消息流：本页 → SW → zhipin 内容脚本串行处理未读会话
 *        → SW 本地提取联系方式 + 可选 LLM 结构化 → talentPool。
 */
(function(){
  'use strict';

  const TASK_TYPE = 'resumeCollect';
  const REPLY_CONFIG_KEY = 'resumeReplyConfig';
  let automationState = 'idle';
  let resumePort = null;
  let requestSeq = 0;
  const pendingRequests = new Map();

  /** 向日志容器添加一条日志 */
  function addLog(type, msg, colorClass) {
    const now = new Date();
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2,'0')).join(':');
    const container = document.getElementById('logContainer');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = time;
    const typeSpan = document.createElement('span');
    typeSpan.className = colorClass;
    typeSpan.textContent = type;
    entry.append(timeSpan, document.createTextNode(' '), typeSpan, document.createTextNode(` ${msg}`));
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
  }

  /** 显示 Toast 提示消息 */
  let _toastTimer = null;
  function showToast(msg, duration) {
    duration = duration || 2500;
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { el.style.opacity = '0'; }, duration);
  }

  /** 根据自动化状态更新UI的按钮状态 */
  function updateUI(state) {
    automationState = state;
    const running = state === 'running';
    document.getElementById('btnStart').disabled = running;
    document.getElementById('btnStop').disabled = !running;
    document.getElementById('runningIndicator').style.display = running ? 'block' : 'none';
    ['maxPerRun', 'intervalSeconds', 'actionDelaySeconds', 'autoSendReply'].forEach(id => {
      document.getElementById(id).disabled = running;
    });
  }

  function updateStatusText(text) {
    const el = document.getElementById('runningStatusText');
    if (el) el.textContent = text || '简历采集运行中...';
  }

  /** 更新采集统计（未来由 STATUS_UPDATE 携带的数据驱动） */
  function updateStats(stats) {
    if (!stats) return;
    if (stats.collected !== undefined) document.getElementById('statCollected').textContent = stats.collected;
    if (stats.saved !== undefined) document.getElementById('statSaved').textContent = stats.saved;
    if (stats.updated !== undefined) document.getElementById('statUpdated').textContent = stats.updated;
    if (stats.skipped !== undefined) document.getElementById('statSkipped').textContent = stats.skipped;
    if (stats.replied !== undefined) document.getElementById('statReplied').textContent = stats.replied;
  }

  function handleWorkerEvent(message) {
    if (message?.requestId && pendingRequests.has(message.requestId)) {
      const pending = pendingRequests.get(message.requestId);
      pendingRequests.delete(message.requestId);
      clearTimeout(pending.timer);
      if (message.action === 'error') pending.reject(new Error(message.data?.error || '请求失败'));
      else pending.resolve(message.data);
      return;
    }
    if (message?.action === 'running_log' && message.data?.taskType === TASK_TYPE) {
      const text = message.data.message || '';
      let colorClass = 'log-sys';
      let typeLabel = '[系统]';
      if (text.startsWith('📥')) { colorClass = 'log-collect'; typeLabel = '[采集]'; }
      else if (text.startsWith('⏭')) { colorClass = 'log-skip'; typeLabel = '[跳过]'; }
      else if (text.startsWith('💬')) { colorClass = 'log-reply'; typeLabel = '[回复]'; }
      addLog(typeLabel, text, colorClass);
      return;
    }
    if (message?.action === 'status_update' && message.data?.taskType === TASK_TYPE) {
      updateUI(message.data.state);
      updateStatusText(message.data.statusText);
      updateStats(message.data.stats);
    }
  }

  function connectResumePort() {
    if (resumePort) return;
    try {
      resumePort = chrome.runtime.connect({ name: 'resume-collect-panel' });
      resumePort.onMessage.addListener(handleWorkerEvent);
      resumePort.onDisconnect.addListener(() => {
        resumePort = null;
        for (const pending of pendingRequests.values()) {
          clearTimeout(pending.timer);
          pending.reject(new Error('简历采集服务连接已断开'));
        }
        pendingRequests.clear();
        setTimeout(connectResumePort, 1000);
      });
    } catch (_) {
      resumePort = null;
    }
  }

  /** 发送消息到简历采集 Service Worker 模块 */
  async function sendToSW(action, data) {
    connectResumePort();
    if (!resumePort) return chrome.runtime.sendMessage({ action, data });
    return new Promise((resolve, reject) => {
      const requestId = `resume_${Date.now()}_${++requestSeq}`;
      const timer = setTimeout(() => {
        pendingRequests.delete(requestId);
        reject(new Error('请求超时'));
      }, 20000);
      pendingRequests.set(requestId, { resolve, reject, timer });
      try {
        resumePort.postMessage({ action, data, requestId });
      } catch (err) {
        clearTimeout(timer);
        pendingRequests.delete(requestId);
        reject(err);
      }
    });
  }

  function getConfigFromForm() {
    return {
      maxPerRun: Number(document.getElementById('maxPerRun').value) || 5,
      intervalSeconds: Number(document.getElementById('intervalSeconds').value) || 60,
      actionDelaySeconds: Number(document.getElementById('actionDelaySeconds').value) || 4,
      autoSendReply: document.getElementById('autoSendReply').checked,
    };
  }

  function applyConfig(config) {
    if (!config) return;
    if (config.maxPerRun) document.getElementById('maxPerRun').value = config.maxPerRun;
    if (config.intervalSeconds) document.getElementById('intervalSeconds').value = config.intervalSeconds;
    if (config.actionDelaySeconds) document.getElementById('actionDelaySeconds').value = config.actionDelaySeconds;
    document.getElementById('autoSendReply').checked = config.autoSendReply === true;
    refreshReplyStatus();
  }

  function normalizeReplyMessages(config) {
    if (Array.isArray(config?.messages)) return config.messages.map(item => String(item || '').trim()).filter(Boolean).slice(0, 5);
    if (typeof config?.content === 'string' && config.content.trim()) return [config.content.trim()];
    return [];
  }

  async function loadReplyMessages() {
    const stored = await chrome.storage.local.get(REPLY_CONFIG_KEY);
    return normalizeReplyMessages(stored[REPLY_CONFIG_KEY]);
  }

  async function refreshReplyStatus() {
    const enabled = document.getElementById('autoSendReply').checked;
    const status = document.getElementById('replyStatus');
    if (!enabled) {
      status.style.display = 'none';
      status.textContent = '';
      return;
    }
    const messages = await loadReplyMessages().catch(() => []);
    status.style.display = 'block';
    status.textContent = messages.length
      ? `已配置 ${messages.length} 条话术；启动后将在每份简历入库完成后依次发送。`
      : '尚未配置有效话术，请先到“简历回复配置”填写并保存。';
  }

  document.getElementById('btnStart').addEventListener('click', async () => {
    const config = getConfigFromForm();
    if (config.intervalSeconds < 60) {
      showToast('候选人间隔不能少于 60 秒');
      return;
    }
    if (config.actionDelaySeconds < 4) {
      showToast('关键操作等待不能少于 4 秒');
      return;
    }
    if (config.autoSendReply) {
      const messages = await loadReplyMessages().catch(() => []);
      if (!messages.length) {
        showToast('请先到“简历回复配置”保存至少一条话术', 4000);
        return;
      }
      const approved = window.confirm([
        '启动前请确认自动发送范围',
        '',
        `本轮最多处理：${config.maxPerRun} 位候选人`,
        `每位候选人：简历成功入库后发送 ${messages.length} 条真实消息`,
        `候选人间隔：至少 ${config.intervalSeconds} 秒`,
        '',
        '消息将按“简历回复配置”的顺序自动输入并发送，不再逐条确认。是否启动？',
      ].join('\n'));
      if (!approved) return;
    }
    updateUI('running');
    updateStatusText('正在启动并检查沟通页面...');
    try {
      const result = await sendToSW('cmd_start_resume_collect', config);
      if (!result?.ok) throw new Error(result?.error || '启动失败');
      updateUI(result.state || 'running');
      updateStatusText(result.statusText);
      updateStats(result.stats);
    } catch (err) {
      updateUI('idle');
      addLog('[系统]', '启动失败：' + err.message, 'log-sys');
      showToast('启动失败：' + err.message, 4000);
    }
  });

  document.getElementById('btnStop').addEventListener('click', async () => {
    try {
      const result = await sendToSW('cmd_stop_resume_collect');
      updateUI('idle');
      updateStatusText(result?.statusText || '已停止');
      updateStats(result?.stats);
      addLog('[系统]', '简历采集已停止', 'log-sys');
    } catch (err) {
      showToast('停止失败：' + err.message);
    }
  });

  // 查看人才库
  document.getElementById('btnGoTalentPool').addEventListener('click', () => {
    try {
      window.parent.postMessage({ type: 'NAVIGATE', src: 'screens/talent-pool.html' }, '*');
    } catch (e) {
      console.error('导航失败:', e);
    }
  });

  // 监听来自 shell 的实时运行日志与状态更新（未来采集流程接入后生效）
  window.addEventListener('message', (event) => {
    // 从 shell 恢复的缓存日志（切换模块后重新加载时）
    if (event.data?.type === 'CACHED_LOGS' && event.data?.taskType === TASK_TYPE) {
      renderCachedLogs(event.data.logs);
      return;
    }

    if (event.data?.type === 'RUNNING_LOG') {
      // 仅处理简历采集相关的日志
      if (event.data.taskType !== TASK_TYPE) return;
      const message = event.data.message || '';
      // 根据消息前缀识别类型：📥 = 采集到候选人（绿色），⏭ = 跳过（蓝色）
      let colorClass = 'log-sys';
      let typeLabel = '[系统]';
      if (message.startsWith('📥')) {
        colorClass = 'log-collect';
        typeLabel = '[采集]';
      } else if (message.startsWith('⏭')) {
        colorClass = 'log-skip';
        typeLabel = '[跳过]';
      } else if (message.startsWith('💬')) {
        colorClass = 'log-reply';
        typeLabel = '[回复]';
      }
      addLog(typeLabel, message, colorClass);
      return;
    }

    if (event.data?.type === 'STATUS_UPDATE' && event.data?.taskType === TASK_TYPE) {
      updateUI(event.data.state);
      updateStatusText(event.data.statusText);
      updateStats(event.data.stats);
    }
  });

  /**
   * 渲染缓存的日志（切换模块后恢复显示）
   * @param {Array} logs - 缓存日志数组，每项包含 { time, message }
   */
  function renderCachedLogs(logs) {
    if (!logs || logs.length === 0) return;
    const container = document.getElementById('logContainer');
    container.innerHTML = '';
    logs.forEach(log => {
      const message = log.message || '';
      let colorClass = 'log-sys';
      let typeLabel = '[系统]';
      if (message.startsWith('📥')) {
        colorClass = 'log-collect';
        typeLabel = '[采集]';
      } else if (message.startsWith('⏭')) {
        colorClass = 'log-skip';
        typeLabel = '[跳过]';
      } else if (message.startsWith('💬')) {
        colorClass = 'log-reply';
        typeLabel = '[回复]';
      }
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      const timeSpan = document.createElement('span');
      timeSpan.className = 'log-time';
      timeSpan.textContent = log.time || '--:--:--';
      const typeSpan = document.createElement('span');
      typeSpan.className = colorClass;
      typeSpan.textContent = typeLabel;
      entry.append(timeSpan, document.createTextNode(' '), typeSpan, document.createTextNode(` ${message}`));
      container.appendChild(entry);
    });
    container.scrollTop = container.scrollHeight;
  }

  /** 从父框架主动拉取缓存的日志并渲染（切换菜单再切回时恢复） */
  function restoreCachedLogs() {
    try {
      const api = window.parent?.__shellAPI;
      if (api && typeof api.getCachedLogs === 'function') {
        const logs = api.getCachedLogs(TASK_TYPE);
        renderCachedLogs(logs);
      }
    } catch (e) { /* 跨域或 API 不可用时静默忽略 */ }
  }

  /** 清空实时运行日志，并通知 Shell 清除缓存 */
  function clearLog() {
    const container = document.getElementById('logContainer');
    container.innerHTML = '';
    const now = new Date();
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">${time}</span> <span class="log-sys">[系统]</span> 日志已清空`;
    container.appendChild(entry);
    try {
      window.parent.postMessage({ type: 'CLEAR_CACHE', taskType: TASK_TYPE }, '*');
    } catch (e) { /* 忽略 */ }
  }

  document.getElementById('btnClearLog').addEventListener('click', clearLog);

  /** 导出实时运行日志为 .txt 文件 */
  function exportLog() {
    const container = document.getElementById('logContainer');
    const entries = container.querySelectorAll('.log-entry');
    if (entries.length === 0) return;

    const lines = [];
    lines.push('=== 简历采集运行日志 ===');
    lines.push(`导出时间: ${new Date().toLocaleString()}`);
    lines.push('='.repeat(40));
    lines.push('');

    entries.forEach(entry => {
      lines.push(entry.textContent.trim());
    });

    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `简历采集运行日志_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.getElementById('btnExportLog').addEventListener('click', exportLog);
  document.getElementById('autoSendReply').addEventListener('change', refreshReplyStatus);

  // DOM 就绪时恢复缓存日志和任务状态
  document.addEventListener('DOMContentLoaded', async () => {
    connectResumePort();
    restoreCachedLogs();
    try {
      const status = await sendToSW('cmd_get_resume_collect_status');
      if (status) {
        applyConfig(status.config);
        updateUI(status.state || 'idle');
        updateStatusText(status.statusText);
        updateStats(status.stats);
      }
    } catch (err) {
      addLog('[系统]', '状态读取失败：' + err.message, 'log-sys');
    }
  });

})();
