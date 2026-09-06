import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createInvitationSchema } from '@/lib/validation';
import { getUserSession } from '@/lib/auth';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Login required to view invitations.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';

    const where: any = {
      year: parseInt(FESTIVAL_CONFIG.festivalYear) || 2026,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { invitees: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }

    const invitations = await prisma.invitation.findMany({
      where,
      orderBy: { eventDate: 'asc' },
      include: {
        createdBy: {
          select: { name: true, username: true, role: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: invitations,
      count: invitations.length,
    });
  } catch (err: any) {
    console.error('Error fetching invitations:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Login required to create invitations.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = createInvitationSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Invalid invitation details.';
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const data = validation.data;
    const year = parseInt(FESTIVAL_CONFIG.festivalYear) || 2026;

    const invitation = await prisma.invitation.create({
      data: {
        title: data.title.trim(),
        invitees: data.invitees.trim(),
        eventDate: new Date(data.eventDate),
        eventTime: data.eventTime.trim(),
        venue: data.venue.trim(),
        description: data.description?.trim() || null,
        contactInfo: data.contactInfo?.trim() || null,
        year,
        createdById: session.id,
      },
      include: {
        createdBy: {
          select: { name: true, username: true, role: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation prepared and saved successfully.',
      data: invitation,
    });
  } catch (err: any) {
    console.error('Error creating invitation:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save invitation.' },
      { status: 500 }
    );
  }
}
