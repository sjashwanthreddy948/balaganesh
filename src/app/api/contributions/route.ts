import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contributionFormSchema, cleanIndianMobile } from '@/lib/validation';
import { generateNextReceiptNumber } from '@/lib/receipt-number';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate inputs using Zod
    const validation = contributionFormSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Invalid input data.';
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const data = validation.data;
    const cleanMobile = cleanIndianMobile(data.mobileNumber);
    const cleanUtr = data.utr.trim().toUpperCase();

    // 2. Duplicate UTR check
    const existingUtr = await prisma.contribution.findUnique({
      where: { utr: cleanUtr },
    });

    if (existingUtr) {
      return NextResponse.json(
        {
          success: false,
          error: 'This transaction ID has already been submitted.',
        },
        { status: 409 }
      );
    }

    // 3. Generate sequential unique receipt number
    const receiptNumber = await generateNextReceiptNumber();

    // 4. Create contribution record with status PENDING
    const contribution = await prisma.contribution.create({
      data: {
        receiptNumber,
        fullName: data.fullName.trim(),
        mobileNumber: cleanMobile,
        address: data.address?.trim() || null,
        amount: data.amount,
        utr: cleanUtr,
        paymentScreenshot: data.paymentScreenshot || null,
        paymentStatus: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contribution submitted successfully. Pending verification.',
      data: {
        id: contribution.id,
        receiptNumber: contribution.receiptNumber,
        fullName: contribution.fullName,
        mobileNumber: contribution.mobileNumber,
        address: contribution.address,
        amount: contribution.amount,
        utr: contribution.utr,
        paymentStatus: contribution.paymentStatus,
        createdAt: contribution.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating contribution:', error);

    // Handle unique constraint failure in case of race condition
    if (error?.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'This transaction ID has already been submitted.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
