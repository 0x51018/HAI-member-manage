import { z } from 'zod';

export const AttendanceRecordSchema = z.object({
  memberStudentId: z.string(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'])
});

export const AttendanceUpdateSchema = z.object({
  records: z.array(AttendanceRecordSchema)
});
