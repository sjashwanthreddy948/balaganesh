import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { cleanIndianMobile } from '@/lib/validation';
import { generateNextLadduReceiptNumber } from '@/lib/laddu-receipt-number';

export async function GET(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const status = searchParams.get('status')?.trim().toUpperCase();
  const yearParam = searchParams.get('year')?.trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  try {
    const where: any = {};

    if (status && ['UNPAID', 'PARTIALLY_PAID', 'PAID'].includes(status)) {
      where.status = status;
    }

    if (yearParam && !isNaN(parseInt(yearParam, 10))) {
      where.ladduYear = parseInt(yearParam, 10);
    }

    if (search && search.length > 0) {
      where.OR = [
        { personName: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search } },
        { address: { contains: search, mode: 'insensitive' } },
        {
          payments: {
            some: {
              OR: [
                { receiptNumber: { contains: search, mode: 'insensitive' } },
                { utr: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    // Get total count for pagination
    const [total, records, statsResult] = await Promise.all([
      prisma.ladduBalance.count({ where }),
      prisma.ladduBalance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: { select: { name: true, username: true } },
          payments: {
            orderBy: { createdAt: 'desc' },
            include: {
              createdBy: { select: { name: true, username: true } },
            },
          },
          contributor: {
            select: { id: true, fullName: true, mobileNumber: true },
          },
        },
      }),
      prisma.ladduBalance.aggregate({
        _sum: {
          totalDue: true,
          totalPaid: true,
          remainingBalance: true,
        },
        _count: { id: true },
      }),
    ]);

    const [unpaidCount, partiallyPaidCount, paidCount] = await Promise.all([
      prisma.ladduBalance.count({ where: { status: 'UNPAID' } }),
      prisma.ladduBalance.count({ where: { status: 'PARTIALLY_PAID' } }),
      prisma.ladduBalance.count({ where: { status: 'PAID' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalRecords: statsResult._count.id || 0,
        totalDue: statsResult._sum.totalDue || 0,
        totalPaid: statsResult._sum.totalPaid || 0,
        remainingBalance: statsResult._sum.remainingBalance || 0,
        unpaidCount,
        partiallyPaidCount,
        paidCount,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/laddu:', error);
    return NextResponse.json({ error: 'Failed to fetch Laddu records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { personName, mobileNumber, address, ladduYear, totalDue, notes, initialPayment } = body;

    if (!personName || !personName.trim()) {
      return NextResponse.json({ error: 'Person Name is required' }, { status: 400 });
    }

    const dueAmount = parseInt(totalDue, 10);
    if (isNaN(dueAmount) || dueAmount <= 0) {
      return NextResponse.json({ error: 'Valid total due amount is required' }, { status: 400 });
    }

    const year = parseInt(ladduYear, 10) || 2025;
    const cleanPhone = mobileNumber ? cleanIndianMobile(mobileNumber) : null;

    // Link or create Contributor profile if mobile is provided
    let contributorId: string | null = null;
    if (cleanPhone) {
      const existingContributor = await prisma.contributor.findUnique({
        where: { mobileNumber: cleanPhone },
      });

      if (existingContributor) {
        contributorId = existingContributor.id;
      } else {
        const newContributor = await prisma.contributor.create({
          data: {
            fullName: personName.trim(),
            mobileNumber: cleanPhone,
            address: address?.trim() || null,
          },
        });
        contributorId = newContributor.id;
      }
    }

    let totalPaid = 0;
    let remainingBalance = dueAmount;
    let status = 'UNPAID';

    const hasInitialPayment = initialPayment && initialPayment.amount && parseInt(initialPayment.amount, 10) > 0;
    const initialAmt = hasInitialPayment ? parseInt(initialPayment.amount, 10) : 0;

    if (hasInitialPayment) {
      if (initialAmt > dueAmount) {
        return NextResponse.json(
          { error: 'Initial payment cannot exceed total due amount' },
          { status: 400 }
        );
      }
      totalPaid = initialAmt;
      remainingBalance = dueAmount - totalPaid;
      status = remainingBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';
    }

    // Create Laddu Balance Record
    const ladduRecord = await prisma.ladduBalance.create({
      data: {
        personName: personName.trim(),
        mobileNumber: cleanPhone,
        address: address?.trim() || null,
        ladduYear: year,
        totalDue: dueAmount,
        totalPaid,
        remainingBalance,
        status,
        notes: notes?.trim() || null,
        contributorId,
        createdById: session.id,
      },
      include: {
        createdBy: { select: { name: true } },
      },
    });

    let createdPayment = null;
    if (hasInitialPayment) {
      const receiptNumber = await generateNextLadduReceiptNumber();
      createdPayment = await prisma.ladduPayment.create({
        data: {
          receiptNumber,
          ladduBalanceId: ladduRecord.id,
          amount: initialAmt,
          paymentMethod: initialPayment.paymentMethod === 'ONLINE' ? 'ONLINE' : 'CASH',
          utr: initialPayment.utr?.trim() || null,
          paymentScreenshot: initialPayment.paymentScreenshot || null,
          notes: initialPayment.notes?.trim() || null,
          createdById: session.id,
        },
        include: {
          createdBy: { select: { name: true } },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Laddu record created successfully',
      data: {
        ...ladduRecord,
        payment: createdPayment,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/laddu:', error);
    return NextResponse.json({ error: 'Failed to create Laddu record' }, { status: 500 });
  }
}
