let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export default async function apiFetch(path: string, options: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  const headers = new Headers(options.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const res = await fetch(`${base}${path}`, { ...options, headers, credentials: 'include' });
  if (res.status === 401) {
    const refreshRes = await fetch(`${base}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setAccessToken(data.access);
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.access);
      }
      headers.set('Authorization', `Bearer ${data.access}`);
      const retry = await fetch(`${base}${path}`, { ...options, headers, credentials: 'include' });
      if (retry.ok) return retry;
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res;
}
