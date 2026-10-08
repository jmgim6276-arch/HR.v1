"""test_core.py —— 认证、单设备会话、订阅与管理员接口回归测试。"""
import os
import hashlib
import json
import sqlite3
import tempfile
import threading
import time
from unittest.mock import patch

os.environ["DB_PATH"] = tempfile.mktemp(suffix=".db")
os.environ["DEV_MODE"] = "true"
os.environ["JWT_SECRET"] = "test-secret"

import core

core.init_db()

ok = 0


def check(name, cond):
    global ok
    assert cond, f"❌ FAIL: {name}"
    ok += 1
    print(f"✅ {name}")


def login(email, device_id, force=False):
    sent = core.send_code(email)
    return core.verify_code(email, sent["dev_code"], device_id, force)


def expect_error(name, fn, status, code=None):
    try:
        fn()
        check(name, False)
    except core.AppError as exc:
        check(name, exc.status == status and (code is None or exc.code == code))


def tn(subs):
    active = next((s for s in subs if s["status"] == "active"), None)
    return {
        "isVip": bool(active),
        "plan": (active and active["plan_id"]) or "free",
        "planType": (active and active["plan_type"]) or "",
        "expireDate": active and active["ends_at"],
    }


EMAIL = "hr@example.com"
DEVICE_A = "install-device-a-0001"
DEVICE_B = "install-device-b-0002"

# 验证码基础契约
r = core.send_code(EMAIL)
check("send-code 返回 dev_code", "dev_code" in r and len(r["dev_code"]) == 6)
wrong = "000000" if r["dev_code"] != "000000" else "111111"
expect_error("错误验证码返回 CODE_INVALID",
             lambda: core.verify_code(EMAIL, wrong, DEVICE_A), 400, "CODE_INVALID")

# 第一台设备登录，JWT 必须绑定 sid
login_a = login(EMAIL, DEVICE_A)
access_a = login_a["tokens"]["access_token"]
refresh_a = login_a["tokens"]["refresh_token"]
session_a = login_a["session"]["id"]
payload_a = core.verify_jwt(access_a)
check("登录 JWT 包含 sid", payload_a["sid"] == session_a)
check("登录返回 refresh token", bool(refresh_a))

with core.db() as c:
    stored = c.execute("SELECT * FROM user_sessions WHERE user_id=?",
                       (login_a["user"]["id"],)).fetchone()
    legacy_refresh_table = c.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='refresh_tokens'"
    ).fetchone()
check("数据库不保存原始 device_id", stored["device_hash"] != DEVICE_A)
check("数据库不保存原始 refresh token",
      stored["refresh_token_hash"] != refresh_a)
check("旧版明文 refresh_tokens 表已移除", legacy_refresh_table is None)

user_a = core.user_from_bearer(f"Bearer {access_a}", DEVICE_A)
check("正确设备可使用 access token", user_a["id"] == login_a["user"]["id"])
expect_error("其他设备不能盗用 access token",
             lambda: core.user_from_bearer(f"Bearer {access_a}", DEVICE_B),
             401, "SESSION_DEVICE_MISMATCH")
expect_error("缺少 Bearer 头被拒绝",
             lambda: core.user_from_bearer(None, DEVICE_A), 401, "TOKEN_MISSING")
expect_error("无效 token 被拒绝",
             lambda: core.user_from_bearer("Bearer garbage.token.here", DEVICE_A), 401)
expired_token = core.make_jwt({"sub": user_a["id"], "sid": session_a}, -1)
expect_error("过期 access token 返回 TOKEN_EXPIRED",
             lambda: core.user_from_bearer(f"Bearer {expired_token}", DEVICE_A),
             401, "TOKEN_EXPIRED")

# 心跳只能更新当前会话
hb = core.heartbeat(user_a["id"], user_a["_session_id"])
check("心跳返回服务器时间和会话到期时间",
      hb["ok"] is True and hb["session_expires_at"] > hb["server_time"])

# refresh 必须绑定设备且每次轮换
expect_error("其他设备不能刷新令牌",
             lambda: core.refresh_token(refresh_a, DEVICE_B),
             401, "SESSION_DEVICE_MISMATCH")
rf = core.refresh_token(refresh_a, DEVICE_A)
check("refresh 轮换 refresh token", rf["refresh_token"] != refresh_a)
check("refresh 签发新 access token", rf["access_token"] != access_a)
expect_error("旧 refresh token 不可重放",
             lambda: core.refresh_token(refresh_a, DEVICE_A), 401, "TOKEN_INVALID")
access_a2 = rf["access_token"]
refresh_a2 = rf["refresh_token"]

# 第二台设备默认冲突；冲突不消耗验证码，确认后可强制登录
sent_b = core.send_code(EMAIL)
code_b = sent_b["dev_code"]
expect_error("第二台设备登录返回 LOGIN_CONFLICT",
             lambda: core.verify_code(EMAIL, code_b, DEVICE_B),
             409, "LOGIN_CONFLICT")
login_b = core.verify_code(EMAIL, code_b, DEVICE_B, force_login=True)
access_b = login_b["tokens"]["access_token"]
check("强制登录产生新 sid", login_b["session"]["id"] != session_a)
expect_error("强制登录后旧 access 立即失效",
             lambda: core.user_from_bearer(f"Bearer {access_a2}", DEVICE_A),
             401, "SESSION_REPLACED")
expect_error("强制登录后旧 refresh 立即失效",
             lambda: core.refresh_token(refresh_a2, DEVICE_A), 401, "TOKEN_INVALID")
user_b = core.user_from_bearer(f"Bearer {access_b}", DEVICE_B)
check("新设备会话可用", user_b["id"] == login_b["user"]["id"])

with core.db() as c:
    count = c.execute("SELECT COUNT(*) n FROM user_sessions WHERE user_id=?",
                      (user_b["id"],)).fetchone()["n"]
check("每个账号数据库仅有一个会话", count == 1)

# 套餐信息和管理员开通保持可用
expected_plans = [
    ("plan_weekly", 990, 7, "7天"),
    ("plan_quarterly", 29800, 90, "季度"),
    ("plan_yearly", 69800, 365, "年"),
    ("plan_three_year", 128000, 1095, "3年"),
]
actual_plans = [
    (p["id"], p["price_cents"], p["duration_days"], p["billing_label"])
    for p in core.PRODUCTS[0]["plans"]
]
check("products 四档套餐价格与期限正确", actual_plans == expected_plans)
check("新用户默认为免费版", tn(core.users_me(user_b)["subscriptions"])["isVip"] is False)

grant = core.admin_grant(EMAIL, "plan_weekly")
check("管理员仍可开通会员", grant["ok"] is True)
me = core.users_me(user_b)
check("管理员开通后用户为 VIP", tn(me["subscriptions"])["isVip"] is True)
weekly_end = core.datetime.fromisoformat(tn(me["subscriptions"])["expireDate"])
renewed = core.admin_grant(EMAIL, "plan_quarterly")
renewed_end = core.datetime.fromisoformat(renewed["ends_at"])
check("管理员续费从当前到期日顺延 90 天",
      abs((renewed_end - weekly_end).total_seconds() - 90 * 86400) < 1)

# 账号配置云同步：白名单、历史凭证排除、按用户隔离和修订号冲突。
settings_v1 = core.put_user_settings(
    user_b["id"],
    {
        "jobConfigs": [{"id": "job_1", "name": "财务经理"}],
        "modelConfig": {
            "apiUrl": "https://api.example.com",
            "apiKey": "must-not-reach-cloud",
            "model": "model-test",
        },
        "resumeReplyConfig": {"messages": ["您好，简历已收到"]},
        "replyScheduledTasks": [{
            "id": "task_1",
            "enabled": True,
            "scopeApprovedAt": "2026-10-08T08:00:00Z",
            "privacyVersion": "2026-10-08",
            "recipientScope": "must-remain-device-local",
        }],
        "talentPool": [{"name": "不应上传的人才"}],
        "profileAuth": {"accessToken": "must-not-upload"},
    },
    0,
)
check(
    "首次上传账号配置生成 revision 1",
    settings_v1["revision"] == 1 and settings_v1["exists"] is True,
)
saved_settings = core.get_user_settings(user_b["id"])
check(
    "云端配置只保留白名单且剔除历史凭证",
    saved_settings["settings"]["modelConfig"]["model"] == "model-test"
    and "apiKey" not in saved_settings["settings"]["modelConfig"]
    and "scopeApprovedAt"
        not in saved_settings["settings"]["replyScheduledTasks"][0]
    and "privacyVersion"
        not in saved_settings["settings"]["replyScheduledTasks"][0]
    and "talentPool" not in saved_settings["settings"]
    and "profileAuth" not in saved_settings["settings"],
)
expect_error(
    "旧 revision 不能覆盖新云端配置",
    lambda: core.put_user_settings(
        user_b["id"], {"jobConfigs": []}, 0
    ),
    409, "SETTINGS_REVISION_CONFLICT",
)
settings_v2 = core.put_user_settings(
    user_b["id"], {"jobConfigs": [{"id": "job_2"}]}, 1
)
check(
    "正确 revision 可更新账号配置",
    settings_v2["revision"] == 2
    and settings_v2["settings"]["jobConfigs"][0]["id"] == "job_2",
)
other_settings = core.get_user_settings("different-user")
check(
    "不同账号配置相互隔离",
    other_settings["exists"] is False and other_settings["settings"] == {},
)

# HTTP 普通用户订阅路由已彻底移除，OpenAPI 也不再暴露；管理员路由不受影响
import main

public_subscription_routes = [
    route for route in main.app.routes
    if getattr(route, "path", None) == main.API + "/subscriptions"
]
check("普通用户 /subscriptions 已从 API 移除", not public_subscription_routes)
admin_grant_routes = [
    route for route in main.app.routes
    if getattr(route, "path", None) == main.API + "/admin/grant"
]
check("管理员开通路由仍保留", bool(admin_grant_routes))

# logout 只删除当前 sid，access 和 refresh 随即都失效
refresh_b = login_b["tokens"]["refresh_token"]
core.logout(user_b["id"], user_b["_session_id"])
expect_error("logout 后 access 失效",
             lambda: core.user_from_bearer(f"Bearer {access_b}", DEVICE_B),
             401, "SESSION_REVOKED")
expect_error("logout 后 refresh 失效",
             lambda: core.refresh_token(refresh_b, DEVICE_B), 401, "TOKEN_INVALID")

# 真实并发校验：同一验证码两个写事务同时到达，只有一个成功。
RACE_EMAIL = "race@example.com"
race_code = core.send_code(RACE_EMAIL)["dev_code"]
barrier = threading.Barrier(2)
results = []


def race_login():
    barrier.wait()
    try:
        core.verify_code(RACE_EMAIL, race_code, "race-device-0001")
        results.append("ok")
    except core.AppError as exc:
        results.append(exc.code)


threads = [threading.Thread(target=race_login) for _ in range(2)]
for thread in threads:
    thread.start()
for thread in threads:
    thread.join()
check("并发登录只有一个事务成功",
      sorted(results) == ["CODE_INVALID", "ok"])
with core.db() as c:
    race_sessions = c.execute(
        "SELECT COUNT(*) n FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE u.email=?",
        (RACE_EMAIL,),
    ).fetchone()["n"]
check("并发登录后仍只有一个会话", race_sessions == 1)

# 数据库约束也不允许一个用户两个会话
with core.db() as c:
    race_user = c.execute("SELECT id FROM users WHERE email=?", (RACE_EMAIL,)).fetchone()
    try:
        c.execute(
            "INSERT INTO user_sessions VALUES(?,?,?,?,?,?,?,NULL)",
            ("ses_duplicate", race_user["id"], "device_hash", "refresh_hash", 1, 1, 9999999999),
        )
        duplicate_blocked = False
    except sqlite3.IntegrityError:
        duplicate_blocked = True
check("user_sessions.user_id 唯一约束生效", duplicate_blocked)

# 呼波特人才线索映射：凭证仅在后端，插件字段全部映射为字符串。
whobot_user = core.find_user_by_email(EMAIL)
with patch.object(main.whobot, "TOKEN", "token-test"), \
     patch.object(main.whobot, "SIGNATURE", "channel-secret-test"), \
     patch.object(main.whobot.time, "time", return_value=1722222222.123):
    signed_headers = main.whobot._headers()
expected_timestamp = "1722222222123"
expected_signature = hashlib.sha1(
    f"channel-secret-testtoken-test{expected_timestamp}".encode("utf-8")
).hexdigest()
check(
    "呼波特 Signature 按渠道密钥、Token、毫秒时间戳动态计算 SHA1",
    signed_headers["TimeStamp"] == expected_timestamp
    and signed_headers["Signature"] == expected_signature,
)
whobot_req = main.WhobotClueReq(
    talent_id="talent_1001",
    name="测试候选人",
    phone="+86 138-0013-8000",
    position="财务经理",
    job_description="负责财务管理与预算",
    pending_confirmation="请确认到岗时间",
    special_notes="优先考虑北京候选人",
    end_user="HR-测试",
    candidate_issues="问:工作地点?答:北京",
    company_name="测试科技有限公司",
    company_information="五险一金双休",
    first_sentence="您好,看到您投递了我们的岗位",
)
captured_clue = {}


def fake_submit(clue):
    captured_clue.update(clue)
    return {"errNo": 0, "errMsg": "success"}


with patch.object(main.whobot, "submit_clue", side_effect=fake_submit):
    whobot_result = main.r_whobot_submit(whobot_req, whobot_user)
check("呼波特上报返回成功", whobot_result["ok"] is True)
check("呼波特手机号规范化", captured_clue["phone"] == "13800138000")
check("呼波特自定义字段均为字符串",
      all(isinstance(captured_clue[key], str) for key in (
          "name", "position", "job_description", "pending_confirmation",
          "special_notes", "end_user", "candidate_issues", "company_name",
          "company_information", "first_sentence")))
check("呼波特新增上传字段透传",
      captured_clue["candidate_issues"] == "问:工作地点?答:北京" and
      captured_clue["company_name"] == "测试科技有限公司" and
      captured_clue["company_information"] == "五险一金双休" and
      captured_clue["first_sentence"] == "您好,看到您投递了我们的岗位")
whobot_records = core.list_whobot_records(whobot_user["id"])
check("呼波特记录按人才 ID 关联",
      len(whobot_records) == 1 and
      whobot_records[0]["talent_id"] == "talent_1001" and
      whobot_records[0]["status"] == "submitted")
check("呼波特记录含新增字段",
      whobot_records[0]["company_name"] == "测试科技有限公司" and
      whobot_records[0]["first_sentence"] == "您好,看到您投递了我们的岗位" and
      whobot_records[0]["candidate_issues"] == "问:工作地点?答:北京" and
      whobot_records[0]["company_information"] == "五险一金双休")

# 电话话单回调：原始 Body 验签、nonce 防重放、按 contextId 关联初面反馈。
main.whobot_callback.APP_ID = "callback-app-test"
main.whobot_callback.APP_SECRET = "callback-secret-test"
callback_payload = {
    "contextId": whobot_records[0]["partner_clue_id"],
    "callId": "call_1001",
    "phone": "13800138000",
    "position": "财务经理",
    "answerMainStatus": 3,
    "answerStatus": 301,
    "callMakeTime": int(time.time()) - 60,
    "callDurationSeconds": 58,
    "recordUrl": "https://example.com/record/call_1001.mp3",
    "summary": "候选人有意向，期望两周内到岗。",
    "wechatStatus": 1,
    "wechatSeatName": "招聘助手",
    "wechatSeatPhone": "13900139000",
    "intentionStatus": 2,
    "intentionRank": "A",
    "intentionTag": {"到岗": "两周内"},
    "clueAttr": {
        "employment_status": "在职",
        "skill_type": "财务管理",
        "education_background": "本科",
        "work_location": "北京",
        "compensation_benefits": "面议",
        "reminder": "工作日晚上联系",
    },
    "chatLogs": [{
        "begin": "2026-07-28 17:30:00",
        "end": "2026-07-28 17:30:05",
        "role": "assistant",
        "text": "您好，请问方便沟通吗？",
    }],
}
raw_callback = json.dumps(
    callback_payload, ensure_ascii=False, separators=(", ", ": ")
)
callback_timestamp = str(int(time.time()))
callback_nonce = "nonce-callback-1001"
callback_source = (
    f"timestamp={callback_timestamp}&nonce={callback_nonce}"
    f"&appId={main.whobot_callback.APP_ID}&data={raw_callback}"
    f"&appSecret={main.whobot_callback.APP_SECRET}"
)
callback_sign = hashlib.sha256(callback_source.encode("utf-8")).hexdigest()
verified_timestamp = main.whobot_callback.verify(
    main.whobot_callback.APP_ID, callback_timestamp, callback_nonce,
    callback_sign, "sha256", raw_callback,
)
check("呼波特回调使用原始 Body 验签", verified_timestamp == int(callback_timestamp))
expect_error(
    "回调 Body 被改写后签名立即失效",
    lambda: main.whobot_callback.verify(
        main.whobot_callback.APP_ID, callback_timestamp, callback_nonce,
        callback_sign, "sha256",
        json.dumps(callback_payload, ensure_ascii=False, separators=(",", ":")),
    ),
    401, "WHOBOT_CALLBACK_BAD_SIGNATURE",
)
core.claim_whobot_nonce(
    main.whobot_callback.APP_ID, callback_nonce, verified_timestamp
)
expect_error(
    "相同 nonce 的回调不能重放",
    lambda: core.claim_whobot_nonce(
        main.whobot_callback.APP_ID, callback_nonce, verified_timestamp
    ),
    409, "WHOBOT_CALLBACK_REPLAY",
)
callback_saved = core.save_whobot_call_record(callback_payload)
check("话单按 contextId 匹配人才", callback_saved["matched"] is True)
callback_record = core.list_whobot_records(whobot_user["id"])[0]
check(
    "初面反馈已写入人才关联记录",
    callback_record["status"] == "callback_received"
    and callback_record["callback"]["employment_status"] == "在职"
    and callback_record["callback"]["wechat_number"] == "13900139000"
    and callback_record["callback"]["call"]["callId"] == "call_1001"
    and len(callback_record["callback"]["chat_logs"]) == 1,
)
with core.db() as c:
    saved_call = c.execute(
        "SELECT * FROM whobot_call_records WHERE call_id='call_1001'"
    ).fetchone()
check(
    "完整话单独立落库",
    saved_call is not None
    and saved_call["talent_id"] == "talent_1001"
    and saved_call["phone"] == "13800138000",
)
expect_error("呼波特拒绝无效手机号",
             lambda: main.r_whobot_submit(
                 main.WhobotClueReq(talent_id="bad_phone", phone="123"),
                 whobot_user),
             400, "WHOBOT_INVALID_PHONE")
paths = main.app.openapi()["paths"]
check("OpenAPI 暴露呼波特上报与记录接口",
      "/api/v1/integrations/whobot/clues" in paths and
      "/api/v1/integrations/whobot/records" in paths and
      "/api/v1/integrations/whobot/callback" in paths)
check(
    "OpenAPI 暴露账号配置读取与更新接口",
    "/api/v1/users/me/settings" in paths
    and "get" in paths["/api/v1/users/me/settings"]
    and "put" in paths["/api/v1/users/me/settings"],
)

# ── 点数计费（注册赠送 / 扣费 / 透支 / 闸门 / 充值 / 明细隔离）──
BILL_EMAIL = "billing@example.com"
login_bill = login(BILL_EMAIL, "billing-device-0001")
bill_uid = login_bill["user"]["id"]

bal = core.get_balance(bill_uid)
check("新用户注册赠送 50 体验点",
      bal["balance_milli"] == 50000 and bal["balance_points"] == 50.0
      and bal["warn_level"] == "none")
with core.db() as c:
    signup_tx = c.execute(
        "SELECT * FROM point_transactions WHERE user_id=? AND kind='signup_bonus'",
        (bill_uid,)).fetchone()
check("注册赠送写入点数流水", signup_tx is not None and signup_tx["delta_milli"] == 50000)

usage = core.record_llm_usage(bill_uid, "resume_score", 1500, 500)
check("按真实 token 扣点（2000 token = 0.04 点）",
      usage["charged_milli"] == 40 and usage["balance_milli"] == 49960)
bal = core.get_balance(bill_uid)
check("余额查询返回今日/本月消耗",
      bal["today_consume_points"] == 0.04 and bal["month_consume_points"] == 0.04)

check("混合价换算向上取整（1501 token = 31 毫点）",
      core.tokens_to_milli(1501, 0) == 31 and core.tokens_to_milli(0, 0) == 0)

expect_error("未知计费场景被拒绝（扣费）",
             lambda: core.record_llm_usage(bill_uid, "free_chat", 1, 1),
             400, "BILLING_INVALID_SCENE")
expect_error("未知计费场景被拒绝（闸门）",
             lambda: core.check_llm_allowance(bill_uid, "free_chat"),
             400, "BILLING_INVALID_SCENE")
check("余额充足时闸门放行", core.check_llm_allowance(bill_uid, "reply_judge")["balance_milli"] == 49960)

# 先放行后扣费：单次调用把余额打穿成负数也不报错，下次调用才被闸门拦住
overdraft = core.record_llm_usage(bill_uid, "reply_judge", 3000000000, 0)
check("扣费时余额不足本次放行（可透支为负）",
      overdraft["balance_milli"] < 0)
expect_error("余额<=0 后拒绝新调用",
             lambda: core.check_llm_allowance(bill_uid, "reply_judge"),
             402, "BILLING_INSUFFICIENT_BALANCE")

# 日上限防失控：当日累计消耗达上限即拒绝（阈值走配置，临时调小验证；
# 用独立账号避免上一步透支出的负余额先触发 402）
daily_user = login("billing-daily@example.com", "billing-device-0002")["user"]["id"]
core.record_llm_usage(daily_user, "collect_score", 1500, 500)
real_limit = core.BILLING_DAILY_LIMIT_POINTS
core.BILLING_DAILY_LIMIT_POINTS = 0.01
try:
    expect_error("当日消耗达上限拒绝调用",
                 lambda: core.check_llm_allowance(daily_user, "collect_score"),
                 429, "BILLING_DAILY_LIMIT")
finally:
    core.BILLING_DAILY_LIMIT_POINTS = real_limit

recharge = core.admin_recharge(BILL_EMAIL, 500, "微信转账尾号8888")
check("管理员人工充值到账",
      recharge["ok"] is True and recharge["points"] == 500.0
      and recharge["balance_points"] == core._milli_to_points(overdraft["balance_milli"] + 500000))
with core.db() as c:
    order = c.execute("SELECT * FROM recharge_orders WHERE id=?",
                      (recharge["order_id"],)).fetchone()
check("人工充值落 completed 订单（预留自动支付入口）",
      order is not None and order["status"] == "completed"
      and order["channel"] == "admin_manual" and order["amount_cents"] == 5000)
expect_error("充值点数必须大于 0",
             lambda: core.admin_recharge(BILL_EMAIL, 0), 400)

new_user_recharge = core.admin_recharge("billing-new@example.com", 100)
check("给不存在的用户充值自动开户（含 50 体验点）",
      new_user_recharge["balance_points"] == 150.0)

# 用户端明细只看点数；token 证据链仅管理端可见
user_tx = core.list_point_transactions(bill_uid)
check("用户端明细按时间倒序且不暴露 token",
      user_tx["total"] >= 3
      and user_tx["items"][0]["kind"] == "recharge"
      and "prompt_tokens" not in user_tx["items"][0])
admin_tx = core.admin_list_point_transactions(BILL_EMAIL)
consume_tx = next(t for t in admin_tx["items"] if t["kind"] == "consume" and t["scene"] == "resume_score")
check("管理端明细含 token 证据链",
      consume_tx["prompt_tokens"] == 1500 and consume_tx["completion_tokens"] == 500)
expect_error("管理端明细要求用户存在",
             lambda: core.admin_list_point_transactions("nobody@example.com"), 404)

users_list = core.admin_list_users()
check("用户列表携带点数余额",
      any(u["email"] == BILL_EMAIL and isinstance(u["balance_points"], float)
          for u in users_list))

# 老库迁移：无 balance_milli 列的 users 表补列后存量用户开户为 0
mig_db = tempfile.mktemp(suffix=".db")
real_db_path = core.DB_PATH
try:
    core.DB_PATH = mig_db
    with core.db() as c:
        c.execute("CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,"
                  " created_at TEXT NOT NULL)")
        c.execute("INSERT INTO users VALUES('u_legacy','legacy@example.com',"
                  "'2026-01-01T00:00:00+00:00')")
    core.init_db()
    with core.db() as c:
        legacy = c.execute("SELECT balance_milli FROM users WHERE id='u_legacy'").fetchone()
    check("老库迁移后存量用户开户 0 点", legacy["balance_milli"] == 0)
finally:
    core.DB_PATH = real_db_path
    os.remove(mig_db)

paths = main.app.openapi()["paths"]
check("OpenAPI 暴露计费接口",
      "/api/v1/billing/balance" in paths
      and "/api/v1/billing/transactions" in paths
      and "/api/v1/admin/billing/recharge" in paths
      and "/api/v1/admin/billing/transactions" in paths)

# ── LLM 托管代理（双闸门 / 钳制 / 限流 / 真实扣费 / 上游异常）──
# 两层假：业务层用 FakeUpstream 换掉 core._call_upstream；
# 传输层 patch urllib.request.urlopen 验证真实 _call_upstream 的请求体与异常分支。
LLM_EMAIL = "llm@example.com"
llm_uid = login(LLM_EMAIL, "llm-device-0001")["user"]["id"]
core.admin_grant(LLM_EMAIL, "plan_weekly")  # 双闸门第一级：会员


class FakeUpstream:
    def __init__(self):
        self.calls = []
        self.content = '{"overall": 88, "recommendation": "推荐", "summary": "匹配良好"}'
        self.usage = (3000, 500)

    def __call__(self, messages, max_tokens, temperature):
        self.calls.append({"messages": messages, "max_tokens": max_tokens,
                           "temperature": temperature})
        return self.content, self.usage[0], self.usage[1]


fake = FakeUpstream()
real_upstream = core._call_upstream
core._call_upstream = fake
try:
    before = core.get_balance(llm_uid)["balance_points"]
    r = core.llm_chat(llm_uid, "reply_judge",
                      [{"role": "user", "content": "判断这条消息是否要回复"}])
    check("透传端点放行并返回模型内容",
          r["ok"] is True and "overall" in r["content"]
          and r["balance_points"] == round(before - 0.07, 2)
          and r["warn_level"] == "none")

    with core.db() as c:
        tx = c.execute(
            "SELECT * FROM point_transactions WHERE user_id=? AND kind='consume' "
            "ORDER BY created_at DESC LIMIT 1", (llm_uid,)).fetchone()
    check("透传扣费流水：场景 reply_judge + 真实 token 证据链",
          tx["scene"] == "reply_judge" and tx["delta_milli"] == -70
          and tx["prompt_tokens"] == 3000 and tx["completion_tokens"] == 500)

    expect_error("透传端点拒绝模板场景（resume_score 须走打分端点）",
                 lambda: core.llm_chat(llm_uid, "resume_score",
                                       [{"role": "user", "content": "x"}]),
                 400, "BILLING_INVALID_SCENE")
    expect_error("未知场景被拒绝",
                 lambda: core.llm_chat(llm_uid, "free_chat",
                                       [{"role": "user", "content": "x"}]),
                 400, "BILLING_INVALID_SCENE")
    expect_error("空消息数组被拒绝",
                 lambda: core.llm_chat(llm_uid, "reply_judge", []),
                 400, "LLM_BAD_MESSAGES")
    expect_error("非法角色被拒绝",
                 lambda: core.llm_chat(llm_uid, "reply_judge",
                                       [{"role": "tool", "content": "x"}]),
                 400, "LLM_BAD_MESSAGES")
    expect_error("空 content 被拒绝",
                 lambda: core.llm_chat(llm_uid, "reply_judge",
                                       [{"role": "user", "content": "  "}]),
                 400, "LLM_BAD_MESSAGES")
    expect_error("消息条数超限被拒绝",
                 lambda: core.llm_chat(llm_uid, "reply_judge",
                                       [{"role": "user", "content": "x"}] * 11),
                 400, "LLM_BAD_MESSAGES")
    expect_error("单条消息过长被拒绝",
                 lambda: core.llm_chat(llm_uid, "reply_judge",
                                       [{"role": "user", "content": "x" * 20001}]),
                 400, "LLM_BAD_MESSAGES")

    core.llm_chat(llm_uid, "reply_judge",
                  [{"role": "user", "content": "hi"}], max_tokens=99999)
    check("max_tokens 服务端封顶", fake.calls[-1]["max_tokens"] == core.LLM_MAX_TOKENS_CAP)
    core.llm_chat(llm_uid, "reply_judge", [{"role": "user", "content": "hi"}])
    check("max_tokens 默认值 800", fake.calls[-1]["max_tokens"] == 800)
    core.llm_chat(llm_uid, "reply_judge",
                  [{"role": "user", "content": "hi"}], temperature=1.8)
    check("temperature 钳制到 1.0", fake.calls[-1]["temperature"] == 1.0)
    core.llm_chat(llm_uid, "reply_judge",
                  [{"role": "user", "content": "hi", "name": "x", "tool_calls": [1]}])
    check("消息多余字段被剥除",
          set(fake.calls[-1]["messages"][0].keys()) == {"role", "content"})

    r = core.llm_chat(llm_uid, "collect_extract",
                      [{"role": "system", "content": "提取简历字段"},
                       {"role": "user", "content": "张三 本科 5年"}])
    check("采集提取场景走透传（第四出口也计费）", r["ok"] is True)
    with core.db() as c:
        tx = c.execute(
            "SELECT scene FROM point_transactions WHERE user_id=? AND kind='consume' "
            "ORDER BY created_at DESC LIMIT 1", (llm_uid,)).fetchone()
    check("采集提取流水场景为 collect_extract", tx["scene"] == "collect_extract")

    # 双闸门顺序：先订阅后余额——非会员即使余额为 0 也先吃 403
    gate_uid = login("llm-gate@example.com", "llm-device-0002")["user"]["id"]
    core.record_llm_usage(gate_uid, "reply_judge", 3000000000, 0)  # 打成负余额
    expect_error("非会员先被订阅闸门拦（不是 402）",
                 lambda: core.llm_chat(gate_uid, "reply_judge",
                                       [{"role": "user", "content": "x"}]),
                 403, "SUBSCRIPTION_REQUIRED")

    poor_uid = login("llm-poor@example.com", "llm-device-0003")["user"]["id"]
    core.admin_grant("llm-poor@example.com", "plan_weekly")
    core.record_llm_usage(poor_uid, "reply_judge", 3000000000, 0)
    expect_error("会员余额<=0 被拒（402）",
                 lambda: core.llm_chat(poor_uid, "reply_judge",
                                       [{"role": "user", "content": "x"}]),
                 402, "BILLING_INSUFFICIENT_BALANCE")

    cap_uid = login("llm-cap@example.com", "llm-device-0004")["user"]["id"]
    core.admin_grant("llm-cap@example.com", "plan_weekly")
    core.record_llm_usage(cap_uid, "reply_judge", 1500, 500)
    real_limit = core.BILLING_DAILY_LIMIT_POINTS
    core.BILLING_DAILY_LIMIT_POINTS = 0.01
    try:
        expect_error("会员当日达上限被拒（429）",
                     lambda: core.llm_chat(cap_uid, "reply_judge",
                                           [{"role": "user", "content": "x"}]),
                     429, "BILLING_DAILY_LIMIT")
    finally:
        core.BILLING_DAILY_LIMIT_POINTS = real_limit

    rpm_uid = login("llm-rpm@example.com", "llm-device-0005")["user"]["id"]
    core.admin_grant("llm-rpm@example.com", "plan_weekly")
    real_rpm = core.LLM_RATE_LIMIT_PER_MIN
    core.LLM_RATE_LIMIT_PER_MIN = 3
    try:
        for _ in range(3):
            core.llm_chat(rpm_uid, "reply_judge", [{"role": "user", "content": "x"}])
        expect_error("每分钟限流第 4 次被拒",
                     lambda: core.llm_chat(rpm_uid, "reply_judge",
                                           [{"role": "user", "content": "x"}]),
                     429, "LLM_RATE_LIMIT")
    finally:
        core.LLM_RATE_LIMIT_PER_MIN = real_rpm

    core._llm_rate_windows.clear()  # llm_uid 前面攒的窗口清零，防误伤打分测试

    # ── 服务端模板打分 ──
    before = core.get_balance(llm_uid)["balance_points"]
    r = core.llm_score_resume(
        llm_uid, "招聘经理，5年以上经验，熟悉BOSS直聘",
        "张三 13800138000 zhangsan@example.com 5年招聘经验 本科学历 熟悉全流程")
    check("full 打分返回结构化结果并扣费",
          r["ok"] is True and r["result"]["overall"] == 88
          and r["balance_points"] == round(before - 0.07, 2))
    call = fake.calls[-1]
    check("full 提示词含维度与 JD（与插件模板逐字）",
          "【评分维度】" in call["messages"][0]["content"]
          and "岗位匹配度（key=match，权重 35%）" in call["messages"][0]["content"]
          and "招聘经理，5年以上经验" in call["messages"][0]["content"]
          and call["max_tokens"] == 2000 and call["temperature"] == 0.3)
    user_msg = call["messages"][1]["content"]
    check("打分前联系方式已脱敏（与插件 maskContacts 同规则）",
          user_msg.startswith("【候选人简历文本】")
          and "13800138000" not in user_msg and "[手机号已在本地提取]" in user_msg
          and "zhangsan@example.com" not in user_msg and "[邮箱已在本地提取]" in user_msg)
    with core.db() as c:
        tx = c.execute(
            "SELECT scene FROM point_transactions WHERE user_id=? AND kind='consume' "
            "ORDER BY created_at DESC LIMIT 1", (llm_uid,)).fetchone()
    check("full 打分流水场景为 resume_score", tx["scene"] == "resume_score")

    core.llm_score_resume(llm_uid, "", "李四 3年销售经验 大专学历 期望城市杭州")
    call = fake.calls[-1]
    check("默认 detail 为 full（带维度，手动打分页语义）",
          "【评分维度】" in call["messages"][0]["content"]
          and call["max_tokens"] == 2000 and call["temperature"] == 0.3)
    core.llm_score_resume(llm_uid, "JD", "王五 2年客服经验 高中学历 可立即到岗", "brief")
    with core.db() as c:
        tx = c.execute(
            "SELECT scene FROM point_transactions WHERE user_id=? AND kind='consume' "
            "ORDER BY created_at DESC LIMIT 1", (llm_uid,)).fetchone()
    check("brief 流水场景为 collect_score（入库自动打分，简版省 token）",
          tx["scene"] == "collect_score"
          and fake.calls[-1]["max_tokens"] == 500
          and fake.calls[-1]["temperature"] == 0.2
          and "【评分维度】" not in fake.calls[-1]["messages"][0]["content"]
          and "【候选人简历文本】" not in fake.calls[-1]["messages"][1]["content"])

    expect_error("简历文本过短被拒（不烧 token）",
                 lambda: core.llm_score_resume(llm_uid, "", "太短"),
                 400, "LLM_RESUME_TOO_SHORT")
    expect_error("非法 detail 被拒",
                 lambda: core.llm_score_resume(llm_uid, "", "一段超过二十个字的简历文本内容，长度确保超过二十字校验", "mega"),
                 400, "LLM_BAD_DETAIL")

    core.llm_score_resume(llm_uid, "", "一段超过二十个字的简历文本内容，长度确保超过二十字校验",
                          "full", [{"key": "culture", "label": "文化匹配", "weight": 50}])
    check("自定义维度进入提示词",
          "文化匹配（key=culture，权重 50%）" in fake.calls[-1]["messages"][0]["content"])
    core.llm_score_resume(llm_uid, "", "一段超过二十个字的简历文本内容，长度确保超过二十字校验",
                          "full", [{"key": "broken"}])
    check("非法自定义维度回落默认五维",
          "岗位匹配度（key=match，权重 35%）" in fake.calls[-1]["messages"][0]["content"])

    # 解析失败不扣费（用户买不到空气；坏输出没有套利价值）
    fake.content = "这不是 JSON"
    before = core.get_balance(llm_uid)["balance_points"]
    expect_error("模型返回非 JSON → 502",
                 lambda: core.llm_score_resume(llm_uid, "", "一段超过二十个字的简历文本内容，长度确保超过二十字校验"),
                 502, "LLM_BAD_RESPONSE")
    check("解析失败不扣费", core.get_balance(llm_uid)["balance_points"] == before)
    fake.content = '{"recommendation": "推荐"}'
    expect_error("模型返回缺 overall → 502",
                 lambda: core.llm_score_resume(llm_uid, "", "一段超过二十个字的简历文本内容，长度确保超过二十字校验"),
                 502, "LLM_BAD_RESPONSE")
    check("缺 overall 也不扣费", core.get_balance(llm_uid)["balance_points"] == before)
    fake.content = '{"overall": 188, "recommendation": "推荐", "summary": "x"}'
    r = core.llm_score_resume(llm_uid, "", "一段超过二十个字的简历文本内容，长度确保超过二十字校验")
    check("overall 越界钳制到 0-100", r["result"]["overall"] == 100)
finally:
    core._call_upstream = real_upstream
    core._llm_rate_windows.clear()


# ── 传输层：真实 _call_upstream 的请求体与异常分支 ──
class _FakeHTTPResp:
    def __init__(self, payload):
        self._payload = payload

    def read(self):
        return json.dumps(self._payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


real_key = core.DASHSCOPE_API_KEY
try:
    core.DASHSCOPE_API_KEY = ""
    expect_error("服务端未配 key → 503",
                 lambda: core._call_upstream([{"role": "user", "content": "x"}], 100, 0.3),
                 503, "LLM_NOT_CONFIGURED")

    core.DASHSCOPE_API_KEY = "test-key"
    captured = {}

    def fake_urlopen(req, timeout=None):
        captured["url"] = req.get_full_url()
        captured["body"] = json.loads(req.data.decode("utf-8"))
        captured["auth"] = req.headers.get("Authorization")
        captured["timeout"] = timeout
        return _FakeHTTPResp({"choices": [{"message": {"content": "ok"}}],
                              "usage": {"prompt_tokens": 10, "completion_tokens": 5}})

    with patch("urllib.request.urlopen", fake_urlopen):
        content, pt, ct = core._call_upstream(
            [{"role": "user", "content": "hi"}], 123, 0.7)
    check("上游请求体：锁模型/禁流式/封顶/Bearer/超时",
          content == "ok" and pt == 10 and ct == 5
          and captured["body"]["model"] == core.LLM_MODEL
          and captured["body"]["stream"] is False
          and captured["body"]["max_tokens"] == 123
          and captured["auth"] == "Bearer test-key"
          and captured["url"].endswith("/chat/completions")
          and captured["timeout"] == core.LLM_TIMEOUT_SECONDS)

    def urlopen_no_usage(req, timeout=None):
        return _FakeHTTPResp({"choices": [{"message": {"content": "ok"}}]})

    with patch("urllib.request.urlopen", urlopen_no_usage):
        expect_error("上游缺 usage → 502 不扣费（计费诚信，宁败不送）",
                     lambda: core._call_upstream([{"role": "user", "content": "x"}], 100, 0.3),
                     502, "LLM_USAGE_MISSING")

    def urlopen_http_err(req, timeout=None):
        import urllib.error
        raise urllib.error.HTTPError("http://x", 500, "Server Error", {}, None)

    with patch("urllib.request.urlopen", urlopen_http_err):
        expect_error("上游 HTTP 错误 → 502 不扣费",
                     lambda: core._call_upstream([{"role": "user", "content": "x"}], 100, 0.3),
                     502, "LLM_UPSTREAM_ERROR")

    def urlopen_timeout(req, timeout=None):
        raise TimeoutError("timed out")

    with patch("urllib.request.urlopen", urlopen_timeout):
        expect_error("上游超时 → 502 不扣费",
                     lambda: core._call_upstream([{"role": "user", "content": "x"}], 100, 0.3),
                     502, "LLM_UPSTREAM_ERROR")
finally:
    core.DASHSCOPE_API_KEY = real_key

paths = main.app.openapi()["paths"]
check("OpenAPI 暴露 LLM 代理接口",
      "/api/v1/llm/chat" in paths and "/api/v1/llm/score-resume" in paths)

print(f"\n🎉 全部通过：{ok} 项断言")
os.remove(os.environ["DB_PATH"])
