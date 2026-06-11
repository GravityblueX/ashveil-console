# Nocturne Admin 架构说明

## 参考边界

eladmin 提供了用户、角色、菜单、字典、日志、任务、监控、代码生成等后台管理能力。Nocturne Admin 保留“后台管理系统”的通用业务边界，但重新实现为轻量 Node + Vue 3 项目，并采用完全不同的暗色产品视觉。

## 后端模块

- `auth`：登录、JWT、当前用户
- `access`：用户、角色、菜单、部门
- `dictionary`：字典类型与字典项
- `audit`：操作日志、异常日志
- `scheduler`：任务定义、任务历史
- `monitor`：服务健康、节点指标

## 前端页面

- `/login`：暗色登录页
- `/dashboard`：运营总览
- `/access/users`：用户管理
- `/access/roles`：角色管理
- `/system/dictionaries`：字典管理
- `/audit/logs`：审计日志
- `/jobs`：任务中心
- `/monitor`：系统监控
