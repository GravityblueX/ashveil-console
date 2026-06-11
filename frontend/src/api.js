const base = import.meta.env.VITE_API_BASE || 'http://localhost:4160/api';
export async function api(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(base + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '', ...(options.headers || {}) }
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Request failed');
  return res.json();
}
