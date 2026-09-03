import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { editContributionSchema, cleanIndianMobile } from '@/lib/validation';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const identifier = params.id?.trim();
    if (!identifier) {
      return NextResponse.json({ error: 'Identifier required' }, { status: 400 });
    }

    const contribution = await prisma.contribution.findFirst({
      where: {
        OR: [
          { id: identifier },
          { certificateNumber: identifier.toUpperCase() },
        ],
      },
      include: {
        createdBy: { select: { name: true } },
        verifiedBy: { select: { name: true } },
      },
    });

    if (!contribution) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
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
        verifiedAt: contribution.verifiedAt,
        volunteerName: contribution.createdBy.name,
      },
    });
  } catch (error) {
    console.error('Error fetching contribution:', error);
    return NextResponse.json({ error: 'Failed to fetch contribution' }, { status: 500 });
  }
}

// PATCH: Verify or Reject online payment (Admin Only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status, notes } = body;

    if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.contribution.update({
      where: { id: params.id },
      data: {
        paymentStatus: status,
        notes: notes !== undefined ? notes : undefined,
        verifiedById: session.id,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Contribution status marked as ${status}`,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

// PUT: Edit contribution details (Admin Only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validation = editContributionSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Invalid edit data';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = validation.data;
    const cleanMobile = data.mobileNumber ? cleanIndianMobile(data.mobileNumber) : null;

    const updated = await prisma.contribution.update({
      where: { id: params.id },
      data: {
        fullName: data.fullName.trim(),
        mobileNumber: cleanMobile,
        address: data.address?.trim() || null,
        amount: data.amount,
        notes: data.notes?.trim() || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contribution updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error editing contribution:', error);
    return NextResponse.json({ error: 'Failed to edit contribution' }, { status: 500 });
  }
}

// DELETE: Delete contribution (Admin Only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const contribution = await prisma.contribution.findUnique({
      where: { id: params.id },
    });

    if (!contribution) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
    }

    await prisma.contribution.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Contribution deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting contribution:', error);
    return NextResponse.json({ error: 'Failed to delete contribution' }, { status: 500 });
  }
}

