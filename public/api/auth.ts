import { http } from './http';
import type { AuthResponse, LoginCredentials, RegisterInfo } from '../../src/types';

export async function signup(data: RegisterInfo): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>('/auth/signup', data);
  const token = res.data?.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  return res;
}

export async function signin(data: LoginCredentials): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>('/auth/signin', data);
  const token = res.data?.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  return res;
}

export function logout(): void {
  localStorage.removeItem('token');
}
