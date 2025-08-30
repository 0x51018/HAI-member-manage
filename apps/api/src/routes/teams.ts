import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireSectionManager } from '../middleware/auth';
import { TeamCreateSchema, TeamLeaderSchema } from '@packages/types';
import { HttpError } from '../utils/errors';

export const router = Router();

router.post(
  '/sections/:sectionId/teams',
  requireAuth,
  requireSectionManager((req) => req.params.sectionId),
  async (req, res, next) => {
    try {
      const sectionId = req.params.sectionId;
      const parsed = TeamCreateSchema.safeParse(req.body);
      if (!parsed.success)
        throw new HttpError(400, 'Invalid body', undefined, parsed.error.flatten());
      const team = await prisma.team.create({
        data: { sectionId, teamNumber: parsed.data.teamNumber, name: parsed.data.name }
      });
      res.status(201).json(team);
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/teams/:teamId/leader', requireAuth, async (req, res, next) => {
  try {
    const teamId = req.params.teamId;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { section: true }
    });
    if (!team) throw new HttpError(404, 'Not found');
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      const manager = await prisma.sectionManager.findUnique({
        where: { userId_sectionId: { userId: user.id, sectionId: team.sectionId } }
      });
      if (!manager) throw new HttpError(403, 'Forbidden');
    }
    const parsed = TeamLeaderSchema.safeParse(req.body);
    if (!parsed.success)
      throw new HttpError(400, 'Invalid body', undefined, parsed.error.flatten());
    const mt = await prisma.memberTerm.findUnique({
      where: {
        memberStudentId_termId: {
          memberStudentId: parsed.data.memberStudentId,
          termId: team.section.termId
        }
      }
    });
    if (!mt) throw new HttpError(400, 'MemberTerm not found in term');
    const updated = await prisma.team.update({
      where: { id: teamId },
      data: { leaderMemberTermId: mt.id }
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

