import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch Contributions:
    // Only CASH_RECEIVED or VERIFIED count toward actual festival balance.
    const contributions = await prisma.contribution.findMany({
      select: {
        amount: true,
        paymentMethod: true,
        paymentStatus: true,
      },
    });

    let totalChanda = 0;
    let cashChanda = 0;
    let onlineChanda = 0;
    let pendingOnlineChanda = 0;
    let payLaterChanda = 0;
    let payLaterCount = 0;
    let verifiedContributors = 0;

    for (const c of contributions) {
      if (c.paymentStatus === 'CASH_RECEIVED') {
        totalChanda += c.amount;
        cashChanda += c.amount;
        verifiedContributors += 1;
      } else if (c.paymentMethod === 'ONLINE' && c.paymentStatus === 'VERIFIED') {
        totalChanda += c.amount;
        onlineChanda += c.amount;
        verifiedContributors += 1;
      } else if (c.paymentMethod === 'ONLINE' && c.paymentStatus === 'PENDING') {
        pendingOnlineChanda += c.amount;
      } else if (c.paymentMethod === 'PAY_LATER' || c.paymentStatus === 'PAY_LATER') {
        payLaterChanda += c.amount;
        payLaterCount += 1;
      }
    }

    // 2. Fetch Expenses
    const expenses = await prisma.expense.findMany({
      select: {
        amount: true,
        paymentMethod: true,
        category: true,
      },
    });

    let totalExpenses = 0;
    let cashExpenses = 0;
    let onlineExpenses = 0;
    const categoryTotals: Record<string, { totalAmount: number; count: number }> = {};

    for (const e of expenses) {
      totalExpenses += e.amount;
      if (e.paymentMethod === 'CASH') {
        cashExpenses += e.amount;
      } else {
        onlineExpenses += e.amount;
      }

      if (!categoryTotals[e.category]) {
        categoryTotals[e.category] = { totalAmount: 0, count: 0 };
      }
      categoryTotals[e.category].totalAmount += e.amount;
      categoryTotals[e.category].count += 1;
    }

    // 3. Category Breakdown with percentages
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        totalAmount: data.totalAmount,
        count: data.count,
        percentage: totalExpenses > 0 ? Math.round((data.totalAmount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // 3. Fetch Laddu Balances & Payments (Kept strictly separated from Chanda)
    const [ladduTotals, ladduCash, ladduOnline, ladduPaidCount, ladduPendingCount] = await Promise.all([
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
      prisma.ladduBalance.count({ where: { status: 'PAID' } }),
      prisma.ladduBalance.count({ where: { status: { not: 'PAID' } } }),
    ]);

    const totalLadduDue = ladduTotals._sum.totalDue || 0;
    const totalLadduCollected = ladduTotals._sum.totalPaid || 0;
    const cashLaddu = ladduCash._sum.amount || 0;
    const onlineLaddu = ladduOnline._sum.amount || 0;
    const outstandingLadduBalance = ladduTotals._sum.remainingBalance || 0;

    // 4. Balances
    const remainingBalance = totalChanda - totalExpenses;
    const estimatedCashBalance = cashChanda - cashExpenses;
    const onlineBalance = onlineChanda - onlineExpenses;

    const netTotalFestivalBalance = (totalChanda + totalLadduCollected) - totalExpenses;
    const netFestivalCashOnHand = (cashChanda + cashLaddu) - cashExpenses;
    const netFestivalOnlineBank = (onlineChanda + onlineLaddu) - onlineExpenses;

    return NextResponse.json({
      success: true,
      summary: {
        income: {
          totalChanda,
          cashChanda,
          onlineChanda,
          pendingOnlineChanda,
          payLaterChanda,
          payLaterCount,
          totalContributors: verifiedContributors,
        },
        laddu: {
          totalLadduDue,
          totalLadduCollected,
          cashLaddu,
          onlineLaddu,
          outstandingLadduBalance,
          fullyPaidCount: ladduPaidCount,
          pendingCount: ladduPendingCount,
        },
        expenses: {
          totalExpenses,
          cashExpenses,
          onlineExpenses,
          totalExpenseCount: expenses.length,
        },
        balance: {
          remainingBalance, // Chanda Net Balance (backward compatible)
          estimatedCashBalance,
          onlineBalance,
          netTotalFestivalBalance, // Grand Net including Laddu collections
          netFestivalCashOnHand,
          netFestivalOnlineBank,
        },
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error('Error computing financial summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate financial summary' },
      { status: 500 }
    );
  }
}
