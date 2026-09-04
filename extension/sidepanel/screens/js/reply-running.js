(function () {
  "use strict";

  let automationState = "idle";
  const PRIVACY_CONSENT_KEY = "privacyConsent";
  const PRIVACY_CONSENT_VERSION = "2026-07-29";
  const AUTOMATION_APPROVAL_KEY = "replyAutomationApproval";

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

  /**
   * 岗位范围三态链（与 service-worker/reply-scope.mjs 同规则的内联副本——经典脚本无法 import，改动须同步）：
   * ①jobConfigs 非空→白名单=启用的岗位（同名 rpc 借设置，NFKC/空白/大小写归一匹配）；全关→none 待机。
   * ②jobConfigs 空 & rpc 有启用→旧白名单。③皆空→all 全岗位。
   */
  function resolveReplyScopeInline(jobConfigs, replyPositionConfigs) {
    const jobs = Array.isArray(jobConfigs) ? jobConfigs : [];
    const rpc = Array.isArray(replyPositionConfigs) ? replyPositionConfigs : [];
    const norm = (s) =>
      String(s || "").normalize("NFKC").replace(/\s+/g, "").toLowerCase();
    if (jobs.length > 0) {
      const entries = jobs
        .filter((j) => j && j.enabled !== false && j.name)
        .map((j) => ({
          ...(rpc.find((c) => norm(c && c.name) === norm(j.name)) || {}),
          name: j.name,
          enabled: true,
        }));
      return { mode: entries.length ? "whitelist" : "none", entries };
    }
    const legacy = rpc.filter((c) => c && c.enabled !== false);
    return legacy.length
      ? { mode: "whitelist", entries: legacy }
      : { mode: "all", entries: [] };
  }

  /**
   * 检查启动前置条件
   * 范围按三态链：白名单（有启用岗位）/ 待机（岗位全部关闭，不回任何岗位）/ 全岗位（未配置岗位时兜底）
   * 附加条件：
   *   - 有岗位启用AI回复 → 大模型配置必须完整（apiUrl、apiKey、model）
   *   - 有岗位启用关键词回复 → 至少配置一条关键词规则
   * @returns {{ canStart: boolean, reasons: string[], mode: 'all'|'whitelist'|'none' }} 检查结果和未满足的具体原因
   */
  async function checkPreconditions() {
    const result = await chrome.storage.local.get([
      "replyPositionConfigs",
      "modelConfig",
      "keywordRules",
      "jobConfigs",
    ]);
    const scope = resolveReplyScopeInline(
      result.jobConfigs,
      result.replyPositionConfigs,
    );
    const enabledConfigs = scope.entries;
    const enabledRules = (result.keywordRules || []).filter(
      (r) => r.enabled !== false,
    );
    const standbyMode = scope.mode === "none";
    const allPositionsMode = scope.mode === "all";

    const reasons = [];

    // 检查是否有有效的回复方式
    // 全岗位模式沿用原逻辑：有关键词规则时先匹配关键词，其余消息交给AI。
    const anyAiReply =
      allPositionsMode || enabledConfigs.some((c) => c.aiReply !== false);
    const anyKeywordReply = allPositionsMode
      ? enabledRules.length > 0
      : enabledConfigs.some((c) => c.keywordReply !== false);
    const anyGreeting =
      !allPositionsMode &&
      enabledConfigs.some(
        (c) =>
          Array.isArray(c.greetingMessages) && c.greetingMessages.length > 0,
      );

    if (!standbyMode && !anyAiReply && !anyKeywordReply && !anyGreeting) {
      reasons.push(
        "所有启用的岗位配置均未开启任何回复方式（关键词回复/AI回复/新招呼话术）",
      );
    }

    // 有岗位启用AI回复 → 校验托管点数余额（密钥在服务端，余额<=0 则拒启动）
    if (anyAiReply) {
      try {
        const resp = await chrome.runtime.sendMessage({ command: 'cmd_get_billing_balance' });
        const bal = resp && resp.ok ? resp.balance : null;
        if (bal && Number(bal.balance_points) <= 0) {
          reasons.push(
            "有岗位启用「AI回复」但点数不足，请先到「大模型（托管）」页充值",
          );
        }
      } catch (_) {
        // 余额查询失败（网络/未登录）不阻断启动，由调用时断粮标记兜底
      }
    }

    // 有岗位启用关键词回复 → 校验关键词规则配置
    if (anyKeywordReply) {
      if (enabledRules.length === 0) {
        reasons.push("有岗位启用「关键词回复」但未配置关键词规则");
      }
    }

    return {
      canStart: reasons.length === 0,
      reasons,
      mode: standbyMode ? "none" : allPositionsMode ? "all" : "whitelist",
    };
  }

  /**
   * 每次启动前向用户展示本次自动化范围。确认后仍按原逻辑自动执行，
   * 不增加逐条发送确认，也不改变拟人频率。
   */
  async function confirmAutomationScope() {
    const result = await chrome.storage.local.get([
      PRIVACY_CONSENT_KEY,
      "replyPositionConfigs",
      "keywordRules",
      "modelConfig",
      "jobConfigs",
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

    const scope = resolveReplyScopeInline(
      result.jobConfigs,
      result.replyPositionConfigs,
    );
    const enabledConfigs = scope.entries;
    const standby = scope.mode === "none";
    const allPositions = scope.mode === "all";
    const positionNames = enabledConfigs
      .map((config) => config.name)
      .filter(Boolean);
    const positionLimits = enabledConfigs
      .filter((config) => config.name)
      .map((config) => ({
        name: config.name,
        limit: Math.min(20, Math.max(1, Number(config.autoReplyLimit) || 5)),
      }));
    const greetingCount = enabledConfigs.reduce(
      (count, config) =>
        count +
        (Array.isArray(config.greetingMessages)
          ? config.greetingMessages.filter(Boolean).length
          : 0),
      0,
    );
    const keywordCount = (result.keywordRules || []).filter(
      (rule) => rule.enabled !== false,
    ).length;
    const aiEnabled =
      allPositions || enabledConfigs.some((config) => config.aiReply !== false);
    const targetText = standby
      ? "待机（所有岗位配置均已关闭，不处理任何岗位）"
      : allPositions
        ? "全部已发布岗位（未配置岗位时的默认模式）"
        : positionLimits.map((item) => `${item.name}（最多 ${item.limit} 人）`).join("、");
    const strategy = [
      greetingCount > 0
        ? `岗位新招呼话术 ${greetingCount} 条`
        : "无岗位新招呼话术",
      keywordCount > 0 ? `关键词规则 ${keywordCount} 条` : "无关键词规则",
      aiEnabled ? "AI 回复已启用" : "AI 回复已关闭",
    ].join("；");

    const approved = window.confirm(
      [
        "启动前请确认本次自动回复范围",
        "",
        `目标岗位：${targetText}`,
        allPositions
          ? "接收人范围：BOSS 沟通列表中已发布岗位的新消息候选人。"
          : "执行方式：按岗位配置从上到下依次选择岗位，并按页面顺序处理未读候选人；达到该岗位人数上限后切换下一岗位。",
        `话术来源：${strategy}`,
        aiEnabled
          ? "数据处理：生成 AI 回复时，必要的岗位、简历和聊天上下文会发送至您配置的 AI 服务商。"
          : "数据处理：本次不调用 AI，仅使用本地配置的话术与规则。",
        "",
        "确认后将按照已配置的拟人频率自动运行，无需逐条确认。是否启动？",
      ].join("\n"),
    );
    if (!approved) return false;

    await chrome.storage.local.set({
      [AUTOMATION_APPROVAL_KEY]: {
        approvedAt: new Date().toISOString(),
        privacyVersion: PRIVACY_CONSENT_VERSION,
        mode: allPositions ? "all" : "whitelist",
        positions: positionNames,
        positionLimits,
        recipientScope: "incoming-candidates-for-approved-positions",
        greetingCount,
        keywordCount,
        aiEnabled,
      },
    });
    return true;
  }

  /**
   * 验证订阅是否有效
   * 调用 SW 代理请求后端最新订阅数据，判断当前时间是否在有效期内
   * 网络异常时 SW 会自动降级使用本地缓存
   * @returns {Promise<{ valid: boolean, message?: string, reason?: string }>}
   */
  async function validateSubscription() {
    try {
      const api = window.parent.__shellAPI;
      let result;
      if (api && typeof api.sendToSW === "function") {
        result = await api.sendToSW("cmd_validate_subscription");
      } else {
        result = await chrome.runtime.sendMessage({
          action: "cmd_validate_subscription",
          requestId: "val_" + Date.now(),
        });
      }
      return result || { valid: false, message: "验证订阅失败" };
    } catch (err) {
      return {
        valid: false,
        reason: "communication_error",
        message: "与服务通信失败，请刷新页面后重试: " + err.message,
      };
    }
  }

  document.getElementById("btnStart").addEventListener("click", async () => {
    // 步骤1：启动前检查配置条件
    const { canStart, reasons, mode } = await checkPreconditions();
    if (!canStart) {
      const reasonMsg = reasons.join("、");
      addLog("[系统]", `启动失败：${reasonMsg}`, "log-warn");
      return;
    }
    if (!(await confirmAutomationScope())) {
      addLog("[系统]", "用户取消了本次自动回复任务", "log-warn");
      return;
    }
    addLog(
      "[系统]",
      mode === "none"
        ? "当前为待机模式：所有岗位配置均已关闭，不处理任何岗位"
        : mode === "all"
          ? "当前为全岗位模式：将处理沟通中的所有已发布岗位"
          : "当前为岗位白名单模式：只处理已启用的岗位配置",
      mode === "all" || mode === "none" ? "log-warn" : "log-sys",
    );

    // 步骤2：验证订阅有效性
    const subResult = await validateSubscription();
    if (!subResult.valid) {
      addLog("[系统]", `启动失败：${subResult.message}`, "log-warn");
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

    // 步骤3：发送启动命令
    document.getElementById("btnStart").textContent = "启动中...";
    document.getElementById("btnStart").disabled = true;
    try {
      const api = window.parent.__shellAPI;
      if (api) {
        await api.sendToSW("cmd_start");
      } else {
        await chrome.runtime.sendMessage({
          action: "cmd_start",
          requestId: "run_" + Date.now(),
        });
      }
      updateUI("running");
      addLog("[系统]", "自动回复助手已启动", "log-sys");
    } catch (err) {
      addLog("[系统]", "启动失败: " + err.message, "log-warn");
    } finally {
      document.getElementById("btnStart").textContent = "启动助手";
      document.getElementById("btnStart").disabled = false;
    }
  });

  document.getElementById("btnPause").addEventListener("click", async () => {
    try {
      const api = window.parent.__shellAPI;
      if (api) await api.sendToSW("cmd_pause");
      else await chrome.runtime.sendMessage({ action: "cmd_pause" });
      updateUI("paused");
      // 暂停状态日志由 STATUS_UPDATE 事件统一处理，避免重复
    } catch (err) {
      addLog("[系统]", "暂停失败: " + err.message, "log-sys");
    }
  });

  document.getElementById("btnResume").addEventListener("click", async () => {
    try {
      const api = window.parent.__shellAPI;
      if (api) await api.sendToSW("cmd_resume");
      else await chrome.runtime.sendMessage({ action: "cmd_resume" });
      updateUI("running");
      // 恢复状态日志由 STATUS_UPDATE 事件统一处理，避免重复
    } catch (err) {
      addLog("[系统]", "恢复失败: " + err.message, "log-sys");
    }
  });

  document.getElementById("btnStop").addEventListener("click", async () => {
    try {
      const api = window.parent.__shellAPI;
      if (api) await api.sendToSW("cmd_stop");
      else await chrome.runtime.sendMessage({ action: "cmd_stop" });
      updateUI("idle");
      addLog("[系统]", "助手已停止", "log-sys");
    } catch (err) {
      addLog("[系统]", "停止失败: " + err.message, "log-sys");
    }
  });

  // 监听来自 shell 的实时运行日志（候选人消息和发送的话术）
  window.addEventListener("message", (event) => {
    // 处理从 shell 恢复的缓存日志（切换模块后重新加载时）
    if (
      event.data?.type === "CACHED_LOGS" &&
      event.data?.taskType === "reply"
    ) {
      renderCachedLogs(event.data.logs);
      return;
    }

    if (event.data?.type === "RUNNING_LOG") {
      // 仅处理自动回复相关的日志
      if (event.data.taskType && event.data.taskType !== "reply") return;

      const message = event.data.message || "";
      // 根据消息前缀自动识别类型：📩 = 候选人消息（绿色），📤 = 发送的话术（蓝色）
      let colorClass = "log-exec";
      let typeLabel = "[消息]";
      if (message.startsWith("📩")) {
        colorClass = "log-incoming"; // 绿色 - 候选人消息
        typeLabel = "[候选人]";
      } else if (message.startsWith("📤")) {
        colorClass = "log-outgoing"; // 蓝色 - 发送的话术
        typeLabel = "[发送]";
      }
      addLog(typeLabel, message, colorClass);
      return;
    }

    // 监听来自 shell 的状态更新
    if (event.data?.type === "STATUS_UPDATE") {
      // 过滤非自动回复的状态更新（如打招呼模块的状态）
      if (event.data.taskType && event.data.taskType !== "reply") return;

      updateUI(event.data.state, event.data.statusText || "");
      // 状态日志防重复：同一状态 + 相同文本在 2 秒内不再重复输出
      const now = Date.now();
      const stateKey = `${event.data.state}|${event.data.statusText || ""}`;
      if (stateKey === _lastStatusKey && now - _lastStatusTime < 2000) return;
      _lastStatusKey = stateKey;
      _lastStatusTime = now;

      // 不同状态变化时记录日志
      if (event.data.state === "running") {
        addLog("[系统]", "助手运行中", "log-sys");
      } else if (event.data.state === "paused" && event.data.statusText) {
        addLog("[系统]", event.data.statusText, "log-sys");
      } else if (event.data.state === "idle" && event.data.statusText) {
        // 启动后因配置问题（如职位列表为空）自动停止时记录错误日志
        addLog("[系统]", event.data.statusText, "log-warn");
      }
    }
  });

  // 状态日志去重变量
  let _lastStatusKey = "";
  let _lastStatusTime = 0;

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
      if (message.startsWith("📩")) {
        colorClass = "log-incoming";
        typeLabel = "[候选人]";
      } else if (message.startsWith("📤")) {
        colorClass = "log-outgoing";
        typeLabel = "[发送]";
      } else if (message.startsWith("[系统]")) {
        colorClass = "log-sys";
        typeLabel = "[系统]";
      } else if (message.startsWith("[AI]")) {
        colorClass = "log-ai";
        typeLabel = "[AI]";
      } else if (message.startsWith("[关键词]")) {
        colorClass = "log-kw";
        typeLabel = "[关键词]";
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
        const logs = api.getCachedLogs("reply");
        renderCachedLogs(logs);
      }
    } catch (e) {
      /* 跨域或 API 不可用时静默忽略 */
    }
  }

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
        { type: "CLEAR_CACHE", taskType: "reply" },
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
    lines.push("=== 自动回复运行日志 ===");
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
    a.download = `运行日志_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.getElementById("btnExportLog").addEventListener("click", exportLog);

  document.addEventListener("DOMContentLoaded", async () => {
    // 从父框架拉取缓存的日志（切换回来时恢复显示）
    restoreCachedLogs();
    // 查询当前状态
    try {
      const api = window.parent.__shellAPI;
      if (api) {
        const status = await api.sendToSW("cmd_get_status");
        if (status?.state) updateUI(status.state);
      }
    } catch (e) {
      /* 忽略 */
    }
  });
})();
