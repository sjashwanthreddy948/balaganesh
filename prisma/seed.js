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

  // 2. Production Shared Volunteer User (balaganesh)
  const volunteerUsername = process.env.VOLUNTEER_DEFAULT_USER || 'balaganesh';
  const volunteerPassword = process.env.VOLUNTEER_DEFAULT_PASSWORD || 'Bala@Ganesh2026';
  const hashedVolunteerPassword = await bcrypt.hash(volunteerPassword, salt);

  const volunteer = await prisma.user.upsert({
    where: { username: volunteerUsername },
    update: {
      password: hashedVolunteerPassword,
      role: 'VOLUNTEER',
      name: 'balaganesh',
      isActive: true,
      canAddExpenses: true,
    },
    create: {
      username: volunteerUsername,
      name: 'balaganesh',
      password: hashedVolunteerPassword,
      role: 'VOLUNTEER',
      isActive: true,
      canAddExpenses: true,
    },
  });

  console.log(`✓ Shared volunteer configured: ${volunteer.username} (Role: ${volunteer.role})`);

  // 3. Remove any obsolete test accounts
  const deletedVolunteers = await prisma.user.deleteMany({
    where: {
      username: {
        in: ['volunteer', 'testvolunteer', 'testuser'],
      },
    },
  });
  if (deletedVolunteers.count > 0) {
    console.log(`✓ Removed ${deletedVolunteers.count} obsolete test accounts.`);
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
