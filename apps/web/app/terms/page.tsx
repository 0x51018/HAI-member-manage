'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '../../lib/api';
import { z } from 'zod';
import { TermSchema, TermCreateSchema, MeetingBulkSchema } from '@packages/types';
import { useState } from 'react';
import Link from 'next/link';

export default function TermsPage() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('S1');
  const [bulkTermId, setBulkTermId] = useState('');
  const [bulkItems, setBulkItems] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const res = await apiFetch('/terms');
      const json = await res.json();
      return z.array(TermSchema).parse(json);
    }
  });

  const createTerm = useMutation({
    mutationFn: async () => {
      const body = TermCreateSchema.parse({ year: Number(year), semester });
      const res = await apiFetch('/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      return TermSchema.parse(json);
    },
    onSuccess: () => {
      setYear('');
      setSemester('S1');
      queryClient.invalidateQueries({ queryKey: ['terms'] });
    }
  });

  const bulkMeetings = useMutation({
    mutationFn: async () => {
      const items = JSON.parse(bulkItems);
      const body = MeetingBulkSchema.parse({ items });
      await apiFetch(`/terms/${bulkTermId}/meetings/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    },
    onSuccess: () => {
      setBulkItems('');
      setBulkTermId('');
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load</div>;

  return (
    <div>
      <h1>Terms</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!year) return;
          createTerm.mutate();
        }}
      >
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          type="number"
          placeholder="Year"
          required
        />
        <select value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="S1">S1</option>
          <option value="S2">S2</option>
        </select>
        <button type="submit" disabled={createTerm.isLoading}>
          Create Term
        </button>
      </form>

      <h2>Bulk Meeting Days</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!bulkTermId || !bulkItems.trim()) return;
          bulkMeetings.mutate();
        }}
      >
        <input
          value={bulkTermId}
          onChange={(e) => setBulkTermId(e.target.value)}
          placeholder="Term ID"
          required
        />
        <br />
        <textarea
          value={bulkItems}
          onChange={(e) => setBulkItems(e.target.value)}
          placeholder='[{"ordinal":1,"date":"2024-03-01"}]'
          rows={4}
          cols={40}
          required
        />
        <br />
        <button type="submit" disabled={bulkMeetings.isLoading}>
          Submit
        </button>
      </form>

      <h2>Term List</h2>
      <ul>
        {data!.map((t) => (
          <li key={t.id}>
            <Link href={`/terms/${t.id}`}>{t.year}-{t.semester}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
