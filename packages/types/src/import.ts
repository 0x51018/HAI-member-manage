import { z } from 'zod';

export const ImportRowSchema = z.object({
  '이름': z.string(),
  '명예회원?': z.any().optional(),
  '임원진?': z.any().optional(),
  '휴식회원?': z.any().optional(),
  '신입회원?': z.any().optional(),
  '전화번호?': z.string().optional(),
  '학번': z.string(),
  '학과?': z.string().optional(),
  '노션초대용이메일?': z.string().optional(),
  '분반2025?': z.string().optional(),
  '비고?': z.string().optional()
});

export const ImportRequestSchema = z.object({
  rows: z.array(ImportRowSchema)
});

export const ImportResultSchema = z.object({
  created: z.object({ members: z.number().default(0) }),
  updated: z.object({ members: z.number().default(0) }),
  memberTerms: z.object({ created: z.number().default(0), updated: z.number().default(0) }),
  sections: z.object({ created: z.number().default(0) }),
  errors: z.array(z.object({ row: z.number(), reason: z.string() }))
});
