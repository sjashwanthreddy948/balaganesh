import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { receiptNumber: string } }
) {
  try {
    const receiptNumber = params.receiptNumber?.toUpperCase();

    if (!receiptNumber) {
      return NextResponse.json({ success: false, error: 'Receipt number required' }, { status: 400 });
    }

    const contribution = await prisma.contribution.findUnique({
      where: { receiptNumber },
      select: {
        id: true,
        receiptNumber: true,
        fullName: true,
        mobileNumber: true,
        amount: true,
        utr: true,
        paymentStatus: true,
        verifiedAt: true,
        createdAt: true,
      },
    });

    if (!contribution) {
      return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 });
    }

    // Mask mobile number for donor privacy: e.g. 98****3210
    const maskedMobile =
      contribution.mobileNumber.length >= 10
        ? `${contribution.mobileNumber.slice(0, 2)}******${contribution.mobileNumber.slice(-2)}`
        : contribution.mobileNumber;

    return NextResponse.json({
      success: true,
      data: {
        ...contribution,
        maskedMobile,
      },
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch receipt' }, { status: 500 });
  }
}
