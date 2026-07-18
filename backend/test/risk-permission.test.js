import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import request from 'supertest';
import { RISK_EVENT_STATUS_NOTE_MAX_LENGTH } from '../src/risk-events.js';
import { parseRiskStatusPayload } from '../src/risk-status-payload.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.JWT_SECRET = 'ashveil-test-secret';

const { default: app } = await import('../src/server.js');

async function loginToken() {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'ashveil2026' })
    .expect(200);
  return response.body.token;
}

describe('Ashveil risk and access regression contract', () => {
  it('returns a permission matrix with role grants and data-source meta', async () => {
    const token = await loginToken();

    const response = await request(app)
      .get('/api/access/permission-matrix')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.ok(Array.isArray(response.body.resources));
    assert.ok(response.body.resources.some((item) => item.key === 'audit'));
    assert.ok(response.body.grants.ROOT.includes('users:disable'));
    assert.ok(response.body.grants.AUDITOR.includes('audit:export'));
    assert.equal(response.body.meta.source, 'mock');
  });

  it('keeps audit summary counts consistent with the audit log feed', async () => {
    const token = await loginToken();
    const [summary, logs] = await Promise.all([
      request(app).get('/api/audit/summary').set('Authorization', `Bearer ${token}`).expect(200),
      request(app).get('/api/audit/logs').set('Authorization', `Bearer ${token}`).expect(200)
    ]);

    const levelTotal = Object.values(summary.body.levelCount).reduce(
      (sum, count) => sum + count,
      0
    );
    const channelTotal = Object.values(summary.body.channelCount).reduce(
      (sum, count) => sum + count,
      0
    );

    assert.equal(summary.body.total, logs.body.length);
    assert.equal(levelTotal, summary.body.total);
    assert.equal(channelTotal, summary.body.total);
    assert.ok(summary.body.latest.length <= 6);
  });

  it('returns risk events with overview buckets matching the event list', async () => {
    const token = await loginToken();

    const response = await request(app)
      .get('/api/risk/events')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const { overview, events } = response.body;
    const bucketTotal =
      overview.pending +
      overview.processing +
      overview.confirmed +
      overview.ignored +
      overview.archived;

    assert.equal(overview.total, events.length);
    assert.equal(bucketTotal, events.length);
    assert.ok(events.every((event) => event.eventKey && event.title && event.suggestion));
    assert.ok(events.every((event) => event.displayId && event.defaultStatus));
    assert.ok(events.every((event) => Array.isArray(event.reasons)));
    assert.equal(response.body.meta.source, 'mock');
  });

  it('keeps the Prisma risk-event schema aligned with persisted status fields', async () => {
    const schema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
    const riskEventModel = schema.match(/^model RiskEvent \{([\s\S]*?)^}/m)?.[1] || '';

    for (const field of ['status', 'statusNote', 'handledBy', 'statusChangedAt', 'logs']) {
      assert.match(riskEventModel, new RegExp(`\\b${field}\\b`));
    }

    assert.match(schema, /model RiskEventStatusLog \{/);
    assert.match(schema, /event\s+RiskEvent\s+@relation/);
  });

  it('rejects unsupported risk event statuses in the payload parser', () => {
    assert.deepEqual(parseRiskStatusPayload({ status: 'made-up-status', note: 'smoke' }), {
      error: '不支持的风险事件状态'
    });
  });

  it('normalizes supported risk event status payload values', () => {
    assert.deepEqual(parseRiskStatusPayload({ status: ' processing ', note: '  smoke note  ' }), {
      value: {
        status: 'processing',
        note: 'smoke note'
      }
    });
  });

  it('rejects unsupported risk event status before persistence is attempted', async () => {
    const token = await loginToken();

    const response = await request(app)
      .patch('/api/risk/events/risk%3Auser%3A1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'made-up-status', note: 'should not persist' })
      .expect(400);

    assert.equal(response.body.message, '不支持的风险事件状态');
  });

  it('rejects oversized risk event keys before payload handling', async () => {
    const token = await loginToken();
    const oversizedKey = 'risk:' + 'x'.repeat(90);

    const response = await request(app)
      .patch(`/api/risk/events/${oversizedKey}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'processing', note: 'should not persist' })
      .expect(400);

    assert.equal(response.body.message, '风险事件标识不能超过 80 个字符');
  });

  it('rejects malformed risk event keys before payload handling', async () => {
    const token = await loginToken();

    const response = await request(app)
      .patch('/api/risk/events/risk%3Auser%3A1%20bad/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'processing', note: 'should not persist' })
      .expect(400);

    assert.equal(response.body.message, '风险事件标识只能包含字母、数字、冒号、下划线和连字符');
  });

  it('rejects missing risk event status before repository handling', async () => {
    const token = await loginToken();

    const response = await request(app)
      .patch('/api/risk/events/risk%3Auser%3A1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'missing status' })
      .expect(400);

    assert.equal(response.body.message, '风险事件状态必须是非空字符串');
  });

  it('rejects non-string risk event notes', async () => {
    const token = await loginToken();

    const response = await request(app)
      .patch('/api/risk/events/risk%3Auser%3A1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'processing', note: 123 })
      .expect(400);

    assert.equal(response.body.message, '风险事件处置备注必须是字符串');
  });

  it('rejects oversized risk event notes before persistence is attempted', async () => {
    const token = await loginToken();

    const response = await request(app)
      .patch('/api/risk/events/risk%3Auser%3A1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'processing', note: 'x'.repeat(RISK_EVENT_STATUS_NOTE_MAX_LENGTH + 1) })
      .expect(400);

    assert.equal(
      response.body.message,
      `风险事件处置备注不能超过 ${RISK_EVENT_STATUS_NOTE_MAX_LENGTH} 个字符`
    );
  });

  it('normalizes padded risk event status values before repository handling', async () => {
    const token = await loginToken();

    const response = await request(app)
      .patch('/api/risk/events/risk%3Auser%3A1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: ' processing ', note: '  smoke note  ' })
      .expect(503);

    assert.equal(response.body.message, 'Prisma 不可用，无法持久化风险事件状态');
  });

  it('rejects extra fields in risk event status requests', async () => {
    const token = await loginToken();

    const response = await request(app)
      .patch('/api/risk/events/risk%3Auser%3A1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'processing', note: 'ok', handledBy: 'spoofed' })
      .expect(400);

    assert.equal(response.body.message, '不支持的风险事件状态字段：handledBy');
  });

  it('reports extra risk event status fields in stable sorted order', async () => {
    const token = await loginToken();

    const response = await request(app)
      .patch('/api/risk/events/risk%3Auser%3A1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'processing', note: 'ok', zeta: 'spoofed', handledBy: 'spoofed' })
      .expect(400);

    assert.equal(response.body.message, '不支持的风险事件状态字段：handledBy, zeta');
  });

  it('returns structured JSON errors for malformed JSON request bodies', async () => {
    const token = await loginToken();

    const response = await request(app)
      .patch('/api/risk/events/risk%3Auser%3A1/status')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send('{"status":')
      .expect(400);

    assert.equal(response.body.message, '请求体必须是合法 JSON');
  });
});
