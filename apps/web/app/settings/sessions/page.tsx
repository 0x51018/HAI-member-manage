'use client';

import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../../lib/api';
import { logout } from '../../../lib/auth';
import { z } from 'zod';
import { SessionSchema } from '@packages/types';

export default function SessionsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await apiFetch('/devices');
      const json = await res.json();
      return z.array(SessionSchema).parse(json);
    }
  });

  const handleDelete = async (id: string) => {
    await apiFetch(`/devices/${id}`, { method: 'DELETE' });
    refetch();
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load</div>;

  return (
    <div>
      <h1>Sessions</h1>
      <button onClick={handleLogout}>Logout</button>
      <ul>
        {data!.map((s) => (
          <li key={s.id}>
            {s.deviceLabel || s.userAgent || 'Unknown'} - Last used: {new Date(s.lastUsedAt).toLocaleString()} - {s.ip}
            <button onClick={() => handleDelete(s.id)} disabled={s.current} style={{ marginLeft: 8 }}>
              Delete
            </button>
            {s.current && ' (current)'}
          </li>
        ))}
      </ul>
    </div>
  );
}
