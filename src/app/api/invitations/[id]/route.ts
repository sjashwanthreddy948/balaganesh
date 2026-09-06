import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Login required to delete invitations.' },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invitation ID required.' },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found.' },
        { status: 404 }
      );
    }

    // Admins can delete any; volunteers can delete their own
    if (session.role !== 'ADMIN' && invitation.createdById !== session.id) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this invitation.' },
        { status: 403 }
      );
    }

    await prisma.invitation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation deleted successfully.',
    });
  } catch (err: any) {
    console.error('Error deleting invitation:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete invitation.' },
      { status: 500 }
    );
  }
}
