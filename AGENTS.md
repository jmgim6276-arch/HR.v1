# Repository Guide

凯旋智聘是面向 BOSS 直聘招聘方的 Chrome MV3 扩展，配套 FastAPI/SQLite 后端。

## 目录

- `extension/`：浏览器扩展；`manifest.json` 是发布版本唯一来源。
- `backend/`：账号、订阅、计费、托管大模型与呼波特中继。
- `tests/`：扩展侧 Node 回归测试。
- `deploy/`：部署模板，不代表线上已完成部署。

## 验证命令

```bash
node tests/test-reply-scope.mjs
node tests/test-ph3-judge.mjs
node tests/test-collector-driven-forwarding.mjs
node tests/test-resume-request-detection.mjs
node tests/test-unified-workflow.mjs
node tests/test-cloud-settings.mjs
node --check extension/service-worker/sw.js
node --check extension/content-script/index.js
node --check extension/service-worker/resume-collector.mjs
node --check extension/service-worker/workflow-orchestrator.mjs
cd backend && DEV_MODE=true venv/bin/python test_core.py
```

## 修改规则

- 对 `sw.js`、`index.js`、`inject-hook.js` 保持最小差异；修改后运行全部扩展回归与语法检查。
- `content-script/selectors.js` 是经典脚本，不得加入 `import` 或 `export`。
- 联动模式由编排器顺序启动模块；无可用打招呼岗位时仍应继续已开启的自动回复或简历采集。
- 岗位自动回复发送前必须用“候选人 uid + 候选人消息标识”通过 `cmd_claim_reply`；同一条消息只发送一次，新消息可以正常回复。
- 简历采集器只检查、同意和采集简历；未发现简历时直接跳过，不得路由到岗位自动回复。
- `keywordReply`、`aiReply` 仅为旧配置兼容字段，不得作为运行门槛或恢复可见开关。
- 托管大模型密钥只在服务器环境变量；不得写入扩展、文档、测试或提交历史。
- 完整简历和人才库默认留在浏览器本地；新增云端传输前必须同步隐私政策并更新同意版本。
- 发布包只包含 `extension/` 内容；不得包含源码映射、备份目录或 `_` 开头的文件。
- 不删除备份、历史安装包、分支或复核证据，除非用户在看到清单后明确确认。

## 权威文档

- 当前状态与运行方式：`README.md`
- 产品边界：`PRODUCT.md`
- 重复发送事故与修复：`ANALYSIS-1.5.2-DUPLICATE-REPLIES.md`
- 部署模板：`deploy/DEPLOY.md`
