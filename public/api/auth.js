import { http } from './http1.js';

export async function signup(data) {
  const res = await http.post('/auth/register', data);
  const token = res.token || res.data?.token || res.body?.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  return res; 
}

export async function signin(data) {
  const res = await http.post('/auth/login', data);
  const token = res.token || res.data?.token || res.body?.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  return res; 
}

export function logout() {
  localStorage.removeItem('token');
}