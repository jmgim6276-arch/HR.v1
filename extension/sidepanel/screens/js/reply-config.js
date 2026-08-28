/**
 * 大模型（托管）配置页逻辑
 * 外部 JS 文件（CSP 合规，替代内联脚本）
 *
 * 两段式：上=余额区（托管点数：余额/今日/本月 + 预警 + 明细 + 充值 + 补打），
 *        下=行为配置（对话轮次/通用知识库/用户提示词，离焦自动保存）。
 * 前端只显示点数，永不展示 token/单价/换算率。
 */
(function () {
  'use strict';

  /** 存储键 */
  const MODEL_CONFIG_KEY = 'modelConfig';
  const KB_KEY = 'generalKnowledgeBase';
  const AUTH_KEY = 'profileAuth';
  const SUBSCRIPTION_KEY = 'profileSubscription';
  const TALENT_KEY = 'talentPool';
  const BALANCE_CACHE_KEY = 'billingBalanceCache';
  const BALANCE_CACHE_TTL = 30 * 1000; // 余额轮询缓存 30s

  const $ = (id) => document.getElementById(id);

  /** 当前行为配置数据 */
  let modelConfig = { userPrompt: '', maxHistoryRounds: 20 };

  /* ─── 与 SW 通信（command 约定，与打分页一致）─── */
  function sendCommand(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (resp) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        resolve(resp);
      });
    });
  }

  /* ═══ 余额区 ═══ */

  function warnBanner(warnLevel) {
    const banner = $('balanceBanner');
    banner.className = 'balance-banner';
    banner.textContent = '';
    if (warnLevel === 'soft') {
      banner.classList.add('soft');
      banner.textContent = '💡 余额偏低，建议及时充值以免自动化中断。';
    } else if (warnLevel === 'hard') {
      banner.classList.add('hard');
      banner.textContent = '⚠️ 余额即将用尽，自动化随时可能暂停，请立即充值。';
    } else if (warnLevel === 'exhausted') {
      banner.classList.add('exhausted');
      banner.textContent = '⛔ 点数不足，自动化已暂停。充值后自动恢复。';
    }
  }

  function renderBalance(bal) {
    const balance = Number(bal.balance_points ?? 0);
    const warn = bal.warn_level || 'none';
    const balEl = $('statBalance');
    balEl.textContent = balance.toFixed(2);
    balEl.className = 'stat-value' + (warn === 'exhausted' ? ' danger' : (warn === 'hard' || warn === 'soft') ? ' warn' : '');
    $('statToday').textContent = Number(bal.today_consume_points ?? 0).toFixed(2);
    $('statMonth').textContent = Number(bal.month_consume_points ?? 0).toFixed(2);
    warnBanner(warn);
  }

  /** 拉取余额（带 30s 会话缓存；force=true 强制刷新） */
  async function loadBalance(force = false) {
    try {
      if (!force) {
        const cached = (await chrome.storage.session.get(BALANCE_CACHE_KEY))[BALANCE_CACHE_KEY];
        if (cached && Date.now() - cached.at < BALANCE_CACHE_TTL && cached.data) {
          renderBalance(cached.data);
          return;
        }
      }
      const resp = await sendCommand({ command: 'cmd_get_billing_balance' });
      if (!resp || !resp.ok) throw new Error((resp && resp.error) || '余额查询失败');
      renderBalance(resp.balance);
      await chrome.storage.session.set({ [BALANCE_CACHE_KEY]: { at: Date.now(), data: resp.balance } });
    } catch (err) {
      $('statBalance').textContent = '--';
      // 未登录/会话失效时静默降级，不打扰配置页
      if (!/登录|会话|未登录/.test(err.message)) showToast('余额查询失败：' + err.message);
    }
  }

  /* ─── 明细折叠 ─── */
  const SCENE_LABELS = {
    reply_judge: '回复判断',
    resume_score: '简历打分',
    collect_score: '入库打分',
    collect_extract: '简历提取',
  };
  const KIND_LABELS = { signup_bonus: '注册赠送', recharge: '充值', adjust: '人工调整' };

  function txLabel(item) {
    if (item.kind === 'consume') return SCENE_LABELS[item.scene] || '大模型调用';
    return KIND_LABELS[item.kind] || item.kind || '变动';
  }

  async function loadTransactions() {
    const list = $('txList');
    list.innerHTML = '';
    try {
      const resp = await sendCommand({ command: 'cmd_get_billing_transactions', limit: 30 });
      const items = (resp && resp.items) || [];
      $('txEmpty').style.display = items.length ? 'none' : 'block';
      for (const item of items) {
        const row = document.createElement('div');
        row.className = 'tx-item';
        const left = document.createElement('div');
        const scene = document.createElement('div');
        scene.className = 'tx-scene';
        scene.textContent = txLabel(item);
        const time = document.createElement('div');
        time.className = 'tx-time';
        time.textContent = item.created_at
          ? new Date(item.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
          : '';
        left.appendChild(scene);
        left.appendChild(time);
        const delta = document.createElement('div');
        const pts = Number(item.delta_points ?? 0);
        delta.className = 'tx-delta ' + (pts < 0 ? 'minus' : 'plus');
        delta.textContent = (pts > 0 ? '+' : '') + pts.toFixed(2);
        row.appendChild(left);
        row.appendChild(delta);
        list.appendChild(row);
      }
    } catch (err) {
      list.innerHTML = '<div class="tx-empty">明细加载失败</div>';
    }
  }

  function toggleTx() {
    const panel = $('txPanel');
    const open = panel.classList.toggle('open');
    $('btnTxToggle').textContent = open ? '明细 ▴' : '明细 ▾';
    if (open) loadTransactions();
  }

  /* ─── 充值弹层 ─── */
  async function openRecharge() {
    $('rechargeModal').classList.add('show');
    try {
      const auth = (await chrome.storage.local.get(AUTH_KEY))[AUTH_KEY] || {};
      $('acctEmail').textContent = auth.email || '（请提供注册邮箱）';
    } catch (_) {
      $('acctEmail').textContent = '（请提供注册邮箱）';
    }
  }
  function closeRecharge() {
    $('rechargeModal').classList.remove('show');
    loadBalance(true); // 关闭弹层后刷新余额（可能已人工充值）
  }

  /* ─── 补打待打分 ─── */
  async function refreshRescoreEntry() {
    try {
      const stored = await chrome.storage.local.get(TALENT_KEY);
      const talents = Array.isArray(stored[TALENT_KEY]) ? stored[TALENT_KEY] : [];
      const pending = talents.filter((t) => t.scorePending).length;
      const row = $('rescoreRow');
      if (pending > 0) {
        row.classList.add('show');
        $('btnRescore').textContent = `补打待打分简历（${pending}）`;
      } else {
        row.classList.remove('show');
      }
    } catch (_) {}
  }

  async function rescorePending() {
    const btn = $('btnRescore');
    btn.disabled = true;
    btn.textContent = '补打中…';
    try {
      const resp = await sendCommand({ command: 'cmd_rescore_pending' });
      if (!resp || resp.ok === false) throw new Error((resp && resp.error) || '补打失败');
      showToast(`✅ 已补打 ${resp.rescored || 0} 条` + (resp.remaining ? `，剩余 ${resp.remaining} 条待打` : ''));
    } catch (err) {
      showToast('❌ ' + err.message);
    } finally {
      btn.disabled = false;
      await refreshRescoreEntry();
      loadBalance(true); // 补打扣了点数，刷新余额
    }
  }

  /* ═══ 行为配置 ═══ */

  async function loadConfig() {
    try {
      const result = await chrome.storage.local.get([MODEL_CONFIG_KEY, KB_KEY, SUBSCRIPTION_KEY]);
      modelConfig = result[MODEL_CONFIG_KEY] || modelConfig;
      $('maxHistoryRounds').value = modelConfig.maxHistoryRounds ?? 20;
      $('userPrompt').value = modelConfig.userPrompt || '';
      $('generalKnowledgeBase').value = result[KB_KEY] || '';
      // 会员徽标（gold 专属会员语义）
      const sub = result[SUBSCRIPTION_KEY] || {};
      if (sub.isVip) $('vipBadge').style.display = 'inline';
      // 托管模式提示（本版本对所有用户显示，说明无需再填密钥）
      $('hostedNote').style.display = 'flex';
    } catch (err) {
      console.error('加载配置失败:', err);
    }
  }

  async function autoSave() {
    const data = {
      userPrompt: $('userPrompt').value.trim(),
      maxHistoryRounds: parseInt($('maxHistoryRounds').value, 10) || 20,
    };
    try {
      await chrome.storage.local.set({
        [MODEL_CONFIG_KEY]: data,
        [KB_KEY]: $('generalKnowledgeBase').value.trim(),
      });
      modelConfig = data;
      showToast('✅ 配置已自动保存');
    } catch (err) {
      showToast('❌ 保存失败: ' + err.message);
    }
  }

  function bindAutoSave(elementId) {
    const el = $(elementId);
    if (el) el.addEventListener('blur', autoSave);
  }

  /* ─── Toast ─── */
  let _toastTimer = null;
  function showToast(msg, duration = 2500) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { el.style.opacity = '0'; }, duration);
  }

  /* ─── 初始化 ─── */
  document.addEventListener('DOMContentLoaded', async () => {
    bindAutoSave('maxHistoryRounds');
    bindAutoSave('userPrompt');
    bindAutoSave('generalKnowledgeBase');

    $('btnRecharge').addEventListener('click', openRecharge);
    $('btnCloseModal').addEventListener('click', closeRecharge);
    $('rechargeModal').addEventListener('click', (e) => { if (e.target === $('rechargeModal')) closeRecharge(); });
    $('btnTxToggle').addEventListener('click', toggleTx);
    $('btnRescore').addEventListener('click', rescorePending);

    await loadConfig();
    await loadBalance();
    await refreshRescoreEntry();
  });
})();
