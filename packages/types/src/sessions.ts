import { z } from 'zod';

export const SessionSchema = z.object({
  id: z.string(),
  deviceLabel: z.string().nullable(),
  userAgent: z.string().nullable(),
  ip: z.string().nullable(),
  lastUsedAt: z.string(),
  current: z.boolean()
});

export type Session = z.infer<typeof SessionSchema>;
