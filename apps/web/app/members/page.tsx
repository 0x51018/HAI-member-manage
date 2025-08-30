'use client';

import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../lib/api';
import { z } from 'zod';
import { MemberSummarySchema } from '@packages/types';
import Link from 'next/link';

export default function MembersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await apiFetch('/members');
      const json = await res.json();
      return z.array(MemberSummarySchema).parse(json);
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load</div>;

  return (
    <div>
      <h1>Members</h1>
      <table border={1} cellPadding={4}>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data!.map((m) => (
            <tr key={m.studentId}>
              <td>{m.studentId}</td>
              <td>
                <Link href={`/members/${m.studentId}`}>{m.name}</Link>
              </td>
              <td>{m.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
