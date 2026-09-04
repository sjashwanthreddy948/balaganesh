import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Full festival collection metrics for both Admin & Volunteer dashboard
    const [
      totalContributions,
      totalSumResult,
      todayContributions,
      todaySumResult,
      cashCount,
      cashSumResult,
      onlineCount,
      onlineSumResult,
      pendingOnlineCount,
      pendingOnlineSumResult,
      verifiedOnlineCount,
      verifiedOnlineSumResult,
      payLaterCount,
      payLaterSumResult,
    ] = await Promise.all([
      // 1. Total All
      prisma.contribution.count(),
      prisma.contribution.aggregate({ _sum: { amount: true } }),
      // 2. Today All
      prisma.contribution.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.contribution.aggregate({
        where: { createdAt: { gte: startOfToday } },
        _sum: { amount: true },
      }),
      // 3. Cash
      prisma.contribution.count({ where: { paymentMethod: 'CASH' } }),
      prisma.contribution.aggregate({
        where: { paymentMethod: 'CASH' },
        _sum: { amount: true },
      }),
      // 4. Online
      prisma.contribution.count({ where: { paymentMethod: 'ONLINE' } }),
      prisma.contribution.aggregate({
        where: { paymentMethod: 'ONLINE' },
        _sum: { amount: true },
      }),
      // 5. Pending Online
      prisma.contribution.count({
        where: { paymentMethod: 'ONLINE', paymentStatus: 'PENDING' },
      }),
      prisma.contribution.aggregate({
        where: { paymentMethod: 'ONLINE', paymentStatus: 'PENDING' },
        _sum: { amount: true },
      }),
      // 6. Verified Online
      prisma.contribution.count({
        where: { paymentMethod: 'ONLINE', paymentStatus: 'VERIFIED' },
      }),
      prisma.contribution.aggregate({
        where: { paymentMethod: 'ONLINE', paymentStatus: 'VERIFIED' },
        _sum: { amount: true },
      }),
      // 7. Pay Later
      prisma.contribution.count({
        where: { paymentMethod: 'PAY_LATER' },
      }),
      prisma.contribution.aggregate({
        where: { paymentMethod: 'PAY_LATER' },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      role: session.role,
      stats: {
        totalContributions,
        totalAmount: totalSumResult._sum.amount || 0,
        todayContributions,
        todayAmount: todaySumResult._sum.amount || 0,
        cashContributions: cashCount,
        cashAmount: cashSumResult._sum.amount || 0,
        onlineContributions: onlineCount,
        onlineAmount: onlineSumResult._sum.amount || 0,
        pendingOnlinePayments: pendingOnlineCount,
        pendingOnlineAmount: pendingOnlineSumResult._sum.amount || 0,
        verifiedOnlinePayments: verifiedOnlineCount,
        verifiedOnlineAmount: verifiedOnlineSumResult._sum.amount || 0,
        payLaterContributions: payLaterCount,
        payLaterAmount: payLaterSumResult._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
