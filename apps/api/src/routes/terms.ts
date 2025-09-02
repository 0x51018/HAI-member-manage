import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import {
  TermCreateSchema,
  MeetingBulkSchema,
  SectionCreateSchema
} from '@packages/types';
import { HttpError } from '../utils/errors';

export const router = Router();

router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const terms = await prisma.term.findMany({
      orderBy: [{ year: 'desc' }, { semester: 'desc' }]
    });
    res.json(terms);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') throw new HttpError(403, 'Forbidden');
    const parsed = TermCreateSchema.safeParse(req.body);
    if (!parsed.success)
      throw new HttpError(400, 'Invalid body', undefined, parsed.error.flatten());
    const term = await prisma.term.create({ data: parsed.data });
    res.status(201).json(term);
  } catch (err) {
    next(err);
  }
});

router.post('/:termId/meetings/bulk', async (req, res, next) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') throw new HttpError(403, 'Forbidden');
    const termId = req.params.termId;
    const parsed = MeetingBulkSchema.safeParse(req.body);
    if (!parsed.success)
      throw new HttpError(400, 'Invalid body', undefined, parsed.error.flatten());
    await prisma.meetingDay.createMany({
      data: parsed.data.items.map((i: any) => ({
        termId,
        ordinal: i.ordinal,
        date: new Date(i.date),
        label: i.label
      })),
      skipDuplicates: true
    });
    const meetings = await prisma.meetingDay.findMany({
      where: { termId },
      orderBy: { ordinal: 'asc' }
    });
    res.json(meetings);
  } catch (err) {
    next(err);
  }
});

router.post('/:termId/sections', async (req, res, next) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') throw new HttpError(403, 'Forbidden');
    const termId = req.params.termId;
    const parsed = SectionCreateSchema.safeParse(req.body);
    if (!parsed.success)
      throw new HttpError(400, 'Invalid body', undefined, parsed.error.flatten());
    const section = await prisma.section.create({
      data: { termId, name: parsed.data.name }
    });
    res.status(201).json(section);
  } catch (err) {
    next(err);
  }
});

router.get('/:termId/sections', async (req, res, next) => {
  try {
    const termId = req.params.termId;
    const withTeams = req.query.with === 'teams';
    const sections = await prisma.section.findMany({
      where: { termId },
      include: withTeams ? { teams: true } : undefined
    });
    res.json(sections);
  } catch (err) {
    next(err);
  }
});
