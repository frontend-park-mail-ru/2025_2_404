import { http } from './http';
import type { AuthResponse, LoginCredentials, RegisterInfo } from '../../src/types';

export async function signup(data: RegisterInfo): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>('/auth/register', data);
  // Ищем токен везде
  const token = (res as any).token || (res as any).data?.token || (res as any).body?.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  return res;
}

export async function signin(data: LoginCredentials): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>('/auth/login', data);
  // Ищем токен везде
  const token = (res as any).token || (res as any).data?.token || (res as any).body?.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  return res;
}

export function logout(): void {
  localStorage.removeItem('token');
}
