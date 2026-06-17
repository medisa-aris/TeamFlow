'use client';

async function apiFetch(path, opts = {}) {
  const url = `/api/proxy/${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: 'include',
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.replace('/login');
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'API error');
    throw Object.assign(new Error(msg), { status: res.status, data: err });
  }

  return res;
}

export async function apiGet(path) {
  return (await apiFetch(path)).json();
}

export async function apiPost(path, body) {
  const res = await apiFetch(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function apiPatch(path, body) {
  return (await apiFetch(path, { method: 'PATCH', body: JSON.stringify(body || {}) })).json();
}

export async function apiDelete(path) {
  const res = await apiFetch(path, { method: 'DELETE' });
  if (res.status === 204) return {};
  return res.json();
}

export const api = { get: apiGet, post: apiPost, patch: apiPatch, delete: apiDelete };
