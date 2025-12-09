export const BASE = "https://adnet.website/api"; 

export async function request(path, init = {}) {
  const token = localStorage.getItem('token');
  console.log(`🌐 Запрос ${path}, токен:`, token ? 'Есть' : 'Нет');
  
  const isFormData = init.body instanceof FormData;
  const headers = { ...init.headers };
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`📤 Отправляю заголовок Authorization`);
  } else {
    console.warn(`⚠️ Запрос ${path} без токена!`);
  }
  
  console.log(`📝 Заголовки запроса:`, headers);
  
  const res = await fetch(BASE + path, {
    ...init,
    headers,
    credentials: 'include',  // ← ВАЖНО!
  });
  
  console.log(`📥 Ответ ${path}:`, res.status, res.statusText);
  
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    console.error(`❌ Ошибка ${res.status} для ${path}:`, data);
    throw { status: res.status, body: data };
  }
  
  console.log(`✅ Успешный ответ от ${path}:`, data);
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
};