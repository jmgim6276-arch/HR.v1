/**
 * 打招呼运行控制台页面脚本
 * 管理打招呼任务的启动、暂停、停止和实时日志
 */
(function () {
  "use strict";

  const SWITCH_KEY = "greetingTaskSwitch";
  const PRIVACY_CONSENT_KEY = "privacyConsent";
  const PRIVACY_CONSENT_VERSION = "2026-10-08";
  const AUTOMATION_APPROVAL_KEY = "greetingAutomationApproval";
  let automationState = "idle";

  /** 从 chrome.storage 加载开关状态并填充表单 */
  async function loadSwitches() {
    try {
      const result = await chrome.storage.local.get(SWITCH_KEY);
      const cfg = result[SWITCH_KEY] || {};
      const cbKeyword = document.getElementById("cbKeywordReply");
      const cbAi = document.getElementById("cbAiReply");
      if (cbKeyword) cbKeyword.checked = cfg.keywordGreeting !== false;
      if (cbAi) cbAi.checked = cfg.aiGreeting !== false;
    } catch (err) {
      console.error(err);
    }
  }

  /** 将开关状态保存到 chrome.storage */
  async function saveSwitches() {
    const cbKeyword = document.getElementById("cbKeywordReply");
    const cbAi = document.getElementById("cbAiReply");
    try {
      await chrome.storage.local.set({
        [SWITCH_KEY]: {
          keywordGreeting: cbKeyword ? cbKeyword.checked : true,
          aiGreeting: cbAi ? cbAi.checked : true,
        },
      });
    } catch (err) {
      console.error(err);
    }
  }

  // 用文本节点渲染日志正文：候选人昵称/消息是不可信内容，
  // 直接拼 innerHTML 会把其中的 HTML 注入到扩展页面（存储型 XSS）。
  function makeLogEntry(timeText, colorClass, typeText, msg) {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    const timeSpan = document.createElement("span");
    timeSpan.className = "log-time";
    timeSpan.textContent = timeText;
    const typeSpan = document.createElement("span");
    typeSpan.className = colorClass;
    typeSpan.textContent = typeText;
    entry.appendChild(timeSpan);
    entry.appendChild(document.createTextNode(" "));
    entry.appendChild(typeSpan);
    entry.appendChild(document.createTextNode(" " + (msg == null ? "" : msg)));
    return entry;
  }

  /** 向日志容器添加一条日志 */
  function addLog(type, msg, colorClass) {
    const now = new Date();
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
    const container = document.getElementById("logContainer");
    container.appendChild(makeLogEntry(time, colorClass, type, msg));
    container.scrollTop = container.scrollHeight;
  }

  /**
   * 设置状态提示文本（暂停原因等）
   * @param {string} text - 显示的状态文本，空字符串则隐藏
   */
  function setStatusText(text) {
    const el = document.getElementById("statusText");
    if (!el) return;
    if (text) {
      el.textContent = text;
      el.style.display = "block";
    } else {
      el.style.display = "none";
    }
  }

  /**
   * 显示 Toast 提示消息
   * @param {string} msg - 提示内容
   * @param {number} duration - 显示时长（毫秒），默认 2500
   */
  let _toastTimer = null;
  function showToast(msg, duration) {
    duration = duration || 2500;
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = "1";
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () {
      el.style.opacity = "0";
    }, duration);
  }

  /** 根据自动化状态更新UI的按钮状态 */
  function updateUI(state, statusText) {
    automationState = state;
    const running = state === "running";
    const paused = state === "paused";
    document.getElementById("btnStart").disabled = running || paused;
    document.getElementById("btnPause").style.display = running
      ? "inline-flex"
      : "none";
    document.getElementById("btnResume").style.display = paused
      ? "inline-flex"
      : "none";
    document.getElementById("btnSkip").style.display =
      running || paused ? "inline-flex" : "none";
    document.getElementById("btnSkip").disabled = !(running || paused);
    document.getElementById("btnStop").style.display =
      running || paused ? "inline-flex" : "none";
    document.getElementById("btnPause").disabled = !running;
    document.getElementById("btnStop").disabled = !(running || paused);
    document.getElementById("runningIndicator").style.display = running
      ? "block"
      : "none";
    // 运行或空闲时隐藏状态提示，暂停时显示原因
    if (running || state === "idle") {
      setStatusText("");
    } else if (paused && statusText) {
      setStatusText(statusText);
    }
  }

  /** 发送消息到 Service Worker */
  async function sendToSW(action, data) {
    const api = window.parent && window.parent.__shellAPI;
    if (api && typeof api.sendToSW === "function") {
      return api.sendToSW(action, data);
    }
    return chrome.runtime.sendMessage({ action, data });
  }

  /**
   * 验证订阅是否有效
   * 调用 SW 代理请求后端最新订阅数据，判断当前时间是否在有效期内
   * 网络/通信异常时按订阅无效处理（fail-closed），不会放行自动运行
   * @returns {Promise<{ valid: boolean, message?: string, reason?: string }>}
   */
  async function validateSubscription() {
    try {
      const result = await sendToSW("cmd_validate_subscription");
      return result || { valid: false, message: "验证订阅失败" };
    } catch (err) {
      return {
        valid: false,
        reason: "communication_error",
        message: "与服务通信失败，请刷新页面后重试: " + err.message,
      };
    }
  }

  /** 启动前一次性确认岗位、话术与候选人范围；确认后仍保持自动运行。 */
  async function confirmAutomationScope() {
    const result = await chrome.storage.local.get([
      PRIVACY_CONSENT_KEY,
      "jobConfigs",
      "greetingConfigs",
    ]);
    const consent = result[PRIVACY_CONSENT_KEY] || {};
    if (consent.version !== PRIVACY_CONSENT_VERSION || !consent.acceptedAt) {
      showToast("请先到个人中心同意最新隐私政策");
      setTimeout(() => {
        window.parent.postMessage(
          { type: "NAVIGATE", src: "screens/profile.html" },
          "*",
        );
      }, 800);
      return false;
    }

    const jobs = (result.jobConfigs || []).filter(
      (job) => job.enabled !== false,
    );
    const configByJobId = new Map(
      (result.greetingConfigs || []).map((config) => [config.jobId, config]),
    );
    const approvedJobs = jobs.filter((job) => configByJobId.has(job.id));
    const positionNames = approvedJobs.map((job) => job.name).filter(Boolean);
    const totalTarget = approvedJobs.reduce((count, job) => {
      const config = configByJobId.get(job.id) || {};
      return count + Math.max(0, Number(config.greetCount) || 0);
    }, 0);
    const greetingCount = approvedJobs.reduce((count, job) => {
      const messages = configByJobId.get(job.id)?.greetingMessages || [];
      return count + messages.filter(Boolean).length;
    }, 0);
    if (positionNames.length === 0) {
      showToast("没有可运行的岗位及打招呼配置");
      return false;
    }

    const approved = window.confirm(
      [
        "启动前请确认本次自动打招呼范围",
        "",
        `目标岗位：${positionNames.join("、")}`,
        `候选人范围：符合上述岗位筛选条件的推荐候选人，计划上限共 ${totalTarget || "按岗位配置"} 人。`,
        `话术来源：岗位配置中的打招呼话术，共 ${greetingCount} 条。`,
        "确认后将按照已配置的拟人频率自动运行，无需逐条确认。是否启动？",
      ].join("\n"),
    );
    if (!approved) return false;

    await chrome.storage.local.set({
      [AUTOMATION_APPROVAL_KEY]: {
        approvedAt: new Date().toISOString(),
        privacyVersion: PRIVACY_CONSENT_VERSION,
        positions: positionNames,
        recipientScope: "recommended-candidates-matching-approved-job-filters",
        totalTarget,
        greetingCount,
      },
    });
    return true;
  }

  // 启动按钮
  document.getElementById("btnStart").addEventListener("click", async () => {
    await saveSwitches();

    if (!(await confirmAutomationScope())) {
      addLog("[系统]", "用户取消了本次打招呼任务", "log-sys");
      return;
    }

    // 步骤1：验证订阅有效性
    const subResult = await validateSubscription();
    if (!subResult.valid) {
      addLog("[系统]", `启动失败：${subResult.message}`, "log-sys");
      showToast(subResult.message);
      // 订阅到期、未登录或 token 过期时，自动导航到个人中心
      if (
        subResult.reason === "subscription_expired" ||
        subResult.reason === "not_logged_in" ||
        subResult.reason === "token_expired"
      ) {
        setTimeout(() => {
          window.parent.postMessage(
            { type: "NAVIGATE", src: "screens/profile.html" },
            "*",
          );
        }, 1500);
      }
      return;
    }

    // 步骤2：发送启动命令
    document.getElementById("btnStart").textContent = "启动中...";
    document.getElementById("btnStart").disabled = true;
    try {
      await sendToSW("cmd_start_greeting");
      // 先重置按钮文字，再调用 updateUI 自动管理 disabled/display 状态
      document.getElementById("btnStart").textContent = "启动任务";
      updateUI("running");
      addLog("[系统]", "打招呼任务已启动", "log-sys");
    } catch (err) {
      addLog("[系统]", "启动失败: " + err.message, "log-sys");
      // 失败时恢复启动按钮
      document.getElementById("btnStart").textContent = "启动任务";
      document.getElementById("btnStart").disabled = false;
    }
  });

  // 暂停按钮
  document.getElementById("btnPause").addEventListener("click", async () => {
    try {
      await sendToSW("cmd_pause_greeting");
      updateUI("paused");
      // 暂停状态日志由 STATUS_UPDATE 事件统一处理，避免重复
    } catch (err) {
      addLog("[系统]", "暂停失败: " + err.message, "log-sys");
    }
  });

  // 恢复按钮
  document.getElementById("btnResume").addEventListener("click", async () => {
    try {
      await sendToSW("cmd_resume_greeting");
      updateUI("running");
      // 恢复状态日志由 STATUS_UPDATE 事件统一处理，避免重复
    } catch (err) {
      addLog("[系统]", "恢复失败: " + err.message, "log-sys");
    }
  });

  // 停止按钮
  document.getElementById("btnStop").addEventListener("click", async () => {
    try {
      await sendToSW("cmd_stop_greeting");
      updateUI("idle");
      addLog("[系统]", "打招呼任务已停止", "log-sys");
    } catch (err) {
      addLog("[系统]", "停止失败: " + err.message, "log-sys");
    }
  });

  // 切换下个岗位按钮
  document.getElementById("btnSkip").addEventListener("click", async () => {
    document.getElementById("btnSkip").disabled = true;
    document.getElementById("btnSkip").textContent = "切换中...";
    try {
      await sendToSW("cmd_skip_greeting_job");
      addLog("[系统]", "已切换到下一个岗位", "log-sys");
    } catch (err) {
      addLog("[系统]", "切换失败: " + err.message, "log-sys");
    } finally {
      document.getElementById("btnSkip").textContent = "切换下个岗位";
      document.getElementById("btnSkip").disabled = false;
    }
  });

  // 监听来自 shell 的实时运行日志（打招呼候选人和发送的话术）
  window.addEventListener("message", (event) => {
    // 处理从 shell 恢复的缓存日志（切换模块后重新加载时）
    if (
      event.data?.type === "CACHED_LOGS" &&
      event.data?.taskType === "greeting"
    ) {
      renderCachedLogs(event.data.logs);
      return;
    }

    if (event.data?.type === "RUNNING_LOG") {
      // 仅处理打招呼相关的日志
      if (event.data.taskType && event.data.taskType !== "greeting") return;

      const message = event.data.message || "";
      // 根据消息前缀自动识别类型：👋 = 打招呼动作（绿色），📤 = 发送的话术（蓝色）
      let colorClass = "log-exec";
      let typeLabel = "[消息]";
      if (message.startsWith("👋")) {
        colorClass = "log-incoming"; // 绿色 - 打招呼动作
        typeLabel = "[打招呼]";
      } else if (message.startsWith("📤")) {
        colorClass = "log-outgoing"; // 蓝色 - 发送的话术
        typeLabel = "[发送]";
      }
      addLog(typeLabel, message, colorClass);
      return;
    }

    // 监听来自 shell 的状态更新（仅处理打招呼相关的状态）
    if (
      event.data?.type === "STATUS_UPDATE" &&
      event.data?.taskType === "greeting"
    ) {
      const statusText = event.data.statusText || "";
      updateUI(event.data.state, statusText);

      // 解析进度信息更新进度卡片（格式：岗位"xxx" 招呼进度 15/50）
      const progressMatch = statusText.match(
        /岗位"([^"]+)"\s+招呼进度\s+(\d+)\/(\d+)/,
      );
      if (progressMatch) {
        const card = document.getElementById("jobProgressCard");
        if (card) {
          const jobName = progressMatch[1];
          const greeted = parseInt(progressMatch[2], 10);
          const target = parseInt(progressMatch[3], 10);
          const pct = target > 0 ? Math.round((greeted / target) * 100) : 0;
          document.getElementById("currentJobName").textContent = jobName;
          document.getElementById("progressFill").style.width = pct + "%";
          // 更新进度元信息显示已打招呼数/目标数
          const meta = card.querySelector(".job-progress-meta");
          if (meta) {
            meta.innerHTML = `<span>已打招呼：<strong>${greeted}/${target}</strong></span>`;
          }
          card.style.display = "block";
        }
      }

      // 状态日志防重复：只在状态真正变化时记录系统消息
      // 与自动回复模块保持一致的设计理念——STATUS_UPDATE 用于状态切换通知而非进度更新
      if (event.data.state !== _prevStatusState) {
        _prevStatusState = event.data.state;
        if (event.data.state === "running") {
          addLog("[系统]", "打招呼任务运行中", "log-sys");
        } else if (event.data.state === "paused" && statusText) {
          addLog("[系统]", statusText, "log-sys");
        } else if (event.data.state === "idle" && statusText) {
          // 空闲状态有状态文本时记录（如"无可用岗位配置"、"所有岗位处理完成"）
          addLog("[系统]", statusText, "log-sys");
        }
      }
    }
  });

  // 状态日志去重变量：追踪上一次状态，只在状态切换时记录系统消息
  let _prevStatusState = "";

  /**
   * 渲染缓存的日志（切换模块后恢复显示）
   * 从缓存数组中重建日志 DOM 条目
   * @param {Array} logs - 缓存日志数组，每项包含 { time, message }
   */
  function renderCachedLogs(logs) {
    if (!logs || logs.length === 0) return;
    const container = document.getElementById("logContainer");
    container.innerHTML = "";
    logs.forEach((log) => {
      const message = log.message || "";
      let colorClass = "log-exec";
      let typeLabel = "[消息]";
      if (message.startsWith("👋")) {
        colorClass = "log-incoming";
        typeLabel = "[打招呼]";
      } else if (message.startsWith("📤")) {
        colorClass = "log-outgoing";
        typeLabel = "[发送]";
      } else if (message.startsWith("[系统]")) {
        colorClass = "log-sys";
        typeLabel = "[系统]";
      }
      container.appendChild(makeLogEntry(log.time || "--:--:--", colorClass, typeLabel, message));
    });
    container.scrollTop = container.scrollHeight;
  }

  /**
   * 从父框架主动拉取缓存的日志并渲染
   * 解决切换菜单再切回时日志被清空的问题
   * 作为 postMessage CACHED_LOGS 的补充/备选方案
   */
  function restoreCachedLogs() {
    try {
      const api = window.parent?.__shellAPI;
      if (api && typeof api.getCachedLogs === "function") {
        const logs = api.getCachedLogs("greeting");
        renderCachedLogs(logs);
      }
    } catch (e) {
      /* 跨域或 API 不可用时静默忽略 */
    }
  }

  // DOM 就绪时加载开关状态、查询当前任务状态、恢复缓存日志
  document.addEventListener("DOMContentLoaded", async () => {
    await loadSwitches();
    // 从父框架拉取缓存的日志（切换回来时恢复显示）
    restoreCachedLogs();
    try {
      const status = await sendToSW("cmd_get_greeting_status");
      if (status?.state) {
        updateUI(status.state);
        // 如果有进度信息也更新进度卡
        if (status.currentJob) {
          const card = document.getElementById("jobProgressCard");
          if (card) {
            document.getElementById("currentJobName").textContent =
              status.currentJob.name || "";
            document.getElementById("currentCandidate").textContent =
              status.currentJob.candidate || "";
            document.getElementById("matchedTags").textContent =
              status.currentJob.tags || "";
            if (status.currentJob.progress !== undefined) {
              document.getElementById("progressFill").style.width =
                status.currentJob.progress + "%";
            }
            card.style.display = "block";
          }
        }
      }
    } catch (e) {
      /* 忽略 */
    }
  });

  /**
   * 清空实时运行日志
   * 清空所有日志条目，添加一条"日志已清空"记录，同时通知 Shell 清除缓存防止切换页面后恢复
   */
  function clearLog() {
    const container = document.getElementById("logContainer");
    container.innerHTML = "";
    const now = new Date();
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.innerHTML = `<span class="log-time">${time}</span> <span class="log-sys">[系统]</span> 日志已清空`;
    container.appendChild(entry);
    // 通知 Shell 清除缓存，防止切换页面后日志被恢复
    try {
      window.parent.postMessage(
        { type: "CLEAR_CACHE", taskType: "greeting" },
        "*",
      );
    } catch (e) {
      /* 忽略 */
    }
  }

  document.getElementById("btnClearLog").addEventListener("click", clearLog);

  /**
   * 导出实时运行日志
   * 将当前所有日志条目导出为 .txt 文件下载
   */
  function exportLog() {
    const container = document.getElementById("logContainer");
    const entries = container.querySelectorAll(".log-entry");
    if (entries.length === 0) return;

    const lines = [];
    lines.push("=== 打招呼运行日志 ===");
    lines.push(`导出时间: ${new Date().toLocaleString()}`);
    lines.push("=".repeat(40));
    lines.push("");

    entries.forEach((entry) => {
      lines.push(entry.textContent.trim());
    });

    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `打招呼运行日志_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.getElementById("btnExportLog").addEventListener("click", exportLog);
})();
