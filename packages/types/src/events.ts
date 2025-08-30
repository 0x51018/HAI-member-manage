import { z } from 'zod';

export const EventCreateSchema = z.object({
  termId: z.string().optional(),
  title: z.string(),
  type: z.string().optional()
});

export const EventParticipantsAddSchema = z.object({
  memberStudentIds: z.array(z.string()),
  termId: z.string().optional()
});
