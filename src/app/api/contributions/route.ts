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
    const paymentStatus = data.paymentMethod === 'CASH' ? 'CASH_RECEIVED' : 'PENDING';

    // Generate next sequential certificate number
    const certificateNumber = await generateNextCertificateNumber();

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

  try {
    const whereClause: any = {};

    if (session.role === 'VOLUNTEER') {
      whereClause.createdById = session.id;
    } else if (volunteerId && volunteerId !== 'ALL') {
      whereClause.createdById = volunteerId;
    }

    if (paymentMethod && ['CASH', 'ONLINE'].includes(paymentMethod)) {
      whereClause.paymentMethod = paymentMethod;
    }

    if (status && ['CASH_RECEIVED', 'PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
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
        { fullName: { contains: search } },
        { mobileNumber: { contains: search } },
        { certificateNumber: { contains: search } },
        { utr: { contains: search } },
      ];
    }

    const contributions = await prisma.contribution.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        createdBy: {
          select: { name: true, username: true },
        },
        verifiedBy: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: contributions.map((c) => ({
        ...c,
        volunteerName: c.createdBy.name,
        verifiedByName: c.verifiedBy?.name || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributions' },
      { status: 500 }
    );
  }
}
