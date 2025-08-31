import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    attendanceSession: { findUnique: vi.fn() },
    memberTerm: { findUnique: vi.fn() },
    attendanceRecord: { upsert: vi.fn(), findMany: vi.fn() }
  }
}));

vi.mock('../src/middleware/auth', () => ({
  requireAuth: (_req: any, _res: any, next: any) => {
    (_req as any).user = { id: 'u1', role: 'ADMIN', sid: 's1' };
    next();
  },
  requireSectionManager: () => (_req: any, _res: any, next: any) => next()
}));

import { prisma } from '../src/lib/prisma';
import { router as attendanceRouter } from '../src/routes/attendance';

const app = express();
app.use(express.json());
app.use('/', attendanceRouter);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('attendance update', () => {
  it('updates records', async () => {
    (prisma.attendanceSession.findUnique as any).mockResolvedValue({
      id: 's1',
      sectionId: 'sec1',
      section: { termId: 't1' }
    });
    (prisma.memberTerm.findUnique as any).mockResolvedValue({ id: 'mt1' });
    (prisma.attendanceRecord.upsert as any).mockResolvedValue({});
    (prisma.attendanceRecord.findMany as any).mockResolvedValue([
      { memberTerm: { memberStudentId: 'm1' }, status: 'PRESENT' }
    ]);

    const res = await request(app)
      .put('/sessions/s1/attendance')
      .send({ records: [{ memberStudentId: 'm1', status: 'PRESENT' }] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ memberStudentId: 'm1', status: 'PRESENT' }]);
  });
});
