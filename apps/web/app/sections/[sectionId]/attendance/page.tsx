'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { z } from 'zod';
import apiFetch from '../../../../lib/api';

const SessionSchema = z.object({
  id: z.string(),
  meetingDay: z.object({ ordinal: z.number(), date: z.string() })
});

export default function SectionAttendancePage({ params }: { params: { sectionId: string } }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sectionSessions', params.sectionId],
    queryFn: async () => {
      const res = await apiFetch(`/attendance/sections/${params.sectionId}/sessions`);
      const json = await res.json();
      return z.array(SessionSchema).parse(json);
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load</div>;

  return (
    <div>
      <h1>Attendance Sessions</h1>
      <ul>
        {data!.map((s) => (
          <li key={s.id}>
            <Link href={`/sections/${params.sectionId}/attendance/${s.id}`}>
              Session {s.meetingDay.ordinal} - {new Date(s.meetingDay.date).toLocaleDateString()}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
