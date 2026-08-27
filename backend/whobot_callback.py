"""呼波特电话话单回调验签。

验签必须使用未经改写的 HTTP Body 文本，不能先解析再序列化。
"""
import hashlib
import hmac
import os
import time

import core


APP_ID = os.getenv("WHOBOT_CALLBACK_APP_ID", "").strip()
APP_SECRET = os.getenv("WHOBOT_CALLBACK_APP_SECRET", "").strip()
MAX_CLOCK_SKEW_SECONDS = int(
    os.getenv("WHOBOT_CALLBACK_MAX_CLOCK_SKEW_SECONDS", "300")
)
MAX_BODY_BYTES = int(os.getenv("WHOBOT_CALLBACK_MAX_BODY_BYTES", "2097152"))


def configured() -> bool:
    return bool(APP_ID and APP_SECRET)


def verify(app_id: str, timestamp: str, nonce: str, signature: str,
           sign_method: str, raw_body: str) -> int:
    """验证应用、时间戳和签名，成功后返回整数时间戳。"""
    if not configured():
        raise core.AppError(
            503, "呼波特回调尚未配置", "WHOBOT_CALLBACK_NOT_CONFIGURED"
        )
    if not app_id or not hmac.compare_digest(str(app_id), APP_ID):
        raise core.AppError(403, "回调应用无权限", "WHOBOT_CALLBACK_FORBIDDEN")
    try:
        timestamp_int = int(str(timestamp))
    except (TypeError, ValueError):
        raise core.AppError(
            400, "回调时间戳无效", "WHOBOT_CALLBACK_INVALID_TIMESTAMP"
        )
    if abs(int(time.time()) - timestamp_int) > MAX_CLOCK_SKEW_SECONDS:
        raise core.AppError(
            401, "回调请求已过期", "WHOBOT_CALLBACK_EXPIRED"
        )
    if not nonce or len(str(nonce)) > 200:
        raise core.AppError(
            400, "回调 nonce 无效", "WHOBOT_CALLBACK_INVALID_NONCE"
        )
    method = (sign_method or "md5").strip().lower()
    if method not in ("md5", "sha256"):
        raise core.AppError(
            400, "不支持的签名方法", "WHOBOT_CALLBACK_SIGN_METHOD"
        )
    source = (
        f"timestamp={timestamp}&nonce={nonce}&appId={app_id}"
        f"&data={raw_body}&appSecret={APP_SECRET}"
    )
    expected = hashlib.new(method, source.encode("utf-8")).hexdigest()
    if not signature or not hmac.compare_digest(
        expected.lower(), str(signature).strip().lower()
    ):
        raise core.AppError(
            401, "回调签名验证失败", "WHOBOT_CALLBACK_BAD_SIGNATURE"
        )
    return timestamp_int
