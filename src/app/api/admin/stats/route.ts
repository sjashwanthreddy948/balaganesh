import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [totalContributions, pendingPayments, verifiedPayments, rejectedPayments, totalSumResult] =
      await Promise.all([
        prisma.contribution.count(),
        prisma.contribution.count({ where: { paymentStatus: 'PENDING' } }),
        prisma.contribution.count({ where: { paymentStatus: 'VERIFIED' } }),
        prisma.contribution.count({ where: { paymentStatus: 'REJECTED' } }),
        prisma.contribution.aggregate({
          _sum: {
            amount: true,
          },
        }),
      ]);

    // Also get verified amount specifically
    const verifiedSumResult = await prisma.contribution.aggregate({
      where: { paymentStatus: 'VERIFIED' },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalContributions,
        totalAmount: totalSumResult._sum.amount || 0,
        verifiedAmount: verifiedSumResult._sum.amount || 0,
        pendingPayments,
        verifiedPayments,
        rejectedPayments,
      },
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
