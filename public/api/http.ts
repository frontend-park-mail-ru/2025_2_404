import { getCookie } from '../utils/cookie';

export const BASE = "";


interface RequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
}

export async function request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getCookie('token');
  const isFormData = init.body instanceof FormData;
  const headers: Record<string, string> = { ...init.headers };
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(BASE + path, {
    ...init,
    headers,
    credentials: 'include',
  });
  
  const text = await res.text();
  let data: T | null = null;
  
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text as unknown as T;
  }

  if (!res.ok) {
    throw { status: res.status, body: data };
  }
  
  return data as T;
}

export const http = {
  get: <T = unknown>(path: string): Promise<T> => request<T>(path),
  
  post: <T = unknown>(path: string, body?: unknown): Promise<T> => request<T>(path, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  }),
  
  put: <T = unknown>(path: string, body?: unknown): Promise<T> => request<T>(path, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  }),

  patch: <T = unknown>(path: string, body?: unknown): Promise<T> => request<T>(path, {
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  }),

  delete: <T = unknown>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' }),
  
  putFormData: <T = unknown>(path: string, formData: FormData): Promise<T> => request<T>(path, {
    method: 'PUT',
    body: formData,
  }),
};
