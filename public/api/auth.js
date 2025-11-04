import { request } from './http.js';

/**
 * Регистрация пользователя
 */
export async function signup(data) {
  const res = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  const token = res.data?.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  return res;
}

/**
 * Вход пользователя
 */
export async function signin(data) {
  const res = await request('/auth/signin', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  const token = res.data?.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  return res;
}

/**
 * Выход
 */
export function logout() {
  localStorage.removeItem('token');
}
