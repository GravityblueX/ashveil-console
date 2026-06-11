# Prisma 运行时接入说明

`v0.24.0` 开始，Ashveil Console 后端新增 Prisma Client 基础数据访问层。

## 新增文件

- `backend/src/db.js`：负责懒加载 Prisma Client，并在不可用时返回兜底状态。
- `backend/src/repositories.js`：封装用户、角色读取逻辑，优先读 Prisma，失败时回退 mock 数据。

## 已接入接口

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/access/users`
- `GET /api/access/roles`

## 兼容策略

当前版本不会强制要求本地已经完成 Prisma migrate：

1. 如果 Prisma Client 可连接，则优先读取 SQLite 数据；
2. 如果数据库未初始化或 Prisma 不可用，则自动回退到 `store.js` mock 数据；
3. 登录和用户信息接口会返回 `meta.source`，用于标识当前数据来源。

## 初始化数据库

```bash
cd backend
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

## 下一步

- 将权限矩阵读取切换到 Prisma；
- 将审计日志写入 `AuditLog`；
- 将风险事件状态变更写入 `RiskEvent`；
- 逐步移除 mock 数据依赖。
