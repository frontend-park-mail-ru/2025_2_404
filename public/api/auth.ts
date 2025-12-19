import { http } from './http';
import { setCookie, removeCookie } from '../utils/cookie';
import type { AuthResponse, LoginCredentials, RegisterInfo } from '../../src/types';

export async function signup(data: RegisterInfo): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>('/api/auth/register', data);
  const token = (res as any).token || (res as any).data?.token || (res as any).body?.token;
  if (token) {
    setCookie('token', token);
  }
  return res;
}

export async function signin(data: LoginCredentials): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>('/api/auth/login', data);
  const token = (res as any).token || (res as any).data?.token || (res as any).body?.token;
  if (token) {
    setCookie('token', token);
  }
  return res;
}

export function logout(): void {
  removeCookie('token');
}
