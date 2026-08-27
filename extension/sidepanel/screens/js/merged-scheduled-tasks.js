/**
 * 合并定时任务页（Ph4）。
 * 一套列表同时展示并启停/删除「打招呼」与「自动回复」两个模块的定时任务。
 * 底层仍写回各自 storage key，并通知 SW 刷新调度器（调度逻辑不变）。
 * 新增/编辑（含关联岗位）通过"管理"链接跳到原模块编辑器完成，避免在此重复实现岗位选择。
 */
(function () {
  "use strict";

  const MODULES = [
    { key: "greetingScheduledTasks", module: "greeting", label: "打招呼", badge: "badge-greeting", editor: "screens/scheduled-tasks.html" },
    { key: "replyScheduledTasks", module: "reply", label: "自动回复", badge: "badge-reply", editor: "screens/reply-scheduled-tasks.html" },
  ];

  // 每项：{ task, module }
  let entries = [];

  function showToast(msg, duration) {
    duration = duration || 2500;
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = "1";
    setTimeout(() => { el.style.opacity = "0"; }, duration);
  }

  function escapeText(v) { return String(v == null ? "" : v); }

  function scheduleDesc(task) {
    const timeRange = `${task.startTime || "09:00:00"} ~ ${task.endTime || ""}`;
    const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
    if (task.cycleType === "monthly") {
      return `每月 ${(task.monthDays || []).slice().sort((a, b) => a - b).join(", ")} 日 ${timeRange}`;
    }
    return `每周 ${(task.weekDays || []).slice().sort().map((d) => dayNames[d] || d).join(", ")} ${timeRange}`;
  }

  async function loadTasks() {
    const keys = MODULES.map((m) => m.key);
    const stored = await chrome.storage.local.get(keys);
    entries = [];
    for (const m of MODULES) {
      const list = Array.isArray(stored[m.key]) ? stored[m.key] : [];
      for (const task of list) entries.push({ task, module: m });
    }
    entries.sort((a, b) => String(a.task.startTime || "").localeCompare(String(b.task.startTime || "")));
  }

  async function persistModule(module) {
    const list = entries.filter((e) => e.module.key === module.key).map((e) => e.task);
    await chrome.storage.local.set({ [module.key]: list });
    notifySW();
  }

  function notifySW() {
    try {
      const api = window.parent.__shellAPI;
      if (api && typeof api.sendToSW === "function") api.sendToSW("cmd_refresh_scheduler").catch(() => {});
      else chrome.runtime.sendMessage({ action: "cmd_refresh_scheduler" }).catch(() => {});
    } catch (e) { /* 静默 */ }
  }

  function render() {
    const list = document.getElementById("taskList");
    const empty = document.getElementById("emptyState");
    list.innerHTML = "";
    if (entries.length === 0) { empty.style.display = "block"; return; }
    empty.style.display = "none";

    entries.forEach((entry, idx) => {
      const { task, module } = entry;
      const card = document.createElement("div");
      card.className = "task-card";

      const top = document.createElement("div");
      top.className = "task-top";

      const badge = document.createElement("span");
      badge.className = `module-badge ${module.badge}`;
      badge.textContent = module.label;

      const nameEl = document.createElement("span");
      nameEl.className = "task-name";
      nameEl.textContent = task.name || "未命名任务";

      const toggleLabel = document.createElement("label");
      toggleLabel.className = "status-toggle";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = task.enabled !== false;
      const slider = document.createElement("span");
      slider.className = "slider";
      toggleLabel.appendChild(cb);
      toggleLabel.appendChild(slider);

      top.appendChild(badge);
      top.appendChild(nameEl);
      top.appendChild(toggleLabel);

      const desc = document.createElement("div");
      desc.className = "task-desc";
      desc.textContent = scheduleDesc(task);

      const actions = document.createElement("div");
      actions.className = "task-actions";
      const delBtn = document.createElement("button");
      delBtn.className = "btn-sm btn-outline";
      delBtn.textContent = "删除";
      actions.appendChild(delBtn);

      card.appendChild(top);
      card.appendChild(desc);
      card.appendChild(actions);
      list.appendChild(card);

      cb.addEventListener("change", async () => {
        task.enabled = cb.checked;
        await persistModule(module);
        showToast(cb.checked ? `已启用「${task.name || "任务"}」（${module.label}）` : `已停用「${task.name || "任务"}」（${module.label}）`);
      });
      delBtn.addEventListener("click", async () => {
        if (!window.confirm(`确定删除${module.label}任务「${task.name || "未命名"}」？`)) return;
        entries.splice(idx, 1);
        await persistModule(module);
        render();
        showToast("已删除");
      });
    });
  }

  function gotoEditor(module) {
    try {
      window.parent.postMessage({ type: "NAVIGATE", src: module.editor }, "*");
    } catch (e) { /* 静默 */ }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("btnManageGreeting").addEventListener("click", () => gotoEditor(MODULES[0]));
    document.getElementById("btnManageReply").addEventListener("click", () => gotoEditor(MODULES[1]));
    await loadTasks();
    render();
  });
})();
