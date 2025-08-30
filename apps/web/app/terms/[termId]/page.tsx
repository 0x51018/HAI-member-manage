'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import apiFetch from '../../../lib/api';
import { z } from 'zod';
import { SectionSchema, TeamSchema, SectionCreateSchema } from '@packages/types';

const SectionWithTeamsSchema = SectionSchema.extend({
  teams: z.array(TeamSchema)
});

export default function TermDetailPage({ params }: { params: { termId: string } }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['termSections', params.termId],
    queryFn: async () => {
      const res = await apiFetch(`/terms/${params.termId}/sections?with=teams`);
      const json = await res.json();
      return z.array(SectionWithTeamsSchema).parse(json);
    }
  });

  const createSection = useMutation({
    mutationFn: async () => {
      const body = SectionCreateSchema.parse({ name });
      const res = await apiFetch(`/terms/${params.termId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      return SectionSchema.parse(json);
    },
    onSuccess: () => {
      setName('');
      queryClient.invalidateQueries({ queryKey: ['termSections', params.termId] });
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load</div>;

  return (
    <div>
      <h1>Term {params.termId}</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          createSection.mutate();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Section name"
          required
        />
        <button type="submit" disabled={createSection.isLoading}>
          Create Section
        </button>
      </form>
      <h2>Sections</h2>
      <ul>
        {data!.map((s) => (
          <li key={s.id}>
            <Link href={`/sections/${s.id}?termId=${params.termId}`}>{s.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
