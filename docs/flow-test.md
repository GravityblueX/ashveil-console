# 自动化持续优化流程测试说明

## 1. 手动触发 GitHub Actions

1. 打开仓库 Actions 页面。
2. 选择 `Continuous Optimization & Release`。
3. 点击 `Run workflow`。
4. 选择 `main` 分支后启动。

## 2. 检查流水线结果

确认以下步骤通过：

- Checkout
- Setup Node.js
- Install Dependencies
- Build & Check
- Auto Commit Improvements
- Create Release

## 3. 使用 AI Agent 执行一轮优化

复制根目录 `AGENT_OPTIMIZE_PROMPT.md` 内容给 IDE Agent，让它执行一轮优化，例如：真实列表格、高级筛选搜索或弹窗表单。

## 4. 检查 Git 与 Release

确认：

- 代码已 push 到 GitHub。
- `README.md` 已更新为简体中文。
- `RELEASE_NOTES.md` 已更新为简体中文。
- GitHub Releases 页面出现新版本。

## 5. 本地循环脚本测试

在类 Unix Shell 中执行：

```bash
chmod +x optimize-loop.sh
./optimize-loop.sh
```

如需后台运行：

```bash
nohup ./optimize-loop.sh &
```

Windows 环境建议使用 Git Bash、WSL 或依赖 GitHub Actions 定时触发。
