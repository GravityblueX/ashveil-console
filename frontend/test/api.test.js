import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { api, apiBase } from '../src/api.js';

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
