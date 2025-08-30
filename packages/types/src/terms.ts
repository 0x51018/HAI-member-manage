import { z } from 'zod';

export const TermSchema = z.object({
  id: z.string(),
  year: z.number(),
  semester: z.enum(['S1', 'S2'])
});

export const TermCreateSchema = z.object({
  year: z.number(),
  semester: z.enum(['S1', 'S2'])
});

export const MeetingItemSchema = z.object({
  ordinal: z.number(),
  date: z.string(),
  label: z.string().optional()
});

export const MeetingBulkSchema = z.object({
  items: z.array(MeetingItemSchema)
});

export const SectionSchema = z.object({
  id: z.string(),
  name: z.string()
});

export const SectionCreateSchema = z.object({
  name: z.string()
});

export const TeamSchema = z.object({
  id: z.string(),
  teamNumber: z.number(),
  name: z.string().nullable()
});

export const TeamCreateSchema = z.object({
  teamNumber: z.number(),
  name: z.string().optional()
});

export const TeamLeaderSchema = z.object({
  memberStudentId: z.string()
});
