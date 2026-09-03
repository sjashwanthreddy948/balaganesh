const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const users = await prisma.user.findMany();
  const contributions = await prisma.contribution.findMany();
  const expenses = await prisma.expense.findMany();

  console.log('=== DATABASE AUDIT REPORT ===');
  console.log('Users count:', users.length);
  users.forEach((u) => console.log(` - ${u.username} (${u.role}, isActive: ${u.isActive})`));
  console.log('Contributions count:', contributions.length);
  console.log('Expenses count:', expenses.length);
}

inspect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
