# Nocturne Admin

一个参考 **eladmin** 的业务边界重新设计的前后端分离后台管理系统示例。项目没有复制原项目源码：技术栈、目录结构、视觉风格、模块命名与交互布局均重新设计。

## 差异化定位

- **视觉风格**：暗色玻璃拟态 + 黑白灰低饱和配色，区别于传统 Element 后台模板。
- **前端技术栈**：Vue 3 + Vite + Pinia + Vue Router，自研暗色组件与仪表盘布局。
- **后端技术栈**：Node.js + Express + JWT，轻量化模块结构，内置模拟 RBAC、菜单、字典、审计日志、任务中心。
- **产品侧重点**：从“通用后台脚手架”改成“运营中台 / 风控观测台 / 权限审计台”的体验。

## 功能模块

- 登录鉴权：JWT 登录、用户信息、菜单权限
- 总览看板：指标卡片、风险趋势、活动流
- 权限中心：用户、角色、菜单、部门
- 数据字典：状态、渠道、风险级别维护
- 审计日志：登录日志、操作日志、异常记录
- 任务中心：定时任务定义与执行记录
- 系统监控：服务指标与节点状态 mock

## 快速启动

```bash
# 后端
cd backend
npm install
npm run dev

# 前端
cd frontend
npm install
npm run dev
```

默认账号：`admin / nocturne2026`

## 项目结构

```text
nocturne-admin
├─ backend       # Express API 服务
├─ frontend      # Vue 3 管理端
└─ docs          # 设计与接口说明
```

## License

MIT
