const env = import.meta.env || {};
export const apiBase = env.VITE_API_BASE || 'http://localhost:4160/api';

async function errorMessage(res) {
  try {
    const payload = await res.json();
    return payload.message || payload.error || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function api(path, options = {}) {
  const token = globalThis.localStorage?.getItem?.('token') || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const res = await fetch(apiBase + path, {
    ...options,
    headers
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json();
}
