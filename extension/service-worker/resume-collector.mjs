/**
 * 简历采集 Service Worker 扩展模块。
 * 负责侧栏命令转发、简历文本汇总、本地联系方式提取、可选 LLM 结构化及人才库写入。
 */

const ACTION = {
  CMD_START: 'cmd_start_resume_collect',
  CMD_STOP: 'cmd_stop_resume_collect',
  CMD_STATUS: 'cmd_get_resume_collect_status',
  CS_START: 'rc_start',
  CS_RESUME: 'rc_resume',
  CS_STOP: 'rc_stop',
  CS_STATUS: 'rc_get_status',
  LOG: 'rc_log',
  STATUS: 'rc_status_update',
  EXTRACT: 'rc_extract_resume',
};

const AUTH_API_BASE = 'https://hr.uf-tree.com/api/v1';
const AUTH_KEY = 'profileAuth';
const SUBSCRIPTION_KEY = 'profileSubscription';
const INSTALLATION_ID_KEY = 'installationId';

async function requireCollectorSubscriptionOnline() {
  const stored = await chrome.storage.local.get([AUTH_KEY, INSTALLATION_ID_KEY]);
  const auth = stored[AUTH_KEY] || {};
  const deviceId = stored[INSTALLATION_ID_KEY];
  if (!auth.accessToken || !auth.refreshToken || !deviceId) {
    throw new Error('请先登录个人中心');
  }

  const requestProfile = token => fetch(`${AUTH_API_BASE}/users/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Device-Id': deviceId,
    },
  });
  let response;
  try {
    response = await requestProfile(auth.accessToken);
  } catch (_) {
    throw new Error('网络异常，无法验证登录与订阅，已禁止启动采集');
  }

  if (!response.ok) {
    const failure = await response.json().catch(() => ({}));
    if (failure.code === 'TOKEN_EXPIRED') {
      let refreshResponse;
      try {
        globalThis.__kxzpRefreshPromise ||= fetch(`${AUTH_API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
            body: JSON.stringify({ refresh_token: auth.refreshToken, device_id: deviceId }),
          })
          .then(async result => {
            if (!result.ok) {
              const failure = await result.json().catch(() => ({}));
              const error = new Error(failure.detail || '登录会话已失效');
              error.code = failure.code || '';
              throw error;
            }
            return result.json();
          })
          .finally(() => { globalThis.__kxzpRefreshPromise = null; });
        const refreshed = await globalThis.__kxzpRefreshPromise;
        auth.accessToken = refreshed.access_token;
        auth.refreshToken = refreshed.refresh_token;
        auth.sessionId = refreshed.session?.id || auth.sessionId || '';
        await chrome.storage.local.set({ [AUTH_KEY]: auth });
        response = await requestProfile(auth.accessToken);
        refreshResponse = { ok: true };
      } catch (_) {
        await chrome.storage.local.remove([AUTH_KEY, SUBSCRIPTION_KEY]);
        throw new Error('登录会话已失效或网络不可用，请重新登录');
      }
    } else {
      if (response.status === 401 || response.status === 403) {
        await chrome.storage.local.remove([AUTH_KEY, SUBSCRIPTION_KEY]);
      }
      throw new Error(failure.detail || '登录会话校验失败');
    }
  }
  if (!response.ok) throw new Error('登录会话校验失败');
  const profile = await response.json();
  const subscription = (profile.subscriptions || []).find(item => item.status === 'active');
  const expired = subscription?.ends_at && new Date() > new Date(subscription.ends_at);
  if (!subscription || expired) throw new Error('订阅已到期或未开通，无法启动简历采集');
  return profile;
}

/**
 * 托管大模型调用：authed POST 到后端（密钥只在服务器，插件仅用登录态 token）。
 * 与 requireCollectorSubscriptionOnline 共用 token 刷新（__kxzpRefreshPromise 去重）。
 * 失败抛带 status/code 的 Error；402 / BILLING_INSUFFICIENT_BALANCE 即「断粮」。
 */
async function collectorApiPost(path, body) {
  const stored = await chrome.storage.local.get([AUTH_KEY, INSTALLATION_ID_KEY]);
  const auth = stored[AUTH_KEY] || {};
  const deviceId = stored[INSTALLATION_ID_KEY];
  if (!auth.accessToken || !deviceId) {
    const err = new Error('请先登录个人中心');
    err.code = 'NOT_LOGGED_IN';
    throw err;
  }
  const doPost = token => fetch(`${AUTH_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Device-Id': deviceId,
    },
    body: JSON.stringify(body || {}),
  });
  let response;
  try {
    response = await doPost(auth.accessToken);
  } catch (_) {
    const err = new Error('网络异常，无法连接托管大模型服务');
    err.code = 'LLM_NETWORK';
    throw err;
  }
  // 401 token 过期 → 刷新后重试一次（与订阅校验同模式）
  if (response.status === 401) {
    const failure = await response.json().catch(() => ({}));
    if (failure.code === 'TOKEN_EXPIRED' && auth.refreshToken) {
      try {
        globalThis.__kxzpRefreshPromise ||= fetch(`${AUTH_API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
          body: JSON.stringify({ refresh_token: auth.refreshToken, device_id: deviceId }),
        })
          .then(async result => {
            if (!result.ok) {
              const f = await result.json().catch(() => ({}));
              const err = new Error(f.detail || '登录会话已失效');
              err.code = f.code || '';
              throw err;
            }
            return result.json();
          })
          .finally(() => { globalThis.__kxzpRefreshPromise = null; });
        const refreshed = await globalThis.__kxzpRefreshPromise;
        auth.accessToken = refreshed.access_token;
        auth.refreshToken = refreshed.refresh_token || auth.refreshToken;
        auth.sessionId = refreshed.session?.id || auth.sessionId || '';
        await chrome.storage.local.set({ [AUTH_KEY]: auth });
        response = await doPost(auth.accessToken);
      } catch (refreshErr) {
        const err = new Error(refreshErr.message || '登录已过期，请重新登录');
        err.code = refreshErr.code || 'SESSION_EXPIRED';
        throw err;
      }
    }
  }
  if (!response.ok) {
    const failure = await response.json().catch(() => ({}));
    const err = new Error(failure.detail || failure.message || `请求失败（HTTP ${response.status}）`);
    err.status = response.status;
    err.code = failure.code || '';
    throw err;
  }
  return response.json();
}

function isBillingBlockError(err) {
  return Boolean(err) && (err.code === 'BILLING_INSUFFICIENT_BALANCE' || err.status === 402);
}

// 断粮强提示（面板内）：节流 60s，避免批量 402 时刷屏运行日志。
let lastBillingWarnAt = 0;
function warnBillingBlocked(context) {
  const now = Date.now();
  if (now - lastBillingWarnAt < 60 * 1000) return;
  lastBillingWarnAt = now;
  broadcastLog(`⚠️ 点数不足，${context}已暂停；请到「大模型（托管）」页充值后继续使用`, 'warn');
}

const TASK_TYPE = 'resumeCollect';
const TALENT_KEY = 'talentPool';
const CONFIG_KEY = 'resumeCollectConfig';
const REPLY_CONFIG_KEY = 'resumeReplyConfig';
const sidePanelPorts = new Set();
let activeTabId = null;
let lastStatus = { state: 'idle', statusText: '等待启动', stats: { collected: 0, saved: 0, updated: 0, skipped: 0, replied: 0 } };

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function safePost(port, message) {
  try { port.postMessage(message); } catch (_) {}
}

function broadcast(action, data) {
  for (const port of sidePanelPorts) safePost(port, { action, data });
}

function broadcastLog(message, level = 'info') {
  broadcast('running_log', { taskType: TASK_TYPE, level, message, time: Date.now() });
}

function broadcastStatus(status) {
  lastStatus = {
    state: status?.state || 'idle',
    statusText: status?.statusText || '',
    stats: status?.stats || lastStatus.stats,
    config: status?.config || lastStatus.config || null,
  };
  broadcast('status_update', { ...lastStatus, taskType: TASK_TYPE });
}

function normalizePhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '').replace(/^\+?86/, '');
}

function normalizeText(text) {
  return String(text || '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
}

export function normalizeReplyMessages(config) {
  const source = Array.isArray(config?.messages)
    ? config.messages
    : (typeof config?.content === 'string' ? [config.content] : []);
  return source
    .map(item => String(item || '').trim().slice(0, 1000))
    .filter(Boolean)
    .slice(0, 5);
}

function extractFirst(regex, text, group = 1) {
  const match = regex.exec(text);
  return match ? normalizeText(match[group] || '') : '';
}

export function extractLocalFields(rawText, meta = {}, compactText = '') {
  const text = normalizeText(rawText);
  const compact = normalizeText(compactText).replace(/\s+/g, '');
  const contactText = `${text}\n${String(compactText || '')}`;
  const phone = extractFirst(
    /(?:^|\D)((?:\+?[\s-]*8[\s-]*6[\s-]*)?1[\s-]*[3-9](?:[\s-]*\d){9})(?!\d)/,
    contactText,
  ).replace(/[\s-]/g, '').replace(/^\+?86/, '');
  const emailText = contactText
    .replace(/\s*@\s*/g, '@')
    .replace(/([A-Z0-9_%+-])\s*\.\s*(?=[A-Z0-9])/gi, '$1.');
  const email = extractFirst(/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i, emailText);
  const ageText = extractFirst(/(?:年龄[:：]?\s*)?([1-6]\d)\s*岁/, text) ||
    extractFirst(/(?:年龄[:：]?)?([1-6]\d)岁/, compact);
  const gender = extractFirst(/(?:性别[:：]?\s*)?(男|女)(?:\s|\||[,，]|$)/, text) ||
    extractFirst(/(?:性别[:：]?)?(男|女)(?=\d{2}岁|\||[,，]|$)/, compact);
  const city = extractFirst(/(?:现居|所在地|居住地|籍贯|期望城市|城市)[:：]?\s*([^|,，;；\s]{2,12})/, text);
  const experience = extractFirst(/(\d{1,2}\s*年(?:以上)?(?:工作)?经验)/, text) ||
    extractFirst(/(\d{1,2}年(?:以上)?(?:工作)?经验)/, compact);
  const educationOrder = ['博士', '硕士', '本科', '大专', '高中', '中专'];
  const education = educationOrder.find(item => text.includes(item) || compact.includes(item)) || '';
  let name = normalizeText(meta.name || '');
  if (!name) {
    name = extractFirst(/(?:姓名[:：]\s*)?([\u4e00-\u9fa5·]{2,8})(?=\s*(?:男|女|\||,|，|\d{2}\s*岁))/, text);
  }
  return {
    name,
    age: ageText ? Number(ageText) : null,
    gender,
    city,
    phone,
    email,
    position: normalizeText(meta.position || ''),
    education,
    experience,
    note: '',
  };
}

export function maskContacts(text) {
  return String(text || '')
    .replace(/(?:\+?[\s-]*8[\s-]*6[\s-]*)?1[\s-]*[3-9](?:[\s-]*\d){9}/g, '[手机号已在本地提取]')
    .replace(/[A-Z0-9._%+-]+(?:\s*[A-Z0-9._%+-])*\s*@\s*[A-Z0-9-]+(?:\s*[A-Z0-9-])*\s*\.\s*[A-Z](?:\s*[A-Z])+/gi, '[邮箱已在本地提取]');
}

function parseJsonObject(text) {
  let value = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start >= 0 && end > start) value = value.slice(start, end + 1);
  return JSON.parse(value);
}

async function extractWithModel(rawText) {
  const prompt = [
    '你是招聘简历信息整理器。输入文本来自不同版式的简历，顺序可能有少量错乱。',
    '只整理明确出现的信息，禁止猜测。严格只输出 JSON：',
    '{"name":"","age":null,"gender":"","city":"","position":"","education":"","experience":"","note":""}',
    'age 必须是数字或 null；note 最多 80 个汉字，概括求职方向与核心经历。',
    '联系方式已由本地规则处理，不要输出电话或邮箱。',
  ].join('\n');
  try {
    // /llm/chat 为透传（服务端不脱敏），故沿用本地 maskContacts 后再上送。
    const json = await collectorApiPost('/llm/chat', {
      scene: 'collect_extract',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: maskContacts(rawText).slice(0, 16000) },
      ],
      max_tokens: 600,
      temperature: 0.1,
    });
    return parseJsonObject(json?.content || '');
  } catch (err) {
    if (isBillingBlockError(err)) return null; // 断粮 → 回落本地提取，采集继续
    throw err;
  }
}

function mergeFields(localFields, modelFields, meta) {
  const text = (value) => normalizeText(value || '');
  const age = Number(modelFields?.age || localFields.age || 0);
  return {
    name: text(modelFields?.name) || localFields.name || text(meta.name) || '未知候选人',
    age: age >= 16 && age <= 80 ? age : null,
    gender: text(modelFields?.gender) || localFields.gender,
    city: text(modelFields?.city) || localFields.city,
    phone: normalizePhone(localFields.phone),
    email: localFields.email,
    position: text(modelFields?.position) || localFields.position || text(meta.position),
    education: text(modelFields?.education) || localFields.education,
    experience: text(modelFields?.experience) || localFields.experience,
    note: text(modelFields?.note || localFields.note).slice(0, 200),
  };
}

/* ─── 入库即自动打分（决策：VIP 用户；用 resumeRaw + 该岗位 JD 调大模型；失败不阻塞采集） ─── */
const JD_KEY = 'jobDescriptions';

async function scoreWithModel(resumeText, jobDescription) {
  // 提示词 + 脱敏在服务端 /llm/score-resume（detail=brief 简版省 token）；插件只传原文。
  const json = await collectorApiPost('/llm/score-resume', {
    jd_text: jobDescription || '',
    resume_text: resumeText,
    detail: 'brief',
  });
  return json?.result || null;
}

async function markTalentScorePending(talentId) {
  try {
    const pool = await chrome.storage.local.get(TALENT_KEY);
    const talents = Array.isArray(pool[TALENT_KEY]) ? pool[TALENT_KEY] : [];
    const idx = talents.findIndex((t) => t.id === talentId);
    if (idx === -1) return;
    talents[idx] = { ...talents[idx], scorePending: true };
    await chrome.storage.local.set({ [TALENT_KEY]: talents });
    broadcast('talent-pool-updated', { id: talentId });
  } catch (_) {}
}

async function autoScoreTalent(talent) {
  try {
    if (!talent || !talent.id || !talent.resumeRaw || talent.resumeRaw.length < 20) return;
    const stored = await chrome.storage.local.get(JD_KEY);
    const jdMap = stored[JD_KEY] || {};
    const jd = jdMap[String(talent.position || '').trim()]?.jd || '';
    let result;
    try {
      result = await scoreWithModel(talent.resumeRaw, jd);
    } catch (err) {
      if (isBillingBlockError(err)) {
        await markTalentScorePending(talent.id); // 断粮 → 标「待打分」，充值后补打
        warnBillingBlocked('简历打分');
        return;
      }
      throw err;
    }
    const overall = Number(result && result.overall);
    if (!Number.isFinite(overall)) return;
    const pool = await chrome.storage.local.get(TALENT_KEY);
    const talents = Array.isArray(pool[TALENT_KEY]) ? pool[TALENT_KEY] : [];
    const idx = talents.findIndex((t) => t.id === talent.id);
    if (idx === -1) return;
    talents[idx] = {
      ...talents[idx],
      score: Math.max(0, Math.min(100, overall)),
      scoreRecommendation: String(result.recommendation || ''),
      scoreSummary: String(result.summary || ''),
      scorePending: false,
      scoredAt: Date.now(),
    };
    await chrome.storage.local.set({ [TALENT_KEY]: talents });
    broadcast('talent-pool-updated', { id: talent.id });
  } catch (err) {
    broadcastLog(`自动打分失败（不影响入库）：${err.message}`, 'warn');
  }
}

/**
 * 充值后补打：对所有 scorePending（断粮时标「待打分」）的人才重新打分。
 * 供大模型页「补打」入口调用；仍断粮则停止并提示。
 */
async function rescorePendingTalents() {
  const pool = await chrome.storage.local.get(TALENT_KEY);
  const talents = Array.isArray(pool[TALENT_KEY]) ? pool[TALENT_KEY] : [];
  const pending = talents.filter(t => t.scorePending && t.resumeRaw && t.resumeRaw.length >= 20);
  if (!pending.length) return { ok: true, rescored: 0, remaining: 0 };
  const stored = await chrome.storage.local.get(JD_KEY);
  const jdMap = stored[JD_KEY] || {};
  let rescored = 0;
  for (const talent of pending) {
    const jd = jdMap[String(talent.position || '').trim()]?.jd || '';
    try {
      const result = await scoreWithModel(talent.resumeRaw, jd);
      const overall = Number(result && result.overall);
      if (!Number.isFinite(overall)) continue;
      const idx = talents.findIndex(t => t.id === talent.id);
      if (idx === -1) continue;
      talents[idx] = {
        ...talents[idx],
        score: Math.max(0, Math.min(100, overall)),
        scoreRecommendation: String(result.recommendation || ''),
        scoreSummary: String(result.summary || ''),
        scorePending: false,
        scoredAt: Date.now(),
      };
      rescored++;
    } catch (err) {
      if (isBillingBlockError(err)) {
        warnBillingBlocked('简历补打');
        break; // 仍断粮，停止批量补打
      }
    }
  }
  await chrome.storage.local.set({ [TALENT_KEY]: talents });
  broadcast('talent-pool-updated', {});
  const remaining = talents.filter(t => t.scorePending).length;
  return { ok: true, rescored, remaining };
}

async function collectResumeText(tabId, fallbackText = '', extractionSessionId = '') {
  const fallback = normalizeText(fallbackText);
  let bestCaptured = '';
  let bestCompact = String(fallbackText || '').replace(/\s+/g, '');
  let probeReliable = false;
  let previousSignature = '';
  let stableSnapshots = 0;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'RESUME_SCORER_COLLECT',
        sessionId: extractionSessionId,
      });
      const captured = normalizeText(response?.resumeText || '');
      const compact = String(response?.compactText || '').trim();
      const signature = `${captured}|${compact}`;
      stableSnapshots = signature && signature === previousSignature ? stableSnapshots + 1 : 0;
      previousSignature = signature;
      if (captured.length > bestCaptured.length) {
        bestCaptured = captured;
      }
      if (compact.length > bestCompact.length) bestCompact = compact;
      probeReliable = probeReliable || response?.reliable === true;
      // Canvas 经常分段绘制。至少完成三次采样，并且连续两次内容稳定后才提前结束。
      // 不再以“超过 160 字”作为完整条件，避免只抓到简历上半页。
      if (attempt >= 2 && probeReliable && stableSnapshots >= 2 && bestCaptured.length >= 240) break;
    } catch (_) {}
    if (attempt < 4) await sleep(1400);
  }
  const best = bestCaptured.length >= fallback.length ? bestCaptured : fallback;
  return { text: best, compactText: bestCompact, probeReliable };
}

function hasReliableResumeContent(rawText, compactText, fields, probeReliable) {
  if (fields.phone || fields.email) return true;
  const compact = `${normalizeText(rawText)}${String(compactText || '')}`.replace(/\s+/g, '');
  const sections = [
    '个人优势', '工作经历', '教育经历', '项目经历',
    '求职目标', '求职意向', '核心优势', '专业技能',
  ].filter(item => compact.includes(item)).length;
  if (sections >= 2) return true;
  const structuredCount = [fields.age, fields.gender, fields.education, fields.experience, fields.city]
    .filter(Boolean).length;
  return probeReliable && compact.length >= 240 && structuredCount >= 2;
}

function findDuplicate(talents, entry) {
  const phone = normalizePhone(entry.phone);
  if (phone) return talents.find(item => normalizePhone(item.phone) === phone) || null;
  if (entry.candidateId) {
    const byId = talents.find(item => String(item.candidateId || '') === String(entry.candidateId));
    if (byId) return byId;
  }
  return talents.find(item => item.name === entry.name && (item.position || '') === (entry.position || '')) || null;
}

async function saveTalent(entry) {
  const stored = await chrome.storage.local.get(TALENT_KEY);
  const talents = Array.isArray(stored[TALENT_KEY]) ? stored[TALENT_KEY] : [];
  const duplicate = findDuplicate(talents, entry);
  const now = Date.now();
  let savedEntry;
  if (duplicate) {
    const preserve = { id: duplicate.id, collectedAt: duplicate.collectedAt || now };
    for (const [key, value] of Object.entries(entry)) {
      if (value !== '' && value !== null && value !== undefined) duplicate[key] = value;
    }
    Object.assign(duplicate, preserve, { source: 'boss', updatedAt: now });
    savedEntry = duplicate;
  } else {
    savedEntry = {
      id: entry.candidateId ? `boss_${entry.candidateId}` : `talent_${now}_${Math.random().toString(36).slice(2, 7)}`,
      ...entry,
      source: 'boss',
      collectedAt: now,
      updatedAt: now,
      callHistory: [],
    };
    talents.push(savedEntry);
  }
  await chrome.storage.local.set({ [TALENT_KEY]: talents });
  broadcast('talent-pool-updated', { id: savedEntry.id });
  return { talent: savedEntry, updated: Boolean(duplicate) };
}

async function handleExtraction(tabId, data = {}) {
  await requireCollectorSubscriptionOnline();
  const collected = await collectResumeText(
    tabId,
    data.fallbackText || '',
    data.extractionSessionId || '',
  );
  const rawText = collected.text;
  if (rawText.length < 20) return { ok: false, error: '简历页面已打开，但未取得足够的可读文字' };

  const localFields = extractLocalFields(rawText, data, collected.compactText);
  if (!hasReliableResumeContent(rawText, collected.compactText, localFields, collected.probeReliable)) {
    return {
      ok: false,
      error: '预览窗口已打开，但未读取到可验证的简历正文或联系方式；可能是纯图片/PDF 插件渲染，本次未写入人才库',
    };
  }
  let modelFields = null;
  try {
    modelFields = await extractWithModel(rawText);
  } catch (err) {
    broadcastLog(`大模型结构化失败，已改用本地提取：${err.message}`, 'warn');
  }
  const fields = mergeFields(localFields, modelFields, data);
  const entry = {
    ...fields,
    candidateId: String(data.candidateId || ''),
    sourceConfidence: modelFields ? 'local+llm' : 'local',
    // 保留简历原文，供人才库简历打分 / 后续大模型分析（带上限防体积膨胀）。
    resumeRaw: rawText.slice(0, 40000),
  };
  await requireCollectorSubscriptionOnline();
  const saved = await saveTalent(entry);
  autoScoreTalent(saved.talent); // 入库即自动打分（fire-and-forget，不阻塞采集）
  const publicTalent = { ...saved.talent };
  delete publicTalent.resumeRaw;
  return { ok: true, saved: !saved.updated, updated: saved.updated, talent: publicTalent };
}

async function findChatTab() {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (active?.url && /^https:\/\/www\.zhipin\.com\/web\/chat/i.test(active.url)) return active;
  const tabs = await chrome.tabs.query({ url: ['https://www.zhipin.com/web/chat*'] });
  return tabs[0] || null;
}

async function sendToCollector(tabId, action, data) {
  try {
    return await chrome.tabs.sendMessage(tabId, { action, data });
  } catch (err) {
    throw new Error(`简历采集内容脚本未就绪，请刷新 BOSS 沟通页后重试：${err.message}`);
  }
}

export async function startCollector(data = {}) {
  await requireCollectorSubscriptionOnline();
  const tab = await findChatTab();
  if (!tab) throw new Error('请先打开 BOSS 直聘“沟通”页面');

  if (data.coordinatedMode !== true) {
    try {
      const otherState = await chrome.tabs.sendMessage(tab.id, { action: 'cs_get_state' });
      if (otherState?.state && otherState.state !== 'idle') {
        throw new Error('自动回复或打招呼任务正在运行，请先停止后再采集简历');
      }
    } catch (err) {
      if (/正在运行/.test(err.message)) throw err;
    }
  }

  const autoSendReply = data.autoSendReply === true;
  const replyStored = autoSendReply ? await chrome.storage.local.get(REPLY_CONFIG_KEY) : {};
  const replyMessages = autoSendReply ? normalizeReplyMessages(replyStored[REPLY_CONFIG_KEY]) : [];
  if (autoSendReply && replyMessages.length === 0) {
    throw new Error('已打开入库后自动回复，但“简历回复配置”中没有有效话术');
  }

  const config = {
    maxPerRun: Math.min(200, Math.max(1, Number(data.maxPerRun) || 5)),
    intervalSeconds: Math.min(300, Math.max(60, Number(data.intervalSeconds) || 60)),
    scanIntervalSeconds: Math.min(300, Math.max(15, Number(data.scanIntervalSeconds) || 60)),
    listenDurationMinutes: Math.min(240, Math.max(1, Number(data.listenDurationMinutes) || 120)),
    actionDelaySeconds: Math.min(15, Math.max(4, Number(data.actionDelaySeconds) || 4)),
    coordinatedMode: data.coordinatedMode === true,
    autoSendReply,
    replyMessages,
    routeNonResumeReply: data.routeNonResumeReply === true,
  };
  await chrome.storage.local.set({ [CONFIG_KEY]: config });
  const response = await sendToCollector(tab.id, ACTION.CS_START, config);
  if (!response?.ok) throw new Error(response?.error || '启动失败');
  activeTabId = tab.id;
  broadcastStatus(response);
  return response;
}

export async function stopCollector() {
  const tab = activeTabId ? await chrome.tabs.get(activeTabId).catch(() => null) : await findChatTab();
  if (!tab) {
    broadcastStatus({ state: 'idle', statusText: '页面已关闭', stats: lastStatus.stats });
    return { ok: true, ...lastStatus, state: 'idle' };
  }
  const response = await sendToCollector(tab.id, ACTION.CS_STOP);
  activeTabId = null;
  broadcastStatus(response);
  return response;
}

export async function resumeCollector() {
  const tab = activeTabId ? await chrome.tabs.get(activeTabId).catch(() => null) : await findChatTab();
  if (!tab) throw new Error('请先打开 BOSS 直聘“沟通”页面');
  const response = await sendToCollector(tab.id, ACTION.CS_RESUME);
  if (!response?.ok) throw new Error(response?.error || '恢复简历采集失败');
  activeTabId = response.state === 'running' ? tab.id : null;
  broadcastStatus(response);
  return response;
}

export async function getCollectorStatus() {
  const stored = await chrome.storage.local.get(CONFIG_KEY);
  const tab = activeTabId ? await chrome.tabs.get(activeTabId).catch(() => null) : await findChatTab();
  if (!tab) return { ok: true, ...lastStatus, state: 'idle', config: stored[CONFIG_KEY] || null };
  try {
    const response = await sendToCollector(tab.id, ACTION.CS_STATUS);
    if (response?.ok) {
      activeTabId = response.state === 'running' ? tab.id : null;
      lastStatus = response;
      return { ...response, config: response.config || stored[CONFIG_KEY] || null };
    }
  } catch (_) {}
  return { ok: true, ...lastStatus, config: stored[CONFIG_KEY] || null };
}

async function handlePanelCommand(action, data) {
  if (action === ACTION.CMD_START) return startCollector(data);
  if (action === ACTION.CMD_STOP) return stopCollector();
  if (action === ACTION.CMD_STATUS) return getCollectorStatus();
  return null;
}

// ── Ph3：未读积压路由 + 判断回复 + per-uid 幂等锁 ──────────────────────
// 设计：采集器（内容脚本）串行打开未读会话后，非简历的会话把 brief/最新消息交给这里，
// 由 SW 统一做"规则匹配岗位 + LLM 判断是否回复"，并返回该岗位的静态话术。
// 幂等锁防"MQTT 实时回复"与"扫描积压回复"双触发同一 uid。
const GREETING_CONFIGS_KEY = 'greetingConfigs';
const REPLY_IDEM_KEY = 'replyIdemLocks';
const REPLY_IDEM_WINDOW_MS = 10 * 60 * 1000; // 只防 MQTT/扫描双触发的重复回，不挡正常多轮对话

function normalizePositionName(value) {
  return String(value || '').toLowerCase().replace(/[\s·,，、/\\-]+/g, '');
}

function matchJobByRules(position, brief, configs) {
  const all = (Array.isArray(configs) ? configs : []).filter(c => c && c.jobName);
  if (!all.length) return null;
  const np = normalizePositionName(position);
  let job = all.find(c => {
    const nj = normalizePositionName(c.jobName);
    return nj && np && (np.includes(nj) || nj.includes(np));
  });
  if (!job) job = all.find(c => c.isDefault === true) || null;
  if (!job) return null;
  const filters = Array.isArray(job.bossFilters) ? job.bossFilters : [];
  for (const flt of filters) {
    const nm = flt && flt.name;
    const vals = (Array.isArray(flt.values) ? flt.values : [flt.values]).filter(v => v != null && v !== '');
    if (!nm || !vals.length) continue;
    if (nm === '年龄' && brief && brief.age != null) {
      const mm = String(vals[0]).match(/(\d+)\s*-\s*(\d+)/);
      if (mm && (brief.age < +mm[1] || brief.age > +mm[2])) return null;
    } else if (/学历/.test(nm) && brief && brief.education) {
      const order = ['初中', '中专', '高中', '大专', '专科', '本科', '研究生', '硕士', 'MBA', 'EMBA', '博士'];
      const rank = x => { const i = order.indexOf(String(x).replace('要求', '')); return i < 0 ? 0 : i; };
      const needs = vals.map(rank).filter(rv => rv > 0);
      if (needs.length && rank(brief.education) < Math.min(...needs)) return null;
    } else if (/性别/.test(nm) && brief && brief.gender) {
      if (!vals.some(v => String(v).includes(brief.gender))) return null;
    }
  }
  return job;
}

async function judgeReplyWithLLM(lastText, jobName) {
  const sys = '你是招聘助手消息分类器。判断候选人发来的最新消息是否属于"候选人主动打招呼/咨询，值得 HR 回复"。只输出 JSON：{"reply":true或false,"reason":"≤15字"}。判 false：HR 自己发的；候选人仅应答/确认（好的/谢谢/嗯/OK）；系统通知/广告；空或无意义。判 true：主动打招呼、自我介绍、询问岗位、表达兴趣、提出实质问题。';
  const usr = `岗位：${jobName || '未知'}\n候选人最新消息：${String(lastText || '').slice(0, 500)}`;
  try {
    // /llm/chat 透传（提示词留在插件自组）。
    const json = await collectorApiPost('/llm/chat', {
      scene: 'reply_judge',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: usr },
      ],
      max_tokens: 120,
      temperature: 0,
    });
    const content = String(json?.content || '');
    const mm = content.match(/\{[\s\S]*\}/);
    const obj = mm ? JSON.parse(mm[0]) : {};
    return { shouldReply: obj.reply !== false, reason: obj.reason || '' };
  } catch (err) {
    // 断粮 → 停回（shouldReply:false + billingBlock 标记）；其它失败维持原 fail-open。
    if (isBillingBlockError(err)) return { shouldReply: false, billingBlock: true, reason: '点数不足，请充值' };
    return { shouldReply: true, reason: '判断失败，默认回复' };
  }
}

async function handleJudgeUnreadReply(data = {}) {
  const uid = String(data.uid || '');
  if (!uid) return { action: 'skip', reason: '缺少 uid' };
  const stored = await chrome.storage.local.get([GREETING_CONFIGS_KEY, REPLY_IDEM_KEY]);
  const locks = stored[REPLY_IDEM_KEY] || {};
  const last = Number(locks[uid] || 0);
  if (last && Date.now() - last < REPLY_IDEM_WINDOW_MS) {
    return { action: 'skip', reason: '近期已回复，幂等跳过' };
  }
  const job = matchJobByRules(data.brief?.position || '', data.brief || {}, stored[GREETING_CONFIGS_KEY] || []);
  if (!job) return { action: 'skip', reason: '条件不符或无匹配岗位' };
  const replyMessages = (Array.isArray(job.replyMessages) ? job.replyMessages : [])
    .map(item => String(item || '').trim())
    .filter(Boolean);
  if (!replyMessages.length) return { action: 'skip', reason: '岗位未配置回复话术', jobName: job.jobName || '' };
  const verdict = await judgeReplyWithLLM(data.lastText, job.jobName || data.brief?.position || '');
  if (verdict.billingBlock) warnBillingBlocked('自动回复');
  if (!verdict.shouldReply) return { action: 'skip', reason: verdict.reason || '判定为冗余', jobName: job.jobName || '', billingBlock: !!verdict.billingBlock };
  return { action: 'reply', jobName: job.jobName || '', replyMessages };
}

async function markReplied(uid) {
  const key = String(uid || '');
  if (!key) return { ok: false };
  const stored = await chrome.storage.local.get(REPLY_IDEM_KEY);
  const locks = stored[REPLY_IDEM_KEY] || {};
  locks[key] = Date.now();
  const now = Date.now();
  for (const k of Object.keys(locks)) {
    if (now - Number(locks[k] || 0) > 24 * 3600 * 1000) delete locks[k];
  }
  await chrome.storage.local.set({ [REPLY_IDEM_KEY]: locks });
  return { ok: true };
}
// ── Ph3 结束 ─────────────────────────────────────────────────────────

chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'resume-collect-panel') return;
  sidePanelPorts.add(port);
  port.onDisconnect.addListener(() => sidePanelPorts.delete(port));
  port.onMessage.addListener(message => {
    if (![ACTION.CMD_START, ACTION.CMD_STOP, ACTION.CMD_STATUS].includes(message?.action)) return;
    handlePanelCommand(message.action, message.data)
      .then(data => safePost(port, { action: message.action, data, requestId: message.requestId }))
      .catch(err => safePost(port, { action: 'error', data: { error: err.message }, requestId: message.requestId }));
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === 'cmd_judge_unread_reply') {
    handleJudgeUnreadReply(message.data)
      .then(sendResponse)
      .catch(err => sendResponse({ action: 'skip', reason: err.message }));
    return true;
  }
  if (message?.action === 'cmd_mark_replied') {
    markReplied(message.data?.uid)
      .then(sendResponse)
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
  if (message?.action === 'cmd_rescore_pending') {
    rescorePendingTalents()
      .then(sendResponse)
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if ([ACTION.CMD_START, ACTION.CMD_STOP, ACTION.CMD_STATUS].includes(message?.action)) {
    handlePanelCommand(message.action, message.data)
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }
  if (message?.action === ACTION.LOG) {
    broadcastLog(message.data?.message || '', message.data?.level || 'info');
    return false;
  }
  if (message?.action === ACTION.STATUS) {
    broadcastStatus(message.data || {});
    if (message.data?.state === 'idle') activeTabId = null;
    return false;
  }
  if (message?.action === ACTION.EXTRACT && sender.tab?.id) {
    handleExtraction(sender.tab.id, message.data)
      .then(sendResponse)
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  return false;
});

console.log('[SW] 简历采集模块已加载');
