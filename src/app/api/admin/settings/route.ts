import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession, hashPassword } from '@/lib/auth';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export async function GET() {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const volunteerUser = await prisma.user.findFirst({
      where: { username: 'balaganesh' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        canAddExpenses: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        upiId: FESTIVAL_CONFIG.upiId,
        upiPayeeName: FESTIVAL_CONFIG.upiPayeeName,
        associationName: FESTIVAL_CONFIG.associationName,
        associationAddress: FESTIVAL_CONFIG.associationAddress,
        festivalYear: FESTIVAL_CONFIG.festivalYear,
        volunteerUser: volunteerUser || {
          username: 'balaganesh',
          isActive: true,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { newVolunteerPassword } = body;

    if (!newVolunteerPassword || typeof newVolunteerPassword !== 'string' || newVolunteerPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newVolunteerPassword);

    await prisma.user.upsert({
      where: { username: 'balaganesh' },
      update: {
        password: hashedPassword,
        isActive: true,
      },
      create: {
        username: 'balaganesh',
        name: 'balaganesh',
        password: hashedPassword,
        role: 'VOLUNTEER',
        isActive: true,
        canAddExpenses: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Volunteer password updated successfully.',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
