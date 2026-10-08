(function () {
  "use strict";

  const TASKS_KEY = "replyScheduledTasks";
  const PRIVACY_VERSION = "2026-10-08";
  let tasks = [];
  let editingTaskId = null;

  /**
   * 从 chrome.storage 加载定时任务列表
   */
  async function loadTasks() {
    try {
      const result = await chrome.storage.local.get(TASKS_KEY);
      tasks = result[TASKS_KEY] || [];
    } catch (err) {
      console.error("加载定时任务失败:", err);
      tasks = [];
    }
    renderTasks();
  }

  /**
   * 将当前任务列表保存到 chrome.storage
   * 保存后自动通知 Service Worker 刷新调度器，并更新 UI 状态
   */
  async function saveTasksToStorage() {
    try {
      await chrome.storage.local.set({ [TASKS_KEY]: tasks });
      // 通知 Service Worker 刷新调度器
      notifySW();
      // 稍后刷新 UI 状态显示（给 SW 一点处理时间）
      setTimeout(loadSchedulerStatus, 500);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * 通知 Service Worker 刷新调度器
   * 使用 chrome.runtime.sendMessage 确保即使 iframe shell API 不可用也能通信
   */
  function notifySW() {
    try {
      const api = window.parent.__shellAPI;
      if (api && typeof api.sendToSW === "function") {
        api.sendToSW("cmd_refresh_scheduler").catch(() => {});
      } else {
        chrome.runtime
          .sendMessage({ action: "cmd_refresh_scheduler" })
          .catch(() => {});
      }
    } catch (e) {
      // 静默处理
    }
  }

  /**
   * 渲染所有任务卡片
   */
  function renderTasks() {
    const list = document.getElementById("taskList");
    const empty = document.getElementById("emptyState");
    list.innerHTML = "";
    if (tasks.length === 0) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    tasks.forEach((task) => {
      const timeRange = `${task.startTime || "09:00:00"} ~ ${task.endTime || ""}`;
      const desc =
        task.cycleType === "weekly"
          ? `每周 ${(task.weekDays || [])
              .sort()
              .map((d) => ["日", "一", "二", "三", "四", "五", "六"][d])
              .join(", ")} ${timeRange}`
          : `每月 ${(task.monthDays || []).sort().join(", ")} 日 ${timeRange}`;

      const card = document.createElement("div");
      card.className = "task-item";
      card.innerHTML = `
        <div class="task-header">
          <div class="task-name">${escapeHtml(task.name)}</div>
          <label class="status-toggle"><input type="checkbox" ${task.enabled !== false ? "checked" : ""} data-task-id="${task.id}"><span class="slider"></span></label>
        </div>
        <div class="task-info">${desc}</div>
        <div class="task-actions">
          <span class="action-icon" data-action="copy" data-task-id="${task.id}">复制</span>
          <span class="action-icon" data-action="edit" data-task-id="${task.id}">编辑</span>
          <span class="action-icon" style="color:var(--danger)" data-action="delete" data-task-id="${task.id}">删除</span>
        </div>
      `;
      list.appendChild(card);
    });

    // 绑定任务启用/禁用开关事件
    document
      .querySelectorAll('.task-item input[type="checkbox"]')
      .forEach((cb) => {
        cb.addEventListener("change", async () => {
          const task = tasks.find((t) => t.id === cb.dataset.taskId);
          if (task) {
            if (
              cb.checked &&
              (!task.scopeApprovedAt || task.privacyVersion !== PRIVACY_VERSION)
            ) {
              cb.checked = false;
              showToast("请先编辑任务并重新确认自动化范围");
              return;
            }
            task.enabled = cb.checked;
            await saveTasksToStorage();
          }
        });
      });
  }

  /**
   * 获取指定容器中已选中的日期集合
   * @param {string} containerId - 容器元素的 ID
   * @returns {number[]} 选中的日期数字数组
   */
  function getSelectedDays(containerId) {
    return Array.from(
      document.querySelectorAll(`#${containerId} .day-btn.active`),
    ).map((el) => parseInt(el.dataset.day || el.textContent));
  }

  /**
   * 打开新增任务弹窗
   */
  function openTaskModal() {
    editingTaskId = null;
    document.getElementById("modalTitle").textContent = "新增回复任务";
    document.getElementById("taskNameInput").value = "";
    document.getElementById("startTimeInput").value = "09:00:00";
    document.getElementById("endTimeInput").value = "18:00:00";
    // 默认不选中任何周期类型，用户必须手动选择
    document
      .querySelectorAll(".cycle-option")
      .forEach((o) => o.classList.remove("active"));
    document.getElementById("weeklyCycle").style.display = "none";
    document.getElementById("monthlyCycle").style.display = "none";
    document
      .querySelectorAll(".day-btn")
      .forEach((b) => b.classList.remove("active"));
    document.getElementById("taskScopeApproval").checked = false;
    document.getElementById("taskModal").style.display = "flex";
  }

  /**
   * 关闭任务弹窗
   */
  function closeTaskModal() {
    document.getElementById("taskModal").style.display = "none";
  }

  /**
   * 切换运行周期类型（按周 / 按月）
   * @param {string} type - 周期类型：'weekly' 或 'monthly'
   */
  function switchCycle(type) {
    document
      .querySelectorAll(".cycle-option")
      .forEach((o) => o.classList.remove("active"));
    document.querySelector(`[data-cycle="${type}"]`).classList.add("active");
    document.getElementById("weeklyCycle").style.display =
      type === "weekly" ? "block" : "none";
    document.getElementById("monthlyCycle").style.display =
      type === "monthly" ? "block" : "none";
  }

  /**
   * 保存当前任务（新增或编辑）
   */
  function saveTask() {
    const name = document.getElementById("taskNameInput").value.trim();
    const startTime = document.getElementById("startTimeInput").value;
    const endTime = document.getElementById("endTimeInput").value;
    if (!name) {
      showToast("请输入任务名称");
      return;
    }
    if (!startTime || !endTime) {
      showToast("请设置运行时间范围");
      return;
    }
    if (startTime >= endTime) {
      showToast("开始时间必须早于结束时间");
      return;
    }

    // 校验周期类型是否已选择
    const isWeekly = document
      .querySelector('[data-cycle="weekly"]')
      .classList.contains("active");
    const isMonthly = document
      .querySelector('[data-cycle="monthly"]')
      .classList.contains("active");
    if (!isWeekly && !isMonthly) {
      showToast("请选择周期类型（按周 / 按月）");
      return;
    }

    const weekDays = getSelectedDays("weekDayGrid");
    const monthDays = getSelectedDays("monthDayGrid");
    if (isWeekly && weekDays.length === 0) {
      showToast("请选择至少一个运行日（周几）");
      return;
    }
    if (isMonthly && monthDays.length === 0) {
      showToast("请选择至少一个运行日（每月几号）");
      return;
    }
    if (!document.getElementById("taskScopeApproval").checked) {
      showToast("请先审核并确认本次定时任务的自动化范围");
      return;
    }

    const data = {
      name,
      enabled: true,
      cycleType: isWeekly ? "weekly" : "monthly",
      startTime,
      endTime,
      scopeApprovedAt: new Date().toISOString(),
      privacyVersion: PRIVACY_VERSION,
      recipientScope:
        "incoming-candidates-for-current-approved-position-configs",
    };
    if (isWeekly) data.weekDays = weekDays;
    else data.monthDays = monthDays;

    if (editingTaskId) {
      const idx = tasks.findIndex((t) => t.id === editingTaskId);
      if (idx !== -1) tasks[idx] = { ...tasks[idx], ...data };
    } else {
      data.id =
        "task_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
      tasks.push(data);
    }
    saveTasksToStorage();
    renderTasks();
    closeTaskModal();
    showToast("✅ 任务已保存");
  }

  /**
   * 编辑指定任务
   * @param {string} id - 任务 ID
   */
  function editTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    editingTaskId = id;
    document.getElementById("modalTitle").textContent = "编辑回复任务";
    document.getElementById("taskNameInput").value = task.name || "";
    document.getElementById("startTimeInput").value =
      task.startTime || "09:00:00";
    document.getElementById("endTimeInput").value = task.endTime || "";
    document.getElementById("taskScopeApproval").checked = false;
    switchCycle(task.cycleType || "weekly");

    if (task.cycleType === "weekly") {
      document.querySelectorAll("#weekDayGrid .day-btn").forEach((b) => {
        b.classList.toggle(
          "active",
          (task.weekDays || []).includes(parseInt(b.dataset.day)),
        );
      });
    } else {
      document.querySelectorAll("#monthDayGrid .day-btn").forEach((b) => {
        b.classList.toggle(
          "active",
          (task.monthDays || []).includes(parseInt(b.textContent)),
        );
      });
    }
    document.getElementById("taskModal").style.display = "flex";
  }

  /**
   * 复制指定任务
   * @param {string} id - 任务 ID
   */
  function copyTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const copy = {
      ...task,
      id: "task_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      name: task.name + "（副本）",
      enabled: false,
      scopeApprovedAt: null,
    };
    tasks.push(copy);
    saveTasksToStorage();
    renderTasks();
    showToast("✅ 已复制");
  }

  /**
   * 删除指定任务
   * @param {string} id - 任务 ID
   */
  async function deleteTask(id) {
    showConfirmDialog("确定删除该定时任务吗？", async () => {
      tasks = tasks.filter((t) => t.id !== id);
      await saveTasksToStorage();
      renderTasks();
      showToast("✅ 任务已删除");
    });
  }

  /**
   * 转义 HTML 特殊字符以防止 XSS
   * @param {string} text - 原始文本
   * @returns {string} 转义后的 HTML 字符串
   */
  function escapeHtml(text) {
    const d = document.createElement("div");
    d.textContent = text || "";
    return d.innerHTML;
  }

  /**
   * 显示 Toast 提示消息
   * @param {string} msg - 提示消息内容
   */
  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = "1";
    setTimeout(() => {
      el.style.opacity = "0";
    }, 2500);
  }

  /* 确认弹窗：替代浏览器 confirm */
  let _confirmCallback = null;

  function showConfirmDialog(message, onConfirm) {
    document.getElementById("confirmMessage").textContent = message;
    document.getElementById("confirmModal").style.display = "flex";
    _confirmCallback = onConfirm;
  }

  /**
   * 初始化月份日期网格（1-31 日）
   */
  function initMonthGrid() {
    const grid = document.getElementById("monthDayGrid");
    for (let d = 1; d <= 31; d++) {
      const btn = document.createElement("div");
      btn.className = "day-btn";
      btn.dataset.day = String(d);
      btn.textContent = d;
      btn.addEventListener("click", () => btn.classList.toggle("active"));
      grid.appendChild(btn);
    }
  }

  /**
   * 查询并显示调度器运行状态
   * 通过 chrome.runtime.sendMessage 查询 SW 中调度器的当前状态
   */
  async function loadSchedulerStatus() {
    try {
      let status = null;
      // 优先使用 shell API，再回退到 chrome.runtime.sendMessage
      const api = window.parent.__shellAPI;
      if (api && typeof api.sendToSW === "function") {
        status = await api.sendToSW("cmd_get_scheduler_status");
      } else {
        status = await chrome.runtime.sendMessage({
          action: "cmd_get_scheduler_status",
        });
      }
      const el = document.getElementById("schedulerStatus");
      const info = document.getElementById("statusInfo");
      const active = document.getElementById("activeTaskName");
      if (!status || !el) return;

      if (status.taskCount > 0) {
        el.style.display = "block";
        const taskCount = status.taskCount;
        const hasActive = !!status.activeTaskName;
        info.textContent = `📋 ${taskCount} 个定时任务 · 每分钟检查一次`;
        if (hasActive) {
          active.textContent = `🟢 当前活跃: ${status.activeTaskName}`;
          active.style.color = "var(--success)";
        } else {
          active.textContent = "⏸️ 当前无活跃任务";
          active.style.color = "var(--muted)";
        }
      } else {
        el.style.display = "none";
      }
    } catch (err) {
      // 静默处理（SW 刚启动时可能暂时无法响应）
      console.debug("[Scheduler] 查询状态失败:", err.message);
    }
  }

  // DOM 加载完成后初始化
  document.addEventListener("DOMContentLoaded", () => {
    // 确认弹窗按钮事件
    document.getElementById("confirmCancel").addEventListener("click", () => {
      document.getElementById("confirmModal").style.display = "none";
      _confirmCallback = null;
    });
    document.getElementById("confirmOk").addEventListener("click", () => {
      document.getElementById("confirmModal").style.display = "none";
      if (typeof _confirmCallback === "function") {
        const cb = _confirmCallback;
        _confirmCallback = null;
        cb();
      }
    });
    document.getElementById("confirmModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        document.getElementById("confirmModal").style.display = "none";
        _confirmCallback = null;
      }
    });

    initMonthGrid();
    loadTasks();
    loadSchedulerStatus();

    // 绑定「新增回复任务」按钮
    document
      .getElementById("btnAddTask")
      .addEventListener("click", openTaskModal);

    // 绑定周期切换按钮
    document
      .getElementById("optionWeekly")
      .addEventListener("click", () => switchCycle("weekly"));
    document
      .getElementById("optionMonthly")
      .addEventListener("click", () => switchCycle("monthly"));

    // 绑定弹窗取消/保存按钮
    document
      .getElementById("btnCancel")
      .addEventListener("click", closeTaskModal);
    document.getElementById("btnSave").addEventListener("click", saveTask);

    // 通过事件委托绑定任务列表中的操作按钮（复制 / 编辑 / 删除）
    document.getElementById("taskList").addEventListener("click", (e) => {
      const actionEl = e.target.closest("[data-action]");
      if (!actionEl) return;
      const action = actionEl.dataset.action;
      const taskId = actionEl.dataset.taskId;
      if (action === "copy") copyTask(taskId);
      else if (action === "edit") editTask(taskId);
      else if (action === "delete") deleteTask(taskId);
    });

    // 绑定周天按钮点击切换（月天按钮在 initMonthGrid 中已绑定）
    document.querySelectorAll("#weekDayGrid .day-btn").forEach((btn) => {
      btn.addEventListener("click", () => btn.classList.toggle("active"));
    });
  });
})();
