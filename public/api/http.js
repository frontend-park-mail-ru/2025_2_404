/**
 * Базовый URL всех запросов
 */
const BASE = "http://localhost:3000/api/v1";

/**
 * Безопасный JSON-парсер: если сервер вернул не-JSON, вернём сырой текст
 * @param {string} text
 * @returns {any}
 */
function safeJSON(text) {
  try { return JSON.parse(text); }
  catch { return text; }
}

/**
 * Унифицированный HTTP-запрос.
 * - всегда отправляет credentials: "include" (чтобы ходила HttpOnly кука sid)
 * - добавляет Content-Type: application/json
 * - парсит JSON или возвращает текст
 * - при ошибке кидает объект { status, body }
 *
 * @param {string} path относительный путь, например "/auth/signin"
 * @param {RequestInit} [init]
 * @returns {Promise<any>} распарсенный JSON (или null для 204)
 * @throws {{status:number, body:any}}
 */
export async function request(path, init = {}) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    credentials: "include", 
  });

  const text = await res.text();
  const data = text ? safeJSON(text) : null;

  if (!res.ok) {
    throw { status: res.status, body: data };
  }
  return data;
}

/**
 * Шорткаты для удобства.
 */
export const http = {
  get:  (path)        => request(path),
  post: (path, body)  => request(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
};

