import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { setAuditMeta } from '../middleware/audit';
import { EventCreateSchema, EventParticipantsAddSchema } from '@packages/types';
import { HttpError } from '../utils/errors';

export const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(events);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const parsed = EventCreateSchema.safeParse(req.body);
    if (!parsed.success)
      throw new HttpError(400, 'Invalid body', undefined, parsed.error.flatten());
    const user = (req as any).user;
    const event = await prisma.event.create({
      data: { ...parsed.data, createdBy: user.id }
    });
    setAuditMeta(req, { entityType: 'Event', entityId: event.id });
    res.json(event);
  } catch (err) {
    next(err);
  }
});

router.get('/:eventId', requireAuth, async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { participants: { include: { memberTerm: { include: { member: true } } } } }
    });
    if (!event) throw new HttpError(404, 'Event not found');
    res.json({
      id: event.id,
      termId: event.termId,
      title: event.title,
      type: event.type,
      createdAt: event.createdAt,
      participants: event.participants.map((p: any) => ({
        memberStudentId: p.memberTerm.memberStudentId,
        name: p.memberTerm.member.name,
        phone: p.memberTerm.member.phone
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:eventId/participants', requireAuth, async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const parsed = EventParticipantsAddSchema.safeParse(req.body);
    if (!parsed.success)
      throw new HttpError(400, 'Invalid body', undefined, parsed.error.flatten());
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new HttpError(404, 'Event not found');
    const termId = parsed.data.termId || event.termId;
    if (!termId) throw new HttpError(400, 'termId required');
    const members = await prisma.memberTerm.findMany({
      where: {
        termId,
        memberStudentId: { in: parsed.data.memberStudentIds }
      }
    });
    const existing = await prisma.eventParticipant.findMany({ where: { eventId } });
      const existingIds = new Set(existing.map((e: { memberTermId: string }) => e.memberTermId));
      const toCreate = members
        .filter((m: { id: string }) => !existingIds.has(m.id))
        .map((m: { id: string }) => ({ eventId, memberTermId: m.id }));
    if (toCreate.length)
      await prisma.eventParticipant.createMany({ data: toCreate, skipDuplicates: true });
    setAuditMeta(req, {
      entityType: 'Event',
      entityId: eventId,
      diff: { added: toCreate.map((c: { memberTermId: string }) => c.memberTermId) }
    });
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId },
      include: { memberTerm: { include: { member: true } } }
    });
    res.json(
      participants.map((p: any) => ({
        memberStudentId: p.memberTerm.memberStudentId,
        name: p.memberTerm.member.name,
        phone: p.memberTerm.member.phone
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/:eventId/export', requireAuth, async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const fieldsParam = (req.query.fields as string) || 'phone';
    const fields = fieldsParam.split(',').filter((f) => ['phone', 'name'].includes(f));
    const format = (req.query.format as string) === 'txt' ? 'txt' : 'csv';
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new HttpError(404, 'Event not found');
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId },
      include: { memberTerm: { include: { member: true } } }
    });
    const rows = participants.map((p: any) => {
      const row: Record<string, string> = {};
      for (const f of fields) {
        if (f === 'phone') row.phone = p.memberTerm.member.phone || '';
        if (f === 'name') row.name = p.memberTerm.member.name;
      }
      return row;
    });
    if (format === 'txt') {
      const lines = rows
        .map((r: Record<string, string>) => fields.map((f) => r[f]).join(' '))
        .join('\n');
      res.setHeader('Content-Type', 'text/plain');
      res.send(lines);
    } else {
      const csv = [
        fields.join(','),
        ...rows.map((r: Record<string, string>) => fields.map((f) => r[f]).join(','))
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
