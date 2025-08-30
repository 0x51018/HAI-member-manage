'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import apiFetch from '../../../../../lib/api';

const RosterSchema = z.object({
  memberStudentId: z.string(),
  name: z.string(),
  teamNumber: z.number().nullable()
});

const ResponseSchema = z.object({
  roster: z.array(RosterSchema),
  records: z.array(
    z.object({
      memberStudentId: z.string(),
      status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'])
    })
  )
});

export default function AttendanceSessionPage({ params }: { params: { sessionId: string } }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['attendanceSession', params.sessionId],
    queryFn: async () => {
      const res = await apiFetch(`/attendance/sessions/${params.sessionId}/attendance`);
      const json = await res.json();
      return ResponseSchema.parse(json);
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error || !data) return <div>Failed to load</div>;

  return (
    <div>
      <h1>Attendance</h1>
      <table border={1} cellPadding={4}>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Team</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.roster.map((r) => {
            const record = data.records.find((rec) => rec.memberStudentId === r.memberStudentId);
            return (
              <tr key={r.memberStudentId}>
                <td>{r.memberStudentId}</td>
                <td>{r.name}</td>
                <td>{r.teamNumber ?? '-'}</td>
                <td>{record?.status ?? '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
