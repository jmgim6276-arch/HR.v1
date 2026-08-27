"""
core.py —— 纯业务逻辑（不依赖 FastAPI，只用标准库）

把认证、JWT、数据库、订阅计算都放这里，main.py 只做 HTTP 路由。
这样逻辑可以独立单元测试（见 test_core.py），也便于替换 Web 框架。
"""
import os
import time
import threading
import sqlite3
import secrets
import hashlib
import hmac
import base64
import json
import re
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone
from contextlib import contextmanager

import mailer

# ── 配置 ────────────────────────────────────────────
DEV_MODE = os.getenv("DEV_MODE", "true").lower() == "true"
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
ADMIN_KEY = os.getenv("ADMIN_KEY", "admin-secret-change-me")  # 后台开通会员用的口令
ACCESS_TTL = 60 * 60 * 2
REFRESH_TTL = 60 * 60 * 24 * 30
CODE_TTL = 60 * 5
DB_PATH = os.getenv("DB_PATH", "app.db")

# ── 验证码防爆破/防轰炸（进程内计数；单进程 uvicorn 部署下有效，重启即清零）──
CODE_MAX_ATTEMPTS = 10        # 同一邮箱验证码连续输错上限，超过需重新获取
SEND_CODE_MAX_PER_HOUR = 10   # 同一邮箱每小时最多发送验证码条数

# ── 计费（点数）────────────────────────────────────
# 1 元 = 10 点；内部一律存毫点（1 点 = 1000 毫点），前端只显示两位小数的点。
# 换算率、赠送额度与阈值全部走环境变量，调价/调阈不需要改代码。
BILLING_TOKENS_PER_POINT = int(os.getenv("BILLING_TOKENS_PER_POINT", "50000"))
BILLING_SIGNUP_BONUS_POINTS = float(os.getenv("BILLING_SIGNUP_BONUS_POINTS", "50"))
BILLING_DAILY_LIMIT_POINTS = float(os.getenv("BILLING_DAILY_LIMIT_POINTS", "200"))
BILLING_WARN_SOFT_POINTS = float(os.getenv("BILLING_WARN_SOFT_POINTS", "5"))
BILLING_WARN_HARD_POINTS = float(os.getenv("BILLING_WARN_HARD_POINTS", "0.5"))
# 消费场景白名单（代理端点只接受这四种，防滥用者自由发挥）
BILLING_SCENES = {"reply_judge", "resume_score", "collect_score", "collect_extract"}

# ── LLM 托管代理（密钥只放服务器，插件永不接触）──────────────
# 阿里 dashscope OpenAI 兼容端点；固定一款模型，用户不可选（决策 1）。
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")
LLM_BASE_URL = os.getenv(
    "LLM_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen-plus")
LLM_MAX_TOKENS_CAP = int(os.getenv("LLM_MAX_TOKENS_CAP", "2000"))
LLM_RATE_LIMIT_PER_MIN = int(os.getenv("LLM_RATE_LIMIT_PER_MIN", "20"))
LLM_TIMEOUT_SECONDS = int(os.getenv("LLM_TIMEOUT_SECONDS", "60"))

PRODUCTS = [{
    "id": "prod_main",
    "name": "智能招聘助手会员",
    "plans": [
        {"id": "plan_weekly", "name": "7天套餐", "plan_type": "weekly",
         "price_cents": 990, "duration_days": 7, "billing_label": "7天"},
        {"id": "plan_quarterly", "name": "季度套餐", "plan_type": "quarterly",
         "price_cents": 29800, "duration_days": 90, "billing_label": "季度"},
        {"id": "plan_yearly", "name": "年度套餐", "plan_type": "yearly",
         "price_cents": 69800, "duration_days": 365, "billing_label": "年"},
        {"id": "plan_three_year", "name": "三年套餐", "plan_type": "three_year",
         "price_cents": 128000, "duration_days": 1095, "billing_label": "3年"},
    ],
}]

CLOUD_SETTING_KEYS = {
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
}
MAX_USER_SETTINGS_BYTES = 512 * 1024
_SECRET_SETTING_KEYS = {
    "apikey", "accesstoken", "refreshtoken", "authorization",
    "password", "secret", "token",
    # 自动化授权必须由每台设备、每次任务重新确认，不能随配置继承。
    "approvedat", "scopeapprovedat", "privacyversion", "recipientscope",
}


class AppError(Exception):
    """业务错误：status 是 HTTP 状态码，message 给前端。"""
    def __init__(self, status: int, message: str, code: str = "APP_ERROR"):
        self.status = status
        self.message = message
        self.code = code
        super().__init__(message)


# 已知的不安全默认密钥/口令；生产环境仍在使用时拒绝启动（fail-closed）。
_DEFAULT_JWT_SECRET = "change-me-in-production"
_DEFAULT_ADMIN_KEY = "admin-secret-change-me"


def assert_production_secrets() -> None:
    """DEV_MODE=false 时若仍使用默认 JWT_SECRET/ADMIN_KEY，直接拒绝启动。"""
    if DEV_MODE:
        return
    weak = []
    if JWT_SECRET == _DEFAULT_JWT_SECRET:
        weak.append("JWT_SECRET")
    if ADMIN_KEY == _DEFAULT_ADMIN_KEY:
        weak.append("ADMIN_KEY")
    if weak:
        raise RuntimeError(
            "生产环境检测到不安全的默认配置：" + ", ".join(weak) +
            "。请先用环境变量设置为随机值（如 openssl rand -hex 32）再启动。"
        )


# ── 数据库 ──────────────────────────────────────────
@contextmanager
def db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout=10000")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with db() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS codes (
            email TEXT NOT NULL, code TEXT NOT NULL, expires_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS subscriptions (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, product_id TEXT, plan_id TEXT,
            plan_type TEXT, status TEXT NOT NULL, starts_at TEXT, ends_at TEXT);
        -- 旧版表保存 refresh token 原文，新版不再使用并在迁移时清除。
        DROP TABLE IF EXISTS refresh_tokens;
        CREATE TABLE IF NOT EXISTS user_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            device_hash TEXT NOT NULL,
            refresh_token_hash TEXT NOT NULL UNIQUE,
            created_at INTEGER NOT NULL,
            last_seen_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            revoked_at INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_hash
            ON user_sessions(refresh_token_hash);
        CREATE TABLE IF NOT EXISTS whobot_clues (
            partner_clue_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            talent_id TEXT NOT NULL,
            phone TEXT NOT NULL,
            name TEXT,
            position TEXT,
            job_description TEXT,
            pending_confirmation TEXT,
            special_notes TEXT,
            end_user TEXT,
            candidate_issues TEXT,
            company_name TEXT,
            company_information TEXT,
            first_sentence TEXT,
            status TEXT NOT NULL,
            last_error TEXT,
            submitted_at TEXT,
            updated_at TEXT NOT NULL,
            callback_payload TEXT,
            callback_updated_at TEXT,
            UNIQUE(user_id, talent_id)
        );
        CREATE INDEX IF NOT EXISTS idx_whobot_clues_user_updated
            ON whobot_clues(user_id, updated_at DESC);
        CREATE TABLE IF NOT EXISTS whobot_callback_nonces (
            nonce TEXT PRIMARY KEY,
            app_id TEXT NOT NULL,
            used_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_whobot_callback_nonces_expires
            ON whobot_callback_nonces(expires_at);
        CREATE TABLE IF NOT EXISTS whobot_call_records (
            call_id TEXT PRIMARY KEY,
            context_id TEXT NOT NULL,
            partner_clue_id TEXT,
            user_id TEXT,
            talent_id TEXT,
            phone TEXT,
            payload TEXT NOT NULL,
            received_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_whobot_call_records_context
            ON whobot_call_records(context_id);
        CREATE INDEX IF NOT EXISTS idx_whobot_call_records_user_updated
            ON whobot_call_records(user_id, updated_at DESC);
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id TEXT PRIMARY KEY,
            settings_json TEXT NOT NULL,
            revision INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        -- 点数流水：kind=signup_bonus/recharge/consume/admin_adjust；
        -- consume 行带场景与 token 数（token 仅管理端可见，用户端接口会剥掉）。
        CREATE TABLE IF NOT EXISTS point_transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            delta_milli INTEGER NOT NULL,
            balance_after_milli INTEGER NOT NULL,
            kind TEXT NOT NULL,
            scene TEXT,
            prompt_tokens INTEGER,
            completion_tokens INTEGER,
            ref_id TEXT,
            note TEXT,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_point_tx_user_created
            ON point_transactions(user_id, created_at DESC);
        -- 充值订单：人工充值=管理员直接落一笔 completed；后续接自动支付只多一个回调入口。
        CREATE TABLE IF NOT EXISTS recharge_orders (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            amount_cents INTEGER NOT NULL,
            points_milli INTEGER NOT NULL,
            status TEXT NOT NULL,
            channel TEXT NOT NULL,
            note TEXT,
            created_at TEXT NOT NULL,
            completed_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_recharge_orders_user_created
            ON recharge_orders(user_id, created_at DESC);
        """)
        _ensure_whobot_clue_columns(c)
        _ensure_users_columns(c)


def _ensure_whobot_clue_columns(c):
    """老库补列：CREATE TABLE IF NOT EXISTS 不会给已存在的表加新列，
    用 PRAGMA table_info 检查并 ALTER TABLE 补齐呼波特契约新增的上传字段。"""
    wanted = {
        "candidate_issues": "TEXT",
        "company_name": "TEXT",
        "company_information": "TEXT",
        "first_sentence": "TEXT",
    }
    existing = {row[1] for row in c.execute("PRAGMA table_info(whobot_clues)")}
    for col, typ in wanted.items():
        if col not in existing:
            c.execute(f"ALTER TABLE whobot_clues ADD COLUMN {col} {typ}")


def _ensure_users_columns(c):
    """老库补列：users 表加点数余额（毫点），存量用户开户为 0。"""
    existing = {row[1] for row in c.execute("PRAGMA table_info(users)")}
    if "balance_milli" not in existing:
        c.execute(
            "ALTER TABLE users ADD COLUMN balance_milli INTEGER NOT NULL DEFAULT 0")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def plan_lookup(plan_id):
    for p in PRODUCTS:
        for pl in p["plans"]:
            if pl["id"] == plan_id:
                return p, pl
    return None, None


def _secret_hash(value: str, purpose: str) -> str:
    """对设备标识和 refresh token 做服务端 HMAC，数据库不保存原文。"""
    return hmac.new(
        JWT_SECRET.encode(), f"{purpose}:{value}".encode(), hashlib.sha256
    ).hexdigest()


def _device_hash(device_id: str) -> str:
    if not isinstance(device_id, str) or len(device_id.strip()) < 8:
        raise AppError(400, "缺少有效的设备标识", "INVALID_DEVICE_ID")
    return _secret_hash(device_id.strip(), "device")


def _refresh_hash(token: str) -> str:
    if not isinstance(token, str) or len(token) < 20:
        raise AppError(401, "refresh token 无效或过期", "TOKEN_INVALID")
    return _secret_hash(token, "refresh")


def _new_refresh_token() -> str:
    return secrets.token_urlsafe(48)


# ── JWT（HS256，标准库实现）──────────────────────────
def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def make_jwt(payload: dict, ttl: int) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    # jti 保证同一秒内签发的 token 也互不相同
    body = {**payload, "iat": now, "exp": now + ttl, "jti": secrets.token_hex(6)}
    seg = f"{_b64(json.dumps(header).encode())}.{_b64(json.dumps(body).encode())}"
    sig = hmac.new(JWT_SECRET.encode(), seg.encode(), hashlib.sha256).digest()
    return f"{seg}.{_b64(sig)}"


def verify_jwt(token: str) -> dict:
    try:
        h, b, s = token.split(".")
        seg = f"{h}.{b}"
        expected = hmac.new(JWT_SECRET.encode(), seg.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(_unb64(s), expected):
            raise ValueError("bad signature")
        payload = json.loads(_unb64(b))
        if payload.get("exp", 0) < time.time():
            raise AppError(401, "访问令牌已过期", "TOKEN_EXPIRED")
        return payload
    except AppError:
        raise
    except Exception:
        raise AppError(401, "无效或过期的令牌", "TOKEN_INVALID")


def user_from_bearer(authorization: str, device_id: str) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise AppError(401, "缺少认证令牌", "TOKEN_MISSING")
    payload = verify_jwt(authorization[7:])
    sid = payload.get("sid")
    user_id = payload.get("sub")
    if not sid or not user_id:
        raise AppError(401, "登录会话已失效，请重新登录", "SESSION_REVOKED")
    supplied_device_hash = _device_hash(device_id)
    now = int(time.time())
    with db() as c:
        row = c.execute(
            "SELECT u.*, s.id AS session_id, s.device_hash, s.expires_at, s.revoked_at "
            "FROM users u JOIN user_sessions s ON s.user_id=u.id "
            "WHERE u.id=? AND s.id=?", (user_id, sid)
        ).fetchone()
        if not row:
            current = c.execute(
                "SELECT id FROM user_sessions WHERE user_id=?", (user_id,)
            ).fetchone()
            code = "SESSION_REPLACED" if current else "SESSION_REVOKED"
            message = "账号已在其他设备登录" if current else "登录会话已失效"
            raise AppError(401, message, code)
        if row["revoked_at"] is not None or row["expires_at"] <= now:
            c.execute("DELETE FROM user_sessions WHERE id=?", (sid,))
            raise AppError(401, "登录会话已过期，请重新登录", "SESSION_REVOKED")
        if not hmac.compare_digest(row["device_hash"], supplied_device_hash):
            raise AppError(401, "设备校验失败，请重新登录", "SESSION_DEVICE_MISMATCH")
    user = {"id": row["id"], "email": row["email"], "created_at": row["created_at"]}
    # 下划线字段仅在服务端路由间传递，users_me 不会把它们返回给前端。
    user["_session_id"] = sid
    return user


# ── 业务逻辑 ────────────────────────────────────────
# 验证码限流/防爆破的进程内计数（部署为单进程 uvicorn，重启即清零）。
_rate_lock = threading.Lock()
_code_failures = {}   # email -> 连续输错次数
_send_history = {}    # email -> [发送时间戳]


def _send_code_allowed(email: str) -> None:
    """限制同一邮箱每小时发码条数，防止对受害者邮箱轰炸。"""
    now = time.time()
    with _rate_lock:
        history = [t for t in _send_history.get(email, []) if now - t < 3600]
        if len(history) >= SEND_CODE_MAX_PER_HOUR:
            _send_history[email] = history
            raise AppError(
                429, "验证码发送过于频繁，请一小时后再试", "SEND_CODE_RATE_LIMITED")
        history.append(now)
        _send_history[email] = history


def _code_fail_count(email: str) -> int:
    with _rate_lock:
        return _code_failures.get(email, 0)


def _note_code_failure(email: str) -> None:
    with _rate_lock:
        _code_failures[email] = _code_failures.get(email, 0) + 1


def _reset_code_failures(email: str) -> None:
    with _rate_lock:
        _code_failures.pop(email, None)


def send_code(email: str) -> dict:
    _send_code_allowed(email)
    _reset_code_failures(email)   # 重新发码即解除旧码的输错锁定
    code = f"{secrets.randbelow(1000000):06d}"   # CSPRNG，避免验证码被预测
    with db() as c:
        c.execute("DELETE FROM codes WHERE email=?", (email,))
        c.execute("INSERT INTO codes(email, code, expires_at) VALUES(?,?,?)",
                  (email, code, int(time.time()) + CODE_TTL))
    print(f"[验证码] {email} -> {code}  (5分钟内有效)")

    # 配了邮件就真发；发失败则报错让用户重试
    if mailer.email_configured():
        try:
            mailer.send_verification(email, code)
        except Exception as e:
            print(f"[邮件发送失败] {email}: {e}")
            raise AppError(502, "验证码邮件发送失败，请稍后重试")
    elif not DEV_MODE:
        # 生产环境却没配邮件 = 配置错误，明确报出来
        raise AppError(500, "邮件服务未配置，请联系管理员")

    resp = {"ok": True, "message": "验证码已发送"}
    if DEV_MODE:                 # 开发模式仍把码带回，方便测试
        resp["dev_code"] = code
    return resp


def verify_code(email: str, code: str, device_id: str, force_login: bool = False) -> dict:
    device_hash = _device_hash(device_id)
    now = int(time.time())
    # 连续输错达到上限后直接拒绝，阻断对 6 位验证码的在线爆破。
    if _code_fail_count(email) >= CODE_MAX_ATTEMPTS:
        raise AppError(
            429, "验证码错误次数过多，请重新获取验证码", "CODE_TOO_MANY_ATTEMPTS")
    with db() as c:
        # 锁住写事务，确保两台设备并发登录也只能生成一个最终会话。
        c.execute("BEGIN IMMEDIATE")
        row = c.execute("SELECT * FROM codes WHERE email=? ORDER BY expires_at DESC",
                        (email,)).fetchone()
        if not row or row["code"] != code:
            _note_code_failure(email)
            raise AppError(400, "验证码错误", "CODE_INVALID")
        if row["expires_at"] < time.time():
            raise AppError(400, "验证码已过期", "CODE_EXPIRED")
        user = c.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if not user:
            uid = _insert_user_with_bonus(c, email)
        else:
            uid = user["id"]

        active = c.execute(
            "SELECT * FROM user_sessions WHERE user_id=?", (uid,)
        ).fetchone()
        if active and active["expires_at"] <= now:
            c.execute("DELETE FROM user_sessions WHERE id=?", (active["id"],))
            active = None
        if (active and not hmac.compare_digest(active["device_hash"], device_hash)
                and not force_login):
            # 保留验证码，前端确认“强制登录”后可立即重试。
            raise AppError(409, "账号已在其他设备登录", "LOGIN_CONFLICT")

        c.execute("DELETE FROM codes WHERE email=?", (email,))
        # 同设备重新登录也会轮换 sid，让旧 access/refresh 立即失效。
        c.execute("DELETE FROM user_sessions WHERE user_id=?", (uid,))
        sid = "ses_" + secrets.token_hex(16)
        refresh = _new_refresh_token()
        expires_at = now + REFRESH_TTL
        c.execute(
            "INSERT INTO user_sessions(id,user_id,device_hash,refresh_token_hash,"
            "created_at,last_seen_at,expires_at,revoked_at) VALUES(?,?,?,?,?,?,?,NULL)",
            (sid, uid, device_hash, _refresh_hash(refresh), now, now, expires_at)
        )
        access = make_jwt({"sub": uid, "sid": sid}, ACCESS_TTL)
    _reset_code_failures(email)   # 登录成功，清零该邮箱的输错计数
    return {"user": {"id": uid, "email": email},
            "session": {"id": sid, "expires_at": expires_at},
            "tokens": {"access_token": access, "refresh_token": refresh}}


def refresh_token(rt: str, device_id: str) -> dict:
    token_hash = _refresh_hash(rt)
    device_hash = _device_hash(device_id)
    now = int(time.time())
    with db() as c:
        c.execute("BEGIN IMMEDIATE")
        row = c.execute(
            "SELECT * FROM user_sessions WHERE refresh_token_hash=?", (token_hash,)
        ).fetchone()
        if not row:
            raise AppError(401, "refresh token 无效或已被替换", "TOKEN_INVALID")
        if row["revoked_at"] is not None or row["expires_at"] <= now:
            c.execute("DELETE FROM user_sessions WHERE id=?", (row["id"],))
            raise AppError(401, "登录会话已过期，请重新登录", "SESSION_REVOKED")
        if not hmac.compare_digest(row["device_hash"], device_hash):
            raise AppError(401, "设备校验失败，请重新登录", "SESSION_DEVICE_MISMATCH")
        new_refresh = _new_refresh_token()
        expires_at = now + REFRESH_TTL
        updated = c.execute(
            "UPDATE user_sessions SET refresh_token_hash=?,last_seen_at=?,expires_at=? "
            "WHERE id=? AND refresh_token_hash=?",
            (_refresh_hash(new_refresh), now, expires_at, row["id"], token_hash)
        ).rowcount
        if updated != 1:
            raise AppError(401, "refresh token 已被使用", "TOKEN_INVALID")
        access = make_jwt({"sub": row["user_id"], "sid": row["id"]}, ACCESS_TTL)
    return {"access_token": access, "refresh_token": new_refresh,
            "session": {"id": row["id"], "expires_at": expires_at}}


def logout(user_id: str, session_id: str) -> dict:
    with db() as c:
        c.execute("DELETE FROM user_sessions WHERE user_id=? AND id=?", (user_id, session_id))
    return {"ok": True}


def heartbeat(user_id: str, session_id: str) -> dict:
    now = int(time.time())
    with db() as c:
        updated = c.execute(
            "UPDATE user_sessions SET last_seen_at=? "
            "WHERE user_id=? AND id=? AND revoked_at IS NULL AND expires_at>?",
            (now, user_id, session_id, now)
        ).rowcount
        if updated != 1:
            raise AppError(401, "登录会话已失效", "SESSION_REVOKED")
        row = c.execute(
            "SELECT expires_at FROM user_sessions WHERE id=?", (session_id,)
        ).fetchone()
    return {"ok": True, "server_time": now, "session_expires_at": row["expires_at"]}


def user_subscriptions(user_id: str):
    with db() as c:
        rows = c.execute("SELECT * FROM subscriptions WHERE user_id=? ORDER BY ends_at DESC",
                         (user_id,)).fetchall()
    out = []
    for r in rows:
        status = r["status"]
        if status == "active" and r["ends_at"] and r["ends_at"] < now_iso():
            status = "expired"
        out.append({"id": r["id"], "status": status, "plan_id": r["plan_id"],
                    "plan_type": r["plan_type"], "product_id": r["product_id"],
                    "starts_at": r["starts_at"], "ends_at": r["ends_at"]})
    return out


def users_me(user: dict) -> dict:
    return {"id": user["id"], "email": user["email"],
            "subscriptions": user_subscriptions(user["id"])}


def _scrub_cloud_value(value, depth=0):
    """递归移除凭证字段，并限制异常嵌套，避免 API Key 进入云端。"""
    if depth > 20:
        raise AppError(400, "配置嵌套层级过深", "SETTINGS_TOO_DEEP")
    if isinstance(value, dict):
        return {
            str(key): _scrub_cloud_value(item, depth + 1)
            for key, item in value.items()
            if str(key).replace("_", "").lower() not in _SECRET_SETTING_KEYS
        }
    if isinstance(value, list):
        return [_scrub_cloud_value(item, depth + 1) for item in value]
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    raise AppError(400, "配置包含不支持的数据类型", "SETTINGS_INVALID_VALUE")


def sanitize_user_settings(settings: dict) -> dict:
    if not isinstance(settings, dict):
        raise AppError(400, "账号配置必须是 JSON 对象", "SETTINGS_INVALID")
    sanitized = {
        key: _scrub_cloud_value(settings[key])
        for key in CLOUD_SETTING_KEYS
        if key in settings
    }
    encoded = json.dumps(
        sanitized, ensure_ascii=False, separators=(",", ":"), sort_keys=True
    )
    if len(encoded.encode("utf-8")) > MAX_USER_SETTINGS_BYTES:
        raise AppError(413, "账号配置超过 512KB 限制", "SETTINGS_TOO_LARGE")
    return sanitized


def get_user_settings(user_id: str) -> dict:
    with db() as c:
        row = c.execute(
            "SELECT * FROM user_settings WHERE user_id=?", (user_id,)
        ).fetchone()
    if not row:
        return {
            "exists": False, "settings": {}, "revision": 0,
            "updated_at": None,
        }
    try:
        settings = json.loads(row["settings_json"])
    except (TypeError, json.JSONDecodeError):
        settings = {}
    return {
        "exists": True,
        "settings": settings if isinstance(settings, dict) else {},
        "revision": int(row["revision"]),
        "updated_at": row["updated_at"],
    }


def put_user_settings(user_id: str, settings: dict,
                      base_revision: int = 0) -> dict:
    sanitized = sanitize_user_settings(settings)
    encoded = json.dumps(
        sanitized, ensure_ascii=False, separators=(",", ":"), sort_keys=True
    )
    now = now_iso()
    with db() as c:
        c.execute("BEGIN IMMEDIATE")
        row = c.execute(
            "SELECT revision FROM user_settings WHERE user_id=?", (user_id,)
        ).fetchone()
        current_revision = int(row["revision"]) if row else 0
        if int(base_revision) != current_revision:
            raise AppError(
                409,
                "云端配置已在其他位置更新，请重新同步",
                "SETTINGS_REVISION_CONFLICT",
            )
        revision = current_revision + 1
        c.execute(
            """
            INSERT INTO user_settings(
                user_id,settings_json,revision,created_at,updated_at
            ) VALUES(?,?,?,?,?)
            ON CONFLICT(user_id) DO UPDATE SET
                settings_json=excluded.settings_json,
                revision=excluded.revision,
                updated_at=excluded.updated_at
            """,
            (user_id, encoded, revision, now, now),
        )
    return {
        "exists": True,
        "settings": sanitized,
        "revision": revision,
        "updated_at": now,
    }


def save_whobot_submission(user_id: str, record: dict, success: bool,
                           error_message: str = "") -> dict:
    """保存呼波特提交状态，为后续回调按 partnerClueId 关联人才。"""
    now = now_iso()
    status = "submitted" if success else "failed"
    submitted_at = now if success else None
    values = (
        record["partner_clue_id"], user_id, record["talent_id"],
        record["phone"], record.get("name", ""), record.get("position", ""),
        record.get("job_description", ""), record.get("pending_confirmation", ""),
        record.get("special_notes", ""), record.get("end_user", ""),
        record.get("candidate_issues", ""), record.get("company_name", ""),
        record.get("company_information", ""), record.get("first_sentence", ""),
        status, error_message[:500], submitted_at, now,
    )
    with db() as c:
        c.execute(
            """
            INSERT INTO whobot_clues(
                partner_clue_id,user_id,talent_id,phone,name,position,
                job_description,pending_confirmation,special_notes,end_user,
                candidate_issues,company_name,company_information,first_sentence,
                status,last_error,submitted_at,updated_at
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(user_id,talent_id) DO UPDATE SET
                partner_clue_id=excluded.partner_clue_id,
                phone=excluded.phone,
                name=excluded.name,
                position=excluded.position,
                job_description=excluded.job_description,
                pending_confirmation=excluded.pending_confirmation,
                special_notes=excluded.special_notes,
                end_user=excluded.end_user,
                candidate_issues=excluded.candidate_issues,
                company_name=excluded.company_name,
                company_information=excluded.company_information,
                first_sentence=excluded.first_sentence,
                status=excluded.status,
                last_error=excluded.last_error,
                submitted_at=COALESCE(excluded.submitted_at,whobot_clues.submitted_at),
                updated_at=excluded.updated_at
            """,
            values,
        )
        # 极端情况下回调可能先于提交记录到达；提交落库后立即补做关联。
        pending_call = c.execute(
            "SELECT payload FROM whobot_call_records "
            "WHERE context_id=? ORDER BY updated_at DESC LIMIT 1",
            (record["partner_clue_id"],),
        ).fetchone()
        if pending_call:
            try:
                callback = _map_whobot_callback(
                    json.loads(pending_call["payload"]), record
                )
            except (TypeError, json.JSONDecodeError):
                callback = None
            if callback:
                c.execute(
                    "UPDATE whobot_clues SET status='callback_received',"
                    "callback_payload=?,callback_updated_at=?,updated_at=? "
                    "WHERE partner_clue_id=?",
                    (
                        json.dumps(callback, ensure_ascii=False),
                        now, now, record["partner_clue_id"],
                    ),
                )
                c.execute(
                    "UPDATE whobot_call_records SET partner_clue_id=?,user_id=?,"
                    "talent_id=?,updated_at=? WHERE context_id=?",
                    (
                        record["partner_clue_id"], user_id, record["talent_id"],
                        now, record["partner_clue_id"],
                    ),
                )
    return get_whobot_record(user_id, record["talent_id"])


def claim_whobot_nonce(app_id: str, nonce: str, used_at: int,
                       ttl_seconds: int = 600) -> None:
    """原子登记回调 nonce；相同 nonce 只能成功一次，防止请求重放。"""
    if not nonce or len(nonce) > 200:
        raise AppError(400, "回调 nonce 无效", "WHOBOT_CALLBACK_INVALID_NONCE")
    now = int(time.time())
    with db() as c:
        c.execute("BEGIN IMMEDIATE")
        c.execute("DELETE FROM whobot_callback_nonces WHERE expires_at<=?", (now,))
        try:
            c.execute(
                "INSERT INTO whobot_callback_nonces(nonce,app_id,used_at,expires_at) "
                "VALUES(?,?,?,?)",
                (nonce, app_id, int(used_at), now + ttl_seconds),
            )
        except sqlite3.IntegrityError:
            raise AppError(
                409, "重复的回调请求", "WHOBOT_CALLBACK_REPLAY"
            )


def _dict_value(data: dict, key: str) -> str:
    value = data.get(key, "")
    return "" if value is None else str(value)


def _map_whobot_callback(payload: dict, clue=None) -> dict:
    """把话单字段整理成插件稳定使用的“初面反馈”结构，并保留原始扩展字段。"""
    clue_attr = payload.get("clueAttr")
    clue_attr = clue_attr if isinstance(clue_attr, dict) else {}
    intention_tag = payload.get("intentionTag")
    intention_tag = intention_tag if isinstance(intention_tag, dict) else {}
    chat_logs = payload.get("chatLogs")
    chat_logs = chat_logs if isinstance(chat_logs, list) else []

    def attr(name, fallback=""):
        value = clue_attr.get(name)
        if value is None or value == "":
            value = fallback
        return "" if value is None else str(value)

    clue_end_user = ""
    if clue is not None:
        try:
            clue_end_user = clue["end_user"] or ""
        except (KeyError, TypeError, IndexError):
            clue_end_user = ""

    return {
        "wechat_number": attr(
            "wechat_number", payload.get("wechatSeatPhone", "")
        ),
        "state_analysis": attr(
            "state_analysis", payload.get("summary", "")
        ),
        "reminder": attr("reminder"),
        "employment_status": attr("employment_status"),
        "skill_type": attr("skill_type"),
        "education_background": attr("education_background"),
        "work_location": attr("work_location"),
        "compensation_benefits": attr("compensation_benefits"),
        "key_summary": attr("key_summary", payload.get("summary", "")),
        "end_user": attr("end_user", clue_end_user),
        "call": {
            key: payload.get(key)
            for key in (
                "contextId", "callId", "phone", "caller", "position",
                "answerMainStatus", "answerStatus", "callMakeTime",
                "callRingTime", "callAnswerTime", "callHangupTime",
                "callDuration", "callDurationSeconds", "recordUrl", "summary",
                "wechatStatus", "wechatSeatName", "wechatSeatPhone",
                "intentionStatus", "intentionRank", "clueImportLabel",
                "hangupType", "sipStatus",
            )
        },
        "intention_tag": intention_tag,
        "clue_attr": clue_attr,
        "chat_logs": chat_logs,
    }


def save_whobot_call_record(payload: dict) -> dict:
    """保存呼波特电话话单，并按 contextId/partnerClueId 关联人才。"""
    if not isinstance(payload, dict):
        raise AppError(400, "回调数据必须是 JSON 对象",
                       "WHOBOT_CALLBACK_INVALID_BODY")
    context_id = _dict_value(payload, "contextId").strip()
    call_id = _dict_value(payload, "callId").strip()
    phone = _dict_value(payload, "phone").strip()
    if not context_id or not call_id:
        raise AppError(
            400, "回调缺少 contextId 或 callId",
            "WHOBOT_CALLBACK_MISSING_FIELDS",
        )
    now = now_iso()
    raw_payload = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    with db() as c:
        clue = c.execute(
            "SELECT * FROM whobot_clues WHERE partner_clue_id=?",
            (context_id,),
        ).fetchone()
        partner_clue_id = clue["partner_clue_id"] if clue else None
        user_id = clue["user_id"] if clue else None
        talent_id = clue["talent_id"] if clue else None
        c.execute(
            """
            INSERT INTO whobot_call_records(
                call_id,context_id,partner_clue_id,user_id,talent_id,phone,
                payload,received_at,updated_at
            ) VALUES(?,?,?,?,?,?,?,?,?)
            ON CONFLICT(call_id) DO UPDATE SET
                context_id=excluded.context_id,
                partner_clue_id=excluded.partner_clue_id,
                user_id=excluded.user_id,
                talent_id=excluded.talent_id,
                phone=excluded.phone,
                payload=excluded.payload,
                updated_at=excluded.updated_at
            """,
            (
                call_id, context_id, partner_clue_id, user_id, talent_id, phone,
                raw_payload, now, now,
            ),
        )
        callback = _map_whobot_callback(payload, clue)
        if clue:
            c.execute(
                "UPDATE whobot_clues SET status='callback_received',"
                "last_error='',callback_payload=?,callback_updated_at=?,"
                "updated_at=? WHERE partner_clue_id=?",
                (
                    json.dumps(callback, ensure_ascii=False),
                    now, now, context_id,
                ),
            )
    return {
        "ok": True,
        "matched": bool(clue),
        "call_id": call_id,
        "context_id": context_id,
    }


def get_whobot_record(user_id: str, talent_id: str):
    with db() as c:
        row = c.execute(
            "SELECT * FROM whobot_clues WHERE user_id=? AND talent_id=?",
            (user_id, talent_id),
        ).fetchone()
    return _whobot_record_dict(row) if row else None


def list_whobot_records(user_id: str) -> list:
    with db() as c:
        rows = c.execute(
            "SELECT * FROM whobot_clues WHERE user_id=? ORDER BY updated_at DESC",
            (user_id,),
        ).fetchall()
    return [_whobot_record_dict(row) for row in rows]


def _whobot_record_dict(row) -> dict:
    callback = None
    if row["callback_payload"]:
        try:
            callback = json.loads(row["callback_payload"])
        except (TypeError, json.JSONDecodeError):
            callback = None
    return {
        "partner_clue_id": row["partner_clue_id"],
        "talent_id": row["talent_id"],
        "phone": row["phone"],
        "name": row["name"] or "",
        "position": row["position"] or "",
        "job_description": row["job_description"] or "",
        "pending_confirmation": row["pending_confirmation"] or "",
        "special_notes": row["special_notes"] or "",
        "end_user": row["end_user"] or "",
        "candidate_issues": row["candidate_issues"] or "",
        "company_name": row["company_name"] or "",
        "company_information": row["company_information"] or "",
        "first_sentence": row["first_sentence"] or "",
        "status": row["status"],
        "last_error": row["last_error"] or "",
        "submitted_at": row["submitted_at"],
        "updated_at": row["updated_at"],
        "callback": callback,
        "callback_updated_at": row["callback_updated_at"],
    }


def get_or_create_user_by_email(email: str) -> dict:
    """后台按邮箱找用户，不存在则创建（用于人工开通会员）。"""
    with db() as c:
        row = c.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if row:
            return dict(row)
        uid = _insert_user_with_bonus(c, email)
    return {"id": uid, "email": email}


def admin_grant(email: str, plan_id: str, product_id: str = "prod_main") -> dict:
    """
    后台一键开通会员：确认收款后按邮箱给用户开通订阅。
    用户不存在会自动创建（对方之后用该邮箱登录即为 VIP）。
    """
    _, plan = plan_lookup(plan_id)
    if not plan:
        raise AppError(404, "套餐不存在")
    user = get_or_create_user_by_email(email)
    sub = subscribe(user["id"], product_id, plan_id)
    return {"ok": True, "email": email, "plan_id": plan_id,
            "plan_name": plan["name"], "ends_at": sub["ends_at"]}


def find_user_by_email(email: str):
    with db() as c:
        row = c.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    return dict(row) if row else None


def admin_extend(email: str, days: int) -> dict:
    """后台手动延长会员：在当前有效会员的到期时间上加 N 天。"""
    days = int(days)
    if days <= 0:
        raise AppError(400, "延长天数需大于 0")
    user = find_user_by_email(email)
    if not user:
        raise AppError(404, "用户不存在")
    with db() as c:
        row = c.execute("SELECT * FROM subscriptions WHERE user_id=? AND status='active' "
                        "ORDER BY ends_at DESC", (user["id"],)).fetchone()
        if not row:
            raise AppError(400, "该用户当前无有效会员，请先开通")
        base = datetime.fromisoformat(row["ends_at"])
        now = datetime.now(timezone.utc)
        if base < now:            # 已过期则从现在算起
            base = now
        new_ends = base + timedelta(days=days)
        c.execute("UPDATE subscriptions SET ends_at=? WHERE id=?",
                  (new_ends.isoformat(), row["id"]))
    return {"ok": True, "email": email, "ends_at": new_ends.isoformat()}


def admin_cancel(email: str) -> dict:
    """后台取消会员：把当前有效订阅置为已取消（用户随即降为免费版）。"""
    user = find_user_by_email(email)
    if not user:
        raise AppError(404, "用户不存在")
    with db() as c:
        n = c.execute("UPDATE subscriptions SET status='cancelled' "
                      "WHERE user_id=? AND status='active'", (user["id"],)).rowcount
    if not n:
        raise AppError(400, "该用户当前无有效会员")
    return {"ok": True, "email": email}


def admin_list_users():
    """后台查看所有用户及其当前订阅状态与点数余额。"""
    with db() as c:
        users = c.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
    out = []
    for u in users:
        subs = user_subscriptions(u["id"])
        active = next((s for s in subs if s["status"] == "active"), None)
        out.append({"email": u["email"], "created_at": u["created_at"],
                    "is_vip": bool(active),
                    "plan_type": active["plan_type"] if active else "",
                    "ends_at": active["ends_at"] if active else "",
                    "balance_points": _milli_to_points(u["balance_milli"])})
    return out


def subscribe(user_id: str, product_id: str, plan_id: str) -> dict:
    prod, plan = plan_lookup(plan_id)
    if not plan:
        raise AppError(404, "套餐不存在")
    now = datetime.now(timezone.utc)
    sub_id = "sub_" + secrets.token_hex(8)
    with db() as c:
        current = c.execute(
            "SELECT ends_at FROM subscriptions WHERE user_id=? AND status='active' "
            "ORDER BY ends_at DESC LIMIT 1", (user_id,)
        ).fetchone()
        base = now
        if current and current["ends_at"]:
            try:
                current_end = datetime.fromisoformat(current["ends_at"])
                if current_end.tzinfo is None:
                    current_end = current_end.replace(tzinfo=timezone.utc)
                if current_end > now:
                    base = current_end
            except (TypeError, ValueError):
                pass
        ends = base + timedelta(days=plan["duration_days"])
        c.execute("UPDATE subscriptions SET status='replaced' WHERE user_id=? AND status='active'",
                  (user_id,))
        c.execute("INSERT INTO subscriptions(id,user_id,product_id,plan_id,plan_type,status,starts_at,ends_at)"
                  " VALUES(?,?,?,?,?,?,?,?)",
                  (sub_id, user_id, product_id, plan_id, plan["plan_type"], "active",
                   now.isoformat(), ends.isoformat()))
    return {"id": sub_id, "status": "active", "plan_id": plan_id,
            "plan_type": plan["plan_type"], "ends_at": ends.isoformat()}


# ── 计费（点数）────────────────────────────────────
# 双闸门顺序：订阅有效（插件侧既有校验）→ 点数余额（本模块）。
# 决策要点：先放行后扣费（允许透支为负）、余额<=0 才拒绝新调用、
# 日上限防失控、token 与单价永远不出后端（用户端接口只给点数）。


def _points_to_milli(points) -> int:
    return int(round(float(points) * 1000))


def _milli_to_points(milli) -> float:
    return round(int(milli or 0) / 1000, 2)


def tokens_to_milli(prompt_tokens, completion_tokens) -> int:
    """真实 token 用量 → 毫点（混合价，输入输出不分，向上取整不让微小调用免费）。"""
    total = max(0, int(prompt_tokens or 0)) + max(0, int(completion_tokens or 0))
    return -(-total * 1000 // BILLING_TOKENS_PER_POINT)


def _insert_point_tx(c, user_id, delta_milli, balance_after_milli, kind,
                     scene=None, prompt_tokens=None, completion_tokens=None,
                     ref_id=None, note=None):
    c.execute(
        "INSERT INTO point_transactions(id,user_id,delta_milli,balance_after_milli,"
        "kind,scene,prompt_tokens,completion_tokens,ref_id,note,created_at)"
        " VALUES(?,?,?,?,?,?,?,?,?,?,?)",
        ("ptx_" + secrets.token_hex(12), user_id, int(delta_milli),
         int(balance_after_milli), kind, scene, prompt_tokens, completion_tokens,
         ref_id, note, now_iso()))


def _insert_user_with_bonus(c, email: str) -> str:
    """创建用户并发放注册体验点（须在事务内调用，保证用户与流水同生共死）。"""
    uid = "u_" + secrets.token_hex(8)
    bonus = _points_to_milli(BILLING_SIGNUP_BONUS_POINTS)
    c.execute("INSERT INTO users(id, email, created_at, balance_milli) VALUES(?,?,?,?)",
              (uid, email, now_iso(), bonus))
    if bonus:
        _insert_point_tx(c, uid, bonus, bonus, "signup_bonus", note="新用户体验点")
    return uid


def get_balance(user_id: str) -> dict:
    """余额 + 今日/本月消耗（按北京时间分桶，客户都在东八区）+ 预警级别。"""
    with db() as c:
        row = c.execute("SELECT balance_milli FROM users WHERE id=?",
                        (user_id,)).fetchone()
        if not row:
            raise AppError(404, "用户不存在")
        balance = int(row["balance_milli"])
        today = c.execute(
            "SELECT COALESCE(SUM(-delta_milli),0) s FROM point_transactions "
            "WHERE user_id=? AND kind='consume' "
            "AND date(created_at,'+8 hours')=date('now','+8 hours')",
            (user_id,)).fetchone()["s"]
        month = c.execute(
            "SELECT COALESCE(SUM(-delta_milli),0) s FROM point_transactions "
            "WHERE user_id=? AND kind='consume' "
            "AND strftime('%Y-%m',created_at,'+8 hours')=strftime('%Y-%m','now','+8 hours')",
            (user_id,)).fetchone()["s"]
    if balance <= 0:
        warn = "exhausted"
    elif balance < _points_to_milli(BILLING_WARN_HARD_POINTS):
        warn = "hard"
    elif balance < _points_to_milli(BILLING_WARN_SOFT_POINTS):
        warn = "soft"
    else:
        warn = "none"
    return {
        "balance_milli": balance,
        "balance_points": _milli_to_points(balance),
        "today_consume_milli": int(today),
        "today_consume_points": _milli_to_points(today),
        "month_consume_points": _milli_to_points(month),
        "warn_level": warn,
    }


def check_llm_allowance(user_id: str, scene: str) -> dict:
    """LLM 代理转发前的计费闸门：余额<=0 或当日消耗达上限则拒绝（fail-closed）。"""
    if scene not in BILLING_SCENES:
        raise AppError(400, "未知的计费场景", "BILLING_INVALID_SCENE")
    bal = get_balance(user_id)
    if bal["balance_milli"] <= 0:
        raise AppError(402, "点数余额不足，请充值后继续使用",
                       "BILLING_INSUFFICIENT_BALANCE")
    daily_milli = _points_to_milli(BILLING_DAILY_LIMIT_POINTS)
    if daily_milli > 0 and bal["today_consume_milli"] >= daily_milli:
        raise AppError(429, "今日用量已达上限，明日自动恢复",
                       "BILLING_DAILY_LIMIT")
    return bal


def record_llm_usage(user_id: str, scene: str, prompt_tokens, completion_tokens,
                     ref_id=None, note=None) -> dict:
    """LLM 调用完成后按真实用量扣点。扣费时余额不足也照常放行（可透支为负），
    下次调用会被 check_llm_allowance 拦住。"""
    if scene not in BILLING_SCENES:
        raise AppError(400, "未知的计费场景", "BILLING_INVALID_SCENE")
    charged = tokens_to_milli(prompt_tokens, completion_tokens)
    with db() as c:
        c.execute("BEGIN IMMEDIATE")
        row = c.execute("SELECT balance_milli FROM users WHERE id=?",
                        (user_id,)).fetchone()
        if not row:
            raise AppError(404, "用户不存在")
        new_balance = int(row["balance_milli"]) - charged
        c.execute("UPDATE users SET balance_milli=? WHERE id=?",
                  (new_balance, user_id))
        _insert_point_tx(
            c, user_id, -charged, new_balance, "consume", scene=scene,
            prompt_tokens=int(prompt_tokens or 0),
            completion_tokens=int(completion_tokens or 0),
            ref_id=ref_id, note=note)
    return {"charged_milli": charged, "charged_points": _milli_to_points(charged),
            "balance_milli": new_balance,
            "balance_points": _milli_to_points(new_balance)}


def list_point_transactions(user_id: str, limit: int = 50, offset: int = 0) -> dict:
    """用户端明细：只给点数与场景，token 数与单价永不出后端。"""
    limit = max(1, min(int(limit), 200))
    offset = max(0, int(offset))
    with db() as c:
        rows = c.execute(
            "SELECT * FROM point_transactions WHERE user_id=? "
            "ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (user_id, limit, offset)).fetchall()
        total = c.execute(
            "SELECT COUNT(*) n FROM point_transactions WHERE user_id=?",
            (user_id,)).fetchone()["n"]
    items = [{
        "id": r["id"],
        "kind": r["kind"],
        "scene": r["scene"],
        "delta_points": _milli_to_points(r["delta_milli"]),
        "balance_after_points": _milli_to_points(r["balance_after_milli"]),
        "created_at": r["created_at"],
    } for r in rows]
    return {"items": items, "total": total}


def admin_recharge(email: str, points, note: str = "") -> dict:
    """人工充值：确认收款后按邮箱加点。用户不存在会自动创建（同开通会员动线）。"""
    milli = _points_to_milli(points)
    if milli <= 0:
        raise AppError(400, "充值点数需大于 0")
    user = get_or_create_user_by_email(email)
    now = now_iso()
    order_id = "rpo_" + secrets.token_hex(12)
    with db() as c:
        c.execute("BEGIN IMMEDIATE")
        row = c.execute("SELECT balance_milli FROM users WHERE id=?",
                        (user["id"],)).fetchone()
        new_balance = int(row["balance_milli"]) + milli
        c.execute("UPDATE users SET balance_milli=? WHERE id=?",
                  (new_balance, user["id"]))
        c.execute(
            "INSERT INTO recharge_orders(id,user_id,amount_cents,points_milli,"
            "status,channel,note,created_at,completed_at) VALUES(?,?,?,?,?,?,?,?,?)",
            (order_id, user["id"], _points_to_milli(float(points)) // 100,
             milli, "completed", "admin_manual", (note or "")[:200], now, now))
        _insert_point_tx(c, user["id"], milli, new_balance, "recharge",
                         ref_id=order_id, note=(note or "")[:200])
    return {"ok": True, "email": email, "order_id": order_id,
            "points": _milli_to_points(milli),
            "balance_points": _milli_to_points(new_balance)}


def admin_list_point_transactions(email: str, limit: int = 100,
                                  offset: int = 0) -> dict:
    """管理端明细：含 token 数（纠纷排查证据链），仅 X-Admin-Key 可达。"""
    user = find_user_by_email(email)
    if not user:
        raise AppError(404, "用户不存在")
    limit = max(1, min(int(limit), 500))
    offset = max(0, int(offset))
    with db() as c:
        rows = c.execute(
            "SELECT * FROM point_transactions WHERE user_id=? "
            "ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (user["id"], limit, offset)).fetchall()
    items = [{
        "id": r["id"], "kind": r["kind"], "scene": r["scene"],
        "delta_points": _milli_to_points(r["delta_milli"]),
        "balance_after_points": _milli_to_points(r["balance_after_milli"]),
        "prompt_tokens": r["prompt_tokens"],
        "completion_tokens": r["completion_tokens"],
        "ref_id": r["ref_id"], "note": r["note"] or "",
        "created_at": r["created_at"],
    } for r in rows]
    return {"email": email, "items": items,
            "balance_points": _milli_to_points(user["balance_milli"])}


# ── LLM 托管代理（决策 7：打分走服务端模板，回复判断走透传+钳制）────
# 提示词从插件原样搬运（sw.js 手动打分 / resume-collector.mjs 入库打分），
# 联系方式脱敏与插件 maskContacts() 完全同规则；扣费按上游真实 usage。
# 计费诚信底线：上游没给 usage = 视为异常，宁可失败不白给（LLM_USAGE_MISSING）。

LLM_CHAT_SCENES = {"reply_judge", "collect_extract"}   # 透传端点允许的场景
LLM_SCORE_DETAIL_SCENE = {"full": "resume_score", "brief": "collect_score"}
LLM_MSG_MAX_ITEMS = 10
LLM_MSG_MAX_CHARS = 20000      # 单条消息上限
LLM_MSG_TOTAL_CHARS = 40000    # 整组消息上限
LLM_TEXT_MAX_CHARS = 16000     # 简历/JD 文本上限（与插件 slice(0,16000) 一致）
LLM_CHAT_DEFAULT_MAX_TOKENS = 800

# 打分维度（与 sw.js DEFAULT_DIMENSIONS 一致）
LLM_SCORE_DIMENSIONS = [
    {"key": "match", "label": "岗位匹配度", "weight": 35},
    {"key": "experience", "label": "工作经验", "weight": 25},
    {"key": "skill", "label": "技能匹配", "weight": 20},
    {"key": "education", "label": "学历背景", "weight": 10},
    {"key": "stability", "label": "稳定性", "weight": 10},
]

# 进程内滑动窗口限流（单进程 uvicorn 部署下有效，重启即清零，与验证码防爆破同模式）
_llm_rate_windows = {}
_llm_rate_lock = threading.Lock()


def require_vip(user_id: str) -> None:
    """双闸门第一级：有效订阅（fail-closed）。"""
    for s in user_subscriptions(user_id):
        if s["status"] == "active":
            return
    raise AppError(403, "大模型功能需要有效会员，请先开通", "SUBSCRIPTION_REQUIRED")


def _rate_limit_llm(user_id: str) -> None:
    now = time.time()
    with _llm_rate_lock:
        win = [t for t in _llm_rate_windows.get(user_id, []) if now - t < 60]
        if len(win) >= LLM_RATE_LIMIT_PER_MIN:
            raise AppError(429, "调用过于频繁，请稍后再试", "LLM_RATE_LIMIT")
        win.append(now)
        _llm_rate_windows[user_id] = win


def _mask_contacts(text: str) -> str:
    """与插件 resume-collector.mjs maskContacts() 同规则：电话/邮箱不进模型。"""
    text = re.sub(r"(?:\+?[\s-]*8[\s-]*6[\s-]*)?1[\s-]*[3-9](?:[\s-]*\d){9}",
                  "[手机号已在本地提取]", text)
    text = re.sub(
        r"[A-Z0-9._%+-]+(?:\s*[A-Z0-9._%+-])*\s*@\s*[A-Z0-9-]+"
        r"(?:\s*[A-Z0-9-])*\s*\.\s*[A-Z](?:\s*[A-Z])+",
        "[邮箱已在本地提取]", text, flags=re.I)
    return text


def _validate_chat_messages(messages) -> list:
    """透传端点的消息形态钳制：数量/角色/长度全卡，多余字段丢弃。"""
    if not isinstance(messages, list) or not (1 <= len(messages) <= LLM_MSG_MAX_ITEMS):
        raise AppError(400, "messages 须为 1-10 条的消息数组", "LLM_BAD_MESSAGES")
    total = 0
    out = []
    for m in messages:
        if not isinstance(m, dict):
            raise AppError(400, "消息条目须为对象", "LLM_BAD_MESSAGES")
        role = m.get("role")
        content = m.get("content")
        if role not in ("system", "user", "assistant"):
            raise AppError(400, f"不支持的消息角色: {role}", "LLM_BAD_MESSAGES")
        if not isinstance(content, str) or not content.strip():
            raise AppError(400, "消息 content 须为非空字符串", "LLM_BAD_MESSAGES")
        if len(content) > LLM_MSG_MAX_CHARS:
            raise AppError(400, "单条消息过长", "LLM_BAD_MESSAGES")
        total += len(content)
        out.append({"role": role, "content": content})
    if total > LLM_MSG_TOTAL_CHARS:
        raise AppError(400, "消息总长度超限", "LLM_BAD_MESSAGES")
    return out


def _call_upstream(messages: list, max_tokens: int, temperature: float):
    """调 dashscope OpenAI 兼容端点（非流式）。
    返回 (content, prompt_tokens, completion_tokens)。
    网络/HTTP 失败 → 502 不扣费；usage 缺失 → 502 不扣费（计费诚信，宁败不送）。"""
    if not DASHSCOPE_API_KEY:
        raise AppError(503, "服务端大模型未配置", "LLM_NOT_CONFIGURED")
    url = LLM_BASE_URL.rstrip("/") + "/chat/completions"
    body = json.dumps({
        "model": LLM_MODEL,
        "temperature": temperature,
        "stream": False,          # 决策：三出口均非流式，usage 才可靠
        "max_tokens": max_tokens,  # 服务端封顶，插件说了不算
        "messages": messages,
    }).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer " + DASHSCOPE_API_KEY,
    })
    try:
        with urllib.request.urlopen(req, timeout=LLM_TIMEOUT_SECONDS) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = e.read().decode("utf-8")[:200]
        except Exception:
            pass
        raise AppError(502, f"上游模型调用失败（HTTP {e.code}）: {detail}",
                       "LLM_UPSTREAM_ERROR")
    except Exception:
        raise AppError(502, "上游模型连接失败或超时", "LLM_UPSTREAM_ERROR")
    usage = data.get("usage") or {}
    prompt_tokens = usage.get("prompt_tokens")
    completion_tokens = usage.get("completion_tokens")
    if prompt_tokens is None or completion_tokens is None:
        raise AppError(502, "上游未返回用量，本次不计费", "LLM_USAGE_MISSING")
    try:
        content = data["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError):
        raise AppError(502, "上游返回结构异常", "LLM_UPSTREAM_ERROR")
    return content, int(prompt_tokens), int(completion_tokens)


def _llm_done(user_id: str, scene: str, prompt_tokens: int,
              completion_tokens: int, note=None) -> dict:
    """扣费 + 附当前余额/预警（前端只见点数，不见 token）。"""
    bill = record_llm_usage(user_id, scene, prompt_tokens, completion_tokens,
                            note=note)
    bal = get_balance(user_id)
    return {"balance_points": bill["balance_points"],
            "warn_level": bal["warn_level"]}


def llm_chat(user_id: str, scene: str, messages, max_tokens=None,
             temperature=None) -> dict:
    """透传+钳制：回复判断/采集提取等"提示词留在插件"的场景。
    双闸门顺序：订阅 → 余额/日上限 → 每分钟限流。"""
    if scene not in LLM_CHAT_SCENES:
        raise AppError(400, "未知的计费场景", "BILLING_INVALID_SCENE")
    msgs = _validate_chat_messages(messages)
    require_vip(user_id)
    check_llm_allowance(user_id, scene)
    _rate_limit_llm(user_id)
    mt = LLM_CHAT_DEFAULT_MAX_TOKENS if not max_tokens else int(max_tokens)
    mt = max(1, min(mt, LLM_MAX_TOKENS_CAP))
    temp = 0.3 if temperature is None else max(0.0, min(float(temperature), 1.0))
    content, pt, ct = _call_upstream(msgs, mt, temp)
    done = _llm_done(user_id, scene, pt, ct)
    return {"ok": True, "content": content, **done}


def _score_prompt_full(jd: str, dimensions) -> str:
    """与 sw.js buildSystemPrompt() 逐字一致。"""
    dim_text = "\n".join(
        f"- {d['label']}（key={d['key']}，权重 {d['weight']}%）"
        for d in dimensions)
    return "\n".join([
        "你是一名资深招聘专家。下面是从简历页面 canvas 抓取的候选人文本，",
        "文字顺序可能错乱、有碎片，请先重排、结构化，再依据岗位要求打分。",
        "",
        "【岗位要求 / JD】",
        jd or "（未提供，按通用标准评估）",
        "",
        "【评分维度】",
        dim_text,
        "",
        "【输出要求】严格只输出 JSON，不要多余文字、不要代码块包裹：",
        '{"overall":<0-100整数,按权重加权>,"dimensions":[{"key":"...","label":"...",'
        '"score":<0-100>,"reason":"一句话依据"}],"highlights":["亮点"],'
        '"risks":["风险"],"recommendation":"强烈推荐|推荐|一般|不推荐",'
        '"summary":"两三句总评"}',
    ])


def _score_prompt_brief(jd: str) -> str:
    """与 resume-collector.mjs buildScorePrompt() 逐字一致。"""
    return "\n".join([
        "你是资深招聘专家。下面是从简历页面抓取的候选人文本，顺序可能错乱、有碎片，",
        "请先重排、结构化，再依据岗位要求打分。",
        "",
        "【岗位要求 / JD】",
        jd or "（未提供，按通用标准评估）",
        "",
        "严格只输出 JSON，不要多余文字、不要代码块包裹：",
        '{"overall":<0-100整数>,"recommendation":"强烈推荐|推荐|一般|不推荐",'
        '"summary":"两三句总评"}',
    ])


def _parse_llm_json(text: str) -> dict:
    """与插件 parseJson/parseJsonObject 同逻辑：去代码块、取首尾大括号。"""
    if not text:
        raise AppError(502, "模型返回为空", "LLM_BAD_RESPONSE")
    s = re.sub(r"^```(?:json)?", "", text.strip(), flags=re.I).strip()
    s = re.sub(r"```$", "", s).strip()
    a, b = s.find("{"), s.rfind("}")
    if a != -1 and b != -1:
        s = s[a:b + 1]
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        raise AppError(502, "模型未返回有效 JSON", "LLM_BAD_RESPONSE")


def _valid_dimensions(dimensions) -> list:
    """自定义维度校验（与插件 payload.dimensions 同形）；非法则回落默认。"""
    if not isinstance(dimensions, list) or not dimensions:
        return LLM_SCORE_DIMENSIONS
    out = []
    for d in dimensions[:8]:
        if not isinstance(d, dict):
            return LLM_SCORE_DIMENSIONS
        key = str(d.get("key", ""))[:30]
        label = str(d.get("label", ""))[:30]
        try:
            weight = int(d.get("weight"))
        except (TypeError, ValueError):
            return LLM_SCORE_DIMENSIONS
        if not key or not label or not (0 < weight <= 100):
            return LLM_SCORE_DIMENSIONS
        out.append({"key": key, "label": label, "weight": weight})
    return out or LLM_SCORE_DIMENSIONS


def llm_score_resume(user_id: str, jd_text: str, resume_text: str,
                     detail: str = "full", dimensions=None) -> dict:
    """服务端模板打分：插件只传 jd_text+resume_text，提示词这里组装。
    detail=full（手动打分页，带维度）/ brief（入库自动打分，简版省 token）。"""
    if detail not in LLM_SCORE_DETAIL_SCENE:
        raise AppError(400, "detail 须为 full 或 brief", "LLM_BAD_DETAIL")
    resume_text = (resume_text or "").strip()
    if len(resume_text) < 20:
        raise AppError(400, "简历文本为空或过短，可能未成功抓取到内容",
                       "LLM_RESUME_TOO_SHORT")
    scene = LLM_SCORE_DETAIL_SCENE[detail]
    require_vip(user_id)
    check_llm_allowance(user_id, scene)
    _rate_limit_llm(user_id)
    jd = (jd_text or "")[:LLM_TEXT_MAX_CHARS]
    masked = _mask_contacts(resume_text)[:LLM_TEXT_MAX_CHARS]
    if detail == "full":
        sys_prompt = _score_prompt_full(jd, _valid_dimensions(dimensions))
        user_content = "【候选人简历文本】\n" + masked
        max_tokens, temp = 2000, 0.3
    else:
        sys_prompt = _score_prompt_brief(jd)
        user_content = masked
        max_tokens, temp = 500, 0.2
    content, pt, ct = _call_upstream(
        [{"role": "system", "content": sys_prompt},
         {"role": "user", "content": user_content}],
        max_tokens, temp)
    result = _parse_llm_json(content)
    overall = result.get("overall")
    if not isinstance(overall, (int, float)):
        raise AppError(502, "模型返回缺少 overall 评分", "LLM_BAD_RESPONSE")
    # 解析失败不扣费（上面两处 raise 在扣费之前）：用户买不到空气，
    # 上游成本公司承担；坏输出没有套利价值，不构成滥用缺口。
    result["overall"] = max(0, min(100, int(overall)))
    done = _llm_done(user_id, scene, pt, ct)
    return {"ok": True, "result": result, **done}
