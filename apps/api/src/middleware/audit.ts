import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export function setAuditMeta(req: Request, meta: { entityType?: string; entityId?: string; diff?: any }) {
  (req as any).audit = { ...(req as any).audit, ...meta };
}

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  res.on('finish', async () => {
    try {
      const user = (req as any).user as { id: string } | undefined;
      const audit = (req as any).audit || {};
      await prisma.auditLog.create({
        data: {
          actorId: user?.id ?? null,
          action: `${req.method} ${req.path}`,
          entityType: audit.entityType,
          entityId: audit.entityId,
          diff: audit.diff,
          ip: req.ip,
          ua: req.headers['user-agent']?.toString()
        }
      });
    } catch (e) {
      console.error('Failed to write audit log', e);
    }
  });
  next();
}
