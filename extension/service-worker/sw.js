import { resolveReplyScope } from "./reply-scope.mjs";

var R = {
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
    INSTALLATION_ID: "installationId",
  },
  C = { IDLE: "idle", RUNNING: "running", PAUSED: "paused" },
  S = {
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
    CMD_PROFILE_SYNC_SETTINGS: "cmd_profile_sync_settings",
    CMD_PROFILE_GET_PRODUCTS: "cmd_profile_get_products",
    CMD_PROFILE_SUBSCRIBE: "cmd_profile_subscribe",
    CMD_VALIDATE_SUBSCRIPTION: "cmd_validate_subscription",
    CMD_WHOBOT_STATUS: "cmd_whobot_status",
    CMD_WHOBOT_SUBMIT: "cmd_whobot_submit",
    CMD_WHOBOT_RECORDS: "cmd_whobot_records",
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
var un = {
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
};
var to = 3e4,
  ro = "bossRecruitDB",
  so = 2,
  be = "runRecords",
  Ee = "greetingRecords",
  Ne = "scheduler-heartbeat",
  vt = 1,
  Le = "greeting-scheduler-heartbeat",
  Nt = 3,
  Ss = "schedulerFailedTasks",
  ws = "greetingSchedulerFailedTasks",
  Ri = `\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684 HR\uFF0C\u8D1F\u8D23\u4E0E\u5019\u9009\u4EBA\u8FDB\u884C\u521D\u6B65\u6C9F\u901A\u3002\u4F60\u7684\u8BED\u6C14\u4E13\u4E1A\u4E14\u548C\u853C\u53EF\u4EB2\uFF0C\u56DE\u7B54\u7B80\u6D01\u4F46\u6709\u6E29\u5EA6\uFF0C\u8BA9\u4EBA\u611F\u5230\u4EB2\u5207\u3002\u59CB\u7EC8\u7528"\u60A8"\u79F0\u547C\u5019\u9009\u4EBA\uFF0C\u4EE5\u793A\u5C0A\u91CD\u3002

\u6838\u5FC3\u89C4\u5219\uFF1A
1. **\u4E0D\u8981\u91CD\u590D\u95EE\u540C\u4E00\u4E2A\u95EE\u9898**\u3002\u5982\u679C\u4F60\u5DF2\u7ECF\u95EE\u8FC7"\u60A8\u6700\u8FD1\u7684\u6280\u672F\u6808\u662F\u4EC0\u4E48\uFF1F"\uFF0C\u5019\u9009\u4EBA\u56DE\u7B54\u8FC7\u4E86\uFF0C\u5C31\u4E0D\u8981\u518D\u95EE\u7B2C\u4E8C\u6B21\u3002
2. **\u4EC5\u5F53\u5019\u9009\u4EBA\u660E\u786E\u95EE\u5230\u67D0\u4E2A\u5177\u4F53\u95EE\u9898\u65F6\uFF0C\u4E14\u8BE5\u95EE\u9898\u7684\u7B54\u6848\u5B58\u5728\u4E8E\u4F60\u7684\u77E5\u8BC6\u5E93\u4E2D\uFF0C\u4F60\u624D\u80FD\u56DE\u7B54**\u3002\u4E0D\u8981\u4E3B\u52A8\u4ECB\u7ECD\u77E5\u8BC6\u5E93\u4E2D\u7684\u4EFB\u4F55\u4FE1\u606F\u3002
3. **\u5982\u679C\u5019\u9009\u4EBA\u95EE\u7684\u95EE\u9898\u4E0D\u5728\u77E5\u8BC6\u5E93\u4E2D**\uFF0C\u8BF7\u56DE\u7B54\uFF1A"\u65E0\u6CD5\u56DE\u7B54" \u2014\u2014 \u4E0D\u8981\u89E3\u91CA\u3001\u9053\u6B49\u6216\u5EFA\u8BAE\u3002
4. **\u6D88\u606F\u5206\u9694**\uFF1A\u9700\u8981\u53D1\u9001\u591A\u6761\u72EC\u7ACB\u6D88\u606F\u65F6\uFF0C\u4F7F\u7528 <!--SPLIT--> \u4F5C\u4E3A\u5206\u9694\u7B26\u3002\u6BCF\u6761\u6D88\u606F\u5355\u72EC\u4E00\u884C\uFF0C\u5206\u9694\u7B26\u5355\u72EC\u4E00\u884C\u3002\u5355\u6761\u6D88\u606F\u76F4\u63A5\u8F93\u51FA\u3002`;
function xi(s, e = {}) {
  let t = [
      "\u5F53\u4F60\u9700\u8981\u53D1\u9001\u591A\u6761\u72EC\u7ACB\u6D88\u606F\u65F6\uFF0C\u8BF7\u4F7F\u7528 <!--SPLIT--> \u4F5C\u4E3A\u6D88\u606F\u5206\u9694\u7B26\u3002\u6BCF\u6761\u6D88\u606F\u653E\u5728\u4E00\u884C\uFF0C\u5206\u9694\u7B26\u5355\u72EC\u4E00\u884C\u3002\u4E0D\u9700\u8981\u62C6\u5206\u65F6\uFF0C\u76F4\u63A5\u8F93\u51FA\u5355\u6761\u6D88\u606F\u5185\u5BB9\u3002",
    ],
    r = s.filter((o) => !e[o.key]);
  if (r.length === 0)
    return t.join(`

`);
  let n = r.map(
    (o, i) =>
      `  \u3010\u4F18\u5148\u7EA7 ${i + 1}\u3011"${o.key}": ${o.prompt || o.llmExtractionHint} (\u76EE\u6807: ${o.name || o.llmDescription}\uFF0C\u683C\u5F0F: ${o.valueFormat}\uFF0C\u793A\u4F8B: ${o.valueExample})`,
  );
  return (
    t.push(
      `## \u76EE\u6807\u68C0\u6D4B\u4EFB\u52A1
\u4F60\u9700\u8981\u68C0\u6D4B\u4EE5\u4E0B\u76EE\u6807\u662F\u5426\u5DF2\u8FBE\u6210\u3002**\u91CD\u8981\uFF1A\u8BF7\u5148\u4ED4\u7EC6\u9605\u8BFB\u5B8C\u6574\u7684\u5BF9\u8BDD\u5386\u53F2\uFF0C**
\u5224\u65AD\u5019\u9009\u4EBA\u5728\u672C\u8F6E\u4E4B\u524D\u7684\u5BF9\u8BDD\u4E2D\u662F\u5426\u5DF2\u7ECF\u63D0\u4F9B\u4E86\u76EE\u6807\u4FE1\u606F\u3002

### \u4F18\u5148\u7EA7\u8BF4\u660E
\u4EE5\u4E0B\u76EE\u6807\u5DF2\u6309\u4F18\u5148\u7EA7\u4ECE\u9AD8\u5230\u4F4E\u6392\u5217\uFF08\u3010\u4F18\u5148\u7EA7 1\u3011\u4E3A\u6700\u9AD8\u4F18\u5148\u7EA7\uFF09\u3002
**\u7B56\u7565\u8981\u6C42\uFF1A**
1. \u5728\u5BF9\u8BDD\u4E2D\uFF0C\u5E94\u4F18\u5148\u5F15\u5BFC\u5019\u9009\u4EBA\u63D0\u4F9B\u9AD8\u4F18\u5148\u7EA7\u76EE\u6807\u7684\u4FE1\u606F\u3002
2. \u5728\u4F4E\u4F18\u5148\u7EA7\u76EE\u6807\u4E0E\u9AD8\u4F18\u5148\u7EA7\u76EE\u6807\u7684\u83B7\u53D6\u65F6\u673A\u51B2\u7A81\u65F6\uFF0C\u4F18\u5148\u5B8C\u6210\u9AD8\u4F18\u5148\u7EA7\u76EE\u6807\u3002
3. \u5982\u679C\u9AD8\u4F18\u5148\u7EA7\u76EE\u6807\u5DF2\u5728\u5386\u53F2\u5BF9\u8BDD\u4E2D\u8FBE\u6210\uFF0C\u5219\u7EE7\u7EED\u5173\u6CE8\u4E0B\u4E00\u4E2A\u672A\u8FBE\u6210\u7684\u9AD8\u4F18\u5148\u7EA7\u76EE\u6807\u3002
` +
        n.join(`
`) +
        `

\u6839\u636E\u76EE\u6807\u8FBE\u6210\u7684\u65F6\u95F4\uFF0C\u5206\u4E3A\u4E24\u79CD\u60C5\u51B5\uFF1A

1. **\u5386\u53F2\u8FBE\u6210**\uFF1A\u5019\u9009\u4EBA\u5728\u672C\u8F6E\u5BF9\u8BDD\u4E4B\u524D\uFF08\u5386\u53F2\u5BF9\u8BDD\u4E2D\uFF09\u5DF2\u7ECF\u63D0\u4F9B\u4E86\u8BE5\u76EE\u6807\u7684\u4FE1\u606F\u3002
   \u8BF7\u5728 JSON \u4E2D\u62A5\u544A\u5B83\uFF0Csource \u8BBE\u4E3A "history"\u3002**\u4E0D\u8981\u5728\u56DE\u590D\u4E2D\u518D\u6B21\u8BE2\u95EE\u8BE5\u4FE1\u606F**\uFF0C
   \u50CF\u6B63\u5E38\u804A\u5929\u4E00\u6837\u7EE7\u7EED\u5BF9\u8BDD\u5373\u53EF\u3002

2. **\u672C\u8F6E\u8FBE\u6210**\uFF1A\u4F60\u5728\u672C\u6B21\u56DE\u590D\u4E2D\u65B0\u83B7\u53D6\u4E86\u8BE5\u76EE\u6807\u7684\u4FE1\u606F\u3002
   \u8BF7\u5728 JSON \u4E2D\u62A5\u544A\u5B83\uFF0Csource \u8BBE\u4E3A "current"\u3002

\u5F53\u6709\u5DF2\u8FBE\u6210\u76EE\u6807\u9700\u8981\u62A5\u544A\u65F6\uFF0C\u5728\u56DE\u590D\u672B\u5C3E\uFF08\u6240\u6709\u5BF9\u8BDD\u6587\u672C\u4E4B\u540E\uFF09\u9644\u52A0 JSON \u5757\uFF0C\u683C\u5F0F\u5982\u4E0B\uFF1A
\`\`\`json
{"goals":[{"goal":"\u76EE\u6807key","value":"\u63D0\u53D6\u7684\u503C","source":"history|current"}]}
\`\`\`
\u91CD\u8981\u89C4\u5219\uFF1A
1. "goals" \u6570\u7EC4\u5305\u542B**\u6240\u6709**\u5DF2\u8FBE\u6210\u76EE\u6807\uFF08\u65E2\u5305\u62EC\u5386\u53F2\u8FBE\u6210\uFF0C\u4E5F\u5305\u62EC\u672C\u8F6E\u8FBE\u6210\uFF09\u3002
2. \u5386\u53F2\u8FBE\u6210\u7684\u76EE\u6807\u4E5F\u5FC5\u987B\u62A5\u544A\uFF0Csource \u8BBE\u4E3A "history"\u2014 \u7A0B\u5E8F\u9700\u8981\u8BB0\u5F55\u3002
3. \u5BF9\u4E8E\u5386\u53F2\u8FBE\u6210\u7684\u76EE\u6807\uFF0C**\u4E0D\u8981\u5728\u56DE\u590D\u4E2D\u518D\u6B21\u7D22\u8981**\uFF0C\u6B63\u5E38\u5BF9\u8BDD\u5373\u53EF\u3002
4. \u5982\u679C\u6CA1\u6709\u5DF2\u8FBE\u6210\u76EE\u6807\uFF0C\u5219\u4E0D\u8981\u8F93\u51FA JSON\uFF0C\u53EA\u8F93\u51FA\u6B63\u5E38\u7684\u5BF9\u8BDD\u6587\u672C\u3002
5. value \u5FC5\u987B\u4E25\u683C\u6309\u7167\u6307\u5B9A\u683C\u5F0F\u8F93\u51FA\uFF0C\u4E0D\u5F97\u5305\u542B\u989D\u5916\u8BF4\u660E\u6587\u5B57\u3002`,
    ),
    t.join(`

`)
  );
}
function no(s, e, t, r, n) {
  let o = [Ri];
  s &&
    s.trim() &&
    o.push(`## \u901A\u7528\u77E5\u8BC6\u5E93
\u4EE5\u4E0B\u662F\u516C\u53F8\u901A\u7528\u7684\u4FE1\u606F\u3001\u653F\u7B56\u548C\u5236\u5EA6\u80CC\u666F\u3002\u8BF7\u9075\u5B88\u89C4\u52192\u548C\u89C4\u52193\uFF1A\u4EC5\u5F53\u5019\u9009\u4EBA\u660E\u786E\u95EE\u5230\u76F8\u5173\u95EE\u9898\u65F6\uFF0C\u624D\u4F7F\u7528\u4EE5\u4E0B\u4FE1\u606F\u56DE\u7B54\uFF1B\u5982\u679C\u95EE\u9898\u4E0D\u5728\u77E5\u8BC6\u5E93\u4E2D\uFF0C\u56DE\u7B54"\u65E0\u6CD5\u56DE\u7B54"\uFF1A
${s.trim()}`),
    e &&
      e.trim() &&
      o.push(`## \u5C97\u4F4D\u77E5\u8BC6\u5E93
\u4EE5\u4E0B\u662F\u5F53\u524D\u6C9F\u901A\u5C97\u4F4D\u7684\u5177\u4F53\u4FE1\u606F\u548C\u804C\u8D23\u8981\u6C42\u3002\u8BF7\u9075\u5B88\u89C4\u52192\u548C\u89C4\u52193\uFF1A\u4EC5\u5F53\u5019\u9009\u4EBA\u660E\u786E\u95EE\u5230\u76F8\u5173\u95EE\u9898\u65F6\uFF0C\u624D\u4F7F\u7528\u4EE5\u4E0B\u4FE1\u606F\u56DE\u7B54\uFF1B\u5982\u679C\u95EE\u9898\u4E0D\u5728\u77E5\u8BC6\u5E93\u4E2D\uFF0C\u56DE\u7B54"\u65E0\u6CD5\u56DE\u7B54"\uFF1A
${e.trim()}`),
    n &&
      n.trim() &&
      o.push(`## \u7528\u6237\u6307\u4EE4
${n.trim()}`);
  let i = xi(t, r);
  return (
    o.push(i),
    o.join(`

`)
  );
}
var Is = R.ACTIVE_TAB_ID;
async function Yr(s) {
  let e = await K();
  if (e && e !== s)
    try {
      return await chrome.tabs.get(e), !1;
    } catch {}
  return await chrome.storage.session.set({ [Is]: s }), !0;
}
async function k(s) {
  (await K()) === s && (await chrome.storage.session.remove(Is));
}
async function K() {
  return (await chrome.storage.session.get(Is))[Is] || null;
}
function b(s, e, t, r, n) {
  if (r === "m") throw new TypeError("Private method is not writable");
  if (r === "a" && !n)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof e == "function" ? s !== e || !n : !e.has(s))
    throw new TypeError(
      "Cannot write private member to an object whose class did not declare it",
    );
  return r === "a" ? n.call(s, t) : n ? (n.value = t) : e.set(s, t), t;
}
function u(s, e, t, r) {
  if (t === "a" && !r)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof e == "function" ? s !== e || !r : !e.has(s))
    throw new TypeError(
      "Cannot read private member from an object whose class did not declare it",
    );
  return t === "m" ? r : t === "a" ? r.call(s) : r ? r.value : e.get(s);
}
var hn = function () {
  let { crypto: s } = globalThis;
  if (s?.randomUUID) return (hn = s.randomUUID.bind(s)), s.randomUUID();
  let e = new Uint8Array(1),
    t = s ? () => s.getRandomValues(e)[0] : () => (Math.random() * 255) & 255;
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (r) =>
    (+r ^ (t() & (15 >> (+r / 4)))).toString(16),
  );
};
function Qr(s) {
  return (
    typeof s == "object" &&
    s !== null &&
    (("name" in s && s.name === "AbortError") ||
      ("message" in s &&
        String(s.message).includes("FetchRequestCanceledException")))
  );
}
var Zr = (s) => {
  if (s instanceof Error) return s;
  if (typeof s == "object" && s !== null) {
    try {
      if (Object.prototype.toString.call(s) === "[object Error]") {
        let e = new Error(s.message, s.cause ? { cause: s.cause } : {});
        return (
          s.stack && (e.stack = s.stack),
          s.cause && !e.cause && (e.cause = s.cause),
          s.name && (e.name = s.name),
          e
        );
      }
    } catch {}
    try {
      return new Error(JSON.stringify(s));
    } catch {}
  }
  return new Error(s);
};
var w = class extends Error {},
  L = class s extends w {
    constructor(e, t, r, n) {
      super(`${s.makeMessage(e, t, r)}`),
        (this.status = e),
        (this.headers = n),
        (this.requestID = n?.get("x-request-id")),
        (this.error = t);
      let o = t;
      (this.code = o?.code), (this.param = o?.param), (this.type = o?.type);
    }
    static makeMessage(e, t, r) {
      let n = t?.message
        ? typeof t.message == "string"
          ? t.message
          : JSON.stringify(t.message)
        : t
          ? JSON.stringify(t)
          : r;
      return e && n
        ? `${e} ${n}`
        : e
          ? `${e} status code (no body)`
          : n || "(no status code or body)";
    }
    static generate(e, t, r, n) {
      if (!e || !n) return new De({ message: r, cause: Zr(t) });
      let o = t?.error;
      return e === 400
        ? new Lt(e, o, r, n)
        : e === 401
          ? new Dt(e, o, r, n)
          : e === 403
            ? new Mt(e, o, r, n)
            : e === 404
              ? new Gt(e, o, r, n)
              : e === 409
                ? new Ft(e, o, r, n)
                : e === 422
                  ? new Ut(e, o, r, n)
                  : e === 429
                    ? new Wt(e, o, r, n)
                    : e >= 500
                      ? new jt(e, o, r, n)
                      : new s(e, o, r, n);
    }
  },
  F = class extends L {
    constructor({ message: e } = {}) {
      super(void 0, void 0, e || "Request was aborted.", void 0);
    }
  },
  De = class extends L {
    constructor({ message: e, cause: t }) {
      super(void 0, void 0, e || "Connection error.", void 0),
        t && (this.cause = t);
    }
  },
  Me = class extends De {
    constructor({ message: e } = {}) {
      super({ message: e ?? "Request timed out." });
    }
  },
  Lt = class extends L {},
  Dt = class extends L {},
  Mt = class extends L {},
  Gt = class extends L {},
  Ft = class extends L {},
  Ut = class extends L {},
  Wt = class extends L {},
  jt = class extends L {},
  Kt = class extends w {
    constructor() {
      super("Could not parse response content as the length limit was reached");
    }
  },
  Bt = class extends w {
    constructor() {
      super(
        "Could not parse response content as the request was rejected by the content filter",
      );
    }
  },
  pe = class extends Error {
    constructor(e) {
      super(e);
    }
  },
  rt = class extends L {
    constructor(e, t, r) {
      let n = "OAuth2 authentication error",
        o;
      if (t && typeof t == "object") {
        let i = t;
        o = i.error;
        let c = i.error_description;
        c && typeof c == "string" ? (n = c) : o && (n = o);
      }
      super(e, t, n, r), (this.error_code = o);
    }
  },
  es = class extends w {
    constructor(e, t, r) {
      super(e), (this.provider = t), (this.cause = r);
    }
  };
var $i = /^[a-z][a-z0-9+.-]*:/i,
  oo = (s) => $i.test(s),
  te = (s) => ((te = Array.isArray), te(s)),
  dn = te;
function bs(s) {
  return typeof s != "object" ? {} : (s ?? {});
}
function mn(s) {
  if (!s) return !0;
  for (let e in s) return !1;
  return !0;
}
function io(s, e) {
  return Object.prototype.hasOwnProperty.call(s, e);
}
function ts(s) {
  return s != null && typeof s == "object" && !Array.isArray(s);
}
var ao = (s, e) => {
  if (typeof e != "number" || !Number.isInteger(e))
    throw new w(`${s} must be an integer`);
  if (e < 0) throw new w(`${s} must be a positive integer`);
  return e;
};
var co = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return;
  }
};
var _e = (s) => new Promise((e) => setTimeout(e, s));
var Ge = "6.39.1";
var mo = () =>
  typeof window < "u" && typeof window.document < "u" && typeof navigator < "u";
function ki() {
  return typeof Deno < "u" && Deno.build != null
    ? "deno"
    : typeof EdgeRuntime < "u"
      ? "edge"
      : Object.prototype.toString.call(
            typeof globalThis.process < "u" ? globalThis.process : 0,
          ) === "[object process]"
        ? "node"
        : "unknown";
}
var Oi = () => {
  let s = ki();
  if (s === "deno")
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": Ge,
      "X-Stainless-OS": uo(Deno.build.os),
      "X-Stainless-Arch": lo(Deno.build.arch),
      "X-Stainless-Runtime": "deno",
      "X-Stainless-Runtime-Version":
        typeof Deno.version == "string"
          ? Deno.version
          : (Deno.version?.deno ?? "unknown"),
    };
  if (typeof EdgeRuntime < "u")
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": Ge,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": `other:${EdgeRuntime}`,
      "X-Stainless-Runtime": "edge",
      "X-Stainless-Runtime-Version": globalThis.process.version,
    };
  if (s === "node")
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": Ge,
      "X-Stainless-OS": uo(globalThis.process.platform ?? "unknown"),
      "X-Stainless-Arch": lo(globalThis.process.arch ?? "unknown"),
      "X-Stainless-Runtime": "node",
      "X-Stainless-Runtime-Version": globalThis.process.version ?? "unknown",
    };
  let e = vi();
  return e
    ? {
        "X-Stainless-Lang": "js",
        "X-Stainless-Package-Version": Ge,
        "X-Stainless-OS": "Unknown",
        "X-Stainless-Arch": "unknown",
        "X-Stainless-Runtime": `browser:${e.browser}`,
        "X-Stainless-Runtime-Version": e.version,
      }
    : {
        "X-Stainless-Lang": "js",
        "X-Stainless-Package-Version": Ge,
        "X-Stainless-OS": "Unknown",
        "X-Stainless-Arch": "unknown",
        "X-Stainless-Runtime": "unknown",
        "X-Stainless-Runtime-Version": "unknown",
      };
};
function vi() {
  if (typeof navigator > "u" || !navigator) return null;
  let s = [
    { key: "edge", pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "chrome", pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "firefox", pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    {
      key: "safari",
      pattern:
        /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/,
    },
  ];
  for (let { key: e, pattern: t } of s) {
    let r = t.exec(navigator.userAgent);
    if (r) {
      let n = r[1] || 0,
        o = r[2] || 0,
        i = r[3] || 0;
      return { browser: e, version: `${n}.${o}.${i}` };
    }
  }
  return null;
}
var lo = (s) =>
    s === "x32"
      ? "x32"
      : s === "x86_64" || s === "x64"
        ? "x64"
        : s === "arm"
          ? "arm"
          : s === "aarch64" || s === "arm64"
            ? "arm64"
            : s
              ? `other:${s}`
              : "unknown",
  uo = (s) => (
    (s = s.toLowerCase()),
    s.includes("ios")
      ? "iOS"
      : s === "android"
        ? "Android"
        : s === "darwin"
          ? "MacOS"
          : s === "win32"
            ? "Windows"
            : s === "freebsd"
              ? "FreeBSD"
              : s === "openbsd"
                ? "OpenBSD"
                : s === "linux"
                  ? "Linux"
                  : s
                    ? `Other:${s}`
                    : "Unknown"
  ),
  ho,
  fo = () => ho ?? (ho = Oi());
function Es() {
  if (typeof fetch < "u") return fetch;
  throw new Error(
    "`fetch` is not defined as a global; Either pass `fetch` to the client, `new OpenAI({ fetch })` or polyfill the global, `globalThis.fetch = fetch`",
  );
}
function fn(...s) {
  let e = globalThis.ReadableStream;
  if (typeof e > "u")
    throw new Error(
      "`ReadableStream` is not defined as a global; You will need to polyfill it, `globalThis.ReadableStream = ReadableStream`",
    );
  return new e(...s);
}
function Ps(s) {
  let e =
    Symbol.asyncIterator in s
      ? s[Symbol.asyncIterator]()
      : s[Symbol.iterator]();
  return fn({
    start() {},
    async pull(t) {
      let { done: r, value: n } = await e.next();
      r ? t.close() : t.enqueue(n);
    },
    async cancel() {
      await e.return?.();
    },
  });
}
function pn(s) {
  if (s[Symbol.asyncIterator]) return s;
  let e = s.getReader();
  return {
    async next() {
      try {
        let t = await e.read();
        return t?.done && e.releaseLock(), t;
      } catch (t) {
        throw (e.releaseLock(), t);
      }
    },
    async return() {
      let t = e.cancel();
      return e.releaseLock(), await t, { done: !0, value: void 0 };
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}
async function _n(s) {
  if (s === null || typeof s != "object") return;
  if (s[Symbol.asyncIterator]) {
    await s[Symbol.asyncIterator]().return?.();
    return;
  }
  let e = s.getReader(),
    t = e.cancel();
  e.releaseLock(), await t;
}
var _o = ({ headers: s, body: e }) => ({
  bodyHeaders: { "content-type": "application/json" },
  body: JSON.stringify(e),
});
var gn = "RFC3986",
  yn = (s) => String(s),
  An = { RFC1738: (s) => String(s).replace(/%20/g, "+"), RFC3986: yn },
  go = "RFC1738";
var Ts = (s, e) => (
    (Ts =
      Object.hasOwn ??
      Function.prototype.call.bind(Object.prototype.hasOwnProperty)),
    Ts(s, e)
  ),
  ge = (() => {
    let s = [];
    for (let e = 0; e < 256; ++e)
      s.push("%" + ((e < 16 ? "0" : "") + e.toString(16)).toUpperCase());
    return s;
  })();
var Sn = 1024,
  yo = (s, e, t, r, n) => {
    if (s.length === 0) return s;
    let o = s;
    if (
      (typeof s == "symbol"
        ? (o = Symbol.prototype.toString.call(s))
        : typeof s != "string" && (o = String(s)),
      t === "iso-8859-1")
    )
      return escape(o).replace(/%u[0-9a-f]{4}/gi, function (c) {
        return "%26%23" + parseInt(c.slice(2), 16) + "%3B";
      });
    let i = "";
    for (let c = 0; c < o.length; c += Sn) {
      let d = o.length >= Sn ? o.slice(c, c + Sn) : o,
        h = [];
      for (let g = 0; g < d.length; ++g) {
        let m = d.charCodeAt(g);
        if (
          m === 45 ||
          m === 46 ||
          m === 95 ||
          m === 126 ||
          (m >= 48 && m <= 57) ||
          (m >= 65 && m <= 90) ||
          (m >= 97 && m <= 122) ||
          (n === go && (m === 40 || m === 41))
        ) {
          h[h.length] = d.charAt(g);
          continue;
        }
        if (m < 128) {
          h[h.length] = ge[m];
          continue;
        }
        if (m < 2048) {
          h[h.length] = ge[192 | (m >> 6)] + ge[128 | (m & 63)];
          continue;
        }
        if (m < 55296 || m >= 57344) {
          h[h.length] =
            ge[224 | (m >> 12)] +
            ge[128 | ((m >> 6) & 63)] +
            ge[128 | (m & 63)];
          continue;
        }
        (g += 1),
          (m = 65536 + (((m & 1023) << 10) | (d.charCodeAt(g) & 1023))),
          (h[h.length] =
            ge[240 | (m >> 18)] +
            ge[128 | ((m >> 12) & 63)] +
            ge[128 | ((m >> 6) & 63)] +
            ge[128 | (m & 63)]);
      }
      i += h.join("");
    }
    return i;
  };
function Ao(s) {
  return !s || typeof s != "object"
    ? !1
    : !!(s.constructor && s.constructor.isBuffer && s.constructor.isBuffer(s));
}
function wn(s, e) {
  if (te(s)) {
    let t = [];
    for (let r = 0; r < s.length; r += 1) t.push(e(s[r]));
    return t;
  }
  return e(s);
}
var wo = {
    brackets(s) {
      return String(s) + "[]";
    },
    comma: "comma",
    indices(s, e) {
      return String(s) + "[" + e + "]";
    },
    repeat(s) {
      return String(s);
    },
  },
  Io = function (s, e) {
    Array.prototype.push.apply(s, te(e) ? e : [e]);
  },
  So,
  B = {
    addQueryPrefix: !1,
    allowDots: !1,
    allowEmptyArrays: !1,
    arrayFormat: "indices",
    charset: "utf-8",
    charsetSentinel: !1,
    delimiter: "&",
    encode: !0,
    encodeDotInKeys: !1,
    encoder: yo,
    encodeValuesOnly: !1,
    format: gn,
    formatter: yn,
    indices: !1,
    serializeDate(s) {
      return (
        So ?? (So = Function.prototype.call.bind(Date.prototype.toISOString))
      )(s);
    },
    skipNulls: !1,
    strictNullHandling: !1,
  };
function Li(s) {
  return (
    typeof s == "string" ||
    typeof s == "number" ||
    typeof s == "boolean" ||
    typeof s == "symbol" ||
    typeof s == "bigint"
  );
}
var In = {};
function bo(s, e, t, r, n, o, i, c, d, h, g, m, _, f, A, I, $, W) {
  let E = s,
    O = W,
    v = 0,
    ae = !1;
  for (; (O = O.get(In)) !== void 0 && !ae; ) {
    let G = O.get(s);
    if (((v += 1), typeof G < "u")) {
      if (G === v) throw new RangeError("Cyclic object value");
      ae = !0;
    }
    typeof O.get(In) > "u" && (v = 0);
  }
  if (
    (typeof h == "function"
      ? (E = h(e, E))
      : E instanceof Date
        ? (E = _?.(E))
        : t === "comma" &&
          te(E) &&
          (E = wn(E, function (G) {
            return G instanceof Date ? _?.(G) : G;
          })),
    E === null)
  ) {
    if (o) return d && !I ? d(e, B.encoder, $, "key", f) : e;
    E = "";
  }
  if (Li(E) || Ao(E)) {
    if (d) {
      let G = I ? e : d(e, B.encoder, $, "key", f);
      return [A?.(G) + "=" + A?.(d(E, B.encoder, $, "value", f))];
    }
    return [A?.(e) + "=" + A?.(String(E))];
  }
  let X = [];
  if (typeof E > "u") return X;
  let Y;
  if (t === "comma" && te(E))
    I && d && (E = wn(E, d)),
      (Y = [{ value: E.length > 0 ? E.join(",") || null : void 0 }]);
  else if (te(h)) Y = h;
  else {
    let G = Object.keys(E);
    Y = g ? G.sort(g) : G;
  }
  let N = c ? String(e).replace(/\./g, "%2E") : String(e),
    V = r && te(E) && E.length === 1 ? N + "[]" : N;
  if (n && te(E) && E.length === 0) return V + "[]";
  for (let G = 0; G < Y.length; ++G) {
    let j = Y[G],
      Zn = typeof j == "object" && typeof j.value < "u" ? j.value : E[j];
    if (i && Zn === null) continue;
    let ln = m && c ? j.replace(/\./g, "%2E") : j,
      Ti = te(E)
        ? typeof t == "function"
          ? t(V, ln)
          : V
        : V + (m ? "." + ln : "[" + ln + "]");
    W.set(s, v);
    let eo = new WeakMap();
    eo.set(In, W),
      Io(
        X,
        bo(
          Zn,
          Ti,
          t,
          r,
          n,
          o,
          i,
          c,
          t === "comma" && I && te(E) ? null : d,
          h,
          g,
          m,
          _,
          f,
          A,
          I,
          $,
          eo,
        ),
      );
  }
  return X;
}
function Di(s = B) {
  if (typeof s.allowEmptyArrays < "u" && typeof s.allowEmptyArrays != "boolean")
    throw new TypeError(
      "`allowEmptyArrays` option can only be `true` or `false`, when provided",
    );
  if (typeof s.encodeDotInKeys < "u" && typeof s.encodeDotInKeys != "boolean")
    throw new TypeError(
      "`encodeDotInKeys` option can only be `true` or `false`, when provided",
    );
  if (
    s.encoder !== null &&
    typeof s.encoder < "u" &&
    typeof s.encoder != "function"
  )
    throw new TypeError("Encoder has to be a function.");
  let e = s.charset || B.charset;
  if (
    typeof s.charset < "u" &&
    s.charset !== "utf-8" &&
    s.charset !== "iso-8859-1"
  )
    throw new TypeError(
      "The charset option must be either utf-8, iso-8859-1, or undefined",
    );
  let t = gn;
  if (typeof s.format < "u") {
    if (!Ts(An, s.format))
      throw new TypeError("Unknown format option provided.");
    t = s.format;
  }
  let r = An[t],
    n = B.filter;
  (typeof s.filter == "function" || te(s.filter)) && (n = s.filter);
  let o;
  if (
    (s.arrayFormat && s.arrayFormat in wo
      ? (o = s.arrayFormat)
      : "indices" in s
        ? (o = s.indices ? "indices" : "repeat")
        : (o = B.arrayFormat),
    "commaRoundTrip" in s && typeof s.commaRoundTrip != "boolean")
  )
    throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
  let i =
    typeof s.allowDots > "u"
      ? s.encodeDotInKeys
        ? !0
        : B.allowDots
      : !!s.allowDots;
  return {
    addQueryPrefix:
      typeof s.addQueryPrefix == "boolean"
        ? s.addQueryPrefix
        : B.addQueryPrefix,
    allowDots: i,
    allowEmptyArrays:
      typeof s.allowEmptyArrays == "boolean"
        ? !!s.allowEmptyArrays
        : B.allowEmptyArrays,
    arrayFormat: o,
    charset: e,
    charsetSentinel:
      typeof s.charsetSentinel == "boolean"
        ? s.charsetSentinel
        : B.charsetSentinel,
    commaRoundTrip: !!s.commaRoundTrip,
    delimiter: typeof s.delimiter > "u" ? B.delimiter : s.delimiter,
    encode: typeof s.encode == "boolean" ? s.encode : B.encode,
    encodeDotInKeys:
      typeof s.encodeDotInKeys == "boolean"
        ? s.encodeDotInKeys
        : B.encodeDotInKeys,
    encoder: typeof s.encoder == "function" ? s.encoder : B.encoder,
    encodeValuesOnly:
      typeof s.encodeValuesOnly == "boolean"
        ? s.encodeValuesOnly
        : B.encodeValuesOnly,
    filter: n,
    format: t,
    formatter: r,
    serializeDate:
      typeof s.serializeDate == "function" ? s.serializeDate : B.serializeDate,
    skipNulls: typeof s.skipNulls == "boolean" ? s.skipNulls : B.skipNulls,
    sort: typeof s.sort == "function" ? s.sort : null,
    strictNullHandling:
      typeof s.strictNullHandling == "boolean"
        ? s.strictNullHandling
        : B.strictNullHandling,
  };
}
function Eo(s, e = {}) {
  let t = s,
    r = Di(e),
    n,
    o;
  typeof r.filter == "function"
    ? ((o = r.filter), (t = o("", t)))
    : te(r.filter) && ((o = r.filter), (n = o));
  let i = [];
  if (typeof t != "object" || t === null) return "";
  let c = wo[r.arrayFormat],
    d = c === "comma" && r.commaRoundTrip;
  n || (n = Object.keys(t)), r.sort && n.sort(r.sort);
  let h = new WeakMap();
  for (let _ = 0; _ < n.length; ++_) {
    let f = n[_];
    (r.skipNulls && t[f] === null) ||
      Io(
        i,
        bo(
          t[f],
          f,
          c,
          d,
          r.allowEmptyArrays,
          r.strictNullHandling,
          r.skipNulls,
          r.encodeDotInKeys,
          r.encode ? r.encoder : null,
          r.filter,
          r.sort,
          r.allowDots,
          r.serializeDate,
          r.format,
          r.formatter,
          r.encodeValuesOnly,
          r.charset,
          h,
        ),
      );
  }
  let g = i.join(r.delimiter),
    m = r.addQueryPrefix === !0 ? "?" : "";
  return (
    r.charsetSentinel &&
      (r.charset === "iso-8859-1"
        ? (m += "utf8=%26%2310003%3B&")
        : (m += "utf8=%E2%9C%93&")),
    g.length > 0 ? m + g : ""
  );
}
function Po(s) {
  return Eo(s, { arrayFormat: "brackets" });
}
function xo(s) {
  let e = 0;
  for (let n of s) e += n.length;
  let t = new Uint8Array(e),
    r = 0;
  for (let n of s) t.set(n, r), (r += n.length);
  return t;
}
var To;
function Ht(s) {
  let e;
  return (To ?? ((e = new globalThis.TextEncoder()), (To = e.encode.bind(e))))(
    s,
  );
}
var Ro;
function bn(s) {
  let e;
  return (Ro ?? ((e = new globalThis.TextDecoder()), (Ro = e.decode.bind(e))))(
    s,
  );
}
var ce,
  le,
  st = class {
    constructor() {
      ce.set(this, void 0),
        le.set(this, void 0),
        b(this, ce, new Uint8Array(), "f"),
        b(this, le, null, "f");
    }
    decode(e) {
      if (e == null) return [];
      let t =
        e instanceof ArrayBuffer
          ? new Uint8Array(e)
          : typeof e == "string"
            ? Ht(e)
            : e;
      b(this, ce, xo([u(this, ce, "f"), t]), "f");
      let r = [],
        n;
      for (; (n = Gi(u(this, ce, "f"), u(this, le, "f"))) != null; ) {
        if (n.carriage && u(this, le, "f") == null) {
          b(this, le, n.index, "f");
          continue;
        }
        if (
          u(this, le, "f") != null &&
          (n.index !== u(this, le, "f") + 1 || n.carriage)
        ) {
          r.push(bn(u(this, ce, "f").subarray(0, u(this, le, "f") - 1))),
            b(this, ce, u(this, ce, "f").subarray(u(this, le, "f")), "f"),
            b(this, le, null, "f");
          continue;
        }
        let o = u(this, le, "f") !== null ? n.preceding - 1 : n.preceding,
          i = bn(u(this, ce, "f").subarray(0, o));
        r.push(i),
          b(this, ce, u(this, ce, "f").subarray(n.index), "f"),
          b(this, le, null, "f");
      }
      return r;
    }
    flush() {
      return u(this, ce, "f").length
        ? this.decode(`
`)
        : [];
    }
  };
(ce = new WeakMap()), (le = new WeakMap());
st.NEWLINE_CHARS = new Set([
  `
`,
  "\r",
]);
st.NEWLINE_REGEXP = /\r\n|[\n\r]/g;
function Gi(s, e) {
  for (let n = e ?? 0; n < s.length; n++) {
    if (s[n] === 10) return { preceding: n, index: n + 1, carriage: !1 };
    if (s[n] === 13) return { preceding: n, index: n + 1, carriage: !0 };
  }
  return null;
}
function Co(s) {
  for (let r = 0; r < s.length - 1; r++) {
    if ((s[r] === 10 && s[r + 1] === 10) || (s[r] === 13 && s[r + 1] === 13))
      return r + 2;
    if (
      s[r] === 13 &&
      s[r + 1] === 10 &&
      r + 3 < s.length &&
      s[r + 2] === 13 &&
      s[r + 3] === 10
    )
      return r + 4;
  }
  return -1;
}
var xs = { off: 0, error: 200, warn: 300, info: 400, debug: 500 },
  En = (s, e, t) => {
    if (s) {
      if (io(xs, s)) return s;
      D(t).warn(
        `${e} was set to ${JSON.stringify(s)}, expected one of ${JSON.stringify(Object.keys(xs))}`,
      );
    }
  };
function rs() {}
function Rs(s, e, t) {
  return !e || xs[s] > xs[t] ? rs : e[s].bind(e);
}
var Fi = { error: rs, warn: rs, info: rs, debug: rs },
  $o = new WeakMap();
function D(s) {
  let e = s.logger,
    t = s.logLevel ?? "off";
  if (!e) return Fi;
  let r = $o.get(e);
  if (r && r[0] === t) return r[1];
  let n = {
    error: Rs("error", e, t),
    warn: Rs("warn", e, t),
    info: Rs("info", e, t),
    debug: Rs("debug", e, t),
  };
  return $o.set(e, [t, n]), n;
}
var Pe = (s) => (
  s.options && ((s.options = { ...s.options }), delete s.options.headers),
  s.headers &&
    (s.headers = Object.fromEntries(
      (s.headers instanceof Headers
        ? [...s.headers]
        : Object.entries(s.headers)
      ).map(([e, t]) => [
        e,
        e.toLowerCase() === "authorization" ||
        e.toLowerCase() === "api-key" ||
        e.toLowerCase() === "x-api-key" ||
        e.toLowerCase() === "cookie" ||
        e.toLowerCase() === "set-cookie"
          ? "***"
          : t,
      ]),
    )),
  "retryOfRequestLogID" in s &&
    (s.retryOfRequestLogID && (s.retryOf = s.retryOfRequestLogID),
    delete s.retryOfRequestLogID),
  s
);
var ss,
  ye = class s {
    constructor(e, t, r) {
      (this.iterator = e),
        ss.set(this, void 0),
        (this.controller = t),
        b(this, ss, r, "f");
    }
    static fromSSEResponse(e, t, r, n) {
      let o = !1,
        i = r ? D(r) : console;
      async function* c() {
        if (o)
          throw new w(
            "Cannot iterate over a consumed stream, use `.tee()` to split the stream.",
          );
        o = !0;
        let d = !1;
        try {
          for await (let h of Ui(e, t))
            if (!d) {
              if (h.data.startsWith("[DONE]")) {
                d = !0;
                continue;
              }
              if (h.event === null || !h.event.startsWith("thread.")) {
                let g;
                try {
                  g = JSON.parse(h.data);
                } catch (m) {
                  throw (
                    (i.error("Could not parse message into JSON:", h.data),
                    i.error("From chunk:", h.raw),
                    m)
                  );
                }
                if (g && g.error)
                  throw new L(void 0, g.error, void 0, e.headers);
                yield n ? { event: h.event, data: g } : g;
              } else {
                let g;
                try {
                  g = JSON.parse(h.data);
                } catch (m) {
                  throw (
                    (console.error(
                      "Could not parse message into JSON:",
                      h.data,
                    ),
                    console.error("From chunk:", h.raw),
                    m)
                  );
                }
                if (h.event == "error")
                  throw new L(void 0, g.error, g.message, void 0);
                yield { event: h.event, data: g };
              }
            }
          d = !0;
        } catch (h) {
          if (Qr(h)) return;
          throw h;
        } finally {
          d || t.abort();
        }
      }
      return new s(c, t, r);
    }
    static fromReadableStream(e, t, r) {
      let n = !1;
      async function* o() {
        let c = new st(),
          d = pn(e);
        for await (let h of d) for (let g of c.decode(h)) yield g;
        for (let h of c.flush()) yield h;
      }
      async function* i() {
        if (n)
          throw new w(
            "Cannot iterate over a consumed stream, use `.tee()` to split the stream.",
          );
        n = !0;
        let c = !1;
        try {
          for await (let d of o()) c || (d && (yield JSON.parse(d)));
          c = !0;
        } catch (d) {
          if (Qr(d)) return;
          throw d;
        } finally {
          c || t.abort();
        }
      }
      return new s(i, t, r);
    }
    [((ss = new WeakMap()), Symbol.asyncIterator)]() {
      return this.iterator();
    }
    tee() {
      let e = [],
        t = [],
        r = this.iterator(),
        n = (o) => ({
          next: () => {
            if (o.length === 0) {
              let i = r.next();
              e.push(i), t.push(i);
            }
            return o.shift();
          },
        });
      return [
        new s(() => n(e), this.controller, u(this, ss, "f")),
        new s(() => n(t), this.controller, u(this, ss, "f")),
      ];
    }
    toReadableStream() {
      let e = this,
        t;
      return fn({
        async start() {
          t = e[Symbol.asyncIterator]();
        },
        async pull(r) {
          try {
            let { value: n, done: o } = await t.next();
            if (o) return r.close();
            let i = Ht(
              JSON.stringify(n) +
                `
`,
            );
            r.enqueue(i);
          } catch (n) {
            r.error(n);
          }
        },
        async cancel() {
          await t.return?.();
        },
      });
    }
  };
async function* Ui(s, e) {
  if (!s.body)
    throw (
      (e.abort(),
      typeof globalThis.navigator < "u" &&
      globalThis.navigator.product === "ReactNative"
        ? new w(
            "The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api",
          )
        : new w("Attempted to iterate over a response with no body"))
    );
  let t = new Pn(),
    r = new st(),
    n = pn(s.body);
  for await (let o of Wi(n))
    for (let i of r.decode(o)) {
      let c = t.decode(i);
      c && (yield c);
    }
  for (let o of r.flush()) {
    let i = t.decode(o);
    i && (yield i);
  }
}
async function* Wi(s) {
  let e = new Uint8Array();
  for await (let t of s) {
    if (t == null) continue;
    let r =
        t instanceof ArrayBuffer
          ? new Uint8Array(t)
          : typeof t == "string"
            ? Ht(t)
            : t,
      n = new Uint8Array(e.length + r.length);
    n.set(e), n.set(r, e.length), (e = n);
    let o;
    for (; (o = Co(e)) !== -1; ) yield e.slice(0, o), (e = e.slice(o));
  }
  e.length > 0 && (yield e);
}
var Pn = class {
  constructor() {
    (this.event = null), (this.data = []), (this.chunks = []);
  }
  decode(e) {
    if ((e.endsWith("\r") && (e = e.substring(0, e.length - 1)), !e)) {
      if (!this.event && !this.data.length) return null;
      let o = {
        event: this.event,
        data: this.data.join(`
`),
        raw: this.chunks,
      };
      return (this.event = null), (this.data = []), (this.chunks = []), o;
    }
    if ((this.chunks.push(e), e.startsWith(":"))) return null;
    let [t, r, n] = ji(e, ":");
    return (
      n.startsWith(" ") && (n = n.substring(1)),
      t === "event" ? (this.event = n) : t === "data" && this.data.push(n),
      null
    );
  }
};
function ji(s, e) {
  let t = s.indexOf(e);
  return t !== -1
    ? [s.substring(0, t), e, s.substring(t + e.length)]
    : [s, "", ""];
}
async function Cs(s, e) {
  let {
      response: t,
      requestLogID: r,
      retryOfRequestLogID: n,
      startTime: o,
    } = e,
    i = await (async () => {
      if (e.options.stream)
        return (
          D(s).debug("response", t.status, t.url, t.headers, t.body),
          e.options.__streamClass
            ? e.options.__streamClass.fromSSEResponse(
                t,
                e.controller,
                s,
                e.options.__synthesizeEventData,
              )
            : ye.fromSSEResponse(
                t,
                e.controller,
                s,
                e.options.__synthesizeEventData,
              )
        );
      if (t.status === 204) return null;
      if (e.options.__binaryResponse) return t;
      let d = t.headers.get("content-type")?.split(";")[0]?.trim();
      if (d?.includes("application/json") || d?.endsWith("+json")) {
        if (t.headers.get("content-length") === "0") return;
        let _ = await t.json();
        return Tn(_, t);
      }
      return await t.text();
    })();
  return (
    D(s).debug(
      `[${r}] response parsed`,
      Pe({
        retryOfRequestLogID: n,
        url: t.url,
        status: t.status,
        body: i,
        durationMs: Date.now() - o,
      }),
    ),
    i
  );
}
function Tn(s, e) {
  return !s || typeof s != "object" || Array.isArray(s)
    ? s
    : Object.defineProperty(s, "_request_id", {
        value: e.headers.get("x-request-id"),
        enumerable: !1,
      });
}
var ns,
  nt = class s extends Promise {
    constructor(e, t, r = Cs) {
      super((n) => {
        n(null);
      }),
        (this.responsePromise = t),
        (this.parseResponse = r),
        ns.set(this, void 0),
        b(this, ns, e, "f");
    }
    _thenUnwrap(e) {
      return new s(u(this, ns, "f"), this.responsePromise, async (t, r) =>
        Tn(e(await this.parseResponse(t, r), r), r.response),
      );
    }
    asResponse() {
      return this.responsePromise.then((e) => e.response);
    }
    async withResponse() {
      let [e, t] = await Promise.all([this.parse(), this.asResponse()]);
      return {
        data: e,
        response: t,
        request_id: t.headers.get("x-request-id"),
      };
    }
    parse() {
      return (
        this.parsedPromise ||
          (this.parsedPromise = this.responsePromise.then((e) =>
            this.parseResponse(u(this, ns, "f"), e),
          )),
        this.parsedPromise
      );
    }
    then(e, t) {
      return this.parse().then(e, t);
    }
    catch(e) {
      return this.parse().catch(e);
    }
    finally(e) {
      return this.parse().finally(e);
    }
  };
ns = new WeakMap();
var $s,
  zt = class {
    constructor(e, t, r, n) {
      $s.set(this, void 0),
        b(this, $s, e, "f"),
        (this.options = n),
        (this.response = t),
        (this.body = r);
    }
    hasNextPage() {
      return this.getPaginatedItems().length
        ? this.nextPageRequestOptions() != null
        : !1;
    }
    async getNextPage() {
      let e = this.nextPageRequestOptions();
      if (!e)
        throw new w(
          "No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.",
        );
      return await u(this, $s, "f").requestAPIList(this.constructor, e);
    }
    async *iterPages() {
      let e = this;
      for (yield e; e.hasNextPage(); ) (e = await e.getNextPage()), yield e;
    }
    async *[(($s = new WeakMap()), Symbol.asyncIterator)]() {
      for await (let e of this.iterPages())
        for (let t of e.getPaginatedItems()) yield t;
    }
  },
  os = class extends nt {
    constructor(e, t, r) {
      super(
        e,
        t,
        async (n, o) => new r(n, o.response, await Cs(n, o), o.options),
      );
    }
    async *[Symbol.asyncIterator]() {
      let e = await this;
      for await (let t of e) yield t;
    }
  },
  re = class extends zt {
    constructor(e, t, r, n) {
      super(e, t, r, n), (this.data = r.data || []), (this.object = r.object);
    }
    getPaginatedItems() {
      return this.data ?? [];
    }
    nextPageRequestOptions() {
      return null;
    }
  },
  T = class extends zt {
    constructor(e, t, r, n) {
      super(e, t, r, n),
        (this.data = r.data || []),
        (this.has_more = r.has_more || !1);
    }
    getPaginatedItems() {
      return this.data ?? [];
    }
    hasNextPage() {
      return this.has_more === !1 ? !1 : super.hasNextPage();
    }
    nextPageRequestOptions() {
      let e = this.getPaginatedItems(),
        t = e[e.length - 1]?.id;
      return t
        ? { ...this.options, query: { ...bs(this.options.query), after: t } }
        : null;
    }
  },
  x = class extends zt {
    constructor(e, t, r, n) {
      super(e, t, r, n),
        (this.data = r.data || []),
        (this.has_more = r.has_more || !1),
        (this.last_id = r.last_id || "");
    }
    getPaginatedItems() {
      return this.data ?? [];
    }
    hasNextPage() {
      return this.has_more === !1 ? !1 : super.hasNextPage();
    }
    nextPageRequestOptions() {
      let e = this.last_id;
      return e
        ? { ...this.options, query: { ...bs(this.options.query), after: e } }
        : null;
    }
  },
  U = class extends zt {
    constructor(e, t, r, n) {
      super(e, t, r, n),
        (this.data = r.data || []),
        (this.has_more = r.has_more || !1),
        (this.next = r.next || null);
    }
    getPaginatedItems() {
      return this.data ?? [];
    }
    hasNextPage() {
      return this.has_more === !1 ? !1 : super.hasNextPage();
    }
    nextPageRequestOptions() {
      let e = this.next;
      return e
        ? { ...this.options, query: { ...bs(this.options.query), after: e } }
        : null;
    }
  };
var Bi = {
    jwt: "urn:ietf:params:oauth:token-type:jwt",
    id: "urn:ietf:params:oauth:token-type:id_token",
  },
  Hi = "urn:ietf:params:oauth:grant-type:token-exchange",
  ks = class {
    constructor(e, t) {
      (this.cachedToken = null),
        (this.refreshPromise = null),
        (this.tokenExchangeUrl = "https://auth.openai.com/oauth/token"),
        (this.config = e),
        (this.fetch = t ?? Es());
    }
    async getToken() {
      if (!this.cachedToken || this.isTokenExpired(this.cachedToken)) {
        if (this.refreshPromise) return await this.refreshPromise;
        this.refreshPromise = this.refreshToken();
        try {
          return await this.refreshPromise;
        } finally {
          this.refreshPromise = null;
        }
      }
      return (
        this.needsRefresh(this.cachedToken) &&
          !this.refreshPromise &&
          (this.refreshPromise = this.refreshToken().finally(() => {
            this.refreshPromise = null;
          })),
        this.cachedToken.token
      );
    }
    async refreshToken() {
      let e = await this.config.provider.getToken(),
        t = {
          grant_type: Hi,
          subject_token: e,
          subject_token_type: Bi[this.config.provider.tokenType],
          identity_provider_id: this.config.identityProviderId,
          service_account_id: this.config.serviceAccountId,
        };
      this.config.clientId && (t.client_id = this.config.clientId);
      let r = await this.fetch(this.tokenExchangeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      });
      if (!r.ok) {
        let c = await r.text(),
          d;
        try {
          d = JSON.parse(c);
        } catch {}
        throw r.status === 400 || r.status === 401 || r.status === 403
          ? new rt(r.status, d, r.headers)
          : L.generate(
              r.status,
              d,
              `Token exchange failed with status ${r.status}`,
              r.headers,
            );
      }
      let n = await r.json(),
        o = n.expires_in || 3600,
        i = Date.now() + o * 1e3;
      return (
        (this.cachedToken = { token: n.access_token, expiresAt: i }),
        n.access_token
      );
    }
    isTokenExpired(e) {
      return Date.now() >= e.expiresAt;
    }
    needsRefresh(e) {
      let r = (this.config.refreshBufferSeconds ?? 1200) * 1e3;
      return Date.now() >= e.expiresAt - r;
    }
    invalidateToken() {
      (this.cachedToken = null), (this.refreshPromise = null);
    }
  };
var Cn = () => {
  if (typeof File > "u") {
    let { process: s } = globalThis,
      e =
        typeof s?.versions?.node == "string" &&
        parseInt(s.versions.node.split(".")) < 20;
    throw new Error(
      "`File` is not defined as a global, which is required for file uploads." +
        (e
          ? " Update to Node 20 LTS or newer, or set `globalThis.File` to `import('node:buffer').File`."
          : ""),
    );
  }
};
function qt(s, e, t) {
  return Cn(), new File(s, e ?? "unknown_file", t);
}
function is(s) {
  return (
    (
      (typeof s == "object" &&
        s !== null &&
        (("name" in s && s.name && String(s.name)) ||
          ("url" in s && s.url && String(s.url)) ||
          ("filename" in s && s.filename && String(s.filename)) ||
          ("path" in s && s.path && String(s.path)))) ||
      ""
    )
      .split(/[\\/]/)
      .pop() || void 0
  );
}
var Os = (s) =>
    s != null &&
    typeof s == "object" &&
    typeof s[Symbol.asyncIterator] == "function",
  Fe = async (s, e) => (Rn(s.body) ? { ...s, body: await Oo(s.body, e) } : s),
  se = async (s, e) => ({ ...s, body: await Oo(s.body, e) }),
  ko = new WeakMap();
function zi(s) {
  let e = typeof s == "function" ? s : s.fetch,
    t = ko.get(e);
  if (t) return t;
  let r = (async () => {
    try {
      let n = "Response" in e ? e.Response : (await e("data:,")).constructor,
        o = new FormData();
      return o.toString() !== (await new n(o).text());
    } catch {
      return !0;
    }
  })();
  return ko.set(e, r), r;
}
var Oo = async (s, e) => {
    if (!(await zi(e)))
      throw new TypeError(
        "The provided fetch function does not support file uploads with the current global FormData class.",
      );
    let t = new FormData();
    return (
      await Promise.all(Object.entries(s || {}).map(([r, n]) => xn(t, r, n))), t
    );
  },
  vo = (s) => s instanceof Blob && "name" in s,
  qi = (s) =>
    typeof s == "object" &&
    s !== null &&
    (s instanceof Response || Os(s) || vo(s)),
  Rn = (s) => {
    if (qi(s)) return !0;
    if (Array.isArray(s)) return s.some(Rn);
    if (s && typeof s == "object") {
      for (let e in s) if (Rn(s[e])) return !0;
    }
    return !1;
  },
  xn = async (s, e, t) => {
    if (t !== void 0) {
      if (t == null)
        throw new TypeError(
          `Received null for "${e}"; to pass null in FormData, you must use the string 'null'`,
        );
      if (typeof t == "string" || typeof t == "number" || typeof t == "boolean")
        s.append(e, String(t));
      else if (t instanceof Response) s.append(e, qt([await t.blob()], is(t)));
      else if (Os(t))
        s.append(e, qt([await new Response(Ps(t)).blob()], is(t)));
      else if (vo(t)) s.append(e, t, is(t));
      else if (Array.isArray(t))
        await Promise.all(t.map((r) => xn(s, e + "[]", r)));
      else if (typeof t == "object")
        await Promise.all(
          Object.entries(t).map(([r, n]) => xn(s, `${e}[${r}]`, n)),
        );
      else
        throw new TypeError(
          `Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${t} instead`,
        );
    }
  };
var No = (s) =>
    s != null &&
    typeof s == "object" &&
    typeof s.size == "number" &&
    typeof s.type == "string" &&
    typeof s.text == "function" &&
    typeof s.slice == "function" &&
    typeof s.arrayBuffer == "function",
  Vi = (s) =>
    s != null &&
    typeof s == "object" &&
    typeof s.name == "string" &&
    typeof s.lastModified == "number" &&
    No(s),
  Ji = (s) =>
    s != null &&
    typeof s == "object" &&
    typeof s.url == "string" &&
    typeof s.blob == "function";
async function vs(s, e, t) {
  if ((Cn(), (s = await s), Vi(s)))
    return s instanceof File ? s : qt([await s.arrayBuffer()], s.name);
  if (Ji(s)) {
    let n = await s.blob();
    return (
      e || (e = new URL(s.url).pathname.split(/[\\/]/).pop()),
      qt(await $n(n), e, t)
    );
  }
  let r = await $n(s);
  if ((e || (e = is(s)), !t?.type)) {
    let n = r.find((o) => typeof o == "object" && "type" in o && o.type);
    typeof n == "string" && (t = { ...t, type: n });
  }
  return qt(r, e, t);
}
async function $n(s) {
  let e = [];
  if (typeof s == "string" || ArrayBuffer.isView(s) || s instanceof ArrayBuffer)
    e.push(s);
  else if (No(s)) e.push(s instanceof Blob ? s : await s.arrayBuffer());
  else if (Os(s)) for await (let t of s) e.push(...(await $n(t)));
  else {
    let t = s?.constructor?.name;
    throw new Error(
      `Unexpected data type: ${typeof s}${t ? `; constructor: ${t}` : ""}${Xi(s)}`,
    );
  }
  return e;
}
function Xi(s) {
  return typeof s != "object" || s === null
    ? ""
    : `; props: [${Object.getOwnPropertyNames(s)
        .map((t) => `"${t}"`)
        .join(", ")}]`;
}
var l = class {
  constructor(e) {
    this._client = e;
  }
};
function Do(s) {
  return s.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]+/g, encodeURIComponent);
}
var Lo = Object.freeze(Object.create(null)),
  Qi = (s = Do) =>
    function (t, ...r) {
      if (t.length === 1) return t[0];
      let n = !1,
        o = [],
        i = t.reduce((g, m, _) => {
          /[?#]/.test(m) && (n = !0);
          let f = r[_],
            A = (n ? encodeURIComponent : s)("" + f);
          return (
            _ !== r.length &&
              (f == null ||
                (typeof f == "object" &&
                  f.toString ===
                    Object.getPrototypeOf(
                      Object.getPrototypeOf(f.hasOwnProperty ?? Lo) ?? Lo,
                    )?.toString)) &&
              ((A = f + ""),
              o.push({
                start: g.length + m.length,
                length: A.length,
                error: `Value of type ${Object.prototype.toString.call(f).slice(8, -1)} is not a valid path parameter`,
              })),
            g + m + (_ === r.length ? "" : A)
          );
        }, ""),
        c = i.split(/[?#]/, 1)[0],
        d = /(?<=^|\/)(?:\.|%2e){1,2}(?=\/|$)/gi,
        h;
      for (; (h = d.exec(c)) !== null; )
        o.push({
          start: h.index,
          length: h[0].length,
          error: `Value "${h[0]}" can't be safely passed as a path parameter`,
        });
      if ((o.sort((g, m) => g.start - m.start), o.length > 0)) {
        let g = 0,
          m = o.reduce((_, f) => {
            let A = " ".repeat(f.start - g),
              I = "^".repeat(f.length);
            return (g = f.start + f.length), _ + A + I;
          }, "");
        throw new w(`Path parameters result in path with invalid segments:
${o.map((_) => _.error).join(`
`)}
${i}
${m}`);
      }
      return i;
    },
  a = Qi(Do);
var ot = class extends l {
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/chat/completions/${e}/messages`, T, {
      query: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
};
function as(s) {
  return s !== void 0 && "function" in s && s.function !== void 0;
}
function cs(s) {
  return s?.$brand === "auto-parseable-response-format";
}
function it(s) {
  return s?.$brand === "auto-parseable-tool";
}
function Mo(s, e) {
  return !e || !kn(e)
    ? {
        ...s,
        choices: s.choices.map(
          (t) => (
            Fo(t.message.tool_calls),
            {
              ...t,
              message: {
                ...t.message,
                parsed: null,
                ...(t.message.tool_calls
                  ? { tool_calls: t.message.tool_calls }
                  : void 0),
              },
            }
          ),
        ),
      }
    : ls(s, e);
}
function ls(s, e) {
  let t = s.choices.map((r) => {
    if (r.finish_reason === "length") throw new Kt();
    if (r.finish_reason === "content_filter") throw new Bt();
    return (
      Fo(r.message.tool_calls),
      {
        ...r,
        message: {
          ...r.message,
          ...(r.message.tool_calls
            ? {
                tool_calls:
                  r.message.tool_calls?.map((n) => ra(e, n)) ?? void 0,
              }
            : void 0),
          parsed:
            r.message.content && !r.message.refusal
              ? ta(e, r.message.content)
              : null,
        },
      }
    );
  });
  return { ...s, choices: t };
}
function ta(s, e) {
  return s.response_format?.type !== "json_schema"
    ? null
    : s.response_format?.type === "json_schema"
      ? "$parseRaw" in s.response_format
        ? s.response_format.$parseRaw(e)
        : JSON.parse(e)
      : null;
}
function ra(s, e) {
  let t = s.tools?.find((r) => as(r) && r.function?.name === e.function.name);
  return {
    ...e,
    function: {
      ...e.function,
      parsed_arguments: it(t)
        ? t.$parseRaw(e.function.arguments)
        : t?.function.strict
          ? JSON.parse(e.function.arguments)
          : null,
    },
  };
}
function Go(s, e) {
  if (!s || !("tools" in s) || !s.tools) return !1;
  let t = s.tools?.find((r) => as(r) && r.function?.name === e.function.name);
  return as(t) && (it(t) || t?.function.strict || !1);
}
function kn(s) {
  return cs(s.response_format)
    ? !0
    : (s.tools?.some(
        (e) => it(e) || (e.type === "function" && e.function.strict === !0),
      ) ?? !1);
}
function Fo(s) {
  for (let e of s || [])
    if (e.type !== "function")
      throw new w(
        `Currently only \`function\` tool calls are supported; Received \`${e.type}\``,
      );
}
function Uo(s) {
  for (let e of s ?? []) {
    if (e.type !== "function")
      throw new w(
        `Currently only \`function\` tool types support auto-parsing; Received \`${e.type}\``,
      );
    if (e.function.strict !== !0)
      throw new w(
        `The \`${e.function.name}\` tool is not marked with \`strict: true\`. Only strict function tools can be auto-parsed`,
      );
  }
}
var Vt = (s) => s?.role === "assistant",
  On = (s) => s?.role === "tool";
var vn,
  Ns,
  Ls,
  us,
  hs,
  Ds,
  ds,
  Te,
  ms,
  Ms,
  Gs,
  Jt,
  Wo,
  Ue = class {
    constructor() {
      vn.add(this),
        (this.controller = new AbortController()),
        Ns.set(this, void 0),
        Ls.set(this, () => {}),
        us.set(this, () => {}),
        hs.set(this, void 0),
        Ds.set(this, () => {}),
        ds.set(this, () => {}),
        Te.set(this, {}),
        ms.set(this, !1),
        Ms.set(this, !1),
        Gs.set(this, !1),
        Jt.set(this, !1),
        b(
          this,
          Ns,
          new Promise((e, t) => {
            b(this, Ls, e, "f"), b(this, us, t, "f");
          }),
          "f",
        ),
        b(
          this,
          hs,
          new Promise((e, t) => {
            b(this, Ds, e, "f"), b(this, ds, t, "f");
          }),
          "f",
        ),
        u(this, Ns, "f").catch(() => {}),
        u(this, hs, "f").catch(() => {});
    }
    _run(e) {
      setTimeout(() => {
        e().then(
          () => {
            this._emitFinal(), this._emit("end");
          },
          u(this, vn, "m", Wo).bind(this),
        );
      }, 0);
    }
    _connected() {
      this.ended || (u(this, Ls, "f").call(this), this._emit("connect"));
    }
    get ended() {
      return u(this, ms, "f");
    }
    get errored() {
      return u(this, Ms, "f");
    }
    get aborted() {
      return u(this, Gs, "f");
    }
    abort() {
      this.controller.abort();
    }
    on(e, t) {
      return (
        (u(this, Te, "f")[e] || (u(this, Te, "f")[e] = [])).push({
          listener: t,
        }),
        this
      );
    }
    off(e, t) {
      let r = u(this, Te, "f")[e];
      if (!r) return this;
      let n = r.findIndex((o) => o.listener === t);
      return n >= 0 && r.splice(n, 1), this;
    }
    once(e, t) {
      return (
        (u(this, Te, "f")[e] || (u(this, Te, "f")[e] = [])).push({
          listener: t,
          once: !0,
        }),
        this
      );
    }
    emitted(e) {
      return new Promise((t, r) => {
        b(this, Jt, !0, "f"),
          e !== "error" && this.once("error", r),
          this.once(e, t);
      });
    }
    async done() {
      b(this, Jt, !0, "f"), await u(this, hs, "f");
    }
    _emit(e, ...t) {
      if (u(this, ms, "f")) return;
      e === "end" && (b(this, ms, !0, "f"), u(this, Ds, "f").call(this));
      let r = u(this, Te, "f")[e];
      if (
        (r &&
          ((u(this, Te, "f")[e] = r.filter((n) => !n.once)),
          r.forEach(({ listener: n }) => n(...t))),
        e === "abort")
      ) {
        let n = t[0];
        !u(this, Jt, "f") && !r?.length && Promise.reject(n),
          u(this, us, "f").call(this, n),
          u(this, ds, "f").call(this, n),
          this._emit("end");
        return;
      }
      if (e === "error") {
        let n = t[0];
        !u(this, Jt, "f") && !r?.length && Promise.reject(n),
          u(this, us, "f").call(this, n),
          u(this, ds, "f").call(this, n),
          this._emit("end");
      }
    }
    _emitFinal() {}
  };
(Ns = new WeakMap()),
  (Ls = new WeakMap()),
  (us = new WeakMap()),
  (hs = new WeakMap()),
  (Ds = new WeakMap()),
  (ds = new WeakMap()),
  (Te = new WeakMap()),
  (ms = new WeakMap()),
  (Ms = new WeakMap()),
  (Gs = new WeakMap()),
  (Jt = new WeakMap()),
  (vn = new WeakSet()),
  (Wo = function (e) {
    if (
      (b(this, Ms, !0, "f"),
      e instanceof Error && e.name === "AbortError" && (e = new F()),
      e instanceof F)
    )
      return b(this, Gs, !0, "f"), this._emit("abort", e);
    if (e instanceof w) return this._emit("error", e);
    if (e instanceof Error) {
      let t = new w(e.message);
      return (t.cause = e), this._emit("error", t);
    }
    return this._emit("error", new w(String(e)));
  });
function jo(s) {
  return typeof s.parse == "function";
}
var ne,
  Nn,
  Fs,
  Ln,
  Dn,
  Mn,
  Ko,
  Bo,
  sa = 10,
  Xt = class extends Ue {
    constructor() {
      super(...arguments),
        ne.add(this),
        (this._chatCompletions = []),
        (this.messages = []);
    }
    _addChatCompletion(e) {
      this._chatCompletions.push(e), this._emit("chatCompletion", e);
      let t = e.choices[0]?.message;
      return t && this._addMessage(t), e;
    }
    _addMessage(e, t = !0) {
      if (("content" in e || (e.content = null), this.messages.push(e), t)) {
        if ((this._emit("message", e), On(e) && e.content))
          this._emit("functionToolCallResult", e.content);
        else if (Vt(e) && e.tool_calls)
          for (let r of e.tool_calls)
            r.type === "function" && this._emit("functionToolCall", r.function);
      }
    }
    async finalChatCompletion() {
      await this.done();
      let e = this._chatCompletions[this._chatCompletions.length - 1];
      if (!e) throw new w("stream ended without producing a ChatCompletion");
      return e;
    }
    async finalContent() {
      return await this.done(), u(this, ne, "m", Nn).call(this);
    }
    async finalMessage() {
      return await this.done(), u(this, ne, "m", Fs).call(this);
    }
    async finalFunctionToolCall() {
      return await this.done(), u(this, ne, "m", Ln).call(this);
    }
    async finalFunctionToolCallResult() {
      return await this.done(), u(this, ne, "m", Dn).call(this);
    }
    async totalUsage() {
      return await this.done(), u(this, ne, "m", Mn).call(this);
    }
    allChatCompletions() {
      return [...this._chatCompletions];
    }
    _emitFinal() {
      let e = this._chatCompletions[this._chatCompletions.length - 1];
      e && this._emit("finalChatCompletion", e);
      let t = u(this, ne, "m", Fs).call(this);
      t && this._emit("finalMessage", t);
      let r = u(this, ne, "m", Nn).call(this);
      r && this._emit("finalContent", r);
      let n = u(this, ne, "m", Ln).call(this);
      n && this._emit("finalFunctionToolCall", n);
      let o = u(this, ne, "m", Dn).call(this);
      o != null && this._emit("finalFunctionToolCallResult", o),
        this._chatCompletions.some((i) => i.usage) &&
          this._emit("totalUsage", u(this, ne, "m", Mn).call(this));
    }
    async _createChatCompletion(e, t, r) {
      let n = r?.signal;
      n &&
        (n.aborted && this.controller.abort(),
        n.addEventListener("abort", () => this.controller.abort())),
        u(this, ne, "m", Ko).call(this, t);
      let o = await e.chat.completions.create(
        { ...t, stream: !1 },
        { ...r, signal: this.controller.signal },
      );
      return this._connected(), this._addChatCompletion(ls(o, t));
    }
    async _runChatCompletion(e, t, r) {
      for (let n of t.messages) this._addMessage(n, !1);
      return await this._createChatCompletion(e, t, r);
    }
    async _runTools(e, t, r) {
      let n = "tool",
        { tool_choice: o = "auto", stream: i, ...c } = t,
        d = typeof o != "string" && o.type === "function" && o?.function?.name,
        { maxChatCompletions: h = sa } = r || {},
        g = t.tools.map((f) => {
          if (it(f)) {
            if (!f.$callback)
              throw new w(
                "Tool given to `.runTools()` that does not have an associated function",
              );
            return {
              type: "function",
              function: {
                function: f.$callback,
                name: f.function.name,
                description: f.function.description || "",
                parameters: f.function.parameters,
                parse: f.$parseRaw,
                strict: !0,
              },
            };
          }
          return f;
        }),
        m = {};
      for (let f of g)
        f.type === "function" &&
          (m[f.function.name || f.function.function.name] = f.function);
      let _ =
        "tools" in t
          ? g.map((f) =>
              f.type === "function"
                ? {
                    type: "function",
                    function: {
                      name: f.function.name || f.function.function.name,
                      parameters: f.function.parameters,
                      description: f.function.description,
                      strict: f.function.strict,
                    },
                  }
                : f,
            )
          : void 0;
      for (let f of t.messages) this._addMessage(f, !1);
      for (let f = 0; f < h; ++f) {
        let I = (
          await this._createChatCompletion(
            e,
            { ...c, tool_choice: o, tools: _, messages: [...this.messages] },
            r,
          )
        ).choices[0]?.message;
        if (!I) throw new w("missing message in ChatCompletion response");
        if (!I.tool_calls?.length) return;
        for (let $ of I.tool_calls) {
          if ($.type !== "function") continue;
          let W = $.id,
            { name: E, arguments: O } = $.function,
            v = m[E];
          if (v) {
            if (d && d !== E) {
              let N = `Invalid tool_call: ${JSON.stringify(E)}. ${JSON.stringify(d)} requested. Please try again`;
              this._addMessage({ role: n, tool_call_id: W, content: N });
              continue;
            }
          } else {
            let N = `Invalid tool_call: ${JSON.stringify(E)}. Available options are: ${Object.keys(
              m,
            )
              .map((V) => JSON.stringify(V))
              .join(", ")}. Please try again`;
            this._addMessage({ role: n, tool_call_id: W, content: N });
            continue;
          }
          let ae;
          try {
            ae = jo(v) ? await v.parse(O) : O;
          } catch (N) {
            let V = N instanceof Error ? N.message : String(N);
            this._addMessage({ role: n, tool_call_id: W, content: V });
            continue;
          }
          let X = await v.function(ae, this),
            Y = u(this, ne, "m", Bo).call(this, X);
          if ((this._addMessage({ role: n, tool_call_id: W, content: Y }), d))
            return;
        }
      }
    }
  };
(ne = new WeakSet()),
  (Nn = function () {
    return u(this, ne, "m", Fs).call(this).content ?? null;
  }),
  (Fs = function () {
    let e = this.messages.length;
    for (; e-- > 0; ) {
      let t = this.messages[e];
      if (Vt(t))
        return { ...t, content: t.content ?? null, refusal: t.refusal ?? null };
    }
    throw new w(
      "stream ended without producing a ChatCompletionMessage with role=assistant",
    );
  }),
  (Ln = function () {
    for (let e = this.messages.length - 1; e >= 0; e--) {
      let t = this.messages[e];
      if (Vt(t) && t?.tool_calls?.length)
        return t.tool_calls.filter((r) => r.type === "function").at(-1)
          ?.function;
    }
  }),
  (Dn = function () {
    for (let e = this.messages.length - 1; e >= 0; e--) {
      let t = this.messages[e];
      if (
        On(t) &&
        t.content != null &&
        typeof t.content == "string" &&
        this.messages.some(
          (r) =>
            r.role === "assistant" &&
            r.tool_calls?.some(
              (n) => n.type === "function" && n.id === t.tool_call_id,
            ),
        )
      )
        return t.content;
    }
  }),
  (Mn = function () {
    let e = { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 };
    for (let { usage: t } of this._chatCompletions)
      t &&
        ((e.completion_tokens += t.completion_tokens),
        (e.prompt_tokens += t.prompt_tokens),
        (e.total_tokens += t.total_tokens));
    return e;
  }),
  (Ko = function (e) {
    if (e.n != null && e.n > 1)
      throw new w(
        "ChatCompletion convenience helpers only support n=1 at this time. To use n>1, please use chat.completions.create() directly.",
      );
  }),
  (Bo = function (e) {
    return typeof e == "string"
      ? e
      : e === void 0
        ? "undefined"
        : JSON.stringify(e);
  });
var fs = class s extends Xt {
  static runTools(e, t, r) {
    let n = new s(),
      o = {
        ...r,
        headers: { ...r?.headers, "X-Stainless-Helper-Method": "runTools" },
      };
    return n._run(() => n._runTools(e, t, o)), n;
  }
  _addMessage(e, t = !0) {
    super._addMessage(e, t),
      Vt(e) && e.content && this._emit("content", e.content);
  }
};
var J = {
    STR: 1,
    NUM: 2,
    ARR: 4,
    OBJ: 8,
    NULL: 16,
    BOOL: 32,
    NAN: 64,
    INFINITY: 128,
    MINUS_INFINITY: 256,
    INF: 384,
    SPECIAL: 496,
    ATOM: 499,
    COLLECTION: 12,
    ALL: 511,
  },
  Gn = class extends Error {},
  Fn = class extends Error {};
function na(s, e = J.ALL) {
  if (typeof s != "string")
    throw new TypeError(`expecting str, got ${typeof s}`);
  if (!s.trim()) throw new Error(`${s} is empty`);
  return oa(s.trim(), e);
}
var oa = (s, e) => {
    let t = s.length,
      r = 0,
      n = (_) => {
        throw new Gn(`${_} at position ${r}`);
      },
      o = (_) => {
        throw new Fn(`${_} at position ${r}`);
      },
      i = () => (
        m(),
        r >= t && n("Unexpected end of input"),
        s[r] === '"'
          ? c()
          : s[r] === "{"
            ? d()
            : s[r] === "["
              ? h()
              : s.substring(r, r + 4) === "null" ||
                  (J.NULL & e && t - r < 4 && "null".startsWith(s.substring(r)))
                ? ((r += 4), null)
                : s.substring(r, r + 4) === "true" ||
                    (J.BOOL & e &&
                      t - r < 4 &&
                      "true".startsWith(s.substring(r)))
                  ? ((r += 4), !0)
                  : s.substring(r, r + 5) === "false" ||
                      (J.BOOL & e &&
                        t - r < 5 &&
                        "false".startsWith(s.substring(r)))
                    ? ((r += 5), !1)
                    : s.substring(r, r + 8) === "Infinity" ||
                        (J.INFINITY & e &&
                          t - r < 8 &&
                          "Infinity".startsWith(s.substring(r)))
                      ? ((r += 8), 1 / 0)
                      : s.substring(r, r + 9) === "-Infinity" ||
                          (J.MINUS_INFINITY & e &&
                            1 < t - r &&
                            t - r < 9 &&
                            "-Infinity".startsWith(s.substring(r)))
                        ? ((r += 9), -1 / 0)
                        : s.substring(r, r + 3) === "NaN" ||
                            (J.NAN & e &&
                              t - r < 3 &&
                              "NaN".startsWith(s.substring(r)))
                          ? ((r += 3), NaN)
                          : g()
      ),
      c = () => {
        let _ = r,
          f = !1;
        for (r++; r < t && (s[r] !== '"' || (f && s[r - 1] === "\\")); )
          (f = s[r] === "\\" ? !f : !1), r++;
        if (s.charAt(r) == '"')
          try {
            return JSON.parse(s.substring(_, ++r - Number(f)));
          } catch (A) {
            o(String(A));
          }
        else if (J.STR & e)
          try {
            return JSON.parse(s.substring(_, r - Number(f)) + '"');
          } catch {
            return JSON.parse(s.substring(_, s.lastIndexOf("\\")) + '"');
          }
        n("Unterminated string literal");
      },
      d = () => {
        r++, m();
        let _ = {};
        try {
          for (; s[r] !== "}"; ) {
            if ((m(), r >= t && J.OBJ & e)) return _;
            let f = c();
            m(), r++;
            try {
              let A = i();
              Object.defineProperty(_, f, {
                value: A,
                writable: !0,
                enumerable: !0,
                configurable: !0,
              });
            } catch (A) {
              if (J.OBJ & e) return _;
              throw A;
            }
            m(), s[r] === "," && r++;
          }
        } catch {
          if (J.OBJ & e) return _;
          n("Expected '}' at end of object");
        }
        return r++, _;
      },
      h = () => {
        r++;
        let _ = [];
        try {
          for (; s[r] !== "]"; ) _.push(i()), m(), s[r] === "," && r++;
        } catch {
          if (J.ARR & e) return _;
          n("Expected ']' at end of array");
        }
        return r++, _;
      },
      g = () => {
        if (r === 0) {
          s === "-" && J.NUM & e && n("Not sure what '-' is");
          try {
            return JSON.parse(s);
          } catch (f) {
            if (J.NUM & e)
              try {
                return s[s.length - 1] === "."
                  ? JSON.parse(s.substring(0, s.lastIndexOf(".")))
                  : JSON.parse(s.substring(0, s.lastIndexOf("e")));
              } catch {}
            o(String(f));
          }
        }
        let _ = r;
        for (s[r] === "-" && r++; s[r] && !",]}".includes(s[r]); ) r++;
        r == t && !(J.NUM & e) && n("Unterminated number literal");
        try {
          return JSON.parse(s.substring(_, r));
        } catch {
          s.substring(_, r) === "-" && J.NUM & e && n("Not sure what '-' is");
          try {
            return JSON.parse(s.substring(_, s.lastIndexOf("e")));
          } catch (A) {
            o(String(A));
          }
        }
      },
      m = () => {
        for (
          ;
          r < t &&
          ` 
\r	`.includes(s[r]);

        )
          r++;
      };
    return i();
  },
  Un = (s) => na(s, J.ALL ^ J.NUM);
var H,
  Re,
  Yt,
  We,
  Wn,
  Us,
  jn,
  Kn,
  Bn,
  Ws,
  Hn,
  Ho,
  at = class s extends Xt {
    constructor(e) {
      super(),
        H.add(this),
        Re.set(this, void 0),
        Yt.set(this, void 0),
        We.set(this, void 0),
        b(this, Re, e, "f"),
        b(this, Yt, [], "f");
    }
    get currentChatCompletionSnapshot() {
      return u(this, We, "f");
    }
    static fromReadableStream(e) {
      let t = new s(null);
      return t._run(() => t._fromReadableStream(e)), t;
    }
    static createChatCompletion(e, t, r) {
      let n = new s(t);
      return (
        n._run(() =>
          n._runChatCompletion(
            e,
            { ...t, stream: !0 },
            {
              ...r,
              headers: { ...r?.headers, "X-Stainless-Helper-Method": "stream" },
            },
          ),
        ),
        n
      );
    }
    async _createChatCompletion(e, t, r) {
      super._createChatCompletion;
      let n = r?.signal;
      n &&
        (n.aborted && this.controller.abort(),
        n.addEventListener("abort", () => this.controller.abort())),
        u(this, H, "m", Wn).call(this);
      let o = await e.chat.completions.create(
        { ...t, stream: !0 },
        { ...r, signal: this.controller.signal },
      );
      this._connected();
      for await (let i of o) u(this, H, "m", jn).call(this, i);
      if (o.controller.signal?.aborted) throw new F();
      return this._addChatCompletion(u(this, H, "m", Ws).call(this));
    }
    async _fromReadableStream(e, t) {
      let r = t?.signal;
      r &&
        (r.aborted && this.controller.abort(),
        r.addEventListener("abort", () => this.controller.abort())),
        u(this, H, "m", Wn).call(this),
        this._connected();
      let n = ye.fromReadableStream(e, this.controller),
        o;
      for await (let i of n)
        o &&
          o !== i.id &&
          this._addChatCompletion(u(this, H, "m", Ws).call(this)),
          u(this, H, "m", jn).call(this, i),
          (o = i.id);
      if (n.controller.signal?.aborted) throw new F();
      return this._addChatCompletion(u(this, H, "m", Ws).call(this));
    }
    [((Re = new WeakMap()),
    (Yt = new WeakMap()),
    (We = new WeakMap()),
    (H = new WeakSet()),
    (Wn = function () {
      this.ended || b(this, We, void 0, "f");
    }),
    (Us = function (t) {
      let r = u(this, Yt, "f")[t.index];
      return (
        r ||
        ((r = {
          content_done: !1,
          refusal_done: !1,
          logprobs_content_done: !1,
          logprobs_refusal_done: !1,
          done_tool_calls: new Set(),
          current_tool_call_index: null,
        }),
        (u(this, Yt, "f")[t.index] = r),
        r)
      );
    }),
    (jn = function (t) {
      if (this.ended) return;
      let r = u(this, H, "m", Ho).call(this, t);
      this._emit("chunk", t, r);
      for (let n of t.choices) {
        let o = r.choices[n.index];
        n.delta.content != null &&
          o.message?.role === "assistant" &&
          o.message?.content &&
          (this._emit("content", n.delta.content, o.message.content),
          this._emit("content.delta", {
            delta: n.delta.content,
            snapshot: o.message.content,
            parsed: o.message.parsed,
          })),
          n.delta.refusal != null &&
            o.message?.role === "assistant" &&
            o.message?.refusal &&
            this._emit("refusal.delta", {
              delta: n.delta.refusal,
              snapshot: o.message.refusal,
            }),
          n.logprobs?.content != null &&
            o.message?.role === "assistant" &&
            this._emit("logprobs.content.delta", {
              content: n.logprobs?.content,
              snapshot: o.logprobs?.content ?? [],
            }),
          n.logprobs?.refusal != null &&
            o.message?.role === "assistant" &&
            this._emit("logprobs.refusal.delta", {
              refusal: n.logprobs?.refusal,
              snapshot: o.logprobs?.refusal ?? [],
            });
        let i = u(this, H, "m", Us).call(this, o);
        o.finish_reason &&
          (u(this, H, "m", Bn).call(this, o),
          i.current_tool_call_index != null &&
            u(this, H, "m", Kn).call(this, o, i.current_tool_call_index));
        for (let c of n.delta.tool_calls ?? [])
          i.current_tool_call_index !== c.index &&
            (u(this, H, "m", Bn).call(this, o),
            i.current_tool_call_index != null &&
              u(this, H, "m", Kn).call(this, o, i.current_tool_call_index)),
            (i.current_tool_call_index = c.index);
        for (let c of n.delta.tool_calls ?? []) {
          let d = o.message.tool_calls?.[c.index];
          d?.type &&
            (d?.type === "function"
              ? this._emit("tool_calls.function.arguments.delta", {
                  name: d.function?.name,
                  index: c.index,
                  arguments: d.function.arguments,
                  parsed_arguments: d.function.parsed_arguments,
                  arguments_delta: c.function?.arguments ?? "",
                })
              : (d?.type, void 0));
        }
      }
    }),
    (Kn = function (t, r) {
      if (u(this, H, "m", Us).call(this, t).done_tool_calls.has(r)) return;
      let o = t.message.tool_calls?.[r];
      if (!o) throw new Error("no tool call snapshot");
      if (!o.type) throw new Error("tool call snapshot missing `type`");
      if (o.type === "function") {
        let i = u(this, Re, "f")?.tools?.find(
          (c) => as(c) && c.function.name === o.function.name,
        );
        this._emit("tool_calls.function.arguments.done", {
          name: o.function.name,
          index: r,
          arguments: o.function.arguments,
          parsed_arguments: it(i)
            ? i.$parseRaw(o.function.arguments)
            : i?.function.strict
              ? JSON.parse(o.function.arguments)
              : null,
        });
      } else o.type;
    }),
    (Bn = function (t) {
      let r = u(this, H, "m", Us).call(this, t);
      if (t.message.content && !r.content_done) {
        r.content_done = !0;
        let n = u(this, H, "m", Hn).call(this);
        this._emit("content.done", {
          content: t.message.content,
          parsed: n ? n.$parseRaw(t.message.content) : null,
        });
      }
      t.message.refusal &&
        !r.refusal_done &&
        ((r.refusal_done = !0),
        this._emit("refusal.done", { refusal: t.message.refusal })),
        t.logprobs?.content &&
          !r.logprobs_content_done &&
          ((r.logprobs_content_done = !0),
          this._emit("logprobs.content.done", { content: t.logprobs.content })),
        t.logprobs?.refusal &&
          !r.logprobs_refusal_done &&
          ((r.logprobs_refusal_done = !0),
          this._emit("logprobs.refusal.done", { refusal: t.logprobs.refusal }));
    }),
    (Ws = function () {
      if (this.ended) throw new w("stream has ended, this shouldn't happen");
      let t = u(this, We, "f");
      if (!t) throw new w("request ended without sending any chunks");
      return (
        b(this, We, void 0, "f"), b(this, Yt, [], "f"), ia(t, u(this, Re, "f"))
      );
    }),
    (Hn = function () {
      let t = u(this, Re, "f")?.response_format;
      return cs(t) ? t : null;
    }),
    (Ho = function (t) {
      var r, n, o, i;
      let c = u(this, We, "f"),
        { choices: d, ...h } = t;
      c ? Object.assign(c, h) : (c = b(this, We, { ...h, choices: [] }, "f"));
      for (let {
        delta: g,
        finish_reason: m,
        index: _,
        logprobs: f = null,
        ...A
      } of t.choices) {
        let I = c.choices[_];
        if (
          (I ||
            (I = c.choices[_] =
              { finish_reason: m, index: _, message: {}, logprobs: f, ...A }),
          f)
        )
          if (!I.logprobs) I.logprobs = Object.assign({}, f);
          else {
            let { content: X, refusal: Y, ...N } = f;
            Object.assign(I.logprobs, N),
              X &&
                ((r = I.logprobs).content ?? (r.content = []),
                I.logprobs.content.push(...X)),
              Y &&
                ((n = I.logprobs).refusal ?? (n.refusal = []),
                I.logprobs.refusal.push(...Y));
          }
        if (
          m &&
          ((I.finish_reason = m), u(this, Re, "f") && kn(u(this, Re, "f")))
        ) {
          if (m === "length") throw new Kt();
          if (m === "content_filter") throw new Bt();
        }
        if ((Object.assign(I, A), !g)) continue;
        let {
          content: $,
          refusal: W,
          function_call: E,
          role: O,
          tool_calls: v,
          ...ae
        } = g;
        if (
          (Object.assign(I.message, ae),
          W && (I.message.refusal = (I.message.refusal || "") + W),
          O && (I.message.role = O),
          E &&
            (I.message.function_call
              ? (E.name && (I.message.function_call.name = E.name),
                E.arguments &&
                  ((o = I.message.function_call).arguments ??
                    (o.arguments = ""),
                  (I.message.function_call.arguments += E.arguments)))
              : (I.message.function_call = E)),
          $ &&
            ((I.message.content = (I.message.content || "") + $),
            !I.message.refusal &&
              u(this, H, "m", Hn).call(this) &&
              (I.message.parsed = Un(I.message.content))),
          v)
        ) {
          I.message.tool_calls || (I.message.tool_calls = []);
          for (let { index: X, id: Y, type: N, function: V, ...G } of v) {
            let j = (i = I.message.tool_calls)[X] ?? (i[X] = {});
            Object.assign(j, G),
              Y && (j.id = Y),
              N && (j.type = N),
              V &&
                (j.function ??
                  (j.function = { name: V.name ?? "", arguments: "" })),
              V?.name && (j.function.name = V.name),
              V?.arguments &&
                ((j.function.arguments += V.arguments),
                Go(u(this, Re, "f"), j) &&
                  (j.function.parsed_arguments = Un(j.function.arguments)));
          }
        }
      }
      return c;
    }),
    Symbol.asyncIterator)]() {
      let e = [],
        t = [],
        r = !1;
      return (
        this.on("chunk", (n) => {
          let o = t.shift();
          o ? o.resolve(n) : e.push(n);
        }),
        this.on("end", () => {
          r = !0;
          for (let n of t) n.resolve(void 0);
          t.length = 0;
        }),
        this.on("abort", (n) => {
          r = !0;
          for (let o of t) o.reject(n);
          t.length = 0;
        }),
        this.on("error", (n) => {
          r = !0;
          for (let o of t) o.reject(n);
          t.length = 0;
        }),
        {
          next: async () =>
            e.length
              ? { value: e.shift(), done: !1 }
              : r
                ? { value: void 0, done: !0 }
                : new Promise((o, i) => t.push({ resolve: o, reject: i })).then(
                    (o) =>
                      o ? { value: o, done: !1 } : { value: void 0, done: !0 },
                  ),
          return: async () => (this.abort(), { value: void 0, done: !0 }),
        }
      );
    }
    toReadableStream() {
      return new ye(
        this[Symbol.asyncIterator].bind(this),
        this.controller,
      ).toReadableStream();
    }
  };
function ia(s, e) {
  let {
      id: t,
      choices: r,
      created: n,
      model: o,
      system_fingerprint: i,
      ...c
    } = s,
    d = {
      ...c,
      id: t,
      choices: r.map(
        ({ message: h, finish_reason: g, index: m, logprobs: _, ...f }) => {
          if (!g) throw new w(`missing finish_reason for choice ${m}`);
          let { content: A = null, function_call: I, tool_calls: $, ...W } = h,
            E = h.role;
          if (!E) throw new w(`missing role for choice ${m}`);
          if (I) {
            let { arguments: O, name: v } = I;
            if (O == null)
              throw new w(`missing function_call.arguments for choice ${m}`);
            if (!v) throw new w(`missing function_call.name for choice ${m}`);
            return {
              ...f,
              message: {
                content: A,
                function_call: { arguments: O, name: v },
                role: E,
                refusal: h.refusal ?? null,
              },
              finish_reason: g,
              index: m,
              logprobs: _,
            };
          }
          return $
            ? {
                ...f,
                index: m,
                finish_reason: g,
                logprobs: _,
                message: {
                  ...W,
                  role: E,
                  content: A,
                  refusal: h.refusal ?? null,
                  tool_calls: $.map((O, v) => {
                    let { function: ae, type: X, id: Y, ...N } = O,
                      { arguments: V, name: G, ...j } = ae || {};
                    if (Y == null)
                      throw new w(`missing choices[${m}].tool_calls[${v}].id
${js(s)}`);
                    if (X == null)
                      throw new w(`missing choices[${m}].tool_calls[${v}].type
${js(s)}`);
                    if (G == null)
                      throw new w(`missing choices[${m}].tool_calls[${v}].function.name
${js(s)}`);
                    if (V == null)
                      throw new w(`missing choices[${m}].tool_calls[${v}].function.arguments
${js(s)}`);
                    return {
                      ...N,
                      id: Y,
                      type: X,
                      function: { ...j, name: G, arguments: V },
                    };
                  }),
                },
              }
            : {
                ...f,
                message: {
                  ...W,
                  content: A,
                  role: E,
                  refusal: h.refusal ?? null,
                },
                finish_reason: g,
                index: m,
                logprobs: _,
              };
        },
      ),
      created: n,
      model: o,
      object: "chat.completion",
      ...(i ? { system_fingerprint: i } : {}),
    };
  return Mo(d, e);
}
function js(s) {
  return JSON.stringify(s);
}
var ps = class s extends at {
  static fromReadableStream(e) {
    let t = new s(null);
    return t._run(() => t._fromReadableStream(e)), t;
  }
  static runTools(e, t, r) {
    let n = new s(t),
      o = {
        ...r,
        headers: { ...r?.headers, "X-Stainless-Helper-Method": "runTools" },
      };
    return n._run(() => n._runTools(e, t, o)), n;
  }
};
var xe = class extends l {
  constructor() {
    super(...arguments), (this.messages = new ot(this._client));
  }
  create(e, t) {
    return this._client.post("/chat/completions", {
      body: e,
      ...t,
      stream: e.stream ?? !1,
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/chat/completions/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/chat/completions/${e}`, {
      body: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/chat/completions", T, {
      query: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/chat/completions/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  parse(e, t) {
    return (
      Uo(e.tools),
      this._client.chat.completions
        .create(e, {
          ...t,
          headers: {
            ...t?.headers,
            "X-Stainless-Helper-Method": "chat.completions.parse",
          },
        })
        ._thenUnwrap((r) => ls(r, e))
    );
  }
  runTools(e, t) {
    return e.stream
      ? ps.runTools(this._client, e, t)
      : fs.runTools(this._client, e, t);
  }
  stream(e, t) {
    return at.createChatCompletion(this._client, e, t);
  }
};
xe.Messages = ot;
var je = class extends l {
  constructor() {
    super(...arguments), (this.completions = new xe(this._client));
  }
};
je.Completions = xe;
var Qt = class extends l {
  create(e, t) {
    return this._client.post("/organization/admin_api_keys", {
      body: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/organization/admin_api_keys/${e}`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/organization/admin_api_keys", T, {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/organization/admin_api_keys/${e}`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var Zt = class extends l {
  list(e = {}, t) {
    return this._client.getAPIList("/organization/audit_logs", x, {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var er = class extends l {
  create(e, t) {
    return this._client.post("/organization/certificates", {
      body: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t = {}, r) {
    return this._client.get(a`/organization/certificates/${e}`, {
      query: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/organization/certificates/${e}`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/organization/certificates", x, {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/organization/certificates/${e}`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  activate(e, t) {
    return this._client.getAPIList("/organization/certificates/activate", re, {
      body: e,
      method: "post",
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  deactivate(e, t) {
    return this._client.getAPIList(
      "/organization/certificates/deactivate",
      re,
      { body: e, method: "post", ...t, __security: { adminAPIKeyAuth: !0 } },
    );
  }
};
var tr = class extends l {
  retrieve(e) {
    return this._client.get("/organization/data_retention", {
      ...e,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  update(e, t) {
    return this._client.post("/organization/data_retention", {
      body: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var rr = class extends l {
  create(e, t) {
    return this._client.post("/organization/invites", {
      body: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/organization/invites/${e}`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/organization/invites", x, {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/organization/invites/${e}`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var sr = class extends l {
  create(e, t) {
    return this._client.post("/organization/roles", {
      body: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/organization/roles/${e}`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/organization/roles/${e}`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/organization/roles", U, {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/organization/roles/${e}`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var nr = class extends l {
  create(e, t) {
    return this._client.post("/organization/spend_alerts", {
      body: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/organization/spend_alerts/${e}`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/organization/spend_alerts", x, {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/organization/spend_alerts/${e}`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var or = class extends l {
  audioSpeeches(e, t) {
    return this._client.get("/organization/usage/audio_speeches", {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  audioTranscriptions(e, t) {
    return this._client.get("/organization/usage/audio_transcriptions", {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  codeInterpreterSessions(e, t) {
    return this._client.get("/organization/usage/code_interpreter_sessions", {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  completions(e, t) {
    return this._client.get("/organization/usage/completions", {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  costs(e, t) {
    return this._client.get("/organization/costs", {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  embeddings(e, t) {
    return this._client.get("/organization/usage/embeddings", {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  fileSearchCalls(e, t) {
    return this._client.get("/organization/usage/file_search_calls", {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  images(e, t) {
    return this._client.get("/organization/usage/images", {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  moderations(e, t) {
    return this._client.get("/organization/usage/moderations", {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  vectorStores(e, t) {
    return this._client.get("/organization/usage/vector_stores", {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  webSearchCalls(e, t) {
    return this._client.get("/organization/usage/web_search_calls", {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var ir = class extends l {
  create(e, t, r) {
    return this._client.post(a`/organization/groups/${e}/roles`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { group_id: n } = t;
    return this._client.get(a`/organization/groups/${n}/roles/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/organization/groups/${e}/roles`, U, {
      query: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { group_id: n } = t;
    return this._client.delete(a`/organization/groups/${n}/roles/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var ar = class extends l {
  create(e, t, r) {
    return this._client.post(a`/organization/groups/${e}/users`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { group_id: n } = t;
    return this._client.get(a`/organization/groups/${n}/users/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/organization/groups/${e}/users`, U, {
      query: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { group_id: n } = t;
    return this._client.delete(a`/organization/groups/${n}/users/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var Ke = class extends l {
  constructor() {
    super(...arguments),
      (this.users = new ar(this._client)),
      (this.roles = new ir(this._client));
  }
  create(e, t) {
    return this._client.post("/organization/groups", {
      body: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/organization/groups/${e}`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/organization/groups/${e}`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/organization/groups", U, {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/organization/groups/${e}`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
Ke.Users = ar;
Ke.Roles = ir;
var cr = class extends l {
  retrieve(e, t, r) {
    let { project_id: n } = t;
    return this._client.get(a`/organization/projects/${n}/api_keys/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/organization/projects/${e}/api_keys`, x, {
      query: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { project_id: n } = t;
    return this._client.delete(a`/organization/projects/${n}/api_keys/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var lr = class extends l {
  list(e, t = {}, r) {
    return this._client.getAPIList(
      a`/organization/projects/${e}/certificates`,
      x,
      { query: t, ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
  activate(e, t, r) {
    return this._client.getAPIList(
      a`/organization/projects/${e}/certificates/activate`,
      re,
      { body: t, method: "post", ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
  deactivate(e, t, r) {
    return this._client.getAPIList(
      a`/organization/projects/${e}/certificates/deactivate`,
      re,
      { body: t, method: "post", ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
};
var ur = class extends l {
  retrieve(e, t) {
    return this._client.get(a`/organization/projects/${e}/data_retention`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/organization/projects/${e}/data_retention`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var hr = class extends l {
  retrieve(e, t) {
    return this._client.get(
      a`/organization/projects/${e}/hosted_tool_permissions`,
      { ...t, __security: { adminAPIKeyAuth: !0 } },
    );
  }
  update(e, t, r) {
    return this._client.post(
      a`/organization/projects/${e}/hosted_tool_permissions`,
      { body: t, ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
};
var dr = class extends l {
  retrieve(e, t) {
    return this._client.get(a`/organization/projects/${e}/model_permissions`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/organization/projects/${e}/model_permissions`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(
      a`/organization/projects/${e}/model_permissions`,
      { ...t, __security: { adminAPIKeyAuth: !0 } },
    );
  }
};
var mr = class extends l {
  listRateLimits(e, t = {}, r) {
    return this._client.getAPIList(
      a`/organization/projects/${e}/rate_limits`,
      x,
      { query: t, ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
  updateRateLimit(e, t, r) {
    let { project_id: n, ...o } = t;
    return this._client.post(a`/organization/projects/${n}/rate_limits/${e}`, {
      body: o,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var fr = class extends l {
  create(e, t, r) {
    return this._client.post(a`/projects/${e}/roles`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { project_id: n } = t;
    return this._client.get(a`/projects/${n}/roles/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  update(e, t, r) {
    let { project_id: n, ...o } = t;
    return this._client.post(a`/projects/${n}/roles/${e}`, {
      body: o,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/projects/${e}/roles`, U, {
      query: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { project_id: n } = t;
    return this._client.delete(a`/projects/${n}/roles/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var pr = class extends l {
  create(e, t, r) {
    return this._client.post(a`/organization/projects/${e}/service_accounts`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { project_id: n } = t;
    return this._client.get(
      a`/organization/projects/${n}/service_accounts/${e}`,
      { ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
  update(e, t, r) {
    let { project_id: n, ...o } = t;
    return this._client.post(
      a`/organization/projects/${n}/service_accounts/${e}`,
      { body: o, ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(
      a`/organization/projects/${e}/service_accounts`,
      x,
      { query: t, ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
  delete(e, t, r) {
    let { project_id: n } = t;
    return this._client.delete(
      a`/organization/projects/${n}/service_accounts/${e}`,
      { ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
};
var _r = class extends l {
  create(e, t, r) {
    return this._client.post(a`/organization/projects/${e}/spend_alerts`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  update(e, t, r) {
    let { project_id: n, ...o } = t;
    return this._client.post(a`/organization/projects/${n}/spend_alerts/${e}`, {
      body: o,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(
      a`/organization/projects/${e}/spend_alerts`,
      x,
      { query: t, ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
  delete(e, t, r) {
    let { project_id: n } = t;
    return this._client.delete(
      a`/organization/projects/${n}/spend_alerts/${e}`,
      { ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
};
var gr = class extends l {
  create(e, t, r) {
    let { project_id: n, ...o } = t;
    return this._client.post(a`/projects/${n}/groups/${e}/roles`, {
      body: o,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { project_id: n, group_id: o } = t;
    return this._client.get(a`/projects/${n}/groups/${o}/roles/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e, t, r) {
    let { project_id: n, ...o } = t;
    return this._client.getAPIList(a`/projects/${n}/groups/${e}/roles`, U, {
      query: o,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { project_id: n, group_id: o } = t;
    return this._client.delete(a`/projects/${n}/groups/${o}/roles/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var ct = class extends l {
  constructor() {
    super(...arguments), (this.roles = new gr(this._client));
  }
  create(e, t, r) {
    return this._client.post(a`/organization/projects/${e}/groups`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { project_id: n, ...o } = t;
    return this._client.get(a`/organization/projects/${n}/groups/${e}`, {
      query: o,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/organization/projects/${e}/groups`, U, {
      query: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { project_id: n } = t;
    return this._client.delete(a`/organization/projects/${n}/groups/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
ct.Roles = gr;
var yr = class extends l {
  create(e, t, r) {
    let { project_id: n, ...o } = t;
    return this._client.post(a`/projects/${n}/users/${e}/roles`, {
      body: o,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { project_id: n, user_id: o } = t;
    return this._client.get(a`/projects/${n}/users/${o}/roles/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e, t, r) {
    let { project_id: n, ...o } = t;
    return this._client.getAPIList(a`/projects/${n}/users/${e}/roles`, U, {
      query: o,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { project_id: n, user_id: o } = t;
    return this._client.delete(a`/projects/${n}/users/${o}/roles/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var lt = class extends l {
  constructor() {
    super(...arguments), (this.roles = new yr(this._client));
  }
  create(e, t, r) {
    return this._client.post(a`/organization/projects/${e}/users`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { project_id: n } = t;
    return this._client.get(a`/organization/projects/${n}/users/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  update(e, t, r) {
    let { project_id: n, ...o } = t;
    return this._client.post(a`/organization/projects/${n}/users/${e}`, {
      body: o,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/organization/projects/${e}/users`, x, {
      query: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { project_id: n } = t;
    return this._client.delete(a`/organization/projects/${n}/users/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
lt.Roles = yr;
var Q = class extends l {
  constructor() {
    super(...arguments),
      (this.users = new lt(this._client)),
      (this.serviceAccounts = new pr(this._client)),
      (this.apiKeys = new cr(this._client)),
      (this.rateLimits = new mr(this._client)),
      (this.modelPermissions = new dr(this._client)),
      (this.hostedToolPermissions = new hr(this._client)),
      (this.groups = new ct(this._client)),
      (this.roles = new fr(this._client)),
      (this.dataRetention = new ur(this._client)),
      (this.spendAlerts = new _r(this._client)),
      (this.certificates = new lr(this._client));
  }
  create(e, t) {
    return this._client.post("/organization/projects", {
      body: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/organization/projects/${e}`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/organization/projects/${e}`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/organization/projects", x, {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  archive(e, t) {
    return this._client.post(a`/organization/projects/${e}/archive`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
Q.Users = lt;
Q.ServiceAccounts = pr;
Q.APIKeys = cr;
Q.RateLimits = mr;
Q.ModelPermissions = dr;
Q.HostedToolPermissions = hr;
Q.Groups = ct;
Q.Roles = fr;
Q.DataRetention = ur;
Q.SpendAlerts = _r;
Q.Certificates = lr;
var Ar = class extends l {
  create(e, t, r) {
    return this._client.post(a`/organization/users/${e}/roles`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { user_id: n } = t;
    return this._client.get(a`/organization/users/${n}/roles/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/organization/users/${e}/roles`, U, {
      query: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { user_id: n } = t;
    return this._client.delete(a`/organization/users/${n}/roles/${e}`, {
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
var ut = class extends l {
  constructor() {
    super(...arguments), (this.roles = new Ar(this._client));
  }
  retrieve(e, t) {
    return this._client.get(a`/organization/users/${e}`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/organization/users/${e}`, {
      body: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/organization/users", x, {
      query: e,
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/organization/users/${e}`, {
      ...t,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
};
ut.Roles = Ar;
var Z = class extends l {
  constructor() {
    super(...arguments),
      (this.auditLogs = new Zt(this._client)),
      (this.adminAPIKeys = new Qt(this._client)),
      (this.usage = new or(this._client)),
      (this.invites = new rr(this._client)),
      (this.users = new ut(this._client)),
      (this.groups = new Ke(this._client)),
      (this.roles = new sr(this._client)),
      (this.dataRetention = new tr(this._client)),
      (this.spendAlerts = new nr(this._client)),
      (this.certificates = new er(this._client)),
      (this.projects = new Q(this._client));
  }
};
Z.AuditLogs = Zt;
Z.AdminAPIKeys = Qt;
Z.Usage = or;
Z.Invites = rr;
Z.Users = ut;
Z.Groups = Ke;
Z.Roles = sr;
Z.DataRetention = tr;
Z.SpendAlerts = nr;
Z.Certificates = er;
Z.Projects = Q;
var Be = class extends l {
  constructor() {
    super(...arguments), (this.organization = new Z(this._client));
  }
};
Be.Organization = Z;
var zo = Symbol("brand.privateNullableHeaders");
function* Da(s) {
  if (!s) return;
  if (zo in s) {
    let { values: r, nulls: n } = s;
    yield* r.entries();
    for (let o of n) yield [o, null];
    return;
  }
  let e = !1,
    t;
  s instanceof Headers
    ? (t = s.entries())
    : dn(s)
      ? (t = s)
      : ((e = !0), (t = Object.entries(s ?? {})));
  for (let r of t) {
    let n = r[0];
    if (typeof n != "string")
      throw new TypeError("expected header name to be a string");
    let o = dn(r[1]) ? r[1] : [r[1]],
      i = !1;
    for (let c of o)
      c !== void 0 && (e && !i && ((i = !0), yield [n, null]), yield [n, c]);
  }
}
var p = (s) => {
  let e = new Headers(),
    t = new Set();
  for (let r of s) {
    let n = new Set();
    for (let [o, i] of Da(r)) {
      let c = o.toLowerCase();
      n.has(c) || (e.delete(o), n.add(c)),
        i === null ? (e.delete(o), t.add(c)) : (e.append(o, i), t.delete(c));
    }
  }
  return { [zo]: !0, values: e, nulls: t };
};
var Sr = class extends l {
  create(e, t) {
    return this._client.post("/audio/speech", {
      body: e,
      ...t,
      headers: p([{ Accept: "application/octet-stream" }, t?.headers]),
      __security: { bearerAuth: !0 },
      __binaryResponse: !0,
    });
  }
};
var wr = class extends l {
  create(e, t) {
    return this._client.post(
      "/audio/transcriptions",
      se(
        {
          body: e,
          ...t,
          stream: e.stream ?? !1,
          __metadata: { model: e.model },
          __security: { bearerAuth: !0 },
        },
        this._client,
      ),
    );
  }
};
var Ir = class extends l {
  create(e, t) {
    return this._client.post(
      "/audio/translations",
      se(
        {
          body: e,
          ...t,
          __metadata: { model: e.model },
          __security: { bearerAuth: !0 },
        },
        this._client,
      ),
    );
  }
};
var Ae = class extends l {
  constructor() {
    super(...arguments),
      (this.transcriptions = new wr(this._client)),
      (this.translations = new Ir(this._client)),
      (this.speech = new Sr(this._client));
  }
};
Ae.Transcriptions = wr;
Ae.Translations = Ir;
Ae.Speech = Sr;
var ht = class extends l {
  create(e, t) {
    return this._client.post("/batches", {
      body: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/batches/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/batches", T, {
      query: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  cancel(e, t) {
    return this._client.post(a`/batches/${e}/cancel`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
};
var br = class extends l {
  create(e, t) {
    return this._client.post("/assistants", {
      body: e,
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/assistants/${e}`, {
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/assistants/${e}`, {
      body: t,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/assistants", T, {
      query: e,
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/assistants/${e}`, {
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
};
var Er = class extends l {
  create(e, t) {
    return this._client.post("/realtime/sessions", {
      body: e,
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
};
var Pr = class extends l {
  create(e, t) {
    return this._client.post("/realtime/transcription_sessions", {
      body: e,
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
};
var He = class extends l {
  constructor() {
    super(...arguments),
      (this.sessions = new Er(this._client)),
      (this.transcriptionSessions = new Pr(this._client));
  }
};
He.Sessions = Er;
He.TranscriptionSessions = Pr;
var Tr = class extends l {
  create(e, t) {
    return this._client.post("/chatkit/sessions", {
      body: e,
      ...t,
      headers: p([{ "OpenAI-Beta": "chatkit_beta=v1" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  cancel(e, t) {
    return this._client.post(a`/chatkit/sessions/${e}/cancel`, {
      ...t,
      headers: p([{ "OpenAI-Beta": "chatkit_beta=v1" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
};
var Rr = class extends l {
  retrieve(e, t) {
    return this._client.get(a`/chatkit/threads/${e}`, {
      ...t,
      headers: p([{ "OpenAI-Beta": "chatkit_beta=v1" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/chatkit/threads", x, {
      query: e,
      ...t,
      headers: p([{ "OpenAI-Beta": "chatkit_beta=v1" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/chatkit/threads/${e}`, {
      ...t,
      headers: p([{ "OpenAI-Beta": "chatkit_beta=v1" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  listItems(e, t = {}, r) {
    return this._client.getAPIList(a`/chatkit/threads/${e}/items`, x, {
      query: t,
      ...r,
      headers: p([{ "OpenAI-Beta": "chatkit_beta=v1" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
};
var ze = class extends l {
  constructor() {
    super(...arguments),
      (this.sessions = new Tr(this._client)),
      (this.threads = new Rr(this._client));
  }
};
ze.Sessions = Tr;
ze.Threads = Rr;
var xr = class extends l {
  create(e, t, r) {
    return this._client.post(a`/threads/${e}/messages`, {
      body: t,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { thread_id: n } = t;
    return this._client.get(a`/threads/${n}/messages/${e}`, {
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  update(e, t, r) {
    let { thread_id: n, ...o } = t;
    return this._client.post(a`/threads/${n}/messages/${e}`, {
      body: o,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/threads/${e}/messages`, T, {
      query: t,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { thread_id: n } = t;
    return this._client.delete(a`/threads/${n}/messages/${e}`, {
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
};
var Cr = class extends l {
  retrieve(e, t, r) {
    let { thread_id: n, run_id: o, ...i } = t;
    return this._client.get(a`/threads/${n}/runs/${o}/steps/${e}`, {
      query: i,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  list(e, t, r) {
    let { thread_id: n, ...o } = t;
    return this._client.getAPIList(a`/threads/${n}/runs/${e}/steps`, T, {
      query: o,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
};
var qo = (s) => {
  if (typeof Buffer < "u") {
    let e = Buffer.from(s, "base64");
    return Array.from(
      new Float32Array(
        e.buffer,
        e.byteOffset,
        e.length / Float32Array.BYTES_PER_ELEMENT,
      ),
    );
  } else {
    let e = atob(s),
      t = e.length,
      r = new Uint8Array(t);
    for (let n = 0; n < t; n++) r[n] = e.charCodeAt(n);
    return Array.from(new Float32Array(r.buffer));
  }
};
var Se = (s) => {
  if (typeof globalThis.process < "u")
    return globalThis.process.env?.[s]?.trim() || void 0;
  if (typeof globalThis.Deno < "u")
    return globalThis.Deno.env?.get?.(s)?.trim() || void 0;
};
var ee,
  mt,
  zn,
  we,
  Ks,
  de,
  ft,
  $r,
  dt,
  zs,
  ue,
  Bs,
  Hs,
  ys,
  _s,
  gs,
  Vo,
  Jo,
  Xo,
  Yo,
  Qo,
  Zo,
  ei,
  Ce = class extends Ue {
    constructor() {
      super(...arguments),
        ee.add(this),
        zn.set(this, []),
        we.set(this, {}),
        Ks.set(this, {}),
        de.set(this, void 0),
        ft.set(this, void 0),
        $r.set(this, void 0),
        dt.set(this, void 0),
        zs.set(this, void 0),
        ue.set(this, void 0),
        Bs.set(this, void 0),
        Hs.set(this, void 0),
        ys.set(this, void 0);
    }
    [((zn = new WeakMap()),
    (we = new WeakMap()),
    (Ks = new WeakMap()),
    (de = new WeakMap()),
    (ft = new WeakMap()),
    ($r = new WeakMap()),
    (dt = new WeakMap()),
    (zs = new WeakMap()),
    (ue = new WeakMap()),
    (Bs = new WeakMap()),
    (Hs = new WeakMap()),
    (ys = new WeakMap()),
    (ee = new WeakSet()),
    Symbol.asyncIterator)]() {
      let e = [],
        t = [],
        r = !1;
      return (
        this.on("event", (n) => {
          let o = t.shift();
          o ? o.resolve(n) : e.push(n);
        }),
        this.on("end", () => {
          r = !0;
          for (let n of t) n.resolve(void 0);
          t.length = 0;
        }),
        this.on("abort", (n) => {
          r = !0;
          for (let o of t) o.reject(n);
          t.length = 0;
        }),
        this.on("error", (n) => {
          r = !0;
          for (let o of t) o.reject(n);
          t.length = 0;
        }),
        {
          next: async () =>
            e.length
              ? { value: e.shift(), done: !1 }
              : r
                ? { value: void 0, done: !0 }
                : new Promise((o, i) => t.push({ resolve: o, reject: i })).then(
                    (o) =>
                      o ? { value: o, done: !1 } : { value: void 0, done: !0 },
                  ),
          return: async () => (this.abort(), { value: void 0, done: !0 }),
        }
      );
    }
    static fromReadableStream(e) {
      let t = new mt();
      return t._run(() => t._fromReadableStream(e)), t;
    }
    async _fromReadableStream(e, t) {
      let r = t?.signal;
      r &&
        (r.aborted && this.controller.abort(),
        r.addEventListener("abort", () => this.controller.abort())),
        this._connected();
      let n = ye.fromReadableStream(e, this.controller);
      for await (let o of n) u(this, ee, "m", _s).call(this, o);
      if (n.controller.signal?.aborted) throw new F();
      return this._addRun(u(this, ee, "m", gs).call(this));
    }
    toReadableStream() {
      return new ye(
        this[Symbol.asyncIterator].bind(this),
        this.controller,
      ).toReadableStream();
    }
    static createToolAssistantStream(e, t, r, n) {
      let o = new mt();
      return (
        o._run(() =>
          o._runToolAssistantStream(e, t, r, {
            ...n,
            headers: { ...n?.headers, "X-Stainless-Helper-Method": "stream" },
          }),
        ),
        o
      );
    }
    async _createToolAssistantStream(e, t, r, n) {
      let o = n?.signal;
      o &&
        (o.aborted && this.controller.abort(),
        o.addEventListener("abort", () => this.controller.abort()));
      let i = { ...r, stream: !0 },
        c = await e.submitToolOutputs(t, i, {
          ...n,
          signal: this.controller.signal,
        });
      this._connected();
      for await (let d of c) u(this, ee, "m", _s).call(this, d);
      if (c.controller.signal?.aborted) throw new F();
      return this._addRun(u(this, ee, "m", gs).call(this));
    }
    static createThreadAssistantStream(e, t, r) {
      let n = new mt();
      return (
        n._run(() =>
          n._threadAssistantStream(e, t, {
            ...r,
            headers: { ...r?.headers, "X-Stainless-Helper-Method": "stream" },
          }),
        ),
        n
      );
    }
    static createAssistantStream(e, t, r, n) {
      let o = new mt();
      return (
        o._run(() =>
          o._runAssistantStream(e, t, r, {
            ...n,
            headers: { ...n?.headers, "X-Stainless-Helper-Method": "stream" },
          }),
        ),
        o
      );
    }
    currentEvent() {
      return u(this, Bs, "f");
    }
    currentRun() {
      return u(this, Hs, "f");
    }
    currentMessageSnapshot() {
      return u(this, de, "f");
    }
    currentRunStepSnapshot() {
      return u(this, ys, "f");
    }
    async finalRunSteps() {
      return await this.done(), Object.values(u(this, we, "f"));
    }
    async finalMessages() {
      return await this.done(), Object.values(u(this, Ks, "f"));
    }
    async finalRun() {
      if ((await this.done(), !u(this, ft, "f")))
        throw Error("Final run was not received.");
      return u(this, ft, "f");
    }
    async _createThreadAssistantStream(e, t, r) {
      let n = r?.signal;
      n &&
        (n.aborted && this.controller.abort(),
        n.addEventListener("abort", () => this.controller.abort()));
      let o = { ...t, stream: !0 },
        i = await e.createAndRun(o, { ...r, signal: this.controller.signal });
      this._connected();
      for await (let c of i) u(this, ee, "m", _s).call(this, c);
      if (i.controller.signal?.aborted) throw new F();
      return this._addRun(u(this, ee, "m", gs).call(this));
    }
    async _createAssistantStream(e, t, r, n) {
      let o = n?.signal;
      o &&
        (o.aborted && this.controller.abort(),
        o.addEventListener("abort", () => this.controller.abort()));
      let i = { ...r, stream: !0 },
        c = await e.create(t, i, { ...n, signal: this.controller.signal });
      this._connected();
      for await (let d of c) u(this, ee, "m", _s).call(this, d);
      if (c.controller.signal?.aborted) throw new F();
      return this._addRun(u(this, ee, "m", gs).call(this));
    }
    static accumulateDelta(e, t) {
      for (let [r, n] of Object.entries(t)) {
        if (!e.hasOwnProperty(r)) {
          e[r] = n;
          continue;
        }
        let o = e[r];
        if (o == null) {
          e[r] = n;
          continue;
        }
        if (r === "index" || r === "type") {
          e[r] = n;
          continue;
        }
        if (typeof o == "string" && typeof n == "string") o += n;
        else if (typeof o == "number" && typeof n == "number") o += n;
        else if (ts(o) && ts(n)) o = this.accumulateDelta(o, n);
        else if (Array.isArray(o) && Array.isArray(n)) {
          if (o.every((i) => typeof i == "string" || typeof i == "number")) {
            o.push(...n);
            continue;
          }
          for (let i of n) {
            if (!ts(i))
              throw new Error(
                `Expected array delta entry to be an object but got: ${i}`,
              );
            let c = i.index;
            if (c == null)
              throw (
                (console.error(i),
                new Error(
                  "Expected array delta entry to have an `index` property",
                ))
              );
            if (typeof c != "number")
              throw new Error(
                `Expected array delta entry \`index\` property to be a number but got ${c}`,
              );
            let d = o[c];
            d == null ? o.push(i) : (o[c] = this.accumulateDelta(d, i));
          }
          continue;
        } else
          throw Error(
            `Unhandled record type: ${r}, deltaValue: ${n}, accValue: ${o}`,
          );
        e[r] = o;
      }
      return e;
    }
    _addRun(e) {
      return e;
    }
    async _threadAssistantStream(e, t, r) {
      return await this._createThreadAssistantStream(t, e, r);
    }
    async _runAssistantStream(e, t, r, n) {
      return await this._createAssistantStream(t, e, r, n);
    }
    async _runToolAssistantStream(e, t, r, n) {
      return await this._createToolAssistantStream(t, e, r, n);
    }
  };
(mt = Ce),
  (_s = function (e) {
    if (!this.ended)
      switch (
        (b(this, Bs, e, "f"), u(this, ee, "m", Xo).call(this, e), e.event)
      ) {
        case "thread.created":
          break;
        case "thread.run.created":
        case "thread.run.queued":
        case "thread.run.in_progress":
        case "thread.run.requires_action":
        case "thread.run.completed":
        case "thread.run.incomplete":
        case "thread.run.failed":
        case "thread.run.cancelling":
        case "thread.run.cancelled":
        case "thread.run.expired":
          u(this, ee, "m", ei).call(this, e);
          break;
        case "thread.run.step.created":
        case "thread.run.step.in_progress":
        case "thread.run.step.delta":
        case "thread.run.step.completed":
        case "thread.run.step.failed":
        case "thread.run.step.cancelled":
        case "thread.run.step.expired":
          u(this, ee, "m", Jo).call(this, e);
          break;
        case "thread.message.created":
        case "thread.message.in_progress":
        case "thread.message.delta":
        case "thread.message.completed":
        case "thread.message.incomplete":
          u(this, ee, "m", Vo).call(this, e);
          break;
        case "error":
          throw new Error(
            "Encountered an error event in event processing - errors should be processed earlier",
          );
        default:
      }
  }),
  (gs = function () {
    if (this.ended) throw new w("stream has ended, this shouldn't happen");
    if (!u(this, ft, "f")) throw Error("Final run has not been received");
    return u(this, ft, "f");
  }),
  (Vo = function (e) {
    let [t, r] = u(this, ee, "m", Qo).call(this, e, u(this, de, "f"));
    b(this, de, t, "f"), (u(this, Ks, "f")[t.id] = t);
    for (let n of r) {
      let o = t.content[n.index];
      o?.type == "text" && this._emit("textCreated", o.text);
    }
    switch (e.event) {
      case "thread.message.created":
        this._emit("messageCreated", e.data);
        break;
      case "thread.message.in_progress":
        break;
      case "thread.message.delta":
        if ((this._emit("messageDelta", e.data.delta, t), e.data.delta.content))
          for (let n of e.data.delta.content) {
            if (n.type == "text" && n.text) {
              let o = n.text,
                i = t.content[n.index];
              if (i && i.type == "text") this._emit("textDelta", o, i.text);
              else
                throw Error(
                  "The snapshot associated with this text delta is not text or missing",
                );
            }
            if (n.index != u(this, $r, "f")) {
              if (u(this, dt, "f"))
                switch (u(this, dt, "f").type) {
                  case "text":
                    this._emit(
                      "textDone",
                      u(this, dt, "f").text,
                      u(this, de, "f"),
                    );
                    break;
                  case "image_file":
                    this._emit(
                      "imageFileDone",
                      u(this, dt, "f").image_file,
                      u(this, de, "f"),
                    );
                    break;
                }
              b(this, $r, n.index, "f");
            }
            b(this, dt, t.content[n.index], "f");
          }
        break;
      case "thread.message.completed":
      case "thread.message.incomplete":
        if (u(this, $r, "f") !== void 0) {
          let n = e.data.content[u(this, $r, "f")];
          if (n)
            switch (n.type) {
              case "image_file":
                this._emit("imageFileDone", n.image_file, u(this, de, "f"));
                break;
              case "text":
                this._emit("textDone", n.text, u(this, de, "f"));
                break;
            }
        }
        u(this, de, "f") && this._emit("messageDone", e.data),
          b(this, de, void 0, "f");
    }
  }),
  (Jo = function (e) {
    let t = u(this, ee, "m", Yo).call(this, e);
    switch ((b(this, ys, t, "f"), e.event)) {
      case "thread.run.step.created":
        this._emit("runStepCreated", e.data);
        break;
      case "thread.run.step.delta":
        let r = e.data.delta;
        if (
          r.step_details &&
          r.step_details.type == "tool_calls" &&
          r.step_details.tool_calls &&
          t.step_details.type == "tool_calls"
        )
          for (let o of r.step_details.tool_calls)
            o.index == u(this, zs, "f")
              ? this._emit(
                  "toolCallDelta",
                  o,
                  t.step_details.tool_calls[o.index],
                )
              : (u(this, ue, "f") &&
                  this._emit("toolCallDone", u(this, ue, "f")),
                b(this, zs, o.index, "f"),
                b(this, ue, t.step_details.tool_calls[o.index], "f"),
                u(this, ue, "f") &&
                  this._emit("toolCallCreated", u(this, ue, "f")));
        this._emit("runStepDelta", e.data.delta, t);
        break;
      case "thread.run.step.completed":
      case "thread.run.step.failed":
      case "thread.run.step.cancelled":
      case "thread.run.step.expired":
        b(this, ys, void 0, "f"),
          e.data.step_details.type == "tool_calls" &&
            u(this, ue, "f") &&
            (this._emit("toolCallDone", u(this, ue, "f")),
            b(this, ue, void 0, "f")),
          this._emit("runStepDone", e.data, t);
        break;
      case "thread.run.step.in_progress":
        break;
    }
  }),
  (Xo = function (e) {
    u(this, zn, "f").push(e), this._emit("event", e);
  }),
  (Yo = function (e) {
    switch (e.event) {
      case "thread.run.step.created":
        return (u(this, we, "f")[e.data.id] = e.data), e.data;
      case "thread.run.step.delta":
        let t = u(this, we, "f")[e.data.id];
        if (!t)
          throw Error("Received a RunStepDelta before creation of a snapshot");
        let r = e.data;
        if (r.delta) {
          let n = mt.accumulateDelta(t, r.delta);
          u(this, we, "f")[e.data.id] = n;
        }
        return u(this, we, "f")[e.data.id];
      case "thread.run.step.completed":
      case "thread.run.step.failed":
      case "thread.run.step.cancelled":
      case "thread.run.step.expired":
      case "thread.run.step.in_progress":
        u(this, we, "f")[e.data.id] = e.data;
        break;
    }
    if (u(this, we, "f")[e.data.id]) return u(this, we, "f")[e.data.id];
    throw new Error("No snapshot available");
  }),
  (Qo = function (e, t) {
    let r = [];
    switch (e.event) {
      case "thread.message.created":
        return [e.data, r];
      case "thread.message.delta":
        if (!t)
          throw Error(
            "Received a delta with no existing snapshot (there should be one from message creation)",
          );
        let n = e.data;
        if (n.delta.content)
          for (let o of n.delta.content)
            if (o.index in t.content) {
              let i = t.content[o.index];
              t.content[o.index] = u(this, ee, "m", Zo).call(this, o, i);
            } else (t.content[o.index] = o), r.push(o);
        return [t, r];
      case "thread.message.in_progress":
      case "thread.message.completed":
      case "thread.message.incomplete":
        if (t) return [t, r];
        throw Error("Received thread message event with no existing snapshot");
    }
    throw Error("Tried to accumulate a non-message event");
  }),
  (Zo = function (e, t) {
    return mt.accumulateDelta(t, e);
  }),
  (ei = function (e) {
    switch ((b(this, Hs, e.data, "f"), e.event)) {
      case "thread.run.created":
        break;
      case "thread.run.queued":
        break;
      case "thread.run.in_progress":
        break;
      case "thread.run.requires_action":
      case "thread.run.cancelled":
      case "thread.run.failed":
      case "thread.run.completed":
      case "thread.run.expired":
      case "thread.run.incomplete":
        b(this, ft, e.data, "f"),
          u(this, ue, "f") &&
            (this._emit("toolCallDone", u(this, ue, "f")),
            b(this, ue, void 0, "f"));
        break;
      case "thread.run.cancelling":
        break;
    }
  });
var pt = class extends l {
  constructor() {
    super(...arguments), (this.steps = new Cr(this._client));
  }
  create(e, t, r) {
    let { include: n, ...o } = t;
    return this._client.post(a`/threads/${e}/runs`, {
      query: { include: n },
      body: o,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      stream: t.stream ?? !1,
      __synthesizeEventData: !0,
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { thread_id: n } = t;
    return this._client.get(a`/threads/${n}/runs/${e}`, {
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  update(e, t, r) {
    let { thread_id: n, ...o } = t;
    return this._client.post(a`/threads/${n}/runs/${e}`, {
      body: o,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/threads/${e}/runs`, T, {
      query: t,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  cancel(e, t, r) {
    let { thread_id: n } = t;
    return this._client.post(a`/threads/${n}/runs/${e}/cancel`, {
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  async createAndPoll(e, t, r) {
    let n = await this.create(e, t, r);
    return await this.poll(n.id, { thread_id: e }, r);
  }
  createAndStream(e, t, r) {
    return Ce.createAssistantStream(e, this._client.beta.threads.runs, t, r);
  }
  async poll(e, t, r) {
    let n = p([
      r?.headers,
      {
        "X-Stainless-Poll-Helper": "true",
        "X-Stainless-Custom-Poll-Interval":
          r?.pollIntervalMs?.toString() ?? void 0,
      },
    ]);
    for (;;) {
      let { data: o, response: i } = await this.retrieve(e, t, {
        ...r,
        headers: { ...r?.headers, ...n },
      }).withResponse();
      switch (o.status) {
        case "queued":
        case "in_progress":
        case "cancelling":
          let c = 5e3;
          if (r?.pollIntervalMs) c = r.pollIntervalMs;
          else {
            let d = i.headers.get("openai-poll-after-ms");
            if (d) {
              let h = parseInt(d);
              isNaN(h) || (c = h);
            }
          }
          await _e(c);
          break;
        case "requires_action":
        case "incomplete":
        case "cancelled":
        case "completed":
        case "failed":
        case "expired":
          return o;
      }
    }
  }
  stream(e, t, r) {
    return Ce.createAssistantStream(e, this._client.beta.threads.runs, t, r);
  }
  submitToolOutputs(e, t, r) {
    let { thread_id: n, ...o } = t;
    return this._client.post(a`/threads/${n}/runs/${e}/submit_tool_outputs`, {
      body: o,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      stream: t.stream ?? !1,
      __synthesizeEventData: !0,
      __security: { bearerAuth: !0 },
    });
  }
  async submitToolOutputsAndPoll(e, t, r) {
    let n = await this.submitToolOutputs(e, t, r);
    return await this.poll(n.id, t, r);
  }
  submitToolOutputsStream(e, t, r) {
    return Ce.createToolAssistantStream(
      e,
      this._client.beta.threads.runs,
      t,
      r,
    );
  }
};
pt.Steps = Cr;
var qe = class extends l {
  constructor() {
    super(...arguments),
      (this.runs = new pt(this._client)),
      (this.messages = new xr(this._client));
  }
  create(e = {}, t) {
    return this._client.post("/threads", {
      body: e,
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/threads/${e}`, {
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/threads/${e}`, {
      body: t,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/threads/${e}`, {
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  createAndRun(e, t) {
    return this._client.post("/threads/runs", {
      body: e,
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      stream: e.stream ?? !1,
      __synthesizeEventData: !0,
      __security: { bearerAuth: !0 },
    });
  }
  async createAndRunPoll(e, t) {
    let r = await this.createAndRun(e, t);
    return await this.runs.poll(r.id, { thread_id: r.thread_id }, t);
  }
  createAndRunStream(e, t) {
    return Ce.createThreadAssistantStream(e, this._client.beta.threads, t);
  }
};
qe.Runs = pt;
qe.Messages = xr;
var me = class extends l {
  constructor() {
    super(...arguments),
      (this.realtime = new He(this._client)),
      (this.chatkit = new ze(this._client)),
      (this.assistants = new br(this._client)),
      (this.threads = new qe(this._client));
  }
};
me.Realtime = He;
me.ChatKit = ze;
me.Assistants = br;
me.Threads = qe;
var _t = class extends l {
  create(e, t) {
    return this._client.post("/completions", {
      body: e,
      ...t,
      stream: e.stream ?? !1,
      __security: { bearerAuth: !0 },
    });
  }
};
var kr = class extends l {
  retrieve(e, t, r) {
    let { container_id: n } = t;
    return this._client.get(a`/containers/${n}/files/${e}/content`, {
      ...r,
      headers: p([{ Accept: "application/binary" }, r?.headers]),
      __security: { bearerAuth: !0 },
      __binaryResponse: !0,
    });
  }
};
var gt = class extends l {
  constructor() {
    super(...arguments), (this.content = new kr(this._client));
  }
  create(e, t, r) {
    return this._client.post(
      a`/containers/${e}/files`,
      Fe({ body: t, ...r, __security: { bearerAuth: !0 } }, this._client),
    );
  }
  retrieve(e, t, r) {
    let { container_id: n } = t;
    return this._client.get(a`/containers/${n}/files/${e}`, {
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/containers/${e}/files`, T, {
      query: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { container_id: n } = t;
    return this._client.delete(a`/containers/${n}/files/${e}`, {
      ...r,
      headers: p([{ Accept: "*/*" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
};
gt.Content = kr;
var Ve = class extends l {
  constructor() {
    super(...arguments), (this.files = new gt(this._client));
  }
  create(e, t) {
    return this._client.post("/containers", {
      body: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/containers/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/containers", T, {
      query: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/containers/${e}`, {
      ...t,
      headers: p([{ Accept: "*/*" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
};
Ve.Files = gt;
var Or = class extends l {
  create(e, t, r) {
    let { include: n, ...o } = t;
    return this._client.post(a`/conversations/${e}/items`, {
      query: { include: n },
      body: o,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { conversation_id: n, ...o } = t;
    return this._client.get(a`/conversations/${n}/items/${e}`, {
      query: o,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/conversations/${e}/items`, x, {
      query: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { conversation_id: n } = t;
    return this._client.delete(a`/conversations/${n}/items/${e}`, {
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
};
var Je = class extends l {
  constructor() {
    super(...arguments), (this.items = new Or(this._client));
  }
  create(e = {}, t) {
    return this._client.post("/conversations", {
      body: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/conversations/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/conversations/${e}`, {
      body: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/conversations/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
};
Je.Items = Or;
var yt = class extends l {
  create(e, t) {
    let r = !!e.encoding_format,
      n = r ? e.encoding_format : "base64";
    r &&
      D(this._client).debug(
        "embeddings/user defined encoding_format:",
        e.encoding_format,
      );
    let o = this._client.post("/embeddings", {
      body: { ...e, encoding_format: n },
      ...t,
      __security: { bearerAuth: !0 },
    });
    return r
      ? o
      : (D(this._client).debug(
          "embeddings/decoding base64 embeddings from base64",
        ),
        o._thenUnwrap(
          (i) => (
            i &&
              i.data &&
              i.data.forEach((c) => {
                let d = c.embedding;
                c.embedding = qo(d);
              }),
            i
          ),
        ));
  }
};
var vr = class extends l {
  retrieve(e, t, r) {
    let { eval_id: n, run_id: o } = t;
    return this._client.get(a`/evals/${n}/runs/${o}/output_items/${e}`, {
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  list(e, t, r) {
    let { eval_id: n, ...o } = t;
    return this._client.getAPIList(a`/evals/${n}/runs/${e}/output_items`, T, {
      query: o,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
};
var At = class extends l {
  constructor() {
    super(...arguments), (this.outputItems = new vr(this._client));
  }
  create(e, t, r) {
    return this._client.post(a`/evals/${e}/runs`, {
      body: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { eval_id: n } = t;
    return this._client.get(a`/evals/${n}/runs/${e}`, {
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/evals/${e}/runs`, T, {
      query: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { eval_id: n } = t;
    return this._client.delete(a`/evals/${n}/runs/${e}`, {
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  cancel(e, t, r) {
    let { eval_id: n } = t;
    return this._client.post(a`/evals/${n}/runs/${e}`, {
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
};
At.OutputItems = vr;
var Xe = class extends l {
  constructor() {
    super(...arguments), (this.runs = new At(this._client));
  }
  create(e, t) {
    return this._client.post("/evals", {
      body: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/evals/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/evals/${e}`, {
      body: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/evals", T, {
      query: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/evals/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
};
Xe.Runs = At;
var St = class extends l {
  create(e, t) {
    return this._client.post(
      "/files",
      se({ body: e, ...t, __security: { bearerAuth: !0 } }, this._client),
    );
  }
  retrieve(e, t) {
    return this._client.get(a`/files/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/files", T, {
      query: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/files/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  content(e, t) {
    return this._client.get(a`/files/${e}/content`, {
      ...t,
      headers: p([{ Accept: "application/binary" }, t?.headers]),
      __security: { bearerAuth: !0 },
      __binaryResponse: !0,
    });
  }
  async waitForProcessing(
    e,
    { pollInterval: t = 5e3, maxWait: r = 1800 * 1e3 } = {},
  ) {
    let n = new Set(["processed", "error", "deleted"]),
      o = Date.now(),
      i = await this.retrieve(e);
    for (; !i.status || !n.has(i.status); )
      if ((await _e(t), (i = await this.retrieve(e)), Date.now() - o > r))
        throw new Me({
          message: `Giving up on waiting for file ${e} to finish processing after ${r} milliseconds.`,
        });
    return i;
  }
};
var Nr = class extends l {};
var Lr = class extends l {
  run(e, t) {
    return this._client.post("/fine_tuning/alpha/graders/run", {
      body: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  validate(e, t) {
    return this._client.post("/fine_tuning/alpha/graders/validate", {
      body: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
};
var wt = class extends l {
  constructor() {
    super(...arguments), (this.graders = new Lr(this._client));
  }
};
wt.Graders = Lr;
var Dr = class extends l {
  create(e, t, r) {
    return this._client.getAPIList(
      a`/fine_tuning/checkpoints/${e}/permissions`,
      re,
      { body: t, method: "post", ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
  retrieve(e, t = {}, r) {
    return this._client.get(a`/fine_tuning/checkpoints/${e}/permissions`, {
      query: t,
      ...r,
      __security: { adminAPIKeyAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(
      a`/fine_tuning/checkpoints/${e}/permissions`,
      x,
      { query: t, ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
  delete(e, t, r) {
    let { fine_tuned_model_checkpoint: n } = t;
    return this._client.delete(
      a`/fine_tuning/checkpoints/${n}/permissions/${e}`,
      { ...r, __security: { adminAPIKeyAuth: !0 } },
    );
  }
};
var It = class extends l {
  constructor() {
    super(...arguments), (this.permissions = new Dr(this._client));
  }
};
It.Permissions = Dr;
var Mr = class extends l {
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/fine_tuning/jobs/${e}/checkpoints`, T, {
      query: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
};
var bt = class extends l {
  constructor() {
    super(...arguments), (this.checkpoints = new Mr(this._client));
  }
  create(e, t) {
    return this._client.post("/fine_tuning/jobs", {
      body: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/fine_tuning/jobs/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/fine_tuning/jobs", T, {
      query: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  cancel(e, t) {
    return this._client.post(a`/fine_tuning/jobs/${e}/cancel`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  listEvents(e, t = {}, r) {
    return this._client.getAPIList(a`/fine_tuning/jobs/${e}/events`, T, {
      query: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  pause(e, t) {
    return this._client.post(a`/fine_tuning/jobs/${e}/pause`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  resume(e, t) {
    return this._client.post(a`/fine_tuning/jobs/${e}/resume`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
};
bt.Checkpoints = Mr;
var fe = class extends l {
  constructor() {
    super(...arguments),
      (this.methods = new Nr(this._client)),
      (this.jobs = new bt(this._client)),
      (this.checkpoints = new It(this._client)),
      (this.alpha = new wt(this._client));
  }
};
fe.Methods = Nr;
fe.Jobs = bt;
fe.Checkpoints = It;
fe.Alpha = wt;
var Gr = class extends l {};
var Ye = class extends l {
  constructor() {
    super(...arguments), (this.graderModels = new Gr(this._client));
  }
};
Ye.GraderModels = Gr;
var Et = class extends l {
  createVariation(e, t) {
    return this._client.post(
      "/images/variations",
      se({ body: e, ...t, __security: { bearerAuth: !0 } }, this._client),
    );
  }
  edit(e, t) {
    return this._client.post(
      "/images/edits",
      se(
        {
          body: e,
          ...t,
          stream: e.stream ?? !1,
          __security: { bearerAuth: !0 },
        },
        this._client,
      ),
    );
  }
  generate(e, t) {
    return this._client.post("/images/generations", {
      body: e,
      ...t,
      stream: e.stream ?? !1,
      __security: { bearerAuth: !0 },
    });
  }
};
var Pt = class extends l {
  retrieve(e, t) {
    return this._client.get(a`/models/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  list(e) {
    return this._client.getAPIList("/models", re, {
      ...e,
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/models/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
};
var Tt = class extends l {
  create(e, t) {
    return this._client.post("/moderations", {
      body: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
};
var Fr = class extends l {
  accept(e, t, r) {
    return this._client.post(a`/realtime/calls/${e}/accept`, {
      body: t,
      ...r,
      headers: p([{ Accept: "*/*" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  hangup(e, t) {
    return this._client.post(a`/realtime/calls/${e}/hangup`, {
      ...t,
      headers: p([{ Accept: "*/*" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  refer(e, t, r) {
    return this._client.post(a`/realtime/calls/${e}/refer`, {
      body: t,
      ...r,
      headers: p([{ Accept: "*/*" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  reject(e, t = {}, r) {
    return this._client.post(a`/realtime/calls/${e}/reject`, {
      body: t,
      ...r,
      headers: p([{ Accept: "*/*" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
};
var Ur = class extends l {
  create(e, t) {
    return this._client.post("/realtime/client_secrets", {
      body: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
};
var $e = class extends l {
  constructor() {
    super(...arguments),
      (this.clientSecrets = new Ur(this._client)),
      (this.calls = new Fr(this._client));
  }
};
$e.ClientSecrets = Ur;
$e.Calls = Fr;
function ti(s, e) {
  return !e || !mc(e)
    ? {
        ...s,
        output_parsed: null,
        output: s.output.map((t) =>
          t.type === "function_call"
            ? { ...t, parsed_arguments: null }
            : t.type === "message"
              ? {
                  ...t,
                  content: t.content.map((r) => ({ ...r, parsed: null })),
                }
              : t,
        ),
      }
    : qn(s, e);
}
function qn(s, e) {
  let t = s.output.map((n) => {
      if (n.type === "function_call")
        return { ...n, parsed_arguments: _c(e, n) };
      if (n.type === "message") {
        let o = n.content.map((i) =>
          i.type === "output_text" ? { ...i, parsed: dc(e, i.text) } : i,
        );
        return { ...n, content: o };
      }
      return n;
    }),
    r = Object.assign({}, s, { output: t });
  return (
    Object.getOwnPropertyDescriptor(s, "output_text") || qs(r),
    Object.defineProperty(r, "output_parsed", {
      enumerable: !0,
      get() {
        for (let n of r.output)
          if (n.type === "message") {
            for (let o of n.content)
              if (o.type === "output_text" && o.parsed !== null)
                return o.parsed;
          }
        return null;
      },
    }),
    r
  );
}
function dc(s, e) {
  return s.text?.format?.type !== "json_schema"
    ? null
    : "$parseRaw" in s.text?.format
      ? (s.text?.format).$parseRaw(e)
      : JSON.parse(e);
}
function mc(s) {
  return !!cs(s.text?.format);
}
function fc(s) {
  return s?.$brand === "auto-parseable-tool";
}
function pc(s, e) {
  return s.find((t) => t.type === "function" && t.name === e);
}
function _c(s, e) {
  let t = pc(s.tools ?? [], e.name);
  return {
    ...e,
    ...e,
    parsed_arguments: fc(t)
      ? t.$parseRaw(e.arguments)
      : t?.strict
        ? JSON.parse(e.arguments)
        : null,
  };
}
function qs(s) {
  let e = [];
  for (let t of s.output)
    if (t.type === "message")
      for (let r of t.content) r.type === "output_text" && e.push(r.text);
  s.output_text = e.join("");
}
var Wr,
  Vs,
  Qe,
  Js,
  ri,
  si,
  ni,
  oi,
  Xs = class s extends Ue {
    constructor(e) {
      super(),
        Wr.add(this),
        Vs.set(this, void 0),
        Qe.set(this, void 0),
        Js.set(this, void 0),
        b(this, Vs, e, "f");
    }
    static createResponse(e, t, r) {
      let n = new s(t);
      return (
        n._run(() =>
          n._createOrRetrieveResponse(e, t, {
            ...r,
            headers: { ...r?.headers, "X-Stainless-Helper-Method": "stream" },
          }),
        ),
        n
      );
    }
    async _createOrRetrieveResponse(e, t, r) {
      let n = r?.signal;
      n &&
        (n.aborted && this.controller.abort(),
        n.addEventListener("abort", () => this.controller.abort())),
        u(this, Wr, "m", ri).call(this);
      let o,
        i = null;
      "response_id" in t
        ? ((o = await e.responses.retrieve(
            t.response_id,
            { stream: !0 },
            { ...r, signal: this.controller.signal, stream: !0 },
          )),
          (i = t.starting_after ?? null))
        : (o = await e.responses.create(
            { ...t, stream: !0 },
            { ...r, signal: this.controller.signal },
          )),
        this._connected();
      for await (let c of o) u(this, Wr, "m", si).call(this, c, i);
      if (o.controller.signal?.aborted) throw new F();
      return u(this, Wr, "m", ni).call(this);
    }
    [((Vs = new WeakMap()),
    (Qe = new WeakMap()),
    (Js = new WeakMap()),
    (Wr = new WeakSet()),
    (ri = function () {
      this.ended || b(this, Qe, void 0, "f");
    }),
    (si = function (t, r) {
      if (this.ended) return;
      let n = (i, c) => {
          (r == null || c.sequence_number > r) && this._emit(i, c);
        },
        o = u(this, Wr, "m", oi).call(this, t);
      switch ((n("event", t), t.type)) {
        case "response.output_text.delta": {
          let i = o.output[t.output_index];
          if (!i) throw new w(`missing output at index ${t.output_index}`);
          if (i.type === "message") {
            let c = i.content[t.content_index];
            if (!c) throw new w(`missing content at index ${t.content_index}`);
            if (c.type !== "output_text")
              throw new w(
                `expected content to be 'output_text', got ${c.type}`,
              );
            n("response.output_text.delta", { ...t, snapshot: c.text });
          }
          break;
        }
        case "response.function_call_arguments.delta": {
          let i = o.output[t.output_index];
          if (!i) throw new w(`missing output at index ${t.output_index}`);
          i.type === "function_call" &&
            n("response.function_call_arguments.delta", {
              ...t,
              snapshot: i.arguments,
            });
          break;
        }
        default:
          n(t.type, t);
          break;
      }
    }),
    (ni = function () {
      if (this.ended) throw new w("stream has ended, this shouldn't happen");
      let t = u(this, Qe, "f");
      if (!t) throw new w("request ended without sending any events");
      b(this, Qe, void 0, "f");
      let r = gc(t, u(this, Vs, "f"));
      return b(this, Js, r, "f"), r;
    }),
    (oi = function (t) {
      let r = u(this, Qe, "f");
      if (!r) {
        if (t.type !== "response.created")
          throw new w(
            `When snapshot hasn't been set yet, expected 'response.created' event, got ${t.type}`,
          );
        return (r = b(this, Qe, t.response, "f")), r;
      }
      switch (t.type) {
        case "response.output_item.added": {
          r.output.push(t.item);
          break;
        }
        case "response.content_part.added": {
          let n = r.output[t.output_index];
          if (!n) throw new w(`missing output at index ${t.output_index}`);
          let o = n.type,
            i = t.part;
          o === "message" && i.type !== "reasoning_text"
            ? n.content.push(i)
            : o === "reasoning" &&
              i.type === "reasoning_text" &&
              (n.content || (n.content = []), n.content.push(i));
          break;
        }
        case "response.output_text.delta": {
          let n = r.output[t.output_index];
          if (!n) throw new w(`missing output at index ${t.output_index}`);
          if (n.type === "message") {
            let o = n.content[t.content_index];
            if (!o) throw new w(`missing content at index ${t.content_index}`);
            if (o.type !== "output_text")
              throw new w(
                `expected content to be 'output_text', got ${o.type}`,
              );
            o.text += t.delta;
          }
          break;
        }
        case "response.function_call_arguments.delta": {
          let n = r.output[t.output_index];
          if (!n) throw new w(`missing output at index ${t.output_index}`);
          n.type === "function_call" && (n.arguments += t.delta);
          break;
        }
        case "response.reasoning_text.delta": {
          let n = r.output[t.output_index];
          if (!n) throw new w(`missing output at index ${t.output_index}`);
          if (n.type === "reasoning") {
            let o = n.content?.[t.content_index];
            if (!o) throw new w(`missing content at index ${t.content_index}`);
            if (o.type !== "reasoning_text")
              throw new w(
                `expected content to be 'reasoning_text', got ${o.type}`,
              );
            o.text += t.delta;
          }
          break;
        }
        case "response.completed": {
          b(this, Qe, t.response, "f");
          break;
        }
      }
      return r;
    }),
    Symbol.asyncIterator)]() {
      let e = [],
        t = [],
        r = !1;
      return (
        this.on("event", (n) => {
          let o = t.shift();
          o ? o.resolve(n) : e.push(n);
        }),
        this.on("end", () => {
          r = !0;
          for (let n of t) n.resolve(void 0);
          t.length = 0;
        }),
        this.on("abort", (n) => {
          r = !0;
          for (let o of t) o.reject(n);
          t.length = 0;
        }),
        this.on("error", (n) => {
          r = !0;
          for (let o of t) o.reject(n);
          t.length = 0;
        }),
        {
          next: async () =>
            e.length
              ? { value: e.shift(), done: !1 }
              : r
                ? { value: void 0, done: !0 }
                : new Promise((o, i) => t.push({ resolve: o, reject: i })).then(
                    (o) =>
                      o ? { value: o, done: !1 } : { value: void 0, done: !0 },
                  ),
          return: async () => (this.abort(), { value: void 0, done: !0 }),
        }
      );
    }
    async finalResponse() {
      await this.done();
      let e = u(this, Js, "f");
      if (!e) throw new w("stream ended without producing a ChatCompletion");
      return e;
    }
  };
function gc(s, e) {
  return ti(s, e);
}
var jr = class extends l {
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/responses/${e}/input_items`, T, {
      query: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
};
var Kr = class extends l {
  count(e = {}, t) {
    return this._client.post("/responses/input_tokens", {
      body: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
};
var ke = class extends l {
  constructor() {
    super(...arguments),
      (this.inputItems = new jr(this._client)),
      (this.inputTokens = new Kr(this._client));
  }
  create(e, t) {
    return this._client
      .post("/responses", {
        body: e,
        ...t,
        stream: e.stream ?? !1,
        __security: { bearerAuth: !0 },
      })
      ._thenUnwrap(
        (r) => ("object" in r && r.object === "response" && qs(r), r),
      );
  }
  retrieve(e, t = {}, r) {
    return this._client
      .get(a`/responses/${e}`, {
        query: t,
        ...r,
        stream: t?.stream ?? !1,
        __security: { bearerAuth: !0 },
      })
      ._thenUnwrap(
        (n) => ("object" in n && n.object === "response" && qs(n), n),
      );
  }
  delete(e, t) {
    return this._client.delete(a`/responses/${e}`, {
      ...t,
      headers: p([{ Accept: "*/*" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  parse(e, t) {
    return this._client.responses.create(e, t)._thenUnwrap((r) => qn(r, e));
  }
  stream(e, t) {
    return Xs.createResponse(this._client, e, t);
  }
  cancel(e, t) {
    return this._client.post(a`/responses/${e}/cancel`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  compact(e, t) {
    return this._client.post("/responses/compact", {
      body: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
};
ke.InputItems = jr;
ke.InputTokens = Kr;
var Br = class extends l {
  retrieve(e, t) {
    return this._client.get(a`/skills/${e}/content`, {
      ...t,
      headers: p([{ Accept: "application/binary" }, t?.headers]),
      __security: { bearerAuth: !0 },
      __binaryResponse: !0,
    });
  }
};
var Hr = class extends l {
  retrieve(e, t, r) {
    let { skill_id: n } = t;
    return this._client.get(a`/skills/${n}/versions/${e}/content`, {
      ...r,
      headers: p([{ Accept: "application/binary" }, r?.headers]),
      __security: { bearerAuth: !0 },
      __binaryResponse: !0,
    });
  }
};
var Rt = class extends l {
  constructor() {
    super(...arguments), (this.content = new Hr(this._client));
  }
  create(e, t = {}, r) {
    return this._client.post(
      a`/skills/${e}/versions`,
      Fe({ body: t, ...r, __security: { bearerAuth: !0 } }, this._client),
    );
  }
  retrieve(e, t, r) {
    let { skill_id: n } = t;
    return this._client.get(a`/skills/${n}/versions/${e}`, {
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/skills/${e}/versions`, T, {
      query: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { skill_id: n } = t;
    return this._client.delete(a`/skills/${n}/versions/${e}`, {
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
};
Rt.Content = Hr;
var Oe = class extends l {
  constructor() {
    super(...arguments),
      (this.content = new Br(this._client)),
      (this.versions = new Rt(this._client));
  }
  create(e = {}, t) {
    return this._client.post(
      "/skills",
      Fe({ body: e, ...t, __security: { bearerAuth: !0 } }, this._client),
    );
  }
  retrieve(e, t) {
    return this._client.get(a`/skills/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/skills/${e}`, {
      body: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/skills", T, {
      query: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/skills/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
};
Oe.Content = Br;
Oe.Versions = Rt;
var zr = class extends l {
  create(e, t, r) {
    return this._client.post(
      a`/uploads/${e}/parts`,
      se({ body: t, ...r, __security: { bearerAuth: !0 } }, this._client),
    );
  }
};
var Ze = class extends l {
  constructor() {
    super(...arguments), (this.parts = new zr(this._client));
  }
  create(e, t) {
    return this._client.post("/uploads", {
      body: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  cancel(e, t) {
    return this._client.post(a`/uploads/${e}/cancel`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  complete(e, t, r) {
    return this._client.post(a`/uploads/${e}/complete`, {
      body: t,
      ...r,
      __security: { bearerAuth: !0 },
    });
  }
};
Ze.Parts = zr;
var ii = async (s) => {
  let e = await Promise.allSettled(s),
    t = e.filter((n) => n.status === "rejected");
  if (t.length) {
    for (let n of t) console.error(n.reason);
    throw new Error(`${t.length} promise(s) failed - see the above errors`);
  }
  let r = [];
  for (let n of e) n.status === "fulfilled" && r.push(n.value);
  return r;
};
var qr = class extends l {
  create(e, t, r) {
    return this._client.post(a`/vector_stores/${e}/file_batches`, {
      body: t,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { vector_store_id: n } = t;
    return this._client.get(a`/vector_stores/${n}/file_batches/${e}`, {
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  cancel(e, t, r) {
    let { vector_store_id: n } = t;
    return this._client.post(a`/vector_stores/${n}/file_batches/${e}/cancel`, {
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  async createAndPoll(e, t, r) {
    let n = await this.create(e, t);
    return await this.poll(e, n.id, r);
  }
  listFiles(e, t, r) {
    let { vector_store_id: n, ...o } = t;
    return this._client.getAPIList(
      a`/vector_stores/${n}/file_batches/${e}/files`,
      T,
      {
        query: o,
        ...r,
        headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
        __security: { bearerAuth: !0 },
      },
    );
  }
  async poll(e, t, r) {
    let n = p([
      r?.headers,
      {
        "X-Stainless-Poll-Helper": "true",
        "X-Stainless-Custom-Poll-Interval":
          r?.pollIntervalMs?.toString() ?? void 0,
      },
    ]);
    for (;;) {
      let { data: o, response: i } = await this.retrieve(
        t,
        { vector_store_id: e },
        { ...r, headers: n },
      ).withResponse();
      switch (o.status) {
        case "in_progress":
          let c = 5e3;
          if (r?.pollIntervalMs) c = r.pollIntervalMs;
          else {
            let d = i.headers.get("openai-poll-after-ms");
            if (d) {
              let h = parseInt(d);
              isNaN(h) || (c = h);
            }
          }
          await _e(c);
          break;
        case "failed":
        case "cancelled":
        case "completed":
          return o;
      }
    }
  }
  async uploadAndPoll(e, { files: t, fileIds: r = [] }, n) {
    if (t == null || t.length == 0)
      throw new Error(
        "No `files` provided to process. If you've already uploaded files you should use `.createAndPoll()` instead",
      );
    let o = n?.maxConcurrency ?? 5,
      i = Math.min(o, t.length),
      c = this._client,
      d = t.values(),
      h = [...r];
    async function g(_) {
      for (let f of _) {
        let A = await c.files.create({ file: f, purpose: "assistants" }, n);
        h.push(A.id);
      }
    }
    let m = Array(i).fill(d).map(g);
    return await ii(m), await this.createAndPoll(e, { file_ids: h });
  }
};
var Vr = class extends l {
  create(e, t, r) {
    return this._client.post(a`/vector_stores/${e}/files`, {
      body: t,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t, r) {
    let { vector_store_id: n } = t;
    return this._client.get(a`/vector_stores/${n}/files/${e}`, {
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  update(e, t, r) {
    let { vector_store_id: n, ...o } = t;
    return this._client.post(a`/vector_stores/${n}/files/${e}`, {
      body: o,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  list(e, t = {}, r) {
    return this._client.getAPIList(a`/vector_stores/${e}/files`, T, {
      query: t,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t, r) {
    let { vector_store_id: n } = t;
    return this._client.delete(a`/vector_stores/${n}/files/${e}`, {
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  async createAndPoll(e, t, r) {
    let n = await this.create(e, t, r);
    return await this.poll(e, n.id, r);
  }
  async poll(e, t, r) {
    let n = p([
      r?.headers,
      {
        "X-Stainless-Poll-Helper": "true",
        "X-Stainless-Custom-Poll-Interval":
          r?.pollIntervalMs?.toString() ?? void 0,
      },
    ]);
    for (;;) {
      let o = await this.retrieve(
          t,
          { vector_store_id: e },
          { ...r, headers: n },
        ).withResponse(),
        i = o.data;
      switch (i.status) {
        case "in_progress":
          let c = 5e3;
          if (r?.pollIntervalMs) c = r.pollIntervalMs;
          else {
            let d = o.response.headers.get("openai-poll-after-ms");
            if (d) {
              let h = parseInt(d);
              isNaN(h) || (c = h);
            }
          }
          await _e(c);
          break;
        case "failed":
        case "completed":
          return i;
      }
    }
  }
  async upload(e, t, r) {
    let n = await this._client.files.create(
      { file: t, purpose: "assistants" },
      r,
    );
    return this.create(e, { file_id: n.id }, r);
  }
  async uploadAndPoll(e, t, r) {
    let n = await this.upload(e, t, r);
    return await this.poll(e, n.id, r);
  }
  content(e, t, r) {
    let { vector_store_id: n } = t;
    return this._client.getAPIList(
      a`/vector_stores/${n}/files/${e}/content`,
      re,
      {
        ...r,
        headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
        __security: { bearerAuth: !0 },
      },
    );
  }
};
var ve = class extends l {
  constructor() {
    super(...arguments),
      (this.files = new Vr(this._client)),
      (this.fileBatches = new qr(this._client));
  }
  create(e, t) {
    return this._client.post("/vector_stores", {
      body: e,
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  retrieve(e, t) {
    return this._client.get(a`/vector_stores/${e}`, {
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  update(e, t, r) {
    return this._client.post(a`/vector_stores/${e}`, {
      body: t,
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/vector_stores", T, {
      query: e,
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/vector_stores/${e}`, {
      ...t,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
  search(e, t, r) {
    return this._client.getAPIList(a`/vector_stores/${e}/search`, re, {
      body: t,
      method: "post",
      ...r,
      headers: p([{ "OpenAI-Beta": "assistants=v2" }, r?.headers]),
      __security: { bearerAuth: !0 },
    });
  }
};
ve.Files = Vr;
ve.FileBatches = qr;
var xt = class extends l {
  create(e, t) {
    return this._client.post(
      "/videos",
      se({ body: e, ...t, __security: { bearerAuth: !0 } }, this._client),
    );
  }
  retrieve(e, t) {
    return this._client.get(a`/videos/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  list(e = {}, t) {
    return this._client.getAPIList("/videos", x, {
      query: e,
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  delete(e, t) {
    return this._client.delete(a`/videos/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  createCharacter(e, t) {
    return this._client.post(
      "/videos/characters",
      se({ body: e, ...t, __security: { bearerAuth: !0 } }, this._client),
    );
  }
  downloadContent(e, t = {}, r) {
    return this._client.get(a`/videos/${e}/content`, {
      query: t,
      ...r,
      headers: p([{ Accept: "application/binary" }, r?.headers]),
      __security: { bearerAuth: !0 },
      __binaryResponse: !0,
    });
  }
  edit(e, t) {
    return this._client.post(
      "/videos/edits",
      se({ body: e, ...t, __security: { bearerAuth: !0 } }, this._client),
    );
  }
  extend(e, t) {
    return this._client.post(
      "/videos/extensions",
      se({ body: e, ...t, __security: { bearerAuth: !0 } }, this._client),
    );
  }
  getCharacter(e, t) {
    return this._client.get(a`/videos/characters/${e}`, {
      ...t,
      __security: { bearerAuth: !0 },
    });
  }
  remix(e, t, r) {
    return this._client.post(
      a`/videos/${e}/remix`,
      Fe({ body: t, ...r, __security: { bearerAuth: !0 } }, this._client),
    );
  }
};
var Jr,
  ai,
  Ys,
  Ct = class extends l {
    constructor() {
      super(...arguments), Jr.add(this);
    }
    async unwrap(e, t, r = this._client.webhookSecret, n = 300) {
      return await this.verifySignature(e, t, r, n), JSON.parse(e);
    }
    async verifySignature(e, t, r = this._client.webhookSecret, n = 300) {
      if (
        typeof crypto > "u" ||
        typeof crypto.subtle.importKey != "function" ||
        typeof crypto.subtle.verify != "function"
      )
        throw new Error(
          "Webhook signature verification is only supported when the `crypto` global is defined",
        );
      u(this, Jr, "m", ai).call(this, r);
      let o = p([t]).values,
        i = u(this, Jr, "m", Ys).call(this, o, "webhook-signature"),
        c = u(this, Jr, "m", Ys).call(this, o, "webhook-timestamp"),
        d = u(this, Jr, "m", Ys).call(this, o, "webhook-id"),
        h = parseInt(c, 10);
      if (isNaN(h)) throw new pe("Invalid webhook timestamp format");
      let g = Math.floor(Date.now() / 1e3);
      if (g - h > n) throw new pe("Webhook timestamp is too old");
      if (h > g + n) throw new pe("Webhook timestamp is too new");
      let m = i
          .split(" ")
          .map((I) => (I.startsWith("v1,") ? I.substring(3) : I)),
        _ = r.startsWith("whsec_")
          ? Buffer.from(r.replace("whsec_", ""), "base64")
          : Buffer.from(r, "utf-8"),
        f = d ? `${d}.${c}.${e}` : `${c}.${e}`,
        A = await crypto.subtle.importKey(
          "raw",
          _,
          { name: "HMAC", hash: "SHA-256" },
          !1,
          ["verify"],
        );
      for (let I of m)
        try {
          let $ = Buffer.from(I, "base64");
          if (
            await crypto.subtle.verify(
              "HMAC",
              A,
              $,
              new TextEncoder().encode(f),
            )
          )
            return;
        } catch {
          continue;
        }
      throw new pe(
        "The given webhook signature does not match the expected signature",
      );
    }
  };
(Jr = new WeakSet()),
  (ai = function (e) {
    if (typeof e != "string" || e.length === 0)
      throw new Error(
        "The webhook secret must either be set using the env var, OPENAI_WEBHOOK_SECRET, on the client class, OpenAI({ webhookSecret: '123' }), or passed to this function",
      );
  }),
  (Ys = function (e, t) {
    if (!e) throw new Error("Headers are required");
    let r = e.get(t);
    if (r == null) throw new Error(`Missing required header: ${t}`);
    return r;
  });
var Vn,
  Jn,
  Qs,
  ci,
  Rc = "workload-identity-auth",
  P = class {
    constructor({
      baseURL: e = Se("OPENAI_BASE_URL"),
      apiKey: t = Se("OPENAI_API_KEY") ?? null,
      adminAPIKey: r = Se("OPENAI_ADMIN_KEY") ?? null,
      organization: n = Se("OPENAI_ORG_ID") ?? null,
      project: o = Se("OPENAI_PROJECT_ID") ?? null,
      webhookSecret: i = Se("OPENAI_WEBHOOK_SECRET") ?? null,
      workloadIdentity: c,
      ...d
    } = {}) {
      Vn.add(this),
        Qs.set(this, void 0),
        (this.completions = new _t(this)),
        (this.chat = new je(this)),
        (this.embeddings = new yt(this)),
        (this.files = new St(this)),
        (this.images = new Et(this)),
        (this.audio = new Ae(this)),
        (this.moderations = new Tt(this)),
        (this.models = new Pt(this)),
        (this.fineTuning = new fe(this)),
        (this.graders = new Ye(this)),
        (this.vectorStores = new ve(this)),
        (this.webhooks = new Ct(this)),
        (this.beta = new me(this)),
        (this.batches = new ht(this)),
        (this.uploads = new Ze(this)),
        (this.admin = new Be(this)),
        (this.responses = new ke(this)),
        (this.realtime = new $e(this)),
        (this.conversations = new Je(this)),
        (this.evals = new Xe(this)),
        (this.containers = new Ve(this)),
        (this.skills = new Oe(this)),
        (this.videos = new xt(this));
      let h = {
        apiKey: t,
        adminAPIKey: r,
        organization: n,
        project: o,
        webhookSecret: i,
        workloadIdentity: c,
        ...d,
        baseURL: e || "https://api.openai.com/v1",
      };
      if (t && c)
        throw new w(
          "The `apiKey` and `workloadIdentity` options are mutually exclusive",
        );
      if (!t && !r && !c)
        throw new w(
          "Missing credentials. Please pass an `apiKey`, `workloadIdentity`, `adminAPIKey`, or set the `OPENAI_API_KEY` or `OPENAI_ADMIN_KEY` environment variable.",
        );
      if (!h.dangerouslyAllowBrowser && mo())
        throw new w(`It looks like you're running in a browser-like environment.

This is disabled by default, as it risks exposing your secret API credentials to attackers.
If you understand the risks and have appropriate mitigations in place,
you can set the \`dangerouslyAllowBrowser\` option to \`true\`, e.g.,

new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety
`);
      (this.baseURL = h.baseURL),
        (this.timeout = h.timeout ?? Jn.DEFAULT_TIMEOUT),
        (this.logger = h.logger ?? console);
      let g = "warn";
      (this.logLevel = g),
        (this.logLevel =
          En(h.logLevel, "ClientOptions.logLevel", this) ??
          En(Se("OPENAI_LOG"), "process.env['OPENAI_LOG']", this) ??
          g),
        (this.fetchOptions = h.fetchOptions),
        (this.maxRetries = h.maxRetries ?? 2),
        (this.fetch = h.fetch ?? Es()),
        b(this, Qs, _o, "f");
      let m = Se("OPENAI_CUSTOM_HEADERS");
      if (m) {
        let _ = {};
        for (let f of m.split(`
`)) {
          let A = f.indexOf(":");
          A >= 0 && (_[f.substring(0, A).trim()] = f.substring(A + 1).trim());
        }
        h.defaultHeaders = p([_, h.defaultHeaders]);
      }
      (this._options = h),
        c && (this._workloadIdentityAuth = new ks(c, this.fetch)),
        (this.apiKey = typeof t == "string" ? t : null),
        (this.adminAPIKey = r),
        (this.organization = n),
        (this.project = o),
        (this.webhookSecret = i);
    }
    withOptions(e) {
      return new this.constructor({
        ...this._options,
        baseURL: this.baseURL,
        maxRetries: this.maxRetries,
        timeout: this.timeout,
        logger: this.logger,
        logLevel: this.logLevel,
        fetch: this.fetch,
        fetchOptions: this.fetchOptions,
        apiKey: this._options.apiKey,
        adminAPIKey: this.adminAPIKey,
        workloadIdentity: this._options.workloadIdentity,
        organization: this.organization,
        project: this.project,
        webhookSecret: this.webhookSecret,
        ...e,
      });
    }
    defaultQuery() {
      return this._options.defaultQuery;
    }
    validateHeaders(
      { values: e, nulls: t },
      r = { bearerAuth: !0, adminAPIKeyAuth: !0 },
    ) {
      if (
        !(e.get("authorization") || e.get("api-key")) &&
        !(t.has("authorization") || t.has("api-key")) &&
        !(this._workloadIdentityAuth && r.bearerAuth)
      )
        throw new Error(
          'Could not resolve authentication method. Expected either apiKey or adminAPIKey to be set. Or for one of the "Authorization" or "api-key" headers to be explicitly omitted',
        );
    }
    async authHeaders(e, t = { bearerAuth: !0, adminAPIKeyAuth: !0 }) {
      return p([
        t.bearerAuth ? await this.bearerAuth(e) : null,
        t.adminAPIKeyAuth ? await this.adminAPIKeyAuth(e) : null,
      ]);
    }
    async bearerAuth(e) {
      if (this._workloadIdentityAuth)
        return p([
          {
            Authorization: `Bearer ${await this._workloadIdentityAuth.getToken()}`,
          },
        ]);
      if (this.apiKey != null)
        return p([{ Authorization: `Bearer ${this.apiKey}` }]);
    }
    async adminAPIKeyAuth(e) {
      if (this.adminAPIKey != null)
        return p([{ Authorization: `Bearer ${this.adminAPIKey}` }]);
    }
    stringifyQuery(e) {
      return Po(e);
    }
    getUserAgent() {
      return `${this.constructor.name}/JS ${Ge}`;
    }
    defaultIdempotencyKey() {
      return `stainless-node-retry-${hn()}`;
    }
    makeStatusError(e, t, r, n) {
      return L.generate(e, t, r, n);
    }
    async _callApiKey() {
      let e = this._options.apiKey;
      if (typeof e != "function") return !1;
      let t;
      try {
        t = await e();
      } catch (r) {
        throw r instanceof w
          ? r
          : new w(`Failed to get token from 'apiKey' function: ${r.message}`, {
              cause: r,
            });
      }
      if (typeof t != "string" || !t)
        throw new w(
          `Expected 'apiKey' function argument to return a string but it returned ${t}`,
        );
      return (this.apiKey = t), !0;
    }
    buildURL(e, t, r) {
      let n = (!u(this, Vn, "m", ci).call(this) && r) || this.baseURL,
        o = oo(e)
          ? new URL(e)
          : new URL(
              n + (n.endsWith("/") && e.startsWith("/") ? e.slice(1) : e),
            ),
        i = this.defaultQuery(),
        c = Object.fromEntries(o.searchParams);
      return (
        (!mn(i) || !mn(c)) && (t = { ...c, ...i, ...t }),
        typeof t == "object" &&
          t &&
          !Array.isArray(t) &&
          (o.search = this.stringifyQuery(t)),
        o.toString()
      );
    }
    async prepareOptions(e) {
      (e.__security ?? { bearerAuth: !0 }).bearerAuth &&
        (await this._callApiKey());
    }
    async prepareRequest(e, { url: t, options: r }) {}
    get(e, t) {
      return this.methodRequest("get", e, t);
    }
    post(e, t) {
      return this.methodRequest("post", e, t);
    }
    patch(e, t) {
      return this.methodRequest("patch", e, t);
    }
    put(e, t) {
      return this.methodRequest("put", e, t);
    }
    delete(e, t) {
      return this.methodRequest("delete", e, t);
    }
    methodRequest(e, t, r) {
      return this.request(
        Promise.resolve(r).then((n) => ({ method: e, path: t, ...n })),
      );
    }
    request(e, t = null) {
      return new nt(this, this.makeRequest(e, t, void 0));
    }
    async makeRequest(e, t, r) {
      let n = await e,
        o = n.maxRetries ?? this.maxRetries;
      t == null && (t = o), await this.prepareOptions(n);
      let {
        req: i,
        url: c,
        timeout: d,
      } = await this.buildRequest(n, { retryCount: o - t });
      await this.prepareRequest(i, { url: c, options: n });
      let h =
          "log_" +
          ((Math.random() * (1 << 24)) | 0).toString(16).padStart(6, "0"),
        g = r === void 0 ? "" : `, retryOf: ${r}`,
        m = Date.now();
      if (
        (D(this).debug(
          `[${h}] sending request`,
          Pe({
            retryOfRequestLogID: r,
            method: n.method,
            url: c,
            options: n,
            headers: i.headers,
          }),
        ),
        n.signal?.aborted)
      )
        throw new F();
      let _ = n.__security ?? { bearerAuth: !0 },
        f = new AbortController(),
        A = await this.fetchWithAuth(c, i, d, f, _).catch(Zr),
        I = Date.now();
      if (A instanceof globalThis.Error) {
        let E = `retrying, ${t} attempts remaining`;
        if (n.signal?.aborted) throw new F();
        let O =
          Qr(A) ||
          /timed? ?out/i.test(
            String(A) + ("cause" in A ? String(A.cause) : ""),
          );
        if (t)
          return (
            D(this).info(
              `[${h}] connection ${O ? "timed out" : "failed"} - ${E}`,
            ),
            D(this).debug(
              `[${h}] connection ${O ? "timed out" : "failed"} (${E})`,
              Pe({
                retryOfRequestLogID: r,
                url: c,
                durationMs: I - m,
                message: A.message,
              }),
            ),
            this.retryRequest(n, t, r ?? h)
          );
        throw (
          (D(this).info(
            `[${h}] connection ${O ? "timed out" : "failed"} - error; no more retries left`,
          ),
          D(this).debug(
            `[${h}] connection ${O ? "timed out" : "failed"} (error; no more retries left)`,
            Pe({
              retryOfRequestLogID: r,
              url: c,
              durationMs: I - m,
              message: A.message,
            }),
          ),
          A instanceof rt || A instanceof es
            ? A
            : O
              ? new Me()
              : new De({ message: xc(A), cause: A }))
        );
      }
      let $ = [...A.headers.entries()]
          .filter(([E]) => E === "x-request-id")
          .map(([E, O]) => ", " + E + ": " + JSON.stringify(O))
          .join(""),
        W = `[${h}${g}${$}] ${i.method} ${c} ${A.ok ? "succeeded" : "failed"} with status ${A.status} in ${I - m}ms`;
      if (!A.ok) {
        if (
          A.status === 401 &&
          this._workloadIdentityAuth &&
          _.bearerAuth &&
          !n.__metadata?.hasStreamingBody &&
          !n.__metadata?.workloadIdentityTokenRefreshed
        )
          return (
            await _n(A.body),
            this._workloadIdentityAuth.invalidateToken(),
            this.makeRequest(
              {
                ...n,
                __metadata: {
                  ...n.__metadata,
                  workloadIdentityTokenRefreshed: !0,
                },
              },
              t,
              r ?? h,
            )
          );
        let E = await this.shouldRetry(A);
        if (t && E) {
          let N = `retrying, ${t} attempts remaining`;
          return (
            await _n(A.body),
            D(this).info(`${W} - ${N}`),
            D(this).debug(
              `[${h}] response error (${N})`,
              Pe({
                retryOfRequestLogID: r,
                url: A.url,
                status: A.status,
                headers: A.headers,
                durationMs: I - m,
              }),
            ),
            this.retryRequest(n, t, r ?? h, A.headers)
          );
        }
        let O = E ? "error; no more retries left" : "error; not retryable";
        D(this).info(`${W} - ${O}`);
        let v = await A.text().catch((N) => Zr(N).message),
          ae = co(v),
          X = ae ? void 0 : v;
        throw (
          (D(this).debug(
            `[${h}] response error (${O})`,
            Pe({
              retryOfRequestLogID: r,
              url: A.url,
              status: A.status,
              headers: A.headers,
              message: X,
              durationMs: Date.now() - m,
            }),
          ),
          this.makeStatusError(A.status, ae, X, A.headers))
        );
      }
      return (
        D(this).info(W),
        D(this).debug(
          `[${h}] response start`,
          Pe({
            retryOfRequestLogID: r,
            url: A.url,
            status: A.status,
            headers: A.headers,
            durationMs: I - m,
          }),
        ),
        {
          response: A,
          options: n,
          controller: f,
          requestLogID: h,
          retryOfRequestLogID: r,
          startTime: m,
        }
      );
    }
    getAPIList(e, t, r) {
      return this.requestAPIList(
        t,
        r && "then" in r
          ? r.then((n) => ({ method: "get", path: e, ...n }))
          : { method: "get", path: e, ...r },
      );
    }
    requestAPIList(e, t) {
      let r = this.makeRequest(t, null, void 0);
      return new os(this, r, e);
    }
    async fetchWithAuth(
      e,
      t,
      r,
      n,
      o = { bearerAuth: !0, adminAPIKeyAuth: !0 },
    ) {
      if (this._workloadIdentityAuth && o.bearerAuth) {
        let c = t.headers,
          d = c.get("Authorization");
        if (!d || d === `Bearer ${Rc}`) {
          let h = await this._workloadIdentityAuth.getToken();
          c.set("Authorization", `Bearer ${h}`);
        }
      }
      return await this.fetchWithTimeout(e, t, r, n);
    }
    async fetchWithTimeout(e, t, r, n) {
      let { signal: o, method: i, ...c } = t || {},
        d = this._makeAbort(n);
      o && o.addEventListener("abort", d, { once: !0 });
      let h = setTimeout(d, r),
        g =
          (globalThis.ReadableStream &&
            c.body instanceof globalThis.ReadableStream) ||
          (typeof c.body == "object" &&
            c.body !== null &&
            Symbol.asyncIterator in c.body),
        m = {
          signal: n.signal,
          ...(g ? { duplex: "half" } : {}),
          method: "GET",
          ...c,
        };
      i && (m.method = i.toUpperCase());
      try {
        return await this.fetch.call(void 0, e, m);
      } finally {
        clearTimeout(h);
      }
    }
    async shouldRetry(e) {
      let t = e.headers.get("x-should-retry");
      return t === "true"
        ? !0
        : t === "false"
          ? !1
          : e.status === 408 ||
            e.status === 409 ||
            e.status === 429 ||
            e.status >= 500;
    }
    async retryRequest(e, t, r, n) {
      let o,
        i = n?.get("retry-after-ms");
      if (i) {
        let d = parseFloat(i);
        Number.isNaN(d) || (o = d);
      }
      let c = n?.get("retry-after");
      if (c && !o) {
        let d = parseFloat(c);
        Number.isNaN(d) ? (o = Date.parse(c) - Date.now()) : (o = d * 1e3);
      }
      if (o === void 0) {
        let d = e.maxRetries ?? this.maxRetries;
        o = this.calculateDefaultRetryTimeoutMillis(t, d);
      }
      return await _e(o), this.makeRequest(e, t - 1, r);
    }
    calculateDefaultRetryTimeoutMillis(e, t) {
      let o = t - e,
        i = Math.min(0.5 * Math.pow(2, o), 8),
        c = 1 - Math.random() * 0.25;
      return i * c * 1e3;
    }
    async buildRequest(e, { retryCount: t = 0 } = {}) {
      let r = { ...e },
        { method: n, path: o, query: i, defaultBaseURL: c } = r,
        d = this.buildURL(o, i, c);
      "timeout" in r && ao("timeout", r.timeout),
        (r.timeout = r.timeout ?? this.timeout);
      let {
        bodyHeaders: h,
        body: g,
        isStreamingBody: m,
      } = this.buildBody({ options: r });
      m && (e.__metadata = { ...e.__metadata, hasStreamingBody: !0 });
      let _ = await this.buildHeaders({
        options: e,
        method: n,
        bodyHeaders: h,
        retryCount: t,
      });
      return {
        req: {
          method: n,
          headers: _,
          ...(r.signal && { signal: r.signal }),
          ...(globalThis.ReadableStream &&
            g instanceof globalThis.ReadableStream && { duplex: "half" }),
          ...(g && { body: g }),
          ...(this.fetchOptions ?? {}),
          ...(r.fetchOptions ?? {}),
        },
        url: d,
        timeout: r.timeout,
      };
    }
    async buildHeaders({
      options: e,
      method: t,
      bodyHeaders: r,
      retryCount: n,
    }) {
      let o = {};
      this.idempotencyHeader &&
        t !== "get" &&
        (e.idempotencyKey || (e.idempotencyKey = this.defaultIdempotencyKey()),
        (o[this.idempotencyHeader] = e.idempotencyKey));
      let i = p([
        o,
        {
          Accept: "application/json",
          "User-Agent": this.getUserAgent(),
          "X-Stainless-Retry-Count": String(n),
          ...(e.timeout
            ? { "X-Stainless-Timeout": String(Math.trunc(e.timeout / 1e3)) }
            : {}),
          ...fo(),
          "OpenAI-Organization": this.organization,
          "OpenAI-Project": this.project,
        },
        await this.authHeaders(e, e.__security ?? { bearerAuth: !0 }),
        this._options.defaultHeaders,
        r,
        e.headers,
      ]);
      return (
        this.validateHeaders(i, e.__security ?? { bearerAuth: !0 }), i.values
      );
    }
    _makeAbort(e) {
      return () => e.abort();
    }
    buildBody({ options: { body: e, headers: t } }) {
      if (!e) return { bodyHeaders: void 0, body: void 0, isStreamingBody: !1 };
      let r = p([t]),
        n =
          typeof globalThis.ReadableStream < "u" &&
          e instanceof globalThis.ReadableStream,
        o =
          !n &&
          (typeof e == "string" ||
            e instanceof ArrayBuffer ||
            ArrayBuffer.isView(e) ||
            (typeof globalThis.Blob < "u" && e instanceof globalThis.Blob) ||
            e instanceof URLSearchParams ||
            e instanceof FormData);
      return ArrayBuffer.isView(e) ||
        e instanceof ArrayBuffer ||
        e instanceof DataView ||
        (typeof e == "string" && r.values.has("content-type")) ||
        (globalThis.Blob && e instanceof globalThis.Blob) ||
        e instanceof FormData ||
        e instanceof URLSearchParams ||
        n
        ? { bodyHeaders: void 0, body: e, isStreamingBody: !o }
        : typeof e == "object" &&
            (Symbol.asyncIterator in e ||
              (Symbol.iterator in e &&
                "next" in e &&
                typeof e.next == "function"))
          ? { bodyHeaders: void 0, body: Ps(e), isStreamingBody: !0 }
          : typeof e == "object" &&
              r.values.get("content-type") ===
                "application/x-www-form-urlencoded"
            ? {
                bodyHeaders: {
                  "content-type": "application/x-www-form-urlencoded",
                },
                body: this.stringifyQuery(e),
                isStreamingBody: !1,
              }
            : {
                ...u(this, Qs, "f").call(this, { body: e, headers: r }),
                isStreamingBody: !1,
              };
    }
  };
(Jn = P),
  (Qs = new WeakMap()),
  (Vn = new WeakSet()),
  (ci = function () {
    return this.baseURL !== "https://api.openai.com/v1";
  });
P.OpenAI = Jn;
P.DEFAULT_TIMEOUT = 6e5;
P.OpenAIError = w;
P.APIError = L;
P.APIConnectionError = De;
P.APIConnectionTimeoutError = Me;
P.APIUserAbortError = F;
P.NotFoundError = Gt;
P.ConflictError = Ft;
P.RateLimitError = Wt;
P.BadRequestError = Lt;
P.AuthenticationError = Dt;
P.InternalServerError = jt;
P.PermissionDeniedError = Mt;
P.UnprocessableEntityError = Ut;
P.InvalidWebhookSignatureError = pe;
P.toFile = vs;
P.Completions = _t;
P.Chat = je;
P.Embeddings = yt;
P.Files = St;
P.Images = Et;
P.Audio = Ae;
P.Moderations = Tt;
P.Models = Pt;
P.FineTuning = fe;
P.Graders = Ye;
P.VectorStores = ve;
P.Webhooks = Ct;
P.Beta = me;
P.Batches = ht;
P.Uploads = Ze;
P.Admin = Be;
P.Responses = ke;
P.Realtime = $e;
P.Conversations = Je;
P.Evals = Xe;
P.Containers = Ve;
P.Skills = Oe;
P.Videos = xt;
function xc(s) {
  if (Cc(s))
    return "Connection error. This may be caused by passing an undici dispatcher, such as ProxyAgent, that is incompatible with the fetch implementation. If you are using undici's ProxyAgent, pass the fetch implementation from the same undici package: import { fetch, ProxyAgent } from 'undici'; new OpenAI({ fetch, fetchOptions: { dispatcher: new ProxyAgent(...) } });";
}
function Cc(s) {
  let e = s;
  for (let t = 0; t < 8 && e && typeof e == "object"; t++) {
    let r = e;
    if (
      r.code === "UND_ERR_INVALID_ARG" &&
      typeof r.message == "string" &&
      r.message.includes("invalid onRequestStart method")
    )
      return !0;
    e = r.cause;
  }
  return !1;
}
var Xn = !1,
  Yn = null;
function li(s) {
  Yn = s;
}
function ui(s) {
  return Array.from(s)
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
function hi(s) {
  Xn = s;
}
function y(...s) {
  if (Xn) {
    console.log(...s);
    try {
      Yn?.("info", ...s);
    } catch {}
  }
}
function Ie(...s) {
  if (Xn) {
    console.warn(...s);
    try {
      Yn?.("warn", ...s);
    } catch {}
  }
}
async function Qn(s, e, t = {}) {
  let { userPrompt: i } = s,
    {
      goalConfigs: c = [],
      achievedMap: d = {},
      knowledgeBase: h = "",
      positionKnowledgeBase: g = "",
    } = t;
  try {
    if (await billingBlockedActive())
      return {
        success: !1,
        error: "点数不足，请充值",
        code: "BILLING_INSUFFICIENT_BALANCE",
        billingBlock: !0,
      };
    let f = [
        { role: "system", content: no(h, g, c, d, i) },
        ...e
          .filter(($) => $ && $.content != null)
          .map(($) => ({
            role: $.sender === "hr" ? "assistant" : $.role || "user",
            content: $.content,
          })),
      ],
      A = await rn(llmChatRequest, {
        scene: "reply_judge",
        messages: f,
        temperature: 0.7,
      }),
      I = A.content || "";
    return (
      y(
        `[API] \u{1F916} \u5927\u6A21\u578B\u8BF7\u6C42(\u6258\u7BA1): \u6D88\u606F\u6570=${f.length}`,
      ),
      y(`[API] \u{1F4E8} \u8BF7\u6C42\u63D0\u793A\u8BCD:
${f.map(($) => `  [${$.role}] ${($.content || "").slice(0, 500)}`).join(`
`)}`),
      I &&
        y(
          `[API] \u2705 \u5927\u6A21\u578B\u8FD4\u56DE: "${I.slice(0, 300)}..."`,
        ),
      { success: !0, content: I, balance: A.balance_points, warnLevel: A.warn_level }
    );
  } catch (m) {
    if (isBillingBlock(m)) await markBillingBlocked("自动回复");
    return {
      success: !1,
      error: m.message || String(m),
      code: m.code || "",
      billingBlock: isBillingBlock(m),
    };
  }
}
function Xr() {
  return new Promise((s, e) => {
    let t = indexedDB.open(ro, so);
    (t.onupgradeneeded = (r) => {
      let n = r.target.result;
      n.objectStoreNames.contains(be) ||
        n
          .createObjectStore(be, { keyPath: "id" })
          .createIndex("completeTime", "completeTime", { unique: !1 }),
        n.objectStoreNames.contains(Ee) ||
          n
            .createObjectStore(Ee, { keyPath: "id" })
            .createIndex("greetTime", "greetTime", { unique: !1 });
    }),
      (t.onsuccess = (r) => s(r.target.result)),
      (t.onerror = (r) => e(r.target.error));
  });
}
async function mi(s) {
  let e = await Xr();
  return new Promise((t, r) => {
    let n = e.transaction(be, "readwrite");
    n.objectStore(be).put(s),
      (n.oncomplete = () => t()),
      (n.onerror = (i) => r(i.target.error));
  });
}
async function fi(s = 1, e = 20) {
  let t = await Xr();
  return new Promise((r, n) => {
    let c = t.transaction(be, "readonly").objectStore(be).index("completeTime"),
      d = [],
      h = 0,
      g = (s - 1) * e,
      m = 0,
      _ = c.openCursor(null, "prev");
    (_.onsuccess = (f) => {
      let A = f.target.result;
      A
        ? (h++, g > 0 ? g-- : m < e && (d.push(A.value), m++), A.continue())
        : r({ records: d, total: h, page: s });
    }),
      (_.onerror = (f) => n(f.target.error));
  });
}
async function pi(s) {
  let e = await Xr();
  return new Promise((t, r) => {
    let n = e.transaction(Ee, "readwrite");
    n.objectStore(Ee).put(s),
      (n.oncomplete = () => t()),
      (n.onerror = (i) => r(i.target.error));
  });
}
async function _i(s = 1, e = 20) {
  let t = await Xr();
  return new Promise((r, n) => {
    let c = t.transaction(Ee, "readonly").objectStore(Ee).index("greetTime"),
      d = [],
      h = 0,
      g = (s - 1) * e,
      m = 0,
      _ = c.openCursor(null, "prev");
    (_.onsuccess = (f) => {
      let A = f.target.result;
      A
        ? (h++, g > 0 ? g-- : m < e && (d.push(A.value), m++), A.continue())
        : r({ records: d, total: h, page: s });
    }),
      (_.onerror = (f) => n(f.target.error));
  });
}
async function gi() {
  let s = await Xr();
  return new Promise((e, t) => {
    let o = s.transaction(Ee, "readonly").objectStore(Ee).index("greetTime"),
      i = [],
      c = o.openCursor(null, "prev");
    (c.onsuccess = (d) => {
      let h = d.target.result;
      h ? (i.push(h.value), h.continue()) : e(i);
    }),
      (c.onerror = (d) => t(d.target.error));
  });
}
async function yi() {
  let s = await Xr();
  return new Promise((e, t) => {
    let o = s.transaction(be, "readonly").objectStore(be).index("completeTime"),
      i = [],
      c = o.openCursor(null, "prev");
    (c.onsuccess = (d) => {
      let h = d.target.result;
      h ? (i.push(h.value), h.continue()) : e(i);
    }),
      (c.onerror = (d) => t(d.target.error));
  });
}
var Zs = class {
  constructor(e = {}) {
    (this.onAutoStart = e.onAutoStart || (async () => {})),
      (this.onAutoStop = e.onAutoStop || (async () => {})),
      (this.onGetState = e.onGetState || (() => C.IDLE)),
      (this.initialized = !1),
      (this.tasks = []),
      (this.lastAutoStartTaskId = null),
      (this._listenerAttached = !1),
      (this._failedTaskIdsInCycle = {});
  }
  async init() {
    if (this.initialized) {
      y(
        "[Scheduler] \u8C03\u5EA6\u5668\u5DF2\u521D\u59CB\u5316\uFF0C\u8DF3\u8FC7",
      );
      return;
    }
    console.log("[Scheduler] \u521D\u59CB\u5316\u8C03\u5EA6\u5668..."),
      await this._loadTasks(),
      await this._loadFailedTasks(),
      await this._createAlarm(),
      (this.initialized = !0),
      this.tasks.length > 0
        ? console.log(
            `[Scheduler] \u8C03\u5EA6\u5668\u521D\u59CB\u5316\u5B8C\u6210\uFF0C\u5DF2\u52A0\u8F7D ${this.tasks.length} \u4E2A\u5B9A\u65F6\u4EFB\u52A1`,
          )
        : console.log(
            "[Scheduler] \u8C03\u5EA6\u5668\u521D\u59CB\u5316\u5B8C\u6210\uFF0C\u6682\u65E0\u5B9A\u65F6\u4EFB\u52A1",
          );
  }
  async refresh() {
    this.clearFailedTasks();
    let e = this.tasks.length;
    await this._loadTasks(),
      console.log(
        `[Scheduler] \u4EFB\u52A1\u5217\u8868\u5DF2\u5237\u65B0: ${e} \u2192 ${this.tasks.length} \u4E2A\u4EFB\u52A1`,
      );
  }
  getStatus() {
    let e = new Date(),
      t = this._findActiveTask(e);
    return {
      taskCount: this.tasks.length,
      activeTaskName: t ? t.name : null,
      nextCheckSeconds: 60,
      isAutoStarted: !!this.lastAutoStartTaskId,
    };
  }
  async _loadTasks() {
    try {
      let e = await chrome.storage.local.get("replyScheduledTasks");
      (this.tasks = e.replyScheduledTasks || []),
        console.log(
          `[Scheduler] \u5DF2\u52A0\u8F7D ${this.tasks.length} \u4E2A\u5B9A\u65F6\u4EFB\u52A1 from storage key=replyScheduledTasks`,
        ),
        this.tasks.length > 0 &&
          this.tasks.forEach((t) =>
            console.log(
              `[Scheduler]   \u4EFB\u52A1: id=${t.id}, name="${t.name}", enabled=${t.enabled}, cycle=${t.cycleType}, time=${t.startTime}-${t.endTime}`,
            ),
          );
    } catch (e) {
      console.error(
        "[Scheduler] \u52A0\u8F7D\u5B9A\u65F6\u4EFB\u52A1\u5931\u8D25:",
        e,
      ),
        (this.tasks = []);
    }
  }
  async _createAlarm() {
    chrome.alarms.create(Ne, { periodInMinutes: vt }),
      console.log(
        `[Scheduler] \u5FC3\u8DF3\u95F9\u949F\u5DF2\u521B\u5EFA, name=${Ne}, period=${vt}min`,
      );
    try {
      let e = await chrome.alarms.get(Ne);
      e
        ? console.log(
            `[Scheduler] \u95F9\u949F\u9A8C\u8BC1\u901A\u8FC7: ${e.name}, period=${e.periodInMinutes}min`,
          )
        : console.warn(
            "[Scheduler] \u95F9\u949F\u9A8C\u8BC1\u5931\u8D25: get() \u8FD4\u56DE null\uFF0C\u95F9\u949F\u53EF\u80FD\u672A\u6210\u529F\u521B\u5EFA\uFF01",
          );
    } catch (e) {
      console.error("[Scheduler] \u95F9\u949F\u9A8C\u8BC1\u51FA\u9519:", e);
    }
  }
  _attachListener() {
    this._listenerAttached ||
      (chrome.alarms.onAlarm.addListener((e) => this._handleAlarm(e)),
      (this._listenerAttached = !0));
  }
  async _setAutoStarted(e) {
    await chrome.storage.session.set({ schedulerAutoStarted: e });
  }
  async _getAutoStarted() {
    try {
      return !!(await chrome.storage.session.get("schedulerAutoStarted"))
        .schedulerAutoStarted;
    } catch {
      return !1;
    }
  }
  _calcElapsedMinutes(e, t) {
    let [r, n] = t.split(":").map(Number),
      o = r * 60 + n;
    return e.getHours() * 60 + e.getMinutes() - o;
  }
  async _loadFailedTasks() {
    try {
      let e = await chrome.storage.session.get(Ss);
      this._failedTaskIdsInCycle = e[Ss] || {};
    } catch {
      this._failedTaskIdsInCycle = {};
    }
  }
  async _persistFailedTasks() {
    try {
      await chrome.storage.session.set({ [Ss]: this._failedTaskIdsInCycle });
    } catch (e) {
      console.warn(
        "[Scheduler] \u6301\u4E45\u5316\u5931\u8D25\u4EFB\u52A1\u8BB0\u5F55\u51FA\u9519:",
        e.message,
      );
    }
  }
  _cleanupExpiredFailedTasks(e) {
    let t = `${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}:${String(e.getSeconds()).padStart(2, "0")}`,
      r = !1;
    for (let n of Object.keys(this._failedTaskIdsInCycle)) {
      let o = this.tasks.find((i) => i.id === n);
      (!o || t >= o.endTime) &&
        (delete this._failedTaskIdsInCycle[n],
        (r = !0),
        console.log(
          `[Scheduler] \u6E05\u9664\u4EFB\u52A1[${n}]\u7684\u5931\u8D25\u8BB0\u5F55: \u4EFB\u52A1\u5DF2${o ? "\u8FC7\u671F" : "\u4E0D\u5B58\u5728"}`,
        ));
    }
    r && this._persistFailedTasks();
  }
  clearFailedTasks() {
    (this._failedTaskIdsInCycle = {}),
      this._persistFailedTasks(),
      console.log(
        "[Scheduler] \u5DF2\u6E05\u7A7A\u672C\u8F6E\u5931\u8D25\u4EFB\u52A1\u8BB0\u5F55",
      );
  }
  async _handleAlarm(e) {
    if (e.name !== Ne) return;
    let t = new Date();
    console.log(
      `[Scheduler] \u5FC3\u8DF3\u89E6\u53D1: ${t.toISOString()} (${t.toLocaleString("zh-CN")}), \u5F53\u524D\u4EFB\u52A1\u6570=${this.tasks.length}, \u5B58\u50A8\u72B6\u6001=${this.onGetState()}`,
    ),
      await this._loadFailedTasks(),
      this._cleanupExpiredFailedTasks(t);
    let r = this._findActiveTask(t),
      n = this.onGetState(),
      o = n === C.RUNNING || n === C.PAUSED;
    if (
      (console.log(
        `[Scheduler] \u68C0\u67E5\u7ED3\u679C: activeTask=${r ? r.name : "\u65E0"}, isRunning=${o}, state=${n}`,
      ),
      r)
    )
      if (o)
        console.log(
          `[Scheduler] \u6D3B\u8DC3\u4EFB\u52A1\u300C${r.name}\u300D\u65F6\u95F4\u6BB5\u5185\uFF0C\u81EA\u52A8\u5316\u5DF2\u5728\u8FD0\u884C\u4E2D\uFF0C\u8DF3\u8FC7`,
        );
      else {
        console.log(
          `[Scheduler] >>> \u5B9A\u65F6\u4EFB\u52A1\u300C${r.name}\u300D\u65F6\u95F4\u6BB5\u5230\u8FBE\uFF0C\u81EA\u52A8\u542F\u52A8`,
        ),
          console.log(
            `[Scheduler] >>> \u4EFB\u52A1\u8BE6\u60C5: id=${r.id}, startTime=${r.startTime}, endTime=${r.endTime}, cycleType=${r.cycleType}`,
          ),
          (this.lastAutoStartTaskId = r.id),
          await this._setAutoStarted(!0);
        try {
          await this.onAutoStart(r),
            console.log(
              `[Scheduler] >>> \u81EA\u52A8\u542F\u52A8\u56DE\u8C03\u6267\u884C\u5B8C\u6210: task="${r.name}"`,
            ),
            this.onGetState() === C.IDLE &&
              !this._failedTaskIdsInCycle[r.id] &&
              (console.warn(
                `[Scheduler] >>> \u81EA\u52A8\u542F\u52A8\u540E\u72B6\u6001\u4ECD\u4E3A IDLE\uFF0C\u4EFB\u52A1[${r.name}]\u672C\u8F6E\u4E0D\u518D\u91CD\u8BD5`,
              ),
              (this._failedTaskIdsInCycle[r.id] =
                "\u542F\u52A8\u5931\u8D25\uFF08\u56DE\u8C03\u8FD4\u56DE\u540E\u72B6\u6001\u4ECD\u4E3AIDLE\uFF09"),
              await this._persistFailedTasks(),
              (this.lastAutoStartTaskId = null),
              await this._setAutoStarted(!1));
        } catch (i) {
          console.error(
            "[Scheduler] >>> \u81EA\u52A8\u542F\u52A8\u5931\u8D25:",
            i,
          ),
            (this._failedTaskIdsInCycle[r.id] =
              i.message || "\u542F\u52A8\u5F02\u5E38"),
            await this._persistFailedTasks(),
            (this.lastAutoStartTaskId = null),
            await this._setAutoStarted(!1);
        }
      }
    else if (o) {
      let i = await this._getAutoStarted();
      if (
        (console.log(
          `[Scheduler] \u65E0\u6D3B\u8DC3\u4EFB\u52A1\u65F6\u95F4\u6BB5\uFF0C\u81EA\u52A8\u5316\u6B63\u5728\u8FD0\u884C, autoStarted=${i}`,
        ),
        i)
      ) {
        console.log(
          "[Scheduler] >>> \u8C03\u5EA6\u5668\u542F\u52A8\u7684\u4EFB\u52A1\u65F6\u95F4\u6BB5\u5DF2\u7ED3\u675F\uFF0C\u81EA\u52A8\u505C\u6B62",
        ),
          (this.lastAutoStartTaskId = null),
          await this._setAutoStarted(!1);
        try {
          await this.onAutoStop(),
            console.log(
              "[Scheduler] >>> \u81EA\u52A8\u505C\u6B62\u56DE\u8C03\u6267\u884C\u5B8C\u6210",
            );
        } catch (c) {
          console.error(
            "[Scheduler] >>> \u81EA\u52A8\u505C\u6B62\u5931\u8D25:",
            c,
          );
        }
      }
    } else
      console.log(
        "[Scheduler] \u65E0\u6D3B\u8DC3\u4EFB\u52A1\uFF0C\u81EA\u52A8\u5316\u672A\u8FD0\u884C\uFF08\u6B63\u5E38\uFF09",
      );
  }
  _findActiveTask(e) {
    let t = (i) => String(i).padStart(2, "0"),
      r = `${t(e.getHours())}:${t(e.getMinutes())}:${t(e.getSeconds())}`,
      n = e.getDay(),
      o = e.getDate();
    console.log(
      `[Scheduler] \u5339\u914D\u4EFB\u52A1: \u5F53\u524D\u65F6\u95F4=${r}, \u661F\u671F${n}, \u65E5\u671F=${o}, \u5019\u9009\u4EFB\u52A1\u6570=${this.tasks.length}`,
    );
    for (let i of this.tasks) {
      if (i.enabled === !1) {
        console.log(
          `[Scheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u672A\u542F\u7528(enabled=false)`,
        );
        continue;
      }
      if (this._failedTaskIdsInCycle[i.id]) {
        console.log(
          `[Scheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u672C\u8F6E\u5DF2\u542F\u52A8\u5931\u8D25(${this._failedTaskIdsInCycle[i.id]})`,
        );
        continue;
      }
      if (i.cycleType === "weekly") {
        if (!i.weekDays || !i.weekDays.length) {
          console.log(
            `[Scheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u5468\u5FAA\u73AF\u4F46weekDays\u4E3A\u7A7A`,
          );
          continue;
        }
        if (!i.weekDays.includes(n)) {
          console.log(
            `[Scheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u661F\u671F${n}\u4E0D\u5728 [${i.weekDays.join(",")}] \u4E2D`,
          );
          continue;
        }
        console.log(
          `[Scheduler]   \u2514 \u4EFB\u52A1[${i.name}] \u661F\u671F\u5339\u914D\u6210\u529F (${i.weekDays.join(",")})`,
        );
      } else if (i.cycleType === "monthly") {
        if (!i.monthDays || !i.monthDays.length) {
          console.log(
            `[Scheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u6708\u5FAA\u73AF\u4F46monthDays\u4E3A\u7A7A`,
          );
          continue;
        }
        if (!i.monthDays.includes(o)) {
          console.log(
            `[Scheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u65E5\u671F${o}\u4E0D\u5728 [${i.monthDays.join(",")}] \u4E2D`,
          );
          continue;
        }
        console.log(
          `[Scheduler]   \u2514 \u4EFB\u52A1[${i.name}] \u65E5\u671F\u5339\u914D\u6210\u529F (${i.monthDays.join(",")})`,
        );
      } else {
        console.log(
          `[Scheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u672A\u77E5\u5468\u671F\u7C7B\u578B cycleType="${i.cycleType}"`,
        );
        continue;
      }
      if (r >= i.startTime && r < i.endTime) {
        let c = this._calcElapsedMinutes(e, i.startTime);
        if (c > Nt) {
          console.log(
            `[Scheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u5DF2\u8D85\u8FC7\u5EF6\u8FDF\u542F\u52A8\u65F6\u95F4(${c}\u5206 > ${Nt}\u5206)`,
          );
          continue;
        }
        return (
          console.log(
            `[Scheduler]   \u2514 \u2713 \u4EFB\u52A1[${i.name}] \u5B8C\u5168\u5339\u914D! time=${r} in [${i.startTime}, ${i.endTime})`,
          ),
          i
        );
      } else
        console.log(
          `[Scheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u65F6\u95F4\u4E0D\u5339\u914D ${r} not in [${i.startTime}, ${i.endTime})`,
        );
    }
    return (
      console.log("[Scheduler]   \u2514 \u65E0\u5339\u914D\u4EFB\u52A1"), null
    );
  }
};
var en = class {
  constructor(e = {}) {
    (this.onAutoStart = e.onAutoStart || (async () => {})),
      (this.onAutoStop = e.onAutoStop || (async () => {})),
      (this.onGetState = e.onGetState || (() => C.IDLE)),
      (this.initialized = !1),
      (this.tasks = []),
      (this.lastAutoStartTaskId = null),
      (this._listenerAttached = !1),
      (this._failedTaskIdsInCycle = {});
  }
  async init() {
    if (this.initialized) {
      y(
        "[GreetingScheduler] \u8C03\u5EA6\u5668\u5DF2\u521D\u59CB\u5316\uFF0C\u8DF3\u8FC7",
      );
      return;
    }
    console.log("[GreetingScheduler] \u521D\u59CB\u5316\u8C03\u5EA6\u5668..."),
      await this._loadTasks(),
      await this._loadFailedTasks(),
      await this._createAlarm(),
      (this.initialized = !0),
      this.tasks.length > 0
        ? console.log(
            `[GreetingScheduler] \u521D\u59CB\u5316\u5B8C\u6210\uFF0C\u5DF2\u52A0\u8F7D ${this.tasks.length} \u4E2A\u5B9A\u65F6\u4EFB\u52A1`,
          )
        : console.log(
            "[GreetingScheduler] \u521D\u59CB\u5316\u5B8C\u6210\uFF0C\u6682\u65E0\u5B9A\u65F6\u4EFB\u52A1",
          );
  }
  async refresh() {
    this.clearFailedTasks();
    let e = this.tasks.length;
    await this._loadTasks(),
      console.log(
        `[GreetingScheduler] \u4EFB\u52A1\u5217\u8868\u5DF2\u5237\u65B0: ${e} \u2192 ${this.tasks.length} \u4E2A\u4EFB\u52A1`,
      );
  }
  getStatus() {
    let e = new Date(),
      t = this._findActiveTask(e);
    return {
      taskCount: this.tasks.length,
      activeTaskName: t ? t.name : null,
      nextCheckSeconds: 60,
      isAutoStarted: !!this.lastAutoStartTaskId,
    };
  }
  async _loadTasks() {
    try {
      let e = await chrome.storage.local.get(R.GREETING_SCHEDULED_TASKS);
      (this.tasks = e[R.GREETING_SCHEDULED_TASKS] || []),
        console.log(
          `[GreetingScheduler] \u5DF2\u52A0\u8F7D ${this.tasks.length} \u4E2A\u5B9A\u65F6\u4EFB\u52A1 from storage key=${R.GREETING_SCHEDULED_TASKS}`,
        ),
        this.tasks.length > 0 &&
          this.tasks.forEach((t) =>
            console.log(
              `[GreetingScheduler]   \u4EFB\u52A1: id=${t.id}, name="${t.name}", enabled=${t.enabled}, cycle=${t.cycleType}, time=${t.startTime}-${t.endTime}, linkedJobs=${(t.linkedJobs || []).length}\u4E2A`,
            ),
          );
    } catch (e) {
      console.error(
        "[GreetingScheduler] \u52A0\u8F7D\u5B9A\u65F6\u4EFB\u52A1\u5931\u8D25:",
        e,
      ),
        (this.tasks = []);
    }
  }
  async _createAlarm() {
    chrome.alarms.create(Le, { periodInMinutes: vt }),
      console.log(
        `[GreetingScheduler] \u5FC3\u8DF3\u95F9\u949F\u5DF2\u521B\u5EFA, name=${Le}, period=${vt}min`,
      );
    try {
      let e = await chrome.alarms.get(Le);
      e
        ? console.log(
            `[GreetingScheduler] \u95F9\u949F\u9A8C\u8BC1\u901A\u8FC7: ${e.name}, period=${e.periodInMinutes}min`,
          )
        : console.warn(
            "[GreetingScheduler] \u95F9\u949F\u9A8C\u8BC1\u5931\u8D25: get() \u8FD4\u56DE null\uFF0C\u95F9\u949F\u53EF\u80FD\u672A\u6210\u529F\u521B\u5EFA\uFF01",
          );
    } catch (e) {
      console.error(
        "[GreetingScheduler] \u95F9\u949F\u9A8C\u8BC1\u51FA\u9519:",
        e,
      );
    }
  }
  _attachListener() {
    this._listenerAttached ||
      (chrome.alarms.onAlarm.addListener((e) => this._handleAlarm(e)),
      (this._listenerAttached = !0));
  }
  async _setAutoStarted(e) {
    await chrome.storage.session.set({ greetingSchedulerAutoStarted: e });
  }
  async _getAutoStarted() {
    try {
      return !!(
        await chrome.storage.session.get("greetingSchedulerAutoStarted")
      ).greetingSchedulerAutoStarted;
    } catch {
      return !1;
    }
  }
  _calcElapsedMinutes(e, t) {
    let [r, n] = t.split(":").map(Number),
      o = r * 60 + n;
    return e.getHours() * 60 + e.getMinutes() - o;
  }
  async _loadFailedTasks() {
    try {
      let e = await chrome.storage.session.get(ws);
      this._failedTaskIdsInCycle = e[ws] || {};
    } catch {
      this._failedTaskIdsInCycle = {};
    }
  }
  async _persistFailedTasks() {
    try {
      await chrome.storage.session.set({ [ws]: this._failedTaskIdsInCycle });
    } catch (e) {
      console.warn(
        "[GreetingScheduler] \u6301\u4E45\u5316\u5931\u8D25\u4EFB\u52A1\u8BB0\u5F55\u51FA\u9519:",
        e.message,
      );
    }
  }
  _cleanupExpiredFailedTasks(e) {
    let t = `${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}:${String(e.getSeconds()).padStart(2, "0")}`,
      r = !1;
    for (let n of Object.keys(this._failedTaskIdsInCycle)) {
      let o = this.tasks.find((i) => i.id === n);
      (!o || t >= o.endTime) &&
        (delete this._failedTaskIdsInCycle[n],
        (r = !0),
        console.log(
          `[GreetingScheduler] \u6E05\u9664\u4EFB\u52A1[${n}]\u7684\u5931\u8D25\u8BB0\u5F55: \u4EFB\u52A1\u5DF2${o ? "\u8FC7\u671F" : "\u4E0D\u5B58\u5728"}`,
        ));
    }
    r && this._persistFailedTasks();
  }
  clearFailedTasks() {
    (this._failedTaskIdsInCycle = {}),
      this._persistFailedTasks(),
      console.log(
        "[GreetingScheduler] \u5DF2\u6E05\u7A7A\u672C\u8F6E\u5931\u8D25\u4EFB\u52A1\u8BB0\u5F55",
      );
  }
  async _handleAlarm(e) {
    if (e.name !== Le) return;
    let t = new Date();
    console.log(
      `[GreetingScheduler] \u5FC3\u8DF3\u89E6\u53D1: ${t.toISOString()} (${t.toLocaleString("zh-CN")}), \u5F53\u524D\u4EFB\u52A1\u6570=${this.tasks.length}, \u5B58\u50A8\u72B6\u6001=${this.onGetState()}`,
    ),
      await this._loadFailedTasks(),
      this._cleanupExpiredFailedTasks(t);
    let r = this._findActiveTask(t),
      n = this.onGetState(),
      o = n === C.RUNNING || n === C.PAUSED;
    if (
      (console.log(
        `[GreetingScheduler] \u68C0\u67E5\u7ED3\u679C: activeTask=${r ? r.name : "\u65E0"}, isRunning=${o}, state=${n}`,
      ),
      r)
    )
      if (o)
        console.log(
          `[GreetingScheduler] \u6D3B\u8DC3\u4EFB\u52A1\u300C${r.name}\u300D\u65F6\u95F4\u6BB5\u5185\uFF0C\u81EA\u52A8\u5316\u5DF2\u5728\u8FD0\u884C\u4E2D\uFF0C\u8DF3\u8FC7`,
        );
      else {
        console.log(
          `[GreetingScheduler] >>> \u5B9A\u65F6\u4EFB\u52A1\u300C${r.name}\u300D\u65F6\u95F4\u6BB5\u5230\u8FBE\uFF0C\u81EA\u52A8\u542F\u52A8`,
        ),
          console.log(
            `[GreetingScheduler] >>> \u4EFB\u52A1\u8BE6\u60C5: id=${r.id}, startTime=${r.startTime}, endTime=${r.endTime}, linkedJobs=${(r.linkedJobs || []).length}\u4E2A`,
          ),
          (this.lastAutoStartTaskId = r.id),
          await this._setAutoStarted(!0);
        try {
          await this.onAutoStart(r),
            console.log(
              `[GreetingScheduler] >>> \u81EA\u52A8\u542F\u52A8\u56DE\u8C03\u6267\u884C\u5B8C\u6210: task="${r.name}"`,
            ),
            this.onGetState() === C.IDLE &&
              !this._failedTaskIdsInCycle[r.id] &&
              (console.warn(
                `[GreetingScheduler] >>> \u81EA\u52A8\u542F\u52A8\u540E\u72B6\u6001\u4ECD\u4E3A IDLE\uFF0C\u4EFB\u52A1[${r.name}]\u672C\u8F6E\u4E0D\u518D\u91CD\u8BD5`,
              ),
              (this._failedTaskIdsInCycle[r.id] =
                "\u542F\u52A8\u5931\u8D25\uFF08\u56DE\u8C03\u8FD4\u56DE\u540E\u72B6\u6001\u4ECD\u4E3AIDLE\uFF09"),
              await this._persistFailedTasks(),
              (this.lastAutoStartTaskId = null),
              await this._setAutoStarted(!1));
        } catch (i) {
          console.error(
            "[GreetingScheduler] >>> \u81EA\u52A8\u542F\u52A8\u5931\u8D25:",
            i,
          ),
            (this._failedTaskIdsInCycle[r.id] =
              i.message || "\u542F\u52A8\u5F02\u5E38"),
            await this._persistFailedTasks(),
            (this.lastAutoStartTaskId = null),
            await this._setAutoStarted(!1);
        }
      }
    else if (o) {
      let i = await this._getAutoStarted();
      if (
        (console.log(
          `[GreetingScheduler] \u65E0\u6D3B\u8DC3\u4EFB\u52A1\u65F6\u95F4\u6BB5\uFF0C\u81EA\u52A8\u5316\u6B63\u5728\u8FD0\u884C, autoStarted=${i}`,
        ),
        i)
      ) {
        console.log(
          "[GreetingScheduler] >>> \u8C03\u5EA6\u5668\u542F\u52A8\u7684\u4EFB\u52A1\u65F6\u95F4\u6BB5\u5DF2\u7ED3\u675F\uFF0C\u81EA\u52A8\u505C\u6B62",
        ),
          (this.lastAutoStartTaskId = null),
          await this._setAutoStarted(!1);
        try {
          await this.onAutoStop(),
            console.log(
              "[GreetingScheduler] >>> \u81EA\u52A8\u505C\u6B62\u56DE\u8C03\u6267\u884C\u5B8C\u6210",
            );
        } catch (c) {
          console.error(
            "[GreetingScheduler] >>> \u81EA\u52A8\u505C\u6B62\u5931\u8D25:",
            c,
          );
        }
      }
    } else
      console.log(
        "[GreetingScheduler] \u65E0\u6D3B\u8DC3\u4EFB\u52A1\uFF0C\u81EA\u52A8\u5316\u672A\u8FD0\u884C\uFF08\u6B63\u5E38\uFF09",
      );
  }
  _findActiveTask(e) {
    let t = (i) => String(i).padStart(2, "0"),
      r = `${t(e.getHours())}:${t(e.getMinutes())}:${t(e.getSeconds())}`,
      n = e.getDay(),
      o = e.getDate();
    console.log(
      `[GreetingScheduler] \u5339\u914D\u4EFB\u52A1: \u5F53\u524D\u65F6\u95F4=${r}, \u661F\u671F${n}, \u65E5\u671F=${o}, \u5019\u9009\u4EFB\u52A1\u6570=${this.tasks.length}`,
    );
    for (let i of this.tasks) {
      if (i.enabled === !1) {
        console.log(
          `[GreetingScheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u672A\u542F\u7528(enabled=false)`,
        );
        continue;
      }
      if (this._failedTaskIdsInCycle[i.id]) {
        console.log(
          `[GreetingScheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u672C\u8F6E\u5DF2\u542F\u52A8\u5931\u8D25(${this._failedTaskIdsInCycle[i.id]})`,
        );
        continue;
      }
      if (i.cycleType === "weekly") {
        if (!i.weekDays || !i.weekDays.length) {
          console.log(
            `[GreetingScheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u5468\u5FAA\u73AF\u4F46weekDays\u4E3A\u7A7A`,
          );
          continue;
        }
        if (!i.weekDays.includes(n)) {
          console.log(
            `[GreetingScheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u661F\u671F${n}\u4E0D\u5728 [${i.weekDays.join(",")}] \u4E2D`,
          );
          continue;
        }
        console.log(
          `[GreetingScheduler]   \u2514 \u4EFB\u52A1[${i.name}] \u661F\u671F\u5339\u914D\u6210\u529F`,
        );
      } else if (i.cycleType === "monthly") {
        if (!i.monthDays || !i.monthDays.length) {
          console.log(
            `[GreetingScheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u6708\u5FAA\u73AF\u4F46monthDays\u4E3A\u7A7A`,
          );
          continue;
        }
        if (!i.monthDays.includes(o)) {
          console.log(
            `[GreetingScheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u65E5\u671F${o}\u4E0D\u5728 [${i.monthDays.join(",")}] \u4E2D`,
          );
          continue;
        }
        console.log(
          `[GreetingScheduler]   \u2514 \u4EFB\u52A1[${i.name}] \u65E5\u671F\u5339\u914D\u6210\u529F`,
        );
      } else {
        console.log(
          `[GreetingScheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u672A\u77E5\u5468\u671F\u7C7B\u578B cycleType="${i.cycleType}"`,
        );
        continue;
      }
      if (r >= i.startTime && r < i.endTime) {
        let c = this._calcElapsedMinutes(e, i.startTime);
        if (c > Nt) {
          console.log(
            `[GreetingScheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u5DF2\u8D85\u8FC7\u5EF6\u8FDF\u542F\u52A8\u65F6\u95F4(${c}\u5206 > ${Nt}\u5206)`,
          );
          continue;
        }
        return (
          console.log(
            `[GreetingScheduler]   \u2514 \u2713 \u4EFB\u52A1[${i.name}] \u5B8C\u5168\u5339\u914D! time=${r} in [${i.startTime}, ${i.endTime})`,
          ),
          i
        );
      } else
        console.log(
          `[GreetingScheduler]   \u2514 \u8DF3\u8FC7\u4EFB\u52A1[${i.name}]: \u65F6\u95F4\u4E0D\u5339\u914D ${r} not in [${i.startTime}, ${i.endTime})`,
        );
    }
    return (
      console.log(
        "[GreetingScheduler]   \u2514 \u65E0\u5339\u914D\u4EFB\u52A1",
      ),
      null
    );
  }
};
var $c = "https://hr.uf-tree.com",
  kc = "/api/v1";
let installationIdPromise = null;
async function getInstallationId() {
  if (installationIdPromise) return installationIdPromise;
  installationIdPromise = (async () => {
    const stored = await chrome.storage.local.get(R.INSTALLATION_ID);
    let id = stored[R.INSTALLATION_ID];
    if (!id) {
      id = crypto.randomUUID();
      await chrome.storage.local.set({ [R.INSTALLATION_ID]: id });
    }
    return id;
  })();
  return installationIdPromise;
}
const PRIVACY_CONSENT_KEY = "privacyConsent",
  PRIVACY_CONSENT_VERSION = "2026-07-29";
async function requireCurrentPrivacyConsent() {
  let consent = (await chrome.storage.local.get(PRIVACY_CONSENT_KEY))[
    PRIVACY_CONSENT_KEY
  ];
  if (
    !consent ||
    consent.version !== PRIVACY_CONSENT_VERSION ||
    !consent.acceptedAt ||
    consent.candidateDataAuthorized !== !0 ||
    consent.aiTransferAcknowledged !== !0 ||
    consent.cloudSettingsAcknowledged !== !0
  )
    throw new Error("请先到个人中心阅读并同意最新隐私政策与数据处理说明");
  return consent;
}
async function hasCurrentPrivacyConsent() {
  try {
    return await requireCurrentPrivacyConsent(), !0;
  } catch {
    return !1;
  }
}
async function requireRecentAutomationApproval(key) {
  let approval = (await chrome.storage.local.get(key))[key],
    approvedAt = approval?.approvedAt
      ? new Date(approval.approvedAt).getTime()
      : 0;
  if (
    !approval ||
    approval.privacyVersion !== PRIVACY_CONSENT_VERSION ||
    !approvedAt ||
    Date.now() - approvedAt > 15 * 60 * 1e3
  )
    throw new Error(
      "本次任务范围尚未确认，请从运行控制台重新点击启动并审核岗位、话术和候选人范围",
    );
  return approval;
}
function hasScheduledTaskApproval(task) {
  return Boolean(
    task?.scopeApprovedAt &&
      task?.privacyVersion === PRIVACY_CONSENT_VERSION &&
      task?.recipientScope,
  );
}
async function $t(s, { method: e = "GET", body: t, accessToken: r } = {}) {
  let n = `${$c}${kc}${s}`,
    o = {
      "Content-Type": "application/json",
      "X-Device-Id": await getInstallationId(),
    };
  r && (o.Authorization = `Bearer ${r}`), y(`[AuthProxy] ${e} ${n}`);
  let i = await fetch(n, {
    method: e,
    headers: o,
    body: e === "GET" ? void 0 : JSON.stringify(t || {}),
  });
  if (!i.ok) {
    let d = "",
      h = {};
    try {
      h = await i.json();
      d = h.detail || h.message || h.error || "";
    } catch {}
    let err = new Error(`HTTP ${i.status}: ${d || "\u8BF7\u6C42\u5931\u8D25"}`);
    throw ((err.status = i.status), (err.code = h.code || ""), (err.detail = d), err);
  }
  return await i.json();
}
async function Ai(s) {
  return $t("/auth/send-code", { method: "POST", body: { email: s } });
}
async function Si(s, e, t = !1) {
  let r = await getInstallationId();
  return $t("/auth/verify-code", {
    method: "POST",
    body: { email: s, code: e, device_id: r, force_login: t },
  });
}
async function wi(s) {
  return $t("/auth/refresh", {
    method: "POST",
    body: { refresh_token: s, device_id: await getInstallationId() },
  });
}
async function As(s) {
  return $t("/users/me", { method: "GET", accessToken: s });
}
async function Ii(s) {
  return $t("/auth/logout", { method: "POST", accessToken: s });
}
async function heartbeatRequest(s) {
  return $t("/auth/heartbeat", { method: "POST", accessToken: s });
}
async function bi() {
  return $t("/products", { method: "GET" });
}
async function whobotStatusRequest(s) {
  return $t("/integrations/whobot/status", { method: "GET", accessToken: s });
}
async function whobotSubmitRequest(s, e) {
  return $t("/integrations/whobot/clues", {
    method: "POST",
    body: e,
    accessToken: s,
  });
}
async function whobotRecordsRequest(s) {
  return $t("/integrations/whobot/records", {
    method: "GET",
    accessToken: s,
  });
}
// ── 托管大模型代理（密钥只在服务器；插件仅用登录态 token 调 /llm/*）────
// 与上方各 Request 助手同模式：第一个参数是 accessToken，配合 rn() 自动刷新。
async function llmChatRequest(s, e) {
  return $t("/llm/chat", { method: "POST", body: e, accessToken: s });
}
async function llmScoreRequest(s, e) {
  return $t("/llm/score-resume", { method: "POST", body: e, accessToken: s });
}
async function llmBalanceRequest(s) {
  return $t("/billing/balance", { method: "GET", accessToken: s });
}
async function llmTransactionsRequest(s, e) {
  let limit = (e && e.limit) || 30,
    offset = (e && e.offset) || 0;
  return $t(`/billing/transactions?limit=${limit}&offset=${offset}`, {
    method: "GET",
    accessToken: s,
  });
}
// 断粮判定：后端 402 / BILLING_INSUFFICIENT_BALANCE 即「点数不足」。
function isBillingBlock(s) {
  return (
    (s && s.code === "BILLING_INSUFFICIENT_BALANCE") ||
    (s && s.status === 402)
  );
}
// 断粮状态（跨 SW 重启持久化）：命中即本地短路、不再打后端；节流复查余额，
// 充值后 >0 自动清除并恢复。回复引擎在 Qn 入口调用，避免断粮后空耗限流。
const BILLING_BLOCK_KEY = "billingBlocked";
let billingBlockProbeAt = 0;
async function markBillingBlocked(s) {
  let stored = await chrome.storage.local.get(BILLING_BLOCK_KEY);
  if (stored[BILLING_BLOCK_KEY]) return; // 已标记，不重复强提示
  await chrome.storage.local.set({ [BILLING_BLOCK_KEY]: Date.now() });
  he(
    "reply",
    "warn",
    `⚠️ 点数不足，${s}已暂停；请到「大模型（托管）」页充值，充值后自动恢复`,
  );
}
async function billingBlockedActive() {
  let stored = await chrome.storage.local.get(BILLING_BLOCK_KEY);
  if (!stored[BILLING_BLOCK_KEY]) return !1;
  let now = Date.now();
  if (now - billingBlockProbeAt < 30 * 1000) return !0; // 30s 内不重复查余额
  billingBlockProbeAt = now;
  try {
    let bal = await rn(llmBalanceRequest);
    if (bal && Number(bal.balance_points) > 0) {
      await chrome.storage.local.remove(BILLING_BLOCK_KEY);
      he("reply", "info", "✅ 点数已充值，自动回复已自动恢复");
      return !1;
    }
  } catch {}
  return !0;
}
// 启动前主动余额门（fail-closed）：余额<=0 则标记断粮并返回 true（调用方据此拒启动）。
// 网络异常/未登录不硬阻断（返回 false），由调用时 402 / 断粮标记兜底。
async function llmBalanceEmpty() {
  try {
    let bal = await rn(llmBalanceRequest);
    if (bal && Number(bal.balance_points) > 0) return !1;
    await markBillingBlocked("自动回复");
    return !0;
  } catch {
    return !1;
  }
}
async function cloudSettingsGetRequest(s) {
  return $t("/users/me/settings", { method: "GET", accessToken: s });
}
async function cloudSettingsPutRequest(s, e) {
  return $t("/users/me/settings", {
    method: "PUT",
    body: e,
    accessToken: s,
  });
}

// ── 账号配置云同步 ─────────────────────────────────────
// 只同步招聘配置；API Key、人才库、认证信息和运行状态始终留在本机。
const CLOUD_SETTINGS_KEYS = [
    "modelConfig",
    "timeConfig",
    "goalConfigs",
    "goalReplyTemplates",
    "keywordRules",
    "generalGreetingConfig",
    "replyPositionConfigs",
    "generalKnowledgeBase",
    "greetingTimeConfig",
    "greetingConfigs",
    "jobConfigs",
    "greetingScheduledTasks",
    "replyScheduledTasks",
    "resumeReplyConfig",
    "resumeCollectConfig",
    "outboundCompanyConfig",
    "outboundJobConfigs",
  ],
  CLOUD_SETTINGS_META_KEY = "cloudSettingsMeta",
  CLOUD_SETTINGS_CACHE_KEY = "cloudSettingsAccountCache",
  DEVICE_MODEL_API_KEYS_KEY = "deviceModelApiKeys",
  CLOUD_SETTINGS_SYNC_ALARM = "cloud-settings-sync";
let cloudSettingsApplying = !1,
  cloudSettingsPushTimer = null,
  cloudSettingsPushPromise = null;

function cloudSettingsClone(value) {
  if (value === void 0) return void 0;
  return JSON.parse(JSON.stringify(value));
}

function cloudSettingsSnapshotFromStorage(stored) {
  let snapshot = {};
  for (let key of CLOUD_SETTINGS_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(stored, key)) continue;
    let value = cloudSettingsClone(stored[key]);
    if (key === "modelConfig" && value && typeof value === "object") {
      delete value.apiKey;
    }
    snapshot[key] = value;
  }
  return snapshot;
}

async function readCloudSettingsSnapshot() {
  return cloudSettingsSnapshotFromStorage(
    await chrome.storage.local.get(CLOUD_SETTINGS_KEYS),
  );
}

function trimCloudSettingsCaches(caches) {
  let entries = Object.entries(caches || {}).sort(
    (a, b) => (b[1]?.cachedAt || 0) - (a[1]?.cachedAt || 0),
  );
  return Object.fromEntries(entries.slice(0, 5));
}

async function cacheActiveCloudSettings(ownerUserId, metaOverride = {}) {
  if (!ownerUserId) return;
  let stored = await chrome.storage.local.get([
      CLOUD_SETTINGS_CACHE_KEY,
      CLOUD_SETTINGS_META_KEY,
      DEVICE_MODEL_API_KEYS_KEY,
      "modelConfig",
    ]),
    caches = stored[CLOUD_SETTINGS_CACHE_KEY] || {},
    meta = stored[CLOUD_SETTINGS_META_KEY] || {},
    apiKeys = stored[DEVICE_MODEL_API_KEYS_KEY] || {},
    modelConfig = stored.modelConfig || {},
    snapshot = await readCloudSettingsSnapshot();
  if (modelConfig.apiKey) apiKeys[ownerUserId] = modelConfig.apiKey;
  caches[ownerUserId] = {
    settings: snapshot,
    revision: Number(metaOverride.revision ?? meta.revision ?? 0),
    dirty: Boolean(metaOverride.dirty ?? meta.dirty),
    cachedAt: Date.now(),
  };
  await chrome.storage.local.set({
    [CLOUD_SETTINGS_CACHE_KEY]: trimCloudSettingsCaches(caches),
    [DEVICE_MODEL_API_KEYS_KEY]: apiKeys,
  });
}

async function applyCloudSettings(settings, ownerUserId, revision) {
  let stored = await chrome.storage.local.get([
      CLOUD_SETTINGS_META_KEY,
      CLOUD_SETTINGS_CACHE_KEY,
      DEVICE_MODEL_API_KEYS_KEY,
      "modelConfig",
    ]),
    previousMeta = stored[CLOUD_SETTINGS_META_KEY] || {},
    caches = stored[CLOUD_SETTINGS_CACHE_KEY] || {},
    apiKeys = stored[DEVICE_MODEL_API_KEYS_KEY] || {},
    currentModel = stored.modelConfig || {},
    isLegacyOwner = !previousMeta.ownerUserId,
    localApiKey =
      apiKeys[ownerUserId] ||
      (previousMeta.ownerUserId === ownerUserId || isLegacyOwner
        ? currentModel.apiKey || ""
        : "");
  if (localApiKey) apiKeys[ownerUserId] = localApiKey;

  let updates = {},
    removals = [];
  for (let key of CLOUD_SETTINGS_KEYS) {
    if (Object.prototype.hasOwnProperty.call(settings || {}, key)) {
      updates[key] = cloudSettingsClone(settings[key]);
    } else {
      removals.push(key);
    }
  }
  if (updates.modelConfig || localApiKey) {
    updates.modelConfig = {
      ...(updates.modelConfig || {}),
      apiKey: localApiKey,
    };
    removals = removals.filter((key) => key !== "modelConfig");
  }
  let cleanSettings = cloudSettingsSnapshotFromStorage(updates),
    meta = {
      ownerUserId,
      revision: Number(revision || 0),
      dirty: !1,
      changeVersion:
        previousMeta.ownerUserId === ownerUserId
          ? Number(previousMeta.changeVersion || 0)
          : 0,
      lastSyncedAt: new Date().toISOString(),
    };
  caches[ownerUserId] = {
    settings: cleanSettings,
    revision: meta.revision,
    dirty: !1,
    cachedAt: Date.now(),
  };
  cloudSettingsApplying = !0;
  try {
    if (removals.length) await chrome.storage.local.remove(removals);
    await chrome.storage.local.set({
      ...updates,
      [CLOUD_SETTINGS_META_KEY]: meta,
      [CLOUD_SETTINGS_CACHE_KEY]: trimCloudSettingsCaches(caches),
      [DEVICE_MODEL_API_KEYS_KEY]: apiKeys,
    });
  } finally {
    cloudSettingsApplying = !1;
  }
  return meta;
}

async function prepareCloudSettingsAccountSwitch(ownerUserId) {
  let stored = await chrome.storage.local.get([
      CLOUD_SETTINGS_META_KEY,
      CLOUD_SETTINGS_CACHE_KEY,
    ]),
    meta = stored[CLOUD_SETTINGS_META_KEY] || {},
    caches = stored[CLOUD_SETTINGS_CACHE_KEY] || {};
  if (meta.ownerUserId && meta.ownerUserId !== ownerUserId) {
    await cacheActiveCloudSettings(meta.ownerUserId);
    stored = await chrome.storage.local.get(CLOUD_SETTINGS_CACHE_KEY);
    caches = stored[CLOUD_SETTINGS_CACHE_KEY] || {};
  }
  return { previousMeta: meta, caches };
}

async function syncCloudSettingsForLogin(accessToken, user) {
  let ownerUserId = user?.id;
  if (!ownerUserId) {
    let profile = await As(accessToken);
    ownerUserId = profile.id;
  }
  if (!ownerUserId) throw new Error("账号缺少用户 ID，无法同步配置");

  let { previousMeta, caches } =
      await prepareCloudSettingsAccountSwitch(ownerUserId),
    localSnapshot = await readCloudSettingsSnapshot(),
    cached = caches[ownerUserId],
    remote = await cloudSettingsGetRequest(accessToken);

  // 同一账号存在未上传变更时，先按本地已知 revision 尝试续写。
  let dirtySource =
    previousMeta.ownerUserId === ownerUserId && previousMeta.dirty
      ? {
          settings: localSnapshot,
          revision: Number(previousMeta.revision || 0),
        }
      : cached?.dirty
        ? {
            settings: cached.settings || {},
            revision: Number(cached.revision || 0),
          }
        : null;
  if (remote.exists && dirtySource) {
    try {
      remote = await cloudSettingsPutRequest(accessToken, {
        settings: dirtySource.settings,
        base_revision: dirtySource.revision,
      });
    } catch (error) {
      if (error.code !== "SETTINGS_REVISION_CONFLICT") throw error;
      remote = await cloudSettingsGetRequest(accessToken);
    }
  }

  if (!remote.exists) {
    // 首次升级：无归属的旧本地配置自动归入当前登录账号。
    // 已有其他账号归属时绝不复制，改用该账号缓存或空配置。
    let seed =
      cached?.settings ||
      (!previousMeta.ownerUserId ? localSnapshot : {});
    remote = await cloudSettingsPutRequest(accessToken, {
      settings: seed,
      base_revision: 0,
    });
  }
  await applyCloudSettings(
    remote.settings || {},
    ownerUserId,
    remote.revision || 0,
  );
  return {
    ok: !0,
    ownerUserId,
    revision: Number(remote.revision || 0),
  };
}

async function isolateCloudSettingsAfterFailedSwitch(ownerUserId) {
  let meta = (
    await chrome.storage.local.get(CLOUD_SETTINGS_META_KEY)
  )[CLOUD_SETTINGS_META_KEY];
  if (!meta?.ownerUserId || meta.ownerUserId === ownerUserId) return;
  await applyCloudSettings({}, ownerUserId, 0);
}

async function pushCloudSettingsNow() {
  if (cloudSettingsPushPromise) return cloudSettingsPushPromise;
  cloudSettingsPushPromise = (async () => {
    let stored = await chrome.storage.local.get([
        R.PROFILE_AUTH,
        CLOUD_SETTINGS_META_KEY,
      ]),
      auth = stored[R.PROFILE_AUTH] || {},
      meta = stored[CLOUD_SETTINGS_META_KEY] || {};
    if (!auth.accessToken || !meta.ownerUserId || !meta.dirty) return null;
    let snapshot = await readCloudSettingsSnapshot();
    try {
      let result = await rn(cloudSettingsPutRequest, {
        settings: snapshot,
        base_revision: Number(meta.revision || 0),
      });
      let currentMeta = (
        await chrome.storage.local.get(CLOUD_SETTINGS_META_KEY)
      )[CLOUD_SETTINGS_META_KEY] || {};
      if (
        currentMeta.ownerUserId === meta.ownerUserId &&
        Number(currentMeta.changeVersion || 0) !==
          Number(meta.changeVersion || 0)
      ) {
        // 上传期间又发生了本地编辑：只推进 revision，不回写旧快照。
        currentMeta = {
          ...currentMeta,
          revision: Number(result.revision || 0),
          dirty: !0,
        };
        await chrome.storage.local.set({
          [CLOUD_SETTINGS_META_KEY]: currentMeta,
        });
        await cacheActiveCloudSettings(meta.ownerUserId, {
          revision: currentMeta.revision,
          dirty: !0,
        });
        scheduleCloudSettingsPush();
      } else {
        await applyCloudSettings(
          result.settings || {},
          meta.ownerUserId,
          result.revision || 0,
        );
      }
      return result;
    } catch (error) {
      if (error.code === "SETTINGS_REVISION_CONFLICT") {
        let remote = await rn(cloudSettingsGetRequest);
        await applyCloudSettings(
          remote.settings || {},
          meta.ownerUserId,
          remote.revision || 0,
        );
        return remote;
      }
      y("[CloudSettings] 上传失败，保留本地待同步状态:", error.message);
      throw error;
    }
  })().finally(() => {
    cloudSettingsPushPromise = null;
  });
  return cloudSettingsPushPromise;
}

function scheduleCloudSettingsPush() {
  if (cloudSettingsPushTimer) clearTimeout(cloudSettingsPushTimer);
  chrome.alarms
    .create(CLOUD_SETTINGS_SYNC_ALARM, { when: Date.now() + 1500 })
    .catch(() => {});
  cloudSettingsPushTimer = setTimeout(() => {
    cloudSettingsPushTimer = null;
    pushCloudSettingsNow().catch(() => {});
  }, 1200);
}

async function markCloudSettingsDirty(changes) {
  let stored = await chrome.storage.local.get([
      CLOUD_SETTINGS_META_KEY,
      CLOUD_SETTINGS_CACHE_KEY,
      DEVICE_MODEL_API_KEYS_KEY,
      "modelConfig",
    ]),
    meta = stored[CLOUD_SETTINGS_META_KEY] || {};
  if (!meta.ownerUserId) return;
  meta = {
    ...meta,
    dirty: !0,
    changeVersion: Number(meta.changeVersion || 0) + 1,
  };
  let apiKeys = stored[DEVICE_MODEL_API_KEYS_KEY] || {};
  if (changes.modelConfig) {
    let apiKey = stored.modelConfig?.apiKey || "";
    if (apiKey) apiKeys[meta.ownerUserId] = apiKey;
    else delete apiKeys[meta.ownerUserId];
  }
  await chrome.storage.local.set({
    [CLOUD_SETTINGS_META_KEY]: meta,
    [DEVICE_MODEL_API_KEYS_KEY]: apiKeys,
  });
  await cacheActiveCloudSettings(meta.ownerUserId, { dirty: !0 });
  scheduleCloudSettingsPush();
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (
    areaName !== "local" ||
    cloudSettingsApplying ||
    !CLOUD_SETTINGS_KEYS.some((key) =>
      Object.prototype.hasOwnProperty.call(changes, key),
    )
  )
    return;
  markCloudSettingsDirty(changes).catch((error) =>
    y("[CloudSettings] 标记待同步失败:", error.message),
  );
});
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== CLOUD_SETTINGS_SYNC_ALARM) return;
  if (cloudSettingsPushTimer) {
    clearTimeout(cloudSettingsPushTimer);
    cloudSettingsPushTimer = null;
  }
  pushCloudSettingsNow().catch(() => {});
});

async function syncCloudSettingsForCurrentSession() {
  if (!(await hasCurrentPrivacyConsent())) return;
  let auth = (
    await chrome.storage.local.get(R.PROFILE_AUTH)
  )[R.PROFILE_AUTH];
  if (!auth?.accessToken) return;
  let profile = await rn(As),
    result = await syncCloudSettingsForLogin(auth.accessToken, profile);
  if (!auth.userId && result.ownerUserId) {
    auth.userId = result.ownerUserId;
    await chrome.storage.local.set({ [R.PROFILE_AUTH]: auth });
  }
}

setTimeout(() => {
  syncCloudSettingsForCurrentSession().catch((error) =>
    y("[CloudSettings] 启动同步失败，稍后修改配置时重试:", error.message),
  );
}, 0);
console.log(
  "[SW] ===== Service Worker \u542F\u52A8 =====",
  new Date().toISOString(),
);
console.log(
  "[SW] SW \u7C7B\u578B:",
  self.document ? "window" : "service worker",
);
console.log("[SW] \u7528\u6237\u4EE3\u7406:", navigator.userAgent);
chrome.storage.local
  .get(R.DEV_MODE)
  .then((s) => {
    hi(!!s[R.DEV_MODE]);
  })
  .catch(() => {});
li((s, ...e) => {
  if (q)
    try {
      q.postMessage({
        action: S.DEV_LOG,
        data: { level: s, message: ui(e), time: Date.now() },
      });
    } catch {}
});
self.addEventListener("error", (s) => {
  console.error(
    "[SW] \u672A\u6355\u83B7\u9519\u8BEF:",
    s.message,
    "at",
    s.filename,
    ":",
    s.lineno,
  );
});
self.addEventListener("unhandledrejection", (s) => {
  console.error(
    "[SW] \u672A\u5904\u7406\u7684 Promise \u62D2\u7EDD:",
    s.reason?.stack || s.reason,
  );
});
var M = C.IDLE,
  Ot = "",
  z = C.IDLE,
  sn = "",
  q = null;
chrome.action.onClicked.addListener(async (s) => {
  y(
    "[SW] \u63D2\u4EF6\u56FE\u6807\u88AB\u70B9\u51FB\uFF0C\u6253\u5F00\u4FA7\u8FB9\u680F...",
  );
  try {
    if (q !== null) {
      y("[SW] \u4FA7\u8FB9\u680F\u5DF2\u6253\u5F00\uFF0C\u8DF3\u8FC7");
      return;
    }
    await chrome.sidePanel.open({ windowId: s.windowId }),
      y("[SW] \u4FA7\u8FB9\u680F\u5DF2\u6210\u529F\u6253\u5F00");
  } catch (e) {
    console.error(
      "[SW] \u6253\u5F00\u4FA7\u8FB9\u680F\u5931\u8D25:",
      e.message,
    );
    try {
      await chrome.sidePanel.open({ windowId: s.windowId });
    } catch (t) {
      console.error(
        "[SW] \u91CD\u8BD5\u6253\u5F00\u4FA7\u8FB9\u680F\u4ECD\u7136\u5931\u8D25:",
        t.message,
      );
    }
  }
});
chrome.runtime.onConnect.addListener((s) => {
  s.name === "sidepanel" && !s.sender?.tab &&
    (y(
      "[SW] \u4FA7\u8FB9\u680F\u5DF2\u8FDE\u63A5, port:",
      s.sender?.tab?.id || "unknown",
    ),
    (q = s),
    s.onMessage.addListener(async (e) => {
      let r = new Set([S.CMD_GET_DEV_STATUS, S.CMD_GET_STATUS]).has(e.action);
      r ||
        y(
          "[SW] \u6536\u5230\u4FA7\u8FB9\u680F\u6D88\u606F:",
          e.action,
          e.data || "",
        );
      let n = cn[e.action];
      if (n)
        try {
          let o = await n(e.data);
          r || y("[SW] \u5904\u7406\u5B8C\u6210:", e.action, o),
            s.postMessage({
              action: e.action,
              data: o,
              requestId: e.requestId,
            });
        } catch (o) {
          if (
            (console.error(
              "[SW] \u5904\u7406\u9519\u8BEF:",
              e.action,
              o.message,
            ),
            s.postMessage({
              action: S.ERROR,
              data: { error: o.message },
              requestId: e.requestId,
            }),
            o.message === "\u672A\u767B\u5F55" ||
              (o.message &&
                o.message.includes("\u767B\u5F55\u5DF2\u8FC7\u671F")))
          )
            try {
              s.postMessage({
                action: S.SESSION_EXPIRED,
                data: { error: o.message },
              });
            } catch {}
        }
      else Ie("[SW] \u672A\u77E5\u6D88\u606F\u7C7B\u578B:", e.action);
    }),
    s.onDisconnect.addListener(() => {
      y("[SW] \u4FA7\u8FB9\u680F\u8FDE\u63A5\u65AD\u5F00"), (q = null);
    }));
});
chrome.runtime.onMessage.addListener((s, e, t) => {
  if (s.action === S.DEV_LOG || s.action === S.RUNNING_LOG) {
    if (q)
      try {
        q.postMessage({ action: s.action, data: s.data });
      } catch {}
    return !1;
  }
  let r = e.tab ? null : cn[s.action];
  if (r)
    return (
      r(s.data)
        .then((n) => {
          t(n);
        })
        .catch((n) => {
          if (
            (t({ error: n.message }),
            q &&
              (n.message === "\u672A\u767B\u5F55" ||
                (n.message &&
                  n.message.includes("\u767B\u5F55\u5DF2\u8FC7\u671F"))))
          )
            try {
              q.postMessage({
                action: S.SESSION_EXPIRED,
                data: { error: n.message },
              });
            } catch {}
        }),
      !0
    );
  if (e.tab) {
    let n = vc[s.action];
    if (n)
      return (
        n(s.data, e.tab.id)
          .then((o) => {
            y("[SW] CS \u6D88\u606F\u5904\u7406\u5B8C\u6210:", s.action), t(o);
          })
          .catch((o) => {
            console.error(
              "[SW] CS \u6D88\u606F\u5904\u7406\u51FA\u9519:",
              s.action,
              o.message,
            ),
              t({ error: o.message });
          }),
        !0
      );
    Ie("[SW] \u672A\u77E5 CS \u6D88\u606F:", s.action);
  }
  return (
    Ie(
      "[SW] \u6536\u5230\u65E0\u6CD5\u5904\u7406\u7684\u6D88\u606F:",
      s.action,
      "sender.tab:",
      !!e.tab,
    ),
    !1
  );
});
chrome.tabs.onRemoved.addListener(async (s) => {
  await k(s);
});
function Oc(s) {
  if (!s) return "\u514D\u8D39\u7248";
  let e = (s.plan_type || "").toLowerCase(),
    t = (s.plan_id || "").toLowerCase();
  return e === "monthly" || t.includes("monthly")
    ? "\u6708\u5EA6\u5957\u9910"
    : e === "yearly" || t.includes("yearly")
      ? "\u5E74\u5EA6\u5957\u9910"
      : s.plan_id || "\u4E13\u4E1A\u7248";
}
function tn(s) {
  let t = (s.subscriptions || []).find((r) => r.status === "active");
  return {
    plan: t ? t.plan_id || "premium" : "free",
    planType: (t && t.plan_type) || "",
    planName: t ? Oc(t) : "\u514D\u8D39\u7248",
    isVip: !!t,
    expireDate: (t && t.ends_at) || null,
    subscriptionId: (t && t.id) || null,
  };
}
const SESSION_FAILURE_CODES = new Set([
  "SESSION_REPLACED",
  "SESSION_REVOKED",
  "SESSION_DEVICE_MISMATCH",
  "TOKEN_INVALID",
  "TOKEN_MISSING",
]);
async function stopAllAutomations(reason = "会话校验失败", clearSession = !1) {
  y(`[SW] 停止全部自动化: ${reason}`);
  let tabs = await chrome.tabs
    .query({ url: ["https://www.zhipin.com/*", "https://*.zhipin.com/*"] })
    .catch(() => []);
  await Promise.all(
    tabs.flatMap((tab) =>
      [S.CS_STOP, S.CS_STOP_GREETING, "rc_stop"].map((action) =>
        chrome.tabs.sendMessage(tab.id, { action }).catch(() => {}),
      ),
    ),
  );
  await stopResumeCollector().catch(() => {});
  await chrome.storage.session
    .remove(["schedulerAutoStarted", "greetingSchedulerAutoStarted"])
    .catch(() => {});
  await chrome.storage.local.remove(R.ACTIVE_TAB_ID).catch(() => {});
  M = C.IDLE;
  z = C.IDLE;
  kt();
  tt();
  if (clearSession) {
    await chrome.storage.local.remove([
      R.PROFILE_AUTH,
      R.PROFILE_SUBSCRIPTION,
    ]);
    try {
      q?.postMessage({ action: S.SESSION_EXPIRED, data: { error: reason } });
    } catch {}
  }
}
async function invalidateLocalSession(error) {
  await stopAllAutomations(
    error?.detail || error?.message || "登录会话已失效",
    !0,
  );
}
async function rn(s, ...e) {
  let r =
    (await chrome.storage.local.get(R.PROFILE_AUTH))[R.PROFILE_AUTH] || {};
  if (!r.accessToken) throw new Error("\u672A\u767B\u5F55");
  try {
    return await s(r.accessToken, ...e);
  } catch (n) {
    if (SESSION_FAILURE_CODES.has(n.code)) {
      await invalidateLocalSession(n);
      throw new Error(n.detail || "登录会话已失效，请重新登录");
    }
    if (n.code === "TOKEN_EXPIRED") {
      if (!r.refreshToken) {
        await invalidateLocalSession(n);
        throw new Error("登录已过期，请重新登录");
      }
      try {
        globalThis.__kxzpRefreshPromise ||= wi(r.refreshToken).finally(() => {
          globalThis.__kxzpRefreshPromise = null;
        });
        let o = await globalThis.__kxzpRefreshPromise;
        return (
          (r.accessToken = o.access_token),
          o.refresh_token && (r.refreshToken = o.refresh_token),
          o.session?.id && (r.sessionId = o.session.id),
          await chrome.storage.local.set({ [R.PROFILE_AUTH]: r }),
          y("[SW] Token \u5DF2\u81EA\u52A8\u5237\u65B0"),
          await s(r.accessToken, ...e)
        );
      } catch (o) {
        y("[SW] Token \u5237\u65B0\u5931\u8D25:", o.message);
        await invalidateLocalSession(o);
        throw new Error("登录已过期，请重新登录");
      }
    }
    throw n;
  }
}
async function requireActiveSubscriptionOnline() {
  let profile = await rn(As),
    subscription = tn(profile),
    expired = subscription.expireDate
      ? new Date() > new Date(subscription.expireDate)
      : !1;
  await chrome.storage.local.set({ [R.PROFILE_SUBSCRIPTION]: subscription });
  if (!subscription.isVip || expired)
    throw new Error(
      expired
        ? "订阅已到期，请到个人中心续费"
        : "该功能为会员功能，请先开通订阅",
    );
  return subscription;
}
const AUTH_SESSION_HEARTBEAT = "auth-session-heartbeat";
async function checkSessionHeartbeat() {
  let auth =
    (await chrome.storage.local.get(R.PROFILE_AUTH))[R.PROFILE_AUTH] || {};
  if (!auth.accessToken) return;
  try {
    await rn(heartbeatRequest);
  } catch (error) {
    let current =
      (await chrome.storage.local.get(R.PROFILE_AUTH))[R.PROFILE_AUTH] || {};
    if (current.accessToken)
      await stopAllAutomations(
        "网络异常，无法验证登录会话，已停止自动化",
        !1,
      );
  }
}
var cn = {
    [S.CMD_START]: async () => {
      await requireActiveSubscriptionOnline();
      await requireCurrentPrivacyConsent();
      await requireRecentAutomationApproval("replyAutomationApproval");
      await chrome.storage.session
        .remove("schedulerAutoStarted")
        .catch(() => {}),
        y("[SW] STEP 1: \u67E5\u8BE2\u5F53\u524D\u6807\u7B7E\u9875...");
      let e = (await chrome.tabs.query({ active: !0, currentWindow: !0 }))[0];
      if ((y("[SW] \u5F53\u524D\u6807\u7B7E\u9875:", e?.id, e?.url), !e))
        throw new Error("\u672A\u627E\u5230\u6D3B\u52A8\u6807\u7B7E\u9875");
      if (!e.url?.includes("zhipin.com"))
        throw new Error(
          `\u8BF7\u5728 BOSS \u76F4\u8058\u9875\u9762\u4E2D\u4F7F\u7528 (\u5F53\u524D: ${e.url})`,
        );
      if (!e.url?.match(/^https:\/\/www\.zhipin\.com\/web\/chat/i))
        throw new Error(`\u8BF7\u5728 BOSS \u76F4\u8058\u804A\u5929\u9875\u9762\u4E2D\u4F7F\u7528 (\u5F53\u524D\u9875\u9762: ${e.url})
\u8BF7\u5BFC\u822A\u5230 "https://www.zhipin.com/web/chat"`);
      y("[SW] STEP 2: \u68C0\u67E5\u5C97\u4F4D\u914D\u7F6E...");
      let t = await chrome.storage.local.get([
          R.REPLY_POSITION_CONFIGS,
          R.KEYWORD_RULES,
          R.JOB_CONFIGS,
        ]),
        a = (t[R.KEYWORD_RULES] || []).filter((m) => m.enabled !== !1),
        // 岗位范围三态链（2026-09-02 拍板：岗位列表开关=总开关）：scope 为唯一判定源
        scope = resolveReplyScope(t[R.JOB_CONFIGS], t[R.REPLY_POSITION_CONFIGS]),
        standby = scope.mode === "none",
        l = scope.mode === "all";
      standby
        ? (y(
            "[SW] 待机模式：所有岗位配置均已关闭，回复引擎不处理任何岗位",
          ),
          he(
            "reply",
            "warn",
            "⚠️ 所有岗位配置均已关闭，回复引擎将待机（不处理任何岗位）",
          ))
        : l
        ? (y(
            "[SW] \u5168\u5C97\u4F4D\u6A21\u5F0F\uFF1A\u6CA1\u6709\u542F\u7528\u7684\u5C97\u4F4D\u914D\u7F6E",
          ),
          he(
            "reply",
            "warn",
            "\u26A0\uFE0F \u5168\u5C97\u4F4D\u6A21\u5F0F\uFF1A\u5C06\u56DE\u590D BOSS \u6C9F\u901A\u4E2D\u7684\u6240\u6709\u5DF2\u53D1\u5E03\u5C97\u4F4D",
          ))
        : y(
            `[SW] \u767D\u540D\u5355\u6A21\u5F0F\uFF1A\u5DF2\u542F\u7528\u5C97\u4F4D\u914D\u7F6E: ${scope.entries.map((m) => m.name).join(", ")}`,
          );
      let o = l ? a.length > 0 : scope.entries.some((m) => m.keywordReply !== !1),
        i = l ? !0 : scope.entries.some((m) => m.aiReply !== !1),
        c = l
          ? !1
          : scope.entries.some(
              (m) =>
                Array.isArray(m.greetingMessages) &&
                m.greetingMessages.length > 0,
            );
      if (!standby && !o && !i && !c) {
        let m =
          "\u542F\u7528\u7684\u5C97\u4F4D\u914D\u7F6E\u4E2D\u6CA1\u6709\u5F00\u542F\u4EFB\u4F55\u56DE\u590D\u65B9\u5F0F\uFF08\u5173\u952E\u8BCD\u56DE\u590D/AI\u56DE\u590D/\u65B0\u62DB\u547C\u8BDD\u672F\uFF09";
        throw (
          (he("reply", "warn", `\u505C\u6B62\u539F\u56E0\uFF1A${m}`),
          await k(e.id),
          new Error(m))
        );
      }
      if (
        (y(
          `[SW] \u56DE\u590D\u65B9\u5F0F\u68C0\u67E5: keywordReply=${o}, aiReply=${i}, greetingMessages=${c}`,
        ),
        y("[SW] STEP 3: \u6CE8\u518C\u6807\u7B7E\u9875..."),
        !(await Yr(e.id)))
      )
        throw new Error(
          "\u5DF2\u5728\u5176\u4ED6\u7A97\u53E3\u8FD0\u884C\u4E2D",
        );
      y("[SW] STEP 4: \u52A0\u8F7D\u5B8C\u6574\u914D\u7F6E...");
      let h = await Pi();
      if (
        (y(
          "[SW] \u914D\u7F6E\u5DF2\u52A0\u8F7D\uFF08\u5927\u6A21\u578B\u6258\u7BA1\u6A21\u5F0F\uFF09",
        ),
        i)
      ) {
        if (await llmBalanceEmpty())
          throw (
            (console.error("[SW] \u70B9\u6570\u4E0D\u8DB3\uFF0C\u5DF2\u963B\u6B62\u542F\u52A8"),
            await k(e.id),
            new Error(
              "\u70B9\u6570\u4E0D\u8DB3\uFF0C\u8BF7\u5148\u5230\u300C\u5927\u6A21\u578B\uFF08\u6258\u7BA1\uFF09\u300D\u9875\u5145\u503C\u540E\u7EE7\u7EED\u4F7F\u7528",
            ))
          );
      } else
        y(
          "[SW] \u6240\u6709\u5C97\u4F4D\u5747\u672A\u5F00\u542F AI \u56DE\u590D\uFF0C\u8DF3\u8FC7\u4F59\u989D\u6821\u9A8C",
        );
      if (o) {
        if (a.length === 0)
          throw (
            (console.error("[SW] \u5173\u952E\u8BCD\u89C4\u5219\u4E3A\u7A7A"),
            await k(e.id),
            new Error(
              "\u300C\u5173\u952E\u8BCD\u56DE\u590D\u300D\u5DF2\u542F\u7528\u4F46\u672A\u914D\u7F6E\u5173\u952E\u8BCD\u89C4\u5219\uFF0C\u8BF7\u5148\u6DFB\u52A0\u81F3\u5C11\u4E00\u6761\u89C4\u5219",
            ))
          );
        y("[SW] \u5173\u952E\u8BCD\u89C4\u5219\u6821\u9A8C\u901A\u8FC7");
      } else
        y(
          "[SW] \u6240\u6709\u5C97\u4F4D\u5747\u672A\u5F00\u542F\u5173\u952E\u8BCD\u56DE\u590D\uFF0C\u8DF3\u8FC7\u5173\u952E\u8BCD\u89C4\u5219\u6821\u9A8C",
        );
      y(
        "[SW] STEP 6: \u53D1\u9001 CS_START \u8FDB\u884C\u914D\u7F6E\u6821\u9A8C...",
      );
      let g = await nn(e.id, h, 3, 2e3);
      if (g) {
        if (g.message.startsWith("\u542F\u52A8\u5931\u8D25\uFF1A"))
          throw (await k(e.id), g);
        y(
          "[SW] \u7B2C\u4E00\u6B21 CS_START \u53D1\u9001\u5F02\u5E38:",
          g.message,
        );
      } else y("[SW] \u914D\u7F6E\u6821\u9A8C\u901A\u8FC7");
      if (
        (y(
          "[SW] \u5237\u65B0\u9875\u9762\u4EE5\u91CD\u5EFA MQTT \u8FDE\u63A5...",
        ),
        await chrome.tabs.reload(e.id),
        await et(e.id),
        await new Promise((m) => setTimeout(m, 1500)),
        y("[SW] \u9875\u9762\u5DF2\u5237\u65B0\uFF0C\u53D1\u9001 CS_START..."),
        (g = await nn(e.id, h, 6, 2e3)),
        g)
      )
        throw (
          (await k(e.id),
          new Error(
            "\u5185\u5BB9\u811A\u672C\u672A\u52A0\u8F7D\uFF0C\u8BF7\u786E\u8BA4\u5DF2\u5728\u804A\u5929\u9875\u9762\u4E14\u9875\u9762\u5DF2\u5B8C\u5168\u52A0\u8F7D",
          ))
        );
      return (
        y("[SW] STEP 7: \u66F4\u65B0\u72B6\u6001\u4E3A\u8FD0\u884C\u4E2D"),
        (M = C.RUNNING),
        ie.clearFailedTasks(),
        { state: M }
      );
    },
    [S.CMD_PAUSE]: async () => {
      y("[SW] \u6267\u884C\u6682\u505C");
      let s = await K(),
        e = !1;
      if (s)
        try {
          await chrome.tabs
            .sendMessage(s, { action: S.CS_PAUSE })
            .catch(() => {}),
            (e = !0);
        } catch {}
      return (M = C.PAUSED), e || kt(), { state: M };
    },
    [S.CMD_RESUME]: async () => {
      await requireActiveSubscriptionOnline();
      y("[SW] \u6267\u884C\u7EE7\u7EED");
      let s = await K(),
        e = !1;
      if (s)
        try {
          await chrome.tabs
            .sendMessage(s, { action: S.CS_RESUME })
            .catch(() => {}),
            (e = !0);
        } catch {}
      return (M = C.RUNNING), e || kt(), { state: M };
    },
    [S.CMD_STOP]: async () => {
      ie.clearFailedTasks(),
        await chrome.storage.session
          .remove("schedulerAutoStarted")
          .catch(() => {}),
        y("[SW] \u6267\u884C\u505C\u6B62");
      let s = await K();
      return (
        s &&
          (await chrome.tabs
            .sendMessage(s, { action: S.CS_STOP })
            .catch(() => {}),
          await k(s)),
        (M = C.IDLE),
        kt(),
        y("[SW] \u5DF2\u505C\u6B62"),
        { state: M }
      );
    },
    [S.CMD_GET_STATUS]: async () => ({ state: M }),
    [S.CMD_GET_DEV_QUEUE]: async () => {
      let s = await K();
      if (!s)
        return {
          queues: [],
          histories: [],
          running: !1,
          error: "\u65E0\u6D3B\u8DC3\u6807\u7B7E\u9875",
        };
      try {
        return await chrome.tabs.sendMessage(s, { action: S.CS_DEV_QUEUE });
      } catch (e) {
        return { queues: [], histories: [], running: !1, error: e.message };
      }
    },
    [S.CMD_GET_DEV_STATUS]: async () => {
      let s = await K().catch(() => null);
      return {
        state: M,
        statusText:
          M === C.RUNNING
            ? "\u8FD0\u884C\u4E2D"
            : M === C.PAUSED
              ? "\u5DF2\u6682\u505C"
              : "\u5DF2\u505C\u6B62",
        mqttHook: "\u7531 inject-hook.js (MAIN world) \u81EA\u52A8\u6CE8\u5165",
        queueInfo: s
          ? `\u6807\u7B7E\u9875 ${s} \u901A\u4FE1\u6B63\u5E38`
          : "\u65E0\u6D3B\u8DC3\u6807\u7B7E\u9875",
        activeTabId: s || "\u65E0",
      };
    },
    [S.CMD_GET_RECORDS]: async (s) => {
      let e = await fi(s?.page || 1, s?.pageSize || 20);
      return {
        records: e.records.map((t) => ({
          name: t.name,
          positionName: t.positionName || "",
          goalResults: t.goalResults || {},
          completeTime: an(t.completeTime),
        })),
        total: e.total,
        page: e.page,
      };
    },
    [S.CMD_EXPORT_RECORDS]: async () => {
      let s = await yi();
      return {
        csv: Lc(s),
        filename: `\u6C9F\u901A\u8BB0\u5F55_${new Date().toISOString().slice(0, 10)}.csv`,
      };
    },
    [S.CMD_TEST_LLM_CHAT]: async (s) =>
      await Qn(s.config, s.messages, {
        goalConfigs: s.goalConfigs || [],
        achievedMap: s.achievedMap || {},
        knowledgeBase: s.knowledgeBase || "",
        positionKnowledgeBase: s.positionKnowledgeBase || "",
      }),
    [S.CLEAR_SESSION_GOALS]: async (s) => {
      let e = s?.uid;
      if (!e) throw new Error("\u7F3A\u5C11 UID");
      y("[SW] \u6E05\u7A7A\u4F1A\u8BDD\u76EE\u6807: uid=", e);
      let t = `${R.SESSION_GOALS_PREFIX}${e}`;
      await chrome.storage.local.remove(t);
      let r = await K().catch(() => null);
      if (r)
        try {
          await chrome.tabs.sendMessage(r, {
            action: S.CS_CLEAR_SESSION_GOALS,
            data: { uid: e },
          });
        } catch (n) {
          Ie(
            "[SW] \u901A\u77E5 CS \u6E05\u7A7A\u4F1A\u8BDD\u76EE\u6807\u5931\u8D25:",
            n.message,
          );
        }
      return { ok: !0, uid: e };
    },
    [S.CMD_SAVE_CONFIG]: async (s) => {
      if (
        (y("[SW] \u4FDD\u5B58\u914D\u7F6E:", Object.keys(s)),
        !s || typeof s != "object")
      )
        throw new Error("\u914D\u7F6E\u6570\u636E\u65E0\u6548");
      await chrome.storage.local.set(s),
        y("[SW] \u914D\u7F6E\u5DF2\u4FDD\u5B58, keys:", Object.keys(s));
      let e = await K().catch(() => null);
      return (
        e &&
          chrome.tabs
            .sendMessage(e, { action: S.CS_CONFIG_UPDATED })
            .catch(() => {}),
        { ok: !0, keys: Object.keys(s) }
      );
    },
    [S.CMD_REFRESH_SCHEDULER]: async () => (await ie.refresh(), { ok: !0 }),
    [S.CMD_GET_SCHEDULER_STATUS]: async () => ie.getStatus(),
    [S.CMD_REFRESH_GREETING_SCHEDULER]: async () => (
      await oe.refresh(), { ok: !0 }
    ),
    [S.CMD_GET_GREETING_SCHEDULER_STATUS]: async () => oe.getStatus(),
    [S.CMD_GET_GREETING_RECORDS]: async (s) => {
      let e = await _i(s?.page || 1, s?.pageSize || 20);
      return {
        records: e.records.map((t) => ({
          name: t.name,
          jobName: t.jobName || "",
          positionName: t.positionName || "",
          matchedKeywords: t.matchedKeywords || [],
          completeTime: an(t.greetTime),
        })),
        total: e.total,
        page: e.page,
      };
    },
    [S.CMD_EXPORT_GREETING_RECORDS]: async () => {
      let s = await gi();
      return {
        csv: Dc(s),
        filename: `\u6253\u62DB\u547C\u8BB0\u5F55_${new Date().toISOString().slice(0, 10)}.csv`,
      };
    },
    [S.CMD_START_GREETING]: async () => {
      await requireActiveSubscriptionOnline();
      await requireCurrentPrivacyConsent();
      await requireRecentAutomationApproval("greetingAutomationApproval");
      y("[SW] \u542F\u52A8\u6253\u62DB\u547C..."),
        await chrome.storage.session
          .remove("greetingSchedulerAutoStarted")
          .catch(() => {});
      let s = /\/web\/(?:chat\/|geek\/)recommend/i,
        e = [/\/web\/chat/i, /\/web\/geek\/recommend/i],
        r = (await chrome.tabs.query({ active: !0, currentWindow: !0 }))[0];
      if (!r)
        throw new Error("\u672A\u627E\u5230\u6D3B\u52A8\u6807\u7B7E\u9875");
      if (!r.url?.includes("zhipin.com"))
        throw new Error(
          "\u8BF7\u5728 BOSS \u76F4\u8058\u63A8\u8350\u9875\u9762\u4E2D\u4F7F\u7528",
        );
      let n = e.some((d) => d.test(r.url)),
        o = s.test(r.url);
      if (n) {
        if (!o) {
          y(
            "[SW] \u5F53\u524D\u9875\u9762\u5728\u804A\u5929\u9875\u9762\uFF0C\u5C1D\u8BD5\u901A\u8FC7 CS_NAVIGATE_RECOMMEND \u5207\u6362\u5230\u63A8\u8350\u9875...",
          ),
            he(
              "greeting",
              "info",
              "\u6B63\u5728\u5207\u6362\u5230\u63A8\u8350\u9875\u9762...",
            );
          try {
            await chrome.tabs.sendMessage(r.id, {
              action: S.CS_NAVIGATE_RECOMMEND,
            }),
              y("[SW] SPA \u5BFC\u822A\u5230\u63A8\u8350\u9875\u5B8C\u6210"),
              he(
                "greeting",
                "info",
                "\u5DF2\u5207\u6362\u5230\u63A8\u8350\u9875\u9762",
              );
          } catch (d) {
            y(
              "[SW] SPA \u5BFC\u822A\u5931\u8D25\uFF0C\u964D\u7EA7\u4E3A\u6574\u9875\u5237\u65B0:",
              d.message,
            ),
              he(
                "greeting",
                "info",
                "SPA \u5BFC\u822A\u5931\u8D25\uFF0C\u6B63\u5728\u5237\u65B0\u9875\u9762...",
              );
            try {
              (r = await chrome.tabs.update(r.id, {
                url: "https://www.zhipin.com/web/geek/recommend",
              })),
                await et(r.id),
                await new Promise((h) => setTimeout(h, 4e3)),
                y(
                  "[SW] \u63A8\u8350\u9875\u9762\uFF08\u6574\u9875\u5237\u65B0\uFF09\u52A0\u8F7D\u5B8C\u6210",
                );
            } catch (h) {
              throw new Error(
                "\u5BFC\u822A\u5230\u63A8\u8350\u9875\u9762\u5931\u8D25: " +
                  h.message,
              );
            }
          }
        }
      } else {
        y(
          "[SW] \u5F53\u524D\u9875\u9762\u4E0D\u5728 content script \u6CE8\u5165\u8303\u56F4\uFF0C\u81EA\u52A8\u5BFC\u822A\u5230\u63A8\u8350\u9875\u9762...",
        ),
          he(
            "greeting",
            "info",
            "\u6B63\u5728\u6253\u5F00\u63A8\u8350\u9875\u9762...",
          );
        try {
          (r = await chrome.tabs.update(r.id, {
            url: "https://www.zhipin.com/web/geek/recommend",
          })),
            await et(r.id),
            await new Promise((d) => setTimeout(d, 4e3)),
            y("[SW] \u63A8\u8350\u9875\u9762\u52A0\u8F7D\u5B8C\u6210"),
            he(
              "greeting",
              "info",
              "\u63A8\u8350\u9875\u9762\u52A0\u8F7D\u5B8C\u6210",
            );
        } catch (d) {
          throw new Error(
            "\u5BFC\u822A\u5230\u63A8\u8350\u9875\u9762\u5931\u8D25: " +
              d.message,
          );
        }
      }
      if (
        (y("[SW] \u6CE8\u518C\u6253\u62DB\u547C\u6807\u7B7E\u9875..."),
        !(await Yr(r.id)))
      )
        throw new Error(
          "\u5DF2\u5728\u5176\u4ED6\u7A97\u53E3\u8FD0\u884C\u4E2D",
        );
      if (
        (y("[SW] \u7B49\u5F85 content script \u5C31\u7EEA..."),
        await on(r.id, 1e4, 1e3))
      ) {
        y(
          "[SW] Content script \u5DF2\u5C31\u7EEA\uFF0C\u53D1\u9001 CS_START_GREETING...",
        );
        try {
          return (
            await chrome.tabs.sendMessage(r.id, {
              action: S.CS_START_GREETING,
              data: {},
            }),
            y("[SW] CS_START_GREETING \u53D1\u9001\u6210\u529F"),
            (z = C.RUNNING),
            oe.clearFailedTasks(),
            { state: z }
          );
        } catch (d) {
          throw (
            (y(
              "[SW] CS_START_GREETING \u53D1\u9001\u5931\u8D25\uFF08CS \u521A\u5C31\u7EEA\u5374\u4E0D\u53EF\u8FBE\uFF09:",
              d.message,
            ),
            await k(r.id),
            new Error(
              "\u5185\u5BB9\u811A\u672C\u54CD\u5E94\u5F02\u5E38: " + d.message,
            ))
          );
        }
      }
      y(
        "[SW] Content script \u672A\u5C31\u7EEA\uFF0C\u5237\u65B0\u9875\u9762\u91CD\u65B0\u6CE8\u5165...",
      ),
        he(
          "greeting",
          "info",
          "\u6B63\u5728\u5237\u65B0\u63A8\u8350\u9875\u9762...",
        );
      try {
        if (
          (await chrome.tabs.reload(r.id),
          await et(r.id),
          await new Promise((h) => setTimeout(h, 4e3)),
          !(await on(r.id, 6e3, 800)))
        )
          throw (
            (await k(r.id),
            new Error(
              "\u5237\u65B0\u540E\u5185\u5BB9\u811A\u672C\u4ECD\u672A\u52A0\u8F7D",
            ))
          );
        return (
          await chrome.tabs.sendMessage(r.id, {
            action: S.CS_START_GREETING,
            data: {},
          }),
          y(
            "[SW] \u5237\u65B0\u540E CS_START_GREETING \u53D1\u9001\u6210\u529F",
          ),
          (z = C.RUNNING),
          oe.clearFailedTasks(),
          { state: z }
        );
      } catch (d) {
        throw (
          (await k(r.id),
          new Error(
            "\u5BFC\u822A\u5230\u63A8\u8350\u9875\u9762\u5931\u8D25: " +
              d.message,
          ))
        );
      }
    },
    [S.CMD_PAUSE_GREETING]: async () => {
      y("[SW] \u6682\u505C\u6253\u62DB\u547C");
      let s = await K(),
        e = !1;
      if (s)
        try {
          await chrome.tabs
            .sendMessage(s, { action: S.CS_PAUSE_GREETING })
            .catch(() => {}),
            (e = !0);
        } catch {}
      return (z = C.PAUSED), e || tt(), { state: z };
    },
    [S.CMD_RESUME_GREETING]: async () => {
      await requireActiveSubscriptionOnline();
      y("[SW] \u6062\u590D\u6253\u62DB\u547C");
      let s = await K(),
        e = !1;
      if (s)
        try {
          await chrome.tabs
            .sendMessage(s, { action: S.CS_RESUME_GREETING })
            .catch(() => {}),
            (e = !0);
        } catch {}
      return (z = C.RUNNING), e || tt(), { state: z };
    },
    [S.CMD_STOP_GREETING]: async () => {
      oe.clearFailedTasks(),
        await chrome.storage.session
          .remove("greetingSchedulerAutoStarted")
          .catch(() => {}),
        y("[SW] \u505C\u6B62\u6253\u62DB\u547C");
      let s = await K();
      return (
        s &&
          (await chrome.tabs
            .sendMessage(s, { action: S.CS_STOP_GREETING })
            .catch(() => {}),
          await k(s)),
        (z = C.IDLE),
        tt(),
        { state: z }
      );
    },
    [S.CMD_SKIP_GREETING_JOB]: async () => {
      y(
        "[SW] \u5207\u6362\u6253\u62DB\u547C\u5230\u4E0B\u4E00\u4E2A\u5C97\u4F4D",
      );
      let s = await K();
      if (s)
        try {
          return (
            await chrome.tabs.sendMessage(s, {
              action: S.CS_SKIP_GREETING_JOB,
            }),
            { ok: !0 }
          );
        } catch (e) {
          throw new Error(
            "\u5185\u5BB9\u811A\u672C\u4E0D\u53EF\u8FBE: " + e.message,
          );
        }
      throw new Error("\u672A\u627E\u5230\u6D3B\u8DC3\u6807\u7B7E\u9875");
    },
    [S.CMD_DEBUG_SCROLL_TEST]: async () => {
      y("[SW] \u6267\u884C\u6EDA\u52A8\u6D4B\u8BD5");
      let e = (
        await chrome.tabs
          .query({ active: !0, currentWindow: !0 })
          .catch(() => [])
      )?.[0];
      if (!e || !e.id)
        throw new Error(
          "\u672A\u627E\u5230\u6D3B\u8DC3\u6807\u7B7E\u9875\uFF0C\u8BF7\u5148\u6253\u5F00 BOSS \u76F4\u8058\u63A8\u8350\u9875\u9762",
        );
      try {
        let t = await chrome.tabs.sendMessage(e.id, {
          action: S.CS_DEBUG_SCROLL_TEST,
        });
        return (
          y("[SW] \u6EDA\u52A8\u6D4B\u8BD5\u7ED3\u679C:", JSON.stringify(t)), t
        );
      } catch (t) {
        throw new Error(
          "\u5185\u5BB9\u811A\u672C\u4E0D\u53EF\u8FBE\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5: " +
            t.message,
        );
      }
    },
    [S.CMD_DEBUG_INSPECT_GREET]: async () => {
      y("[SW] 执行打招呼结构诊断");
      let e = (
        await chrome.tabs
          .query({ active: !0, currentWindow: !0 })
          .catch(() => [])
      )?.[0];
      if (!e || !e.id)
        throw new Error("未找到活跃标签页，请先打开 BOSS 直聘推荐页面");
      try {
        return await chrome.tabs.sendMessage(e.id, {
          action: S.CS_DEBUG_INSPECT_GREET,
        });
      } catch (t) {
        throw new Error("内容脚本不可达，请刷新页面后重试: " + t.message);
      }
    },
    [S.CMD_DEBUG_SCROLL_NOW]: async () => {
      y("[SW] \u6267\u884C\u624B\u52A8\u6EDA\u52A8\u6D4B\u8BD5");
      let e = (
        await chrome.tabs
          .query({ active: !0, currentWindow: !0 })
          .catch(() => [])
      )?.[0];
      if (!e || !e.id)
        throw new Error(
          "\u672A\u627E\u5230\u6D3B\u8DC3\u6807\u7B7E\u9875\uFF0C\u8BF7\u5148\u6253\u5F00 BOSS \u76F4\u8058\u63A8\u8350\u9875\u9762",
        );
      try {
        let t = await chrome.tabs.sendMessage(e.id, {
          action: S.CS_DEBUG_SCROLL_NOW,
        });
        return (
          y(
            "[SW] \u624B\u52A8\u6EDA\u52A8\u6D4B\u8BD5\u7ED3\u679C:",
            JSON.stringify(t),
          ),
          t
        );
      } catch (t) {
        throw new Error(
          "\u5185\u5BB9\u811A\u672C\u4E0D\u53EF\u8FBE\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5: " +
            t.message,
        );
      }
    },
    [S.CMD_GET_GREETING_STATUS]: async () => ({ state: z }),
    [S.CMD_PROFILE_SEND_CODE]: async (s) => (
      await requireCurrentPrivacyConsent(), await Ai(s.email)
    ),
    [S.CMD_PROFILE_LOGIN]: async (s) => {
      await requireCurrentPrivacyConsent();
      let e;
      try {
        e = await Si(s.email, s.code, s.forceLogin === !0);
      } catch (t) {
        if (t.code === "LOGIN_CONFLICT")
          return { loginConflict: !0, message: t.detail || "账号已在其他设备登录" };
        throw t;
      }
      let
        t = e.tokens?.access_token || e.access_token,
        r = null;
      try {
        await heartbeatRequest(t);
        let n = await As(t);
        r = tn(n);
      } catch (n) {
        console.warn(
          "[SW] \u767B\u5F55\u540E\u83B7\u53D6\u8BA2\u9605\u4FE1\u606F\u5931\u8D25:",
          n.message,
        );
      }
      let settingsSync = null;
      try {
        settingsSync = await syncCloudSettingsForLogin(t, e.user || {});
      } catch (n) {
        console.warn("[CloudSettings] 登录后同步失败:", n.message);
        await isolateCloudSettingsAfterFailedSwitch(e.user?.id).catch(() => {});
        settingsSync = { ok: !1, message: n.message || "云端配置同步失败" };
      }
      return {
        user: e.user || {},
        session: e.session || null,
        tokens: e.tokens || {},
        subscription: r,
        settingsSync,
      };
    },
    [S.CMD_PROFILE_LOGOUT]: async () => {
      await stopAllAutomations("用户主动退出", !1);
      let e =
        (await chrome.storage.local.get(R.PROFILE_AUTH))[R.PROFILE_AUTH] || {};
      await pushCloudSettingsNow().catch(() => {});
      if (e.accessToken)
        try {
          await Ii(e.accessToken);
        } catch {}
      return (
        await chrome.storage.local.remove([
          R.PROFILE_AUTH,
          R.PROFILE_SUBSCRIPTION,
        ]),
        { ok: !0 }
      );
    },
    [S.CMD_PROFILE_GET_STATE]: async () => {
      let s = await chrome.storage.local.get([
        R.PROFILE_AUTH,
        R.PROFILE_SUBSCRIPTION,
      ]);
      let a = s[R.PROFILE_AUTH];
      return {
        auth: a
          ? {
              isLoggedIn: !!a.isLoggedIn,
              email: a.email || "",
              accessToken: !!a.accessToken,
            }
          : null,
        subscription: s[R.PROFILE_SUBSCRIPTION] || null,
      };
    },
    [S.CMD_PROFILE_SYNC_SUBSCRIPTION]: async () => {
      let s = await rn(As),
        e = tn(s);
      return await chrome.storage.local.set({ [R.PROFILE_SUBSCRIPTION]: e }), e;
    },
    [S.CMD_PROFILE_SYNC_SETTINGS]: async () => {
      await requireCurrentPrivacyConsent();
      let auth = (
          await chrome.storage.local.get(R.PROFILE_AUTH)
        )[R.PROFILE_AUTH] || {},
        profile = await rn(As);
      return await syncCloudSettingsForLogin(auth.accessToken, profile);
    },
    [S.CMD_PROFILE_GET_PRODUCTS]: async () => await bi(),
    [S.CMD_PROFILE_SUBSCRIBE]: async () => {
      throw new Error("自助开通已关闭，请联系客服开通套餐");
    },
    [S.CMD_WHOBOT_STATUS]: async () => await rn(whobotStatusRequest),
    [S.CMD_WHOBOT_SUBMIT]: async (s) => {
      await requireCurrentPrivacyConsent();
      await requireActiveSubscriptionOnline();
      return await rn(whobotSubmitRequest, s);
    },
    [S.CMD_WHOBOT_RECORDS]: async () => await rn(whobotRecordsRequest),
    [S.CMD_VALIDATE_SUBSCRIPTION]: async () => {
      try {
        let s = await rn(As),
          e = tn(s);
        await chrome.storage.local.set({ [R.PROFILE_SUBSCRIPTION]: e });
        let t = new Date(),
          r = e.expireDate ? t > new Date(e.expireDate) : !1;
        return !e.isVip || r
          ? {
              valid: !1,
              reason: "subscription_expired",
              message:
                "\u8BA2\u9605\u5DF2\u5230\u671F\uFF0C\u8BF7\u5230\u4E2A\u4EBA\u4E2D\u5FC3\u7EED\u8D39",
              subscription: e,
            }
          : { valid: !0, subscription: e };
      } catch (s) {
        if (s.message === "\u672A\u767B\u5F55")
          return {
            valid: !1,
            reason: "not_logged_in",
            message: "\u8BF7\u5148\u767B\u5F55\u4E2A\u4EBA\u4E2D\u5FC3",
          };
        if (s.message && s.message.includes("\u767B\u5F55\u5DF2\u8FC7\u671F"))
          return { valid: !1, reason: "token_expired", message: s.message };
        y("[SW] 验证订阅时网络异常，禁止离线继续:", s.message);
        return {
          valid: !1,
          reason: "network_error",
          message:
            "\u7F51\u7EDC\u5F02\u5E38\uFF0C\u65E0\u6CD5\u9A8C\u8BC1\u8BA2\u9605\u72B6\u6001\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5",
        };
      }
    },
  },
  vc = {
    [S.CMD_VALIDATE_SUBSCRIPTION]: async () =>
      await cn[S.CMD_VALIDATE_SUBSCRIPTION](),
    [S.STATUS_REPORT]: async (s, e) => (
      y("[SW] CS \u72B6\u6001\u62A5\u544A:", s.state, s.statusText || ""),
      (M = s.state),
      (Ot = s.statusText || ""),
      kt(),
      s.state === C.IDLE &&
        ie.lastAutoStartTaskId &&
        (await ie._getAutoStarted().catch(() => !1)) &&
        (console.warn(
          `[SW] [\u8C03\u5EA6\u5668] \u81EA\u52A8\u542F\u52A8\u7684\u4EFB\u52A1\u8FD0\u884C\u4E2D\u72B6\u6001\u53D8\u4E3A IDLE\uFF0C\u672C\u8F6E\u4E0D\u518D\u91CD\u8BD5: ${s.statusText || "\u672A\u77E5\u539F\u56E0"}`,
        ),
        (ie._failedTaskIdsInCycle[ie.lastAutoStartTaskId] =
          s.statusText || "\u8FD0\u884C\u4E2D\u72B6\u6001\u53D8\u4E3A IDLE"),
        await ie._persistFailedTasks().catch(() => {})),
      { ok: !0 }
    ),
    [S.SESSION_GOAL_ACHIEVED]: async (s) => {
      y("[SW] \u76EE\u6807\u8FBE\u6210:", s.uid, s.goalKey, s.value);
      let e = `${R.SESSION_GOALS_PREFIX}${s.uid}`,
        t = (await chrome.storage.local.get(e))[e] || {};
      return (
        (t[s.goalKey] = s.value),
        await chrome.storage.local.set({ [e]: t }),
        { ok: !0 }
      );
    },
    [S.NEW_RECORD]: async (s) => {
      if ((y("[SW] CS \u65B0\u8BB0\u5F55:", s.name), await mi(s), q))
        try {
          q.postMessage({ action: "records-updated" });
        } catch (e) {
          Ie(
            "[SW] \u901A\u77E5\u4FA7\u8FB9\u680F\u5237\u65B0\u8BB0\u5F55\u5931\u8D25:",
            e.message,
          );
        }
      return { ok: !0 };
    },
    [S.REQ_LLM_CALL]: async (s) => (
      y(
        "[SW] CS \u8BF7\u6C42 LLM \u8C03\u7528, \u6D88\u606F\u6570:",
        s.messages?.length,
      ),
      await Qn(s.config, s.messages, {
        goalConfigs: s.goalConfigs || [],
        achievedMap: s.achievedMap || {},
        knowledgeBase: s.knowledgeBase || "",
        positionKnowledgeBase: s.positionKnowledgeBase || "",
      })
    ),
    [S.GREETING_STATUS_REPORT]: async (s) => (
      y(
        "[SW] \u6253\u62DB\u547C\u72B6\u6001\u62A5\u544A:",
        s.state,
        s.statusText || "",
      ),
      (z = s.state),
      (sn = s.statusText || ""),
      tt(),
      s.state === C.IDLE &&
        oe.lastAutoStartTaskId &&
        (await oe._getAutoStarted().catch(() => !1)) &&
        (console.warn(
          `[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u81EA\u52A8\u542F\u52A8\u7684\u4EFB\u52A1\u8FD0\u884C\u4E2D\u72B6\u6001\u53D8\u4E3A IDLE\uFF0C\u672C\u8F6E\u4E0D\u518D\u91CD\u8BD5: ${s.statusText || "\u672A\u77E5\u539F\u56E0"}`,
        ),
        (oe._failedTaskIdsInCycle[oe.lastAutoStartTaskId] =
          s.statusText || "\u8FD0\u884C\u4E2D\u72B6\u6001\u53D8\u4E3A IDLE"),
        await oe._persistFailedTasks().catch(() => {})),
      { ok: !0 }
    ),
    [S.NEW_GREETING_RECORD]: async (s) => {
      if (
        (y("[SW] CS \u65B0\u6253\u62DB\u547C\u8BB0\u5F55:", s.name),
        await pi(s),
        q)
      )
        try {
          q.postMessage({ action: "greeting-records-updated" });
        } catch (e) {
          Ie(
            "[SW] \u901A\u77E5\u4FA7\u8FB9\u680F\u5237\u65B0\u6253\u62DB\u547C\u8BB0\u5F55\u5931\u8D25:",
            e.message,
          );
        }
      return { ok: !0 };
    },
  };
async function nn(s, e, t, r) {
  let n = null;
  for (let o = 1; o <= t; o++)
    try {
      let i = await chrome.tabs.sendMessage(s, { action: S.CS_START, data: e });
      return i && i.error
        ? (y(
            "[SW] CS_START \u9A8C\u8BC1\u9519\u8BEF (\u5C1D\u8BD5 " +
              o +
              "/" +
              t +
              "): " +
              i.error,
          ),
          new Error(i.error))
        : (y(
            "[SW] CS_START \u53D1\u9001\u6210\u529F (\u5C1D\u8BD5 " +
              o +
              "/" +
              t +
              ")",
          ),
          null);
    } catch (i) {
      (n = i),
        o < t &&
          (y(
            "[SW] CS_START \u53D1\u9001\u5931\u8D25\uFF0C" +
              o +
              "/" +
              t +
              " \u6B21\u91CD\u8BD5\u4E2D... (" +
              i.message +
              ")",
          ),
          await new Promise((c) => setTimeout(c, r)));
    }
  return n;
}
function et(s) {
  return new Promise((e) => {
    let t = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(r),
          Ie(
            "[SW] \u7B49\u5F85\u9875\u9762\u52A0\u8F7D\u8D85\u65F6\uFF0C\u7EE7\u7EED\u540E\u7EED\u903B\u8F91...",
          ),
          e();
      }, 15e3),
      r = (n, o) => {
        n === s &&
          o.status === "complete" &&
          (clearTimeout(t), chrome.tabs.onUpdated.removeListener(r), e());
      };
    chrome.tabs.onUpdated.addListener(r);
  });
}
async function on(s, e = 1e4, t = 1e3) {
  let r = Date.now();
  for (; Date.now() - r < e; ) {
    try {
      if (await chrome.tabs.sendMessage(s, { action: S.CS_GET_STATE }))
        return (
          y(
            `[SW] Content script \u5DF2\u5C31\u7EEA (\u7B49\u5F85 ${Date.now() - r}ms)`,
          ),
          !0
        );
    } catch {}
    await new Promise((n) => setTimeout(n, t));
  }
  return y(`[SW] Content script \u672A\u5C31\u7EEA (\u8D85\u65F6 ${e}ms)`), !1;
}
async function Pi() {
  let s = await chrome.storage.local.get(null);
  return Nc(s);
}
function Nc(s) {
  return {
    modelConfig: s[R.MODEL_CONFIG] || un.modelConfig,
    timeConfig: s[R.TIME_CONFIG] || un.timeConfig,
    goalConfigs: s[R.GOAL_CONFIGS] || [],
    goalReplyTemplates: s[R.GOAL_REPLY_TEMPLATES] || {},
    replyPositionConfigs: s[R.REPLY_POSITION_CONFIGS] || [],
    generalKnowledgeBase: s[R.GENERAL_KNOWLEDGE_BASE] || "",
  };
}
function he(s, e, t) {
  if (q)
    try {
      q.postMessage({
        action: S.RUNNING_LOG,
        data: {
          taskType: s || "reply",
          level: e || "info",
          message: t,
          time: Date.now(),
        },
      });
    } catch {}
}
function kt() {
  if (q)
    try {
      q.postMessage({
        action: S.STATUS_UPDATE,
        data: { state: M, statusText: Ot, taskType: "reply" },
      }),
        y("[SW] \u5E7F\u64AD\u81EA\u52A8\u56DE\u590D\u72B6\u6001:", M, Ot);
    } catch (s) {
      Ie(
        "[SW] \u5E7F\u64AD\u81EA\u52A8\u56DE\u590D\u72B6\u6001\u5931\u8D25:",
        s.message,
      );
    }
}
function tt() {
  if (q)
    try {
      q.postMessage({
        action: S.STATUS_UPDATE,
        data: { state: z, statusText: sn, taskType: "greeting" },
      }),
        y("[SW] \u5E7F\u64AD\u6253\u62DB\u547C\u72B6\u6001:", z, sn);
    } catch (s) {
      Ie(
        "[SW] \u5E7F\u64AD\u6253\u62DB\u547C\u72B6\u6001\u5931\u8D25:",
        s.message,
      );
    }
}
function an(s) {
  if (!s) return "";
  let e = new Date(s),
    t = (r) => String(r).padStart(2, "0");
  return `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())} ${t(e.getHours())}:${t(e.getMinutes())}:${t(e.getSeconds())}`;
}
function Lc(s) {
  if (s.length === 0)
    return "\u59D3\u540D,\u5C97\u4F4D,\u6C9F\u901A\u7ED3\u679C,\u6C9F\u901A\u65F6\u95F4";
  let e = new Set();
  for (let i of s)
    i.goalResults && Object.keys(i.goalResults).forEach((c) => e.add(c));
  let t = Array.from(e).sort(),
    r = ["\u59D3\u540D", "\u5C97\u4F4D"];
  t.forEach((i) => r.push(i)), r.push("\u6C9F\u901A\u65F6\u95F4");
  let n = r.join(","),
    o = s.map((i) => {
      let c = [
        `"${(i.name || "\u672A\u77E5").replace(/"/g, '""')}"`,
        `"${(i.positionName || "").replace(/"/g, '""')}"`,
      ];
      return (
        t.forEach((d) => {
          c.push(`"${(i.goalResults?.[d] || "-").replace(/"/g, '""')}"`);
        }),
        c.push(`"${an(i.completeTime)}"`),
        c.join(",")
      );
    });
  return [n, ...o].join(`
`);
}
function Dc(s) {
  if (s.length === 0)
    return "\u59D3\u540D,\u5C97\u4F4D,\u5339\u914D\u5173\u952E\u8BCD,\u6253\u62DB\u547C\u65F6\u95F4";
  let e =
      "\u59D3\u540D,\u5C97\u4F4D,\u5339\u914D\u5173\u952E\u8BCD,\u6253\u62DB\u547C\u65F6\u95F4",
    t = s.map((r) => {
      let n = (r.matchedKeywords || []).join("; ");
      return [
        `"${(r.name || "\u672A\u77E5").replace(/"/g, '""')}"`,
        `"${(r.jobName || "").replace(/"/g, '""')}"`,
        `"${n.replace(/"/g, '""')}"`,
        `"${an(r.greetTime)}"`,
      ].join(",");
    });
  return [e, ...t].join(`
`);
}
async function Mc() {
  try {
    let s = await chrome.tabs.query({
      url: ["https://www.zhipin.com/web/chat*", "https://zhipin.com/web/chat*"],
    });
    if (s && s.length > 0) {
      let e = s[0];
      console.log(
        "[SW] [\u8C03\u5EA6\u5668] \u4F7F\u7528\u5DF2\u6709\u804A\u5929\u6807\u7B7E\u9875:",
        e.id,
        e.url,
      );
      try {
        await chrome.tabs.update(e.id, { active: !0 });
      } catch (t) {
        console.warn(
          "[SW] [\u8C03\u5EA6\u5668] \u6FC0\u6D3B\u6807\u7B7E\u9875\u5931\u8D25:",
          t.message,
        );
      }
      return e;
    }
    console.log(
      "[SW] [\u8C03\u5EA6\u5668] \u672A\u627E\u5230\u5DF2\u6709\u804A\u5929\u6807\u7B7E\u9875\uFF0C\u51C6\u5907\u521B\u5EFA\u65B0\u6807\u7B7E\u9875",
    );
  } catch (s) {
    console.warn(
      "[SW] [\u8C03\u5EA6\u5668] \u67E5\u8BE2\u6807\u7B7E\u9875\u5931\u8D25:",
      s.message,
    );
  }
  try {
    console.log(
      "[SW] [\u8C03\u5EA6\u5668] \u521B\u5EFA\u65B0\u804A\u5929\u6807\u7B7E\u9875...",
    );
    let s = await chrome.tabs.create({
      url: "https://www.zhipin.com/web/chat",
      active: !0,
    });
    return (
      console.log(
        "[SW] [\u8C03\u5EA6\u5668] \u65B0\u6807\u7B7E\u9875\u5DF2\u521B\u5EFA, id:",
        s.id,
      ),
      await et(s.id),
      console.log(
        "[SW] [\u8C03\u5EA6\u5668] \u65B0\u6807\u7B7E\u9875\u52A0\u8F7D\u5B8C\u6210",
      ),
      s
    );
  } catch (s) {
    return (
      console.warn(
        "[SW] [\u8C03\u5EA6\u5668] \u521B\u5EFA\u804A\u5929\u6807\u7B7E\u9875\u5931\u8D25:",
        s.message,
      ),
      null
    );
  }
}
async function Gc(s) {
  console.log(
    "[SW] [\u8C03\u5EA6\u5668] ===== \u81EA\u52A8\u542F\u52A8\u56DE\u8C03\u5F00\u59CB =====",
    s.name,
  );
  // \u4E00\u952E\u8054\u52A8\uFF08\u7F16\u6392\u5FAA\u73AF\uFF09\u8FD0\u884C\u671F\u95F4\uFF0C\u672C\u8C03\u5EA6\u5668\u6302\u8D77\uFF0C\u907F\u514D\u62A2\u6807\u7B7E\u9875
  const __wfStart = await unifiedWorkflow.handlers["cmd_get_unified_workflow_status"]().catch(() => null);
  if (__wfStart && __wfStart.state && __wfStart.state !== "idle") {
    console.log("[SW] [\u8C03\u5EA6\u5668] \u4E00\u952E\u8054\u52A8\u8FD0\u884C\u4E2D\uFF08state=" + __wfStart.state + "\uFF09\uFF0C\u8DF3\u8FC7\u672C\u6B21\u5B9A\u65F6\u542F\u52A8");
    return;
  }
  if (!(await hasCurrentPrivacyConsent())) {
    console.warn(
      "[SW] [\u8C03\u5EA6\u5668] \u672A\u786E\u8BA4\u6700\u65B0\u9690\u79C1\u653F\u7B56\uFF0C\u8DF3\u8FC7\u81EA\u52A8\u542F\u52A8",
    ),
      he(
        "reply",
        "warn",
        "\u5B9A\u65F6\u4EFB\u52A1\u672A\u542F\u52A8\uFF1A\u8BF7\u5148\u5230\u4E2A\u4EBA\u4E2D\u5FC3\u540C\u610F\u6700\u65B0\u9690\u79C1\u653F\u7B56",
      );
    return;
  }
  if (!hasScheduledTaskApproval(s)) {
    console.warn(
      "[SW] [\u8C03\u5EA6\u5668] \u5B9A\u65F6\u4EFB\u52A1\u672A\u5BA1\u6838\u81EA\u52A8\u5316\u8303\u56F4\uFF0C\u8DF3\u8FC7\u81EA\u52A8\u542F\u52A8",
    ),
      he(
        "reply",
        "warn",
        "\u5B9A\u65F6\u4EFB\u52A1\u672A\u542F\u52A8\uFF1A\u8BF7\u7F16\u8F91\u4EFB\u52A1\u5E76\u91CD\u65B0\u786E\u8BA4\u5C97\u4F4D\u3001\u8BDD\u672F\u548C\u5019\u9009\u4EBA\u8303\u56F4",
      );
    return;
  }
  let e = await K().catch(() => null);
  if (e)
    try {
      let _ = await chrome.tabs.get(e);
      if (_ && _.url?.includes("zhipin.com/web/chat")) {
        let f = await chrome.tabs.sendMessage(e, { action: S.CS_GET_STATE });
        if (f && f.state && f.state !== C.IDLE) {
          console.log(
            "[SW] [\u8C03\u5EA6\u5668] \u5185\u5BB9\u811A\u672C\u5DF2\u5728\u8FD0\u884C\u4E2D\uFF0C\u8DF3\u8FC7\u81EA\u52A8\u542F\u52A8",
          ),
            (M = f.state),
            kt();
          return;
        }
      }
    } catch (_) {
      console.log(
        "[SW] [\u8C03\u5EA6\u5668] \u65E7\u5185\u5BB9\u811A\u672C\u672A\u54CD\u5E94\uFF0C\u6E05\u7406\u540E\u91CD\u65B0\u542F\u52A8:",
        _.message,
      ),
        await k(e).catch(() => {});
      try {
        let f = await chrome.tabs.get(e);
        if (
          f &&
          f.url &&
          f.url.includes("zhipin.com") &&
          !f.url.includes("/web/chat")
        ) {
          console.warn(
            `[SW] [\u8C03\u5EA6\u5668] \u5DF2\u6709\u6807\u7B7E\u9875(${f.id})\u5DF2\u88AB\u91CD\u5B9A\u5411\uFF0C\u672C\u8F6E\u4E0D\u518D\u91CD\u8BD5: ${f.url}`,
          ),
            he(
              "reply",
              "warn",
              `\u5B9A\u65F6\u4EFB\u52A1\u542F\u52A8\u5931\u8D25\uFF1A\u804A\u5929\u6807\u7B7E\u9875\u5DF2\u88AB\u91CD\u5B9A\u5411\uFF08${f.url}\uFF09`,
            ),
            (ie._failedTaskIdsInCycle[s.id] =
              `\u804A\u5929\u6807\u7B7E\u9875\u88AB\u91CD\u5B9A\u5411\u5230 ${f.url}`),
            await ie._persistFailedTasks();
          return;
        }
      } catch {}
    }
  console.log(
    "[SW] [\u8C03\u5EA6\u5668] \u9A8C\u8BC1\u767B\u5F55\u548C\u8BA2\u9605\u72B6\u6001...",
  );
  let t = await cn[S.CMD_VALIDATE_SUBSCRIPTION]();
  if (!t.valid) {
    console.warn(
      "[SW] [\u8C03\u5EA6\u5668] \u8BA2\u9605\u9A8C\u8BC1\u5931\u8D25\uFF0C\u81EA\u52A8\u542F\u52A8\u5DF2\u8DF3\u8FC7:",
      t.message,
    ),
      he(
        "reply",
        "warn",
        `\u5B9A\u65F6\u4EFB\u52A1\u542F\u52A8\u5931\u8D25\uFF1A${t.message}`,
      );
    return;
  }
  t.degraded &&
    console.log(
      "[SW] [\u8C03\u5EA6\u5668] \u8BA2\u9605\u9A8C\u8BC1\u964D\u7EA7\uFF08\u4F7F\u7528\u672C\u5730\u7F13\u5B58\uFF09\uFF0C\u7EE7\u7EED\u81EA\u52A8\u542F\u52A8",
    ),
    console.log(
      "[SW] [\u8C03\u5EA6\u5668] \u67E5\u627E/\u521B\u5EFA\u804A\u5929\u6807\u7B7E\u9875...",
    );
  let r = await Mc();
  if (!r) {
    console.warn(
      "[SW] [\u8C03\u5EA6\u5668] \u65E0\u6CD5\u627E\u5230\u6216\u521B\u5EFA\u804A\u5929\u6807\u7B7E\u9875\uFF0C\u81EA\u52A8\u542F\u52A8\u5931\u8D25",
    );
    return;
  }
  if (
    (console.log(
      "[SW] [\u8C03\u5EA6\u5668] \u4F7F\u7528\u6807\u7B7E\u9875:",
      r.id,
      r.url,
    ),
    !(await Yr(r.id)))
  ) {
    console.log(
      "[SW] [\u8C03\u5EA6\u5668] \u6807\u7B7E\u9875\u6CE8\u518C\u5931\u8D25\uFF0C\u5176\u4ED6\u6807\u7B7E\u9875\u53EF\u80FD\u6B63\u5728\u8FD0\u884C",
    );
    return;
  }
  let o = await Pi();
  console.log(
    "[SW] [\u8C03\u5EA6\u5668] \u914D\u7F6E\u5DF2\u52A0\u8F7D\uFF08\u5927\u6A21\u578B\u6258\u7BA1\u6A21\u5F0F\uFF09",
  );
  let scopeCfg = await chrome.storage.local.get([
      R.REPLY_POSITION_CONFIGS,
      R.JOB_CONFIGS,
    ]),
    scope2 = resolveReplyScope(
      scopeCfg[R.JOB_CONFIGS],
      scopeCfg[R.REPLY_POSITION_CONFIGS],
    ),
    d = scope2.entries,
    replyStandby = scope2.mode === "none";
  let replyAllPositions = scope2.mode === "all",
    h = replyAllPositions ? !0 : d.some((_) => _.aiReply !== !1),
    g = replyAllPositions ? !0 : d.some((_) => _.keywordReply !== !1);
  replyStandby
    ? (console.warn(
        "[SW] [\u8C03\u5EA6\u5668] \u5F85\u673A\u6A21\u5F0F\uFF1A\u6240\u6709\u5C97\u4F4D\u914D\u7F6E\u5747\u5DF2\u5173\u95ED\uFF0C\u56DE\u590D\u5F15\u64CE\u4E0D\u5904\u7406\u4EFB\u4F55\u5C97\u4F4D",
      ),
      he(
        "reply",
        "warn",
        "\u26A0\uFE0F \u6240\u6709\u5C97\u4F4D\u914D\u7F6E\u5747\u5DF2\u5173\u95ED\uFF0C\u56DE\u590D\u5F15\u64CE\u5C06\u5F85\u673A\uFF08\u4E0D\u5904\u7406\u4EFB\u4F55\u5C97\u4F4D\uFF09",
      ))
    : replyAllPositions
    ? (console.warn(
        "[SW] [\u8C03\u5EA6\u5668] \u5168\u5C97\u4F4D\u6A21\u5F0F\uFF1A\u6CA1\u6709\u542F\u7528\u7684\u5C97\u4F4D\u914D\u7F6E",
      ),
      he(
        "reply",
        "warn",
        "\u26A0\uFE0F \u5B9A\u65F6\u4EFB\u52A1\u4EE5\u5168\u5C97\u4F4D\u6A21\u5F0F\u542F\u52A8\uFF1A\u5C06\u56DE\u590D BOSS \u6C9F\u901A\u4E2D\u7684\u6240\u6709\u5DF2\u53D1\u5E03\u5C97\u4F4D",
      ))
    : console.log(
        `[SW] [\u8C03\u5EA6\u5668] \u767D\u540D\u5355\u6A21\u5F0F\uFF1A\u5DF2\u542F\u7528 ${d.length} \u4E2A\u5C97\u4F4D`,
      );
  if (
    (console.log(
      "[SW] [\u8C03\u5EA6\u5668] \u5C97\u4F4D\u914D\u7F6E\u68C0\u67E5\u901A\u8FC7:",
      replyAllPositions
        ? "\u5168\u5C97\u4F4D\u6A21\u5F0F"
        : "\u542F\u7528\u4E86" + d.length + "\u4E2A\u5C97\u4F4D",
      "keywordReply=" + g + ", aiReply=" + h,
    ),
    h && (await llmBalanceEmpty()))
  ) {
    console.warn(
      "[SW] [\u8C03\u5EA6\u5668] \u70B9\u6570\u4E0D\u8DB3\uFF0C\u8DF3\u8FC7\u81EA\u52A8\u542F\u52A8\uFF08\u8BF7\u5230\u300C\u5927\u6A21\u578B\uFF08\u6258\u7BA1\uFF09\u300D\u9875\u5145\u503C\uFF09",
    ),
      await k(r.id);
    return;
  }
  console.log(
    "[SW] [\u8C03\u5EA6\u5668] \u53D1\u9001 CS_START \u8FDB\u884C\u914D\u7F6E\u6821\u9A8C...",
  );
  let m = await nn(r.id, o, 3, 2e3);
  if (m) {
    if (m.message.startsWith("\u542F\u52A8\u5931\u8D25\uFF1A")) {
      console.warn(
        "[SW] [\u8C03\u5EA6\u5668] CS_START \u9A8C\u8BC1\u9519\u8BEF:",
        m.message,
      ),
        await k(r.id).catch(() => {});
      return;
    }
    console.log(
      "[SW] [\u8C03\u5EA6\u5668] \u7B2C\u4E00\u6B21 CS_START \u53D1\u9001\u5F02\u5E38:",
      m.message,
    );
  }
  console.log(
    "[SW] [\u8C03\u5EA6\u5668] \u5237\u65B0\u9875\u9762\u4EE5\u91CD\u5EFA MQTT \u8FDE\u63A5...",
  );
  try {
    if (
      (await chrome.tabs.reload(r.id),
      await et(r.id),
      await new Promise((_) => setTimeout(_, 1500)),
      (m = await nn(r.id, o, 6, 2e3)),
      m)
    ) {
      await k(r.id),
        console.warn(
          "[SW] [\u8C03\u5EA6\u5668] \u9875\u9762\u5237\u65B0\u540E CS_START \u4ECD\u7136\u53D1\u9001\u5931\u8D25",
        );
      return;
    }
  } catch (_) {
    await k(r.id),
      console.warn(
        "[SW] [\u8C03\u5EA6\u5668] \u81EA\u52A8\u542F\u52A8\u8FC7\u7A0B\u51FA\u9519:",
        _.message,
      );
    return;
  }
  (M = C.RUNNING),
    (Ot = ""),
    kt(),
    console.log(
      "[SW] [\u8C03\u5EA6\u5668] ===== \u81EA\u52A8\u542F\u52A8\u5B8C\u6210 =====",
    );
}
async function Fc() {
  console.log(
    "[SW] [\u8C03\u5EA6\u5668] ===== \u81EA\u52A8\u505C\u6B62\u56DE\u8C03\u5F00\u59CB =====",
  );
  // \u4E00\u952E\u8054\u52A8\uFF08\u7F16\u6392\u5FAA\u73AF\uFF09\u8FD0\u884C\u671F\u95F4\uFF0C\u672C\u8C03\u5EA6\u5668\u6302\u8D77\uFF0C\u907F\u514D\u8BEF\u505C\u7F16\u6392\u4E2D\u7684\u6A21\u5757
  const __wfStop = await unifiedWorkflow.handlers["cmd_get_unified_workflow_status"]().catch(() => null);
  if (__wfStop && __wfStop.state && __wfStop.state !== "idle") {
    console.log("[SW] [\u8C03\u5EA6\u5668] \u4E00\u952E\u8054\u52A8\u8FD0\u884C\u4E2D\uFF08state=" + __wfStop.state + "\uFF09\uFF0C\u8DF3\u8FC7\u672C\u6B21\u5B9A\u65F6\u505C\u6B62");
    return;
  }
  let s = await K().catch(() => null);
  if (
    (console.log(
      "[SW] [\u8C03\u5EA6\u5668] \u5F53\u524D\u6D3B\u8DC3\u6807\u7B7E\u9875:",
      s,
    ),
    s)
  ) {
    try {
      await chrome.tabs.sendMessage(s, { action: S.CS_STOP }).catch((e) => {
        console.log(
          "[SW] [\u8C03\u5EA6\u5668] \u53D1\u9001 CS_STOP \u5931\u8D25\uFF08\u6807\u7B7E\u9875\u53EF\u80FD\u5DF2\u5173\u95ED\uFF09:",
          e.message,
        );
      });
    } catch {}
    await k(s);
  }
  (M = C.IDLE),
    (Ot = ""),
    kt(),
    console.log(
      "[SW] [\u8C03\u5EA6\u5668] ===== \u81EA\u52A8\u505C\u6B62\u5B8C\u6210 =====",
    );
}
async function Uc() {
  try {
    let s = await chrome.tabs.query({
      url: [
        "https://www.zhipin.com/web/geek/recommend*",
        "https://zhipin.com/web/geek/recommend*",
        "https://www.zhipin.com/web/chat/recommend*",
        "https://zhipin.com/web/chat/recommend*",
      ],
    });
    if (s && s.length > 0) {
      let e = s[0];
      console.log(
        "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u4F7F\u7528\u5DF2\u6709\u63A8\u8350\u9875\u6807\u7B7E\u9875:",
        e.id,
        e.url,
      );
      try {
        await chrome.tabs.update(e.id, { active: !0 });
      } catch {}
      return e;
    }
    console.log(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u672A\u627E\u5230\u5DF2\u6709\u63A8\u8350\u9875\u6807\u7B7E\u9875\uFF0C\u51C6\u5907\u521B\u5EFA\u65B0\u6807\u7B7E\u9875",
    );
  } catch (s) {
    console.warn(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u67E5\u8BE2\u6807\u7B7E\u9875\u5931\u8D25:",
      s.message,
    );
  }
  try {
    console.log(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u521B\u5EFA\u65B0\u63A8\u8350\u9875\u6807\u7B7E\u9875...",
    );
    let s = await chrome.tabs.create({
      url: "https://www.zhipin.com/web/geek/recommend",
      active: !0,
    });
    return (
      console.log(
        "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u65B0\u63A8\u8350\u9875\u6807\u7B7E\u9875\u5DF2\u521B\u5EFA, id:",
        s.id,
      ),
      await et(s.id),
      console.log(
        "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u65B0\u63A8\u8350\u9875\u6807\u7B7E\u9875\u52A0\u8F7D\u5B8C\u6210",
      ),
      s
    );
  } catch (s) {
    return (
      console.warn(
        "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u521B\u5EFA\u63A8\u8350\u9875\u6807\u7B7E\u9875\u5931\u8D25:",
        s.message,
      ),
      null
    );
  }
}
async function Wc(s) {
  console.log(
    "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] ===== \u81EA\u52A8\u542F\u52A8\u56DE\u8C03\u5F00\u59CB =====",
    s.name,
  );
  // \u4E00\u952E\u8054\u52A8\uFF08\u7F16\u6392\u5FAA\u73AF\uFF09\u8FD0\u884C\u671F\u95F4\uFF0C\u672C\u8C03\u5EA6\u5668\u6302\u8D77\uFF0C\u907F\u514D\u62A2\u6807\u7B7E\u9875
  const __wfStart = await unifiedWorkflow.handlers["cmd_get_unified_workflow_status"]().catch(() => null);
  if (__wfStart && __wfStart.state && __wfStart.state !== "idle") {
    console.log("[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u4E00\u952E\u8054\u52A8\u8FD0\u884C\u4E2D\uFF08state=" + __wfStart.state + "\uFF09\uFF0C\u8DF3\u8FC7\u672C\u6B21\u5B9A\u65F6\u542F\u52A8");
    return;
  }
  if (!(await hasCurrentPrivacyConsent())) {
    console.warn(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u672A\u786E\u8BA4\u6700\u65B0\u9690\u79C1\u653F\u7B56\uFF0C\u8DF3\u8FC7\u81EA\u52A8\u542F\u52A8",
    ),
      he(
        "greeting",
        "warn",
        "\u5B9A\u65F6\u4EFB\u52A1\u672A\u542F\u52A8\uFF1A\u8BF7\u5148\u5230\u4E2A\u4EBA\u4E2D\u5FC3\u540C\u610F\u6700\u65B0\u9690\u79C1\u653F\u7B56",
      );
    return;
  }
  if (!hasScheduledTaskApproval(s)) {
    console.warn(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u5B9A\u65F6\u4EFB\u52A1\u672A\u5BA1\u6838\u81EA\u52A8\u5316\u8303\u56F4\uFF0C\u8DF3\u8FC7\u81EA\u52A8\u542F\u52A8",
    ),
      he(
        "greeting",
        "warn",
        "\u5B9A\u65F6\u4EFB\u52A1\u672A\u542F\u52A8\uFF1A\u8BF7\u7F16\u8F91\u4EFB\u52A1\u5E76\u91CD\u65B0\u786E\u8BA4\u5C97\u4F4D\u3001\u8BDD\u672F\u548C\u5019\u9009\u4EBA\u8303\u56F4",
      );
    return;
  }
  let e = await K().catch(() => null);
  if (e)
    try {
      let i = await chrome.tabs.get(e);
      if (i && i.url?.includes("zhipin.com")) {
        let c = await chrome.tabs.sendMessage(e, { action: S.CS_GET_STATE });
        if (c && c.state && c.state !== C.IDLE) {
          console.log(
            "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u5185\u5BB9\u811A\u672C\u5DF2\u5728\u8FD0\u884C\u4E2D\uFF0C\u8DF3\u8FC7\u81EA\u52A8\u542F\u52A8",
          ),
            (z = c.state),
            tt();
          return;
        }
      }
    } catch (i) {
      console.log(
        "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u65E7\u5185\u5BB9\u811A\u672C\u672A\u54CD\u5E94\uFF0C\u6E05\u7406\u540E\u91CD\u65B0\u542F\u52A8:",
        i.message,
      ),
        await k(e).catch(() => {});
      try {
        let c = await chrome.tabs.get(e);
        if (
          c &&
          c.url &&
          c.url.includes("zhipin.com") &&
          !c.url.includes("/web/geek/recommend") &&
          !c.url.includes("/web/chat")
        ) {
          console.warn(
            `[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u5DF2\u6709\u6807\u7B7E\u9875(${c.id})\u5DF2\u88AB\u91CD\u5B9A\u5411\uFF0C\u672C\u8F6E\u4E0D\u518D\u91CD\u8BD5: ${c.url}`,
          ),
            he(
              "greeting",
              "warn",
              `\u5B9A\u65F6\u4EFB\u52A1\u542F\u52A8\u5931\u8D25\uFF1A\u63A8\u8350\u9875\u6807\u7B7E\u9875\u5DF2\u88AB\u91CD\u5B9A\u5411\uFF08${c.url}\uFF09`,
            ),
            (oe._failedTaskIdsInCycle[s.id] =
              `\u63A8\u8350\u9875\u6807\u7B7E\u9875\u88AB\u91CD\u5B9A\u5411\u5230 ${c.url}`),
            await oe._persistFailedTasks();
          return;
        }
      } catch {}
    }
  console.log(
    "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u9A8C\u8BC1\u767B\u5F55\u548C\u8BA2\u9605\u72B6\u6001...",
  );
  let t = await cn[S.CMD_VALIDATE_SUBSCRIPTION]();
  if (!t.valid) {
    console.warn(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u8BA2\u9605\u9A8C\u8BC1\u5931\u8D25\uFF0C\u81EA\u52A8\u542F\u52A8\u5DF2\u8DF3\u8FC7:",
      t.message,
    ),
      he(
        "greeting",
        "warn",
        `\u5B9A\u65F6\u4EFB\u52A1\u542F\u52A8\u5931\u8D25\uFF1A${t.message}`,
      );
    return;
  }
  t.degraded &&
    console.log(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u8BA2\u9605\u9A8C\u8BC1\u964D\u7EA7\uFF08\u4F7F\u7528\u672C\u5730\u7F13\u5B58\uFF09\uFF0C\u7EE7\u7EED\u81EA\u52A8\u542F\u52A8",
    ),
    console.log(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u67E5\u627E/\u521B\u5EFA\u63A8\u8350\u9875\u6807\u7B7E\u9875...",
    );
  let r = await Uc();
  if (!r) {
    console.warn(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u65E0\u6CD5\u627E\u5230\u6216\u521B\u5EFA\u63A8\u8350\u9875\u6807\u7B7E\u9875\uFF0C\u81EA\u52A8\u542F\u52A8\u5931\u8D25",
    );
    return;
  }
  if (
    (console.log(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u4F7F\u7528\u6807\u7B7E\u9875:",
      r.id,
      r.url,
    ),
    !(await Yr(r.id)))
  ) {
    console.log(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u6807\u7B7E\u9875\u6CE8\u518C\u5931\u8D25\uFF0C\u5176\u4ED6\u6807\u7B7E\u9875\u53EF\u80FD\u6B63\u5728\u8FD0\u884C",
    );
    return;
  }
  if (
    (console.log(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u7B49\u5F85 content script \u5C31\u7EEA...",
    ),
    await on(r.id, 1e4, 1e3))
  )
    try {
      let i = s.linkedJobs || [];
      console.log(
        "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] Content script \u5DF2\u5C31\u7EEA\uFF0C\u53D1\u9001 CS_START_GREETING, linkedJobs:",
        i.length,
        "\u4E2A",
      ),
        await chrome.tabs.sendMessage(r.id, {
          action: S.CS_START_GREETING,
          data: { linkedJobs: i },
        }),
        (z = C.RUNNING),
        tt(),
        console.log(
          "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] ===== \u81EA\u52A8\u542F\u52A8\u5B8C\u6210 =====",
        );
      return;
    } catch (i) {
      console.warn(
        "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] CS_START_GREETING \u53D1\u9001\u5931\u8D25\uFF08CS \u521A\u5C31\u7EEA\u5374\u4E0D\u53EF\u8FBE\uFF09:",
        i.message,
      ),
        await k(r.id);
      return;
    }
  console.log(
    "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] Content script \u672A\u5C31\u7EEA\uFF0C\u5237\u65B0\u9875\u9762\u91CD\u65B0\u6CE8\u5165...",
  );
  try {
    if (
      (await chrome.tabs.reload(r.id),
      await et(r.id),
      await new Promise((d) => setTimeout(d, 4e3)),
      !(await on(r.id, 6e3, 800)))
    ) {
      await k(r.id),
        console.warn(
          "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u5237\u65B0\u540E\u5185\u5BB9\u811A\u672C\u4ECD\u672A\u52A0\u8F7D\uFF0C\u81EA\u52A8\u542F\u52A8\u5931\u8D25",
        );
      return;
    }
    let c = s.linkedJobs || [];
    await chrome.tabs.sendMessage(r.id, {
      action: S.CS_START_GREETING,
      data: { linkedJobs: c },
    }),
      (z = C.RUNNING),
      tt(),
      console.log(
        "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u5237\u65B0\u540E\u81EA\u52A8\u542F\u52A8\u5B8C\u6210",
      );
  } catch (i) {
    await k(r.id),
      console.warn(
        "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u5237\u65B0\u540E\u81EA\u52A8\u542F\u52A8\u5931\u8D25:",
        i.message,
      );
  }
}
async function jc() {
  console.log(
    "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] ===== \u81EA\u52A8\u505C\u6B62\u56DE\u8C03\u5F00\u59CB =====",
  );
  // \u4E00\u952E\u8054\u52A8\uFF08\u7F16\u6392\u5FAA\u73AF\uFF09\u8FD0\u884C\u671F\u95F4\uFF0C\u672C\u8C03\u5EA6\u5668\u6302\u8D77\uFF0C\u907F\u514D\u8BEF\u505C\u7F16\u6392\u4E2D\u7684\u6A21\u5757
  const __wfStop = await unifiedWorkflow.handlers["cmd_get_unified_workflow_status"]().catch(() => null);
  if (__wfStop && __wfStop.state && __wfStop.state !== "idle") {
    console.log("[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u4E00\u952E\u8054\u52A8\u8FD0\u884C\u4E2D\uFF08state=" + __wfStop.state + "\uFF09\uFF0C\u8DF3\u8FC7\u672C\u6B21\u5B9A\u65F6\u505C\u6B62");
    return;
  }
  let s = await K().catch(() => null);
  if (
    (console.log(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u5F53\u524D\u6D3B\u8DC3\u6807\u7B7E\u9875:",
      s,
    ),
    s)
  ) {
    try {
      await chrome.tabs
        .sendMessage(s, { action: S.CS_STOP_GREETING })
        .catch((e) => {
          console.log(
            "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] \u53D1\u9001 CS_STOP_GREETING \u5931\u8D25\uFF08\u6807\u7B7E\u9875\u53EF\u80FD\u5DF2\u5173\u95ED\uFF09:",
            e.message,
          );
        });
    } catch {}
    await k(s);
  }
  (z = C.IDLE),
    (sn = ""),
    tt(),
    console.log(
      "[SW] [\u6253\u62DB\u547C\u8C03\u5EA6\u5668] ===== \u81EA\u52A8\u505C\u6B62\u5B8C\u6210 =====",
    );
}
async function Kc() {
  let s = await K().catch(() => null);
  if (
    (console.log("[SW] \u72B6\u6001\u6062\u590D\u68C0\u67E5: activeTabId=" + s),
    !s)
  ) {
    console.log(
      "[SW] \u65E0\u6D3B\u8DC3\u6807\u7B7E\u9875\u8BB0\u5F55\uFF0C\u65E0\u9700\u72B6\u6001\u6062\u590D",
    );
    return;
  }
  try {
    let e = await chrome.tabs.get(s);
    if (
      (console.log("[SW] \u6807\u7B7E\u9875\u5B58\u5728:", e.id, e.url),
      !e || !e.url || !e.url.includes("zhipin.com/web/chat"))
    ) {
      console.log(
        "[SW] \u6807\u7B7E\u9875\u5DF2\u5173\u95ED\u6216\u4E0D\u5728\u804A\u5929\u9875\u9762\uFF0C\u6E05\u7406\u8FC7\u671F\u72B6\u6001",
      ),
        await k(s).catch(() => {});
      return;
    }
  } catch (e) {
    console.log(
      "[SW] \u6807\u7B7E\u9875\u5DF2\u4E0D\u5B58\u5728\uFF0C\u6E05\u7406\u8FC7\u671F\u72B6\u6001:",
      e.message,
    ),
      await k(s).catch(() => {});
    return;
  }
  try {
    let e = await chrome.tabs.sendMessage(s, { action: S.CS_GET_STATE });
    e && e.state
      ? ((M = e.state),
        (Ot = e.statusText || ""),
        console.log(
          "[SW] \u72B6\u6001\u5DF2\u6062\u590D: swState=" +
            M +
            ", statusText=" +
            Ot,
        ))
      : (console.log(
          "[SW] \u5185\u5BB9\u811A\u672C\u72B6\u6001\u4E3A\u7A7A\uFF0C\u6E05\u7406\u6CE8\u518C",
        ),
        await k(s).catch(() => {}));
  } catch (e) {
    console.log(
      "[SW] \u5185\u5BB9\u811A\u672C\u672A\u54CD\u5E94\uFF0C\u6E05\u7406\u8FC7\u671F\u72B6\u6001:",
      e.message,
    ),
      await k(s).catch(() => {});
  }
}
var ie = new Zs({ onAutoStart: Gc, onAutoStop: Fc, onGetState: () => M }),
  oe = new en({ onAutoStart: Wc, onAutoStop: jc, onGetState: () => z });
chrome.alarms.onAlarm.addListener((s) => {
  let e = new Date().toISOString();
  s.name === AUTH_SESSION_HEARTBEAT && checkSessionHeartbeat().catch(() => {});
  (s.name === Ne || s.name === Le) &&
    console.log(
      `[SW] \u6536\u5230\u8C03\u5EA6\u5668 alarm \u4E8B\u4EF6: name="${s.name}", time=${e}`,
    ),
    ie._handleAlarm(s),
    oe._handleAlarm(s);
});
chrome.alarms.create(AUTH_SESSION_HEARTBEAT, { periodInMinutes: 1 });
checkSessionHeartbeat().catch(() => {});
(async () => (
  console.log("[SW] \u5F00\u59CB\u521D\u59CB\u5316\u8C03\u5EA6\u5668..."),
  await ie.init(),
  await oe.init(),
  await Kc(),
  console.log(
    "[SW] \u8C03\u5EA6\u5668\u521D\u59CB\u5316\u5B8C\u6210\uFF0C\u6267\u884C\u9996\u6B21\u7ACB\u5373\u68C0\u67E5...",
  ),
  ie._handleAlarm({ name: Ne }),
  oe._handleAlarm({ name: Le }),
  console.log("[SW] \u8C03\u5EA6\u5668\u9996\u6B21\u68C0\u67E5\u5B8C\u6210")
))();

/* ============================================================
 * 简历打分模块（追加，独立于上方压缩代码）
 * cmd_score_resume：先校验 VIP 订阅，再用 modelConfig 调 LLM 打分。
 * 作为额外的 onMessage 监听器接入，命中就自己处理并 sendResponse。
 * ============================================================ */
(() => {
  const MODEL_CONFIG_KEY = "modelConfig";
  const SUBSCRIPTION_KEY = "profileSubscription";
  const RESULT_KEY_PREFIX = "resumeScore_";
  const DEFAULT_DIMENSIONS = [
    { key: "match", label: "岗位匹配度", weight: 35 },
    { key: "experience", label: "工作经验", weight: 25 },
    { key: "skill", label: "技能匹配", weight: 20 },
    { key: "education", label: "学历背景", weight: 10 },
    { key: "stability", label: "稳定性", weight: 10 },
  ];

  // —— 订阅闸门：非 VIP 或已过期则拦截 ——
  async function ensureVip() {
    return requireActiveSubscriptionOnline();
  }

  // 提示词与脱敏已移到服务端 /llm/score-resume（见后端 core.py，与原版逐字一致）。
  // 插件只传 jd_text + resume_text + dimensions，不再接触密钥、不再本地组提示词。
  async function scoreResume(payload = {}) {
    const { resumeText, jobDescription = "", candidateId = "" } = payload;
    const dims = payload.dimensions?.length
      ? payload.dimensions
      : DEFAULT_DIMENSIONS;
    if (!resumeText || resumeText.trim().length < 20)
      return {
        ok: false,
        error: "简历文本为空或过短，可能未成功抓取到 canvas 内容",
      };
    try {
      await ensureVip(); // ← 订阅校验（服务端仍双闸门，此处前置快速反馈）
      const res = await rn(llmScoreRequest, {
        jd_text: jobDescription,
        resume_text: resumeText,
        detail: "full",
        dimensions: dims,
      });
      const result = res.result;
      if (candidateId)
        await chrome.storage.local.set({
          [RESULT_KEY_PREFIX + candidateId]: {
            ...result,
            scoredAt: Date.now(),
          },
        });
      return {
        ok: true,
        result,
        balance: res.balance_points,
        warnLevel: res.warn_level,
      };
    } catch (err) {
      return {
        ok: false,
        error: err.message,
        code: err.code,
        billingBlock: isBillingBlock(err),
      };
    }
  }

  chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
    if (msg && msg.command === "cmd_score_resume" && !_s.tab) {
      scoreResume(msg).then(sendResponse);
      return true; // 异步响应
    }
  });
  console.log("[SW] 简历打分模块已加载 (cmd_score_resume)");
})();

/* ============================================================
 * 托管计费查询模块（追加，独立于上方压缩代码）
 * cmd_get_billing_balance / cmd_get_billing_transactions：
 * 供大模型页余额区轮询；只透传点数，token/单价永不出后端。
 * ============================================================ */
(() => {
  chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
    if (!_s || _s.tab) return; // 只接侧栏
    if (msg && msg.command === "cmd_get_billing_balance") {
      (async () => {
        try {
          const balance = await rn(llmBalanceRequest);
          return { ok: true, balance };
        } catch (err) {
          return { ok: false, error: err.message, code: err.code };
        }
      })().then(sendResponse);
      return true; // 异步响应
    }
    if (msg && msg.command === "cmd_get_billing_transactions") {
      (async () => {
        try {
          const tx = await rn(llmTransactionsRequest, {
            limit: msg.limit || 30,
            offset: msg.offset || 0,
          });
          return { ok: true, ...tx };
        } catch (err) {
          return { ok: false, error: err.message, code: err.code };
        }
      })().then(sendResponse);
      return true; // 异步响应
    }
  });
  console.log("[SW] 托管计费查询模块已加载 (cmd_get_billing_balance/transactions)");
})();

import {
  startCollector as startResumeCollector,
  stopCollector as stopResumeCollector,
  resumeCollector as resumeResumeCollector,
  getCollectorStatus as getResumeCollectorStatus,
  maskContacts,
} from "./resume-collector.mjs";
import { createWorkflowOrchestrator } from "./workflow-orchestrator.mjs";

const unifiedWorkflow = createWorkflowOrchestrator({
  runCommand: async (action, data) => {
    const handler = cn[action];
    if (!handler) throw new Error(`未知内部命令: ${action}`);
    return await handler(data);
  },
  startResumeCollector,
  stopResumeCollector,
  resumeResumeCollector,
  getResumeCollectorStatus,
  // 联动面板主动轮询统一状态，避免旧侧栏 bundle 将新 taskType 误当成未知日志类型。
  broadcast: () => {},
});

Object.assign(cn, unifiedWorkflow.handlers);
