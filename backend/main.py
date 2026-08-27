"""
凯旋智聘 —— 后端 API 入口（FastAPI）

只做 HTTP 路由 + 参数校验，业务逻辑全在 core.py（可独立测试）。
路由前缀 /api/v1，与插件调用的接口一一对应。

运行：
  pip install -r requirements.txt
  uvicorn main:app --host 0.0.0.0 --port 8080
文档：http://localhost:8080/docs
"""
import hmac
import json
import os
import re
from typing import Optional
from fastapi import FastAPI, Depends, Header, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field

import core
import whobot
import whobot_callback

ADMIN_HTML = os.path.join(os.path.dirname(__file__), "admin.html")
PRIVACY_HTML = os.path.join(os.path.dirname(__file__), "privacy.html")

API = "/api/v1"
app = FastAPI(title="凯旋智聘 API", version="1.5.0")
# 仅放行扩展自身源（chrome-extension://<id>，客户安装版 ID 各不相同）与本地开发源。
# 后端只被扩展 SW/侧栏及同源 /docs 调用，content script 不直连后端。
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=(
        r"^(chrome-extension://[a-p]{32}"
        r"|https?://(localhost|127\.0\.0\.1)(:\d+)?)$"
    ),
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Authorization", "Content-Type", "X-Device-Id", "X-Admin-Key"],
)
core.init_db()
core.assert_production_secrets()   # 生产模式下若仍用默认密钥/口令则拒绝启动

# HTTPBearer 让 /docs 出现绿色 "Authorize 🔒" 按钮，
# 点一次粘贴 token（不含 Bearer 前缀），所有登录接口自动带上。
bearer_scheme = HTTPBearer(auto_error=False)


# 把 core.AppError 统一转成 HTTP 响应（前端 $t 读 detail 字段）
@app.exception_handler(core.AppError)
async def _app_error(_req, exc: core.AppError):
    return JSONResponse(
        status_code=exc.status,
        # detail 保留兼容旧版插件，code/message 供新版做稳定分支判断。
        content={"detail": exc.message, "message": exc.message, "code": exc.code},
    )


def auth_user(
    cred: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    x_device_id: str = Header(None, alias="X-Device-Id"),
):
    token = f"Bearer {cred.credentials}" if cred else None
    return core.user_from_bearer(token, x_device_id)


class SendCodeReq(BaseModel):
    email: EmailStr


class VerifyCodeReq(BaseModel):
    email: EmailStr
    code: str
    device_id: str
    force_login: bool = False


class RefreshReq(BaseModel):
    refresh_token: str
    device_id: str


class AdminGrantReq(BaseModel):
    email: EmailStr
    plan_id: str


class AdminExtendReq(BaseModel):
    email: EmailStr
    days: int


class AdminCancelReq(BaseModel):
    email: EmailStr


class WhobotClueReq(BaseModel):
    talent_id: str = Field(min_length=1, max_length=160)
    name: str = Field(default="", max_length=120)
    phone: str = Field(min_length=1, max_length=40)
    position: str = Field(default="", max_length=200)
    job_description: str = Field(default="", max_length=5000)
    pending_confirmation: str = Field(default="", max_length=500)
    special_notes: str = Field(default="", max_length=2000)
    end_user: str = Field(default="", max_length=200)
    candidate_issues: str = Field(default="", max_length=2000)
    company_name: str = Field(default="", max_length=120)
    company_information: str = Field(default="", max_length=2000)
    first_sentence: str = Field(default="", max_length=500)


class UserSettingsReq(BaseModel):
    settings: dict
    base_revision: int = Field(default=0, ge=0)


class AdminRechargeReq(BaseModel):
    email: EmailStr
    points: float = Field(gt=0, le=100000)
    note: str = Field(default="", max_length=200)


class LlmChatReq(BaseModel):
    scene: str = Field(min_length=1, max_length=40)
    messages: list
    max_tokens: Optional[int] = Field(default=None, ge=1)
    temperature: Optional[float] = Field(default=None, ge=0, le=2)


class LlmScoreReq(BaseModel):
    jd_text: str = Field(default="", max_length=8000)
    resume_text: str = Field(min_length=1, max_length=30000)
    detail: str = Field(default="full", pattern="^(full|brief)$")
    dimensions: Optional[list] = None


def require_admin(x_admin_key: str = Header(None)):
    # 恒定时间比较，避免口令被逐字节时序探测；None 统一按空串处理。
    provided = (x_admin_key or "").encode("utf-8")
    expected = (core.ADMIN_KEY or "").encode("utf-8")
    if not hmac.compare_digest(provided, expected):
        raise core.AppError(401, "后台口令错误")
    return True


@app.post(API + "/auth/send-code")
def r_send_code(req: SendCodeReq):
    return core.send_code(req.email)


@app.post(API + "/auth/verify-code")
def r_verify_code(req: VerifyCodeReq):
    return core.verify_code(req.email, req.code, req.device_id, req.force_login)


@app.post(API + "/auth/refresh")
def r_refresh(req: RefreshReq):
    return core.refresh_token(req.refresh_token, req.device_id)


@app.post(API + "/auth/logout")
def r_logout(user: dict = Depends(auth_user)):
    return core.logout(user["id"], user["_session_id"])


@app.post(API + "/auth/heartbeat")
def r_heartbeat(user: dict = Depends(auth_user)):
    return core.heartbeat(user["id"], user["_session_id"])


@app.get(API + "/users/me")
def r_users_me(user: dict = Depends(auth_user)):
    return core.users_me(user)


@app.get(API + "/users/me/settings")
def r_get_user_settings(user: dict = Depends(auth_user)):
    return core.get_user_settings(user["id"])


@app.put(API + "/users/me/settings")
def r_put_user_settings(
    req: UserSettingsReq, user: dict = Depends(auth_user)
):
    return core.put_user_settings(
        user["id"], req.settings, req.base_revision
    )


@app.get(API + "/products")
def r_products():
    return {"products": core.PRODUCTS}


# ── 点数计费（用户端只看点数，token 永不出后端）────────
@app.get(API + "/billing/balance")
def r_billing_balance(user: dict = Depends(auth_user)):
    return core.get_balance(user["id"])


@app.get(API + "/billing/transactions")
def r_billing_transactions(limit: int = 50, offset: int = 0,
                           user: dict = Depends(auth_user)):
    return core.list_point_transactions(user["id"], limit, offset)


# ── LLM 托管代理（双闸门：订阅 → 点数；密钥只在服务器）────
@app.post(API + "/llm/chat")
def r_llm_chat(req: LlmChatReq, user: dict = Depends(auth_user)):
    return core.llm_chat(user["id"], req.scene, req.messages,
                         req.max_tokens, req.temperature)


@app.post(API + "/llm/score-resume")
def r_llm_score_resume(req: LlmScoreReq, user: dict = Depends(auth_user)):
    return core.llm_score_resume(user["id"], req.jd_text, req.resume_text,
                                 req.detail, req.dimensions)


# ── 呼波特人才线索集成（凭当前插件登录会话）────────────
@app.get(API + "/integrations/whobot/status")
def r_whobot_status(user: dict = Depends(auth_user)):
    result = whobot.check_token()
    return {"configured": True, "connected": True,
            "callback_configured": whobot_callback.configured(),
            "message": result.get("errMsg", "success")}


@app.post(API + "/integrations/whobot/clues")
def r_whobot_submit(req: WhobotClueReq, user: dict = Depends(auth_user)):
    phone = re.sub(r"\D", "", req.phone)
    if phone.startswith("86") and len(phone) == 13:
        phone = phone[2:]
    if not re.fullmatch(r"1[3-9]\d{9}", phone):
        raise core.AppError(400, "呼波特上报需要有效的中国大陆手机号",
                            "WHOBOT_INVALID_PHONE")
    safe_talent_id = re.sub(r"[^A-Za-z0-9_-]", "_", req.talent_id)[:80]
    partner_clue_id = f"kxzp_{user['id']}_{safe_talent_id}"[:120]
    record = {
        "partner_clue_id": partner_clue_id,
        "talent_id": req.talent_id,
        "phone": phone,
        "name": req.name.strip(),
        "position": req.position.strip(),
        "job_description": req.job_description.strip(),
        "pending_confirmation": req.pending_confirmation.strip(),
        "special_notes": req.special_notes.strip(),
        "end_user": req.end_user.strip() or user["email"],
        "candidate_issues": req.candidate_issues.strip(),
        "company_name": req.company_name.strip(),
        "company_information": req.company_information.strip(),
        "first_sentence": req.first_sentence.strip(),
    }
    # 呼波特要求自定义线索属性全部使用字符串。
    clue = {
        "partnerClueId": partner_clue_id,
        "phone": phone,
        "name": str(record["name"]),
        "position": str(record["position"]),
        "job_description": str(record["job_description"]),
        "pending_confirmation": str(record["pending_confirmation"]),
        "special_notes": str(record["special_notes"]),
        "end_user": str(record["end_user"]),
        "candidate_issues": str(record["candidate_issues"]),
        "company_name": str(record["company_name"]),
        "company_information": str(record["company_information"]),
        "first_sentence": str(record["first_sentence"]),
    }
    try:
        result = whobot.submit_clue(clue)
    except core.AppError as exc:
        core.save_whobot_submission(user["id"], record, False, exc.message)
        raise
    saved = core.save_whobot_submission(user["id"], record, True)
    return {"ok": True, "message": result.get("errMsg", "success"),
            "record": saved}


@app.get(API + "/integrations/whobot/records")
def r_whobot_records(user: dict = Depends(auth_user)):
    return {"records": core.list_whobot_records(user["id"])}


@app.post(API + "/integrations/whobot/callback")
async def r_whobot_callback(
    request: Request,
    x_app_id: str = Header(None, alias="X-App-Id"),
    x_timestamp: str = Header(None, alias="X-Timestamp"),
    x_nonce: str = Header(None, alias="X-Nonce"),
    x_sign: str = Header(None, alias="X-Sign"),
    x_sign_method: str = Header("md5", alias="X-Sign-Method"),
):
    # 必须先读取原始 Body 验签，不能先让 Pydantic/JSON 改写空格或字段顺序。
    raw_bytes = await request.body()
    if len(raw_bytes) > whobot_callback.MAX_BODY_BYTES:
        raise core.AppError(
            413, "回调请求体过大", "WHOBOT_CALLBACK_BODY_TOO_LARGE"
        )
    try:
        raw_body = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise core.AppError(
            400, "回调请求体必须使用 UTF-8", "WHOBOT_CALLBACK_INVALID_ENCODING"
        )
    timestamp_int = whobot_callback.verify(
        x_app_id, x_timestamp, x_nonce, x_sign, x_sign_method, raw_body
    )
    # 只在签名成功后占用 nonce，避免伪造请求提前污染防重放记录。
    core.claim_whobot_nonce(x_app_id, x_nonce, timestamp_int)
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        raise core.AppError(
            400, "回调请求体不是有效 JSON", "WHOBOT_CALLBACK_INVALID_BODY"
        )
    core.save_whobot_call_record(payload)
    # 仅做本地数据库写入后立即返回，避免超过呼波特默认 5 秒超时。
    return {"ok": True}


# ── 后台管理（凭 X-Admin-Key 口令）──────────────────
@app.post(API + "/admin/grant")
def r_admin_grant(req: AdminGrantReq, _: bool = Depends(require_admin)):
    return core.admin_grant(req.email, req.plan_id)


@app.post(API + "/admin/extend")
def r_admin_extend(req: AdminExtendReq, _: bool = Depends(require_admin)):
    return core.admin_extend(req.email, req.days)


@app.post(API + "/admin/cancel")
def r_admin_cancel(req: AdminCancelReq, _: bool = Depends(require_admin)):
    return core.admin_cancel(req.email)


@app.get(API + "/admin/users")
def r_admin_users(_: bool = Depends(require_admin)):
    return {"users": core.admin_list_users()}


@app.post(API + "/admin/billing/recharge")
def r_admin_recharge(req: AdminRechargeReq, _: bool = Depends(require_admin)):
    return core.admin_recharge(req.email, req.points, req.note)


@app.get(API + "/admin/billing/transactions")
def r_admin_billing_transactions(email: str, limit: int = 100, offset: int = 0,
                                 _: bool = Depends(require_admin)):
    return core.admin_list_point_transactions(email, limit, offset)


@app.get("/admin")
def admin_page():
    return FileResponse(ADMIN_HTML)


@app.get("/privacy")
def privacy_page():
    return FileResponse(PRIVACY_HTML)


@app.get("/")
def root():
    return {"service": "凯旋智聘 API", "docs": "/docs",
            "admin": "/admin", "dev_mode": core.DEV_MODE}
