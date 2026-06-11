# 自动化持续优化部署状态

Ashveil Console / nocturne-admin 已进入自动化持续优化部署状态。

## 已部署能力

- GitHub Actions 持续优化流水线：`.github/workflows/continuous-optimize.yml`
- 永久循环优化提示词：`AGENT_OPTIMIZE_PROMPT.md`
- 本地循环辅助脚本：`optimize-loop.sh`
- GitHub Secrets 配置说明：`docs/github-secrets.md`
- 完整流程测试说明：`docs/flow-test.md`
- 当前发布说明：`RELEASE_NOTES.md`

## 推荐运行方式

### 方式一：依赖 GitHub Actions

GitHub Actions 会在以下场景触发：

- push 到 `main` 或 `master`
- 每天 UTC 02:00 定时触发
- 在 Actions 页面手动 `Run workflow`

### 方式二：本地循环脚本

在类 Unix Shell、Git Bash 或 WSL 中执行：

```bash
chmod +x optimize-loop.sh
nohup ./optimize-loop.sh &
```

Windows 原生命令行环境建议优先依赖 GitHub Actions 定时触发。

## 后续优化队列

1. 任务执行按钮与运行反馈
2. 暗色组件库完善
3. 性能优化
4. 代码规范
5. 新功能建议与实现
6. 继续循环

## 停止条件

只有当维护者明确输入“停止优化”时，才停止持续优化流程。
