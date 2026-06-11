# v0.8.0 发布说明

本次版本对应自动化持续优化流程的第 1 步：项目基础准备。

## 新增

- 确认项目已连接 GitHub 仓库 `GravityblueX/ashveil-console`，当前分支为 `main`。
- 根目录 `package.json` 增加统一脚本：
  - `install:all`
  - `dev:backend`
  - `dev:frontend`
  - `build`
  - `lint`
  - `test`
  - `check`
- 后端补充 `build`、`lint`、`test` 脚本。
- 前端补充 `lint`、`test` 脚本。
- 完善 `backend/.env.example` 和 `frontend/.env.example`。

## 优化

- README 更新为完整简体中文项目介绍。
- README 增加项目状态、技术栈、启动命令、目录结构和优化历史记录。
- 明确敏感配置通过 `.env.example` 抽离，真实密钥不进入仓库。

## 验证

- 本版本将执行 `npm run build` 与 `npm run check` 验证。
