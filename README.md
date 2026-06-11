# Ashveil Console

Ashveil Console 是一个暗色系、轻量化、持续优化中的内部管理控制台。项目当前采用前后端分离结构，把登录鉴权、权限管理、数据字典、审计日志、任务编排、系统监控等后台常见能力组合成一个可继续扩展的控制台原型。

## 项目状态

- 仓库：`GravityblueX/ashveil-console`
- 主分支：`main`
- 当前版本：`v0.10.0`
- 维护模式：持续优化 + 每轮发布 GitHub Release

## 技术栈

### 前端

- Vue 3
- Vite
- Pinia
- Vue Router
- 原生 CSS 暗色主题

### 后端

- Node.js
- Express
- JWT
- dotenv
- 内存 mock 数据

## 功能模块

| 模块 | 说明 |
| --- | --- |
| 登录鉴权 | JWT 登录、当前用户信息、菜单权限返回 |
| 星图总览 | 指标卡片、趋势柱图、最近审计动态 |
| 身份权限 | 用户、角色、菜单等基础权限数据 |
| 权限矩阵 | 按角色、资源、动作展示授权关系 |
| 数据字典 | 账号状态、风险等级、来源渠道等配置 |
| 审计轨迹 | 摘要卡片、渠道分布、风险时间线、日志明细 |
| 任务编排 | 任务名称、cron 表达式、运行状态、成功率 |
| 系统脉搏 | API 运行时间、资源占用、节点健康状态 |

## 快速启动

```bash
npm run install:all
npm run dev:backend
npm run dev:frontend
```

默认登录：

```txt
admin / ashveil2026
```

## 常用命令

```bash
# 安装前后端依赖
npm run install:all

# 启动后端
npm run dev:backend

# 启动前端
npm run dev:frontend

# 构建前后端
npm run build

# 执行检查
npm run check
```

## 环境变量

项目提供示例环境变量文件：

```text
backend/.env.example
frontend/.env.example
```

本地开发时复制为 `.env` 后按需修改。不要把真实密钥提交到仓库。

## 目录结构

```text
ashveil-console
├─ backend              # Express API 服务
├─ frontend             # Vue 3 管理端
├─ docs                 # 项目说明与版本说明
├─ RELEASE_NOTES.md     # 当前版本发布说明
└─ package.json         # 根目录统一脚本
```

## GitHub Secrets

Secrets 配置说明见 `docs/github-secrets.md`。当前流水线依赖默认 `GITHUB_TOKEN` 完成提交与 Release；`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` 为后续 AI 优化能力预留。

## 自动化流水线

项目已新增 GitHub Actions 工作流 `.github/workflows/continuous-optimize.yml`，支持在 push、定时计划和手动触发时执行依赖安装、构建检查、自动提交和 Release 创建。

## 优化历史记录

- `v0.10.0`：补充 GitHub Secrets 配置说明，明确默认令牌权限与 AI Key 预留项。
- `v0.9.0`：创建 GitHub Actions 持续优化流水线，支持 push、定时和手动触发。
- `v0.8.0`：整理项目基础准备，统一根目录脚本，补齐 build/lint/test/check，完善环境变量示例与中文文档。
- `v0.7.0`：增强审计日志模块，增加摘要、渠道分布与风险时间线。
- `v0.6.0`：新增角色权限矩阵页面与后端权限矩阵接口。
- `v0.5.0`：新增弹窗表单原型。
- `v0.4.0`：新增高级筛选搜索工具栏。
- `v0.3.0`：模块页升级为真实暗色数据表格。
- `v0.2.0`：完善中文 README、统一脚本和环境变量示例。

## 后续方向

任务执行按钮、暗色组件库、性能优化、代码规范、真实数据接入与更多新功能会继续迭代。

## License

MIT
