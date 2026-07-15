import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.JWT_SECRET = 'ashveil-test-secret';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const { LOGIN_PASSWORD_MAX_LENGTH, LOGIN_USERNAME_MAX_LENGTH } =
  await import('../src/auth-payload.js');
const { default: app } = await import('../src/server.js');

describe('Ashveil API smoke contract', () => {
  it('reports service health', async () => {
    const response = await request(app).get('/api/health').expect(200);

    assert.equal(response.body.ok, true);
    assert.equal(response.body.name, 'Ashveil Console API');
    assert.equal(response.body.version, pkg.version);
  });

  it('emits baseline security headers on API responses', async () => {
    const success = await request(app).get('/api/health').expect(200);
    const error = await request(app).get('/api/dashboard').expect(401);

    for (const response of [success, error]) {
      assert.equal(response.headers['cache-control'], 'no-store');
      assert.equal(response.headers['referrer-policy'], 'no-referrer');
      assert.equal(response.headers['x-content-type-options'], 'nosniff');
      assert.equal(response.headers['x-frame-options'], 'DENY');
    }
  });

  it('rejects protected routes without a token', async () => {
    const response = await request(app).get('/api/dashboard').expect(401);

    assert.equal(response.body.message, 'Missing token');
  });

  it('rejects malformed authorization headers before JWT verification', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', 'Basic not-a-bearer-token')
      .expect(401);

    assert.equal(response.body.message, 'Authorization header must use Bearer token');
  });

  it('rejects bearer headers with whitespace inside the token before JWT verification', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', 'Bearer first second')
      .expect(401);

    assert.equal(response.body.message, 'Authorization header must contain a single Bearer token');
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

  it('accepts the bearer authorization scheme case-insensitively', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'ashveil2026' })
      .expect(200);

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `bearer ${login.body.token}`)
      .expect(200);

    assert.equal(response.body.user.username, 'admin');
  });

  it('rejects signed tokens with missing auth claims', async () => {
    const malformedToken = jwt.sign({ username: 'admin', roles: ['ROOT'] }, 'ashveil-test-secret');

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${malformedToken}`)
      .expect(401);

    assert.equal(response.body.message, 'Invalid token');
  });

  it('rejects non-object login payloads with a structured error', async () => {
    const response = await request(app).post('/api/auth/login').send([]).expect(400);

    assert.equal(response.body.message, '登录请求体必须是 JSON 对象');
  });

  it('rejects missing login credentials before checking accounts', async () => {
    const missingUsername = await request(app)
      .post('/api/auth/login')
      .send({ username: ' ', password: 'ashveil2026' })
      .expect(400);

    const missingPassword = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: '' })
      .expect(400);

    assert.equal(missingUsername.body.message, '用户名必须是非空字符串');
    assert.equal(missingPassword.body.message, '密码必须是非空字符串');
  });

  it('rejects extra login fields before checking accounts', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'ashveil2026', roles: ['ROOT'] })
      .expect(400);

    assert.equal(response.body.message, '不支持的登录字段：roles');
  });

  it('rejects oversized login credentials before checking accounts', async () => {
    const oversizedUsername = await request(app)
      .post('/api/auth/login')
      .send({ username: 'u'.repeat(LOGIN_USERNAME_MAX_LENGTH + 1), password: 'ashveil2026' })
      .expect(400);

    const oversizedPassword = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'p'.repeat(LOGIN_PASSWORD_MAX_LENGTH + 1) })
      .expect(400);

    assert.equal(
      oversizedUsername.body.message,
      `用户名不能超过 ${LOGIN_USERNAME_MAX_LENGTH} 个字符`
    );
    assert.equal(
      oversizedPassword.body.message,
      `密码不能超过 ${LOGIN_PASSWORD_MAX_LENGTH} 个字符`
    );
  });

  it('rejects oversized JSON request bodies before payload parsing', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(
        JSON.stringify({
          username: 'admin',
          password: 'p'.repeat(40_000)
        })
      )
      .expect(413);

    assert.equal(response.body.message, '请求体不能超过 32kb');
  });
});
