# GitHub Secrets 配置说明

路径：仓库页面 → Settings → Secrets and variables → Actions。

## 必需项

### GITHUB_TOKEN

GitHub Actions 默认提供 `GITHUB_TOKEN`，当前流水线已在 workflow 中声明：

```yaml
permissions:
  contents: write
```

因此 Release 创建、自动提交和推送可以使用默认令牌完成。

## 可选项

### ANTHROPIC_API_KEY

用于后续接入 AI 自动优化能力。没有该密钥时，现有构建、检查和发布流程仍可运行。

### OPENAI_API_KEY

用于后续接入 AI 自动优化能力。没有该密钥时，现有构建、检查和发布流程仍可运行。

## 安全规则

- 不要把真实 API Key 写入 `.env.example`、README 或代码。
- 不要把真实 API Key 提交到 Git。
- 如需本地使用，请写入未被追踪的 `.env` 文件。
