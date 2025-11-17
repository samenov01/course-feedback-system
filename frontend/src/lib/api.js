// If VITE_API_URL is not set, use same-origin ("/api" paths)
const RAW_BASE = import.meta.env.VITE_API_URL || "";
const BASE_URL = RAW_BASE ? RAW_BASE.replace(/\/+$/, "") : "";

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeader(token) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPatch(path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: { ...authHeader(token) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = { get: apiGet, post: apiPost, patch: apiPatch, del: apiDelete };

