# v0.26.0 发布说明

本次版本继续推进 Prisma 运行时接入，把风险事件中心的状态流转升级为 Prisma 持久化，支持值守人员保存待确认、处理中、已确认、已忽略和已归档等处置状态。

## 新增

- `RiskEvent.eventKey` 稳定事件键，用于把评分模型生成的风险事件映射到数据库记录。
- `getRiskEvents()` 仓储方法，支持风险事件生成、同步与 Prisma 优先读取。
- `updateRiskEventStatus()` 仓储方法，支持风险事件状态持久化。
- `PATCH /api/risk/events/:eventKey/status` 状态更新接口。
- 新增 `docs/risk-event-status-prisma.md`。
- 新增 `docs/releases/v0.26.0.md`。

## 读取与写入策略

- `GET /api/risk/events` 在 Prisma 可用时将当前评分事件 upsert 到 `RiskEvent` 表，再读取持久化状态返回。
- Prisma 不可用时，风险事件列表继续使用运行时评分模型生成。
- `PATCH /api/risk/events/:eventKey/status` 在 Prisma 可用时保存状态；Prisma 不可用时返回 `503`，避免造成状态已保存的误解。
- 接口响应增加 `meta.source` 与 `meta.prisma`，方便前端识别当前数据源。

## 前端优化

- 风险事件状态下拉框由本地变更升级为调用后端 PATCH 接口。
- 保存失败时自动回滚原状态并显示错误提示。
- 页面展示数据源与 Prisma 连接状态。
- 风险事件概览增加已忽略统计能力。

## 验证

- 已执行 `npm run format`、`npm run build` 与 `npm run check`。
