import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('../src/lib/prisma', () => {
  return {
    prisma: {
      user: { findUnique: vi.fn() },
      session: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn()
      }
    }
  };
});

import { prisma } from '../src/lib/prisma';
import { router as authRouter } from '../src/routes/auth';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRouter);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_ACCESS_SECRET = 'access';
  process.env.JWT_REFRESH_SECRET = 'refresh';
});

describe('auth flow', () => {
  it('login and refresh', async () => {
    const passwordHash = await bcrypt.hash('secret', 10);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1',
      email: 'user@test.com',
      passwordHash,
      role: 'USER'
    });
    (prisma.session.create as any).mockResolvedValue({ id: 's1', userId: 'u1', refreshHash: '' });
    (prisma.session.update as any).mockResolvedValue({});

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'secret' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.access).toBeDefined();
    const cookie = loginRes.headers['set-cookie'][0];
    expect(cookie).toMatch(/refresh=/);
    const refreshToken = cookie.split(';')[0].split('=')[1];

    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    (prisma.session.findUnique as any).mockResolvedValue({ id: 's1', userId: 'u1', refreshHash });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1',
      email: 'user@test.com',
      passwordHash,
      role: 'USER'
    });
    const refreshRes = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `refresh=${refreshToken}`);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.access).toBeDefined();
  });
});
