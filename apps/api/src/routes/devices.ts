import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { HttpError } from '../utils/errors';

export const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const user = (req as any).user as { id: string; sid: string };
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { lastUsedAt: 'desc' }
    });
    res.json(
      sessions.map((s: any) => ({
        id: s.id,
        deviceLabel: s.deviceLabel,
        userAgent: s.userAgent,
        ip: s.ip,
        lastUsedAt: s.lastUsedAt.toISOString(),
        current: s.id === user.sid
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.delete('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const user = (req as any).user as { id: string; sid: string };
    const session = await prisma.session.findFirst({ where: { id: sessionId, userId: user.id } });
    if (!session) throw new HttpError(404, 'Not found');
    await prisma.session.delete({ where: { id: sessionId } });
    if (sessionId === user.sid) {
      res.clearCookie('refresh');
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
