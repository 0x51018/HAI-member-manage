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

export const EventSchema = z.object({
  id: z.string(),
  termId: z.string().nullable(),
  title: z.string(),
  type: z.string().nullable(),
  createdAt: z.string()
});

export const EventParticipantSchema = z.object({
  memberStudentId: z.string(),
  name: z.string(),
  phone: z.string().nullable()
});

export const EventDetailSchema = EventSchema.extend({
  participants: z.array(EventParticipantSchema)
});
