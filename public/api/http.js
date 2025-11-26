/* export const BASE = "http://localhost:8080"; 

export async function request(path, init = {}) {
  const token = localStorage.getItem('token');
  const isFormData = init.body instanceof FormData;
  const headers = { ...init.headers };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(BASE + path, {
    ...init,
    headers, 
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw { status: res.status, body: data };
  }
  return data;
}

export const http = {
  get: (path) => request(path),
  post: (path, body) => request(path, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  }),
  put: (path, body) => request(path, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  }),

  delete: (path) => request(path, { method: 'DELETE' }),
  putFormData: (path, formData) => request(path, {
    method: 'PUT',
    body: formData,
  }),
}; */