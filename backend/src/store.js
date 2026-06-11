export const roles = [
  { id: 1, code: 'ROOT', name: '超级管理员', scope: 'ALL', users: 1 },
  { id: 2, code: 'AUDITOR', name: '审计员', scope: 'DEPT', users: 3 },
  { id: 3, code: 'OPS', name: '运维观察员', scope: 'SELF', users: 5 }
];

export const users = [
  {
    id: 1,
    username: 'admin',
    password: 'ashveil2026',
    nickname: 'Ash Operator',
    dept: '中台治理部',
    roles: ['ROOT'],
    status: 'active',
    lastLogin: '2026-06-11 08:00'
  },
  {
    id: 2,
    username: 'mira',
    password: 'demo123456',
    nickname: 'Mira',
    dept: '风控组',
    roles: ['AUDITOR'],
    status: 'active',
    lastLogin: '2026-06-10 19:42'
  },
  {
    id: 3,
    username: 'ops01',
    password: 'demo123456',
    nickname: 'Ops Watcher',
    dept: '基础设施组',
    roles: ['OPS'],
    status: 'locked',
    lastLogin: '2026-06-09 13:18'
  }
];

export const menus = [
  { path: '/dashboard', title: '星图总览', icon: '◐' },
  { path: '/risk/scores', title: '灰域评分', icon: '◈' },
  { path: '/risk/events', title: '风险事件', icon: '✦' },
  { path: '/watch/night', title: '夜间值守', icon: '◒' },
  { path: '/access/users', title: '身份权限', icon: '◇' },
  { path: '/access/matrix', title: '权限矩阵', icon: '◆' },
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
  {
    id: 1001,
    actor: 'admin',
    action: '刷新角色权限矩阵',
    channel: 'console',
    level: 'info',
    time: '2026-06-11 08:16:22'
  },
  {
    id: 1002,
    actor: 'mira',
    action: '导出异常登录报告',
    channel: 'console',
    level: 'warning',
    time: '2026-06-11 07:54:08'
  },
  {
    id: 1003,
    actor: 'system',
    action: '自动归档任务日志',
    channel: 'scheduler',
    level: 'info',
    time: '2026-06-11 02:10:00'
  },
  {
    id: 1004,
    actor: 'ops01',
    action: '访问受限菜单被拒绝',
    channel: 'console',
    level: 'critical',
    time: '2026-06-10 21:33:19'
  },
  {
    id: 1005,
    actor: 'api-gateway',
    action: '异常令牌连续失败',
    channel: 'api',
    level: 'critical',
    time: '2026-06-10 20:11:42'
  },
  {
    id: 1006,
    actor: 'scheduler',
    action: '任务执行耗时超过阈值',
    channel: 'scheduler',
    level: 'warning',
    time: '2026-06-10 18:06:27'
  },
  {
    id: 1007,
    actor: 'admin',
    action: '调整用户 ops01 角色范围',
    channel: 'console',
    level: 'info',
    time: '2026-06-10 16:25:10'
  }
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

export const permissionMatrix = {
  resources: [
    { key: 'dashboard', name: '星图总览', actions: ['view'] },
    { key: 'users', name: '用户管理', actions: ['view', 'create', 'edit', 'disable'] },
    { key: 'roles', name: '角色管理', actions: ['view', 'create', 'edit', 'grant'] },
    { key: 'dictionary', name: '数据字典', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'audit', name: '审计轨迹', actions: ['view', 'export'] },
    { key: 'jobs', name: '任务编排', actions: ['view', 'run', 'pause'] },
    { key: 'monitor', name: '系统脉搏', actions: ['view'] }
  ],
  grants: {
    ROOT: [
      'dashboard:view',
      'users:view',
      'users:create',
      'users:edit',
      'users:disable',
      'roles:view',
      'roles:create',
      'roles:edit',
      'roles:grant',
      'dictionary:view',
      'dictionary:create',
      'dictionary:edit',
      'dictionary:delete',
      'audit:view',
      'audit:export',
      'jobs:view',
      'jobs:run',
      'jobs:pause',
      'monitor:view'
    ],
    AUDITOR: [
      'dashboard:view',
      'users:view',
      'roles:view',
      'dictionary:view',
      'audit:view',
      'audit:export',
      'monitor:view'
    ],
    OPS: ['dashboard:view', 'audit:view', 'jobs:view', 'jobs:run', 'jobs:pause', 'monitor:view']
  }
};
