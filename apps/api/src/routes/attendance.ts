import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireSectionManager } from '../middleware/auth';
import { AttendanceUpdateSchema } from '@packages/types';
import { HttpError } from '../utils/errors';

export const router = Router();

// Generate sessions for all meeting days of a section
router.post(
  '/sections/:sectionId/sessions/generate',
  requireAuth,
  requireSectionManager((req) => req.params.sectionId),
  async (req, res, next) => {
    try {
      const sectionId = req.params.sectionId;
      const user = (req as any).user;
      const section = await prisma.section.findUnique({
        where: { id: sectionId },
        include: { term: { include: { meetings: true } } }
      });
      if (!section) throw new HttpError(404, 'Section not found');
      await prisma.attendanceSession.createMany({
        data: section.term.meetings.map((m) => ({
          sectionId,
          meetingDayId: m.id,
          createdBy: user.id
        })),
        skipDuplicates: true
      });
      const sessions = await prisma.attendanceSession.findMany({
        where: { sectionId },
        include: { meetingDay: true },
        orderBy: { meetingDay: { ordinal: 'asc' } }
      });
      res.json(sessions);
    } catch (err) {
      next(err);
    }
  }
);

// List sessions for a section
router.get(
  '/sections/:sectionId/sessions',
  requireAuth,
  requireSectionManager((req) => req.params.sectionId),
  async (req, res, next) => {
    try {
      const sectionId = req.params.sectionId;
      const sessions = await prisma.attendanceSession.findMany({
        where: { sectionId },
        include: { meetingDay: true },
        orderBy: { meetingDay: { ordinal: 'asc' } }
      });
      res.json(sessions);
    } catch (err) {
      next(err);
    }
  }
);

async function ensureSectionPermission(user: any, sectionId: string) {
  if (user.role === 'ADMIN') return;
  const manager = await prisma.sectionManager.findUnique({
    where: { userId_sectionId: { userId: user.id, sectionId } }
  });
  if (!manager) throw new HttpError(403, 'Forbidden');
}

// Get attendance for a session
router.get('/sessions/:sessionId/attendance', requireAuth, async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { section: { include: { term: true } }, meetingDay: true }
    });
    if (!session) throw new HttpError(404, 'Not found');
    const user = (req as any).user;
    await ensureSectionPermission(user, session.sectionId);
    const roster = await prisma.memberTerm.findMany({
      where: { termId: session.section.termId, sectionId: session.sectionId },
      include: { member: true, team: true }
    });
    const records = await prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: { memberTerm: true }
    });
    res.json({
      roster: roster.map((mt) => ({
        memberStudentId: mt.memberStudentId,
        name: mt.member.name,
        teamNumber: mt.team?.teamNumber ?? null
      })),
      records: records.map((r) => ({
        memberStudentId: r.memberTerm.memberStudentId,
        status: r.status
      }))
    });
  } catch (err) {
    next(err);
  }
});

// Update attendance records
router.put('/sessions/:sessionId/attendance', requireAuth, async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { section: { include: { term: true } } }
    });
    if (!session) throw new HttpError(404, 'Not found');
    const user = (req as any).user;
    await ensureSectionPermission(user, session.sectionId);
    const parsed = AttendanceUpdateSchema.safeParse(req.body);
    if (!parsed.success)
      throw new HttpError(400, 'Invalid body', undefined, parsed.error.flatten());
    for (const rec of parsed.data.records) {
      const mt = await prisma.memberTerm.findUnique({
        where: {
          memberStudentId_termId: {
            memberStudentId: rec.memberStudentId,
            termId: session.section.termId
          }
        }
      });
      if (!mt) continue;
      await prisma.attendanceRecord.upsert({
        where: { sessionId_memberTermId: { sessionId, memberTermId: mt.id } },
        create: {
          sessionId,
          memberTermId: mt.id,
          status: rec.status,
          markedBy: user.id
        },
        update: { status: rec.status, markedBy: user.id, markedAt: new Date() }
      });
    }
    const records = await prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: { memberTerm: true }
    });
    res.json(
      records.map((r) => ({
        memberStudentId: r.memberTerm.memberStudentId,
        status: r.status
      }))
    );
  } catch (err) {
    next(err);
  }
});

export default router;
