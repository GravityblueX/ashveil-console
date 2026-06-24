import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import request from 'supertest';

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
      request(app).get('/api/audit/logs').set('Authorization', `Bearer ${token}`).expect(200),
    ]);

    const levelTotal = Object.values(summary.body.levelCount).reduce((sum, count) => sum + count, 0);
    const channelTotal = Object.values(summary.body.channelCount).reduce((sum, count) => sum + count, 0);

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
    assert.equal(response.body.meta.source, 'mock');
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
});
