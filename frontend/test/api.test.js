import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { api, apiBase, apiUrl } from '../src/api.js';

const calls = [];

function installFetch(response) {
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return response;
  };
}

describe('frontend API client contract', () => {
  beforeEach(() => {
    calls.length = 0;
    globalThis.localStorage = {
      getItem(key) {
        return key === 'token' ? 'test-token' : null;
      }
    };
  });

  it('normalizes API base and path slashes', () => {
    assert.equal(apiUrl('/dashboard'), `${apiBase}/dashboard`);
    assert.equal(apiUrl('dashboard'), `${apiBase}/dashboard`);
    assert.equal(
      apiUrl('/dashboard', 'https://api.example.test/api/'),
      'https://api.example.test/api/dashboard'
    );
    assert.equal(
      apiUrl('dashboard', 'https://api.example.test/api/'),
      'https://api.example.test/api/dashboard'
    );
  });

  it('uses the default API base outside Vite and sends bearer tokens', async () => {
    installFetch({
      ok: true,
      json: async () => ({ ok: true })
    });

    const payload = await api('/dashboard');

    assert.equal(payload.ok, true);
    assert.equal(calls[0].url, `${apiBase}/dashboard`);
    assert.equal(calls[0].init.headers.Authorization, 'Bearer test-token');
    assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
  });

  it('lets callers override headers without dropping authorization', async () => {
    installFetch({
      ok: true,
      json: async () => ({ saved: true })
    });

    await api('/risk/events', { headers: { 'X-Request-Id': 'req-1' } });

    assert.equal(calls[0].init.headers.Authorization, 'Bearer test-token');
    assert.equal(calls[0].init.headers['X-Request-Id'], 'req-1');
  });

  it('continues without authorization when token storage is unavailable', async () => {
    globalThis.localStorage = {
      getItem() {
        throw new Error('storage unavailable');
      }
    };
    installFetch({
      ok: true,
      json: async () => ({ public: true })
    });

    const payload = await api('/health');

    assert.equal(payload.public, true);
    assert.equal(Object.hasOwn(calls[0].init.headers, 'Authorization'), false);
  });

  it('uses structured server error messages when available', async () => {
    installFetch({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Missing token' })
    });

    await assert.rejects(() => api('/dashboard'), /Missing token/);
  });

  it('falls back to status-based errors for non-json failures', async () => {
    installFetch({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('not json');
      }
    });

    await assert.rejects(() => api('/dashboard'), /Request failed \(502\)/);
  });
});
