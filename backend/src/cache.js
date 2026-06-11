const store = new Map();

export function cachedJson(key, ttlMs, factory) {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return { ...hit.payload, meta: { ...(hit.payload.meta || {}), cache: 'hit', cachedAt: hit.cachedAt } };
  }
  const data = factory();
  const payload = { data, meta: { cache: 'miss', generatedAt: new Date(now).toISOString(), ttlMs } };
  store.set(key, { payload, cachedAt: payload.meta.generatedAt, expiresAt: now + ttlMs });
  return payload;
}

export function clearCache() { store.clear(); }
