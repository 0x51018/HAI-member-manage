'use client';

import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../lib/api';
import { z } from 'zod';
import { AuditLogSchema } from '@packages/types';

export default function AuditPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit'],
    queryFn: async () => {
      const res = await apiFetch('/audit');
      const json = await res.json();
      return z.array(AuditLogSchema).parse(json);
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load</div>;

  return (
    <div>
      <h1>Audit Logs</h1>
      <ul>
        {data!.map((log) => (
          <li key={log.id}>
            {log.action} - {log.at}
          </li>
        ))}
      </ul>
    </div>
  );
}
