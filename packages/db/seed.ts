import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
      role: 'ADMIN'
    }
  });

  const term = await prisma.term.create({
    data: {
      year: 2025,
      semester: 'S1',
      meetings: {
        create: Array.from({ length: 8 }).map((_, i) => ({
          ordinal: i + 1,
          date: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000)
        }))
      }
    }
  });

  await prisma.section.create({
    data: { termId: term.id, name: '논문 리딩반' }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
