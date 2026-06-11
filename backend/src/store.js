export const roles = [
  { id: 1, code: 'ROOT', name: '超级管理员', scope: 'ALL', users: 1 },
  { id: 2, code: 'AUDITOR', name: '审计员', scope: 'DEPT', users: 3 },
  { id: 3, code: 'OPS', name: '运维观察员', scope: 'SELF', users: 5 }
];

export const users = [
  { id: 1, username: 'admin', password: 'nocturne2026', nickname: 'Night Operator', dept: '中台治理部', roles: ['ROOT'], status: 'active', lastLogin: '2026-06-11 08:00' },
  { id: 2, username: 'mira', password: 'demo123456', nickname: 'Mira', dept: '风控组', roles: ['AUDITOR'], status: 'active', lastLogin: '2026-06-10 19:42' },
  { id: 3, username: 'ops01', password: 'demo123456', nickname: 'Ops Watcher', dept: '基础设施组', roles: ['OPS'], status: 'locked', lastLogin: '2026-06-09 13:18' }
];

export const menus = [
  { path: '/dashboard', title: '星图总览', icon: '◐' },
  { path: '/access/users', title: '身份权限', icon: '◇' },
  { path: '/system/dictionaries', title: '数据字典', icon: '□' },
  { path: '/audit/logs', title: '审计轨迹', icon: '◎' },
  { path: '/jobs', title: '任务编排', icon: '△' },
  { path: '/monitor', title: '系统脉搏', icon: '▣' }
];

export const dictionaries = [
  { type: 'risk_level', name: '风险等级', items: ['low', 'medium', 'high', 'critical'] },
  { type: 'account_status', name: '账号状态', items: ['active', 'locked', 'disabled'] },
  { type: 'channel', name: '来源渠道', items: ['console', 'api', 'scheduler', 'webhook'] }
];

export const auditLogs = [
  { id: 1001, actor: 'admin', action: '刷新角色权限矩阵', channel: 'console', level: 'info', time: '2026-06-11 08:16:22' },
  { id: 1002, actor: 'mira', action: '导出异常登录报告', channel: 'console', level: 'warning', time: '2026-06-11 07:54:08' },
  { id: 1003, actor: 'system', action: '自动归档任务日志', channel: 'scheduler', level: 'info', time: '2026-06-11 02:10:00' },
  { id: 1004, actor: 'ops01', action: '访问受限菜单被拒绝', channel: 'console', level: 'critical', time: '2026-06-10 21:33:19' }
];

export const jobs = [
  { id: 1, name: '权限快照生成', cron: '0 */2 * * *', status: 'running', successRate: '99.8%' },
  { id: 2, name: '异常登录扫描', cron: '*/15 * * * *', status: 'running', successRate: '98.1%' },
  { id: 3, name: '审计日志冷归档', cron: '0 3 * * *', status: 'paused', successRate: '100%' }
];

export const monitor = {
  api: { uptime: '18d 04h', cpu: 36, memory: 62, qps: 218 },
  nodes: [
    { name: 'gateway-01', status: 'healthy', latency: '18ms' },
    { name: 'worker-02', status: 'healthy', latency: '24ms' },
    { name: 'audit-archive', status: 'degraded', latency: '91ms' }
  ]
};
