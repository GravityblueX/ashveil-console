# 风险事件处置轨迹

`v0.27.0` 在风险事件状态持久化基础上继续补齐处置闭环：每次状态变更都可以带上处置备注、操作人和状态变更时间，并写入独立的状态日志表。

## 目标

- 风险事件不只保存“当前状态”，还保留“谁在什么时候因为什么修改了状态”。
- 前端切换状态时提示填写处置备注。
- 后端从 JWT 中读取当前操作人，避免前端伪造操作者。
- 风险事件卡片展示最近处置信息，并支持查看状态变更轨迹。

## 数据模型

`RiskEvent` 增加当前处置字段：

```prisma
statusNote      String?
handledBy       String?
statusChangedAt DateTime?
logs            RiskEventStatusLog[]
```

新增状态日志：

```prisma
model RiskEventStatusLog {
  id         Int       @id @default(autoincrement())
  eventId    Int
  event      RiskEvent @relation(fields: [eventId], references: [id])
  fromStatus String?
  toStatus   String
  note       String?
  actor      String?
  createdAt  DateTime  @default(now())
}
```

## 接口行为

### `PATCH /api/risk/events/:eventKey/status`

请求示例：

```json
{
  "status": "confirmed",
  "note": "已复核，权限变更符合夜间值守预案。"
}
```

后端行为：

1. 校验状态是否合法。
2. 清理状态和备注首尾空白，并拒绝超过 500 个字符的备注。
3. 从 JWT 读取 `req.user.username` 作为操作人。
4. 更新 `RiskEvent.status`、`statusNote`、`handledBy`、`statusChangedAt`。
5. 写入 `RiskEventStatusLog`，记录旧状态、新状态、备注和操作人。
6. 返回最新事件以及最近 5 条状态轨迹。

## 前端行为

- 状态下拉框变更时弹出备注输入框。
- 保存成功后刷新当前卡片的状态、备注、操作人和轨迹。
- 保存失败时回滚状态与备注。
- 点击“轨迹”按钮可以查看最近状态变更记录。

## 回退与风险

- Prisma 不可用时仍然可以读取运行时风险事件列表。
- Prisma 不可用时状态更新继续返回 `503`，避免误导用户。
- 当前仅展示最近 5 条状态日志，后续可扩展分页或独立详情页。
