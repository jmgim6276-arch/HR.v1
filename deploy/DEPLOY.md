# 上云部署手册（systemd + Nginx + HTTPS）

> 本文是新环境部署模板，不代表当前线上状态。现役后端地址是 `https://hr.uf-tree.com`，生产目录记录为 `/www/wwwroot/zhipin-backend`；任何部署前先在服务器核对实际进程、环境变量和数据库备份。

把后端从"本地手动跑"变成"云服务器上常驻、开机自启、HTTPS 加密"。
全程约 20-30 分钟。命令都在**服务器**上执行（先 `ssh` 上去）。

前置：一台云服务器（腾讯云/阿里云轻量，2核2G，Ubuntu 22）+ 一个域名。

---

## 步骤 1：上传代码到服务器

在你**本地电脑**执行（把 backend 传上去）：

```bash
scp -r backend/ ubuntu@你的服务器IP:~/app
```

然后 SSH 登录服务器：

```bash
ssh ubuntu@你的服务器IP
```

## 步骤 2：装依赖

```bash
sudo apt update
sudo apt install -y python3-pip nginx
cd ~/app/backend
pip3 install -r requirements.txt
```

## 步骤 3：用 systemd 常驻运行

```bash
# 编辑 service 文件，改里面的 User / WorkingDirectory / 三个 Environment 值
nano ~/app/deploy/zhipin-backend.service        # 或先 scp 上来

# ⚠️ 一定要改这两个密钥：
#   JWT_SECRET：执行 openssl rand -hex 32 生成一串，粘进去
#   ADMIN_KEY ：你自己的后台口令（开通会员时用）
openssl rand -hex 32        # 复制输出，填进 service 文件的 JWT_SECRET

sudo cp ~/app/deploy/zhipin-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now zhipin-backend
sudo systemctl status zhipin-backend      # 显示 active (running) 即成功
```

此时后端在本机 `127.0.0.1:8080` 跑着了（还没对外，下一步用 Nginx 暴露）。

> 看日志（含验证码）：`sudo journalctl -u zhipin-backend -f`
> 改了代码后：`sudo systemctl restart zhipin-backend`

## 步骤 4：域名解析

去你买域名的后台，加一条 **A 记录**：把 `api.你的域名.com` 指向服务器公网 IP。
等几分钟生效（`ping api.你的域名.com` 能解析到你的 IP 就好了）。

## 步骤 5：配 Nginx 反向代理

```bash
# 把 nginx.conf 里的 server_name 改成你的域名
sudo cp ~/app/deploy/nginx.conf /etc/nginx/sites-available/zhipin
sudo nano /etc/nginx/sites-available/zhipin      # 改 server_name

sudo ln -s /etc/nginx/sites-available/zhipin /etc/nginx/sites-enabled/
sudo nginx -t          # 测试配置无误
sudo systemctl reload nginx
```

现在 `http://api.你的域名.com`（80端口）应该能访问后端了。

## 步骤 6：一键配 HTTPS（Let's Encrypt 免费证书）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.你的域名.com
# 按提示输邮箱、同意条款；问是否强制跳转 HTTPS 选「2 Redirect」
```

certbot 会自动改好 Nginx 配置、装上证书、并设置**自动续期**。
完成后访问 `https://api.你的域名.com/docs` 应能看到接口文档（带小锁🔒）。

## 步骤 7：放行端口 & 收尾

- 在云服务器控制台的**安全组/防火墙**放行 `80` 和 `443`（8080 不用对外）。
- 关掉开发模式已在 service 文件里设了 `DEV_MODE=false`——记得**接真实邮件发码**
  （改 `core.py` 的 `send_code()`，见文件内注释），否则用户收不到验证码登录不了。

## 步骤 8：把插件指向你的域名

在**本地**编辑 `extension/service-worker/sw.js`，把 `http://127.0.0.1:8080`
全部替换成 `https://api.你的域名.com`，重新加载插件即可。

---

## 部署后自检清单

- [ ] `https://api.你的域名.com/` 返回 JSON（`dev_mode: false`）
- [ ] `https://api.你的域名.com/docs` 能打开，有绿色 Authorize 按钮
- [ ] `https://api.你的域名.com/admin` 打开后台页，填入你的 ADMIN_KEY 能加载用户列表
- [ ] `https://api.你的域名.com/privacy` 能打开“凯旋智聘隐私政策”页面
- [ ] 插件里注册/登录能收到真实邮件验证码
- [ ] `sudo systemctl status zhipin-backend` 是 running

## 常用运维命令

```bash
sudo systemctl restart zhipin-backend     # 重启后端
sudo journalctl -u zhipin-backend -f      # 实时日志
sudo systemctl reload nginx               # 重载 Nginx
sudo certbot renew --dry-run              # 测试证书自动续期
```

## 只更新隐私政策与后端入口（不覆盖会员数据库）

> ⚠️ 路径注意：本节目录模板写于初次部署（ubuntu/home）。现役生产记录为宝塔环境，
> 真实路径为 `/www/wwwroot/zhipin-backend`（root 登录）；部署前必须登录服务器再次确认。

当线上 `/privacy` 返回 404、但本地 `backend/main.py` 已有该路由时，说明云服务器仍在运行旧代码。
在项目根目录执行下面的上传命令，把 `服务器IP` 和 SSH 用户按实际情况替换：

```bash
scp backend/main.py backend/privacy.html ubuntu@服务器IP:/home/ubuntu/app/backend/
ssh ubuntu@服务器IP
sudo systemctl restart zhipin-backend
sudo systemctl status zhipin-backend --no-pager
curl -I https://hr.uf-tree.com/privacy
```

最后一条应返回 `HTTP/2 200` 或 `HTTP/1.1 200`。本次不要上传本地 `backend/app.db`，否则会覆盖线上会员与订阅数据。

## 数据备份

用户/订阅/点数余额都在 SQLite 单文件 `app.db`（现役路径 `/www/wwwroot/zhipin-backend/app.db`），定期复制它即可备份：

```bash
cp ~/app/backend/app.db ~/backups/app-$(date +%F).db
```
