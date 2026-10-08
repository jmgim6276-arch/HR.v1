# 凯旋智聘

面向 BOSS 直聘招聘方的 Chrome MV3 侧栏扩展，覆盖打招呼、自动回复、简历采集与打分、本地人才库和呼波特外呼；后端提供账号、订阅、点数计费、托管大模型与第三方中继。

## 当前状态

| 项目 | 状态 |
|---|---|
| 源码版本 | `extension/manifest.json`：`1.5.2` |
| 重复回复修复 | PR [#1](https://github.com/jmgim6276-arch/HR.v1/pull/1) 已审核、仍未合并；分支 `analysis/duplicate-reply-report` |
| 修复后安装包 | 尚未生成；仓库里的 `1.5.2` 压缩包早于本次修复，不能视为修复版 |
| 线上后端 | 地址为 `https://hr.uf-tree.com`；本次整理时连接超时，部署版本与隐私页待线上复核 |
| 发布结论 | 代码已本地验证，尚未合并、真机验收、打包或发布 |

## 运行逻辑

- 一键运行按“打招呼 → 沟通页监听”编排已开启模块；①没有可用岗位时，②自动回复和③简历采集仍继续。
- 自动回复发送岗位配置中的静态话术；托管大模型只判断候选人消息是否值得回复。
- “关键词回复”和“AI 回复”是历史兼容字段，界面隐藏且不再控制启动。
- 主回复和采集器回复共用 Service Worker 的领取锁；同一候选人 10 分钟内只允许一个自动回复入口发送。
- 统一运行页转发子模块日志，并显示当前阶段、状态和暂停原因。

完整根因和验收条件见 `ANALYSIS-1.5.2-DUPLICATE-REPLIES.md`。

## 目录

- `extension/`：浏览器扩展源码。
- `backend/`：FastAPI/SQLite 后端。
- `tests/`：扩展回归测试。
- `deploy/`：部署模板与配置示例。

## 本地运行

### 后端

```bash
cd backend
python3 -m venv venv
venv/bin/pip install -r requirements.txt
cp .env.example .env
DEV_MODE=true venv/bin/uvicorn main:app --reload --port 8080
```

`DEV_MODE=true` 仅用于本地；生产必须配置强随机的 `JWT_SECRET`、`ADMIN_KEY`、邮件服务和 `DASHSCOPE_API_KEY`。

### 扩展

1. 打开 `chrome://extensions`，启用开发者模式。
2. 选择“加载已解压的扩展程序”，加载 `extension/`。
3. 打开 BOSS 直聘页面，从扩展侧栏登录并配置岗位。

## 验证

```bash
for test in tests/*.mjs; do node "$test"; done
node --check extension/service-worker/sw.js
node --check extension/content-script/index.js
node --check extension/service-worker/resume-collector.mjs
node --check extension/service-worker/workflow-orchestrator.mjs
cd backend && DEV_MODE=true venv/bin/python test_core.py
```

## 发布顺序

1. 合并 PR #1。
2. 将 `manifest.json` 版本提高到 `1.5.2` 以上。
3. 真机验证三模块联动、重复回复、简历采集/打分、呼波特提交和统一日志。
4. 仅打包 `extension/`，生成与新版本号一致的客户安装包。
5. 验证线上后端、隐私政策和生产配置后再分发。

运维与分发分别见 `deploy/DEPLOY.md`、`使用手册-如何把插件发给用户.md`。
