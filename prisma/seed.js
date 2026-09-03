const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_DEFAULT_USER || 'admin';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'BalaGaneshAdmin@2026';
  const volunteerUsername = 'volunteer';
  const volunteerPassword = 'Volunteer@2026';

  console.log('Seeding initial users...');

  // 1. Admin User
  const salt = await bcrypt.genSalt(10);
  const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);
  const hashedVolunteerPassword = await bcrypt.hash(volunteerPassword, salt);

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      password: hashedAdminPassword,
      role: 'ADMIN',
      name: 'Association Admin',
      isActive: true,
    },
    create: {
      username: adminUsername,
      name: 'Association Admin',
      password: hashedAdminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`✓ Admin user configured: ${admin.username} (Role: ${admin.role})`);

  // 2. Sample Volunteer User
  const volunteer = await prisma.user.upsert({
    where: { username: volunteerUsername },
    update: {
      password: hashedVolunteerPassword,
      role: 'VOLUNTEER',
      name: 'Suresh (Volunteer)',
      isActive: true,
    },
    create: {
      username: volunteerUsername,
      name: 'Suresh (Volunteer)',
      password: hashedVolunteerPassword,
      role: 'VOLUNTEER',
      isActive: true,
    },
  });

  console.log(`✓ Volunteer user configured: ${volunteer.username} (Role: ${volunteer.role})`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
