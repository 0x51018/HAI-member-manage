import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/lib/prisma', () => {
  return {
    prisma: {
      member: { findMany: vi.fn() },
      memo: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
    }
  };
});

vi.mock('../src/middleware/auth', () => ({
  requireAuth: (_req: any, _res: any, next: any) => {
    (_req as any).user = { id: 'u1', role: 'ADMIN', sid: 's1' };
    next();
  }
}));

vi.mock('../src/middleware/audit', () => ({
  setAuditMeta: vi.fn(),
  auditMiddleware: (_req: any, _res: any, next: any) => next()
}));

import { prisma } from '../src/lib/prisma';
import { router as membersRouter } from '../src/routes/members';

const app = express();
app.use(express.json());
app.use('/members', membersRouter);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('members routes', () => {
  it('lists members', async () => {
    (prisma.member.findMany as any).mockResolvedValue([
      {
        studentId: '1',
        name: 'Alice',
        phone: '123',
        status: 'ACTIVE',
        terms: [{ sectionId: 'sec1', teamId: 'team1', team: { teamNumber: 3 } }]
      }
    ]);
    const res = await request(app).get('/members');
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      studentId: '1',
      name: 'Alice'
    });
  });

  it('creates a member memo', async () => {
    (prisma.memo.create as any).mockResolvedValue({ id: 'm1', body: 'hi' });
    const res = await request(app)
      .post('/members/1/memos')
      .send({ body: 'hi' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'm1', body: 'hi' });
  });

  it('deletes a member memo', async () => {
    (prisma.memo.findFirst as any).mockResolvedValue({ id: 'm1' });
    (prisma.memo.delete as any).mockResolvedValue({});
    const res = await request(app).delete('/members/1/memos/m1');
    expect(res.status).toBe(204);
  });
});
