/**
 * Базовый URL
 */
export const BASE = "http://localhost:8080";

/**
 * Унифицированный HTTP-запрос
 */
export async function request(path, init = {}) {
  const token = localStorage.getItem('token');

  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) throw { status: res.status, body: data };
  return data;
}

export const http = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: (path, body) =>
    request(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};


export async function deleteAd(adId) {
  return http.delete(`/ads/${adId}`);
}
