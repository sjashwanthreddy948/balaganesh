const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_DEFAULT_USER || 'admin';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Bala@2026Ganesh';

  console.log('Seeding production admin account...');

  // 1. Production Admin User
  const salt = await bcrypt.genSalt(10);
  const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      password: hashedAdminPassword,
      role: 'ADMIN',
      name: 'Association Admin',
      isActive: true,
      canAddExpenses: true,
    },
    create: {
      username: adminUsername,
      name: 'Association Admin',
      password: hashedAdminPassword,
      role: 'ADMIN',
      isActive: true,
      canAddExpenses: true,
    },
  });

  console.log(`✓ Admin user configured: ${admin.username} (Role: ${admin.role})`);

  // Remove any obsolete sample volunteer test accounts
  const deletedVolunteers = await prisma.user.deleteMany({
    where: { username: 'volunteer' },
  });
  if (deletedVolunteers.count > 0) {
    console.log(`✓ Removed ${deletedVolunteers.count} sample volunteer test accounts.`);
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
