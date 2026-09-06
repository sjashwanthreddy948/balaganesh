import { prisma } from './prisma';

/**
 * Generates next sequential unique Laddu Receipt number e.g. LDR2026-000001
 */
export async function generateNextLadduReceiptNumber(): Promise<string> {
  const prefix = 'LDR2026-';

  // Count existing payments with this prefix
  const count = await prisma.ladduPayment.count({
    where: {
      receiptNumber: {
        startsWith: prefix,
      },
    },
  });

  let nextSeq = count + 1;
  let candidate = `${prefix}${String(nextSeq).padStart(6, '0')}`;

  // Double check uniqueness in case of race condition or gaps
  let exists = await prisma.ladduPayment.findUnique({
    where: { receiptNumber: candidate },
  });

  while (exists) {
    nextSeq += 1;
    candidate = `${prefix}${String(nextSeq).padStart(6, '0')}`;
    exists = await prisma.ladduPayment.findUnique({
      where: { receiptNumber: candidate },
    });
  }

  return candidate;
}
