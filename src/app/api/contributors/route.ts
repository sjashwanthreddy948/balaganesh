import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { cleanIndianMobile } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mobile = searchParams.get('mobile')?.trim();
  const search = searchParams.get('search')?.trim();

  try {
    if (mobile) {
      const clean = cleanIndianMobile(mobile);
      if (!clean) {
        return NextResponse.json({ success: true, contributor: null });
      }

      // Check Contributor table first
      let contributor = await prisma.contributor.findUnique({
        where: { mobileNumber: clean },
        include: {
          contributions: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, certificateNumber: true, amount: true, paymentMethod: true, createdAt: true },
          },
          ladduBalances: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, ladduYear: true, totalDue: true, totalPaid: true, remainingBalance: true, status: true },
          },
        },
      });

      // If not in Contributor table, check most recent Contribution with this phone to help auto-link
      if (!contributor) {
        const pastContribution = await prisma.contribution.findFirst({
          where: { mobileNumber: clean },
          orderBy: { createdAt: 'desc' },
          select: { fullName: true, mobileNumber: true, address: true },
        });

        if (pastContribution && pastContribution.mobileNumber) {
          return NextResponse.json({
            success: true,
            contributor: {
              id: null,
              fullName: pastContribution.fullName,
              mobileNumber: pastContribution.mobileNumber,
              address: pastContribution.address,
              isFromPastChanda: true,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        contributor,
      });
    }

    // If general search
    const where: any = {};
    if (search && search.length > 0) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const contributors = await prisma.contributor.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        _count: {
          select: { contributions: true, ladduBalances: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: contributors,
    });
  } catch (error) {
    console.error('Error in /api/contributors:', error);
    return NextResponse.json({ error: 'Failed to fetch contributor information' }, { status: 500 });
  }
}
