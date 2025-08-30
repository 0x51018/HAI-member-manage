import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { HttpError } from '../utils/errors';

export const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') throw new HttpError(403, 'Forbidden');
    const { actorId, entityType, entityId, from, to, actionPrefix } = req.query;
    const logs = await prisma.auditLog.findMany({
      where: {
        actorId: actorId as string | undefined,
        entityType: entityType as string | undefined,
        entityId: entityId as string | undefined,
        action: actionPrefix ? { startsWith: actionPrefix as string } : undefined,
        at: {
          gte: from ? new Date(from as string) : undefined,
          lte: to ? new Date(to as string) : undefined
        }
      },
      orderBy: { at: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

export default router;
