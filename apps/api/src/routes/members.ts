import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { MemoCreateSchema } from '@packages/types';
import { HttpError } from '../utils/errors';
import { setAuditMeta } from '../middleware/audit';

export const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { q, termId, sectionId, teamId } = req.query as Record<string, string>;
    const members = await prisma.member.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { studentId: { contains: q } }
            ]
          }
        : undefined,
      include: {
        terms: {
          where: {
            ...(termId ? { termId } : {}),
            ...(sectionId ? { sectionId } : {}),
            ...(teamId ? { teamId } : {})
          },
          include: { team: true }
        }
      }
    });
    const result = members.map((m) => {
      const mt = m.terms[0];
      return {
        studentId: m.studentId,
        name: m.name,
        phone: m.phone,
        status: m.status,
        sectionId: mt?.sectionId ?? null,
        teamId: mt?.teamId ?? null,
        teamNumber: mt?.team?.teamNumber ?? null
      };
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:studentId', async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    const member = await prisma.member.findUnique({
      where: { studentId },
      include: {
        terms: { include: { term: true } },
        memos: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });
    if (!member) throw new HttpError(404, 'Not found');
    const terms = member.terms.sort((a, b) => {
      if (a.term.year === b.term.year) {
        return a.term.semester.localeCompare(b.term.semester);
      }
      return a.term.year - b.term.year;
    });
    res.json({
      studentId: member.studentId,
      name: member.name,
      phone: member.phone,
      email: member.email,
      department: member.department,
      status: member.status,
      joinedAt: member.joinedAt,
      terms,
      recentMemos: member.memos
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:studentId/memos', async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    const memos = await prisma.memo.findMany({
      where: { memberStudentId: studentId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(memos);
  } catch (err) {
    next(err);
  }
});

router.post('/:studentId/memos', async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    const parse = MemoCreateSchema.safeParse(req.body);
    if (!parse.success) throw new HttpError(400, 'Invalid body', undefined, parse.error.flatten());
    const user = (req as any).user;
    const memo = await prisma.memo.create({
      data: {
        memberStudentId: studentId,
        authorId: user.id,
        body: parse.data.body,
        sensitivity: parse.data.sensitivity || 'NORMAL',
        termId: parse.data.termId || null
      }
    });
    setAuditMeta(req, { entityType: 'Memo', entityId: memo.id });
    res.status(201).json(memo);
  } catch (err) {
    next(err);
  }
});

router.delete('/:studentId/memos/:memoId', async (req, res, next) => {
  try {
    const { studentId, memoId } = req.params;
    const memo = await prisma.memo.findFirst({ where: { id: memoId, memberStudentId: studentId } });
    if (!memo) throw new HttpError(404, 'Not found');
    await prisma.memo.delete({ where: { id: memoId } });
    setAuditMeta(req, { entityType: 'Memo', entityId: memoId });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
