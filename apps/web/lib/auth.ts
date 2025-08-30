import apiFetch, { setAccessToken } from './api';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceLabel: z.string().optional()
});

export type LoginInput = z.infer<typeof LoginSchema>;

export async function login(input: LoginInput) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  setAccessToken(data.access);
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', data.access);
  }
}

export async function logout() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  await fetch(`${base}/auth/logout`, { method: 'POST', credentials: 'include' });
  setAccessToken(null);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
  }
}

export function initAuth() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) setAccessToken(token);
  }
}
