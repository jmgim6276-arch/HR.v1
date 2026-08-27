"""呼波特合作方接口客户端。

凭证只从服务端环境变量读取，禁止下发到浏览器插件。
接口文档要求 TimeStamp、Token、Signature 三个请求头，其中 Signature
必须动态计算为 sha1(渠道密钥 + 授权 Token + 毫秒时间戳)。
"""
import hashlib
import json
import os
import time
import urllib.error
import urllib.request

import core


BASE_URL = os.getenv("WHOBOT_BASE_URL", "https://partner.whobot.com/").rstrip("/") + "/"
TOKEN = os.getenv("WHOBOT_TOKEN", "").strip()
SIGNATURE = os.getenv("WHOBOT_SIGNATURE", "").strip()
TIMEOUT_SECONDS = int(os.getenv("WHOBOT_TIMEOUT_SECONDS", "15"))


def configured() -> bool:
    return bool(TOKEN and SIGNATURE)


def _headers() -> dict:
    if not configured():
        raise core.AppError(503, "呼波特接口尚未配置", "WHOBOT_NOT_CONFIGURED")
    timestamp = str(int(time.time() * 1000))
    signature = hashlib.sha1(
        f"{SIGNATURE}{TOKEN}{timestamp}".encode("utf-8")
    ).hexdigest()
    return {
        "Content-Type": "application/json",
        "TimeStamp": timestamp,
        "Token": TOKEN,
        "Signature": signature,
    }


def _request(path: str, payload=None, method: str = "POST") -> dict:
    url = BASE_URL + path.lstrip("/")
    body = None if payload is None else json.dumps(
        payload, ensure_ascii=False, separators=(",", ":")
    ).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers=_headers(),
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            raw = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        raise core.AppError(
            502,
            f"呼波特接口 HTTP {exc.code}：{raw[:160] or '请求失败'}",
            "WHOBOT_HTTP_ERROR",
        )
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise core.AppError(
            502,
            f"呼波特接口连接失败：{str(exc)[:120]}",
            "WHOBOT_NETWORK_ERROR",
        )
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        raise core.AppError(502, "呼波特接口返回了无法解析的数据", "WHOBOT_BAD_RESPONSE")
    if int(result.get("errNo", -1)) != 0:
        raise core.AppError(
            502,
            f"呼波特接口失败：{result.get('errMsg') or '未知错误'}",
            "WHOBOT_REJECTED",
        )
    return result


def check_token() -> dict:
    return _request("api/v1/common/checkToken", {})


def submit_clue(clue: dict, label_name: str = "凯旋智聘人才库") -> dict:
    payload = {
        "clueList": [clue],
        "dedupByConnected": False,
        "labelName": label_name,
        "labelPaused": False,
    }
    return _request("api/v1/common/newClue", payload)
