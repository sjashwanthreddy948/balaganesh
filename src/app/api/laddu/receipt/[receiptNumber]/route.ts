import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { receiptNumber: string } }
) {
  const receiptNum = params.receiptNumber?.trim().toUpperCase();

  if (!receiptNum) {
    return NextResponse.json({ error: 'Receipt number is required' }, { status: 400 });
  }

  try {
    const payment = await prisma.ladduPayment.findUnique({
      where: { receiptNumber: receiptNum },
      include: {
        ladduBalance: true,
        createdBy: { select: { name: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Laddu receipt not found' }, { status: 404 });
    }

    const laddu = payment.ladduBalance;

    return NextResponse.json({
      success: true,
      data: {
        receiptNumber: payment.receiptNumber,
        personName: laddu.personName,
        mobileNumber: laddu.mobileNumber,
        address: laddu.address,
        ladduYear: laddu.ladduYear,
        amountPaid: payment.amount,
        totalPaid: laddu.totalPaid,
        totalDue: laddu.totalDue,
        remainingBalance: laddu.remainingBalance,
        paymentMethod: payment.paymentMethod,
        utr: payment.utr,
        paymentScreenshot: payment.paymentScreenshot,
        status: laddu.status,
        date: payment.createdAt,
        volunteerName: payment.createdBy.name,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/laddu/receipt/[receiptNumber]:', error);
    return NextResponse.json({ error: 'Failed to retrieve receipt' }, { status: 500 });
  }
}
