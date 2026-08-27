/**
 * jd-collector.js —— 岗位 JD 抓取模块（独立、可降级）
 *
 * 【用途】呼波特外呼上传字段「岗位JD」是招聘方（用户）自己发布的岗位描述，
 * 不在候选人简历里，无法从简历分析。本模块在用户浏览 BOSS 职位页时，
 * 自动抓取「岗位名 + 岗位JD」，按岗位名存进 chrome.storage.local['jobDescriptions']，
 * 供：① 呼波特上传（job_description）② 人才库简历打分（作为打分依据的岗位描述）。
 *
 * 【注入】ISOLATED world、document_idle。JD 是 DOM 文本（BOSS 只对简历做 canvas
 * 反爬，职位描述是给人阅读的），无需 canvas hook，普通 DOM 抓取即可。
 *
 * 【可降级】BOSS 前端常变。选择器用多候选数组，任一命中即取；整页抓不到 JD
 * 就静默不写、不报错、不影响页面。抓不到时外呼上传的 job_description 为空，
 * 呼波特侧会用默认话术，流程不中断。
 *
 * 【触发】① 页面加载后自检 ② SPA 路由变化（BOSS 是单页应用，轮询比对 href）
 *        ③ 收到 window.postMessage {type:'__KX_JD_SCRAPE__'} 时立即重抓（供外呼配置面板手动刷新）。
 */
(function () {
  if (window.__KX_JD_COLLECTOR__) return;
  window.__KX_JD_COLLECTOR__ = true;

  const STORE_KEY = 'jobDescriptions';
  const log = (...a) => console.log('[JDCollector]', ...a);

  // 职位页 URL 特征（BOSS 职位详情/职位管理）。宽匹配，配合 DOM 二次确认。
  const JOB_URL_HINT = /(job_detail|\/job[?#/]|jobid=|positionid=|\/position|\/zhipin\/job)/i;

  // 岗位名候选选择器（任一命中、取第一个非空）。
  const TITLE_SELECTORS = [
    '.job-title .name', '.job-banner .name', '.job-title', '.name .job-name',
    '.job-name', 'h1.name', '[class*="job-title"] .name', '[class*="job-name"]',
  ];
  // 岗位JD 候选选择器（任一命中、取文本最长者，避免抓到导航/推荐）。
  const JD_SELECTORS = [
    '.job-sec-text', '.job-sec .text', '.job-detail-section .text',
    '.job-detail-section', '.detail-content', '[class*="job-detail"] .text',
    '.job-sec', '.position-detail .text', '[class*="position-desc"]',
  ];

  function firstText(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        const t = el && String(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
        if (t) return t;
      } catch (_) {}
    }
    return '';
  }

  function longestText(selectors) {
    let best = '';
    for (const sel of selectors) {
      try {
        document.querySelectorAll(sel).forEach((el) => {
          const t = String(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
          if (t.length > best.length) best = t;
        });
      } catch (_) {}
    }
    return best;
  }

  // 从 <title>/og:title 兜底岗位名（BOSS 详情页 title 形如「岗位招聘_公司招聘_BOSS直聘」）。
  function titleFallback() {
    try {
      const og = document.querySelector('meta[property="og:title"]');
      const raw = (og && og.content) || document.title || '';
      const m = String(raw).split(/[_-]/)[0].replace(/招聘$/, '').trim();
      return m;
    } catch (_) { return ''; }
  }

  function isJobPage() {
    if (JOB_URL_HINT.test(location.href)) return true;
    // DOM 二次确认：有 JD 候选块且像职位页（含「职位描述/岗位职责/任职要求」等字样）。
    const jd = longestText(JD_SELECTORS);
    return jd.length >= 20 && /(职位描述|岗位职责|任职要求|工作内容|岗位要求|职位要求)/.test(jd);
  }

  async function scrape(reason) {
    try {
      if (!isJobPage()) return null;
      const position = firstText(TITLE_SELECTORS) || titleFallback();
      const jd = longestText(JD_SELECTORS);
      if (!position || jd.length < 20) {
        log(`跳过(${reason})：岗位名="${position}" JD长度=${jd.length}`);
        return null;
      }
      const cleanJd = jd.slice(0, 5000);
      const store = await chrome.storage.local.get(STORE_KEY);
      const map = store[STORE_KEY] || {};
      if (map[position] && map[position].jd === cleanJd) return { position }; // 无变化也算成功
      map[position] = { jd: cleanJd, scrapedAt: Date.now() };
      await chrome.storage.local.set({ [STORE_KEY]: map });
      log(`✅ 已存「${position}」JD ${cleanJd.length} 字（${reason}）`);
      return { position };
    } catch (e) {
      log('抓取异常（已忽略）:', e && e.message);
      return null;
    }
  }

  // ① 页面加载后多次尝试（JD 可能异步渲染）。
  [1500, 4000, 8000].forEach((ms) => setTimeout(() => scrape('load'), ms));

  // ② SPA 路由变化重抓。
  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      setTimeout(() => scrape('navigate'), 1200);
    }
  }, 1500);

  // ③ 面板手动刷新（两条通道：同页 postMessage，或侧栏经 chrome.tabs.sendMessage）。
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === '__KX_JD_SCRAPE__') scrape('manual');
  });
  try {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg && msg.type === '__KX_JD_SCRAPE_TAB__') {
        scrape('panel').then((r) => sendResponse({ ok: true, position: r && r.position }));
        return true; // 异步 sendResponse
      }
      return false;
    });
  } catch (_) {}
})();
