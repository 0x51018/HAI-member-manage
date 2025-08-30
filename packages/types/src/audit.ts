import { z } from 'zod';

export const AuditLogSchema = z.object({
  id: z.string(),
  actorId: z.string().nullable(),
  action: z.string(),
  entityType: z.string().nullable(),
  entityId: z.string().nullable(),
  diff: z.any().nullable(),
  ip: z.string().nullable(),
  ua: z.string().nullable(),
  at: z.string()
});
