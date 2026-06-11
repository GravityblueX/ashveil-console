# 权限矩阵 Prisma 迁移说明

`v0.25.0` 开始，权限矩阵接口支持 Prisma 优先读取，并继续保留 mock 兜底。

## 已接入接口

```text
GET /api/access/permission-matrix
```

## 读取策略

1. 优先读取 Prisma 数据表：
   - `PermissionResource`
   - `PermissionAction`
   - `Role`
   - `PermissionGrant`
2. 当 Prisma 未初始化、数据库未迁移、表为空或连接失败时，自动回退到 `store.js` 中的 `permissionMatrix`。
3. 接口响应附带 `meta.source` 与 `meta.prisma`，用于前端或调试时确认数据来源。

## 响应结构

```json
{
  "resources": [{ "key": "risk-events", "name": "风险事件中心", "actions": ["view", "confirm"] }],
  "grants": {
    "ROOT": ["risk-events:view", "risk-events:confirm"]
  },
  "meta": {
    "source": "prisma",
    "prisma": { "enabled": true, "fallback": false }
  }
}
```

## 初始化建议

```bash
cd backend
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

## 后续计划

- 增加权限矩阵保存接口；
- 将前端矩阵切换动作写入 `PermissionGrant`；
- 增加权限快照；
- 增加权限快照对比。
