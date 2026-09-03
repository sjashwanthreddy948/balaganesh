import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession, hashPassword } from '@/lib/auth';
import { createVolunteerSchema } from '@/lib/validation';

export async function GET() {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const volunteers = await prisma.user.findMany({
      where: { role: 'VOLUNTEER' },
      select: {
        id: true,
        name: true,
        username: true,
        mobile: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { createdContributions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute total amount collected for each volunteer
    const results = await Promise.all(
      volunteers.map(async (v) => {
        const sumResult = await prisma.contribution.aggregate({
          where: { createdById: v.id },
          _sum: { amount: true },
        });

        const cashResult = await prisma.contribution.aggregate({
          where: { createdById: v.id, paymentMethod: 'CASH' },
          _sum: { amount: true },
        });

        const onlineResult = await prisma.contribution.aggregate({
          where: { createdById: v.id, paymentMethod: 'ONLINE' },
          _sum: { amount: true },
        });

        return {
          id: v.id,
          name: v.name,
          username: v.username,
          mobile: v.mobile,
          isActive: v.isActive,
          createdAt: v.createdAt,
          contributionCount: v._count.createdContributions,
          totalAmount: sumResult._sum.amount || 0,
          cashAmount: cashResult._sum.amount || 0,
          onlineAmount: onlineResult._sum.amount || 0,
        };
      })
    );

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Error getting volunteers:', error);
    return NextResponse.json({ error: 'Failed to fetch volunteers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validation = createVolunteerSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Invalid volunteer details.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, username, password, mobile } = validation.data;

    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A volunteer with this username already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newVolunteer = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        mobile: mobile || null,
        role: 'VOLUNTEER',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Volunteer created successfully.',
      data: newVolunteer,
    });
  } catch (error) {
    console.error('Error creating volunteer:', error);
    return NextResponse.json({ error: 'Failed to create volunteer' }, { status: 500 });
  }
}
