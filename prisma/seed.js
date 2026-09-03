const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_DEFAULT_USER || 'admin';
  const plainPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'BalaGaneshAdmin@2026';

  console.log(`Checking admin user: ${username}...`);
  const existing = await prisma.adminUser.findUnique({
    where: { username },
  });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  if (existing) {
    console.log(`Updating admin user password...`);
    await prisma.adminUser.update({
      where: { username },
      data: { password: hashedPassword },
    });
  } else {
    console.log(`Creating default admin user...`);
    await prisma.adminUser.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
  }

  console.log(`✓ Admin user successfully configured!`);
  console.log(`Username: ${username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
