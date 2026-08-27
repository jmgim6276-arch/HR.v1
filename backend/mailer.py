"""
mailer.py —— 发验证码邮件（通用 SMTP，阿里云邮件推送 / QQ / 163 / 企业邮 都适用）

通过环境变量配置，代码不用改。支持两种端口：
  - 465：SSL（阿里云邮件推送、QQ、163 都推荐用这个）
  - 25/587：STARTTLS

阿里云邮件推送（DirectMail）填法：
  SMTP_HOST=smtpdm.aliyun.com
  SMTP_PORT=465
  SMTP_USER=你的发信地址（如 no-reply@mail.你的域名.com，需先在阿里云验证域名并创建发信地址）
  SMTP_PASS=该发信地址的 SMTP 密码
  SMTP_FROM_NAME=智能招聘助手

QQ 邮箱填法（无需域名，适合先测试）：
  SMTP_HOST=smtp.qq.com  SMTP_PORT=465
  SMTP_USER=你的QQ邮箱@qq.com  SMTP_PASS=QQ邮箱的授权码（不是登录密码）
"""
import os
import ssl
import smtplib
from email.mime.text import MIMEText
from email.header import Header
from email.utils import formataddr

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "")          # 发信地址
SMTP_PASS = os.getenv("SMTP_PASS", "")          # SMTP 密码 / 授权码
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "智能招聘助手")


def email_configured() -> bool:
    """三项都填了才算配好邮件。"""
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASS)


def _build_message(to: str, code: str) -> MIMEText:
    html = f"""
    <div style="font-family:-apple-system,'PingFang SC',sans-serif;max-width:480px;margin:0 auto;
                padding:32px;border:1px solid #e4e5ea;border-radius:16px;color:#14151a">
      <h2 style="margin:0 0 8px;font-size:18px">智能招聘助手</h2>
      <p style="color:#6a6c76;font-size:14px;margin:0 0 24px">您正在登录，验证码如下：</p>
      <div style="font-size:34px;font-weight:700;letter-spacing:8px;color:#4b4ee0;
                  text-align:center;padding:16px;background:#f5f6f8;border-radius:12px">{code}</div>
      <p style="color:#9a9ca6;font-size:12px;margin:24px 0 0">
        验证码 5 分钟内有效。若非本人操作，请忽略此邮件。</p>
    </div>"""
    msg = MIMEText(html, "html", "utf-8")
    msg["Subject"] = Header("【智能招聘助手】登录验证码", "utf-8")
    msg["From"] = formataddr((str(Header(SMTP_FROM_NAME, "utf-8")), SMTP_USER))
    msg["To"] = to
    return msg


def send_verification(to: str, code: str) -> None:
    """发送验证码邮件。失败会抛异常，由调用方处理。"""
    msg = _build_message(to, code)
    ctx = ssl.create_default_context()
    if SMTP_PORT == 465:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx, timeout=15) as s:
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(SMTP_USER, [to], msg.as_string())
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as s:
            s.starttls(context=ctx)
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(SMTP_USER, [to], msg.as_string())
