'use client';

import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../lib/api';
import { z } from 'zod';
import { TermSchema } from '@packages/types';

export default function TermsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const res = await apiFetch('/terms');
      const json = await res.json();
      return z.array(TermSchema).parse(json);
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load</div>;

  return (
    <div>
      <h1>Terms</h1>
      <ul>
        {data!.map((t) => (
          <li key={t.id}>
            {t.year}-{t.semester}
          </li>
        ))}
      </ul>
    </div>
  );
}
