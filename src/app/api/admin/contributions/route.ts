import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const status = searchParams.get('status')?.trim().toUpperCase();

  try {
    const whereClause: any = {};

    if (status && ['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
      whereClause.paymentStatus = status;
    }

    if (search && search.length > 0) {
      whereClause.OR = [
        { fullName: { contains: search } },
        { mobileNumber: { contains: search } },
        { receiptNumber: { contains: search } },
        { utr: { contains: search } },
      ];
    }

    const contributions = await prisma.contribution.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100, // Reasonable batch limit
    });

    return NextResponse.json({
      success: true,
      data: contributions,
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id || !['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid update parameters' }, { status: 400 });
    }

    const updated = await prisma.contribution.update({
      where: { id },
      data: {
        paymentStatus: status,
        notes: notes !== undefined ? notes : undefined,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating contribution:', error);
    return NextResponse.json({ error: 'Failed to update contribution status' }, { status: 500 });
  }
}
