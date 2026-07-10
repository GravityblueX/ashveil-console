import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.JWT_SECRET = 'ashveil-test-secret';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const { default: app } = await import('../src/server.js');

describe('Ashveil API smoke contract', () => {
  it('reports service health', async () => {
    const response = await request(app).get('/api/health').expect(200);

    assert.equal(response.body.ok, true);
    assert.equal(response.body.name, 'Ashveil Console API');
    assert.equal(response.body.version, pkg.version);
  });

  it('rejects protected routes without a token', async () => {
    const response = await request(app).get('/api/dashboard').expect(401);

    assert.equal(response.body.message, 'Missing token');
  });

  it('logs in with mock credentials and keeps passwords out of the response', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'ashveil2026' })
      .expect(200);

    assert.ok(response.body.token);
    assert.equal(response.body.user.username, 'admin');
    assert.ok(Array.isArray(response.body.user.roles));
    assert.ok(Array.isArray(response.body.menus));
    assert.equal(Object.hasOwn(response.body.user, 'password'), false);
  });
});
