import { RISK_EVENT_STATUSES, RISK_EVENT_STATUS_NOTE_MAX_LENGTH } from './risk-events.js';

export function parseRiskStatusPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: '风险事件状态请求体必须是 JSON 对象' };
  }

  const allowedKeys = new Set(['status', 'note']);
  const unknownKeys = Object.keys(body)
    .filter((key) => !allowedKeys.has(key))
    .sort();
  if (unknownKeys.length > 0) {
    return { error: `不支持的风险事件状态字段：${unknownKeys.join(', ')}` };
  }

  const status = typeof body.status === 'string' ? body.status.trim() : '';
  if (status.length === 0) {
    return { error: '风险事件状态必须是非空字符串' };
  }
  if (!RISK_EVENT_STATUSES.includes(status)) {
    return { error: '不支持的风险事件状态' };
  }

  let note;
  if (body.note !== undefined) {
    if (typeof body.note !== 'string') {
      return { error: '风险事件处置备注必须是字符串' };
    }
    note = body.note.trim();
    if (note.length > RISK_EVENT_STATUS_NOTE_MAX_LENGTH) {
      return { error: `风险事件处置备注不能超过 ${RISK_EVENT_STATUS_NOTE_MAX_LENGTH} 个字符` };
    }
  }

  return {
    value: {
      status,
      note
    }
  };
}
