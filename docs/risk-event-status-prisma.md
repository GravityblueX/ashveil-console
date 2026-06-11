# 风险事件状态 Prisma 持久化

`v0.26.0` 将风险事件中心从纯运行时聚合升级为“评分生成 + Prisma 状态持久化”的混合模式，让值守人员在前端切换事件状态后可以跨刷新、跨会话保留处置进度。

## 目标

- 保持风险事件仍由灰域评分模型自动生成。
- 将事件状态持久化到 `RiskEvent` 表。
- 前端状态下拉框切换后调用后端接口保存。
- Prisma 不可用时继续保留 mock/运行时聚合兜底，不阻断页面展示。

## 数据模型

`RiskEvent` 新增稳定事件键：

```prisma
model RiskEvent {
  id         Int      @id @default(autoincrement())
  eventKey   String   @unique
  title      String
  target     String
  sourceType String
  score      Int
  level      String
  status     String   @default("pending")
  suggestion String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

`eventKey` 由风险评分项生成，例如：

```txt
risk:role:role-ROOT
risk:user:user-ops01
risk:audit:audit-api-gateway
risk:job:job-3
risk:node:node-audit-archive
```

这样即使每次聚合顺序变化，也能准确匹配同一个风险对象的处置状态。

## 接口变化

### `GET /api/risk/events`

读取策略：

1. 构建当前风险事件列表。
2. Prisma 可用时，将当前事件 upsert 到 `RiskEvent`。
3. 从 Prisma 读取事件列表并返回持久化状态。
4. Prisma 不可用时返回运行时生成事件。

响应增加：

```json
{
  "overview": {},
  "events": [],
  "meta": {
    "source": "prisma",
    "prisma": {}
  }
}
```

### `PATCH /api/risk/events/:eventKey/status`

请求：

```json
{ "status": "confirmed" }
```

支持状态：

- `pending`：待确认
- `processing`：处理中
- `confirmed`：已确认
- `ignored`：已忽略
- `archived`：已归档

Prisma 不可用时返回 `503`，避免给用户造成“已保存”的误解。

## 前端行为

- 风险事件卡片保留原有视觉结构。
- 下拉框从本地 `v-model` 改为调用后端 PATCH 接口。
- 保存失败时自动回滚到原状态并显示错误提示。
- 页面显示 `meta.source` 和 Prisma 连接状态，便于值守人员判断当前是否为持久化模式。

## 回退策略

- `GET /api/risk/events` 在 Prisma 不可用时仍返回运行时事件。
- `PATCH /api/risk/events/:eventKey/status` 在 Prisma 不可用时返回错误，提示状态无法持久化。
- 不影响灰域评分、夜间值守和其他权限审计页面。
