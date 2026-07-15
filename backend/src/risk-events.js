import { buildRiskScores } from './risk.js';

export const RISK_EVENT_STATUSES = ['pending', 'processing', 'confirmed', 'ignored', 'archived'];
export const RISK_EVENT_STATUS_NOTE_MAX_LENGTH = 500;

function eventStatus(item) {
  if (item.band === 'critical') return 'pending';
  if (item.band === 'high') return 'processing';
  if (item.band === 'medium') return 'confirmed';
  return 'archived';
}

function eventType(item) {
  const map = {
    role: '权限风险',
    user: '账号风险',
    audit: '审计风险',
    job: '任务风险',
    node: '节点风险'
  };
  return map[item.type] || '灰域风险';
}

function suggestion(item) {
  if (item.band === 'critical') return '建议立即复核并确认是否需要降权、暂停任务或进入应急处理。';
  if (item.band === 'high') return '建议安排值守人员跟进，补充审计备注并观察后续变化。';
  if (item.band === 'medium') return '建议保留观察，等待下一轮评分结果。';
  return '当前仅归档展示，无需立即处理。';
}

export function riskEventKey(item) {
  return `risk:${item.type}:${item.id}`;
}

export function buildRiskEvents(statusOverrides = {}) {
  const scores = buildRiskScores();
  const events = scores.items
    .filter((item) => item.score >= 35)
    .map((item, index) => {
      const eventKey = riskEventKey(item);
      return {
        id: eventKey,
        eventKey,
        displayId: `evt-${String(index + 1).padStart(4, '0')}`,
        title: `${eventType(item)}：${item.target}`,
        target: item.target,
        sourceType: item.type,
        score: item.score,
        level: item.band,
        status: statusOverrides[eventKey] || eventStatus(item),
        defaultStatus: eventStatus(item),
        reasons: item.reasons,
        suggestion: suggestion(item),
        createdAt: new Date(Date.now() - index * 1000 * 60 * 17).toISOString()
      };
    });
  const overview = {
    total: events.length,
    pending: events.filter((e) => e.status === 'pending').length,
    processing: events.filter((e) => e.status === 'processing').length,
    confirmed: events.filter((e) => e.status === 'confirmed').length,
    ignored: events.filter((e) => e.status === 'ignored').length,
    archived: events.filter((e) => e.status === 'archived').length
  };
  return { overview, events };
}
