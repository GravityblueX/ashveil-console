import { users, roles, auditLogs, jobs, monitor, permissionMatrix } from './store.js';
const actionWeight = {
  view: 1,
  create: 4,
  edit: 5,
  delete: 8,
  disable: 7,
  grant: 9,
  export: 6,
  run: 6,
  pause: 5
};
const levelWeight = { info: 4, warning: 12, critical: 24 };
const clamp = (s) => Math.max(0, Math.min(100, Math.round(s)));
const band = (s) => (s >= 75 ? 'critical' : s >= 55 ? 'high' : s >= 35 ? 'medium' : 'low');
export function buildRiskScores() {
  const roleItems = roles.map((role) => {
    const grants = permissionMatrix.grants[role.code] || [];
    const privilege = grants.reduce((sum, g) => sum + (actionWeight[g.split(':')[1]] || 2), 0);
    const scope = role.scope === 'ALL' ? 26 : role.scope === 'DEPT' ? 12 : 5;
    const score = clamp(privilege * 0.9 + scope + role.users * 2);
    return {
      id: `role-${role.code}`,
      type: 'role',
      target: role.name,
      score,
      band: band(score),
      reasons: [
        `授权动作 ${grants.length} 项`,
        `数据范围 ${role.scope}`,
        `关联用户 ${role.users} 人`
      ]
    };
  });
  const userItems = users.map((user) => {
    const userRoles = roles.filter((role) => user.roles.includes(role.code));
    const roleScore = userRoles.reduce(
      (sum, role) => sum + (role.scope === 'ALL' ? 30 : role.scope === 'DEPT' ? 16 : 8),
      0
    );
    const status = user.status === 'locked' ? 18 : user.status === 'disabled' ? 24 : 4;
    const auditHits = auditLogs.filter((log) => log.actor === user.username).length;
    const score = clamp(roleScore + status + auditHits * 6);
    return {
      id: `user-${user.username}`,
      type: 'user',
      target: user.nickname || user.username,
      score,
      band: band(score),
      reasons: [
        `角色 ${user.roles.join('、')}`,
        `账号状态 ${user.status}`,
        `关联审计 ${auditHits} 条`
      ]
    };
  });
  const actors = [...new Set(auditLogs.map((log) => log.actor))];
  const auditItems = actors.map((actor) => {
    const logs = auditLogs.filter((log) => log.actor === actor);
    const score = clamp(logs.reduce((sum, log) => sum + (levelWeight[log.level] || 6), 0));
    return {
      id: `audit-${actor}`,
      type: 'audit',
      target: actor,
      score,
      band: band(score),
      reasons: [
        `审计事件 ${logs.length} 条`,
        `最高级别 ${logs.some((l) => l.level === 'critical') ? 'critical' : logs.some((l) => l.level === 'warning') ? 'warning' : 'info'}`
      ]
    };
  });
  const jobItems = jobs.map((job) => {
    const success = Number.parseFloat(String(job.successRate).replace('%', '')) || 0;
    const status = job.status === 'paused' ? 26 : 8;
    const score = clamp((100 - success) * 2 + status);
    return {
      id: `job-${job.id}`,
      type: 'job',
      target: job.name,
      score,
      band: band(score),
      reasons: [`运行状态 ${job.status}`, `成功率 ${job.successRate}`, `Cron ${job.cron}`]
    };
  });
  const api = monitor.api || {};
  const apiScore = clamp((api.cpu || 0) * 0.35 + (api.memory || 0) * 0.45);
  const nodeItems = [
    {
      id: 'node-api-runtime',
      type: 'node',
      target: 'API Runtime',
      score: apiScore,
      band: band(apiScore),
      reasons: [`CPU ${api.cpu}%`, `内存 ${api.memory}%`, `QPS ${api.qps}`]
    },
    ...(monitor.nodes || []).map((node) => {
      const latency = Number.parseInt(String(node.latency).replace('ms', ''), 10) || 0;
      const status = node.status === 'degraded' ? 38 : 6;
      const score = clamp(latency * 0.45 + status);
      return {
        id: `node-${node.name}`,
        type: 'node',
        target: node.name,
        score,
        band: band(score),
        reasons: [`节点状态 ${node.status}`, `延迟 ${node.latency}`]
      };
    })
  ];
  const items = [...roleItems, ...userItems, ...auditItems, ...jobItems, ...nodeItems].sort(
    (a, b) => b.score - a.score
  );
  const overview = {
    total: items.length,
    average: clamp(items.reduce((sum, item) => sum + item.score, 0) / Math.max(items.length, 1)),
    critical: items.filter((i) => i.band === 'critical').length,
    high: items.filter((i) => i.band === 'high').length,
    medium: items.filter((i) => i.band === 'medium').length,
    low: items.filter((i) => i.band === 'low').length
  };
  return {
    overview,
    formula: '风险分 = 权限敏感度 + 审计级别权重 + 任务稳定性 + 节点资源压力 + 状态修正',
    updatedAt: new Date().toISOString(),
    items
  };
}
