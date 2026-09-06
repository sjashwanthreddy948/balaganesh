import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const record = await prisma.ladduBalance.findUnique({
      where: { id: params.id },
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
    });

    if (!record) {
      return NextResponse.json({ error: 'Laddu record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching laddu record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required to delete Laddu records.' }, { status: 403 });
  }

  try {
    const record = await prisma.ladduBalance.findUnique({
      where: { id: params.id },
    });

    if (!record) {
      return NextResponse.json({ error: 'Laddu record not found' }, { status: 404 });
    }

    // Deleting the laddu record will cascade-delete all related ladduPayments
    await prisma.ladduBalance.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Laddu record and associated payments deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting laddu record:', error);
    return NextResponse.json({ error: 'Failed to delete Laddu record' }, { status: 500 });
  }
}
