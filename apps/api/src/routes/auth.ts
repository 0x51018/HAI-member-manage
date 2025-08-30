import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { HttpError } from '../utils/errors';

export const router = Router();

const ACCESS_TTL = '30m';
const REFRESH_TTL = '30d';

function hash(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, deviceLabel } = req.body as { email: string; password: string; deviceLabel?: string };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new HttpError(401, 'Invalid credentials');

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new HttpError(401, 'Invalid credentials');

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshHash: '',
        deviceLabel,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    const refresh = jwt.sign({ uid: user.id, sid: session.id }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: REFRESH_TTL
    });
    await prisma.session.update({ where: { id: session.id }, data: { refreshHash: hash(refresh) } });
    const access = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET!, { expiresIn: ACCESS_TTL });

    res.cookie('refresh', refresh, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: false
    });
    res.json({ access });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh as string | undefined;
    if (!token) throw new HttpError(401, 'Unauthorized');
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
    const session = await prisma.session.findUnique({ where: { id: payload.sid } });
    if (!session || session.userId !== payload.uid || session.refreshHash !== hash(token)) {
      throw new HttpError(401, 'Unauthorized');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.uid } });
    if (!user) throw new HttpError(401, 'Unauthorized');

    const newRefresh = jwt.sign({ uid: user.id, sid: session.id }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: REFRESH_TTL
    });
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshHash: hash(newRefresh),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    const access = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET!, { expiresIn: ACCESS_TTL });
    res.cookie('refresh', newRefresh, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: false
    });
    res.json({ access });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh as string | undefined;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
        await prisma.session.delete({ where: { id: payload.sid } });
      } catch {
        // ignore
      }
    }
    res.clearCookie('refresh');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
