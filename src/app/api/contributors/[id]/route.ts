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

  const { id } = params;

  try {
    const contributor = await prisma.contributor.findUnique({
      where: { id },
      include: {
        contributions: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: { select: { name: true } },
          },
        },
        ladduBalances: {
          orderBy: { ladduYear: 'desc' },
          include: {
            payments: {
              orderBy: { createdAt: 'desc' },
              include: {
                createdBy: { select: { name: true } },
              },
            },
            createdBy: { select: { name: true } },
          },
        },
      },
    });

    if (!contributor) {
      return NextResponse.json({ error: 'Contributor not found' }, { status: 404 });
    }

    // Compute aggregates
    const totalChanda = contributor.contributions.reduce((acc, c) => acc + c.amount, 0);
    const totalLadduDue = contributor.ladduBalances.reduce((acc, l) => acc + l.totalDue, 0);
    const totalLadduPaid = contributor.ladduBalances.reduce((acc, l) => acc + l.totalPaid, 0);
    const remainingLadduBalance = contributor.ladduBalances.reduce((acc, l) => acc + l.remainingBalance, 0);

    return NextResponse.json({
      success: true,
      data: {
        ...contributor,
        aggregates: {
          totalChanda,
          totalLadduDue,
          totalLadduPaid,
          remainingLadduBalance,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching contributor profile:', error);
    return NextResponse.json({ error: 'Failed to fetch contributor profile' }, { status: 500 });
  }
}
