import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createContributionSchema, cleanIndianMobile } from '@/lib/validation';
import { generateNextCertificateNumber } from '@/lib/certificate-number';
import { getUserSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Login required. Please login to record contributions.' },
        { status: 401 }
      );
    }
    const creatorId = session.id;

    const body = await req.json();

    // Validate request schema
    const validation = createContributionSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Invalid contribution details.';
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const data = validation.data;
    const cleanMobile = data.mobileNumber ? cleanIndianMobile(data.mobileNumber) : null;
    const cleanUtr = data.utr && data.utr.trim().length > 0 ? data.utr.trim().toUpperCase() : null;

    // Check duplicate UTR ONLY if UTR was provided
    if (cleanUtr) {
      const existing = await prisma.contribution.findFirst({
        where: { utr: cleanUtr },
      });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: 'This UTR has already been recorded.',
          },
          { status: 409 }
        );
      }
    }

    // Determine initial status based on payment method
    const paymentStatus =
      data.paymentMethod === 'CASH'
        ? 'CASH_RECEIVED'
        : data.paymentMethod === 'PAY_LATER'
        ? 'PAY_LATER'
        : 'PENDING';

    // Generate next sequential certificate number
    const certificateNumber = await generateNextCertificateNumber();

    // Link or create Contributor profile if mobile number is provided
    let contributorId: string | null = null;
    if (cleanMobile) {
      const existingContributor = await prisma.contributor.findUnique({
        where: { mobileNumber: cleanMobile },
      });
      if (existingContributor) {
        contributorId = existingContributor.id;
      } else {
        const newContributor = await prisma.contributor.create({
          data: {
            fullName: data.fullName.trim(),
            mobileNumber: cleanMobile,
            address: data.address?.trim() || null,
          },
        });
        contributorId = newContributor.id;
      }
    }

    // Create database record
    const contribution = await prisma.contribution.create({
      data: {
        certificateNumber,
        fullName: data.fullName.trim(),
        mobileNumber: cleanMobile,
        address: data.address?.trim() || null,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentStatus,
        utr: cleanUtr,
        paymentScreenshot: data.paymentScreenshot || null,
        notes: data.notes?.trim() || null,
        createdById: creatorId,
        contributorId,
      },
      include: {
        createdBy: {
          select: { name: true, username: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contribution recorded successfully.',
      data: {
        id: contribution.id,
        certificateNumber: contribution.certificateNumber,
        fullName: contribution.fullName,
        mobileNumber: contribution.mobileNumber,
        address: contribution.address,
        amount: contribution.amount,
        paymentMethod: contribution.paymentMethod,
        paymentStatus: contribution.paymentStatus,
        utr: contribution.utr,
        paymentScreenshot: contribution.paymentScreenshot,
        createdAt: contribution.createdAt,
        volunteerName: contribution.createdBy.name,
      },
    });
  } catch (error: any) {
    console.error('Error creating contribution:', error);

    if (error?.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'This transaction ID has already been recorded.',
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

export async function GET(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const paymentMethod = searchParams.get('method')?.trim().toUpperCase();
  const status = searchParams.get('status')?.trim().toUpperCase();
  const volunteerId = searchParams.get('volunteerId')?.trim();
  const dateRange = searchParams.get('dateRange')?.trim();
  const all = searchParams.get('all') === 'true';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = all ? 1000 : Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
  const skip = all ? 0 : (page - 1) * limit;

  try {
    const whereClause: any = {};

    if (volunteerId && volunteerId !== 'ALL') {
      whereClause.createdById = volunteerId;
    }

    if (paymentMethod && ['CASH', 'ONLINE', 'PAY_LATER'].includes(paymentMethod)) {
      whereClause.paymentMethod = paymentMethod;
    }

    if (status && ['CASH_RECEIVED', 'PENDING', 'VERIFIED', 'REJECTED', 'PAY_LATER'].includes(status)) {
      whereClause.paymentStatus = status;
    }

    if (dateRange === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      whereClause.createdAt = { gte: startOfDay };
    } else if (dateRange === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      whereClause.createdAt = { gte: startOfWeek };
    } else if (dateRange === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      whereClause.createdAt = { gte: startOfMonth };
    }

    if (search && search.length > 0) {
      whereClause.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search } },
        { certificateNumber: { contains: search, mode: 'insensitive' } },
        { utr: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, contributions] = await Promise.all([
      prisma.contribution.count({ where: whereClause }),
      prisma.contribution.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: {
            select: { name: true, username: true },
          },
          verifiedBy: {
            select: { name: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: contributions.map((c) => ({
        ...c,
        volunteerName: c.createdBy.name,
        verifiedByName: c.verifiedBy?.name || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributions' },
      { status: 500 }
    );
  }
}
