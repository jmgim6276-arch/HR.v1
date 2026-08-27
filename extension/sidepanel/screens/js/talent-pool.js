/**
 * 人才库页面脚本
 * 管理采集/录入的候选人信息，支持搜索、新增、编辑、删除、CSV导出和一键拨打
 */
(function() {
  'use strict';

  const TALENT_KEY = 'talentPool';
  const COMPANY_KEY = 'outboundCompanyConfig';   // 外呼配置·公司级
  const JOB_CFG_KEY = 'outboundJobConfigs';      // 外呼配置·岗位级（按岗位名）
  const JD_KEY = 'jobDescriptions';              // 岗位JD（按岗位名，jd-collector 抓）
  let talents = [];
  let whobotRecords = [];
  let whobotConnection = { checked: false, connected: false, message: '' };
  const whobotSubmitting = new Set();
  let editingId = null;   // 当前编辑的记录 ID，null 表示新增
  let readonlyMode = false;

  /* ==== 拨打电话适配器（接口待定，后续替换实现） ==== */
  const CALL_ADAPTER = {
    configured: false,
    /**
     * 一键拨打候选人电话
     * @param {object} talent - 人才记录
     * @returns {Promise<{ok:boolean, message:string}>}
     */
    async dial(talent) {
      if (!this.configured) return { ok: false, message: '拨打接口未配置，敬请期待' };
      // 未来接入：return sendToSW('cmd_dial_phone', { talentId: talent.id, phone: talent.phone });
    }
  };

  /** 发送消息到 Service Worker（未来拨打/采集集成使用） */
  async function sendToSW(action, data) {
    const api = window.parent && window.parent.__shellAPI;
    if (api && typeof api.sendToSW === 'function') {
      return api.sendToSW(action, data);
    }
    return chrome.runtime.sendMessage({ action, data });
  }

  /** 从 chrome.storage 加载人才列表 */
  async function loadTalents() {
    try {
      const result = await chrome.storage.local.get(TALENT_KEY);
      talents = result[TALENT_KEY] || [];
    } catch (err) {
      console.error('加载人才库失败:', err);
      talents = [];
    }
    renderTalents();
  }

  /** 将人才列表保存到 chrome.storage */
  async function saveTalents() {
    try {
      await chrome.storage.local.set({ [TALENT_KEY]: talents });
    } catch (err) { console.error(err); }
  }

  async function loadWhobotRecords(showMessage = false) {
    try {
      const result = await sendToSW('cmd_whobot_records', {});
      whobotRecords = Array.isArray(result?.records) ? result.records : [];
      renderTalents();
      if (showMessage) showToast('✅ 已刷新呼波特记录');
    } catch (err) {
      whobotRecords = [];
      if (showMessage) showToast('读取失败：' + (err.message || '未知错误'));
    }
  }

  async function loadWhobotStatus() {
    const badge = document.getElementById('whobotConnectionBadge');
    if (badge) {
      badge.className = 'connection-badge';
      badge.textContent = '正在检测';
    }
    try {
      const result = await sendToSW('cmd_whobot_status', {});
      whobotConnection = {
        checked: true,
        connected: result?.connected === true,
        message: result?.message || '',
      };
    } catch (err) {
      whobotConnection = {
        checked: true,
        connected: false,
        message: err.message || '接口未配置',
      };
    }
    if (badge) {
      badge.className = `connection-badge ${whobotConnection.connected ? 'connected' : 'error'}`;
      badge.textContent = whobotConnection.connected ? '接口正常' : '未配置';
      badge.title = whobotConnection.message;
    }
    renderTalents();
  }

  /** 规范化电话号码：去除空格、横线等分隔符 */
  function normalizePhone(phone) {
    return String(phone || '').replace(/[\s\-()]/g, '');
  }

  /**
   * 查重规则（与未来采集写入端共用同一规则）：
   * 电话非空时按电话匹配；电话为空时按 姓名+岗位 匹配
   * @param {Array} list - 人才列表
   * @param {object} entry - 待保存记录（可含 id，查重时排除自身）
   * @returns {object|null} 命中的已有记录
   */
  function findDuplicate(list, entry) {
    const phone = normalizePhone(entry.phone);
    if (phone) {
      return list.find(t => t.id !== entry.id && normalizePhone(t.phone) === phone) || null;
    }
    if (entry.name) {
      return list.find(t => t.id !== entry.id && t.name === entry.name && (t.position || '') === (entry.position || '')) || null;
    }
    return null;
  }

  /** 格式化时间戳为本地时间 */
  function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleString('zh-CN', { hour12: false });
  }

  /** 拼装元信息行：28岁 · 本科 · 5年 · 前端开发工程师 */
  function buildMeta(t) {
    const parts = [];
    if (t.age) parts.push(t.age + '岁');
    if (t.gender) parts.push(t.gender);
    if (t.city) parts.push(t.city);
    if (t.education) parts.push(t.education);
    if (t.experience) parts.push(t.experience);
    if (t.position) parts.push(t.position);
    return parts.join(' · ');
  }

  /** 渲染人才卡片列表（应用搜索与来源过滤，按入库时间倒序） */
  function renderTalents() {
    const list = document.getElementById('talentList');
    const empty = document.getElementById('emptyState');
    const title = document.getElementById('talentTitle');
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    const source = document.getElementById('sourceFilter').value;

    title.textContent = talents.length ? `人才库 (${talents.length})` : '人才库';

    const filtered = talents
      .filter(t => source === 'all' || (t.source || 'manual') === source)
      .filter(t => {
        if (!keyword) return true;
        return [t.name, t.phone, t.email, t.position, t.city].some(v => String(v || '').toLowerCase().includes(keyword));
      })
      .sort((a, b) => (b.collectedAt || 0) - (a.collectedAt || 0));

    list.innerHTML = '';
    if (filtered.length === 0) {
      empty.style.display = 'block';
      empty.querySelector('p').textContent = talents.length ? '没有匹配的记录' : '暂无人才记录';
      return;
    }
    empty.style.display = 'none';

    filtered.forEach((t) => {
      const isBoss = (t.source || 'manual') === 'boss';
      const hasPhone = !!normalizePhone(t.phone);
      const meta = buildMeta(t);
      const whobotRecord = whobotRecords.find(item => item.talent_id === t.id);
      const submitted = ['submitted', 'callback_received'].includes(whobotRecord?.status) || t.whobot?.status === 'submitted';
      const submitting = whobotSubmitting.has(t.id);
      const canSubmit = hasPhone && whobotConnection.connected && !submitting;
      const card = document.createElement('div');
      card.className = 'talent-item';
      card.innerHTML = `
        <div class="talent-header">
          <div class="talent-name">${escapeHtml(t.name)}</div>
          <span class="badge ${isBoss ? 'badge-boss' : 'badge-manual'}">${isBoss ? 'Boss采集' : '手动录入'}</span>
        </div>
        ${meta ? `<div class="talent-meta">${escapeHtml(meta)}</div>` : ''}
        <div class="talent-phone num ${hasPhone ? '' : 'empty'}">${hasPhone ? '电话：' + escapeHtml(t.phone) : '未填写电话'}</div>
        ${t.email ? `<div class="talent-email">邮箱：${escapeHtml(t.email)}</div>` : '<div class="talent-email">未填写邮箱</div>'}
        <div class="talent-actions">
          <button class="btn btn-ghost btn-whobot ${submitted ? 'submitted' : ''} ${submitting ? 'loading' : ''}" data-action="whobot" data-id="${escapeAttr(t.id)}" ${canSubmit ? '' : 'disabled'} title="${escapeAttr(!hasPhone ? '请先填写手机号' : (!whobotConnection.connected ? '后端尚未配置呼波特项目凭证' : ''))}">
            ${submitting ? '提交中...' : (submitted ? '已提交呼波特' : (!whobotConnection.connected ? '呼波特未配置' : '提交呼波特'))}
          </button>
          <div class="action-group">
            <span class="action-icon info" data-action="detail" data-id="${escapeAttr(t.id)}">详情</span>
            <span class="action-icon" data-action="edit" data-id="${escapeAttr(t.id)}">编辑</span>
            <span class="action-icon danger" data-action="delete" data-id="${escapeAttr(t.id)}">删除</span>
          </div>
        </div>
      `;
      list.appendChild(card);
    });
  }

  /* ==== 新增/编辑/详情弹窗（同一弹窗三种模式） ==== */

  const FIELD_IDS = [
    'fName', 'fAge', 'fGender', 'fPhone', 'fCity', 'fEmail', 'fPosition',
    'fJobDescription', 'fPendingConfirmation', 'fSpecialNotes', 'fEndUser',
    'fEducation', 'fExperience', 'fNote',
  ];

  /**
   * 打开弹窗
   * @param {object|null} talent - 记录，null 表示新增
   * @param {boolean} readonly - 详情只读模式
   */
  function openModal(talent, readonly) {
    editingId = talent ? talent.id : null;
    readonlyMode = !!readonly;
    document.getElementById('editModalTitle').textContent = readonly ? '人才详情' : (talent ? '编辑人才' : '手动录入');
    document.getElementById('fName').value = talent ? (talent.name || '') : '';
    document.getElementById('fAge').value = talent && talent.age ? talent.age : '';
    document.getElementById('fGender').value = talent ? (talent.gender || '') : '';
    document.getElementById('fPhone').value = talent ? (talent.phone || '') : '';
    document.getElementById('fCity').value = talent ? (talent.city || '') : '';
    document.getElementById('fEmail').value = talent ? (talent.email || '') : '';
    document.getElementById('fPosition').value = talent ? (talent.position || '') : '';
    document.getElementById('fJobDescription').value = talent ? (talent.jobDescription || '') : '';
    document.getElementById('fPendingConfirmation').value = talent ? (talent.pendingConfirmation || '') : '';
    document.getElementById('fSpecialNotes').value = talent ? (talent.specialNotes || '') : '';
    document.getElementById('fEndUser').value = talent ? (talent.endUser || '') : '';
    document.getElementById('fEducation').value = talent ? (talent.education || '') : '';
    document.getElementById('fExperience').value = talent ? (talent.experience || '') : '';
    document.getElementById('fNote').value = talent ? (talent.note || '') : '';
    FIELD_IDS.forEach(id => { document.getElementById(id).disabled = readonlyMode; });
    // 详情模式下显示入库时间、隐藏保存按钮
    document.getElementById('fCollectedAtRow').style.display = readonly && talent ? 'block' : 'none';
    if (readonly && talent) document.getElementById('fCollectedAt').value = formatTime(talent.collectedAt);
    document.getElementById('editSave').style.display = readonlyMode ? 'none' : 'inline-flex';
    document.getElementById('editCancel').textContent = readonlyMode ? '关闭' : '取消';
    document.getElementById('editModal').style.display = 'flex';
  }

  function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    editingId = null;
    readonlyMode = false;
  }

  /** 保存弹窗表单（含查重处理） */
  async function saveFromModal() {
    const name = document.getElementById('fName').value.trim();
    if (!name) { showToast('请填写姓名'); return; }
    const ageVal = parseInt(document.getElementById('fAge').value, 10);
    const email = document.getElementById('fEmail').value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('邮箱格式不正确');
      return;
    }
    const entry = {
      id: editingId || ('talent_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
      name: name,
      age: isNaN(ageVal) ? null : ageVal,
      gender: document.getElementById('fGender').value,
      phone: document.getElementById('fPhone').value.trim(),
      city: document.getElementById('fCity').value.trim(),
      email: email,
      position: document.getElementById('fPosition').value.trim(),
      jobDescription: document.getElementById('fJobDescription').value.trim(),
      pendingConfirmation: document.getElementById('fPendingConfirmation').value.trim(),
      specialNotes: document.getElementById('fSpecialNotes').value.trim(),
      endUser: document.getElementById('fEndUser').value.trim(),
      education: document.getElementById('fEducation').value.trim(),
      experience: document.getElementById('fExperience').value.trim(),
      note: document.getElementById('fNote').value.trim(),
    };

    const dup = findDuplicate(talents, entry);
    if (dup && normalizePhone(entry.phone)) {
      // 电话重复：询问是否更新已有记录
      showConfirmDialog(`电话 ${entry.phone} 已存在（${dup.name}），是否更新该记录？`, async () => {
        Object.assign(dup, entry, { id: dup.id, source: dup.source, collectedAt: dup.collectedAt, updatedAt: Date.now() });
        // 若本次是编辑其他记录改成了重复电话，则删除当前编辑的记录避免双份
        if (editingId && editingId !== dup.id) {
          talents = talents.filter(t => t.id !== editingId);
        }
        await saveTalents();
        closeModal();
        renderTalents();
        showToast('✅ 已更新已有记录');
      });
      return;
    }
    if (dup) showToast('注意：已存在同名同岗位记录');

    if (editingId) {
      const existing = talents.find(t => t.id === editingId);
      if (existing) Object.assign(existing, entry, { updatedAt: Date.now() });
    } else {
      talents.push(Object.assign(entry, {
        source: 'manual',
        resumeRaw: '',
        collectedAt: Date.now(),
        updatedAt: Date.now(),
        callHistory: [],
      }));
    }
    await saveTalents();
    closeModal();
    renderTalents();
    showToast('✅ 已保存');
  }

  /** 删除人才记录 */
  function deleteTalent(id) {
    const t = talents.find(x => x.id === id);
    showConfirmDialog(`确定要删除「${t ? t.name : ''}」吗？`, async () => {
      talents = talents.filter(x => x.id !== id);
      await saveTalents();
      renderTalents();
      showToast('✅ 已删除');
    });
  }

  /** 一键拨打（当前为占位实现，接口待接入） */
  async function callTalent(id) {
    const t = talents.find(x => x.id === id);
    if (!t) return;
    if (!normalizePhone(t.phone)) { showToast('该候选人未填写电话'); return; }
    const r = await CALL_ADAPTER.dial(t);
    showToast(r && r.message ? r.message : '拨打失败');
    // 未来：拨打成功后写入 t.callHistory.push({ at: Date.now(), result: r }) 并 saveTalents()
  }

  /** 组装呼波特上传 payload（10 字段契约）。岗位级外呼配置优先，per-talent 字段兜底。 */
  async function buildWhobotPayload(talent, phone) {
    const pos = String(talent.position || '').trim();
    let company = {}, jobCfg = {}, jdRec = null;
    try {
      const stored = await chrome.storage.local.get([COMPANY_KEY, JOB_CFG_KEY, JD_KEY]);
      company = stored[COMPANY_KEY] || {};
      jobCfg = (stored[JOB_CFG_KEY] || {})[pos] || {};
      jdRec = (stored[JD_KEY] || {})[pos] || null;
    } catch (err) { console.error('读取外呼配置失败:', err); }
    return {
      talent_id: talent.id,
      name: talent.name || '',
      phone,
      position: talent.position || '',
      job_description: (jdRec && jdRec.jd) || talent.jobDescription || '',
      pending_confirmation: jobCfg.pendingConfirmation || talent.pendingConfirmation || '',
      special_notes: jobCfg.specialNotes || talent.specialNotes || talent.note || '',
      end_user: company.endUser || talent.endUser || '',
      candidate_issues: jobCfg.candidateIssues || '',
      company_name: company.companyName || '',
      company_information: company.companyInformation || '',
      first_sentence: jobCfg.firstSentence || '',
    };
  }

  function submitTalentToWhobot(id) {
    const talent = talents.find(item => item.id === id);
    if (!talent) return;
    if (!whobotConnection.connected) {
      showToast('后端尚未配置呼波特项目 Token 和渠道密钥');
      return;
    }
    const phone = normalizePhone(talent.phone).replace(/^\+?86/, '');
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请先为候选人填写有效的中国大陆手机号');
      return;
    }
    const message = `确认把「${talent.name || '该候选人'}」的姓名、电话、岗位及招聘备注提交到呼波特项目吗？`;
    showConfirmDialog(message, async () => {
      if (whobotSubmitting.has(id)) return;
      whobotSubmitting.add(id);
      renderTalents();
      try {
        const payload = await buildWhobotPayload(talent, phone);
        const result = await sendToSW('cmd_whobot_submit', payload);
        talent.whobot = {
          status: 'submitted',
          partnerClueId: result?.record?.partner_clue_id || '',
          submittedAt: result?.record?.submitted_at || new Date().toISOString(),
        };
        await saveTalents();
        await loadWhobotRecords();
        showToast('已提交呼波特，等待回调结果');
      } catch (err) {
        showToast('提交失败：' + (err.message || '未知错误'));
        await loadWhobotRecords();
      } finally {
        whobotSubmitting.delete(id);
        renderTalents();
      }
    });
  }

  /** 导出人才库为 CSV（带 BOM，保证 Excel 中文正常） */
  async function exportCsv() {
    if (talents.length === 0) { showToast('人才库为空'); return; }
    let jdMap = {};
    try { jdMap = (await chrome.storage.local.get(JD_KEY))[JD_KEY] || {}; } catch (e) {}
    // 岗位JD 优先用 jd-collector 抓取的（按岗位名），per-talent jobDescription 兜底
    const jdFor = (t) => (jdMap[String(t.position || '').trim()]?.jd) || t.jobDescription || '';
    const esc = (v) => {
      let s = String(v == null ? '' : v);
      // 防 CSV 公式注入：以 = + - @ 等开头的单元格在 Excel 里会被当公式执行
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const header = [
      '姓名', '年龄', '性别', '电话', '邮箱', '城市', '岗位', '岗位JD',
      '电话待确认', '岗位特殊说明', '使用人员', '学历', '经验', '来源',
      '备注', '呼波特状态', '入库时间',
    ];
    const rows = talents.map(t => [
      t.name, t.age || '', t.gender || '', t.phone || '', t.email || '',
      t.city || '', t.position || '', jdFor(t),
      t.pendingConfirmation || '', t.specialNotes || '', t.endUser || '',
      t.education || '', t.experience || '',
      (t.source || 'manual') === 'boss' ? 'Boss采集' : '手动录入',
      t.note || '', t.whobot?.status || '', formatTime(t.collectedAt),
    ].map(esc).join(','));
    const csv = '\ufeff' + header.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `人才库_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('✅ 已导出');
  }

  /** 转义 HTML 特殊字符 */
  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
  }

  /** 转义属性值（额外转义双/单引号，防属性逃逸注入） */
  function escapeAttr(text) {
    return escapeHtml(text)
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** 显示 Toast 提示消息 */
  let _toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 2500);
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

    // 编辑弹窗按钮事件
    document.getElementById('editCancel').addEventListener('click', closeModal);
    document.getElementById('editSave').addEventListener('click', saveFromModal);
    document.getElementById('editModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    // 新增按钮
    document.getElementById('btnAddTalent').addEventListener('click', () => openModal(null, false));
    // 导出按钮
    document.getElementById('btnExportCsv').addEventListener('click', exportCsv);
    // 搜索与来源过滤（搜索防抖）
    let _searchTimer = null;
    document.getElementById('searchInput').addEventListener('input', () => {
      if (_searchTimer) clearTimeout(_searchTimer);
      _searchTimer = setTimeout(renderTalents, 200);
    });
    document.getElementById('sourceFilter').addEventListener('change', renderTalents);

    // 通过事件委托绑定卡片操作按钮
    document.getElementById('talentList').addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl || actionEl.disabled) return;
      const action = actionEl.dataset.action;
      const id = actionEl.dataset.id;
      if (action === 'call') callTalent(id);
      else if (action === 'whobot') submitTalentToWhobot(id);
      else if (action === 'detail') openModal(talents.find(t => t.id === id), true);
      else if (action === 'edit') openModal(talents.find(t => t.id === id), false);
      else if (action === 'delete') deleteTalent(id);
    });

    // 监听存储变化：未来采集流程（Service Worker 写入）时人才库实时刷新
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[TALENT_KEY]) {
        talents = changes[TALENT_KEY].newValue || [];
        renderTalents();
      }
    });

    loadTalents();
    loadWhobotStatus();
    loadWhobotRecords();
  });

})();
