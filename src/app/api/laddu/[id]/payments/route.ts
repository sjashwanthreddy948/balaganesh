import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { generateNextLadduReceiptNumber } from '@/lib/laddu-receipt-number';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const laddu = await prisma.ladduBalance.findUnique({
      where: { id },
    });

    if (!laddu) {
      return NextResponse.json({ error: 'Laddu record not found' }, { status: 404 });
    }

    if (laddu.remainingBalance <= 0 || laddu.status === 'PAID') {
      return NextResponse.json(
        { error: 'This Laddu balance is already fully paid!' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { amount, paymentMethod, utr, paymentScreenshot, notes } = body;

    const paymentAmount = parseInt(amount, 10);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    if (paymentAmount > laddu.remainingBalance) {
      return NextResponse.json(
        {
          error: `Payment amount (₹${paymentAmount.toLocaleString('en-IN')}) exceeds remaining balance of ₹${laddu.remainingBalance.toLocaleString('en-IN')}`,
        },
        { status: 400 }
      );
    }

    // Generate unique sequential receipt number
    const receiptNumber = await generateNextLadduReceiptNumber();

    // Create payment in a transaction along with balance update
    const [payment, updatedBalance] = await prisma.$transaction(async (tx) => {
      const newTotalPaid = laddu.totalPaid + paymentAmount;
      const newRemaining = laddu.totalDue - newTotalPaid;
      const newStatus = newRemaining === 0 ? 'PAID' : 'PARTIALLY_PAID';

      const p = await tx.ladduPayment.create({
        data: {
          receiptNumber,
          ladduBalanceId: laddu.id,
          amount: paymentAmount,
          paymentMethod: paymentMethod === 'ONLINE' ? 'ONLINE' : 'CASH',
          utr: utr?.trim() || null,
          paymentScreenshot: paymentScreenshot || null,
          notes: notes?.trim() || null,
          createdById: session.id,
        },
        include: {
          createdBy: { select: { name: true, username: true } },
        },
      });

      const b = await tx.ladduBalance.update({
        where: { id: laddu.id },
        data: {
          totalPaid: newTotalPaid,
          remainingBalance: newRemaining,
          status: newStatus,
        },
        include: {
          createdBy: { select: { name: true } },
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return [p, b];
    });

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully`,
      data: {
        balance: updatedBalance,
        payment,
        receipt: {
          receiptNumber: payment.receiptNumber,
          personName: laddu.personName,
          mobileNumber: laddu.mobileNumber,
          ladduYear: laddu.ladduYear,
          amountPaid: payment.amount,
          totalPaid: updatedBalance.totalPaid,
          totalDue: updatedBalance.totalDue,
          remainingBalance: updatedBalance.remainingBalance,
          paymentMethod: payment.paymentMethod,
          utr: payment.utr,
          status: updatedBalance.status,
          date: payment.createdAt,
          volunteerName: session.name,
        },
      },
    });
  } catch (error) {
    console.error('Error in POST /api/laddu/[id]/payments:', error);
    return NextResponse.json({ error: 'Failed to record Laddu payment' }, { status: 500 });
  }
}
