import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { HttpError } from '../utils/errors';

export interface AuthUser {
  id: string;
  role: string;
  sid: string;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return next(new HttpError(401, 'Unauthorized'));
  const [, token] = header.split(' ');
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
    const refresh = (req as any).cookies?.refresh as string | undefined;
    if (!refresh) throw new Error();
    const refreshPayload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET!) as any;
    const session = await prisma.session.findUnique({ where: { id: refreshPayload.sid } });
    if (!session || session.userId !== payload.id) throw new Error();
    (req as any).user = { id: payload.id, role: payload.role, sid: session.id } as AuthUser;
    next();
  } catch {
    next(new HttpError(401, 'Unauthorized'));
  }
}

export function requireSectionManager(getSectionId: (req: Request) => string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) return next(new HttpError(401, 'Unauthorized'));
    if (user.role === 'ADMIN') return next();
    const sectionId = getSectionId(req);
    const manager = await prisma.sectionManager.findUnique({
      where: { userId_sectionId: { userId: user.id, sectionId } }
    });
    if (!manager) return next(new HttpError(403, 'Forbidden'));
    next();
  };
}
