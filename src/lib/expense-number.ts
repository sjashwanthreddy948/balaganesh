import { prisma } from './prisma';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

/**
 * Generates a unique, sequential expense number in the format:
 * EXP-2026-000001, EXP-2026-000002, etc.
 */
export async function generateNextExpenseNumber(): Promise<string> {
  const prefix = `EXP-${FESTIVAL_CONFIG.festivalYear}`;

  // Find the highest existing expense number for this year
  const lastExpense = await prisma.expense.findFirst({
    where: {
      expenseNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      expenseNumber: 'desc',
    },
    select: {
      expenseNumber: true,
    },
  });

  let nextSequence = 1;

  if (lastExpense?.expenseNumber) {
    const parts = lastExpense.expenseNumber.split('-');
    if (parts.length === 3) {
      const parsedSeq = parseInt(parts[2], 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }
  }

  // Format with 6-digit zero padding
  const paddedSequence = String(nextSequence).padStart(6, '0');
  const candidateNumber = `${prefix}-${paddedSequence}`;

  // Safety collision check
  const existing = await prisma.expense.findUnique({
    where: { expenseNumber: candidateNumber },
  });

  if (existing) {
    const count = await prisma.expense.count({
      where: {
        expenseNumber: {
          startsWith: prefix,
        },
      },
    });
    const fallbackSeq = String(count + 1).padStart(6, '0');
    return `${prefix}-${fallbackSeq}`;
  }

  return candidateNumber;
}
