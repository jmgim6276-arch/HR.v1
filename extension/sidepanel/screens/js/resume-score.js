/**
 * resume-score.js —— 人才库简历打分视图
 *
 * 入库的简历由采集器自动打分（resumeRaw + 该岗位 JD），本页展示分数并支持单条重打。
 * 重打复用 SW 的 cmd_score_resume（VIP 与点数校验 + 托管大模型），结果写回人才库该条记录。
 */
(function () {
  'use strict';

  const TALENT_KEY = 'talentPool';
  const JD_KEY = 'jobDescriptions';
  const $ = (id) => document.getElementById(id);
  let talents = [];
  let jdMap = {};

  function setStatus(t) { $('status').textContent = t || ''; }

  function sendScore(payload) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command: 'cmd_score_resume', ...payload }, (resp) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        resolve(resp);
      });
    });
  }

  async function load() {
    const stored = await chrome.storage.local.get([TALENT_KEY, JD_KEY]);
    talents = Array.isArray(stored[TALENT_KEY]) ? stored[TALENT_KEY] : [];
    jdMap = stored[JD_KEY] || {};
    render();
  }

  function jdFor(talent) {
    const rec = jdMap[String(talent.position || '').trim()];
    return (rec && rec.jd) || '';
  }

  function esc(s) { return String(s ?? ''); }

  function render() {
    const list = $('list');
    list.textContent = '';
    $('count').textContent = talents.length ? `共 ${talents.length} 条` : '';
    $('empty').style.display = talents.length ? 'none' : 'block';
    // 已打分在前（按分数降序），未打分在后
    const sorted = [...talents].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

    for (const t of sorted) {
      const card = document.createElement('div');
      card.className = 'card';

      const head = document.createElement('div');
      head.className = 'card-head';
      const who = document.createElement('div');
      who.className = 'who';
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = esc(t.name) || '未知候选人';
      const pos = document.createElement('div');
      pos.className = 'pos';
      pos.textContent = [esc(t.position), esc(t.city)].filter(Boolean).join(' · ');
      who.appendChild(name);
      who.appendChild(pos);

      const score = document.createElement('div');
      score.className = 'score';
      const num = document.createElement('div');
      const hasScore = Number.isFinite(t.score);
      num.className = 'num' + (hasScore ? '' : ' none');
      num.textContent = hasScore ? String(t.score) : (t.scorePending ? '待打分' : '未打分');
      score.appendChild(num);
      if (hasScore && t.scoreRecommendation) {
        const rec = document.createElement('div');
        rec.className = 'rec';
        rec.textContent = esc(t.scoreRecommendation);
        score.appendChild(rec);
      }
      head.appendChild(who);
      head.appendChild(score);
      card.appendChild(head);

      if (hasScore && t.scoreSummary) {
        const sum = document.createElement('div');
        sum.className = 'summary';
        sum.textContent = esc(t.scoreSummary);
        card.appendChild(sum);
      }

      const meta = document.createElement('div');
      meta.className = 'meta';
      const time = document.createElement('span');
      time.className = 'time';
      time.textContent = t.scoredAt ? `打分于 ${new Date(t.scoredAt).toLocaleString()}` : '';
      const btn = document.createElement('button');
      btn.className = 'rescore';
      const hasRaw = t.resumeRaw && t.resumeRaw.length >= 20;
      btn.textContent = hasScore ? '重打' : '打分';
      btn.disabled = !hasRaw;
      if (!hasRaw) btn.title = '该记录无简历原文（早期采集未存原文）';
      btn.addEventListener('click', () => rescore(t, btn));
      meta.appendChild(time);
      meta.appendChild(btn);
      card.appendChild(meta);

      list.appendChild(card);
    }
  }

  async function rescore(talent, btn) {
    btn.disabled = true;
    btn.classList.add('doing');
    btn.textContent = '打分中…';
    setStatus(`正在为「${talent.name || '该候选人'}」打分…`);
    try {
      const resp = await sendScore({
        resumeText: talent.resumeRaw,
        jobDescription: jdFor(talent),
        candidateId: String(talent.id),
      });
      if (!resp || !resp.ok) throw new Error((resp && resp.error) || '打分失败');
      const r = resp.result || {};
      const overall = Number(r.overall);
      if (!Number.isFinite(overall)) throw new Error('模型未返回分数');
      // 写回人才库该条
      const stored = await chrome.storage.local.get(TALENT_KEY);
      const pool = Array.isArray(stored[TALENT_KEY]) ? stored[TALENT_KEY] : [];
      const idx = pool.findIndex((x) => x.id === talent.id);
      if (idx !== -1) {
        pool[idx] = {
          ...pool[idx],
          score: Math.max(0, Math.min(100, overall)),
          scoreRecommendation: String(r.recommendation || ''),
          scoreSummary: String(r.summary || ''),
          scoredAt: Date.now(),
        };
        await chrome.storage.local.set({ [TALENT_KEY]: pool });
      }
      setStatus('');
      await load();
    } catch (err) {
      setStatus('❌ ' + err.message);
      btn.disabled = false;
      btn.textContent = '重打';
    } finally {
      btn.classList.remove('doing');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('btnRefresh').addEventListener('click', load);
    load();
    // 人才库被采集器更新时刷新（自动打分落库后也会触发）
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && (changes[TALENT_KEY] || changes[JD_KEY])) load();
    });
  });
})();
