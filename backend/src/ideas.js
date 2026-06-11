export const featureIdeas = [
  {
    id: 'idea-001',
    title: '权限快照对比',
    category: '权限审计',
    priority: 'P0',
    stage: 'next',
    impact: 94,
    effort: 62,
    summary: '记录角色与用户权限快照，支持对比某两次授权状态差异。',
    reason: 'Ashveil 的核心是观察灰域变化，权限变化是最重要的灰域信号之一。'
  },
  {
    id: 'idea-002',
    title: '灰域事件处理流',
    category: '风险处置',
    priority: 'P0',
    stage: 'next',
    impact: 91,
    effort: 58,
    summary: '为风险事件增加处理人、备注、确认时间和归档原因。',
    reason: '让风险事件中心从展示走向可追踪处置闭环。'
  },
  {
    id: 'idea-003',
    title: '夜间值守交接班',
    category: '夜间值守',
    priority: 'P1',
    stage: 'planned',
    impact: 86,
    effort: 52,
    summary: '增加交接班记录、值守备注和待跟进事项。',
    reason: '强化 Ashveil 夜间值守控制台的原创产品设定。'
  },
  {
    id: 'idea-004',
    title: '灰域地图',
    category: '关系观察',
    priority: 'P1',
    stage: 'planned',
    impact: 88,
    effort: 74,
    summary: '把用户、角色、权限、操作日志、风险事件串成可视化关系图。',
    reason: '从单点指标升级为关系观察，更符合灰域观察平台方向。'
  },
  {
    id: 'idea-005',
    title: 'SQLite + Prisma 数据层',
    category: '真实数据',
    priority: 'P0',
    stage: 'research',
    impact: 96,
    effort: 80,
    summary: '把 mock 数据逐步迁移到 SQLite + Prisma，形成可持久化系统。',
    reason: '这是从原型走向真实产品的关键基础设施。'
  }
];

export function buildRoadmap() {
  const stages = [
    { key: 'next', name: '下一步', description: '最适合立即执行的增强项' },
    { key: 'planned', name: '计划中', description: '已确认价值但需要排期的功能' },
    { key: 'research', name: '调研中', description: '影响较大、需要技术方案拆解的方向' }
  ];
  return {
    overview: {
      total: featureIdeas.length,
      p0: featureIdeas.filter((item) => item.priority === 'P0').length,
      averageImpact: Math.round(
        featureIdeas.reduce((sum, item) => sum + item.impact, 0) / featureIdeas.length
      ),
      nextCandidate: featureIdeas.sort((a, b) => b.impact - a.impact)[0].title
    },
    stages: stages.map((stage) => ({
      ...stage,
      items: featureIdeas.filter((item) => item.stage === stage.key)
    }))
  };
}
