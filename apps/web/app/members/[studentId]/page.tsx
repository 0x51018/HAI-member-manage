'use client';

import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../../lib/api';
import { MemberDetailSchema } from '@packages/types';

export default function MemberDetailPage({ params }: { params: { studentId: string } }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['member', params.studentId],
    queryFn: async () => {
      const res = await apiFetch(`/members/${params.studentId}`);
      const json = await res.json();
      return MemberDetailSchema.parse(json);
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
      <h2>Recent Memos</h2>
      <ul>
        {data.recentMemos.map((m) => (
          <li key={m.id}>{m.body}</li>
        ))}
      </ul>
    </div>
  );
}
