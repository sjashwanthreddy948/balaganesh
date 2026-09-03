import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { editExpenseSchema } from '@/lib/validation';
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
    const expense = await prisma.expense.findFirst({
      where: {
        OR: [{ id: params.id }, { expenseNumber: params.id.toUpperCase() }],
      },
      include: {
        createdBy: {
          select: { name: true, username: true, role: true },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...expense,
        addedByName: expense.createdBy.name,
      },
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validation = editExpenseSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Invalid expense data.';
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const data = validation.data;

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: {
        shopName: data.shopName.trim(),
        category: data.category.trim(),
        description: data.description?.trim() || null,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        date: new Date(data.date),
        notes: data.notes?.trim() || null,
        billImage: data.billImage || undefined,
      },
      include: {
        createdBy: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Expense updated successfully.',
      data: {
        ...updated,
        addedByName: updated.createdBy.name,
      },
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
  }

  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
