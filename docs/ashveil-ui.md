# Ashveil UI 组件库

Ashveil UI 是 Ashveil Console 内部沉淀的一组低噪声暗色组件。它不是独立 npm 包，而是项目内的设计与实现约定。

## 设计令牌

设计令牌位于：`frontend/src/styles/tokens.css`。

当前包含：

- 色彩：Obsidian、Charcoal、Graphite、Mist、Bone、Ember、Amber、Pale Green
- 圆角：`--ash-radius-sm` 到 `--ash-radius-2xl`
- 间距：`--ash-space-1` 到 `--ash-space-8`
- 阴影：`--ash-shadow-panel`
- 边框：`--ash-border-muted`

## 基础组件

组件目录：`frontend/src/components/ash/`

### AshButton

用于统一按钮视觉，支持：

- `primary`
- `ghost`
- `danger`

### AshCard

用于统一面板卡片，支持标题插槽和 `quiet` 低噪声模式。

### AshBadge

用于统一状态标签，支持：

- `muted`
- `success`
- `warning`
- `danger`

### AshMetricCard

用于统一指标卡片，适合风险分、事件数、节点状态等指标展示。

## 组件原则

1. 组件默认暗色；
2. 状态色只在必要时出现；
3. 所有组件保持低噪声边框；
4. 优先服务值守、审计、风险观察场景；
5. 后续新页面优先复用 Ashveil UI。
