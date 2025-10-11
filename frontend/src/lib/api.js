const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

export const api = { get: apiGet, post: apiPost };

