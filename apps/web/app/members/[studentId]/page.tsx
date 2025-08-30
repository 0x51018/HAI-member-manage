'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';
import apiFetch from '../../../lib/api';
import { MemberDetailSchema, MemoSchema } from '@packages/types';

export default function MemberDetailPage({ params }: { params: { studentId: string } }) {
  const queryClient = useQueryClient();
  const [memoBody, setMemoBody] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['member', params.studentId],
    queryFn: async () => {
      const res = await apiFetch(`/members/${params.studentId}`);
      const json = await res.json();
      return MemberDetailSchema.parse(json);
    }
  });

  const {
    data: memos,
    isLoading: memosLoading,
    error: memosError
  } = useQuery({
    queryKey: ['member', params.studentId, 'memos'],
    queryFn: async () => {
      const res = await apiFetch(`/members/${params.studentId}/memos`);
      const json = await res.json();
      return z.array(MemoSchema).parse(json);
    }
  });

  const createMemo = useMutation({
    mutationFn: async (body: string) => {
      const res = await apiFetch(`/members/${params.studentId}/memos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body })
      });
      const json = await res.json();
      return MemoSchema.parse(json);
    },
    onSuccess: () => {
      setMemoBody('');
      queryClient.invalidateQueries({ queryKey: ['member', params.studentId, 'memos'] });
      queryClient.invalidateQueries({ queryKey: ['member', params.studentId] });
    }
  });

  const deleteMemo = useMutation({
    mutationFn: async (memoId: string) => {
      await apiFetch(`/members/${params.studentId}/memos/${memoId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', params.studentId, 'memos'] });
      queryClient.invalidateQueries({ queryKey: ['member', params.studentId] });
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error || !data) return <div>Failed to load</div>;

  return (
    <div>
      <h1>
        {data.name} ({data.studentId})
      </h1>
      <p>Status: {data.status}</p>
      <p>Phone: {data.phone ?? '-'}</p>
      <h2>Memos</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!memoBody.trim()) return;
          createMemo.mutate(memoBody);
        }}
      >
        <textarea value={memoBody} onChange={(e) => setMemoBody(e.target.value)} />
        <button type="submit" disabled={createMemo.isLoading}>
          Add Memo
        </button>
      </form>
      {memosLoading && <div>Loading memos...</div>}
      {memosError && <div>Failed to load memos</div>}
      {memos && (
        <ul>
          {memos.map((m) => (
            <li key={m.id}>
              {m.body}{' '}
              <button onClick={() => deleteMemo.mutate(m.id)} disabled={deleteMemo.isLoading}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
