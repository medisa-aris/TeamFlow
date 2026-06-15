import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const DEFAULT_APPROVAL_DEADLINE_HOUR = 9;

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

const users = [
  {
    email: 'ceo@teamflow.id',
    fullName: 'Ahmad Surya',
    password: 'TeamFlow@2026',
    role: UserRole.CEO,
  },
  {
    email: 'budi@teamflow.id',
    fullName: 'Budi Santoso',
    password: 'TeamFlow@2026',
    role: UserRole.MEMBER,
  },
  {
    email: 'citra@teamflow.id',
    fullName: 'Citra Dewi',
    password: 'TeamFlow@2026',
    role: UserRole.MEMBER,
  },
  {
    email: 'dani@teamflow.id',
    fullName: 'Dani Prasetyo',
    password: 'TeamFlow@2026',
    role: UserRole.MEMBER,
  },
  {
    email: 'eka@teamflow.id',
    fullName: 'Eka Rahayu',
    password: 'TeamFlow@2026',
    role: UserRole.MEMBER,
  },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── System config ──────────────────────────────────────────────
  await prisma.systemConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, approvalDeadlineHour: DEFAULT_APPROVAL_DEADLINE_HOUR },
  });
  console.log(`⚙️   SystemConfig seeded  (approvalDeadlineHour=${DEFAULT_APPROVAL_DEADLINE_HOUR})\n`);

  // ── Users ───────────────────────────────────────────────────────
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        fullName: u.fullName,
        passwordHash,
        role: u.role,
        isActive: true,
      },
    });

    const icon = u.role === UserRole.CEO ? '👔' : '👤';
    console.log(`${icon}  ${user.fullName.padEnd(20)} ${user.email}  [${user.role}]`);
  }

  console.log('\n✅ Seeding selesai!\n');
  console.log('Akun untuk login:');
  console.log('─────────────────────────────────────────');
  for (const u of users) {
    const icon = u.role === UserRole.CEO ? '👔 CEO   ' : '👤 Member';
    console.log(`${icon}  ${u.email.padEnd(28)}  ${u.password}`);
  }
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
