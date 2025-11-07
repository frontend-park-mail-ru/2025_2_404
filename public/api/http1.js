
export const BASE = "http://89.208.230.119:8080";

/**
 * Унифицированный HTTP-запрос
 */
async function request(path, init = {}) {
  const token = localStorage.getItem('token');
  const headers = init.headers || {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...init,
    headers,
  };
  
  const res = await fetch(BASE + path, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw { status: res.status, body: data };
  }
  return data;
}

export const http = {
  get: (path) => request(path),
  
  post: (path, body) =>
    request(path, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}) 
    }),
  
  put: (path, body) =>
    request(path, { 
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}) 
    }),
  putFormData: (path, formData) =>
    request(path, {
      method: 'PUT',
      body: formData,
    }),
  
  delete: (path) => request(path, { method: 'DELETE' }),
};