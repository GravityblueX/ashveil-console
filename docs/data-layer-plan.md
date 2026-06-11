# SQLite + Prisma 数据层设计与迁移计划

Ashveil Console 当前仍以 mock 数据驱动。为了让项目从“可演示原型”升级为“可持续运行系统”，下一阶段将引入 **SQLite + Prisma** 作为第一版真实数据层。

## 选择 SQLite + Prisma 的原因

- **SQLite**：轻量、零服务依赖、适合个人项目和本地部署。
- **Prisma**：模型清晰、迁移流程明确、类型友好，适合逐步替换 mock 数据。
- **渐进迁移**：先保留现有接口，再逐步将数据来源从 `store.js` 切换到 Prisma。

## 数据模型范围

本轮已新增 `backend/prisma/schema.prisma`，覆盖以下核心模型：

- `User`：用户；
- `Role`：角色；
- `UserRole`：用户角色关系；
- `PermissionResource`：权限资源；
- `PermissionAction`：权限动作；
- `PermissionGrant`：角色授权；
- `AuditLog`：审计日志；
- `RiskEvent`：风险事件；
- `JobTask`：任务；
- `PermissionSnapshot`：权限快照。

## 迁移阶段

### 阶段一：结构落地

- 安装 Prisma 与 Prisma Client；
- 添加 `schema.prisma`；
- 添加 seed 脚本；
- 保持现有 mock 接口不变。

### 阶段二：认证与权限真实化

- 将用户、角色、权限矩阵迁移到 SQLite；
- 登录接口读取数据库用户；
- 权限矩阵接口读取 `PermissionGrant`。

### 阶段三：审计与风险事件落库

- 审计日志写入 `AuditLog`；
- 风险事件写入 `RiskEvent`；
- 风险事件状态变更持久化。

### 阶段四：任务和权限快照

- 任务中心迁移到 `JobTask`；
- 权限快照写入 `PermissionSnapshot`；
- 增加权限快照对比接口。

## 本地初始化命令

```bash
cd backend
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

## 风险控制

- 当前版本只增加数据层设计和迁移入口，不直接替换运行接口；
- 保留 mock 数据，避免破坏现有页面；
- 后续按模块逐步切换，确保每轮 Release 都可运行。
