(() => {
  var L = {
      MODEL_CONFIG: "modelConfig",
      TIME_CONFIG: "timeConfig",
      ACTIVE_TAB_ID: "activeTabId",
      DEV_MODE: "devMode",
      DEV_NAME_FILTER: "devNameFilter",
      SCHEDULED_TASKS: "replyScheduledTasks",
      GOAL_CONFIGS: "goalConfigs",
      GOAL_REPLY_TEMPLATES: "goalReplyTemplates",
      SESSION_GOALS_PREFIX: "session_goals_",
      KEYWORD_RULES: "keywordRules",
      REPLY_TASK_SWITCH: "replyTaskSwitch",
      GENERAL_GREETING_CONFIG: "generalGreetingConfig",
      REPLY_POSITION_CONFIGS: "replyPositionConfigs",
      GENERAL_KNOWLEDGE_BASE: "generalKnowledgeBase",
      GREETING_SCHEDULED_TASKS: "greetingScheduledTasks",
      GREETING_TASK_SWITCH: "greetingTaskSwitch",
      GREETING_TIME_CONFIG: "greetingTimeConfig",
      GREETING_CONFIGS: "greetingConfigs",
      JOB_CONFIGS: "jobConfigs",
      PROFILE_AUTH: "profileAuth",
      PROFILE_SUBSCRIPTION: "profileSubscription",
    },
    E = { IDLE: "idle", RUNNING: "running", PAUSED: "paused" },
    M = {
      CMD_REFRESH_SCHEDULER: "cmd_refresh_scheduler",
      CMD_GET_SCHEDULER_STATUS: "cmd_get_scheduler_status",
      CS_GET_STATE: "cs_get_state",
      CMD_REFRESH_GREETING_SCHEDULER: "cmd_refresh_greeting_scheduler",
      CMD_GET_GREETING_SCHEDULER_STATUS: "cmd_get_greeting_scheduler_status",
      CMD_START: "cmd_start",
      CMD_PAUSE: "cmd_pause",
      CMD_RESUME: "cmd_resume",
      CMD_STOP: "cmd_stop",
      CMD_GET_STATUS: "cmd_get_status",
      CMD_GET_RECORDS: "cmd_get_records",
      CMD_EXPORT_RECORDS: "cmd_export_records",
      CMD_TEST_LLM_CONN: "cmd_test_llm_conn",
      CMD_TEST_LLM_CHAT: "cmd_test_llm_chat",
      CMD_SAVE_CONFIG: "cmd_save_config",
      CMD_GET_DEV_STATUS: "cmd_get_dev_status",
      CMD_GET_DEV_QUEUE: "cmd_get_dev_queue",
      CMD_GET_GREETING_RECORDS: "cmd_get_greeting_records",
      CMD_EXPORT_GREETING_RECORDS: "cmd_export_greeting_records",
      CMD_DEBUG_SCROLL_TEST: "cmd_debug_scroll_test",
      CMD_DEBUG_SCROLL_NOW: "cmd_debug_scroll_now",
      CMD_DEBUG_INSPECT_GREET: "cmd_debug_inspect_greet",
      CMD_START_GREETING: "cmd_start_greeting",
      CMD_PAUSE_GREETING: "cmd_pause_greeting",
      CMD_RESUME_GREETING: "cmd_resume_greeting",
      CMD_STOP_GREETING: "cmd_stop_greeting",
      CMD_SKIP_GREETING_JOB: "cmd_skip_greeting_job",
      CMD_GET_GREETING_STATUS: "cmd_get_greeting_status",
      CMD_PROFILE_LOGIN: "cmd_profile_login",
      CMD_PROFILE_LOGOUT: "cmd_profile_logout",
      CMD_PROFILE_GET_STATE: "cmd_profile_get_state",
      CMD_PROFILE_SEND_CODE: "cmd_profile_send_code",
      CMD_PROFILE_SYNC_SUBSCRIPTION: "cmd_profile_sync_subscription",
      CMD_PROFILE_GET_PRODUCTS: "cmd_profile_get_products",
      CMD_PROFILE_SUBSCRIBE: "cmd_profile_subscribe",
      CMD_VALIDATE_SUBSCRIPTION: "cmd_validate_subscription",
      DEV_LOG: "dev_log",
      RUNNING_LOG: "running_log",
      SESSION_GOAL_ACHIEVED: "session_goal_achieved",
      CS_CLEAR_SESSION_GOALS: "cs_clear_session_goals",
      CLEAR_SESSION_GOALS: "clear_session_goals",
      STATUS_UPDATE: "status_update",
      RECORDS_DATA: "records_data",
      LLM_TEST_RESULT: "llm_test_result",
      EXPORT_DATA: "export_data",
      ERROR: "error",
      SESSION_EXPIRED: "session_expired",
      CS_START: "cs_start",
      CS_PAUSE: "cs_pause",
      CS_RESUME: "cs_resume",
      CS_STOP: "cs_stop",
      CS_CONFIG_UPDATED: "cs_config_updated",
      CS_NAVIGATE_RECOMMEND: "cs_navigate_recommend",
      CS_DEBUG_SCROLL_TEST: "cs_debug_scroll_test",
      CS_DEBUG_SCROLL_NOW: "cs_debug_scroll_now",
      CS_DEBUG_INSPECT_GREET: "cs_debug_inspect_greet",
      CS_START_GREETING: "cs_start_greeting",
      CS_PAUSE_GREETING: "cs_pause_greeting",
      CS_RESUME_GREETING: "cs_resume_greeting",
      CS_STOP_GREETING: "cs_stop_greeting",
      CS_SKIP_GREETING_JOB: "cs_skip_greeting_job",
      STATUS_REPORT: "status_report",
      COMPLETED_USER: "completed_user",
      NEW_RECORD: "new_record",
      REQ_LLM_CALL: "req_llm_call",
      GREETING_STATUS_REPORT: "greeting_status_report",
      NEW_GREETING_RECORD: "new_greeting_record",
      CS_DEV_QUEUE: "cs_dev_queue",
    };
  var ue = {
      modelConfig: {
        apiUrl: "",
        apiKey: "",
        model: "gpt-4o",
        systemPrompt: "",
        userPrompt: "",
        maxHistoryRounds: 20,
      },
      timeConfig: {
        sendDelayRange: [3, 8],
        replyWait: 15,
        userIntervalSeconds: 60,
        runDurationMinutes: 60,
        pauseDurationMinutes: 10,
        maxRunDurationHours: 4,
      },
      goalConfigs: [],
      goalReplyTemplates: {},
    },
    pe = 200,
    we = 2e3;
  function w(i, e) {
    return Math.floor(Math.random() * (e - i + 1)) + i;
  }
  function Ee(i, e, t) {
    let s = `${i}_${e}_${t}`,
      n = 0;
    for (let o = 0; o < s.length; o++) {
      let u = s.charCodeAt(o);
      (n = (n << 5) - n + u), (n = n & n);
    }
    return `fp_${Math.abs(n).toString(36)}`;
  }
  function Se(i, e = null) {
    try {
      return JSON.parse(i);
    } catch {
      return e;
    }
  }
  function m(i) {
    return new Promise((e) => setTimeout(e, i));
  }
  var ne = !1,
    de = null;
  function Te(i) {
    de = i;
  }
  function he(i) {
    return Array.from(i)
      .map((e) => {
        if (e === null) return "null";
        if (e === void 0) return "undefined";
        if (typeof e == "object")
          try {
            return JSON.stringify(e);
          } catch {
            return String(e);
          }
        return String(e);
      })
      .join(" ");
  }
  function oe(i) {
    ne = i;
  }
  function Z() {
    return ne;
  }
  function r(...i) {
    if (ne) {
      console.log(...i);
      try {
        de?.("info", ...i);
      } catch {}
    }
  }
  function A(...i) {
    if (ne) {
      console.warn(...i);
      try {
        de?.("warn", ...i);
      } catch {}
    }
  }
  function ye(i, e) {
    if (!i) return { goals: [], reply: i };
    let t = new Set(e.map((c) => c.key)),
      s = [],
      n = i,
      o = i.match(/```json\s*([\s\S]*?)```/);
    if (o) {
      let c = Se(o[1].trim());
      if (c && c.goals && Array.isArray(c.goals))
        return (
          (s = c.goals.filter((d) => d.goal && d.value && t.has(d.goal))),
          (n = i.replace(o[0], "").trim()),
          { goals: s, reply: n }
        );
    }
    let u = i.match(/(\{[\s\S]*"goals"[\s\S]*\})\s*$/);
    if (u) {
      let c = Se(u[1].trim());
      if (c && c.goals && Array.isArray(c.goals))
        return (
          (s = c.goals.filter((d) => d.goal && d.value && t.has(d.goal))),
          (n = i.replace(u[1], "").trim()),
          { goals: s, reply: n }
        );
    }
    return { goals: [], reply: i };
  }
  var $ = null;
  async function ee() {
    let i = await chrome.storage.local.get(null);
    return (
      ($ = {
        modelConfig: i[L.MODEL_CONFIG] || ue.modelConfig,
        timeConfig: i[L.TIME_CONFIG] || ue.timeConfig,
        devMode: !!i[L.DEV_MODE],
        devNameFilter: i[L.DEV_NAME_FILTER] || "",
        goalConfigs: i[L.GOAL_CONFIGS] || [],
        goalReplyTemplates: i[L.GOAL_REPLY_TEMPLATES] || {},
        keywordRules: i[L.KEYWORD_RULES] || [],
        replyTaskSwitch: i[L.REPLY_TASK_SWITCH] || {},
        replyPositionConfigs: i[L.REPLY_POSITION_CONFIGS] || [],
        generalKnowledgeBase: i[L.GENERAL_KNOWLEDGE_BASE] || "",
        greetingConfigs: i[L.GREETING_CONFIGS] || [],
        jobConfigs: i[L.JOB_CONFIGS] || [],
        greetingTimeConfig: i[L.GREETING_TIME_CONFIG] || {},
        greetingTaskSwitch: i[L.GREETING_TASK_SWITCH] || {},
      }),
      $
    );
  }
  function re() {
    return $;
  }
  function ie() {
    let i = $?.timeConfig?.sendDelayRange || [3, 8];
    return w(i[0], i[1]);
  }
  function Ce() {
    return ($?.timeConfig?.replyWait || 60) * 1e3;
  }
  function be() {
    return ($?.timeConfig?.userIntervalSeconds || 30) * 1e3;
  }
  function fe() {
    return Math.min($?.timeConfig?.runDurationMinutes ?? 60, 60);
  }
  function Re() {
    return Math.max($?.timeConfig?.pauseDurationMinutes ?? 10, 5);
  }
  function De() {
    return Math.min($?.timeConfig?.maxRunDurationHours ?? 4, 4);
  }
  function Ae() {
    return $?.modelConfig?.maxHistoryRounds ?? 20;
  }
  function Ie() {
    return ($?.goalConfigs || []).filter((e) => e.enabled);
  }
  function _e(i, e) {
    let s = ($?.goalReplyTemplates || {})[i] || [];
    if (s.length === 0) return null;
    let n = s[w(0, s.length - 1)];
    return e && (n = n.replace("{value}", e)), n;
  }
  function Me() {
    return ($?.keywordRules || []).filter((e) => e.enabled !== !1);
  }
  // 岗位范围三态链（2026-09-02 拍板：岗位列表开关=打招呼+自动回复总开关，编辑页"定制回复"勾选已废）。
  // 与 service-worker/reply-scope.mjs 同规则的内联副本（本文件是经典脚本无法 import，改动须两边同步）：
  // jobConfigs 非空→白名单=启用的岗位（同名 rpc 仅借 autoReplyLimit 等设置）；全关→空（start() 判待机）；
  // jobConfigs 空→回退旧 rpc 白名单；皆空→start() 判全岗位兜底。
  function We() {
    let i = $?.jobConfigs || [];
    if (i.length > 0) {
      let e = $?.replyPositionConfigs || [];
      return i
        .filter((t) => t && t.enabled !== !1 && t.name)
        .map((t) => ({
          ...(e.find(
            (s) =>
              normalizeReplyPositionName(s?.name) ===
              normalizeReplyPositionName(t.name),
          ) || {}),
          name: t.name,
          enabled: !0,
        }));
    }
    return ($?.replyPositionConfigs || []).filter((e) => e.enabled !== !1);
  }
  function normalizeReplyPositionName(i) {
    return String(i || "")
      .normalize("NFKC")
      .replace(/\s+/g, "")
      .toLowerCase();
  }
  function xe(i) {
    if (!i) return null;
    let e = normalizeReplyPositionName(i);
    if (!e) return null;
    for (let t of We()) if (normalizeReplyPositionName(t.name) === e) return t;
    return null;
  }
  var j = SEL.chat;
  async function q(i, e = 1e4) {
    let t = Date.now();
    for (; Date.now() - t < e; ) {
      let s = document.querySelector(i);
      if (s && s.offsetParent !== null) return s;
      await m(300);
    }
    return document.querySelector(i);
  }
  async function F(i) {
    if (!i) throw new Error("humanClick: \u5143\u7D20\u4E0D\u5B58\u5728");
    await m(w(200, 500)),
      i.click(),
      i.dispatchEvent(
        new MouseEvent("mouseup", { bubbles: !0, cancelable: !0 }),
      );
  }
  async function Pe() {
    let i = await q(j.SIDEBAR_CHAT_LINK, 5e3);
    if (!i)
      throw new Error(
        "\u672A\u627E\u5230\u4FA7\u8FB9\u680F\u6C9F\u901A\u94FE\u63A5",
      );
    await F(i), await m(1e3);
  }
  async function Ne() {
    let i = await q('a[ka="menu-geek-recommend"]', 5e3);
    if (
      (i ||
        (r(
          "[DOM] \u4E3B\u9009\u62E9\u5668\u672A\u547D\u4E2D\uFF0C\u5C1D\u8BD5\u5907\u7528\u9009\u62E9\u5668...",
        ),
        (i = await q(
          'a[ka*="recommend"], a[href*="recommend"], .menu-recommend a, dl.menu-recommend dt a, [class*="menu-recommend"] a',
          3e3,
        ))),
      !i)
    ) {
      r(
        "[DOM] CSS \u9009\u62E9\u5668\u5747\u672A\u547D\u4E2D\uFF0C\u5C1D\u8BD5\u6587\u672C\u5339\u914D\u67E5\u627E...",
      );
      let e = document.querySelectorAll(
        'a, [role="button"], button, span, div, dt, dd, li',
      );
      for (let t of e)
        if (
          (t.textContent || t.innerText || "").trim() ===
            "\u63A8\u8350\u725B\u4EBA" &&
          (t.offsetParent !== null || t.getBoundingClientRect().width > 0)
        ) {
          i = t;
          break;
        }
    }
    if (!i) {
      r(
        "[DOM] \u7CBE\u786E\u6587\u672C\u5339\u914D\u672A\u547D\u4E2D\uFF0C\u5C1D\u8BD5\u5BBD\u6CDB\u5339\u914D...",
      );
      let e = document.querySelector(
        SEL.page.MENU,
      );
      if (e) {
        let t = e.querySelectorAll("*");
        for (let s of t)
          if (
            (s.textContent || s.innerText || "").trim() ===
              "\u63A8\u8350\u725B\u4EBA" &&
            (s.offsetParent !== null || s.getBoundingClientRect().width > 0)
          ) {
            i = s;
            break;
          }
      }
    }
    if (!i)
      throw new Error(
        '\u672A\u627E\u5230"\u63A8\u8350\u725B\u4EBA"\u83DC\u5355\u9879',
      );
    await F(i);
    for (let e = 0; e < 12; e++)
      if (
        (await m(500),
        /\/web\/(?:chat\/|geek\/)?recommend/.test(window.location.href))
      ) {
        r("[DOM] SPA \u5BFC\u822A\u6210\u529F"),
          (await q(
            ".recommend-list, .card-list, .candidate-list, .card-inner.common-wrap[data-geekid]",
            8e3,
          )) || (await m(3e3));
        return;
      }
    throw new Error(
      "SPA \u83DC\u5355\u5DF2\u70B9\u51FB\u4F46\u9875\u9762\u672A\u5207\u6362\u5230\u63A8\u8350\u9875",
    );
  }
  async function Le(i) {
    let e = `.chat-label-item[title="${i}"]`,
      t = await q(e, 5e3);
    t && (await F(t), await m(500));
  }
  async function V(i) {
    let e = j.userItem(i),
      t = await q(e, 5e3);
    if (!t)
      throw new Error(
        `\u7528\u6237 ${i} \u7684\u6D88\u606F\u5217\u8868\u9879\u672A\u627E\u5230`,
      );
    await F(t), await m(800);
  }
  async function ve(i, e, t = "") {
    if (!e) {
      try {
        await V(i);
      } catch (a) {
        console.warn(
          `[DOM] \u65E0\u59D3\u540D\u964D\u7EA7\u70B9\u51FB uid=${i} \u5931\u8D25:`,
          a.message,
        );
      }
      return !0;
    }
    console.log(
      `[DOM] \u{1F50D} \u5F00\u59CB\u59D3\u540D\u641C\u7D22: name="${e}", uid=${i}`,
    );
    let s = await q(j.NAME_SEARCH_BTN, 3e3);
    if (!s) {
      console.warn(
        "[DOM] \u59D3\u540D\u641C\u7D22\u6309\u94AE\u672A\u627E\u5230\uFF0C\u964D\u7EA7\u4E3A uid \u76F4\u63A5\u70B9\u51FB",
      );
      try {
        await V(i);
      } catch (a) {
        console.warn(
          `[DOM] \u6309\u94AE\u964D\u7EA7\u70B9\u51FB uid=${i} \u5931\u8D25:`,
          a.message,
        );
      }
      return !0;
    }
    if ((await F(s), !(await q(j.CHAT_JOB_SEARCH, 3e3)))) {
      console.warn("[DOM] \u641C\u7D22\u9762\u677F\u672A\u51FA\u73B0");
      try {
        await V(i);
      } catch (a) {
        console.warn(
          `[DOM] \u9762\u677F\u964D\u7EA7\u70B9\u51FB uid=${i} \u5931\u8D25:`,
          a.message,
        );
      }
      return !0;
    }
    console.log(
      "[DOM] \u641C\u7D22\u9762\u677F\u5DF2\u51FA\u73B0\uFF0C\u67E5\u627E\u8F93\u5165\u6846",
    );
    let o = await Je(5e3, 300);
    if (!o) {
      console.warn(
        "[DOM] \u59D3\u540D\u641C\u7D22\u8F93\u5165\u6846\u672A\u627E\u5230\uFF0C\u5173\u95ED\u641C\u7D22\u9762\u677F\u540E\u964D\u7EA7",
      ),
        await te();
      try {
        await V(i);
      } catch (a) {
        console.warn(
          `[DOM] \u8F93\u5165\u6846\u964D\u7EA7\u70B9\u51FB uid=${i} \u5931\u8D25:`,
          a.message,
        );
      }
      return !0;
    }
    console.log(
      "[DOM] \u59D3\u540D\u641C\u7D22\u8F93\u5165\u6846\u5DF2\u627E\u5230\uFF0C\u5F00\u59CB\u8F93\u5165\u59D3\u540D",
    ),
      await F(o),
      await m(w(300, 800)),
      await $e(e, o);
    let u = await q(j.NAME_SEARCH_RESULTS, 5e3);
    if (!u) {
      console.warn(
        "[DOM] \u641C\u7D22\u7ED3\u679C\u5BB9\u5668\u8D85\u65F6\u672A\u627E\u5230\uFF0C\u5173\u95ED\u641C\u7D22\u9762\u677F\u540E\u964D\u7EA7",
      ),
        await te();
      try {
        await V(i);
      } catch (a) {
        console.warn(
          `[DOM] \u964D\u7EA7\u70B9\u51FB uid=${i} \u4E5F\u5931\u8D25:`,
          a.message,
        );
      }
      return !0;
    }
    let c = u.querySelectorAll(SEL.page.RECOMMEND_LIST_ITEM);
    if (!c || c.length === 0)
      return (
        console.warn(
          `[DOM] \u59D3\u540D\u641C\u7D22 "${e}" \u65E0\u7ED3\u679C\uFF0C\u8DF3\u8FC7 uid=${i}`,
        ),
        r(
          `[DEV] \u{1F50D} \u641C\u7D22\u65E0\u7ED3\u679C: name="${e}", uid=${i}`,
        ),
        await te(),
        !1
      );
    console.log(
      `[DOM] \u59D3\u540D\u641C\u7D22\u627E\u5230 ${c.length} \u4E2A\u7ED3\u679C`,
    );
    let d = null;
    if (c.length > 1) {
      if (!t)
        return (
          console.warn(
            `[DOM] ${c.length}\u4E2A\u641C\u7D22\u7ED3\u679C\u4F46\u65E0\u5934\u50CF\u7F13\u5B58\uFF0C\u8DF3\u8FC7 uid=${i}`,
          ),
          r(
            `[DEV] \u{1F50D} \u591A\u7ED3\u679C\u65E0\u5934\u50CF: name="${e}", uid=${i}, \u7ED3\u679C\u6570=${c.length}`,
          ),
          await te(),
          !1
        );
      for (let a of c) {
        let l = a.querySelector(SEL.page.AVATAR);
        if (l) {
          let f = l.getAttribute("src") || "";
          if (
            f &&
            (f.includes(t.split("?")[0]) || t.includes(f.split("?")[0]))
          ) {
            (d = a),
              r(
                `[DEV] \u{1F50D} \u5934\u50CF\u5339\u914D\u6210\u529F: name="${e}", uid=${i}`,
              );
            break;
          }
        }
      }
      if (!d)
        return (
          console.warn(
            `[DOM] \u5934\u50CF\u5339\u914D\u5931\u8D25\uFF0C${c.length}\u4E2A\u7ED3\u679C\u4E2D\u65E0\u5339\u914D\u5934\u50CF\uFF0C\u8DF3\u8FC7 uid=${i}`,
          ),
          r(
            `[DEV] \u{1F50D} \u5934\u50CF\u5339\u914D\u5931\u8D25: name="${e}", uid=${i}, \u7ED3\u679C\u6570=${c.length}`,
          ),
          await te(),
          !1
        );
    } else d = c[0];
    await F(d), await m(w(800, 1500));
    try {
      await V(i);
    } catch (a) {
      console.warn(
        `[DOM] \u6839\u636E uid=${i} \u70B9\u51FB\u6D88\u606F\u9879\u5931\u8D25\uFF0C\u4F46\u641C\u7D22\u5DF2\u9009\u62E9\u8BE5\u7528\u6237`,
        a.message,
      );
    }
    return !0;
  }
  async function Ge(i, e, t = "") {
    try {
      return (
        await V(i),
        console.log(
          `[DOM] \u2705 \u6D88\u606F\u5217\u8868\u76F4\u63A5\u627E\u5230 uid=${i}\uFF0C\u65E0\u9700\u59D3\u540D\u641C\u7D22`,
        ),
        { found: !0 }
      );
    } catch (n) {
      console.log(
        `[DOM] \u6D88\u606F\u5217\u8868\u672A\u627E\u5230 uid=${i}\uFF08${n.message}\uFF09\uFF0C\u964D\u7EA7\u4E3A\u59D3\u540D\u641C\u7D22`,
      );
    }
    return e
      ? { found: await ve(i, e, t) }
      : (console.warn(
          `[DOM] \u59D3\u540D\u641C\u7D22\u964D\u7EA7\u5931\u8D25\uFF1Auid=${i} \u65E0\u59D3\u540D\u4FE1\u606F`,
        ),
        { found: !1 });
  }
  function Oe() {
    let i = document.querySelector(SEL.page.POSITION_NAME);
    return i ? i.textContent.trim() : null;
  }
  async function te() {
    try {
      let i =
        document.querySelector('use[href*="icon-search-close"]') ||
        document.querySelector('use[href*="search-close"]');
      if (!i) return;
      let e = i.closest(
        'button, a, [role="button"], .search-close, .clear-btn, [class*="close"], [class*="clear"]',
      );
      e ? await F(e) : await F(i), await m(w(200, 400));
    } catch (i) {
      console.warn(
        "[DOM] \u91CD\u7F6E\u641C\u7D22\u680F\u65F6\u51FA\u9519:",
        i.message,
      );
    }
  }
  async function Je(i = 5e3, e = 300) {
    let t = Date.now(),
      s = 0;
    for (; Date.now() - t < i; ) {
      s++;
      let n = document.querySelector(".chat-job-search");
      if (n) {
        let c = n.querySelector("input.search-input");
        if (c) return c;
        let d = n.querySelector('input, textarea, [contenteditable="true"]');
        if (d) return d;
      }
      let o = j.NAME_SEARCH_INPUT.split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      for (let c of o) {
        let d = document.querySelector(c);
        if (d && d.offsetParent !== null) return d;
      }
      let u = document.querySelectorAll('input:not([type="hidden"])');
      for (let c of u)
        if (c.offsetParent !== null && c.id !== "boss-chat-editor-input")
          return c;
      await m(e);
    }
    return (
      console.warn(
        `[DOM] \u641C\u7D22\u8F93\u5165\u6846\u8F6E\u8BE2\u8D85\u65F6(${s}\u6B21, ${i}ms), panel=${!!document.querySelector(".chat-job-search")}`,
      ),
      null
    );
  }
  async function $e(i, e) {
    if (!e)
      throw new Error(
        "simulateTyping: \u8F93\u5165\u6846\u5143\u7D20\u4E0D\u5B58\u5728",
      );
    e.focus();
    let t = (e.tagName || "").toLowerCase();
    if (t === "input" || t === "textarea")
      for (let n of i)
        (e.value += n),
          e.dispatchEvent(
            new InputEvent("input", {
              bubbles: !0,
              cancelable: !0,
              data: n,
              inputType: "insertText",
            }),
          ),
          await m(w(150, 400));
    else {
      let n = document.createRange();
      n.selectNodeContents(e), n.collapse(!1);
      let o = window.getSelection();
      o.removeAllRanges(), o.addRange(n);
      for (let u of i)
        document.execCommand("insertText", !1, u),
          e.dispatchEvent(
            new InputEvent("input", {
              bubbles: !0,
              cancelable: !0,
              data: u,
              inputType: "insertText",
            }),
          ),
          await m(w(150, 400));
    }
    e.dispatchEvent(new Event("change", { bubbles: !0 }));
  }
  async function Ke() {
    if (Z()) {
      r(
        "[DEV] \u{1F6AB} \u5F00\u53D1\u8005\u6A21\u5F0F: \u8DF3\u8FC7\u70B9\u51FB\u53D1\u9001\u6309\u94AE",
      );
      return;
    }
    let i = await q(j.SEND_BUTTON, 5e3);
    if (!i) throw new Error("\u672A\u627E\u5230\u53D1\u9001\u6309\u94AE");
    await m(w(100, 300)),
      i.click(),
      i.dispatchEvent(new MouseEvent("click", { bubbles: !0, cancelable: !0 })),
      await m(500);
  }
  async function He(i, e, t, s = {}) {
    let n = s.skipSearch === !0,
      o = s.avatar || "";
    if (t && !n) {
      if (!(await ve(i, t, o)))
        return (
          console.warn(
            `[DOM] \u59D3\u540D\u641C\u7D22\u672A\u627E\u5230 "${t}"(uid=${i})\uFF0C\u8DF3\u8FC7\u6D88\u606F\u53D1\u9001`,
          ),
          r(
            `[DEV] \u{1F4E4} \u53D1\u9001\u8DF3\u8FC7: uid=${i}, name="${t}", \u539F\u56E0: \u641C\u7D22\u5339\u914D\u5931\u8D25`,
          ),
          !1
        );
    } else await V(i);
    let u = await q(j.CHAT_INPUT, 5e3);
    if (!u) throw new Error("\u672A\u627E\u5230\u8F93\u5165\u6846");
    return (
      await $e(e, u),
      Z()
        ? (r(
            `[DEV] \u{1F4E4} \u5F00\u53D1\u8005\u6A21\u5F0F: \u8DF3\u8FC7\u53D1\u9001\u6309\u94AE\u70B9\u51FB\uFF0C\u6D88\u606F\u5185\u5BB9: "${e.slice(0, 100)}" (uid=${i})`,
          ),
          !0)
        : (await Ke(), !0)
    );
  }
  async function ke() {
    try {
      let i = await fetch(
        "https://www.zhipin.com/wapi/zprelation/friend/filterByLabel",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-requested-with": "XMLHttpRequest",
          },
          body: "labelId=1&encJobId=&sort=&scene=0",
        },
      );
      if (!i.ok) throw new Error(`HTTP ${i.status}`);
      let e = await i.json();
      if (e.code !== 0 || !e.zpData)
        throw new Error(`API \u8FD4\u56DE\u9519\u8BEF: ${e.message}`);
      return (e.zpData.result || []).map((s) => s.friendId).filter(Boolean);
    } catch (i) {
      return (
        console.error(
          "[API] \u83B7\u53D6\u65B0\u62DB\u547C\u5217\u8868\u5931\u8D25:",
          i,
        ),
        []
      );
    }
  }
  async function qe(i) {
    try {
      let e = [],
        t = 1,
        s = !0,
        n = 3,
        o = null,
        u = "";
      for (; s && t <= n; ) {
        let c = `https://www.zhipin.com/wapi/zpchat/boss/historyMsg?src=0&gid=${i}&maxMsgId=0&c=20&page=${t}`,
          d = await fetch(c, {
            method: "GET",
            credentials: "include",
            headers: { "x-requested-with": "XMLHttpRequest" },
          });
        if (!d.ok) throw new Error(`HTTP ${d.status}`);
        let a = await d.json();
        if (a.code !== 0 || !a.zpData)
          throw new Error(`API \u8FD4\u56DE\u9519\u8BEF: ${a.message}`);
        let l = a.zpData.messages || [];
        t === 1 &&
          l.length > 0 &&
          ((o = l[0]?.body?.resume || null),
          (u = l[0]?.from?.name || ""),
          o ||
            console.warn(
              `[API] \u65E0\u6CD5\u83B7\u53D6${u || i}\u7684\u4FE1\u606F\uFF0C\u8DF3\u8FC7\u5904\u7406`,
            )),
          e.push(...l),
          (s = a.zpData.hasMore === !0),
          t++,
          s && (await m(500));
      }
      return { messages: e, resume: o, candidateName: u };
    } catch (e) {
      return (
        console.error(
          `[API] \u83B7\u53D6\u7528\u6237 ${i} \u5386\u53F2\u6D88\u606F\u5931\u8D25:`,
          e,
        ),
        { messages: [], resume: null, candidateName: "" }
      );
    }
  }
  async function Ue() {
    let i = await fetch(
      "https://www.zhipin.com/wapi/zpjob/job/data/list?position=0&type=5&searchStr=&comId=&tagIdStr=&page=1",
      {
        method: "GET",
        credentials: "include",
        headers: { "x-requested-with": "XMLHttpRequest" },
      },
    );
    if (!i.ok) throw new Error(`HTTP ${i.status}`);
    let e = await i.json();
    if (e.code !== 0 || !e.zpData)
      throw new Error(`API \u8FD4\u56DE\u9519\u8BEF: ${e.message}`);
    let s = (e.zpData.data || [])
      .map((n) => n.positionName || n.jobName)
      .filter(Boolean);
    if (s.length === 0)
      throw new Error(
        "\u5DF2\u542F\u7528\u804C\u4F4D\u5217\u8868\u4E3A\u7A7A\uFF0C\u8BF7\u5148\u5728BOSS\u76F4\u8058\u53D1\u5E03\u804C\u4F4D",
      );
    return s;
  }
  var ae = class {
    constructor(e) {
      (this.sessionManager = e.sessionManager),
        (this.deduplicator = e.deduplicator),
        (this.onStatusReport = e.onStatusReport),
        (this.onSessionGoalAchieved = e.onSessionGoalAchieved),
        (this.onNewRecord = e.onNewRecord),
        (this.callLlmApi = e.callLlmApi),
        (this.state = E.IDLE),
        (this.userMessageQueues = new Map()),
        (this.lastMessageTime = new Map()),
        (this.processingFlags = new Map()),
        (this.newGreetingUserIds = new Set()),
        (this._achievedMapCache = new Map()),
        (this._userNameCache = new Map()),
        (this._userAvatarCache = new Map()),
        (this._userJobTitleCache = new Map()),
        (this._enabledJobNames = new Set()),
        (this._replyAllPositions = !1),
        (this._positionPlan = []),
        (this._positionPlanRunning = !1),
        (this._positionPlanProcessed = new Set()),
        (this._positionPlanConsecutiveFailures = 0),
        (this._runCycleStartTime = 0),
        (this._autoPauseTimer = null),
        (this._totalRunTimeMs = 0),
        (this._runSegmentStart = 0),
        (this._maxDurationPaused = !1),
        (this._loopTimer = null),
        (this._greetingTimer = null),
        (this._scopeNone = !1),
        (this._scopeSig = "");
    }
    getDebugState() {
      let e = [];
      for (let [t, s] of this.userMessageQueues)
        e.push({
          uid: t,
          queueLength: s.length,
          lastMessageTime: this.lastMessageTime.get(t) || 0,
          isProcessing: !!this.processingFlags.get(t),
          isNewGreeting: this.newGreetingUserIds.has(t),
          previews: s.slice(-3).map((n) => ({
            type: n.body?.type,
            text: (n.body?.text || "").slice(0, 60),
            time: n.time || 0,
            name: n.from?.name || "",
            avatar: (n.from?.avatar || "").slice(0, 60),
            jobTitle: n.body?.jobDesc?.title || "",
          })),
        });
      return {
        queues: e,
        state: this.state,
        replyMode: this._replyAllPositions ? "all" : "whitelist",
        enabledPositionNames: [...this._enabledJobNames],
      };
    }
    // 范围签名：模式首字母 + 启用岗位名序列，供配置热更判断范围是否真的变了（防无关保存重启计划）。
    _scopeSignature(s) {
      return (
        (s.length > 0 ? "W" : ($?.jobConfigs || []).length > 0 ? "N" : "A") +
        "|" +
        s.map((t) => t.name).join(",")
      );
    }
    // 范围装配（三态链，2026-09-02 拍板：岗位列表开关=总开关）：start() 与配置热更 refreshReplyScope() 共用。
    // 返回 false = 全岗位兜底拉取 BOSS 职位失败（已置 IDLE）。
    async _setupScope() {
      let s = We();
      this._scopeSig = this._scopeSignature(s);
      if (s.length > 0) {
        (this._scopeNone = !1),
          (this._replyAllPositions = !1),
          (this._positionPlan = s.map((n) => ({
            ...n,
            autoReplyLimit: Math.min(
              20,
              Math.max(1, Number(n.autoReplyLimit) || 5),
            ),
          }))),
          (this._positionPlanProcessed = new Set()),
          (this._positionPlanConsecutiveFailures = 0),
          (this._enabledJobNames = new Set(
            s.map((n) => n.name).filter(Boolean),
          )),
          r(
            `[Processor] \u767D\u540D\u5355\u6A21\u5F0F\uFF1A\u4EC5\u56DE\u590D ${s.length} \u4E2A\u5DF2\u542F\u7528\u5C97\u4F4D\u914D\u7F6E: [${[...this._enabledJobNames].join(", ")}]`,
          ),
          this._sendRunningLog(
            `\u{1F3AF} \u767D\u540D\u5355\u6A21\u5F0F\uFF1A\u4EC5\u56DE\u590D ${[...this._enabledJobNames].join("\u3001")}`,
          );
      } else if (($?.jobConfigs || []).length > 0) {
        // 岗位配置存在但全部关闭 → 待机：不扫描、不入队、不回任何岗位（消掉旧"全关=全回"悖论）。
        // 引擎保持 RUNNING 空转（页面零交互、不报 IDLE），编排器不会误判"意外停止"。
        (this._scopeNone = !0),
          (this._replyAllPositions = !1),
          (this._positionPlan = []),
          (this._positionPlanProcessed = new Set()),
          (this._positionPlanConsecutiveFailures = 0),
          (this._enabledJobNames = new Set()),
          r(
            "[Processor] 待机模式：所有岗位配置均已关闭，自动回复不处理任何岗位",
          ),
          this._sendRunningLog(
            "⚠️ 所有岗位配置均已关闭，自动回复待机中（不处理任何岗位）",
            "warn",
          );
      } else
        try {
          let n = await Ue();
          (this._scopeNone = !1),
            (this._replyAllPositions = !0),
            (this._enabledJobNames = new Set(n)),
            r(
              `[Processor] \u5168\u5C97\u4F4D\u6A21\u5F0F\uFF1A\u5DF2\u52A0\u8F7D ${n.length} \u4E2A BOSS \u5DF2\u53D1\u5E03\u804C\u4F4D: [${n.join(", ")}]`,
            ),
            this._sendRunningLog(
              `\u26A0\uFE0F \u5168\u5C97\u4F4D\u6A21\u5F0F\uFF1A\u6240\u6709\u5C97\u4F4D\u914D\u7F6E\u5747\u5DF2\u5173\u95ED\uFF0C\u5C06\u56DE\u590D BOSS \u6C9F\u901A\u4E2D\u7684\u6240\u6709\u5DF2\u53D1\u5E03\u5C97\u4F4D`,
            );
        } catch (n) {
          console.error(
            "[Processor] \u83B7\u53D6\u5DF2\u542F\u7528\u804C\u4F4D\u5217\u8868\u5931\u8D25:",
            n.message,
          ),
            this.onStatusReport(
              E.IDLE,
              `\u542F\u52A8\u5931\u8D25\uFF1A${n.message}`,
            ),
            (this.state = E.IDLE);
          return !1;
        }
      return !0;
    }
    _kickoffRun() {
      this._positionPlan.length > 0
        ? ((this._positionPlanRunning = !0),
          setTimeout(() => this._runPositionPlan(), 0))
        : this._scheduleNext();
    }
    // 配置热更（CS_CONFIG_UPDATED，审查 F2 修复）：运行/暂停中改岗位开关即时生效——
    // 全部关闭→即转待机（停扫描/拦入队/清队列）；待机中重开→即重建范围并恢复扫描。
    // 范围签名没变 → 直接返回（防无关配置保存重启岗位计划）。暂停中只重装不 kickoff（resume 接管；
    // 此时白名单暂失主动计划扫描、走被动回路，xe 门读最新 $ 范围仍正确，下次 start 恢复）。
    async refreshReplyScope() {
      if (this.state !== E.RUNNING && this.state !== E.PAUSED) return;
      let s = We();
      if (this._scopeSignature(s) === this._scopeSig) return;
      let e = this._scopeNone;
      this._loopTimer &&
        (clearTimeout(this._loopTimer), (this._loopTimer = null)),
        (this._positionPlanRunning = !1);
      if (!(await this._setupScope())) return;
      this._sendRunningLog(
        this._scopeNone
          ? "⚠️ 岗位开关已全部关闭，自动回复转入待机（不处理任何岗位）"
          : e
            ? "▶️ 岗位开关已重新开启，自动回复恢复运行"
            : "▶️ 岗位配置已变更，自动回复范围已刷新",
        "warn",
      ),
        this._scopeNone &&
          this.userMessageQueues.forEach((t) => (t.length = 0)),
        this.state === E.RUNNING && this._kickoffRun();
    }

    async start(e) {
      (this.state = E.RUNNING),
        this.onStatusReport(E.RUNNING, "\u542F\u52A8\u4E2D..."),
        r("[Processor] \u5F15\u64CE\u542F\u52A8"),
        await this._loadAchievedMaps();
      if (!(await this._setupScope())) return;
      this._positionPlan.length === 0 && (await this._refreshNewGreetings()),
        (this._runCycleStartTime = Date.now()),
        this._autoPauseTimer &&
          (clearTimeout(this._autoPauseTimer), (this._autoPauseTimer = null)),
        (this._totalRunTimeMs = 0),
        (this._runSegmentStart = Date.now()),
        (this._maxDurationPaused = !1);
      let t = fe();
      r(
        `[Processor] \u25B6\uFE0F \u8FD0\u884C\u5468\u671F\u542F\u52A8\uFF0C\u8FDE\u7EED\u8FD0\u884C\u65F6\u957F\u4E0A\u9650 ${t} \u5206\u949F`,
      ),
        this.onStatusReport(E.RUNNING, "\u8FD0\u884C\u4E2D");
      this._kickoffRun();
    }
    pause() {
      this._accumulateRunTime(),
        (this.state = E.PAUSED),
        this._autoPauseTimer &&
          (clearTimeout(this._autoPauseTimer),
          (this._autoPauseTimer = null),
          r(
            "[Processor] \u624B\u52A8\u6682\u505C\uFF0C\u5DF2\u53D6\u6D88\u81EA\u52A8\u6062\u590D\u5B9A\u65F6\u5668",
          )),
        this.onStatusReport(E.PAUSED, "\u5DF2\u6682\u505C");
    }
    resume() {
      this._maxDurationPaused
        ? ((this._maxDurationPaused = !1),
          (this._totalRunTimeMs = 0),
          (this._runSegmentStart = Date.now()),
          r(
            "[Processor] \u25B6\uFE0F \u5DF2\u624B\u52A8\u6062\u590D\u8FD0\u884C\uFF08\u6700\u5927\u65F6\u957F\u5DF2\u8FBE\u540E\u91CD\u7F6E\uFF09\uFF0C\u7D2F\u8BA1\u8FD0\u884C\u8BA1\u65F6\u5668\u5DF2\u91CD\u7F6E",
          ))
        : (this._accumulateRunTime(),
          (this._runSegmentStart = Date.now()),
          r(
            "[Processor] \u25B6\uFE0F \u5DF2\u6062\u590D\u8FD0\u884C\uFF0C\u8FD0\u884C\u5468\u671F\u8BA1\u65F6\u5668\u5DF2\u91CD\u7F6E",
          )),
        (this.state = E.RUNNING),
        this._autoPauseTimer &&
          (clearTimeout(this._autoPauseTimer), (this._autoPauseTimer = null)),
        (this._runCycleStartTime = Date.now()),
        this._positionPlanRunning || this._scheduleNext(),
        this.onStatusReport(E.RUNNING, "\u8FD0\u884C\u4E2D");
    }
    stop() {
      (this.state = E.IDLE),
        this._loopTimer &&
          (clearTimeout(this._loopTimer), (this._loopTimer = null)),
        this._greetingTimer &&
          (clearInterval(this._greetingTimer), (this._greetingTimer = null)),
        this.userMessageQueues.clear(),
        this.lastMessageTime.clear(),
        this.processingFlags.clear(),
        this.newGreetingUserIds.clear(),
        this._achievedMapCache.clear(),
        this._userNameCache.clear(),
        this._userAvatarCache.clear(),
        this._userJobTitleCache.clear(),
        (this._enabledJobNames = new Set()),
        (this._replyAllPositions = !1),
        (this._positionPlan = []),
        (this._positionPlanRunning = !1),
        (this._scopeNone = !1),
        (this._scopeSig = ""),
        this._positionPlanProcessed.clear(),
        (this._positionPlanConsecutiveFailures = 0),
        this.sessionManager.clearAll(),
        this.deduplicator.reset(),
        (this._runCycleStartTime = 0),
        this._autoPauseTimer &&
          (clearTimeout(this._autoPauseTimer), (this._autoPauseTimer = null)),
        (this._totalRunTimeMs = 0),
        (this._runSegmentStart = 0),
        (this._maxDurationPaused = !1),
        this.onStatusReport(E.IDLE, "\u5DF2\u505C\u6B62");
    }
    enqueueMessage(e) {
      if (this.state === E.IDLE || this._scopeNone) return;
      let t = e.from?.uid;
      if (!t) return;
      let s = e.body?.type;
      if (s !== 1 && s !== 8) return;
      let n = e.from?.avatar;
      n && this._userAvatarCache.set(t, n),
        !this.deduplicator.isDuplicate(e) &&
          (this.userMessageQueues.has(t) || this.userMessageQueues.set(t, []),
          this.userMessageQueues.get(t).push(e),
          this.lastMessageTime.set(t, e.time || Date.now()),
          r(
            `[Queue] \u{1F4E5} \u5165\u961F: uid=${t}, name="${e.from?.name || "\u672A\u77E5"}", type=${e.body?.type}, text="${(e.body?.text || "").slice(0, 60)}"`,
          ));
    }
    recordBossMessage(e) {
      let t = e.uid;
      t &&
        this.sessionManager.hasHistory(t) &&
        this.sessionManager.appendMessages(t, [
          {
            sender: "hr",
            content: e.content || "",
            time: e.time || Date.now(),
          },
        ]);
    }
    _scheduleNext() {
      this.state === E.RUNNING &&
        !this._scopeNone &&
        (this._loopTimer = setTimeout(() => this._processLoop(), we));
    }
    _accumulateRunTime() {
      this._runSegmentStart > 0 &&
        ((this._totalRunTimeMs += Date.now() - this._runSegmentStart),
        (this._runSegmentStart = 0));
    }
    _sendRunningLog(e, t = "info") {
      try {
        chrome.runtime
          .sendMessage({
            action: M.RUNNING_LOG,
            data: { taskType: "reply", level: t, message: e, time: Date.now() },
          })
          .catch(() => {});
      } catch {}
    }
    _isPositionPlanElementVisible(e) {
      if (!e || !e.isConnected) return !1;
      let t = e.getBoundingClientRect(),
        s = window.getComputedStyle(e);
      return (
        t.width > 0 &&
        t.height > 0 &&
        s.display !== "none" &&
        s.visibility !== "hidden" &&
        Number(s.opacity || 1) > 0
      );
    }
    _normalizePositionPlanText(e) {
      return String(e || "")
        .normalize("NFKC")
        .replace(/\s+/g, "")
        .toLowerCase();
    }
    _looksLikeRedUnreadBadge(e) {
      let t = String(e || "").match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)/i,
      );
      if (!t) return !1;
      let s = Number(t[1]),
        n = Number(t[2]),
        o = Number(t[3]);
      return s >= 180 && n <= 130 && o <= 130 && s > n * 1.35;
    }
    _hasPositionPlanUnreadMarker(e) {
      let t = e.querySelectorAll(
        SEL.page.UNREAD_BADGE,
      );
      for (let s of t) {
        if (!this._isPositionPlanElementVisible(s)) continue;
        let n = String(s.className || "").toLowerCase();
        if (n.includes("unread")) return !0;
        let o = s.getBoundingClientRect();
        if (o.width > 38 || o.height > 38) continue;
        let u = window.getComputedStyle(s),
          c = (s.textContent || "").trim(),
          d = c === "" || /^\d{1,3}$/.test(c);
        if (
          d &&
          (this._looksLikeRedUnreadBadge(u.backgroundColor) ||
            this._looksLikeRedUnreadBadge(u.color))
        )
          return !0;
      }
      return !1;
    }
    _getPositionPlanConversationRows() {
      let e = [
          'div[id^="_"]',
          ".user-list-item",
          ".friend-item",
          ".chat-user-item",
          '[class*="friend-item"]',
        ],
        t = new Set(),
        s = [];
      for (let n of e)
        for (let o of document.querySelectorAll(n)) {
          if (t.has(o) || !this._isPositionPlanElementVisible(o)) continue;
          let u = o.getBoundingClientRect(),
            c = o.id || "",
            d =
              /^_\d+-/.test(c) ||
              /(?:friend|user|geek|chat).*(?:item|card)|(?:item|card).*(?:friend|user|geek|chat)/i.test(
                String(o.className || ""),
              );
          if (
            !d ||
            u.height < 36 ||
            u.height > 180 ||
            u.width < 160 ||
            !this._hasPositionPlanUnreadMarker(o)
          )
            continue;
          t.add(o), s.push(o);
        }
      return s.sort(
        (n, o) =>
          n.getBoundingClientRect().top - o.getBoundingClientRect().top,
      );
    }
    _firstPositionPlanText(e, t) {
      for (let s of t)
        for (let n of e.querySelectorAll(s)) {
          if (!this._isPositionPlanElementVisible(n)) continue;
          let o = (n.textContent || "").replace(/\s+/g, " ").trim();
          if (o && o.length <= 160 && !/^\d{1,2}:\d{2}$/.test(o)) return o;
        }
      return "";
    }
    _getPositionPlanRowMeta(e) {
      let t = e.id || e.getAttribute("data-id") || "",
        s =
          t.match(/^_(\d+)-/) ||
          String(e.dataset?.uid || e.dataset?.geekId || "").match(/(\d+)/),
        n = this._firstPositionPlanText(e, [
          '[class*="name"]',
          ".title",
          '[class*="title"]',
          "strong",
          "h4",
          "h3",
        ]),
        o = this._firstPositionPlanText(e, [
          '[class*="position"]',
          '[class*="job"]',
          '[class*="sub-title"]',
          '[class*="subtitle"]',
        ]),
        u = this._firstPositionPlanText(e, [
          '[class*="last-msg"]',
          '[class*="last-message"]',
          '[class*="message-content"]',
          '[class*="message"]',
          '[class*="content"]',
          '[class*="text"]',
        ]),
        c = e.querySelector("img"),
        d = (e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 300);
      if (!u || u === n || u === o || u.includes(n + o)) {
        let a = (e.innerText || "")
          .split(/\n+/)
          .map((l) => l.trim())
          .filter(
            (l) =>
              l &&
              l !== n &&
              l !== o &&
              !/^\d{1,2}:\d{2}$/.test(l) &&
              !/^\d{1,3}$/.test(l),
          );
        u = a[a.length - 1] || "";
      }
      let a = s ? s[1] : "";
      return {
        uid: a ? Number(a) : null,
        name: n,
        position: o,
        preview: u,
        avatar: c?.getAttribute("src") || "",
        key: a || t || `${n}|${o}|${d.slice(0, 80)}`,
      };
    }
    _getPositionPlanRiskText() {
      let e = (document.body?.innerText || "").slice(0, 3e4);
      return (
        [
          "安全验证",
          "操作频繁",
          "访问过于频繁",
          "账号异常",
          "请完成验证",
        ].find((t) => e.includes(t)) || ""
      );
    }
    async _singlePositionPlanClick(e) {
      if (!this._isPositionPlanElementVisible(e))
        throw new Error("目标控件不存在或不可见");
      e.scrollIntoView({ block: "center", behavior: "auto" });
      await m(w(350, 700));
      for (; this._positionPlanRunning && this.state === E.PAUSED; )
        await m(500);
      if (!this._positionPlanRunning || this.state !== E.RUNNING) return !1;
      e.click();
      await m(w(600, 1e3));
      return !0;
    }
    _findChatPositionTrigger() {
      let e = [
          ".job-selecter-wrap .ui-dropmenu-label",
          ".chat-job-select .ui-dropmenu-label",
          ".chat-list-filter .ui-dropmenu-label",
          ".job-selecter-label",
          '[class*="job-select"] [class*="label"]',
          ".ui-dropmenu-label",
        ],
        t = [];
      for (let s of e)
        for (let n of document.querySelectorAll(s)) {
          if (!this._isPositionPlanElementVisible(n)) continue;
          let o = n.getBoundingClientRect(),
            u = (n.textContent || "").replace(/\s+/g, " ").trim();
          if (
            o.top > 420 ||
            o.left > window.innerWidth * 0.78 ||
            o.height < 18 ||
            o.height > 90 ||
            !u
          )
            continue;
          let c =
            u === "全部职位" ||
            this._positionPlan.some((d) => {
              let a = this._normalizePositionPlanText(d.name),
                l = this._normalizePositionPlanText(u);
              return a && (l.includes(a) || a.includes(l));
            });
          c && t.push(n);
        }
      return (
        t.sort((s, n) => {
          let o = s.getBoundingClientRect(),
            u = n.getBoundingClientRect();
          return o.width * o.height - u.width * u.height;
        })[0] || null
      );
    }
    async _setPositionSearchInput(e, t) {
      await this._singlePositionPlanClick(e);
      let s = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set,
        n = "";
      s ? s.call(e, "") : (e.value = ""),
        e.dispatchEvent(new Event("input", { bubbles: !0 }));
      for (let o of t) {
        for (; this._positionPlanRunning && this.state === E.PAUSED; )
          await m(500);
        if (!this._positionPlanRunning || this.state !== E.RUNNING) return;
        (n += o), s ? s.call(e, n) : (e.value = n),
          e.dispatchEvent(
            new InputEvent("input", {
              bubbles: !0,
              cancelable: !0,
              data: o,
              inputType: "insertText",
            }),
          ),
          await m(w(80, 180));
      }
      e.dispatchEvent(new Event("change", { bubbles: !0 }));
    }
    async _selectReplyPosition(e) {
      if (!/\/web\/chat/i.test(location.href))
        throw new Error("页面已离开 BOSS 沟通页");
      let t = this._getPositionPlanRiskText();
      if (t) throw new Error(`检测到“${t}”，任务已停止`);
      let s = this._findChatPositionTrigger();
      if (!s) throw new Error('未找到沟通列表的“全部职位”下拉框');
      this._sendRunningLog(`正在选择岗位：${e}`);
      if (!(await this._singlePositionPlanClick(s))) return !1;
      let n = null,
        o = Date.now();
      for (; Date.now() - o < 5e3; ) {
        n = Array.from(
          document.querySelectorAll(
            'input[placeholder*="职位名称"], .job-selecter-options input, input.chat-job-search',
          ),
        ).find((c) => this._isPositionPlanElementVisible(c));
        if (n) break;
        await m(250);
      }
      if (!n) throw new Error(`岗位“${e}”的搜索框未出现`);
      await this._setPositionSearchInput(n, e), await m(w(800, 1400));
      let u = Array.from(
          document.querySelectorAll(
            '.job-selecter-options .job-item, .job-selecter-options li, .job-selecter-options [role="option"], .ui-dropmenu-list .job-item, .ui-dropmenu-list [role="option"], .ui-dropmenu-list li',
          ),
        )
          .filter((c) => this._isPositionPlanElementVisible(c))
          .filter((c) => {
            let d = this._normalizePositionPlanText(c.textContent),
              a = this._normalizePositionPlanText(e);
            return d && a && d !== "全部职位" && d.includes(a);
          });
      if (u.length === 0) {
        let c = Array.from(
          document.querySelectorAll(
            ".job-selecter-options *, .ui-dropmenu-list *",
          ),
        )
          .filter((d) => this._isPositionPlanElementVisible(d))
          .filter((d) => {
            let a = (d.textContent || "").trim(),
              l = this._normalizePositionPlanText(a),
              f = this._normalizePositionPlanText(e);
            return a.length <= 180 && l.includes(f);
          });
        u = c;
      }
      if (u.length === 0) throw new Error(`下拉列表未找到岗位“${e}”`);
      u.sort((c, d) => {
        let a = (c.textContent || "").trim().length,
          l = (d.textContent || "").trim().length;
        return a - l;
      });
      let c = u[0].closest(
        '.job-item, li, [role="option"], [class*="job-item"], [class*="option"]',
      ) || u[0];
      if (!(await this._singlePositionPlanClick(c))) return !1;
      await m(w(1200, 2e3));
      let d = this._getPositionPlanRiskText();
      if (d) throw new Error(`检测到“${d}”，任务已停止`);
      let a = this._findChatPositionTrigger(),
        l = this._normalizePositionPlanText(a?.textContent),
        f = this._normalizePositionPlanText(e);
      if (!a || (!l.includes(f) && !f.includes(l)))
        throw new Error(`岗位“${e}”点击后未通过页面状态校验`);
      this._sendRunningLog(`已选择岗位：${e}`);
      return !0;
    }
    _extractVisibleCandidateMessage(e) {
      let t = [
          ".conversation-container .item-friend .text",
          '.conversation-container [class*="item-friend"] [class*="text"]',
          '.conversation-container [class*="friend-message"] [class*="text"]',
          '.conversation-container [class*="message-left"] [class*="text"]',
          '.conversation-container [class*="from-geek"] [class*="content"]',
          '.conversation-container [role="group"] [class*="text"]',
        ],
        s = [];
      for (let n of t)
        for (let o of document.querySelectorAll(n)) {
          if (
            !this._isPositionPlanElementVisible(o) ||
            o.closest(".conversation-editor")
          )
            continue;
          let u = (o.textContent || "").replace(/\s+/g, " ").trim();
          if (!u || u.length > 1200 || u === e.name || u === e.position)
            continue;
          s.push({ element: o, text: u });
        }
      s.sort(
        (n, o) =>
          n.element.getBoundingClientRect().top -
          o.element.getBoundingClientRect().top,
      );
      return s[s.length - 1]?.text || e.preview || "";
    }
    async _waitPositionPlan(e) {
      let t = Math.max(0, Number(e) || 0);
      for (; t > 0; ) {
        if (!this._positionPlanRunning || this.state === E.IDLE) return !1;
        if (this.state === E.PAUSED) {
          await m(500);
          continue;
        }
        let s = Math.min(500, t);
        await m(s), (t -= s);
      }
      return this._positionPlanRunning && this.state === E.RUNNING;
    }
    async _respectPositionPlanRunLimits() {
      let e = De(),
        t = this._getTotalRunTimeMs();
      if (e > 0 && t >= e * 60 * 60 * 1e3) {
        this._accumulateRunTime(),
          (this._maxDurationPaused = !0),
          (this.state = E.PAUSED),
          this.onStatusReport(
            E.PAUSED,
            "已达到单次运行最大时长限制，已自动暂停",
          );
        for (; this._positionPlanRunning && this.state === E.PAUSED; )
          await m(500);
        return this._positionPlanRunning && this.state === E.RUNNING;
      }
      let s = fe();
      if ((Date.now() - this._runCycleStartTime) / 6e4 >= s) {
        this._accumulateRunTime();
        let n = Re();
        (this.state = E.PAUSED),
          this.onStatusReport(
            E.PAUSED,
            `自动暂停中（${n} 分钟后恢复）`,
          ),
          this._sendRunningLog(
            `已连续运行 ${s} 分钟，暂停 ${n} 分钟后继续岗位任务`,
          ),
          (this._autoPauseTimer = setTimeout(() => {
            this.state === E.PAUSED && this.resume(),
              (this._autoPauseTimer = null);
          }, n * 60 * 1e3));
        for (; this._positionPlanRunning && this.state === E.PAUSED; )
          await m(500);
      }
      return this._positionPlanRunning && this.state === E.RUNNING;
    }
    async _processPositionPlanRow(e, t) {
      let s = this._getPositionPlanRowMeta(e),
        n = `${this._normalizePositionPlanText(t.name)}|${s.key}`;
      this._positionPlanProcessed.add(n);
      if (!s.uid) {
        this._sendRunningLog(
          `跳过未识别会话：无法读取候选人标识（岗位 ${t.name}）`,
          "warn",
        );
        return !1;
      }
      this.onStatusReport(
        E.RUNNING,
        `岗位 ${t.name}：正在处理 ${s.name || "候选人"}`,
      ),
        this._sendRunningLog(
          `正在打开 ${s.name || "候选人"}（岗位 ${t.name}）`,
        );
      if (!(await this._singlePositionPlanClick(e))) return !1;
      if (!(await this._waitPositionPlan(w(1200, 2e3)))) return !1;
      let o = this._getPositionPlanRiskText();
      if (o) throw new Error(`检测到“${o}”，任务已停止`);
      let u = "",
        c = Date.now();
      for (; Date.now() - c < 6e3; ) {
        u = Oe() || "";
        if (u) break;
        await m(300);
      }
      let d = this._normalizePositionPlanText(u),
        a = this._normalizePositionPlanText(t.name);
      if (!d || (!d.includes(a) && !a.includes(d))) {
        this._sendRunningLog(
          `跳过 ${s.name || "候选人"}：会话岗位“${u || "未识别"}”与当前岗位“${t.name}”不一致`,
          "warn",
        );
        return !1;
      }
      let l = this.userMessageQueues.get(s.uid);
      if (!l || l.length === 0) {
        let f = this._extractVisibleCandidateMessage(s);
        if (!f) {
          this._sendRunningLog(
            `跳过 ${s.name || "候选人"}：页面未识别到可回复的候选人消息`,
            "warn",
          );
          await this._handoffToCollector(s.uid, s.name);
          return !1;
        }
        l = [
          {
            from: { uid: s.uid, name: s.name || "", avatar: s.avatar || "" },
            body: { type: 1, text: f, jobDesc: { title: u } },
            time: Date.now() - Ce() - 1e3,
            __visibleDom: !0,
          },
        ];
        this.userMessageQueues.set(s.uid, l),
          this.lastMessageTime.set(s.uid, l[0].time);
      } else l.forEach((f) => (f.__visibleDom = !0));
      s.name && this._userNameCache.set(s.uid, s.name),
        s.avatar && this._userAvatarCache.set(s.uid, s.avatar),
        this.processingFlags.set(s.uid, !0);
      try {
        await this._processUser(s.uid);
      } finally {
        this.processingFlags.delete(s.uid);
      }
      await this._handoffToCollector(s.uid, s.name);
      return !0;
    }
    // 联动模式：回复处理完一条已开会话后，把「这人有简历吗」交给采集器在同一趟收掉（先回后收）。
    // 仅当采集器处于联动等喂（window.__kxCollectorDriven === true）时才真的等；否则立即放行，不拖慢回复。
    // 等 KX_COLLECT_DONE 设 45s 上限，超时放行——采集器卡死也绝不拖累回复循环。
    async _handoffToCollector(e, t) {
      try {
        if (window.__kxCollectorDriven !== true) return;
        let s = String(e || "");
        if (!s) return;
        window.postMessage(
          { source: "BOSS_PLUGIN_CS", type: "KX_COLLECT_CURRENT", geekId: s, name: t || "" },
          "*",
        );
        await new Promise((i) => {
          let n,
            r = (l) => {
              let d = l && l.data;
              d &&
                d.type === "KX_COLLECT_DONE" &&
                String(d.geekId) === s &&
                (clearTimeout(n), window.removeEventListener("message", r), i());
            };
          n = setTimeout(() => {
            window.removeEventListener("message", r), i();
          }, 45e3);
          window.addEventListener("message", r);
        });
      } catch (_) {}
    }
    async _runPositionPlan() {
      try {
        this._sendRunningLog(
          `岗位顺序任务已启动：共 ${this._positionPlan.length} 个岗位`,
        );
        for (let e = 0; e < this._positionPlan.length; e++) {
          if (!(await this._respectPositionPlanRunLimits())) return;
          let t = this._positionPlan[e],
            s = Math.min(20, Math.max(1, Number(t.autoReplyLimit) || 5)),
            n = 0;
          this.onStatusReport(
            E.RUNNING,
            `正在选择岗位 ${e + 1}/${this._positionPlan.length}：${t.name}`,
          ),
            this._sendRunningLog(
              `岗位 ${e + 1}/${this._positionPlan.length}：${t.name}，本轮最多 ${s} 人`,
            );
          try {
            if (!(await this._selectReplyPosition(t.name))) continue;
            this._positionPlanConsecutiveFailures = 0;
          } catch (o) {
            this._positionPlanConsecutiveFailures++;
            this._sendRunningLog(
              `岗位“${t.name}”选择失败：${o.message}，已跳过该岗位`,
              "error",
            );
            if (
              /安全验证|操作频繁|页面已离开/.test(o.message) ||
              this._positionPlanConsecutiveFailures >= 3
            )
              throw o;
            continue;
          }
          for (; n < s; ) {
            if (!(await this._respectPositionPlanRunLimits())) return;
            if (!/\/web\/chat/i.test(location.href))
              throw new Error("页面已离开 BOSS 沟通页");
            let o = this._getPositionPlanRiskText();
            if (o) throw new Error(`检测到“${o}”，任务已停止`);
            let u = this._getPositionPlanConversationRows().find(
              (c) => {
                let d = this._getPositionPlanRowMeta(c),
                  a = `${this._normalizePositionPlanText(t.name)}|${d.key}`;
                return (
                !this._positionPlanProcessed.has(
                    a,
                  )
                );
              },
            );
            if (!u) {
              this._sendRunningLog(
                `岗位“${t.name}”当前可见列表没有新的未读候选人`,
              );
              break;
            }
            try {
              (await this._processPositionPlanRow(u, t)) && n++,
                (this._positionPlanConsecutiveFailures = 0);
            } catch (c) {
              this._positionPlanConsecutiveFailures++;
              this._sendRunningLog(
                `岗位“${t.name}”处理会话失败：${c.message}`,
                "error",
              );
              if (
                /安全验证|操作频繁|页面已离开/.test(c.message) ||
                this._positionPlanConsecutiveFailures >= 3
              )
                throw c;
            }
            if (n >= s) break;
            let c = Math.min(3e5, Math.max(6e4, be())),
              d = Math.round(c / 1e3);
            this.onStatusReport(
              E.RUNNING,
              `岗位 ${t.name}：等待 ${d} 秒后处理下一位`,
            ),
              this._sendRunningLog(
                `等待 ${d} 秒后处理岗位“${t.name}”的下一位候选人`,
              );
            if (!(await this._waitPositionPlan(c))) return;
          }
          this._sendRunningLog(
            `岗位“${t.name}”本轮完成：已进入回复流程 ${n}/${s} 人`,
          );
          if (e < this._positionPlan.length - 1) {
            let o = w(5e3, 1e4);
            this.onStatusReport(
              E.RUNNING,
              `岗位 ${t.name} 已完成，稍后切换下一岗位`,
            );
            if (!(await this._waitPositionPlan(o))) return;
          }
        }
        if (this._positionPlanRunning && this.state !== E.IDLE) {
          (this._positionPlanRunning = !1),
            this._accumulateRunTime(),
            (this.state = E.IDLE),
            this.onStatusReport(E.IDLE, "所有岗位已按顺序处理完成"),
            this._sendRunningLog("所有岗位已按配置顺序处理完成");
        }
      } catch (e) {
        (this._positionPlanRunning = !1),
          this._accumulateRunTime(),
          (this.state = E.IDLE),
          this.onStatusReport(E.IDLE, `已停止：${e.message}`),
          this._sendRunningLog(`岗位顺序任务已停止：${e.message}`, "error");
      }
    }
    _getTotalRunTimeMs() {
      return (
        this._totalRunTimeMs +
        (this._runSegmentStart > 0 ? Date.now() - this._runSegmentStart : 0)
      );
    }
    async _processLoop() {
      if (this.state !== E.RUNNING) return;
      let e = Date.now(),
        t = Ce(),
        s = De(),
        n = this._getTotalRunTimeMs();
      if (s > 0 && n >= s * 60 * 60 * 1e3) {
        this._accumulateRunTime(),
          (this._maxDurationPaused = !0),
          (this.state = E.PAUSED),
          this.onStatusReport(
            E.PAUSED,
            "\u5DF2\u8FBE\u5230\u5355\u6B21\u8FD0\u884C\u6700\u5927\u65F6\u957F\u9650\u5236\uFF0C\u5DF2\u81EA\u52A8\u6682\u505C",
          ),
          r(
            `[Processor] \u23F8\uFE0F \u5355\u6B21\u4F1A\u8BDD\u7D2F\u8BA1\u8FD0\u884C ${(n / 6e4).toFixed(1)} \u5206\u949F\uFF0C\u8FBE\u5230\u6700\u5927\u65F6\u957F ${s} \u5C0F\u65F6\u9650\u5236\uFF0C\u5DF2\u6C38\u4E45\u6682\u505C`,
          ),
          this._autoPauseTimer &&
            (clearTimeout(this._autoPauseTimer), (this._autoPauseTimer = null));
        return;
      }
      let o = fe();
      if ((e - this._runCycleStartTime) / 6e4 >= o) {
        this._accumulateRunTime();
        let a = Re();
        (this.state = E.PAUSED),
          this.onStatusReport(
            E.PAUSED,
            `\u81EA\u52A8\u6682\u505C\u4E2D\uFF08${a} \u5206\u949F\u540E\u6062\u590D\uFF09`,
          ),
          r(
            `[Processor] \u23F8\uFE0F \u5DF2\u8FDE\u7EED\u8FD0\u884C ${o} \u5206\u949F\uFF0C\u8FBE\u5230\u5468\u671F\u4E0A\u9650\uFF0C\u6682\u505C ${a} \u5206\u949F`,
          ),
          (this._autoPauseTimer = setTimeout(
            () => {
              this.state === E.PAUSED && this.resume(),
                (this._autoPauseTimer = null);
            },
            a * 60 * 1e3,
          ));
        return;
      }
      let c = 0;
      for (let [, a] of this.userMessageQueues) a.length > 0 && c++;
      c === 0 &&
        (!this._lastEmptyLog || e - this._lastEmptyLog > 3e4) &&
        (r(
          "[Processor] \u7B49\u5F85\u65B0\u6D88\u606F\u4E2D... (\u961F\u5217\u4E3A\u7A7A)",
        ),
        (this._lastEmptyLog = e));
      let d = [...this.userMessageQueues.entries()]
        .filter(([, a]) => a.length > 0)
        .sort(
          (a, l) =>
            (this.lastMessageTime.get(l[0]) || 0) -
            (this.lastMessageTime.get(a[0]) || 0),
        );
      for (let [a, l] of d) {
        if (this.processingFlags.get(a)) continue;
        let f = this.lastMessageTime.get(a) || 0;
        if (e - f < t) {
          let p = Math.round((t - (e - f)) / 1e3);
          r(
            `[Processor] \u7B49\u5F85\u6700\u540E\u4E00\u6B21\u6D88\u606F\u540E\u95F4\u9694\u5269\u4F59 ${p}s\uFF08\u5171 ${t / 1e3}s\uFF09\uFF0C\u8DF3\u8FC7\u672C\u8F6E uid=${a}`,
          );
          continue;
        }
        this.processingFlags.set(a, !0);
        try {
          await this._processUser(a);
        } catch (p) {
          console.error(
            `[Processor] \u5904\u7406\u7528\u6237 ${a} \u51FA\u9519:`,
            p,
          );
          let b = this.userMessageQueues.get(a);
          b && (b.length = 0);
        } finally {
          this.processingFlags.delete(a);
        }
        let _ = be(),
          h = (_ / 1e3).toFixed(0),
          S = this._userNameCache.get(a) || a;
        if (
          (this._sendRunningLog(
            `\u23F3 \u7B49\u5F85 ${h} \u79D2\u540E\u5904\u7406\u4E0B\u4E00\u4E2A\u5019\u9009\u4EBA\uFF08\u62DF\u4EBA\u95F4\u9694 - \u7528\u6237\u5904\u7406\u95F4\u9694 ${h} \u79D2\uFF09`,
          ),
          r(
            `[Processor] \u7528\u6237\u95F4\u5904\u7406\u95F4\u9694: \u7B49\u5F85 ${h}s`,
          ),
          await m(_),
          this.state !== E.RUNNING)
        )
          break;
      }
      this._scheduleNext();
    }
    async _processUser(e) {
      let t = this.userMessageQueues.get(e);
      if (!t || t.length === 0) return;
      r(
        `[Processor] \u5904\u7406\u5019\u9009\u4EBA ${e}, \u961F\u5217\u6D88\u606F\u6570: ${t.length}`,
      );
      let s = re(),
        n = (s?.devMode && s?.devNameFilter?.trim()) || "";
      if (n) {
        let y = t[0]?.from?.name;
        if (!y) {
          r(
            `[Processor] \u23ED\uFE0F \u8DF3\u8FC7 uid=${e}: \u540D\u5B57\u8FC7\u6EE4\u5668 "${n}" \u5DF2\u542F\u7528\uFF0C\u4F46\u6D88\u606F\u4E2D\u7F3A\u5C11\u540D\u5B57\u4FE1\u606F`,
          ),
            (t.length = 0);
          return;
        }
        if (y !== n) {
          r(
            `[Processor] \u23ED\uFE0F \u8DF3\u8FC7 uid=${e} name="${y}": \u540D\u5B57\u8FC7\u6EE4\u5668 "${n}" \u5DF2\u542F\u7528`,
          ),
            (t.length = 0);
          return;
        }
        r(
          `[Processor] \u2705 \u540D\u5B57\u5339\u914D: "${y}" === "${n}"\uFF0C\u7EE7\u7EED\u5904\u7406`,
        );
      }
      let o = [...t],
        u = o[0]?.from?.name || "",
        positionPlanVisibleConversation = o.some(
          (y) => y.__visibleDom === !0,
        );
      u && this._userNameCache.set(e, u);
      let c = o[0]?.from?.avatar || "";
      c && !this._userAvatarCache.has(e) && this._userAvatarCache.set(e, c);
      for (let y of o)
        r(
          `[Queue] \u{1F4E4} \u51FA\u961F: uid=${e}, name="${y.from?.name || "\u672A\u77E5"}", type=${y.body?.type}, text="${(y.body?.text || "").slice(0, 60)}"`,
        );
      this._sendRunningLog(`\u{1F4E9} \u6536\u5230 ${u} \u7684\u6D88\u606F`);
      let d = this._userNameCache.get(e) || "",
        a = this._userAvatarCache.get(e) || "";
      if (
        !positionPlanVisibleConversation &&
        !(await Ge(e, d, a)).found
      ) {
        r(
          `[DEV] \u23ED\uFE0F \u8DF3\u8FC7 uid=${e}: \u65E0\u6CD5\u5728\u6D88\u606F\u5217\u8868\u4E2D\u5B9A\u4F4D\u8BE5\u7528\u6237`,
        ),
          (t.length = 0);
        return;
      }
      let f = Oe();
      if (!f) {
        r(
          `[DEV] \u23ED\uFE0F \u8DF3\u8FC7 uid=${e}: \u65E0\u6CD5\u4ECE\u804A\u5929\u6846\u83B7\u53D6\u804C\u4F4D\u540D\u79F0`,
        ),
          (t.length = 0);
        return;
      }
      let h = xe(f);
      if (this._replyAllPositions) {
        if (
          ![...this._enabledJobNames].some(
            (y) =>
              normalizeReplyPositionName(f).includes(
                normalizeReplyPositionName(y),
              ) ||
              normalizeReplyPositionName(y).includes(
                normalizeReplyPositionName(f),
              ),
          )
        ) {
          r(
            `[DEV] \u{1F6AB} \u5168\u5C97\u4F4D\u6A21\u5F0F\u804C\u4F4D\u8FC7\u6EE4: uid=${e}, position="${f}" \u4E0D\u5728 BOSS \u5DF2\u53D1\u5E03\u804C\u4F4D\u4E2D`,
          ),
            (t.length = 0);
          return;
        }
        h = null;
      } else if (!h) {
        r(
          `[DEV] \u{1F6AB} \u767D\u540D\u5355\u8FC7\u6EE4: uid=${e}, position="${f}" \u672A\u5339\u914D\u4EFB\u4F55\u5DF2\u542F\u7528\u5C97\u4F4D\u914D\u7F6E`,
        ),
          this._sendRunningLog(
            `\u23ED\uFE0F \u8DF3\u8FC7 ${u || "\u5019\u9009\u4EBA"}\uFF1A\u5C97\u4F4D\u300C${f}\u300D\u672A\u542F\u7528`,
          ),
          (t.length = 0);
        return;
      }
      r(
        `[DEV] \u2705 \u804C\u4F4D\u5339\u914D: uid=${e}, position="${f}", mode=${this._replyAllPositions ? "all" : "whitelist"}`,
      ),
        this._userJobTitleCache.set(e, f);
      let S =
        o.some((y) => y.body?.type === 8) || this.newGreetingUserIds.has(e);
      if (this.sessionManager.hasHistory(e))
        this.sessionManager.appendMessages(e, o);
      else if (S || positionPlanVisibleConversation)
        this.sessionManager.buildInitialHistory(e, o);
      else {
        r(
          `[Processor] \u7528\u6237 ${e} \u65E0\u5386\u53F2\u8BB0\u5F55\uFF0C\u5C1D\u8BD5\u4ECE API \u83B7\u53D6\u5386\u53F2\u6D88\u606F...`,
        );
        let y = await qe(e);
        y && y.messages && y.messages.length > 0 && this.sessionManager.buildFromApi(e, y.messages);
      }
      S && this.newGreetingUserIds.delete(e);
      let p = Ie(),
        b = this._getAchievedMap(e);
      // ── 重设计判断门：读信息条 → 规则匹配岗位 → LLM 判断是否打招呼 → 发该岗位静态话术 ──
      let brief = this._extractCandidateBrief();
      let matchedJob = this._matchJobByRules(f, brief);
      if (!matchedJob) {
        this._sendRunningLog(`⏭️ 跳过 ${u || "候选人"}：岗位「${f}」条件不符或无匹配岗位`),
          await this._upsertRecord(e, o, b, p, f),
          (t.length = 0);
        return;
      }
      let verdict = await this._judgeShouldReply(e, o, brief, matchedJob);
      if (!verdict.shouldReply) {
        this._sendRunningLog(`⏭️ 跳过 ${u || "候选人"}：${verdict.reason || "判定为非打招呼/冗余"}`),
          await this._upsertRecord(e, o, b, p, f),
          (t.length = 0);
        return;
      }
      let replies = (Array.isArray(matchedJob.job.replyMessages) ? matchedJob.job.replyMessages : [])
        .map((rm) => String(rm || "").trim())
        .filter(Boolean);
      if (replies.length === 0) {
        this._sendRunningLog(`⏭️ 跳过 ${u || "候选人"}：岗位「${matchedJob.job.jobName || f}」未配置回复话术`),
          await this._upsertRecord(e, o, b, p, f),
          (t.length = 0);
        return;
      }
      for (let si = 0; si < replies.length; si++)
        await this._sendAndLog(e, replies[si], "hr"),
          si < replies.length - 1 && (await m(ie() * 1e3));
      this._sendRunningLog(`📤 自动回复 → ${u || "候选人"}：岗位「${matchedJob.job.jobName || f}」${replies.length} 条话术`),
        await this._upsertRecord(e, o, b, p, f);
      // Ph3：MQTT 实时回复成功后落 per-uid 幂等锁，供"扫积压"侧去重（两路同门）
      try {
        chrome.storage.local.get("replyIdemLocks").then((s) => {
          let L = s.replyIdemLocks || {};
          L[String(e)] = Date.now();
          chrome.storage.local.set({ replyIdemLocks: L }).catch(() => {});
        }).catch(() => {});
      } catch (_) {}
      (t.length = 0),
        this._sendRunningLog(
          `\u2705 \u5DF2\u5B8C\u6210 ${u} \u7684\u6C9F\u901A\u8BB0\u5F55`,
        );
    }
    async _sendAndLog(e, t, s = "hr") {
      if (this.state !== E.RUNNING) return;
      let n = this._userNameCache.get(e) || "",
        o = ie() * 1e3,
        u = (o / 1e3).toFixed(1);
      if (
        (this._sendRunningLog(
          `\u23F3 \u7B49\u5F85 ${u} \u79D2\u540E\u53D1\u9001\u6D88\u606F\uFF08\u53D1\u9001\u5EF6\u8FDF - \u6BCF\u79D2 ${u} \u79D2\uFF09`,
        ),
        r(
          `[Processor] \u53D1\u9001\u5EF6\u8FDF: \u7B49\u5F85 ${u}s \u540E\u53D1\u9001 "${t.slice(0, 40)}" \u7ED9 ${n}`,
        ),
        await m(o),
        this.state !== E.RUNNING)
      )
        return;
      let c = this._userAvatarCache.get(e) || "";
      await He(e, t, n, { avatar: c, skipSearch: !0 });
    }
    _splitReply(e) {
      return e
        ? e.includes("<!--SPLIT-->")
          ? e
              .split("<!--SPLIT-->")
              .map((t) => t.trim())
              .filter(Boolean)
          : [e]
        : [""];
    }
    _getLastCandidateText(e) {
      for (let t = e.length - 1; t >= 0; t--) {
        let s = e[t]?.body?.text;
        if (s) return s;
      }
      return null;
    }
    // ── 重设计：读取会话顶部候选人信息条（性别/年龄/工作年限/学历/沟通职位），读不到则为空 ──
    _extractCandidateBrief() {
      let position = "";
      try { position = (document.querySelector(SEL.page.POSITION_NAME) || {}).textContent?.trim() || Oe() || ""; }
      catch (_) { position = Oe() || ""; }
      let root =
        document.querySelector(".conversation-container") ||
        document.querySelector(".chat-conversation") ||
        document.querySelector("[class*='conversation']") ||
        document.body;
      let text = "";
      try { text = ((root && root.innerText) || "").replace(/\s+/g, " ").slice(0, 800); } catch (_) {}
      let name = "";
      try { name = ((root && root.querySelector(SEL.page.CONVERSATION_NAME) || {}).textContent || "").trim(); } catch (_) {}
      let age = null, years = null, education = "", gender = "";
      let ma = text.match(/(\d{2})\s*岁/); if (ma) age = parseInt(ma[1], 10);
      let my = text.match(/(\d{1,2})\s*年(?!\s*龄)/); if (my) years = parseInt(my[1], 10);
      let me = text.match(/(博士|硕士|研究生|MBA|EMBA|本科|大专|专科|高中|中专|初中)/); if (me) education = me[1];
      let gt = name + " " + text.slice(0, 40);
      if (/女士|小姐/.test(gt)) gender = "女";
      else if (/先生/.test(gt)) gender = "男";
      return { gender, age, years, education, position, raw: text };
    }
    // ── 重设计：按沟通职位定位岗位配置（读不到则用默认兜底岗位），再比对 bossFilters 条件；读到的值违反条件才判不符 ──
    _matchJobByRules(position, brief) {
      let all = (re()?.greetingConfigs || []).filter((c) => c && c.jobName);
      if (!all.length) return null;
      let np = normalizeReplyPositionName(position);
      let job = all.find((c) => {
        let nj = normalizeReplyPositionName(c.jobName);
        return nj && np && (np.includes(nj) || nj.includes(np));
      });
      if (!job) job = all.find((c) => c.isDefault === true) || null;
      if (!job) return null;
      let filters = Array.isArray(job.bossFilters) ? job.bossFilters : [];
      for (let flt of filters) {
        let nm = flt && flt.name;
        let vals = (Array.isArray(flt.values) ? flt.values : [flt.values]).filter((v) => v != null && v !== "");
        if (!nm || !vals.length) continue;
        if (nm === "年龄" && brief && brief.age != null) {
          let mm = String(vals[0]).match(/(\d+)\s*-\s*(\d+)/);
          if (mm && (brief.age < +mm[1] || brief.age > +mm[2])) return null;
        } else if (/学历/.test(nm) && brief && brief.education) {
          let order = ["初中", "中专", "高中", "大专", "专科", "本科", "研究生", "硕士", "MBA", "EMBA", "博士"];
          let rank = (x) => { let i = order.indexOf(String(x).replace("要求", "")); return i < 0 ? 0 : i; };
          let needs = vals.map((v) => rank(v)).filter((rv) => rv > 0);
          if (needs.length && rank(brief.education) < Math.min(...needs)) return null;
        } else if (/性别/.test(nm) && brief && brief.gender) {
          if (!vals.some((v) => String(v).includes(brief.gender))) return null;
        }
      }
      return { job };
    }
    // ── 重设计：LLM 判断候选人最新消息是否为“主动打招呼/值得回复”。返回 { shouldReply, isResume, reason } ──
    async _judgeShouldReply(uid, msgs, brief, jobWrap) {
      if (msgs.some((x) => x.body?.type === 8)) return { shouldReply: false, isResume: true, reason: "简历/附件请求，转采集" };
      let lastText = this._getLastCandidateText(msgs) || "";
      if (!lastText) return { shouldReply: false, reason: "无候选人文本消息" };
      let job = jobWrap && jobWrap.job;
      let sys = "你是招聘助手消息分类器。判断候选人发来的最新消息是否属于“候选人主动打招呼/咨询，值得 HR 回复”。只输出 JSON：{\"reply\":true或false,\"reason\":\"≤15字\"}。判 false：HR 自己发的；候选人仅应答/确认（好的/谢谢/嗯/OK）；系统通知/广告；空或无意义。判 true：主动打招呼、自我介绍、询问岗位、表达兴趣、提出实质问题。";
      let usr = `岗位：${(job && job.jobName) || brief.position || "未知"}\n候选人最新消息：${lastText.slice(0, 500)}`;
      try {
        let rr = await this.callLlmApi([{ role: "system", content: sys }, { role: "user", content: usr }], [], {}, {});
        if (!rr || rr.success === false) return { shouldReply: true, reason: "判断失败，默认回复" };
        let mm = String(rr.content || "").match(/\{[\s\S]*\}/);
        let obj = mm ? JSON.parse(mm[0]) : {};
        return { shouldReply: obj.reply !== false, reason: obj.reason || "" };
      } catch (e2) {
        return { shouldReply: true, reason: "判断异常，默认回复" };
      }
    }
    _getAchievedMap(e) {
      return (
        this._achievedMapCache.has(e) || this._achievedMapCache.set(e, {}),
        this._achievedMapCache.get(e)
      );
    }
    _persistAchievedMap(e, t) {
      let s = `${L.SESSION_GOALS_PREFIX}${e}`;
      chrome.storage.local.set({ [s]: t }).catch((n) => {
        n.message?.includes("Extension context invalidated") ||
          console.error(
            "[Processor] \u6301\u4E45\u5316 session_goals \u5931\u8D25:",
            n,
          );
      });
    }
    async _upsertRecord(e, t, s, n, o) {
      let u = t[0]?.from?.name || "\u672A\u77E5";
      this.onNewRecord({
        id: String(e),
        name: u,
        positionName: o || "",
        goalResults: { ...s },
        completeTime: new Date().toISOString(),
      }),
        r(
          `[Processor] \u6C9F\u901A\u8BB0\u5F55\u5DF2\u5199\u5165: uid=${e}, name=${u}, position=${o}`,
        );
    }
    async _loadAchievedMaps() {
      try {
        let e = await chrome.storage.local.get(null);
        for (let [t, s] of Object.entries(e))
          if (
            t.startsWith(L.SESSION_GOALS_PREFIX) &&
            s &&
            typeof s == "object"
          ) {
            let n = t.slice(L.SESSION_GOALS_PREFIX.length);
            this._achievedMapCache.set(Number(n), s);
          }
        this._achievedMapCache.size > 0 &&
          r(
            `[Processor] \u5DF2\u52A0\u8F7D ${this._achievedMapCache.size} \u4E2A\u4F1A\u8BDD\u7684\u76EE\u6807\u72B6\u6001`,
          );
      } catch (e) {
        if (e.message?.includes("Extension context invalidated")) return;
        console.error(
          "[Processor] \u52A0\u8F7D\u4F1A\u8BDD\u76EE\u6807\u72B6\u6001\u5931\u8D25:",
          e,
        );
      }
    }
    clearSessionGoals(e) {
      this._achievedMapCache.delete(e);
      let t = `${L.SESSION_GOALS_PREFIX}${e}`;
      chrome.storage.local.remove(t).catch(() => {}),
        r(
          `[Processor] \u5DF2\u6E05\u7A7A uid=${e} \u7684\u4F1A\u8BDD\u76EE\u6807\u72B6\u6001`,
        );
    }
    async _refreshNewGreetings() {
      try {
        let e = await ke();
        r(
          `[Processor] \u5237\u65B0\u65B0\u62DB\u547C\u5217\u8868: ${e.length} \u4E2A\u65B0\u5019\u9009\u4EBA [${e.join(", ")}]`,
        ),
          e.forEach((t) => this.newGreetingUserIds.add(t));
      } catch (e) {
        console.error(
          "[Processor] \u5237\u65B0\u65B0\u62DB\u547C\u5217\u8868\u5931\u8D25:",
          e,
        );
      }
    }
  };
  var Be = null;
  function Fe(i) {
    Be = i;
  }
  var Ye =
      "\u60A8\u597D\uFF0C\u65B9\u4FBF\u4E86\u89E3\u4E00\u4E0B\u673A\u4F1A\u5417\uFF1F",
    C = SEL.card,
    K = class {
      constructor(e = {}) {
        (this.state = E.IDLE),
          (this._pauseRequested = !1),
          (this._stopRequested = !1),
          (this._onStatusReport = e.onStatusReport || (() => {})),
          (this._onNewRecord = e.onNewRecord || (() => {})),
          (this._onLog = e.onLog || (() => {})),
          (this._getCapturedResumeData = e.getCapturedResumeData || Be),
          (this._seenCandidates = new Set()),
          (this._jobQueue = []),
          (this._currentJobIndex = 0),
          (this._currentJobConfig = null),
          (this._greetIntervalMs = 15e3),
          (this._userIntervalMs = 3e4),
          (this._consecutiveFailures = 0),
          (this._maxFailures = 5),
          (this._totalRunTimeMs = 0),
          (this._runSegmentStart = 0),
          (this._maxDurationPaused = !1),
          (this._greetingTimeConfig = {}),
          (this._skipRequested = !1),
          (this._runCycleStartTime = 0),
          (this._autoPauseTimer = null),
          (this._autoPaused = !1);
      }
      async start(e) {
        if (this.state !== E.IDLE) {
          r(
            "[GreetingProcessor] \u5DF2\u5728\u8FD0\u884C\uFF0C\u8DF3\u8FC7\u542F\u52A8",
          );
          return;
        }
        r("[GreetingProcessor] \u542F\u52A8\u6253\u62DB\u547C..."),
          (this.state = E.RUNNING),
          (this._pauseRequested = !1),
          (this._stopRequested = !1),
          (this._skipRequested = !1),
          (this._seenCandidates = new Set()),
          (this._consecutiveFailures = 0);
        let t = e.greetingTimeConfig || {};
        if (
          ((this._greetingTimeConfig = t),
          (this._greetIntervalMs = (t.greetIntervalSeconds ?? 120) * 1e3),
          (this._userIntervalMs = (t.userIntervalSeconds ?? 60) * 1e3),
          (this._totalRunTimeMs = 0),
          (this._runSegmentStart = Date.now()),
          (this._maxDurationPaused = !1),
          (this._runCycleStartTime = Date.now()),
          (this._autoPaused = !1),
          this._autoPauseTimer &&
            (clearTimeout(this._autoPauseTimer), (this._autoPauseTimer = null)),
          (this._jobQueue = this._buildJobQueue(e)),
          this._jobQueue.length === 0)
        ) {
          A(
            "[GreetingProcessor] \u6CA1\u6709\u53EF\u5904\u7406\u7684\u5C97\u4F4D",
          ),
            this._sendRunningLog(
              "\u26A0\uFE0F \u65E0\u53EF\u7528\u5C97\u4F4D\u914D\u7F6E\uFF0C\u8BF7\u5148\u914D\u7F6E\u9700\u8981\u6253\u62DB\u547C\u7684\u5C97\u4F4D\u548C\u8BDD\u672F",
            ),
            this._emitStatus(
              E.IDLE,
              "\u65E0\u53EF\u7528\u5C97\u4F4D\u914D\u7F6E",
            ),
            (this.state = E.IDLE);
          return;
        }
        for (
          this._emitStatus(
            E.RUNNING,
            "\u5F00\u59CB\u5904\u7406\u5C97\u4F4D\u961F\u5217",
          ),
            this._currentJobIndex = 0;
          this._currentJobIndex < this._jobQueue.length && !this._stopRequested;
          this._currentJobIndex++
        ) {
          if (this._skipRequested) {
            (this._skipRequested = !1),
              this._sendRunningLog(
                `\u23ED\uFE0F \u5DF2\u8DF3\u8FC7\u5C97\u4F4D: ${this._currentJobConfig?.jobName || "\u672A\u77E5"}`,
              ),
              r(
                `[GreetingProcessor] \u8DF3\u8FC7\u5C97\u4F4D: ${this._currentJobConfig?.jobName || "\u672A\u77E5"}`,
              );
            continue;
          }
          if (
            (this._pauseRequested &&
              (await this._waitWhilePaused(), this._stopRequested)) ||
            ((this._currentJobConfig = this._jobQueue[this._currentJobIndex]),
            this._sendRunningLog(
              `\u{1F4CB} \u6B63\u5728\u5904\u7406\u5C97\u4F4D: ${this._currentJobConfig.jobName}`,
            ),
            r(
              `[GreetingProcessor] \u5F00\u59CB\u5904\u7406\u5C97\u4F4D ${this._currentJobIndex + 1}/${this._jobQueue.length}: "${this._currentJobConfig.jobName}"`,
            ),
            await this._processJob(this._currentJobConfig),
            this._checkAndHandleTimeLimits() &&
              (this._stopRequested ||
                (await this._waitWhilePaused(), this._stopRequested)))
          )
            break;
        }
        this._stopRequested
          ? ((this.state = E.IDLE),
            this._emitStatus(E.IDLE, "\u5DF2\u505C\u6B62"))
          : ((this.state = E.IDLE),
            this._emitStatus(
              E.IDLE,
              "\u6240\u6709\u5C97\u4F4D\u5904\u7406\u5B8C\u6210",
            )),
          r("[GreetingProcessor] \u6253\u62DB\u547C\u6D41\u7A0B\u7ED3\u675F");
      }
      pause(e = "\u7528\u6237\u624B\u52A8\u6682\u505C") {
        this.state === E.RUNNING &&
          (this._accumulateRunTime(),
          this._autoPauseTimer &&
            (clearTimeout(this._autoPauseTimer),
            (this._autoPauseTimer = null),
            (e =
              e +
              "\uFF08\u5DF2\u53D6\u6D88\u81EA\u52A8\u6062\u590D\u5B9A\u65F6\u5668\uFF09"),
            r(
              "[GreetingProcessor] \u624B\u52A8\u6682\u505C\uFF0C\u5DF2\u53D6\u6D88\u81EA\u52A8\u6062\u590D\u5B9A\u65F6\u5668",
            )),
          (this._pauseRequested = !0),
          (this._autoPaused = !1),
          (this.state = E.PAUSED),
          this._sendRunningLog(`\u23F8\uFE0F ${e}`),
          r(`[GreetingProcessor] \u5DF2\u6682\u505C: ${e}`),
          this._emitStatus(E.PAUSED, e));
      }
      resume() {
        if (this.state === E.PAUSED) {
          let e = "";
          this._maxDurationPaused
            ? ((this._maxDurationPaused = !1),
              (this._totalRunTimeMs = 0),
              (this._runSegmentStart = Date.now()),
              (this._runCycleStartTime = Date.now()),
              (e =
                "\u5DF2\u8FBE\u5230\u5355\u6B21\u8FD0\u884C\u6700\u5927\u65F6\u957F\uFF0C\u7528\u6237\u624B\u52A8\u6062\u590D\uFF0C\u6240\u6709\u8BA1\u65F6\u5668\u5DF2\u91CD\u7F6E\uFF0C\u5F00\u59CB\u65B0\u7684\u4F1A\u8BDD"),
              r(`[GreetingProcessor] \u25B6\uFE0F ${e}`))
            : this._autoPaused
              ? ((this._autoPaused = !1),
                this._accumulateRunTime(),
                (this._runSegmentStart = Date.now()),
                (this._runCycleStartTime = Date.now()),
                this._autoPauseTimer &&
                  (clearTimeout(this._autoPauseTimer),
                  (this._autoPauseTimer = null)),
                (e =
                  "\u81EA\u52A8\u5468\u671F\u6682\u505C\u7ED3\u675F\uFF0C\u6062\u590D\u8FD0\u884C"),
                r(`[GreetingProcessor] \u25B6\uFE0F ${e}`))
              : (this._accumulateRunTime(),
                (this._runSegmentStart = Date.now()),
                (this._runCycleStartTime = Date.now()),
                (e = "\u7528\u6237\u624B\u52A8\u6062\u590D\u8FD0\u884C"),
                r(`[GreetingProcessor] \u25B6\uFE0F ${e}`)),
            (this._pauseRequested = !1),
            (this.state = E.RUNNING),
            this._sendRunningLog(`\u25B6\uFE0F ${e}`),
            this._emitStatus(E.RUNNING, e);
        }
      }
      stop() {
        (this._stopRequested = !0),
          (this._pauseRequested = !1),
          (this.state = E.IDLE),
          this._autoPauseTimer &&
            (clearTimeout(this._autoPauseTimer), (this._autoPauseTimer = null)),
          (this._autoPaused = !1),
          this._sendRunningLog("\u23F9\uFE0F \u5DF2\u505C\u6B62\u8FD0\u884C"),
          this._emitStatus(E.IDLE, "\u5DF2\u505C\u6B62"),
          r("[GreetingProcessor] \u5DF2\u505C\u6B62");
      }
      skipCurrentJob() {
        this.state === E.RUNNING &&
          ((this._skipRequested = !0),
          r(
            "[GreetingProcessor] \u8BF7\u6C42\u8DF3\u8FC7\u5F53\u524D\u5C97\u4F4D",
          ));
      }
      _sendRunningLog(e) {
        try {
          chrome.runtime
            .sendMessage({
              action: M.RUNNING_LOG,
              data: {
                taskType: "greeting",
                level: "info",
                message: e,
                time: Date.now(),
              },
            })
            .catch(() => {});
        } catch {}
      }
      _buildJobQueue(e) {
        let t = e.jobConfigs || [],
          s = e.greetingConfigs || [],
          n = e.linkedJobs || [],
          o = n.length > 0,
          u = {};
        for (let d of s) u[d.jobId] = d;
        let c = [];
        for (let d of t) {
          if (d.enabled === !1) continue;
          if (o && !n.includes(d.id)) {
            r(
              `[GreetingProcessor] \u5C97\u4F4D "${d.name}" \u4E0D\u5728\u5B9A\u65F6\u4EFB\u52A1\u5173\u8054\u5C97\u4F4D\u5217\u8868\u4E2D\uFF0C\u8DF3\u8FC7`,
            );
            continue;
          }
          let a = u[d.id];
          if (!a) {
            r(
              `[GreetingProcessor] \u5C97\u4F4D "${d.name}" \u65E0\u6253\u62DB\u547C\u914D\u7F6E\uFF0C\u8DF3\u8FC7`,
            );
            continue;
          }
          c.push({
            jobId: d.id,
            jobName: d.name,
            greetCount: a.greetCount || 50,
            bossFilters: a.bossFilters || [],
            matchRules: a.matchRules || [],
            greetingMessages: a.greetingMessages || [Ye],
          });
        }
        return (
          r(
            `[GreetingProcessor] \u5C97\u4F4D\u961F\u5217: ${c.length} \u4E2A\u5C97\u4F4D${o ? "\uFF08\u6839\u636E\u5B9A\u65F6\u4EFB\u52A1\u5173\u8054\u5C97\u4F4D\u8FC7\u6EE4\uFF09" : ""}`,
          ),
          c
        );
      }
      _accumulateRunTime() {
        this._runSegmentStart > 0 &&
          ((this._totalRunTimeMs += Date.now() - this._runSegmentStart),
          (this._runSegmentStart = 0));
      }
      _getTotalRunTimeMs() {
        return (
          this._totalRunTimeMs +
          (this._runSegmentStart > 0 ? Date.now() - this._runSegmentStart : 0)
        );
      }
      _checkAndHandleTimeLimits() {
        let e = this._greetingTimeConfig?.maxRunDurationHours ?? 4;
        if (e > 0) {
          let o = this._getTotalRunTimeMs();
          if (o >= e * 60 * 60 * 1e3)
            return (
              this._accumulateRunTime(),
              (this._maxDurationPaused = !0),
              (this._pauseRequested = !0),
              (this.state = E.PAUSED),
              this._sendRunningLog(
                `\u23F8\uFE0F \u5DF2\u8FBE\u5230\u5355\u6B21\u8FD0\u884C\u6700\u5927\u65F6\u957F ${e} \u5C0F\u65F6\u9650\u5236\uFF0C\u5DF2\u81EA\u52A8\u6682\u505C`,
              ),
              r(
                `[GreetingProcessor] \u23F8\uFE0F \u5355\u6B21\u4F1A\u8BDD\u7D2F\u8BA1\u8FD0\u884C ${(o / 6e4).toFixed(1)} \u5206\u949F\uFF0C\u8FBE\u5230\u6700\u5927\u65F6\u957F ${e} \u5C0F\u65F6\u9650\u5236\uFF0C\u5DF2\u6C38\u4E45\u6682\u505C`,
              ),
              this._emitStatus(
                E.PAUSED,
                `\u5DF2\u8FBE\u5230\u5355\u6B21\u8FD0\u884C\u6700\u5927\u65F6\u957F ${e} \u5C0F\u65F6\u9650\u5236\uFF0C\u5DF2\u81EA\u52A8\u6682\u505C`,
              ),
              !0
            );
        }
        let t = this._greetingTimeConfig?.runDurationMinutes ?? 60,
          s = this._greetingTimeConfig?.pauseDurationMinutes ?? 5,
          n = (Date.now() - this._runCycleStartTime) / 6e4;
        if (
          (console.log(
            `[GreetingProcessor] \u23F1\uFE0F \u8FDE\u7EED\u8FD0\u884C\u68C0\u67E5: elapsed=${n.toFixed(1)}min, limit=${t}min, runCycleStart=${new Date(this._runCycleStartTime).toISOString()}, config=${JSON.stringify(this._greetingTimeConfig)}`,
          ),
          n >= t)
        ) {
          this._accumulateRunTime(),
            (this._pauseRequested = !0),
            (this._autoPaused = !0),
            (this.state = E.PAUSED);
          let o = `\u5DF2\u8FDE\u7EED\u8FD0\u884C ${t} \u5206\u949F\uFF0C\u8FBE\u5230\u5468\u671F\u4E0A\u9650\uFF0C\u6682\u505C ${s} \u5206\u949F\u540E\u81EA\u52A8\u6062\u590D`;
          return (
            this._sendRunningLog(`\u23F8\uFE0F ${o}`),
            r(`[GreetingProcessor] \u23F8\uFE0F ${o}`),
            this._emitStatus(E.PAUSED, o),
            (this._autoPauseTimer = setTimeout(
              () => {
                this.state === E.PAUSED && this.resume(),
                  (this._autoPauseTimer = null);
              },
              s * 60 * 1e3,
            )),
            !0
          );
        }
        return !1;
      }
      async _processJob(e) {
        if (
          (r(`[GreetingProcessor] \u5904\u7406\u5C97\u4F4D: "${e.jobName}"`),
          !(await this._searchJobByName(e.jobName)))
        ) {
          r(
            `[GreetingProcessor] \u5C97\u4F4D\u641C\u7D22\u65E0\u7ED3\u679C: "${e.jobName}"\uFF0C\u8DF3\u8FC7\u6B64\u5C97\u4F4D`,
          ),
            this._sendRunningLog(
              `\u23ED\uFE0F \u5C97\u4F4D "${e.jobName}" \u641C\u7D22\u65E0\u7ED3\u679C\uFF0C\u8DF3\u8FC7`,
            );
          return;
        }
        if (
          (e.bossFilters &&
            e.bossFilters.length > 0 &&
            (await this._applyFilters(e.bossFilters)),
          await this._waitForCandidates(15e3))
        )
          r(
            "[GreetingProcessor] \u5019\u9009\u4EBA\u5217\u8868\u5DF2\u5C31\u7EEA",
          ),
            this._sendRunningLog(
              "\u2705 \u5019\u9009\u4EBA\u5217\u8868\u5DF2\u52A0\u8F7D",
            );
        else {
          r(
            "[GreetingProcessor] \u5019\u9009\u4EBA\u5217\u8868\u52A0\u8F7D\u8D85\u65F6\uFF0C\u6B64\u5C97\u4F4D\u65E0\u5339\u914D\u5019\u9009\u4EBA",
          ),
            this._sendRunningLog(
              `\u26A0\uFE0F \u5C97\u4F4D "${e.jobName}" \u65E0\u5339\u914D\u5019\u9009\u4EBA\uFF0C\u8DF3\u8FC7`,
            );
          return;
        }
        let n = 0,
          o = e.greetCount || 50;
        this._emitStatus(
          E.RUNNING,
          `\u5C97\u4F4D"${e.jobName}" \u62DB\u547C\u8FDB\u5EA6 0/${o}`,
        );
        let u = 0,
          c = 0,
          d = 3,
          a = 0;
        for (; n < o && !(this._stopRequested || this._skipRequested); ) {
          if (this._pauseRequested) {
            if (
              (await this._waitWhilePaused(),
              this._stopRequested ||
                (this._checkAndHandleTimeLimits() &&
                  (await this._waitWhilePaused(), this._stopRequested)))
            )
              break;
            continue;
          }
          if (this._checkAndHandleTimeLimits()) {
            if ((await this._waitWhilePaused(), this._stopRequested)) break;
            continue;
          }
          let l = this._getVisibleCandidates();
          if (l.length === 0) {
            if (
              (u++,
              r(
                `[GreetingProcessor] \u65E0\u53EF\u89C1\u5019\u9009\u4EBA\uFF08\u8FDE\u7EED ${u} \u6B21\uFF09\uFF0C\u5C1D\u8BD5\u6EDA\u52A8...`,
              ),
              u >= 3)
            ) {
              r(
                "[GreetingProcessor] \u8FDE\u7EED 3 \u6B21\u65E0\u5019\u9009\u4EBA\uFF0C\u5224\u5B9A\u5DF2\u5230\u5E95\uFF0C\u8DF3\u8FC7\u6B64\u5C97\u4F4D",
              ),
                this._sendRunningLog(
                  `\u23F9\uFE0F \u5C97\u4F4D "${e.jobName}" \u65E0\u66F4\u591A\u5019\u9009\u4EBA`,
                );
              break;
            }
            if (!(await this._scrollForMore())) {
              if (this._seenCandidates.size > 0 && c < d) {
                c++,
                  r(
                    `[GreetingProcessor] scrollForMore \u8FD4\u56DE false\uFF0C\u91CD\u8BD5 ${c}/${d}`,
                  ),
                  await m(2e3);
                continue;
              }
              r(
                "[GreetingProcessor] \u65E0\u6CD5\u7EE7\u7EED\u6EDA\u52A8\uFF0C\u5224\u5B9A\u5DF2\u5230\u5E95",
              );
              break;
            }
            (c = 0), await m(2e3);
            continue;
          }
          u = 0;
          let f = !1,
            _ = n,
            h = 0;
          for (let p of l) {
            if (
              this._stopRequested ||
              (this._pauseRequested &&
                (await this._waitWhilePaused(), this._stopRequested)) ||
              n >= o
            )
              break;
            if (this._consecutiveFailures >= this._maxFailures) {
              A(
                `[GreetingProcessor] \u8FDE\u7EED\u5931\u8D25 ${this._consecutiveFailures} \u6B21\uFF0C\u505C\u6B62\u5904\u7406`,
              );
              break;
            }
            if (this._seenCandidates.has(p.key)) continue;
            if (
              (this._seenCandidates.add(p.key),
              (f = !0),
              h++,
              !this._canGreet(p))
            ) {
              r(
                `[GreetingProcessor] \u8DF3\u8FC7\u5DF2\u5904\u7406\u5019\u9009\u4EBA: ${p.name}`,
              );
              continue;
            }
            let b = await this._processCandidate(p, e);
            if (
              (b
                ? (n++,
                  (this._consecutiveFailures = 0),
                  this._pauseRequested ||
                    this._emitStatus(
                      E.RUNNING,
                      `\u5C97\u4F4D"${e.jobName}" \u62DB\u547C\u8FDB\u5EA6 ${n}/${o}`,
                    ))
                : !this._pauseRequested &&
                  !this._stopRequested &&
                  this._consecutiveFailures++,
              n < o && !this._stopRequested && !this._pauseRequested)
            )
              if (b) {
                let D = this._greetIntervalMs / 1e3;
                this._sendRunningLog(
                  `\u23F3 \u7B49\u5F85 ${D} \u79D2\u540E\u518D\u6B21\u53D1\u9001\u6253\u62DB\u547C\uFF08\u62DF\u4EBA\u9891\u7387 - \u6253\u62DB\u547C\u95F4\u9694 ${D} \u79D2\uFF09`,
                ),
                  await this._sleepWithTimeCheck(this._greetIntervalMs);
              } else {
                let D = this._userIntervalMs / 1e3;
                this._sendRunningLog(
                  `\u23F3 \u7B49\u5F85 ${D} \u79D2\u540E\u5904\u7406\u4E0B\u4E00\u4F4D\u5019\u9009\u4EBA\uFF08\u62DF\u4EBA\u9891\u7387 - \u5019\u9009\u4EBA\u5904\u7406\u95F4\u9694 ${D} \u79D2\uFF09`,
                ),
                  await this._sleepWithTimeCheck(this._userIntervalMs);
              }
          }
          let S = n - _;
          if (
            (r(
              `[GreetingProcessor] \u672C\u8F6E\u8BCA\u65AD: candidates=${l.length}, newCandidates=${h}, greetedDuringPass=${S}, seenTotal=${this._seenCandidates.size}`,
            ),
            h > 0 &&
              S === 0 &&
              A(
                `[GreetingProcessor] \u26A0\uFE0F \u68C0\u6D4B\u5230 ${h} \u4E2A\u65B0\u5019\u9009\u4EBA\u4F46\u65E0\u4EBA\u88AB\u6210\u529F\u6253\u62DB\u547C\uFF01\u53EF\u80FD\u539F\u56E0\uFF1A_canGreet=false \u6216 _processCandidate \u5931\u8D25`,
              ),
            (this._consecutiveFailures = 0),
            S === 0)
          ) {
            if (
              (a++,
              r(
                `[GreetingProcessor] \u672C\u8F6E\u65E0\u5B9E\u9645\u6253\u62DB\u547C\uFF08\u8FDE\u7EED ${a} \u6B21\uFF09\uFF0C\u6EDA\u52A8\u65E0\u6709\u6548\u65B0\u5019\u9009\u4EBA`,
              ),
              a >= 3)
            ) {
              r(
                "[GreetingProcessor] \u8FDE\u7EED 3 \u6B21\u6EDA\u52A8\u65E0\u6210\u529F\u6253\u62DB\u547C\uFF0C\u505C\u6B62\u6EDA\u52A8",
              ),
                this._sendRunningLog(
                  "\u23F9\uFE0F \u5DF2\u5904\u7406\u6240\u6709\u53EF\u6253\u62DB\u547C\u7684\u5019\u9009\u4EBA\uFF0C\u505C\u6B62\u6EDA\u52A8",
                );
              break;
            }
          } else a = 0;
          if (!f && this._isEndOfListTextVisible()) {
            r(
              "[GreetingProcessor] \u6240\u6709\u53EF\u89C1\u5019\u9009\u4EBA\u5747\u5DF2\u5904\u7406\u4E14\u5217\u8868\u5DF2\u5230\u5E95\uFF0C\u8DF3\u8FC7\u6B64\u5C97\u4F4D",
            ),
              this._sendRunningLog(
                `\u23F9\uFE0F \u5C97\u4F4D "${e.jobName}" \u6240\u6709\u5019\u9009\u4EBA\u5DF2\u5904\u7406\u5B8C\u6BD5`,
              );
            break;
          }
          if (this._pauseRequested) {
            if ((await this._waitWhilePaused(), this._stopRequested)) break;
            continue;
          }
          if (n < o && !this._stopRequested) {
            if (!(await this._scrollForMore())) {
              if (this._seenCandidates.size > 0 && c < d) {
                c++,
                  r(
                    `[GreetingProcessor] scrollForMore \u8FD4\u56DE false\uFF0C\u91CD\u8BD5 ${c}/${d}`,
                  ),
                  await m(2e3);
                continue;
              }
              r(
                "[GreetingProcessor] \u65E0\u6CD5\u7EE7\u7EED\u6EDA\u52A8\uFF0C\u5224\u5B9A\u5DF2\u5230\u5E95",
              );
              break;
            }
            if (((c = 0), this._stopRequested)) break;
            if (this._pauseRequested) {
              if ((await this._waitWhilePaused(), this._stopRequested)) break;
              continue;
            }
            await m(2e3);
          }
        }
        this._pauseRequested
          ? this._emitStatus(
              E.PAUSED,
              `\u5C97\u4F4D"${e.jobName}" \u5DF2\u6682\u505C\uFF08${n}/${o}\uFF09`,
            )
          : this._emitStatus(
              E.RUNNING,
              `\u5C97\u4F4D"${e.jobName}" \u5DF2\u5B8C\u6210 ${n}/${o}`,
            ),
          r(
            `[GreetingProcessor] \u5C97\u4F4D "${e.jobName}" \u5B8C\u6210\uFF0C\u5DF2\u6253\u62DB\u547C: ${n} \u4EBA`,
          );
      }
      async _processCandidate(e, t) {
        if (
          (r(`[GreetingProcessor] \u5904\u7406\u5019\u9009\u4EBA: ${e.name}`),
          this._pauseRequested && (await this._waitWhilePaused()),
          this._stopRequested)
        )
          return !1;
        this._sendRunningLog(`\u{1F464} \u68C0\u67E5 ${e.name}`);
        let s = t.matchRules || [];
        if (!s || s.length === 0)
          return (
            this._sendRunningLog(
              `\u2705 ${e.name} \u65E0\u5339\u914D\u89C4\u5219\uFF0C\u9ED8\u8BA4\u6253\u62DB\u547C`,
            ),
            this._pauseRequested && (await this._waitWhilePaused()),
            this._stopRequested ? !1 : await this._doGreet(e, t, [], "card")
          );
        let n = (e.cardText || e.element?.textContent || "").toLowerCase(),
          o = this._executeKeywordMatch(n, s);
        if (o.forbiddenHit && o.forbiddenHit.length > 0)
          return (
            this._sendRunningLog(
              `\u26D4 ${e.name} \u5361\u7247\u542B\u4E25\u7981\u8BCD: ${o.forbiddenHit.join(", ")}\uFF0C\u8DF3\u8FC7`,
            ),
            r(
              `[GreetingProcessor] ${e.name} \u5361\u7247\u4E25\u7981\u8BCD\u547D\u4E2D: ${o.forbiddenHit.join(", ")}`,
            ),
            !1
          );
        if (o.passed && o.matchedKeywords.length > 0)
          return (
            this._sendRunningLog(
              `\u2705 ${e.name} \u5361\u7247\u5173\u952E\u8BCD\u5339\u914D\u901A\u8FC7: ${o.matchedKeywords.join(", ")}\uFF0C\u76F4\u63A5\u6253\u62DB\u547C`,
            ),
            r(
              `[GreetingProcessor] ${e.name} \u5361\u7247\u7EA7\u5339\u914D\u901A\u8FC7\uFF0C\u5173\u952E\u8BCD: ${o.matchedKeywords.join(", ")}`,
            ),
            this._pauseRequested && (await this._waitWhilePaused()),
            this._stopRequested
              ? !1
              : await this._doGreet(e, t, o.matchedKeywords, "card")
          );
        if (
          (r(
            `[GreetingProcessor] ${e.name} \u5361\u7247\u7EA7\u672A\u5339\u914D\uFF0C\u6253\u5F00\u7B80\u5386\u8BE6\u60C5`,
          ),
          this._sendRunningLog(
            `\u{1F4C4} ${e.name} \u5361\u7247\u6587\u672C\u672A\u547D\u4E2D\u5173\u952E\u8BCD\uFF0C\u6253\u5F00\u7B80\u5386...`,
          ),
          this._pauseRequested && (await this._waitWhilePaused()),
          this._stopRequested)
        )
          return (
            r(
              `[GreetingProcessor] \u5DF2\u505C\u6B62\uFF0C\u8DF3\u8FC7\u7B80\u5386\u5339\u914D: ${e.name}`,
            ),
            !1
          );
        let u = await this._matchResumeLevel(e, s),
          { passed: c, matchedKeywords: d, forbiddenHit: a } = u;
        if (a && a.length > 0)
          return (
            this._sendRunningLog(
              `\u26D4 ${e.name} \u7B80\u5386\u542B\u4E25\u7981\u8BCD: ${a.join(", ")}\uFF0C\u8DF3\u8FC7`,
            ),
            r(
              `[GreetingProcessor] ${e.name} \u7B80\u5386\u4E25\u7981\u8BCD\u547D\u4E2D: ${a.join(", ")}`,
            ),
            !1
          );
        if (!c) {
          let l = s.flatMap((f) => f.mustKeywords || []);
          return (
            this._sendRunningLog(
              `\u23ED\uFE0F ${e.name} \u5173\u952E\u8BCD\u4E0D\u5339\u914D: [${l.join(", ")}] \u5747\u672A\u547D\u4E2D`,
            ),
            r(
              `[GreetingProcessor] ${e.name} \u4E0D\u5339\u914D\uFF08\u5361\u7247+\u7B80\u5386\u5747\u672A\u547D\u4E2D\uFF09`,
            ),
            !1
          );
        }
        return (
          this._sendRunningLog(
            `\u2705 ${e.name} \u7B80\u5386\u5173\u952E\u8BCD\u5339\u914D\u901A\u8FC7: ${d.join(", ")}`,
          ),
          r(
            `[GreetingProcessor] ${e.name} \u7B80\u5386\u7EA7\u5339\u914D\u901A\u8FC7\uFF0C\u5173\u952E\u8BCD: ${d.join(", ")}`,
          ),
          this._pauseRequested && (await this._waitWhilePaused()),
          this._stopRequested ? !1 : await this._doGreet(e, t, d, "resume")
        );
      }
      async _doGreet(e, t, s, n) {
        if (
          (this._pauseRequested && (await this._waitWhilePaused()),
          this._stopRequested)
        )
          return !1;
        let o = t.greetingMessages || [];
        if (!o || o.length === 0)
          return (
            r(
              `[GreetingProcessor] \u672A\u914D\u7F6E\u6253\u62DB\u547C\u8BDD\u672F\uFF0C\u8DF3\u8FC7: ${e.name}`,
            ),
            this._sendRunningLog(
              `\u26A0\uFE0F ${e.name} \u672A\u914D\u7F6E\u6253\u62DB\u547C\u8BDD\u672F\uFF0C\u8DF3\u8FC7`,
            ),
            !1
          );
        let u = this._greetingTimeConfig?.sendDelayRange || [5, 10],
          c = w(u[0], u[1]) * 1e3;
        if (
          (r(
            `[GreetingProcessor] \u5411 "${e.name}" \u53D1\u9001 ${o.length} \u6761\u62DB\u547C\u8BDD\u672F\uFF0C\u95F4\u9694 ${c / 1e3} \u79D2`,
          ),
          !(await this._sendGreeting(e, o, c)))
        )
          return (
            r(
              `[GreetingProcessor] \u6253\u62DB\u547C\u53D1\u9001\u5931\u8D25: ${e.name}`,
            ),
            this._sendRunningLog(
              `\u274C ${e.name} \u6253\u62DB\u547C\u53D1\u9001\u5931\u8D25`,
            ),
            !1
          );
        let a = o.map((f) => (f.length > 100 ? f.slice(0, 100) + "..." : f));
        this._sendRunningLog(
          `\u{1F4E4} \u5DF2\u5411 ${e.name} \u53D1\u9001 ${o.length} \u6761\u62DB\u547C\u6D88\u606F`,
        );
        let l = {
          id: e.key || String(e.geekId || Date.now()),
          name: e.name || "\u672A\u77E5",
          jobName: t.jobName || "",
          positionName: e.position || t.jobName || "",
          matchedKeywords: s || [],
          greetingMessages: o,
          greetTime: new Date().toISOString(),
        };
        return (
          this._onNewRecord(l),
          r(
            `[GreetingProcessor] \u6253\u62DB\u547C\u6210\u529F: ${e.name}\uFF08${o.length} \u6761\u8BDD\u672F\uFF09`,
          ),
          !0
        );
      }
      _executeKeywordMatch(e, t) {
        let s = { passed: !1, matchedKeywords: [], forbiddenHit: [] };
        if (!t || t.length === 0) return (s.passed = !0), s;
        if (!e) return s;
        for (let n of t) {
          let o = n.mustKeywords || [],
            u = n.forbiddenKeywords || [];
          if (u.length > 0) {
            let c = u.filter((d) => e.includes(d.toLowerCase()));
            if (c.length > 0) return (s.forbiddenHit = c), (s.passed = !1), s;
          }
          if (o.length > 0)
            if (n.matchMode === "and") {
              if (o.every((d) => e.includes(d.toLowerCase()))) {
                s.matchedKeywords.push(...o), (s.passed = !0);
                break;
              }
            } else {
              let c = o.filter((d) => e.includes(d.toLowerCase()));
              if (c.length > 0) {
                s.matchedKeywords.push(...c), (s.passed = !0);
                break;
              }
            }
        }
        return s;
      }
      _getVisibleCandidates() {
        let e = [],
          t = new Set(),
          s = [
            "\u6253\u62DB\u547C",
            "\u7EE7\u7EED\u6C9F\u901A",
            "\u6C9F\u901A\u4E2D",
            "\u5DF2\u6C9F\u901A",
            "\u53D1\u6D88\u606F",
            "\u7EE7\u7EED\u804A",
          ],
          n = (d) => {
            if (!d || d.nodeType !== 1) return !1;
            let a = (d.textContent || d.innerText || "")
              .replace(/\s+/g, " ")
              .trim();
            return s.some((l) => a.includes(l));
          },
          o = (d) => {
            let a = d.querySelectorAll(C.CARD_BUTTON);
            for (let f of a)
              if (f.nodeType === 1 && this._isElementVisible(f) && n(f))
                return f;
            let l = d.querySelectorAll('button, a, [role="button"]');
            for (let f of l)
              if (f.nodeType === 1 && this._isElementVisible(f) && n(f))
                return f;
            return null;
          },
          u = (d) => {
            let a = d.querySelector(C.CARD_NAME);
            return a ? a.textContent.trim() : "";
          },
          c = this._getAllQueryRoots();
        for (let d of c) {
          let a = d.querySelectorAll(C.CARD_ITEM);
          for (let l of a) {
            if (!this._isElementVisible(l)) continue;
            let f = l.closest("li.card-item");
            if ((f && f !== l && t.has(f)) || t.has(l)) continue;
            t.add(l);
            let _ = l.matches("li.card-item")
                ? l
                : l.closest("li.card-item") || l,
              h = o(_),
              S = _.querySelector(C.CARD_NAME),
              p = _.querySelector(C.CARD_SCHOOL),
              b = _.querySelector(C.CARD_POSITION),
              v =
                (_.querySelector("[data-geekid]") || _).getAttribute(
                  "data-geekid",
                ) ||
                _.getAttribute("data-geek") ||
                "",
              G = S ? S.textContent.trim() : "",
              k = p ? p.textContent.trim() : "",
              g = b ? b.textContent.trim() : "",
              T = h ? (h.textContent || "").replace(/\s+/g, " ").trim() : "",
              R = v || G + "_" + k + "_" + g,
              P = _.textContent || "";
            e.push({
              key: R,
              name: G,
              school: k,
              position: g,
              geekId: v,
              element: this._getCardClickTarget(_),
              buttonEl: h,
              buttonText: T,
              cardText: P,
            });
          }
        }
        if (e.length === 0) {
          let d = [];
          for (let a of c) {
            let l = a.querySelectorAll(C.CARD_BUTTON);
            for (let f of l)
              f.nodeType === 1 &&
                this._isElementVisible(f) &&
                n(f) &&
                d.push(f);
            if (d.length === 0) {
              let f = a.querySelectorAll('button, a, [role="button"]');
              for (let _ of f)
                _.nodeType === 1 &&
                  this._isElementVisible(_) &&
                  n(_) &&
                  d.push(_);
            }
          }
          for (let a of d) {
            let l =
              a.closest("li.card-item") ||
              a.closest(".candidate-card-wrap") ||
              a.closest("[data-geekid]");
            if (!l || t.has(l)) continue;
            t.add(l);
            let f = u(l),
              _ = l.querySelector(C.CARD_SCHOOL),
              h = l.querySelector(C.CARD_POSITION),
              S = _ ? _.textContent.trim() : "",
              p = h ? h.textContent.trim() : "",
              D =
                (l.querySelector("[data-geekid]") || l).getAttribute(
                  "data-geekid",
                ) ||
                l.getAttribute("data-geek") ||
                "",
              v = D || f + "_" + S + "_" + p,
              G = (a.textContent || "").replace(/\s+/g, " ").trim(),
              k = l.textContent || "";
            e.push({
              key: v,
              name: f,
              school: S,
              position: p,
              geekId: D,
              element: this._getCardClickTarget(l),
              buttonEl: a,
              buttonText: G,
              cardText: k,
            });
          }
        }
        return e;
      }
      _getCardClickTarget(e) {
        let t = C.CARD_CLICK_TARGET.split(",").map((s) => s.trim());
        for (let s of t) {
          let n = e.querySelector(s);
          if (n && n.nodeType === 1 && this._isElementVisible(n)) return n;
        }
        return e;
      }
      _getDocumentContexts() {
        let e = [document];
        try {
          window.top?.document &&
            window.top.document !== document &&
            e.push(window.top.document);
        } catch {}
        let t = document.querySelectorAll("iframe");
        for (let s of t)
          try {
            let n = s.contentDocument;
            n?.body && e.push(n);
          } catch {}
        return e;
      }
      _getDocumentScrollers() {
        let e = [],
          t = this._getDocumentContexts();
        for (let s of t)
          try {
            let n = s.scrollingElement;
            n && n.nodeType === 1 && e.push(n),
              s.body && s.body.nodeType === 1 && s.body !== n && e.push(s.body);
          } catch {}
        return e;
      }
      _collectQueryRoots(e, t = new Set()) {
        if (t.has(e)) return t;
        t.add(e);
        try {
          let s = e.querySelectorAll("*");
          for (let n of s)
            if (
              (n.shadowRoot &&
                n.shadowRoot instanceof ShadowRoot &&
                this._collectShadowRoots(n.shadowRoot, t),
              n.tagName === "IFRAME")
            )
              try {
                let o = n.contentDocument;
                o?.body && this._collectQueryRoots(o, t);
              } catch {}
        } catch {}
        return t;
      }
      _collectShadowRoots(e, t) {
        if (t.has(e)) return t;
        t.add(e);
        try {
          let s = e.querySelectorAll("*");
          for (let n of s)
            if (
              (n.shadowRoot &&
                n.shadowRoot instanceof ShadowRoot &&
                this._collectShadowRoots(n.shadowRoot, t),
              n.tagName === "IFRAME")
            )
              try {
                let o = n.contentDocument;
                o?.body && this._collectQueryRoots(o, t);
              } catch {}
        } catch {}
        return t;
      }
      _getAllQueryRoots() {
        let e = new Set(),
          t = this._getDocumentContexts();
        for (let s of t) this._collectQueryRoots(s, e);
        return [...e];
      }
      _findInAllContexts(e) {
        let t = this._getAllQueryRoots();
        for (let s of t) {
          let n = s.querySelector(e);
          if (n) return n;
        }
        return null;
      }
      _findAllInContexts(e) {
        let t = [],
          s = new Set(),
          n = this._getAllQueryRoots();
        for (let o of n) {
          let u = o.querySelectorAll(e);
          for (let c of u) s.has(c) || (s.add(c), t.push(c));
        }
        return t;
      }
      async _humanClickElement(e) {
        if (e)
          try {
            typeof e.scrollIntoView == "function" &&
              e.scrollIntoView({
                block: "center",
                inline: "center",
                behavior: "auto",
              });
            let t = e.ownerDocument?.defaultView || window,
              s = e.getBoundingClientRect(),
              n = s.left + Math.min(s.width / 2, Math.max(8, s.width / 3)),
              o = s.top + Math.min(s.height / 2, Math.max(8, s.height / 3)),
              u = {
                bubbles: !0,
                cancelable: !0,
                clientX: n,
                clientY: o,
                view: t,
              };
            try {
              e.dispatchEvent(new t.MouseEvent("mousemove", u));
            } catch {}
            try {
              e.dispatchEvent(new t.MouseEvent("mouseover", u));
            } catch {}
            try {
              e.dispatchEvent(new t.MouseEvent("mouseenter", u));
            } catch {}
            await m(w(50, 120));
            try {
              e.dispatchEvent(new t.MouseEvent("mousedown", u));
            } catch {}
            await m(w(50, 120));
            try {
              e.dispatchEvent(new t.MouseEvent("mouseup", u));
            } catch {}
            try {
              e.dispatchEvent(new t.MouseEvent("click", u));
            } catch {}
            await m(w(200, 500));
          } catch (t) {
            A(
              "[GreetingProcessor] \u62DF\u4EBA\u70B9\u51FB\u5F02\u5E38\uFF08\u5DF2\u9694\u79BB\uFF09:",
              t?.message || t,
            );
          }
      }
      async _searchJobByName(e) {
        try {
          this._sendRunningLog(`\u{1F50D} \u641C\u7D22\u5C97\u4F4D: ${e}`),
            r(`[GreetingProcessor] \u641C\u7D22\u5C97\u4F4D: "${e}"`);
          let t = null,
            s = null,
            n = 15e3,
            o = 1e3,
            u = Date.now();
          for (; Date.now() - u < n; ) {
            if (this._stopRequested) return !1;
            if (((t = this._findInAllContexts(C.JOB_SEARCH_ROOT)), t)) {
              r(
                `[GreetingProcessor] \u641C\u7D22\u6839\u8282\u70B9\u5DF2\u627E\u5230\uFF08\u7B49\u5F85 ${Date.now() - u}ms\uFF09`,
              );
              break;
            }
            if (((s = this._findInAllContexts(C.JOB_SEARCH_INPUT)), s)) {
              r(
                `[GreetingProcessor] \u641C\u7D22\u8F93\u5165\u6846\u5DF2\u627E\u5230\uFF08${Date.now() - u}ms\uFF09\uFF0C\u8D70\u964D\u7EA7\u8DEF\u5F84`,
              );
              break;
            }
            await m(o);
          }
          if (!t && !s) {
            let c = Date.now() - u;
            r(
              `[GreetingProcessor] \u26A0\uFE0F \u5C97\u4F4D\u641C\u7D22\u7EC4\u4EF6\u672A\u627E\u5230\uFF08\u7B49\u5F85 ${c}ms\uFF09`,
            ),
              this._sendRunningLog(
                `\u26A0\uFE0F \u5C97\u4F4D "${e}" \u641C\u7D22\u7EC4\u4EF6\u672A\u52A0\u8F7D\uFF08SPA \u53EF\u80FD\u672A\u5B8C\u6210\u6E32\u67D3\uFF09`,
              ),
              r(
                `[GreetingProcessor] \u5F53\u524D URL: ${window.location.href}`,
              );
            try {
              let d = document.body?.className?.slice(0, 200) || "\u65E0",
                a = document.querySelector(
                  SEL.page.APP_ROOT,
                ),
                l = a
                  ? (a.textContent || "").trim().slice(0, 300)
                  : "\u65E0 #app \u5BB9\u5668";
              r(`[GreetingProcessor] body.class: ${d}`),
                r(
                  `[GreetingProcessor] #app \u5185\u5BB9\u6458\u8981: ${l.slice(0, 200)}`,
                );
            } catch {}
            return !1;
          }
          if (t) {
            let c = t.querySelector(C.JOB_SEARCH_LABEL),
              d = t.querySelectorAll(C.JOB_SEARCH_OPTIONS),
              a = Array.from(d).some((h) => this._isElementVisible(h));
            if (c && !a) {
              await this._humanClickElement(c), await m(w(400, 700));
              let h = this._findInAllContexts(".job-selecter-options");
              h &&
                ((t = h),
                r(
                  "[GreetingProcessor] \u4E0B\u62C9\u5DF2\u5C55\u5F00\uFF0C\u5207\u6362\u5230 .job-selecter-options \u4F5C\u4E3A\u641C\u7D22\u6839",
                ));
            } else
              a &&
                r(
                  "[GreetingProcessor] \u4E0B\u62C9\u83DC\u5355\u5DF2\u5C55\u5F00\uFF0C\u8DF3\u8FC7\u6807\u7B7E\u70B9\u51FB",
                );
            let l =
              t.querySelector("input") ||
              t.querySelector(C.JOB_SEARCH_INPUT.split(",")[0]);
            if (!l) {
              r(
                "[GreetingProcessor] \u641C\u7D22\u6839\u8282\u70B9\u5185\u672A\u627E\u5230\u8F93\u5165\u6846\uFF0C\u5C1D\u8BD5\u964D\u7EA7\u8DEF\u5F84",
              );
              let h = this._findInAllContexts(C.JOB_SEARCH_INPUT);
              return h ? await this._directInputSearch(h, e) : !1;
            }
            await this._humanClickElement(l),
              (l.value = ""),
              l.dispatchEvent(new Event("input", { bubbles: !0 })),
              await m(w(100, 200));
            for (let h of e)
              (l.value += h),
                l.dispatchEvent(
                  new InputEvent("input", {
                    bubbles: !0,
                    cancelable: !0,
                    data: h,
                    inputType: "insertText",
                  }),
                ),
                await m(w(50, 120));
            if (
              (l.dispatchEvent(new Event("change", { bubbles: !0 })),
              await m(w(800, 1500)),
              this._isJobSearchEmpty(t))
            )
              return (
                r(
                  `[GreetingProcessor] \u5C97\u4F4D "${e}" \u641C\u7D22\u7ED3\u679C\u4E3A\u7A7A`,
                ),
                !1
              );
            let f = t.querySelectorAll(C.JOB_SEARCH_OPTIONS);
            if (f.length === 0) {
              let h = this._findAllInContexts(C.JOB_SEARCH_OPTIONS);
              h.length > 0 &&
                (r(
                  "[GreetingProcessor] \u5728 searchRoot \u5916\u627E\u5230\u9009\u9879\uFF0C\u4F7F\u7528\u5168\u5C40\u67E5\u627E\u7ED3\u679C\uFF08\u53EF\u80FD\u4E3A Teleport \u6E32\u67D3\uFF09",
                ),
                (f = h));
            }
            for (let h of f) {
              if (!this._isElementVisible(h)) continue;
              let S = h.textContent.trim();
              if (S.includes(e) || e.includes(S))
                return (
                  await this._humanClickElement(h),
                  r(
                    `[GreetingProcessor] \u5DF2\u9009\u62E9\u5C97\u4F4D: "${S}"`,
                  ),
                  await m(w(300, 600)),
                  await this._tryConfirmJobSearch(t),
                  !0
                );
            }
            if (this._isJobSearchEmpty(t))
              return (
                r(
                  `[GreetingProcessor] \u5C97\u4F4D "${e}" \u641C\u7D22\u7ED3\u679C\u4E3A\u7A7A\uFF08\u4E0B\u62C9\u9009\u9879\u65E0\u5339\u914D + \u7A7A\u63D0\u793A\u53EF\u89C1\uFF09`,
                ),
                !1
              );
            l.dispatchEvent(
              new KeyboardEvent("keydown", { key: "Enter", bubbles: !0 }),
            ),
              await m(800),
              r(
                "[GreetingProcessor] \u5C97\u4F4D\u641C\u7D22: \u8F93\u5165\u540E\u56DE\u8F66\uFF08\u65E0\u5339\u914D\u9009\u9879\uFF09",
              );
            let _ = t.querySelectorAll(C.JOB_SEARCH_OPTIONS);
            if (_.length === 0) {
              let h = this._findAllInContexts(C.JOB_SEARCH_OPTIONS);
              h.length > 0 &&
                (r(
                  "[GreetingProcessor] \u56DE\u8F66\u540E\u5168\u5C40\u67E5\u627E\u5230\u9009\u9879",
                ),
                (_ = h));
            }
            for (let h of _) {
              if (!this._isElementVisible(h)) continue;
              let S = h.textContent.trim();
              if (S.includes(e) || e.includes(S))
                return (
                  await this._humanClickElement(h),
                  r(
                    `[GreetingProcessor] \u56DE\u8F66\u540E\u9009\u62E9\u5C97\u4F4D: "${S}"`,
                  ),
                  await m(w(300, 600)),
                  await this._tryConfirmJobSearch(t),
                  !0
                );
            }
            return !0;
          }
          return await this._directInputSearch(s, e);
        } catch (t) {
          return (
            A(
              "[GreetingProcessor] \u641C\u7D22\u5C97\u4F4D\u5F02\u5E38:",
              t.message,
            ),
            !1
          );
        }
      }
      async _directInputSearch(e, t) {
        try {
          r(
            "[GreetingProcessor] \u964D\u7EA7\u8DEF\u5F84: \u76F4\u63A5\u64CD\u4F5C\u8F93\u5165\u6846\u641C\u7D22",
          ),
            await this._humanClickElement(e),
            (e.value = t),
            (e.value = "");
          for (let n of t)
            (e.value += n),
              e.dispatchEvent(
                new InputEvent("input", {
                  bubbles: !0,
                  cancelable: !0,
                  data: n,
                  inputType: "insertText",
                }),
              ),
              await m(w(50, 120));
          e.dispatchEvent(new Event("input", { bubbles: !0 })),
            e.dispatchEvent(new Event("change", { bubbles: !0 })),
            await m(w(500, 1e3));
          let s = this._findInAllContexts(
            'button, [role="button"], .btn-search, [class*="search-btn"], [class*="submit"]',
          );
          if (s) {
            let n = (s.textContent || "").trim();
            (n.includes("\u641C\u7D22") ||
              n.includes("\u786E\u8BA4") ||
              n.includes("\u67E5\u627E")) &&
              (await this._humanClickElement(s), await m(w(300, 500)));
          }
          return (
            e.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "Enter",
                bubbles: !0,
                cancelable: !0,
              }),
            ),
            await m(500),
            !0
          );
        } catch (s) {
          return (
            A(
              "[GreetingProcessor] \u964D\u7EA7\u641C\u7D22\u5F02\u5E38:",
              s.message,
            ),
            !1
          );
        }
      }
      async _tryConfirmJobSearch(e) {
        try {
          let s = e.querySelectorAll(
            SEL.page.CONFIRM_BUTTONS,
          );
          for (let n of s) {
            if (!this._isElementVisible(n)) continue;
            let o = (n.textContent || "").trim();
            if (
              o === "\u786E\u5B9A" ||
              o === "\u786E\u8BA4" ||
              o === "\u641C\u7D22" ||
              o === "\u5B8C\u6210"
            ) {
              await this._humanClickElement(n),
                await m(w(200, 400)),
                r(
                  "[GreetingProcessor] \u5DF2\u70B9\u51FB\u641C\u7D22\u786E\u8BA4\u6309\u94AE",
                );
              return;
            }
          }
        } catch {}
      }
      _isJobSearchEmpty(e) {
        if (e) {
          let s = e.querySelector(C.JOB_SEARCH_EMPTY);
          if (s && this._isElementVisible(s)) return !0;
          let n = e.querySelector(C.JOB_LIST);
          if (n && n.children.length === 0) return !0;
        }
        let t = this._findInAllContexts(C.JOB_SEARCH_EMPTY);
        return !!(t && this._isElementVisible(t));
      }
      _filterNameMatches(e, t) {
        let s = e.trim().toLowerCase(),
          n = t.trim().toLowerCase();
        if (
          s === n ||
          (
            {
              年龄: [
                "\u5E74\u9F84\u8303\u56F4",
                "\u5E74\u9F84\u6BB5",
                "\u5019\u9009\u4EBA\u5E74\u9F84",
                "\u5E74\u9F84\u8981\u6C42",
              ],
              学历: ["\u5B66\u5386\u8981\u6C42", "\u5B66\u5386\u6C34\u5E73"],
              经验: [
                "\u7ECF\u9A8C\u8981\u6C42",
                "\u5DE5\u4F5C\u7ECF\u9A8C",
                "\u5DE5\u4F5C\u5E74\u9650",
                "\u5DE5\u4F5C\u5E74\u6570",
              ],
            }[n] || []
          ).some((l) => s.includes(l) || l.includes(s))
        )
          return !0;
        let c = (l) =>
            l
              .replace(/\s+/g, "")
              .replace(/[（(].*[）)]/g, "")
              .toLowerCase(),
          d = c(s),
          a = c(n);
        return d.includes(a) || a.includes(d);
      }
      _filterValueMatches(e, t) {
        let s = (u) =>
            (u || "")
              .replace(/\s+/g, "")
              .replace(/[（(][^）)]*[）)]/g, "")
              .toLowerCase(),
          n = s(e),
          o = s(t);
        return n.includes(o) || o.includes(n);
      }
      _findFilterTriggerByText() {
        let e = this._findAllInContexts(C.FILTER_TRIGGER);
        for (let s of e)
          if (
            (s.textContent || s.innerText || "")
              .trim()
              .toLowerCase()
              .includes("\u7B5B\u9009") &&
            this._isElementVisible(s)
          )
            return s;
        let t = this._findAllInContexts(
          'button, a, span, div, [role="button"]',
        );
        for (let s of t)
          if (
            (s.textContent || s.innerText || "").trim() === "\u7B5B\u9009" &&
            this._isElementVisible(s)
          )
            return s;
        return null;
      }
      async _applyFilters(e) {
        if (!e || e.length === 0) return !1;
        try {
          if (
            (this._sendRunningLog(
              "\u{1F527} \u8BBE\u7F6E\u7B5B\u9009\u6761\u4EF6...",
            ),
            r(
              "[GreetingProcessor] \u5E94\u7528\u7B5B\u9009\u6761\u4EF6:",
              JSON.stringify(e),
            ),
            this._findInAllContexts(C.FILTER_ITEM))
          )
            r(
              "[GreetingProcessor] \u7B5B\u9009\u9762\u677F\u5DF2\u6253\u5F00\uFF0C\u8DF3\u8FC7\u89E6\u53D1\u6309\u94AE\u70B9\u51FB",
            );
          else {
            let u = this._findFilterTriggerByText();
            if (!u)
              return (
                r(
                  "[GreetingProcessor] \u672A\u627E\u5230\u7B5B\u9009\u6309\u94AE\uFF0C\u8DF3\u8FC7\u7B5B\u9009",
                ),
                !1
              );
            await this._humanClickElement(u), await m(w(500, 1e3));
          }
          let s = this._findAllInContexts(C.FILTER_ITEM);
          for (let u of s) {
            let c = u.querySelector(C.FILTER_ITEM_NAME);
            if (!c) continue;
            let d = c.textContent.trim(),
              a = null;
            for (let h of e)
              if (this._filterNameMatches(d, h.name)) {
                a = h;
                break;
              }
            if (!a) continue;
            if (
              a.name === "\u5E74\u9F84" ||
              this._filterNameMatches(d, "\u5E74\u9F84")
            ) {
              let h = Array.isArray(a.values) ? a.values[0] : a.values;
              h &&
                (await this._applyAgeFilter(u, h),
                r(`[GreetingProcessor] \u5E74\u9F84\u7B5B\u9009: ${h}`));
              continue;
            }
            let f = u.querySelectorAll(C.FILTER_OPTION),
              _ = Array.isArray(a.values) ? a.values : [a.values];
            for (let h of _)
              for (let S of f) {
                if (!this._isElementVisible(S)) continue;
                let p = S.textContent.trim();
                if (
                  !(
                    S.matches(".active, .selected, .on, .current") ||
                    S.getAttribute("aria-selected") === "true"
                  ) &&
                  this._filterValueMatches(p, h)
                ) {
                  await this._humanClickElement(S),
                    r(`[GreetingProcessor] \u7B5B\u9009: ${d} \u2192 ${p}`),
                    await m(w(200, 400));
                  break;
                }
              }
          }
          await m(w(300, 500));
          let n = null,
            o = this._findInAllContexts(C.FILTER_PANEL);
          if (o) {
            let u = o.querySelectorAll(
              SEL.page.CONFIRM_BUTTONS_NARROW,
            );
            for (let c of u)
              if (c.textContent.trim() === C.FILTER_CONFIRM) {
                n = c;
                break;
              }
          }
          return (
            n ||
              (n = this._findAllInContexts('button, [role="button"]').find(
                (c) => c.textContent.trim() === C.FILTER_CONFIRM,
              )),
            n
              ? (await this._humanClickElement(n),
                r(
                  "[GreetingProcessor] \u7B5B\u9009\u6761\u4EF6\u5DF2\u786E\u8BA4",
                ),
                await m(1e3),
                !0)
              : (document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "Escape", bubbles: !0 }),
                ),
                await m(500),
                !0)
          );
        } catch (t) {
          return (
            A(
              "[GreetingProcessor] \u8BBE\u7F6E\u7B5B\u9009\u6761\u4EF6\u5F02\u5E38:",
              t.message,
            ),
            !1
          );
        }
      }
      async _applyAgeFilter(e, t) {
        try {
          let s = String(t).match(/^(\d+)-(\d+)$/);
          if (!s)
            return (
              A(
                `[GreetingProcessor] \u5E74\u9F84\u503C\u683C\u5F0F\u65E0\u6548: "${t}"\uFF0C\u671F\u671B "min-max" \u683C\u5F0F`,
              ),
              !1
            );
          let n = parseInt(s[1], 10),
            o = parseInt(s[2], 10);
          if (isNaN(n) && isNaN(o)) return !1;
          let u = e.querySelector(SEL.page.SLIDER);
          if (!u)
            return (
              A(
                "[GreetingProcessor] \u672A\u627E\u5230\u5E74\u9F84\u6ED1\u5757\u7684 .vue-slider \u5143\u7D20",
              ),
              !1
            );
          let c = u.querySelectorAll(SEL.page.SLIDER_DOT);
          if (c.length < 2)
            return (
              A(
                `[GreetingProcessor] \u5E74\u9F84\u6ED1\u5757\u5706\u70B9\u4E0D\u8DB3: \u627E\u5230 ${c.length} \u4E2A`,
              ),
              !1
            );
          let d = u.getBoundingClientRect(),
            a = u.ownerDocument?.defaultView || window;
          if (!a) return !1;
          let l = 16,
            f = 46,
            _ = f - l,
            h = (p) => {
              if (isNaN(p) || p >= f) return 100;
              let b = Math.max(0, Math.min(p - l, _));
              return Math.min(100, ((b + 0.5) / _) * 100);
            },
            S = async (p, b) => {
              let D = p.getBoundingClientRect(),
                v = D.top + D.height / 2,
                G = D.left + D.width / 2,
                k = d.left + (b / 100) * d.width;
              p.dispatchEvent(
                new a.MouseEvent("mousedown", {
                  bubbles: !0,
                  cancelable: !0,
                  clientX: G,
                  clientY: v,
                  view: a,
                  buttons: 1,
                  button: 0,
                }),
              ),
                await m(w(40, 80)),
                a.document.dispatchEvent(
                  new a.MouseEvent("mousemove", {
                    bubbles: !0,
                    cancelable: !0,
                    clientX: k,
                    clientY: v,
                    view: a,
                    buttons: 1,
                    button: 0,
                  }),
                ),
                await m(w(40, 80)),
                a.document.dispatchEvent(
                  new a.MouseEvent("mouseup", {
                    bubbles: !0,
                    cancelable: !0,
                    clientX: k,
                    clientY: v,
                    view: a,
                    button: 0,
                  }),
                );
            };
          return (
            !isNaN(o) && o >= l && (await S(c[1], h(o)), await m(w(200, 350))),
            !isNaN(n) &&
              n >= l &&
              n <= f &&
              (await S(c[0], h(n)), await m(w(200, 350))),
            r(
              `[GreetingProcessor] \u5E74\u9F84\u6ED1\u5757\u5DF2\u8BBE\u7F6E: ${n || "\u4E0D\u9650"}-${o || "\u4E0D\u9650"}`,
            ),
            !0
          );
        } catch (s) {
          return (
            A(
              "[GreetingProcessor] \u8BBE\u7F6E\u5E74\u9F84\u6ED1\u5757\u5F02\u5E38:",
              s.message,
            ),
            !1
          );
        }
      }
      async _waitForCandidates(e = 15e3) {
        let t = Date.now();
        for (; Date.now() - t < e; ) {
          if (this._stopRequested || this._pauseRequested) return !1;
          let s = this._getAllQueryRoots();
          for (let n of s) {
            let o = n.querySelectorAll(C.CARD_ITEM);
            for (let u of o) if (this._isElementVisible(u)) return !0;
          }
          await m(500);
        }
        return !1;
      }
      _canGreet(e) {
        return e.buttonText
          ? e.buttonText.replace(/\s+/g, " ").trim() === C.GREET_BTN_TEXT
          : !1;
      }
      async _matchResumeLevel(e, t) {
        let s = { passed: !1, matchedKeywords: [], forbiddenHit: [] };
        if (!t || t.length === 0) return (s.passed = !0), s;
        let n = await this._openAndScanResume(e);
        if (!n)
          return (
            r(
              `[GreetingProcessor] \u65E0\u6CD5\u83B7\u53D6\u7B80\u5386\u6570\u636E: ${e.name}`,
            ),
            await this._closeDetail(),
            s
          );
        let o = this._executeKeywordMatch(n.toLowerCase(), t);
        return (
          (s.passed = o.passed),
          (s.matchedKeywords = o.matchedKeywords),
          (s.forbiddenHit = o.forbiddenHit),
          o.forbiddenHit.length > 0
            ? r(
                `[GreetingProcessor] \u7B80\u5386\u4E25\u7981\u8BCD\u547D\u4E2D: ${e.name}, \u4E25\u7981\u8BCD: ${o.forbiddenHit.join(", ")}`,
              )
            : o.passed
              ? r(
                  `[GreetingProcessor] \u7B80\u5386\u5339\u914D\u901A\u8FC7: ${e.name}, \u5173\u952E\u8BCD: ${o.matchedKeywords.join(", ")}`,
                )
              : r(
                  `[GreetingProcessor] \u7B80\u5386\u5339\u914D\u4E0D\u901A\u8FC7: ${e.name}`,
                ),
          await this._closeDetail(),
          s
        );
      }
      _findDetailRoot() {
        let e = [
            '.resume-detail-page, .resume-container, .geek-resume-wrap, [class*="resume-content"]',
            ".boss-popup .resume-layout-wrap, .boss-popup__wrapper, .boss-popup",
            ".boss-dialog__wrapper.dialog-lib-resume .resume-layout-wrap",
            ".boss-dialog__wrapper.dialog-lib-resume",
            ".dialog-lib-resume .resume-layout-wrap",
            ".resume-detail-wrap",
            ".resume-right-side",
            '[class*="resume"] [class*="popup"], [class*="resume"][class*="popup"]',
            '[class*="detail"] [class*="info"], [class*="detail"][class*="base"]',
          ],
          t = this._getAllQueryRoots();
        for (let s of t)
          for (let n of e)
            try {
              let o = s.querySelectorAll(n);
              for (let u of o)
                if (
                  u &&
                  u.nodeType === 1 &&
                  this._isElementVisible(u) &&
                  u.textContent.trim().length > 40
                )
                  return u;
            } catch {}
        return null;
      }
      async _openAndScanResume(e) {
        try {
          let t = (
            e.element.getAttribute("data-geekid") ||
            e.element.getAttribute("data-geek") ||
            ""
          ).trim();
          t &&
            window.postMessage(
              { type: "__BOSS_SET_CURRENT_CANDIDATE__", geekId: t },
              "*",
            ),
            await m(w(200, 400)),
            await this._humanClickElement(e.element),
            await m(w(500, 900));
          let s = this._findDetailRoot(),
            n = 0,
            o = 8;
          for (; !s && n < o; )
            await m(w(300, 500)), (s = this._findDetailRoot()), n++;
          if (!s) {
            r(
              `[GreetingProcessor] \u8BE6\u60C5\u5F39\u7A97\u672A\u5728 ${o} \u6B21\u8F6E\u8BE2\u540E\u51FA\u73B0\uFF0C\u4F7F\u7528\u5361\u7247\u6587\u672C\u515C\u5E95`,
            );
            let a = e.element.textContent.trim();
            return (
              r(
                "[GreetingProcessor] \u{1F4C4} \u5361\u7247\u6587\u672C\uFF08\u5F39\u7A97\u672A\u68C0\u6D4B\u5230\uFF09:",
                a.slice(0, 1e3),
              ),
              await this._closeDetail(),
              a.length > 0 ? a : null
            );
          }
          r(
            `[GreetingProcessor] \u8BE6\u60C5\u5F39\u7A97\u5DF2\u6253\u5F00\uFF08${n} \u6B21\u8F6E\u8BE2\uFF09`,
          ),
            await this._sleepWithTimeCheck(3e4),
            console.log(
              "[GreetingProcessor] \u{1F504} \u53D1\u9001 FLUSH \u4FE1\u53F7...",
            ),
            window.postMessage({ type: "__BOSS_FLUSH_PROBE__" }, "*"),
            await m(w(500, 800));
          let u = this._getCapturedResumeData;
          if (!u)
            return (
              console.log(
                "[GreetingProcessor] \u274C \u672A\u6CE8\u5165\u7B80\u5386\u6570\u636E API",
              ),
              await this._closeDetail(),
              null
            );
          let c = u();
          console.log(
            "[GreetingProcessor] \u{1F4CA} \u7B2C 1 \u6B21\u8BFB\u53D6 probeData keys:",
            Object.keys(c || {}),
            "__canvas_texts:",
            c.__canvas_texts?.length || 0,
            "\u6BB5",
          );
          let d = this._extractResumeText(c);
          if (!d) {
            for (let a = 0; a < 3; a++)
              if (
                (await m(w(800, 1200)),
                console.log(
                  `[GreetingProcessor] \u{1F504} \u7B2C ${a + 2} \u6B21 FLUSH\uFF08\u91CD\u8BD5\uFF09...`,
                ),
                window.postMessage({ type: "__BOSS_FLUSH_PROBE__" }, "*"),
                await m(w(500, 800)),
                (c = u()),
                console.log(
                  `[GreetingProcessor] \u{1F4CA} \u7B2C ${a + 2} \u6B21\u8BFB\u53D6 probeData keys:`,
                  Object.keys(c || {}),
                  "__canvas_texts:",
                  c.__canvas_texts?.length || 0,
                  "\u6BB5",
                ),
                (d = this._extractResumeText(c)),
                d)
              ) {
                console.log(
                  `[GreetingProcessor] \u2705 \u7B80\u5386\u6570\u636E\u5728\u7B2C ${a + 1} \u6B21\u91CD\u8BD5\u540E\u83B7\u53D6\u6210\u529F`,
                );
                break;
              }
          }
          if (!d) {
            let a = e.element.textContent.trim();
            return a.length > 0
              ? (r(
                  `[GreetingProcessor] \u4F7F\u7528\u5361\u7247\u6587\u672C\u515C\u5E95: ${e.name}`,
                ),
                r(
                  "[GreetingProcessor] \u{1F4C4} \u5361\u7247\u6587\u672C\uFF08\u63A2\u9488\u65E0\u6570\u636E\uFF09:",
                  a.slice(0, 1e3),
                ),
                a)
              : (r(
                  `[GreetingProcessor] \u65E0\u6CD5\u83B7\u53D6\u7B80\u5386\u6570\u636E: ${e.name}`,
                ),
                await this._closeDetail(),
                null);
          }
          return (
            r(`[GreetingProcessor] \u{1F4C4} ${e.name} \u89E3\u6790\u540E\u7B80\u5386\u6587\u672C:
${d}`),
            d
          );
        } catch (t) {
          return (
            A(
              "[GreetingProcessor] \u6253\u5F00\u7B80\u5386\u8BE6\u60C5\u5931\u8D25:",
              t.message,
            ),
            null
          );
        }
      }
      _extractResumeText(e) {
        let t = e.__canvas_texts || [];
        if (t.length > 0) {
          let s = t.join("");
          return (
            console.log(
              `[GreetingProcessor] \u{1F4C4} Canvas \u6587\u5B57\u83B7\u53D6\u6210\u529F: ${t.length} \u6BB5, \u5168\u90E8\u5185\u5BB9:
`,
              s,
            ),
            s
          );
        } else
          return (
            console.log(
              "[GreetingProcessor] \u26A0\uFE0F __canvas_texts \u4E3A\u7A7A, probeData keys:",
              Object.keys(e || {}),
            ),
            ""
          );
      }
      async _simulateMouseMove(e, t = 8) {
        if (!(!e || typeof e.getBoundingClientRect != "function"))
          try {
            let s = e.getBoundingClientRect(),
              n = s.left + s.width / 2 + w(-5, 5),
              o = s.top + s.height / 2 + w(-5, 5),
              u = window.innerWidth / 2 + w(-200, 200),
              c = window.innerHeight / 2 + w(-100, 100);
            for (let d = 1; d <= t; d++) {
              let a = d / t,
                l = 1 - Math.pow(1 - a, 1.8),
                f = u + (n - u) * l + w(-3, 3),
                _ = c + (o - c) * l + w(-3, 3);
              document.dispatchEvent(
                new MouseEvent("mousemove", {
                  clientX: f,
                  clientY: _,
                  bubbles: !0,
                  cancelable: !0,
                }),
              ),
                await m(w(40, 100));
            }
          } catch {}
      }
      _isDetailVisible() {
        if (this._findDetailRoot()) return !0;
        let e = this._getAllQueryRoots();
        for (let t of e)
          try {
            let s = t.querySelectorAll(
              SEL.page.POPUP_CLOSE,
            );
            for (let n of s)
              if (n.nodeType === 1 && this._isElementVisible(n)) return !0;
          } catch {}
        return !1;
      }
      async _closeDetail() {
        let t = new Set([
            "\u5173\u95ED",
            "\u6536\u8D77",
            "\u8FD4\u56DE",
            "\xD7",
            "x",
          ]),
          s = (o) => {
            o.preventDefault();
          },
          n = () => {
            setTimeout(
              () => window.removeEventListener("unhandledrejection", s),
              3e3,
            );
          };
        try {
          window.addEventListener("unhandledrejection", s);
          let o = (a) => {
              let l = (a.textContent || a.innerText || "").trim().toLowerCase(),
                f = String(a.className || ""),
                _ = String(a.getAttribute("aria-label") || ""),
                h = String(a.getAttribute("title") || ""),
                S = String(a.getAttribute("role") || "");
              return (
                t.has(l) ||
                /close|back/i.test(`${f} ${_} ${h}`) ||
                S === "button"
              );
            },
            u = () => {
              let a = this._getAllQueryRoots();
              for (let l of a) {
                for (let f of C.DETAIL_CLOSE.split(",").map((_) => _.trim()))
                  try {
                    let _ = l.querySelectorAll(f);
                    for (let h of _)
                      if (
                        h &&
                        h.nodeType === 1 &&
                        this._isElementVisible(h) &&
                        o(h)
                      )
                        return h;
                  } catch {}
                try {
                  let f = l.querySelectorAll(
                    SEL.page.POPUP_CLOSE_WIDE,
                  );
                  for (let _ of f) if (_.nodeType === 1 && o(_)) return _;
                } catch {}
              }
              return null;
            },
            c = async () => {
              let a = this._findAllInContexts(
                'button, a, span, div, i, svg, [role="button"], [class*="close"], [class*="Close"], [class*="popup"]',
              );
              for (let l of a) {
                if (!this._isElementVisible(l)) continue;
                let f = (l.textContent || l.innerText || "").trim(),
                  _ = String(l.className || "");
                if (
                  (t.has(f) || /close/i.test(_)) &&
                  (await this._humanClickElement(l),
                  await m(w(200, 400)),
                  !this._isDetailVisible())
                )
                  return !0;
              }
              return !1;
            },
            d = () => {
              let a = [],
                l = document.activeElement;
              if (
                (l?.ownerDocument && a.push(l.ownerDocument),
                a.includes(document) || a.push(document),
                window !== window.top)
              )
                try {
                  window.top?.document &&
                    !a.includes(window.top.document) &&
                    a.push(window.top.document);
                } catch {}
              if ((a.includes(window) || a.push(window), window !== window.top))
                try {
                  window.top && !a.includes(window.top) && a.push(window.top);
                } catch {}
              for (let f of a) {
                let _ = f instanceof Window ? f : f.defaultView || window,
                  h = f instanceof Window ? f.document : f,
                  S = {
                    key: "Escape",
                    code: "Escape",
                    bubbles: !0,
                    cancelable: !0,
                    view: _,
                  };
                h.dispatchEvent(new _.KeyboardEvent("keydown", S)),
                  h.dispatchEvent(new _.KeyboardEvent("keyup", S));
              }
            };
          for (let a = 0; a < 3; a++) {
            if (!this._isDetailVisible()) return !0;
            let l = u();
            if (l) {
              if (
                (await this._humanClickElement(l),
                await m(w(300, 500)),
                !this._isDetailVisible())
              )
                return !0;
              continue;
            }
            if ((d(), await m(w(300, 500)), !this._isDetailVisible()))
              return !0;
            let f = this._findInAllContexts(C.DETAIL_OVERLAY);
            if (
              (f &&
                this._isElementVisible(f) &&
                (await this._humanClickElement(f),
                await m(w(300, 500)),
                !this._isDetailVisible())) ||
              (await c())
            )
              return !0;
          }
          return d(), await m(300), !this._isDetailVisible();
        } finally {
          n();
        }
      }
      async _sendGreeting(e, t, s) {
        try {
          if (this._isDetailVisible())
              await this._closeDetail(),
              await m(w(300, 500));
          await this._ensureChatDialogClosed(3e3);
          let n =
            this._findAllInContexts(C.CARD_BUTTON).find((f) => {
              if (
                (f.textContent || "").replace(/\s+/g, " ").trim() !==
                C.GREET_BTN_TEXT
              )
                return !1;
              let h =
                f.closest("li.card-item") ||
                f.closest(".candidate-card-wrap");
              return (
                h &&
                (h.textContent.includes(e.name) ||
                  h
                    .querySelector("[data-geekid]")
                    ?.getAttribute("data-geekid") === e.geekId)
              );
            }) || null;
          if (
            (!n && e.buttonEl && e.buttonEl.isConnected && (n = e.buttonEl),
            !n)
          )
            return (
              A(
                `[GreetingProcessor] \u672A\u627E\u5230\u6253\u62DB\u547C\u6309\u94AE: ${e.name}`,
              ),
              !1
            );
          r(
            `[GreetingProcessor] \u7B2C1\u6B65\uFF1A\u70B9\u51FB"\u6253\u62DB\u547C"\u6309\u94AE - ${e.name}`,
          ),
            await this._simulateMouseMove(n),
            await m(w(100, 300)),
            await this._humanClickElement(n),
            await m(w(500, 900)),
            r(
              '[GreetingProcessor] \u7B2C2\u6B65\uFF1A\u7B49\u5F85"\u7EE7\u7EED\u6C9F\u901A"\u6309\u94AE\u51FA\u73B0',
            );
          let o = null;
          for (let l = 0; l < 20; l++)
            if (
              (await m(w(300, 500)),
              (o =
                this._findAllInContexts(C.CARD_BUTTON).find((_) => {
                  if (
                    (_.textContent || "").replace(/\s+/g, " ").trim() ===
                    C.GREET_BTN_TEXT
                  )
                    return !1;
                  let S =
                    _.closest("li.card-item") ||
                    _.closest(".candidate-card-wrap");
                  return S && S.textContent.includes(e.name);
                }) || null),
              o)
            ) {
              r(
                `[GreetingProcessor] \u627E\u5230"\u7EE7\u7EED\u6C9F\u901A"\u6309\u94AE\uFF0C\u7B2C ${l + 1} \u6B21\u8F6E\u8BE2`,
              );
              break;
            }
          if (!o)
            return (
              A(
                `[GreetingProcessor] \u672A\u627E\u5230"\u7EE7\u7EED\u6C9F\u901A"\u6309\u94AE\uFF0C\u5019\u9009\u4EBA: ${e.name}`,
              ),
              !1
            );
          r(
            '[GreetingProcessor] \u7B2C2\u6B65\uFF1A\u70B9\u51FB"\u7EE7\u7EED\u6C9F\u901A"\u6309\u94AE',
          ),
            await this._humanClickElement(o),
            await m(w(500, 1e3)),
            r(
              "[GreetingProcessor] \u7B2C3\u6B65\uFF1A\u7B49\u5F85\u804A\u5929\u7F16\u8F91\u5668",
            );
          let u = this._findChatEditor(),
            c = 0;
          for (; !u && c < 10; )
            await m(w(300, 500)), (u = this._findChatEditor()), c++;
          if (!u)
            return (
              A(
                "[GreetingProcessor] \u804A\u5929\u7F16\u8F91\u5668\u672A\u52A0\u8F7D\u6210\u529F",
              ),
              !1
            );
          r(
            `[GreetingProcessor] \u804A\u5929\u7F16\u8F91\u5668\u5DF2\u5C31\u7EEA\uFF08${c} \u6B21\u7B49\u5F85\uFF09`,
          );
          let d = this._findMessageComposer(),
            a = 0;
          for (; !(d && d.nodeType === 1) && a < 8; )
            await m(w(200, 400)), (d = this._findMessageComposer()), a++;
          if (!(d && d.nodeType === 1))
            return (
              A(
                "[GreetingProcessor] \u6D88\u606F\u8F93\u5165\u6846\u672A\u5C31\u7EEA",
              ),
              await this._closeChatEditor(),
              !1
            );
          r(
            `[GreetingProcessor] \u8F93\u5165\u6846\u5DF2\u5C31\u7EEA\uFF08${a} \u6B21\u7B49\u5F85\uFF09`,
          );
          for (let l = 0; l < t.length; l++) {
            let f = t[l];
            if (!(await this._fillComposerText(d, f))) {
              A(
                `[GreetingProcessor] \u586B\u5165\u7B2C ${l + 1}/${t.length} \u6761\u8BDD\u672F\u5931\u8D25`,
              );
              continue;
            }
            if (Z()) {
              r(
                `[DEV] \u{1F44B} \u5F00\u53D1\u6A21\u5F0F: \u5DF2\u586B\u5165\u7B2C ${l + 1}/${t.length} \u6761\u62DB\u547C\u6D88\u606F\uFF0C\u8DF3\u8FC7\u5B9E\u9645\u53D1\u9001: "${f.slice(0, 60)}..."`,
              );
              continue;
            }
            let h = await this._waitForSendButtonReady();
            if (!(h && h.nodeType === 1)) {
              A(
                `[GreetingProcessor] \u53D1\u9001\u7B2C ${l + 1}/${t.length} \u6761\u6D88\u606F\u65F6\u6309\u94AE\u672A\u5C31\u7EEA`,
              );
              continue;
            }
            if (
              (await m(w(250, 500)),
              await this._humanClickElement(h),
              r(
                `[GreetingProcessor] \u5DF2\u53D1\u9001\u7B2C ${l + 1}/${t.length} \u6761\u6D88\u606F: "${f.slice(0, 40)}..."`,
              ),
              l < t.length - 1)
            ) {
              let S = s / 1e3;
              this._sendRunningLog(
                `\u23F3 \u7B49\u5F85 ${S.toFixed(1)} \u79D2\u540E\u53D1\u9001\u4E0B\u4E00\u6761\u6D88\u606F\uFF08\u8FDE\u7EED\u53D1\u9001\u95F4\u9694\uFF09`,
              ),
                await m(s);
            } else await m(w(300, 600));
          }
          return (
            await this._closeChatEditor(),
            !0
          );
        } catch (n) {
          return (
            A(
              "[GreetingProcessor] \u53D1\u9001\u6253\u62DB\u547C\u5931\u8D25:",
              n.message,
            ),
            !1
          );
        }
      }
      async _ensureChatDialogClosed(e = 5e3) {
        let t = Date.now() + e;
        for (; Date.now() < t; ) {
          if (!this._findChatEditor()) return !0;
          await this._closeChatEditor(), await m(200);
        }
        return !this._findChatEditor();
      }
      _findChatEditor() {
        let e = document.querySelector(SEL.page.CHAT_GLOBAL_INPUT);
        if (e && e.nodeType === 1)
          return (
            e.closest(".conversation-global-editor") || e.parentElement || null
          );
        if (window !== window.top)
          try {
            let s = window.top.document.querySelector(
              SEL.page.CHAT_GLOBAL_INPUT,
            );
            if (s && s.nodeType === 1)
              return (
                s.closest(".conversation-global-editor") ||
                s.parentElement ||
                null
              );
          } catch {}
        return null;
      }
      _findMessageComposer(e) {
        if (e) {
          let s = e.querySelector(SEL.page.CHAT_GLOBAL_INPUT);
          if (s && s.nodeType === 1 && this._isComposerElement(s)) return s;
        }
        let t = document.querySelector(SEL.page.CHAT_GLOBAL_INPUT);
        if (t && t.nodeType === 1 && this._isComposerElement(t)) return t;
        if (window !== window.top)
          try {
            let s = window.top.document.querySelector(
              SEL.page.CHAT_GLOBAL_INPUT,
            );
            if (s && s.nodeType === 1 && this._isComposerElement(s)) return s;
          } catch {}
        for (let s of C.RECOMMEND_INPUT.split(",").map((n) => n.trim())) {
          let n = document.querySelector(s);
          if (n && n.nodeType === 1 && this._isComposerElement(n)) return n;
          if (window !== window.top)
            try {
              let o = window.top.document.querySelector(s);
              if (o && o.nodeType === 1 && this._isComposerElement(o)) return o;
            } catch {}
        }
      }
      _isComposerElement(e) {
        return !e || e.nodeType !== 1
          ? !1
          : !!(
              e.isContentEditable ||
              e.tagName === "TEXTAREA" ||
              e.tagName === "INPUT"
            );
      }
      async _waitForSendButtonReady() {
        let e = C.SEND_BUTTON.split(",").map((t) => t.trim());
        for (let t = 0; t < 8; t++) {
          let s = this._getAllQueryRoots();
          for (let n of s)
            for (let o of e)
              try {
                let u = n.querySelectorAll(o);
                for (let c of u)
                  if (c && c.nodeType === 1 && this._isElementVisible(c)) {
                    let d = (c.textContent || c.innerText || "").trim();
                    if (
                      (d.includes("\u53D1\u9001") ||
                        d.includes("\u63D0\u4EA4") ||
                        c.classList.contains("submit") ||
                        c.classList.contains("submit-content") ||
                        c.classList.contains("btn-send")) &&
                      !this._isSendButtonDisabled(c)
                    )
                      return c;
                  }
              } catch {}
          await m(w(300, 600));
        }
        return null;
      }
      _isSendButtonDisabled(e) {
        return (
          e.classList.contains("btn-disabled") ||
          e.classList.contains("disabled") ||
          e.getAttribute("disabled") !== null ||
          e.getAttribute("aria-disabled") === "true"
        );
      }
      async _fillComposerText(e, t) {
        if (!e || !t) return !1;
        try {
          if (e.tagName === "TEXTAREA" || e.tagName === "INPUT") {
            e.focus(),
              (e.value = ""),
              e.dispatchEvent(new Event("input", { bubbles: !0 }));
            for (let s of t)
              (e.value += s),
                e.dispatchEvent(
                  new InputEvent("input", {
                    bubbles: !0,
                    data: s,
                    inputType: "insertText",
                  }),
                ),
                await m(w(35, 90));
            return e.dispatchEvent(new Event("change", { bubbles: !0 })), !0;
          }
          if (e.isContentEditable) {
            await this._humanClickElement(e), await m(w(100, 200)), e.focus();
            let s = e.ownerDocument || document;
            try {
              let n = s.getSelection();
              n && n.selectAllChildren(e), s.execCommand("delete", !1);
            } catch {}
            for (let n of t)
              (e.textContent += n),
                e.dispatchEvent(
                  new InputEvent("input", {
                    bubbles: !0,
                    cancelable: !0,
                    data: n,
                    inputType: "insertText",
                  }),
                ),
                await m(w(35, 90));
            return e.dispatchEvent(new Event("change", { bubbles: !0 })), !0;
          }
          return !1;
        } catch (s) {
          return (
            A(
              "[GreetingProcessor] \u586B\u5165\u8BDD\u672F\u5F02\u5E38:",
              s.message,
            ),
            !1
          );
        }
      }
      async _closeChatEditor() {
        if (!this._findChatEditor()) return !0;
        let e = [
            ".iboss-close",
            ".boss-dialog__close",
            ".boss-dialog__wrapper .boss-dialog__close",
            ".chat-header .close",
            ".dialog-close",
            ".icon-close",
            ".bosschat-editor .close-btn",
            '[class*="chat"][class*="dialog"] [class*="close"]',
            '[class*="conversation"][class*="editor"] [class*="close"]',
            '.boss-dialog__wrapper button[class*="close"]',
            'button[aria-label*="\u5173\u95ED"]',
            'button[aria-label*="close"]',
            'button[title*="\u5173\u95ED"]',
            'button[title*="close"]',
          ],
          t = (c) => {
            let d = (c.textContent || "").trim().toLowerCase();
            return [
              "\u53D1\u9001",
              "\u53D1\u9001\u6D88\u606F",
              "\u6253\u62DB\u547C",
              "\u7EE7\u7EED\u6C9F\u901A",
              "\u63D0\u4EA4",
              "\u53D6\u6D88",
              "\u7B80\u5386",
            ].some((l) => d.includes(l));
          },
          s = (c) => {
            for (let d of e)
              try {
                let a = c.querySelectorAll(d);
                for (let l of a)
                  if (l.nodeType === 1 && this._isElementVisible(l) && !t(l))
                    return l;
              } catch {}
            return null;
          },
          n = async () => {
            let c = this._findChatEditor();
            if (!c) return !1;
            let d = c.closest(
              '.boss-dialog__wrapper, .bosschat-editor, [class*="dialog"]',
            );
            if (d) {
              let _ = s(d);
              if (_) return await this._humanClickElement(_), !0;
            }
            let a = c.ownerDocument || document,
              l = s(a);
            if (l) return await this._humanClickElement(l), !0;
            let f = this._getAllQueryRoots();
            for (let _ of f) {
              let h = s(_);
              if (h) return await this._humanClickElement(h), !0;
            }
            return !1;
          },
          o = async () => {
            let c = [],
              d = document.activeElement;
            if (
              (d?.ownerDocument && c.push(d.ownerDocument),
              c.includes(document) || c.push(document),
              window !== window.top)
            )
              try {
                window.top?.document &&
                  !c.includes(window.top.document) &&
                  c.push(window.top.document);
              } catch {}
            if ((c.includes(window) || c.push(window), window !== window.top))
              try {
                window.top && !c.includes(window.top) && c.push(window.top);
              } catch {}
            for (let a of c) {
              let l = a instanceof Window ? a : a.defaultView || window,
                f = a instanceof Window ? a.document : a,
                _ = {
                  key: "Escape",
                  code: "Escape",
                  bubbles: !0,
                  cancelable: !0,
                  view: l,
                };
              if (
                (f.dispatchEvent(new l.KeyboardEvent("keydown", _)),
                f.dispatchEvent(new l.KeyboardEvent("keyup", _)),
                await m(w(50, 100)),
                !this._findChatEditor())
              )
                return !0;
            }
            return !1;
          },
          u = async () => {
            let c = [
                ".boss-dialog__wrapper:not(.dialog-lib-resume) .boss-dialog__overlay",
                ".boss-dialog__overlay",
                ".el-overlay",
                ".modal-overlay",
                '[class*="overlay"]',
              ],
              d = this._getAllQueryRoots();
            for (let a of d)
              for (let l of c)
                try {
                  let f = a.querySelectorAll(l);
                  for (let _ of f)
                    if (
                      _.nodeType === 1 &&
                      this._isElementVisible(_) &&
                      (await this._humanClickElement(_),
                      await m(w(100, 200)),
                      !this._findChatEditor())
                    )
                      return !0;
                } catch {}
            return !1;
          };
        for (let c = 0; c < 3; c++) {
          if ((await n()) || (await o()) || (await u())) return !0;
          await m(w(200, 400));
        }
        return !this._findChatEditor();
      }
      _findScrollableContainer(e) {
        let t = this._getAllQueryRoots();
        for (let s of t)
          try {
            let n = s.querySelectorAll(e);
            for (let o of n)
              if (o.scrollHeight > o.clientHeight && this._isElementVisible(o))
                return o;
          } catch {}
        return null;
      }
      async _shortHumanPause(e = 200, t = 700) {
        let s = w(e, t);
        return await m(s), s;
      }
      _isEndOfListTextVisible() {
        let e = this._findScrollableContainer(C.CANDIDATE_LIST_SCROLL);
        if (e) {
          let s = (e.innerText || "").replace(/\s+/g, " ").trim();
          if (this._isLikelyEndOfListText(s)) return !0;
        }
        let t = this._getDocumentContexts();
        for (let s of t)
          try {
            let n = s.body?.innerText || "";
            if (n.length > 0) {
              let o = n.slice(-2e3).replace(/\s+/g, " ").trim();
              if (this._isLikelyEndOfListText(o)) return !0;
            }
          } catch {}
        return !1;
      }
      _isLikelyEndOfListText(e) {
        return [
          "\u6CA1\u6709\u66F4\u591A",
          "\u5230\u5E95\u4E86",
          "\u6682\u65E0\u66F4\u591A",
          "\u6CA1\u6709\u66F4\u591A\u725B\u4EBA",
          "\u5DF2\u7ECF\u5230\u5E95",
        ].some((s) => e.includes(s));
      }
      async _scrollForMore() {
        if (this._pauseRequested || this._stopRequested)
          return (
            r(
              "[GreetingProcessor] \u5DF2\u6682\u505C\u6216\u505C\u6B62\uFF0C\u8DF3\u8FC7\u6EDA\u52A8",
            ),
            !1
          );
        try {
          if (this._isEndOfListTextVisible())
            return (
              r(
                '[GreetingProcessor] \u68C0\u6D4B\u5230"\u6CA1\u6709\u66F4\u591A"\u6587\u672C\uFF0C\u5217\u8868\u5DF2\u5230\u5E95',
              ),
              !1
            );
          let e = this._findScrollableContainer(C.CANDIDATE_LIST_SCROLL),
            t = this._getDocumentScrollers().find(
              (_) => _.scrollHeight > _.clientHeight,
            );
          if (!t) {
            let _ = this._getDocumentContexts();
            for (let h of _) {
              try {
                if (h.body && h.body.scrollHeight > h.body.clientHeight) {
                  let p = (h.defaultView || window).getComputedStyle(h.body);
                  if (
                    p.overflowY === "scroll" ||
                    p.overflowY === "auto" ||
                    p.overflow === "scroll" ||
                    p.overflow === "auto"
                  ) {
                    (t = h.body),
                      r(
                        "[GreetingProcessor] \u66B4\u529B\u626B\u63CF\u627E\u5230 body \u4F5C\u4E3A\u6EDA\u52A8\u76EE\u6807",
                      );
                    break;
                  }
                }
                if (!t) {
                  let S = h.querySelectorAll("*");
                  for (let p of S)
                    if (p.scrollHeight > p.clientHeight + 2) {
                      let D = (h.defaultView || window).getComputedStyle(p);
                      if (
                        D.overflowY === "scroll" ||
                        D.overflowY === "auto" ||
                        D.overflow === "scroll" ||
                        D.overflow === "auto"
                      ) {
                        (t = p),
                          r(
                            "[GreetingProcessor] \u66B4\u529B\u626B\u63CF\u627E\u5230\u53EF\u6EDA\u52A8\u5143\u7D20: <" +
                              p.tagName.toLowerCase() +
                              "> \u4F5C\u4E3A\u6EDA\u52A8\u76EE\u6807",
                          );
                        break;
                      }
                    }
                }
              } catch {}
              if (t) break;
            }
          }
          let s = e || t || null;
          if (!s)
            return (
              r(
                "[GreetingProcessor] \u672A\u627E\u5230\u53EF\u6EDA\u52A8\u5BB9\u5668\uFF08scrollingElement \u65E0\u6EA2\u51FA\uFF09",
              ),
              !1
            );
          let n = s.scrollHeight,
            o = s.scrollTop,
            u = null;
          {
            let _ =
                SEL.card.CANDIDATE_LIST_SCROLL,
              h = this._getDocumentContexts();
            for (let S of h)
              try {
                if (((u = S.querySelector(_)), u)) break;
              } catch {}
          }
          let c = u ? u.scrollHeight : 0,
            d = Math.max(window.innerHeight * 0.5, 300),
            a = s.tagName.toLowerCase(),
            l =
              s.ownerDocument === document
                ? "main"
                : window.top && s.ownerDocument === window.top.document
                  ? "top"
                  : "iframe";
          if (
            (r(
              `[GreetingProcessor] \u6EDA\u52A8\u76EE\u6807: ${l}:<${a}>, scrollTop=${o}, scrollH=${n}, clientH=${s.clientHeight}, \u6EDA\u52A8\u8DDD\u79BB=${d}`,
            ),
            s.scrollBy({ top: d, behavior: "smooth" }),
            await m(w(100, 200)),
            s.scrollTop <= o && (s.scrollTop = o + d),
            s.scrollTop <= o && s.ownerDocument)
          )
            try {
              s.ownerDocument.documentElement.scrollTop = o + d;
            } catch {}
          try {
            s.dispatchEvent(
              new UIEvent("scroll", { bubbles: !0, cancelable: !0 }),
            );
          } catch {}
          if (
            (await this._shortHumanPause(700, 1100),
            this._isEndOfListTextVisible())
          )
            return (
              r(
                '[GreetingProcessor] \u6EDA\u52A8\u540E\u68C0\u6D4B\u5230"\u6CA1\u6709\u66F4\u591A"\u6587\u672C\uFF0C\u5217\u8868\u5DF2\u5230\u5E95',
              ),
              !1
            );
          let f = s.scrollTop;
          if (f > o + 10)
            return (
              r(
                `[GreetingProcessor] scrollTop \u5DF2\u79FB\u52A8: ${o} -> ${f}`,
              ),
              !0
            );
          if (s.scrollHeight > n)
            return (
              r(
                "[GreetingProcessor] scrollTarget scrollHeight \u5DF2\u589E\u957F",
              ),
              !0
            );
          if (u && u.scrollHeight > c)
            return (
              r(
                "[GreetingProcessor] \u5361\u7247\u5217\u8868\u5BB9\u5668 scrollHeight \u5DF2\u589E\u957F\uFF0C\u65B0\u5185\u5BB9\u52A0\u8F7D\u6210\u529F",
              ),
              !0
            );
          for (let _ = 0; _ < 8; _++) {
            if ((await m(w(500, 700)), this._isEndOfListTextVisible()))
              return (
                r(
                  '[GreetingProcessor] \u8F6E\u8BE2\u4E2D\u68C0\u6D4B\u5230"\u6CA1\u6709\u66F4\u591A"\u6587\u672C\uFF0C\u5217\u8868\u5DF2\u5230\u5E95',
                ),
                !1
              );
            if (s.scrollTop > o + 10)
              return (
                r(
                  `[GreetingProcessor] \u8F6E\u8BE2 ${_ + 1} \u6B21\u540E scrollTop \u79FB\u52A8`,
                ),
                !0
              );
            if (s.scrollHeight > n)
              return (
                r(
                  `[GreetingProcessor] \u8F6E\u8BE2 ${_ + 1} \u6B21\u540E scrollTarget scrollHeight \u589E\u957F`,
                ),
                !0
              );
            if (u && u.scrollHeight > c)
              return (
                r(
                  `[GreetingProcessor] \u8F6E\u8BE2 ${_ + 1} \u6B21\u540E\u5361\u7247\u5217\u8868\u5BB9\u5668 scrollHeight \u589E\u957F`,
                ),
                !0
              );
          }
          return (
            r(
              "[GreetingProcessor] \u6EDA\u52A8\u540E\u65E0\u65B0\u5185\u5BB9\u52A0\u8F7D\uFF0C\u53EF\u80FD\u5DF2\u5230\u5E95",
            ),
            !1
          );
        } catch (e) {
          return (
            A(
              "[GreetingProcessor] \u6EDA\u52A8\u64CD\u4F5C\u5F02\u5E38\uFF08\u5DF2\u9694\u79BB\uFF09:",
              e?.message || e,
            ),
            !1
          );
        }
      }
      _isElementVisible(e) {
        if (!e || e.nodeType !== 1) return !1;
        try {
          let s = (e.ownerDocument?.defaultView || window).getComputedStyle(e);
          if (s.display === "none" || s.visibility === "hidden") return !1;
          let n = e.getBoundingClientRect();
          return n.width > 0 && n.height > 0;
        } catch {
          if (!e.offsetParent && e.offsetParent !== void 0) return !1;
          let s = e.getBoundingClientRect();
          return s.width > 0 && s.height > 0;
        }
      }
      async _sleepWithTimeCheck(e) {
        for (let s = 0; s < e && !this._stopRequested; s += 5e3) {
          if (this._pauseRequested) {
            if ((await this._waitWhilePaused(), this._stopRequested)) break;
            continue;
          }
          if (this._checkAndHandleTimeLimits()) {
            if ((await this._waitWhilePaused(), this._stopRequested)) break;
            continue;
          }
          await m(Math.min(5e3, e - s));
        }
      }
      async _waitWhilePaused() {
        for (; this._pauseRequested && !this._stopRequested; ) await m(500);
      }
      _emitStatus(e, t) {
        this._onStatusReport(e, t || "");
      }
    };
  var ce = class {
    constructor() {
      this.histories = new Map();
    }
    hasHistory(e) {
      return this.histories.has(e);
    }
    buildInitialHistory(e, t) {
      let s = t
        .filter((n) => n.body && n.body.text)
        .map((n) => ({
          sender: "candidate",
          content: n.body.text,
          time: n.time || Date.now(),
        }));
      this.histories.set(e, s);
    }
    buildFromApi(e, t) {
      let s = t.map((n) => ({
        sender: n.from && n.from.uid === e ? "candidate" : "hr",
        content: (n.body && n.body.text) || "",
        time: n.time || Date.now(),
      }));
      this.histories.set(e, s);
    }
    appendMessages(e, t) {
      this.histories.has(e) || this.histories.set(e, []);
      let s = this.histories.get(e),
        n = t.map((o) =>
          o.body
            ? {
                sender: "candidate",
                content: o.body.text || "",
                time: o.time || Date.now(),
              }
            : o,
        );
      s.push(...n), s.sort((o, u) => (o.time || 0) - (u.time || 0));
    }
    getFullHistory(e, t = 0) {
      let s = this.histories.get(e) || [];
      return t > 0 && s.length > t ? s.slice(-t) : s;
    }
    clearUser(e) {
      this.histories.delete(e);
    }
    clearAll() {
      this.histories.clear();
    }
    getAllHistories() {
      let e = [];
      for (let [t, s] of this.histories) {
        let n = s.map((o) => ({
          sender: o.sender,
          content: o.content,
          time: o.time,
          preview: o.content.slice(0, 80),
        }));
        e.push({
          uid: t,
          messageCount: s.length,
          startTime: s[0]?.time || 0,
          endTime: s[s.length - 1]?.time || 0,
          messages: n,
        });
      }
      return e.sort((t, s) => s.endTime - t.endTime), e;
    }
  };
  var le = class {
    constructor() {
      (this.fingerprints = new Set()), (this.order = []);
    }
    isDuplicate(e) {
      let t;
      if (e.mid) t = `mid_${e.mid}`;
      else if (e.body && e.from)
        t = Ee(e.from.uid, e.body.text || "", e.time || Date.now());
      else return !1;
      if (this.fingerprints.has(t)) return !0;
      if (
        (this.fingerprints.add(t), this.order.push(t), this.order.length > pe)
      ) {
        let s = this.order.shift();
        this.fingerprints.delete(s);
      }
      return !1;
    }
    reset() {
      this.fingerprints.clear(), (this.order = []);
    }
  };
  r(
    "[CS] \u5185\u5BB9\u811A\u672C\u5DF2\u52A0\u8F7D\uFF0C\u65F6\u95F4:",
    new Date().toISOString(),
  );
  Te((i, ...e) => {
    try {
      chrome.runtime
        .sendMessage({
          action: M.DEV_LOG,
          data: { level: i, message: he(e), time: Date.now() },
        })
        .catch(() => {});
    } catch {}
  });
  Fe(() => Q);
  var Ve = new ce(),
    Qe = new le(),
    x = null,
    U = null,
    je = !1,
    ge = null,
    z = !1,
    Y = [],
    Q = {};
  window.addEventListener("message", (i) => {
    if (i.source !== window) return;
    if (i.data?.type === "__BOSS_MAIN_WORLD_DATA" && i.data?.data) {
      let e = i.data.data;
      e.__canvas_texts &&
        console.log(
          "[Index] \u{1F4E9} \u6536\u5230 __canvas_texts:",
          e.__canvas_texts.length,
          "\u6BB5",
        );
      for (let t of Object.keys(e)) {
        let s = Q[t],
          n = e[t];
        (Array.isArray(n) &&
          Array.isArray(s) &&
          n.length === 0 &&
          s.length > 0) ||
          (Q[t] = n);
      }
      Q.__canvas_texts &&
        console.log(
          "[Index] \u2705 capturedResumeData.__canvas_texts:",
          Q.__canvas_texts.length,
          "\u6BB5",
        );
    }
  });
  function kt() {
    return Q;
  }
  function qt(i) {
    window.postMessage(
      { type: "__BOSS_SET_CURRENT_CANDIDATE__", geekId: String(i) },
      "*",
    );
  }
  function Ut() {
    window.postMessage({ type: "__BOSS_FLUSH_PROBE__" }, "*");
  }
  const __BOSS_BRIDGE_TOKEN = (() => {
    try {
      let i = new Uint32Array(4);
      return (
        crypto.getRandomValues(i),
        Array.from(i, (e) => e.toString(36)).join("")
      );
    } catch {
      return String(Date.now()) + String(Math.floor(1e9 * Math.random()));
    }
  })();
  function __postBridgeToken() {
    window.postMessage(
      {
        source: "BOSS_PLUGIN_CS",
        type: "BOSS_BRIDGE_TOKEN",
        token: __BOSS_BRIDGE_TOKEN,
      },
      "*",
    );
  }
  __postBridgeToken();
  let __bridgeTokenSends = 0;
  const __bridgeTokenTimer = setInterval(() => {
    ++__bridgeTokenSends >= 6
      ? clearInterval(__bridgeTokenTimer)
      : __postBridgeToken();
  }, 700);
  function __isValidMqttMsg(i) {
    let e = i && i.from,
      t = i && i.body;
    if (!e || !t) return !1;
    let s = e.uid;
    if (typeof s != "number" && !(typeof s == "string" && /^\d+$/.test(s)))
      return !1;
    if (typeof t.type != "number") return !1;
    let n = t.text ?? t.headTitle ?? "";
    return typeof n == "string" && n.length <= 4e3;
  }
  function me(i) {
    if (z || i.source !== window) return;
    if (i.origin !== location.origin) return;
    let e = i.data;
    if (!e || e.source !== "BOSS_PLUGIN_INJECT" || e.token !== __BOSS_BRIDGE_TOKEN)
      return;
    if (e.type === "MQTT_MESSAGE") {
        let t = e.data;
        if (
          t &&
          t.messages &&
          Array.isArray(t.messages) &&
          t.messages.length > 0 &&
          t.messages.length <= 50
        ) {
          r(
            `[CS] \u6536\u5230 MQTT \u8D1F\u8F7D: ${t.messages.length} \u6761\u6D88\u606F, version=${t.version}`,
          );
          for (let s of t.messages) {
            if (!__isValidMqttMsg(s)) continue;
            x ? x.enqueueMessage(s) : Y.push(s);
          }
        }
      } else
        e.type === "HOOK_STATUS"
          ? ((je = e.data.success),
            r(
              `[CS] MQTT Hook: ${e.data.method} \u2014 ${e.data.success ? "\u6210\u529F" : "\u5931\u8D25"}`,
            ))
          : e.type === "BOSS_SEND_MESSAGE" &&
            x &&
            x.recordBossMessage &&
            x.recordBossMessage(e.data);
  }
  window.addEventListener("message", me);
  function W() {
    z ||
      ((z = !0),
      r("[CS] \u6267\u884C\u5173\u95ED..."),
      window.postMessage(
        { source: "BOSS_PLUGIN_CS", type: "DISABLE_BOSS_LISTENER" },
        "*",
      ),
      window.removeEventListener("message", me),
      x && (x.stop(), (x = null)),
      ge && (ge.stop(), (ge = null)),
      (Y = []),
      r("[CS] \u5DF2\u5B8C\u5168\u5173\u95ED"));
  }
  function Xe() {
    U && (U.stop(), (U = null)),
      r("[CS] \u6253\u62DB\u547C\u5904\u7406\u5668\u5DF2\u5173\u95ED");
  }
  function X(i) {
    return (
      i &&
      (i.message?.includes("Extension context invalidated") ||
        i.message?.includes("Extension context") ||
        i.message?.includes("context invalidated"))
    );
  }
  // 岗位开关热更（2026-09-02 补 F2 发射跳断点）：job-list 开关/编辑页/删除/复制都是直写 storage、
  // 不走 cmd_save_config，CS_CONFIG_UPDATED 到不了——唯一覆盖一切写入方的触发点是 CS 直听 storage.onChanged。
  // 范围签名（_scopeSig）不变则 refreshReplyScope 内部直接返回，无关写入不会惊动计划。
  chrome.storage.onChanged.addListener((i, e) => {
    "local" === e &&
      (Object.prototype.hasOwnProperty.call(i, L.JOB_CONFIGS) ||
        Object.prototype.hasOwnProperty.call(i, L.REPLY_POSITION_CONFIGS)) &&
      (async () => {
        await ee();
        x && (await x.refreshReplyScope());
      })();
  });
  chrome.runtime.onMessage.addListener(async (i, e, t) => {
    try {
      let s = await ze(i);
      t(s);
    } catch (s) {
      t({ error: s.message });
    }
    return !0;
  });
  async function ze(i) {
    if (z && i.action !== M.CS_START)
      return { ok: !1, error: "\u5185\u5BB9\u811A\u672C\u5DF2\u5173\u95ED" };
    switch (i.action) {
      case M.CS_START:
        return Ze(i.data);
      case M.CS_DEBUG_INSPECT_GREET:
        return (function () {
          try {
            const txt = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
            const cls = (el) => String(el.className || "");
            const GREET_RE = /打招呼|立即沟通|继续沟通|发消息|换简历|感兴趣|要电话|沟通/;
            const docs = [document];
            try {
              document.querySelectorAll("iframe").forEach((f) => {
                try { if (f.contentDocument && f.contentDocument.body) docs.push(f.contentDocument); } catch (e) {}
              });
            } catch (e) {}
            const frames = docs.map((doc, fi) => {
              const q = (sel) => { try { return Array.from(doc.querySelectorAll(sel)); } catch (e) { return []; } };
              const info = { frame: fi, isTop: doc === document };
              info.cardItemHits = q("li.card-item, .candidate-card-wrap, .card-inner.common-wrap[data-geekid]").length;
              info.geekAttrHits = q("[data-geekid],[data-geek],[data-uid],[data-encrypt-id],[data-geek-id]").length;
              info.greetButtons = q('button, a, [role="button"], [class*="btn"], [class*="button"]')
                .map((el) => ({ el, t: txt(el) }))
                .filter((x) => x.t && x.t.length <= 12 && GREET_RE.test(x.t))
                .slice(0, 8)
                .map((x) => ({ tag: x.el.tagName, text: x.t, cls: cls(x.el).slice(0, 60) }));
              const cardClsFreq = {};
              q('button, a, [role="button"], [class*="btn"]').forEach((b) => {
                const t = txt(b);
                if (!t || t.length > 12 || !GREET_RE.test(t)) return;
                const anc = b.closest("li") || b.closest('[class*="card"]') || b.closest('[class*="item"]') || b.parentElement;
                if (anc) { const c = cls(anc).trim().split(/\s+/)[0]; if (c && c.length < 50) cardClsFreq[c] = (cardClsFreq[c] || 0) + 1; }
              });
              info.cardContainers = Object.entries(cardClsFreq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c, n]) => ({ cls: c, count: n }));
              const freq = {};
              q('li, [class*="card"], [class*="item"], [class*="geek"], [class*="recommend"]').forEach((el) => {
                const c = cls(el).trim().split(/\s+/)[0]; if (c && c.length < 40) freq[c] = (freq[c] || 0) + 1;
              });
              info.topCls = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c, n]) => ({ cls: c, count: n }));
              return info;
            });
            const iframes = (function () {
              try {
                return Array.from(document.querySelectorAll("iframe")).map((f) => {
                  let sameOrigin = !1;
                  try { sameOrigin = !!(f.contentDocument && f.contentDocument.body); } catch (e) {}
                  return { src: (f.src || "").slice(0, 80), cls: String(f.className || "").slice(0, 40), sameOrigin };
                });
              } catch (e) { return []; }
            })();
            return { ok: !0, url: location.href, frameCount: frames.length, iframes, frames };
          } catch (err) {
            return { ok: !1, error: err.message };
          }
        })();
      case M.CS_PAUSE:
        return x && x.pause(), r("[CS] \u5DF2\u6682\u505C"), { ok: !0 };
      case M.CS_RESUME:
        return x && x.resume(), r("[CS] \u5DF2\u6062\u590D"), { ok: !0 };
      case M.CS_STOP:
        return W(), { ok: !0 };
      case M.CS_START_GREETING:
        return et(i.data);
      case M.CS_PAUSE_GREETING:
        return (
          U && U.pause(),
          r("[CS] \u6253\u62DB\u547C\u5DF2\u6682\u505C"),
          { ok: !0 }
        );
      case M.CS_RESUME_GREETING:
        return (
          U && U.resume(),
          r("[CS] \u6253\u62DB\u547C\u5DF2\u6062\u590D"),
          { ok: !0 }
        );
      case M.CS_STOP_GREETING:
        return Xe(), { ok: !0 };
      case M.CS_SKIP_GREETING_JOB:
        return (
          U && U.skipCurrentJob(),
          r("[CS] \u6253\u62DB\u547C\u8DF3\u8FC7\u5F53\u524D\u5C97\u4F4D"),
          { ok: !0 }
        );
      case M.CS_CONFIG_UPDATED: {
        let e = await ee();
        return (
          oe(!!e.devMode),
          x && (await x.refreshReplyScope()),
          window.postMessage(
            {
              source: "BOSS_PLUGIN_CS",
              type: "DEV_MODE",
              enabled: !!e.devMode,
            },
            "*",
          ),
          r("[CS] \u914D\u7F6E\u5DF2\u66F4\u65B0"),
          { ok: !0 }
        );
      }
      case M.CS_CLEAR_SESSION_GOALS: {
        let e = i.data?.uid;
        return (
          e &&
            x &&
            (x.clearSessionGoals(e),
            r(
              `[CS] \u5DF2\u6E05\u7A7A uid=${e} \u7684\u4F1A\u8BDD\u76EE\u6807\u72B6\u6001`,
            )),
          { ok: !0 }
        );
      }
      case M.CS_GET_STATE:
        return x ? { state: x.state } : { state: E.IDLE };
      case M.CS_DEV_QUEUE:
        return x
          ? {
              running: !0,
              queues: x.getDebugState(),
              histories: Ve.getAllHistories(),
            }
          : { queues: [], histories: [], running: !1 };
      case M.CS_NAVIGATE_RECOMMEND:
        return (
          r(
            '[CS] \u6267\u884C\u5BFC\u822A\u5230\u63A8\u8350\u9875\u9762\uFF08\u70B9\u51FB"\u63A8\u8350\u725B\u4EBA"\u83DC\u5355\uFF09...',
          ),
          await Ne(),
          r("[CS] \u5BFC\u822A\u5230\u63A8\u8350\u9875\u9762\u5B8C\u6210"),
          { ok: !0 }
        );
      case M.CS_DEBUG_SCROLL_TEST: {
        r(
          "[CS] \u6267\u884C\u6DF1\u5EA6\u6EDA\u52A8\u5BB9\u5668\u8BCA\u65AD...",
        );
        try {
          let t = function (g) {
              if (!g) return "null";
              if (g === document) return "main";
              if (window.top?.document && g === window.top.document)
                return "top";
              for (let T of document.querySelectorAll("iframe"))
                try {
                  if (T.contentDocument === g)
                    return "iframe:" + (T.name || T.id || "?");
                } catch {}
              return "iframe:?";
            },
            s = function (g, T) {
              if (!g || g.nodeType !== 1) return !1;
              try {
                let P = (
                  T ||
                  g.ownerDocument?.defaultView ||
                  window
                ).getComputedStyle(g);
                if (P.display === "none" || P.visibility === "hidden")
                  return !1;
                let I = g.getBoundingClientRect();
                return I.width > 0 && I.height > 0;
              } catch {
                return !1;
              }
            },
            e = new K({}),
            n = await e._scrollForMore(),
            o = !!e._findScrollableContainer(
              SEL.card.CANDIDATE_LIST_SCROLL,
            ),
            u = e._isEndOfListTextVisible(),
            c = e._getDocumentContexts(),
            a =
              '.recommend-list, .card-list, .candidate-list, [class*="list-wrap"], [class*="candidate-list"], [class*="geek-list"], .user-list, .chat-list, .friend-list, .session-list, [class*="user-list"], [class*="conversation-list"], [class*="session-list"], [class*="chat-list"]'
                .split(",")
                .map((g) => g.trim()),
            l = [];
          for (let g of c) {
            let T = t(g);
            for (let R of a)
              try {
                let P = g.querySelectorAll(R);
                for (let I of P)
                  try {
                    let H = g.defaultView || window,
                      O = H.getComputedStyle(I),
                      y = I.getBoundingClientRect(),
                      N = s(I, H);
                    l.push({
                      doc: T,
                      selector: R,
                      tag: I.tagName.toLowerCase(),
                      id: I.id || "",
                      class: (I.className || "").slice(0, 80),
                      overflowY: O.overflowY,
                      overflow: O.overflow,
                      height: O.height,
                      maxHeight: O.maxHeight,
                      scrollHeight: I.scrollHeight,
                      clientHeight: I.clientHeight,
                      scrollTop: Math.round(I.scrollTop),
                      rectW: Math.round(y.width),
                      rectH: Math.round(y.height),
                      isVisible: N,
                      canScroll: I.scrollHeight > I.clientHeight + 2,
                      canScrollWithOverflow:
                        I.scrollHeight > I.clientHeight + 2 &&
                        (O.overflowY === "auto" ||
                          O.overflowY === "scroll" ||
                          O.overflow === "auto" ||
                          O.overflow === "scroll"),
                    });
                  } catch {}
              } catch {}
          }
          let f = [],
            _ = new Set();
          for (let g of c)
            try {
              let T = g.querySelectorAll("*");
              for (let R of T)
                if (!_.has(R)) {
                  _.add(R);
                  try {
                    if (R.scrollHeight > R.clientHeight + 2) {
                      let P = g.defaultView || window,
                        I = P.getComputedStyle(R),
                        H = I.overflowY,
                        O = I.overflowX,
                        y = I.overflow;
                      if (
                        H === "auto" ||
                        H === "scroll" ||
                        O === "auto" ||
                        O === "scroll" ||
                        y === "auto" ||
                        y === "scroll"
                      ) {
                        let N = R.getBoundingClientRect();
                        f.push({
                          doc: t(g),
                          tag: R.tagName.toLowerCase(),
                          id: R.id || "",
                          class: (R.className || "").slice(0, 60),
                          overflowY: H,
                          overflowX: O,
                          scrollHeight: R.scrollHeight,
                          clientHeight: R.clientHeight,
                          rectW: Math.round(N.width),
                          rectH: Math.round(N.height),
                          isVisible: s(R, P),
                        });
                      }
                    }
                  } catch {}
                }
            } catch {}
          let h = [],
            S = document.querySelectorAll("iframe");
          for (let g of S)
            try {
              let T = g.contentDocument,
                R = window.getComputedStyle(g.parentElement || g.parentNode),
                P = g.closest(".frame-box"),
                I = g.closest(".alive-frame-wrap");
              h.push({
                src: (g.src || "").slice(0, 120),
                name: g.name || "",
                id: g.id || "",
                accessible: !!T?.body,
                loaded: T?.readyState === "complete",
                iframeW: g.clientWidth,
                iframeH: g.clientHeight,
                parentTag: g.parentElement?.tagName?.toLowerCase() || "",
                parentH: g.parentElement?.clientHeight || 0,
                parentStyleOverflow: R.overflow,
                parentStyleOverflowY: R.overflowY,
                frameBoxH: P?.clientHeight || 0,
                frameBoxOverflowY: P
                  ? window.getComputedStyle(P).overflowY
                  : "",
                aliveWrapH: I?.clientHeight || 0,
                aliveWrapOverflowY: I
                  ? window.getComputedStyle(I).overflowY
                  : "",
                aliveWrapMaxH: I ? window.getComputedStyle(I).maxHeight : "",
                docScrollH: T?.documentElement?.scrollHeight || 0,
                docClientH: T?.documentElement?.clientHeight || 0,
                bodyScrollH: T?.body?.scrollHeight || 0,
                bodyClientH: T?.body?.clientHeight || 0,
              });
            } catch (T) {
              h.push({
                src: (g.src || "").slice(0, 120),
                id: g.id || g.name || "",
                accessible: !1,
                error: T.message,
              });
            }
          let p = [];
          for (let g of h)
            g.accessible &&
              (g.docClientH > 0 &&
                g.docScrollH > g.docClientH &&
                g.aliveWrapOverflowY !== "auto" &&
                g.aliveWrapOverflowY !== "scroll" &&
                p.push(
                  "\u{1F534} iframe\u300C" +
                    (g.name || g.id || g.src) +
                    "\u300D\u5185\u90E8\u6587\u6863\u53EF\u6EDA\u52A8(scrollH=" +
                    g.docScrollH +
                    " > clientH=" +
                    g.docClientH +
                    ')\uFF0C\u4F46\u5916\u5C42 .alive-frame-wrap overflowY="' +
                    g.aliveWrapOverflowY +
                    '"\uFF0C\u672A\u5F00\u542F\u6EDA\u52A8',
                ),
              g.docScrollH > g.docClientH &&
                g.aliveWrapH > 0 &&
                g.aliveWrapH >= g.docScrollH &&
                p.push(
                  "\u{1F7E2} iframe\u300C" +
                    (g.name || g.id || g.src) +
                    "\u300D\u5916\u5C42\u5BB9\u5668\u9AD8\u5EA6(" +
                    g.aliveWrapH +
                    ")\u8DB3\u591F\u5BB9\u7EB3\u5185\u5BB9(" +
                    g.docScrollH +
                    ")\uFF0C\u7406\u8BBA\u4E0A\u4E0D\u9700\u8981\u6EDA\u52A8",
                ),
              g.docScrollH > g.docClientH &&
                g.aliveWrapH > 0 &&
                g.aliveWrapH < g.docScrollH &&
                p.push(
                  "\u{1F7E1} iframe\u300C" +
                    (g.name || g.id || g.src) +
                    "\u300D\u5916\u5C42\u5BB9\u5668\u9AD8\u5EA6(" +
                    g.aliveWrapH +
                    ") < \u5185\u90E8\u5185\u5BB9\u9AD8\u5EA6(" +
                    g.docScrollH +
                    ")\uFF0C\u9700\u8981 overflow \u624D\u80FD\u6EDA\u52A8",
                ));
          let b = l.filter((g) => g.isVisible),
            D = b.filter((g) => g.canScrollWithOverflow);
          if (D.length > 0)
            p.push(
              "\u{1F7E2} \u627E\u5230 " +
                D.length +
                " \u4E2A\u53EF\u89C1\u4E14\u53EF\u6EDA\u52A8\u7684\u5019\u9009\u5BB9\u5668",
            );
          else if (b.length > 0) {
            for (let T of b)
              T.canScroll && !T.canScrollWithOverflow
                ? p.push(
                    "\u{1F7E1} \u5BB9\u5668 #" +
                      (T.id || T.tag + "." + (T.class || "")) +
                      " \u5185\u5BB9\u6EA2\u51FA(scrollH=" +
                      T.scrollHeight +
                      " > clientH=" +
                      T.clientHeight +
                      ') \u4F46 overflowY="' +
                      T.overflowY +
                      '"\uFF0C\u9700\u6539\u4E3A auto \u624D\u80FD\u6EDA\u52A8',
                  )
                : T.canScroll ||
                  p.push(
                    "\u{1F534} \u5BB9\u5668 #" +
                      (T.id || T.tag + "." + (T.class || "")) +
                      " \u5185\u5BB9\u672A\u6EA2\u51FA(scrollH=" +
                      T.scrollHeight +
                      " <= clientH=" +
                      T.clientHeight +
                      ")\uFF0C\u4E0D\u80FD\u6EDA\u52A8",
                  );
            b.some((T) => T.canScroll) ||
              p.push(
                "\u{1F534} \u6240\u6709\u53EF\u89C1\u5019\u9009\u5BB9\u5668\u7684 scrollHeight <= clientHeight\uFF0C\u5185\u5BB9\u672A\u6EA2\u51FA\uFF0C\u6682\u65F6\u4E0D\u9700\u8981\u6EDA\u52A8",
              );
          } else {
            p.push(
              "\u{1F534} \u6240\u6709\u5019\u9009\u9009\u62E9\u5668\u5747\u672A\u5339\u914D\u5230\u53EF\u89C1\u5BB9\u5668",
            );
            for (let g of c)
              try {
                let T = g.documentElement;
                if (T && T.scrollHeight > T.clientHeight + 2) {
                  let P = (g.defaultView || window).getComputedStyle(T);
                  p.push(
                    "\u{1F7E1} \u6587\u6863 " +
                      t(g) +
                      " \u7684 documentElement \u53EF\u6EDA\u52A8(scrollH=" +
                      T.scrollHeight +
                      ", clientH=" +
                      T.clientHeight +
                      '), overflowY="' +
                      P.overflowY +
                      '"',
                  );
                }
              } catch {}
          }
          f.length > 0 &&
            p.push(
              "\u2139\uFE0F \u66B4\u529B\u626B\u63CF\u53D1\u73B0 " +
                f.length +
                " \u4E2A\u53EF\u6EDA\u52A8\u5143\u7D20\uFF08\u53EF\u80FD\u542B\u65E0\u5173\u5143\u7D20\uFF09",
            );
          let v = e._getDocumentScrollers();
          if (v.length > 0) {
            p.push(
              "\u2139\uFE0F _getDocumentScrollers() \u8FD4\u56DE " +
                v.length +
                " \u4E2A\u5143\u7D20:",
            );
            for (let g of v) {
              let T =
                  g.ownerDocument === document
                    ? "main"
                    : window.top && g.ownerDocument === window.top.document
                      ? "top"
                      : "iframe",
                R = g.tagName.toLowerCase(),
                P = g.id
                  ? "#" + g.id
                  : g.className && typeof g.className == "string"
                    ? "." + g.className.split(" ")[0]
                    : "",
                I = T + ":" + R + P,
                H =
                  "scrollH=" +
                  g.scrollHeight +
                  ", clientH=" +
                  g.clientHeight +
                  ", overflowY=" +
                  (g.ownerDocument?.defaultView?.getComputedStyle(g)
                    ?.overflowY || "?");
              p.push("  - " + I + " (" + H + ")");
            }
          } else
            p.push(
              "\u{1F534} _getDocumentScrollers() \u8FD4\u56DE\u7A7A\u6570\u7EC4\uFF01",
            );
          let G = l.some((g) => g.isVisible && g.canScroll);
          o && !G
            ? p.push(
                "\u26A0\uFE0F \u5019\u9009\u5217\u8868\u9009\u62E9\u5668\u627E\u5230\u5BB9\u5668\uFF0C\u4F46\u7EFC\u5408\u9009\u62E9\u5668\u672A\u5339\u914D\u5230\u53EF\u6EDA\u52A8\u7684\u5019\u9009\u5BB9\u5668",
              )
            : !o &&
              G &&
              p.push(
                "\u{1F7E1} \u7EFC\u5408\u9009\u62E9\u5668\u627E\u5230\u53EF\u6EDA\u52A8\u5BB9\u5668\uFF0C\u4F46\u5019\u9009\u5217\u8868\u9009\u62E9\u5668\u672A\u5339\u914D\uFF08_scrollForMore \u53EF\u80FD\u627E\u4E0D\u5230\u6EDA\u52A8\u76EE\u6807\uFF09",
              );
          let k = p.join(`
`);
          return (
            r(
              "[CS] \u6DF1\u5EA6\u8BCA\u65AD\u5B8C\u6210, \u5019\u9009\u5BB9\u5668=" +
                l.length +
                ", \u53EF\u6EDA\u52A8=" +
                f.length +
                ", iframe=" +
                h.length,
            ),
            r(
              `[CS] \u8BCA\u65AD\u7ED3\u8BBA:
` + k,
            ),
            {
              ok: !0,
              summary: { canScroll: n, containerFound: o, endOfList: u },
              scrollCandidates: l.slice(0, 30),
              allScrollable: f.slice(0, 20),
              frames: h,
              docContextCount: c.length,
              diagnosis: k,
            }
          );
        } catch (e) {
          return (
            A("[CS] \u6EDA\u52A8\u6D4B\u8BD5\u5F02\u5E38:", e.message),
            { ok: !1, error: e.message }
          );
        }
      }
      case M.CS_DEBUG_SCROLL_NOW: {
        r("[CS] \u6267\u884C\u5B9E\u9645\u6EDA\u52A8\u64CD\u4F5C...");
        try {
          let e = new K({}),
            t = null;
          if (
            ((t = e._findScrollableContainer(
              SEL.card.CANDIDATE_LIST_SCROLL,
            )),
            t ||
              (t =
                e
                  ._getDocumentScrollers()
                  .find((_) => _.scrollHeight > _.clientHeight) || null),
            !t)
          ) {
            let _ = e._getDocumentContexts();
            for (let h of _) {
              try {
                if (h.body && h.body.scrollHeight > h.body.clientHeight) {
                  let p = (h.defaultView || window).getComputedStyle(h.body);
                  if (
                    p.overflowY === "scroll" ||
                    p.overflowY === "auto" ||
                    p.overflow === "scroll" ||
                    p.overflow === "auto"
                  ) {
                    (t = h.body),
                      r(
                        "[CS] \u66B4\u529B\u626B\u63CF\u627E\u5230 body \u4F5C\u4E3A\u6EDA\u52A8\u76EE\u6807",
                      );
                    break;
                  }
                }
              } catch {}
              if (t) break;
            }
            if (!t)
              for (let h of _) {
                try {
                  let S = h.querySelectorAll("*");
                  for (let p of S)
                    if (p.scrollHeight > p.clientHeight + 2) {
                      let D = (h.defaultView || window).getComputedStyle(p);
                      if (
                        D.overflowY === "scroll" ||
                        D.overflowY === "auto" ||
                        D.overflow === "scroll" ||
                        D.overflow === "auto"
                      ) {
                        (t = p),
                          r(
                            "[CS] \u66B4\u529B\u626B\u63CF\u627E\u5230\u53EF\u6EDA\u52A8\u5143\u7D20: <" +
                              p.tagName.toLowerCase() +
                              "> \u4F5C\u4E3A\u6EDA\u52A8\u76EE\u6807",
                          );
                        break;
                      }
                    }
                } catch {}
                if (t) break;
              }
          }
          let s = null;
          if (t) {
            let _ =
                t.ownerDocument === document
                  ? "main"
                  : window.top && t.ownerDocument === window.top.document
                    ? "top"
                    : "iframe",
              h = t.tagName.toLowerCase(),
              S = t.id
                ? "#" + t.id
                : t.className && typeof t.className == "string"
                  ? "." + t.className.split(" ")[0]
                  : "",
              p = 0;
            try {
              let b =
                  SEL.card.CANDIDATE_LIST_SCROLL,
                D = e._getDocumentContexts();
              for (let v of D) {
                let G = v.querySelector(b);
                if (G) {
                  p = G.scrollHeight;
                  break;
                }
              }
            } catch {}
            (s = {
              name: _ + ":" + h + S,
              beforeScrollTop: Math.round(t.scrollTop),
              beforeCardScrollH: p,
              scrollHeight: t.scrollHeight,
              clientHeight: t.clientHeight,
            }),
              r(
                "[CS] \u6EDA\u52A8\u76EE\u6807: " +
                  s.name +
                  ", scrollTop=" +
                  s.beforeScrollTop +
                  ", cardScrollH=" +
                  s.beforeCardScrollH +
                  ", scrollH=" +
                  s.scrollHeight +
                  ", clientH=" +
                  s.clientHeight,
              );
          } else
            return (
              r("[CS] \u672A\u627E\u5230\u53EF\u6EDA\u52A8\u76EE\u6807"),
              {
                ok: !0,
                canScroll: !1,
                scrolled: !1,
                beforeScrollTop: 0,
                afterScrollTop: 0,
                scrollHeight: 0,
                clientHeight: 0,
                containerName: "none",
                warning:
                  "\u672A\u627E\u5230\u53EF\u6EDA\u52A8\u7684\u76EE\u6807\u5BB9\u5668",
              }
            );
          let n = await e._scrollForMore();
          await new Promise((_) => setTimeout(_, 1500));
          let o = (() => {
              let _ = e._findScrollableContainer(
                SEL.card.CANDIDATE_LIST_SCROLL,
              );
              if (
                (_ ||
                  (_ =
                    e
                      ._getDocumentScrollers()
                      .find((h) => h.scrollHeight > h.clientHeight) || null),
                !_)
              ) {
                let h = e._getDocumentContexts();
                for (let S of h) {
                  try {
                    if (S.body && S.body.scrollHeight > S.body.clientHeight) {
                      let b = (S.defaultView || window).getComputedStyle(
                        S.body,
                      );
                      if (
                        b.overflowY === "scroll" ||
                        b.overflowY === "auto" ||
                        b.overflow === "scroll" ||
                        b.overflow === "auto"
                      ) {
                        _ = S.body;
                        break;
                      }
                    }
                  } catch {}
                  if (_) break;
                }
              }
              return _ || t;
            })(),
            u = Math.round(o.scrollTop),
            c = (() => {
              try {
                let _ =
                    SEL.card.CANDIDATE_LIST_SCROLL,
                  h = e._getDocumentContexts();
                for (let S of h) {
                  let p = S.querySelector(_);
                  if (p) return p.scrollHeight;
                }
                return 0;
              } catch {
                return 0;
              }
            })(),
            d = u > s.beforeScrollTop,
            a = c > s.beforeCardScrollH,
            l = t.scrollHeight > s.scrollHeight,
            f = d || a || l;
          return (
            r(
              "[CS] \u624B\u52A8\u6EDA\u52A8\u7ED3\u679C: canScroll=" +
                n +
                ", scrolled=" +
                f +
                ", target=" +
                s.name +
                ", scrollTop: " +
                s.beforeScrollTop +
                "\u2192" +
                u +
                ", cardScrollH: " +
                s.beforeCardScrollH +
                "\u2192" +
                c +
                ", bodyScrollH: " +
                s.scrollHeight +
                "\u2192" +
                t.scrollHeight,
            ),
            {
              ok: !0,
              canScroll: n,
              scrolled: f,
              beforeScrollTop: s.beforeScrollTop,
              afterScrollTop: u,
              beforeCardScrollH: s.beforeCardScrollH,
              afterCardScrollH: c,
              scrollHeight: s.scrollHeight,
              afterScrollHeight: t.scrollHeight,
              clientHeight: s.clientHeight,
              containerName: s.name,
            }
          );
        } catch (e) {
          return (
            A("[CS] \u624B\u52A8\u6EDA\u52A8\u5F02\u5E38:", e.message),
            { ok: !1, error: e.message }
          );
        }
      }
      default:
        return { ok: !1, error: `\u672A\u77E5\u547D\u4EE4: ${i.action}` };
    }
  }
  async function Ze(i) {
    r("[CS] ===== \u6536\u5230\u542F\u52A8\u547D\u4EE4 ====="),
      (z = !1),
      window.addEventListener("message", me);
    let e = await ee();
    oe(!!e.devMode),
      window.postMessage(
        { source: "BOSS_PLUGIN_CS", type: "DEV_MODE", enabled: !!e.devMode },
        "*",
      ),
      r(
        "[CS] \u914D\u7F6E\u5DF2\u52A0\u8F7D, MQTT Hook \u72B6\u6001:",
        je
          ? "\u5DF2\u5C31\u7EEA"
          : "\u672A\u5C31\u7EEA\uFF08\u5C06\u7EE7\u7EED\u5C1D\u8BD5\uFF09",
      );
    try {
      await Pe();
    } catch (t) {
      r("[CS] \u53EF\u80FD\u5DF2\u5728\u6C9F\u901A\u9875\u9762:", t.message);
    }
    try {
      await Le("\u5168\u90E8");
    } catch (t) {
      r(
        "[CS] \u6D88\u606F\u5206\u7EC4\u5143\u7D20\u53EF\u80FD\u4E0D\u5B58\u5728:",
        t.message,
      );
    }
    if (
      ((x = new ae({
        sessionManager: Ve,
        deduplicator: Qe,
        onStatusReport: (t, s) => {
          chrome.runtime
            .sendMessage({
              action: M.STATUS_REPORT,
              data: { state: t, statusText: s },
            })
            .catch((n) => {
              if (X(n)) {
                W();
                return;
              }
              A(
                "[CS] \u72B6\u6001\u62A5\u544A\u53D1\u9001\u5931\u8D25:",
                n.message,
              );
            });
        },
        onSessionGoalAchieved: (t, s, n) => {
          chrome.runtime
            .sendMessage({
              action: M.SESSION_GOAL_ACHIEVED,
              data: { uid: t, goalKey: s, value: n },
            })
            .catch((o) => {
              if (X(o)) {
                W();
                return;
              }
              A(
                "[CS] \u76EE\u6807\u8FBE\u6210\u901A\u77E5\u53D1\u9001\u5931\u8D25:",
                o.message,
              );
            });
        },
        onNewRecord: (t) => {
          chrome.runtime
            .sendMessage({ action: M.NEW_RECORD, data: t })
            .catch((s) => {
              if (X(s)) {
                W();
                return;
              }
              A(
                "[CS] \u8BB0\u5F55\u63A8\u9001\u53D1\u9001\u5931\u8D25:",
                s.message,
              );
            });
        },
        callLlmApi: async (t, s = [], n = {}, o = {}, u = 2) => {
          let { knowledgeBase: c = "", positionKnowledgeBase: d = "" } = o;
          for (let a = 1; a <= u + 1; a++)
            try {
              if (z)
                return {
                  success: !1,
                  error: "\u5185\u5BB9\u811A\u672C\u5DF2\u5173\u95ED",
                };
              let l = await chrome.runtime.sendMessage({
                action: M.REQ_LLM_CALL,
                data: {
                  messages: t,
                  config: (await ee()).modelConfig,
                  goalConfigs: s,
                  achievedMap: n,
                  knowledgeBase: c,
                  positionKnowledgeBase: d,
                },
              });
              return l.data || l;
            } catch (l) {
              if (X(l))
                return (
                  console.error(
                    "[CS] \u68C0\u6D4B\u5230 Extension context invalidated\uFF0C\u5185\u5BB9\u811A\u672C\u81EA\u6BC1",
                  ),
                  W(),
                  { success: !1, error: "Extension context invalidated" }
                );
              if (a <= u) {
                A(
                  `[CS] LLM \u8C03\u7528\u5931\u8D25(\u7B2C${a}\u6B21)\uFF0C\u91CD\u8BD5\u4E2D...`,
                  l.message,
                ),
                  await m(2e3 * a);
                continue;
              }
              return { success: !1, error: l.message };
            }
        },
      })),
      await x.start(i),
      r(
        `[CS] \u5904\u7406\u5668\u5DF2\u542F\u52A8\uFF0C\u5DF2\u52A0\u8F7D ${x.newGreetingUserIds.size} \u4E2A\u65B0\u62DB\u547C\u5019\u9009\u4EBA`,
      ),
      Y.length > 0)
    ) {
      r(
        `[CS] \u5012\u5165\u7F13\u51B2\u533A MQTT \u6D88\u606F: ${Y.length} \u6761`,
      );
      for (let t of Y) x.enqueueMessage(t);
      Y = [];
    }
    return (
      window.postMessage(
        { source: "BOSS_PLUGIN_CS", type: "ENABLE_BOSS_LISTENER" },
        "*",
      ),
      r(
        "[CS] ===== \u542F\u52A8\u5B8C\u6210\uFF0C\u5904\u7406\u5668\u8FD0\u884C\u4E2D =====",
      ),
      { ok: !0 }
    );
  }
  async function et(i) {
    if (
      (r(
        "[CS] ===== \u6536\u5230\u6253\u62DB\u547C\u542F\u52A8\u547D\u4EE4 =====",
      ),
      x && x.state !== E.IDLE)
    )
      throw (
        (A(
          "[CS] \u81EA\u52A8\u56DE\u590D\u6B63\u5728\u8FD0\u884C\u4E2D\uFF0C\u65E0\u6CD5\u540C\u65F6\u542F\u52A8\u6253\u62DB\u547C",
        ),
        new Error(
          "\u81EA\u52A8\u56DE\u590D\u6B63\u5728\u8FD0\u884C\u4E2D\uFF0C\u8BF7\u5148\u505C\u6B62\u81EA\u52A8\u56DE\u590D\u518D\u542F\u52A8\u6253\u62DB\u547C",
        ))
      );
    let e = await ee();
    oe(!!e.devMode),
      (U = new K({
        onStatusReport: (s, n) => {
          chrome.runtime
            .sendMessage({
              action: M.GREETING_STATUS_REPORT,
              data: { state: s, statusText: n },
            })
            .catch((o) => {
              if (X(o)) {
                W();
                return;
              }
              A(
                "[CS] \u6253\u62DB\u547C\u72B6\u6001\u62A5\u544A\u53D1\u9001\u5931\u8D25:",
                o.message,
              );
            });
        },
        onNewRecord: (s) => {
          chrome.runtime
            .sendMessage({ action: M.NEW_GREETING_RECORD, data: s })
            .catch((n) => {
              if (X(n)) {
                W();
                return;
              }
              A(
                "[CS] \u6253\u62DB\u547C\u8BB0\u5F55\u63A8\u9001\u53D1\u9001\u5931\u8D25:",
                n.message,
              );
            });
        },
        onLog: (s, ...n) => {
          try {
            chrome.runtime
              .sendMessage({
                action: M.DEV_LOG,
                data: { level: s, message: he(n), time: Date.now() },
              })
              .catch(() => {});
          } catch {}
        },
      }));
    let t = {
      ...i,
      greetingConfigs: e.greetingConfigs || [],
      jobConfigs: e.jobConfigs || [],
      greetingTimeConfig: e.greetingTimeConfig || {},
    };
    return (
      U.start(t).catch((s) => {
        A(
          "[CS] \u6253\u62DB\u547C\u5904\u7406\u5668\u540E\u53F0\u5F02\u5E38:",
          s.message,
        );
        try {
          chrome.runtime
            .sendMessage({
              action: M.GREETING_STATUS_REPORT,
              data: {
                state: E.IDLE,
                statusText: "\u542F\u52A8\u5F02\u5E38: " + s.message,
              },
            })
            .catch(() => {});
        } catch {}
      }),
      r(
        "[CS] ===== \u6253\u62DB\u547C\u5904\u7406\u5668\u5DF2\u542F\u52A8\uFF08\u975E\u963B\u585E\u6A21\u5F0F\uFF09 =====",
      ),
      { ok: !0 }
    );
  }
})();
