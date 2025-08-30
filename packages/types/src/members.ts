import { z } from 'zod';

export const MemoSchema = z.object({
  id: z.string(),
  memberStudentId: z.string(),
  authorId: z.string(),
  body: z.string(),
  sensitivity: z.string(),
  termId: z.string().nullable(),
  createdAt: z.string()
});

export const MemberSummarySchema = z.object({
  studentId: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  status: z.string(),
  sectionId: z.string().nullable(),
  teamId: z.string().nullable(),
  teamNumber: z.number().nullable()
});

export const MemberTermSchema = z.object({
  id: z.string(),
  termId: z.string(),
  sectionId: z.string().nullable(),
  teamId: z.string().nullable(),
  teamRole: z.string().nullable(),
  isExecutive: z.boolean(),
  onBreak: z.boolean(),
  isNewJoiner: z.boolean(),
  active: z.boolean()
});

export const MemberDetailSchema = z.object({
  studentId: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  department: z.string().nullable(),
  status: z.string(),
  joinedAt: z.string().nullable(),
  terms: z.array(MemberTermSchema),
  recentMemos: z.array(MemoSchema)
});

export const MemoCreateSchema = z.object({
  body: z.string(),
  sensitivity: z.enum(['NORMAL', 'CAUTION', 'PRIVATE']).optional(),
  termId: z.string().optional()
});
