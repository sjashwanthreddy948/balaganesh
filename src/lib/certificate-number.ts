import { prisma } from './prisma';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

/**
 * Generates next sequential unique Certificate number e.g. BG2026-000001
 */
export async function generateNextCertificateNumber(): Promise<string> {
  const prefix = `${FESTIVAL_CONFIG.receiptPrefix}-`;

  // Count existing contributions with this prefix
  const count = await prisma.contribution.count({
    where: {
      certificateNumber: {
        startsWith: prefix,
      },
    },
  });

  let nextSeq = count + 1;
  let candidate = `${prefix}${String(nextSeq).padStart(6, '0')}`;

  // Double check uniqueness in case of race condition or gaps
  let exists = await prisma.contribution.findUnique({
    where: { certificateNumber: candidate },
  });

  while (exists) {
    nextSeq += 1;
    candidate = `${prefix}${String(nextSeq).padStart(6, '0')}`;
    exists = await prisma.contribution.findUnique({
      where: { certificateNumber: candidate },
    });
  }

  return candidate;
}
