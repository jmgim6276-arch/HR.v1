/**
 * outbound-config.js —— 外呼配置面板
 *
 * 存储：
 *   outboundCompanyConfig（全局，云同步）：{ companyName, companyInformation, endUser }
 *   outboundJobConfigs（按岗位名，云同步）：{ [jobName]: { pendingConfirmation, specialNotes, candidateIssues, firstSentence } }
 *   jobDescriptions（按岗位名，本地，jd-collector 抓）：{ [jobName]: { jd, scrapedAt } }
 *   jobConfigs：岗位列表（{id,name,enabled}），用于岗位下拉。
 *
 * 说明：这些字段本身不触发外呼，仅在人材库手动「提交呼波特」时随候选人一并上传。
 */
(function () {
  'use strict';

  const COMPANY_KEY = 'outboundCompanyConfig';
  const JOB_CFG_KEY = 'outboundJobConfigs';
  const JD_KEY = 'jobDescriptions';
  const JOBS_KEY = 'jobConfigs';

  const $ = (id) => document.getElementById(id);
  let toastTimer = null;

  function showToast(message) {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = '1';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
  }

  async function readKey(key) {
    const stored = await chrome.storage.local.get(key);
    return stored[key];
  }

  function currentJobName() {
    const sel = $('jobSelect');
    return sel && sel.value ? sel.value : '';
  }

  // ── 岗位下拉 ─────────────────────────────────────────
  async function loadJobs() {
    const jobs = (await readKey(JOBS_KEY)) || [];
    const sel = $('jobSelect');
    sel.textContent = '';
    if (!jobs.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '（请先在「自动化 > 岗位配置」添加岗位）';
      sel.appendChild(opt);
      sel.disabled = true;
      return;
    }
    sel.disabled = false;
    for (const job of jobs) {
      const name = String(job && job.name || '').trim();
      if (!name) continue;
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name + (job.enabled === false ? '（已停用）' : '');
      sel.appendChild(opt);
    }
  }

  // ── 公司级 ───────────────────────────────────────────
  async function loadCompany() {
    const cfg = (await readKey(COMPANY_KEY)) || {};
    $('companyName').value = cfg.companyName || '';
    $('companyInformation').value = cfg.companyInformation || '';
    $('endUser').value = cfg.endUser || '';
  }

  // ── 岗位级字段 + JD ─────────────────────────────────
  async function loadJobFields() {
    const name = currentJobName();
    const all = (await readKey(JOB_CFG_KEY)) || {};
    const cfg = (name && all[name]) || {};
    $('pendingConfirmation').value = cfg.pendingConfirmation || '';
    $('specialNotes').value = cfg.specialNotes || '';
    $('candidateIssues').value = cfg.candidateIssues || '';
    $('firstSentence').value = cfg.firstSentence || '';
    await renderJd();
  }

  async function renderJd() {
    const name = currentJobName();
    const box = $('jdBox');
    box.textContent = '';
    const map = (await readKey(JD_KEY)) || {};
    const rec = name && map[name];
    if (rec && rec.jd) {
      const when = rec.scrapedAt ? new Date(rec.scrapedAt).toLocaleString() : '';
      const meta = document.createElement('div');
      meta.className = 'jd-empty';
      meta.textContent = when ? `抓取于 ${when}` : '';
      const body = document.createElement('div');
      body.textContent = rec.jd; // textContent：JD 是不可信页面内容，防注入
      box.appendChild(meta);
      box.appendChild(body);
    } else {
      const span = document.createElement('span');
      span.className = 'jd-empty';
      span.textContent = name
        ? '尚未抓取到该岗位 JD。请打开 BOSS 职位页（职位管理 / 职位详情）让插件自动抓取，或点「刷新JD」。'
        : '请先选择岗位。';
      box.appendChild(span);
    }
  }

  // ── 保存 ────────────────────────────────────────────
  async function save() {
    try {
      const company = {
        companyName: $('companyName').value.trim(),
        companyInformation: $('companyInformation').value.trim(),
        endUser: $('endUser').value.trim(),
        updatedAt: new Date().toISOString(),
      };
      await chrome.storage.local.set({ [COMPANY_KEY]: company });

      const name = currentJobName();
      if (name) {
        const all = (await readKey(JOB_CFG_KEY)) || {};
        all[name] = {
          pendingConfirmation: $('pendingConfirmation').value.trim(),
          specialNotes: $('specialNotes').value.trim(),
          candidateIssues: $('candidateIssues').value.trim(),
          firstSentence: $('firstSentence').value.trim(),
          updatedAt: new Date().toISOString(),
        };
        await chrome.storage.local.set({ [JOB_CFG_KEY]: all });
      }
      showToast(name ? `已保存公司信息 +「${name}」岗位字段` : '已保存公司信息');
    } catch (err) {
      console.error('保存外呼配置失败:', err);
      showToast('保存失败');
    }
  }

  // ── 刷新 JD（触发活动 BOSS 标签页重抓） ─────────────
  async function findZhipinTab() {
    const tabs = await chrome.tabs.query({ url: 'https://www.zhipin.com/*' });
    if (!tabs.length) throw new Error('未找到 BOSS 标签页，请先打开 zhipin.com 的职位页');
    return tabs.find((t) => t.active) || tabs[0];
  }

  async function refreshJd() {
    const btn = $('btnRefreshJd');
    btn.disabled = true;
    try {
      const tab = await findZhipinTab();
      await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { type: '__KX_JD_SCRAPE_TAB__' }, (resp) => {
          if (chrome.runtime.lastError) return reject(new Error('页面未响应，请确认当前是 BOSS 职位页'));
          resolve(resp);
        });
      });
      await renderJd();
      showToast('已尝试抓取当前职位页 JD');
    } catch (err) {
      showToast(err.message || '抓取失败');
    } finally {
      btn.disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadJobs();
    await loadCompany();
    await loadJobFields();
    $('jobSelect').addEventListener('change', loadJobFields);
    $('btnSave').addEventListener('click', save);
    $('btnRefreshJd').addEventListener('click', refreshJd);
  });
})();
