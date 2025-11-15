import { http } from './http1.js';


export async function signup(data) {

  const res = await http.post('/auth/signup', data);
  const token = res.data?.token;
  if (token) {
    localStorage.setItem('token', token);
  }

  return res; 
}
export async function signin(data) {
  const res = await http.post('/auth/signin', data);
  const token = res.data?.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  
  return res; 
}

export function logout() {
  localStorage.removeItem('token');
}
