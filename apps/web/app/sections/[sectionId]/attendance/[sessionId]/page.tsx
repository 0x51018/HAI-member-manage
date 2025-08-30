'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';

export default function AttendanceSessionPage({ params }: { params: { sessionId: string } }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['attendanceSession', params.sessionId],
    queryFn: async () => {
      const res = await apiFetch(`/attendance/sessions/${params.sessionId}/attendance`);
      const json = await res.json();
      return ResponseSchema.parse(json);
    }
  });

  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  useEffect(() => {
    if (data) {
      const initial: Record<string, AttendanceStatus> = {};
      data.roster.forEach((r) => {
        const record = data.records.find((rec) => rec.memberStudentId === r.memberStudentId);
        initial[r.memberStudentId] = record?.status ?? 'ABSENT';
      });
      setStatuses(initial);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiFetch(`/attendance/sessions/${params.sessionId}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: Object.entries(statuses).map(([memberStudentId, status]) => ({
            memberStudentId,
            status
          }))
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceSession', params.sessionId] });
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
            const value = statuses[r.memberStudentId] ?? 'ABSENT';
            return (
              <tr key={r.memberStudentId}>
                <td>{r.memberStudentId}</td>
                <td>{r.name}</td>
                <td>{r.teamNumber ?? '-'}</td>
                <td>
                  <select
                    value={value}
                    onChange={(e) =>
                      setStatuses((prev) => ({
                        ...prev,
                        [r.memberStudentId]: e.target.value as AttendanceStatus
                      }))
                    }
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                    <option value="EXCUSED">Excused</option>
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
