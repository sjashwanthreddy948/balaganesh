import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      totals,
      cashSum,
      onlineSum,
      unpaidCount,
      partiallyPaidCount,
      paidCount,
      totalBalancesCount,
      totalPaymentsCount,
    ] = await Promise.all([
      prisma.ladduBalance.aggregate({
        _sum: {
          totalDue: true,
          totalPaid: true,
          remainingBalance: true,
        },
      }),
      prisma.ladduPayment.aggregate({
        where: { paymentMethod: 'CASH' },
        _sum: { amount: true },
      }),
      prisma.ladduPayment.aggregate({
        where: { paymentMethod: 'ONLINE' },
        _sum: { amount: true },
      }),
      prisma.ladduBalance.count({ where: { status: 'UNPAID' } }),
      prisma.ladduBalance.count({ where: { status: 'PARTIALLY_PAID' } }),
      prisma.ladduBalance.count({ where: { status: 'PAID' } }),
      prisma.ladduBalance.count(),
      prisma.ladduPayment.count(),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalDue: totals._sum.totalDue || 0,
        totalCollected: totals._sum.totalPaid || 0,
        cashCollected: cashSum._sum.amount || 0,
        onlineCollected: onlineSum._sum.amount || 0,
        remainingBalance: totals._sum.remainingBalance || 0,
        unpaidCount,
        partiallyPaidCount,
        paidCount,
        totalBalancesCount,
        totalPaymentsCount,
      },
    });
  } catch (error) {
    console.error('Error fetching Laddu stats:', error);
    return NextResponse.json({ error: 'Failed to fetch Laddu statistics' }, { status: 500 });
  }
}
