import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { ImportRequestSchema } from '@packages/types';
import { parseBoolean } from '../utils/boolean';
import { normalizePhone } from '../utils/phone';
import { HttpError } from '../utils/errors';

export const router = Router();

router.use(requireAuth);

router.post('/spreadsheet/v1', async (req, res, next) => {
  try {
    const termId =
      typeof req.body.termId === 'string'
        ? req.body.termId
        : typeof req.query.termId === 'string'
        ? (req.query.termId as string)
        : undefined;
    if (!termId) throw new HttpError(400, 'termId is required');

    const term = await prisma.term.findUnique({ where: { id: termId } });
    if (!term) throw new HttpError(400, 'Term not found');

    const parsed = ImportRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, 'Invalid body', undefined, parsed.error.flatten());

    const counts = {
      created: { members: 0 },
      updated: { members: 0 },
      memberTerms: { created: 0, updated: 0 },
      sections: { created: 0 },
      errors: [] as { row: number; reason: string }[]
    };

    const sectionCache: Record<string, string> = {};

    for (const [index, row] of parsed.data.rows.entries()) {
      try {
        const studentId = row['학번'];
        const name = row['이름'];
        const phone = row['전화번호?'] ? normalizePhone(row['전화번호?']) : undefined;
        const email = row['노션초대용이메일?'];
        const department = row['학과?'];
        const note = row['비고?'];
        const honorary = parseBoolean(row['명예회원?']);
        const isExecutive = parseBoolean(row['임원진?']);
        const onBreak = parseBoolean(row['휴식회원?']);
        const isNewJoiner = parseBoolean(row['신입회원?']);
        const sectionName = row['분반2025?'];

        const existingMember = await prisma.member.findUnique({ where: { studentId } });
        if (existingMember) {
          await prisma.member.update({
            where: { studentId },
            data: { name, phone, email, department, note, honorary }
          });
          counts.updated.members++;
        } else {
          await prisma.member.create({
            data: { studentId, name, phone, email, department, note, honorary }
          });
          counts.created.members++;
        }

        let sectionId: string | undefined;
        if (sectionName) {
          if (sectionCache[sectionName]) {
            sectionId = sectionCache[sectionName];
          } else {
            let section = await prisma.section.findFirst({ where: { termId: term.id, name: sectionName } });
            if (!section) {
              section = await prisma.section.create({ data: { termId: term.id, name: sectionName } });
              counts.sections.created++;
            }
            sectionId = section.id;
            sectionCache[sectionName] = sectionId!;
          }
        }

        const existingMT = await prisma.memberTerm.findUnique({
          where: { memberStudentId_termId: { memberStudentId: studentId, termId: term.id } }
        });
        if (existingMT) {
          await prisma.memberTerm.update({
            where: { id: existingMT.id },
            data: { sectionId, isExecutive, onBreak, isNewJoiner }
          });
          counts.memberTerms.updated++;
        } else {
          await prisma.memberTerm.create({
            data: { memberStudentId: studentId, termId: term.id, sectionId, isExecutive, onBreak, isNewJoiner }
          });
          counts.memberTerms.created++;
        }
      } catch (err: any) {
        counts.errors.push({ row: index + 1, reason: err.message });
      }
    }

    res.json(counts);
  } catch (err) {
    next(err);
  }
});
