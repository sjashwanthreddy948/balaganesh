const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanProductionDatabase() {
  console.log('=== BALA GANESH PRODUCTION DATABASE CLEANUP ===');

  // 1. Delete all Contributions
  const deletedContributions = await prisma.contribution.deleteMany({});
  console.log(`✓ Deleted ${deletedContributions.count} test/dummy contributions.`);

  // 2. Delete all Expenses
  const deletedExpenses = await prisma.expense.deleteMany({});
  console.log(`✓ Deleted ${deletedExpenses.count} test/dummy expenses.`);

  // 3. Remove non-admin test users
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      username: { not: 'admin' },
    },
  });
  console.log(`✓ Deleted ${deletedUsers.count} non-admin test users.`);

  // 4. Verify Final State
  const remainingContributions = await prisma.contribution.count();
  const remainingExpenses = await prisma.expense.count();
  const users = await prisma.user.findMany({ select: { username: true, role: true } });

  console.log('\n--- FINAL CLEAN DATABASE AUDIT ---');
  console.log(`Total Contributions: ${remainingContributions} (Must be 0)`);
  console.log(`Total Expenses:      ${remainingExpenses} (Must be 0)`);
  console.log(`Active Users:        ${users.length} (Must be 1 - admin)`);
  users.forEach((u) => console.log(`  -> User: ${u.username} [Role: ${u.role}]`));

  if (remainingContributions === 0 && remainingExpenses === 0 && users.length === 1) {
    console.log('\n🎉 PRODUCTION DATABASE IS 100% CLEAN AND READY FOR REAL DATA! 🎉');
  } else {
    throw new Error('Database cleanup verification failed!');
  }
}

cleanProductionDatabase()
  .catch((e) => {
    console.error('Cleanup error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
