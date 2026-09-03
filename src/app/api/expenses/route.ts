import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createExpenseSchema } from '@/lib/validation';
import { generateNextExpenseNumber } from '@/lib/expense-number';
import { getUserSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission: Admin or Volunteer with canAddExpenses
    if (session.role !== 'ADMIN') {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.id },
        select: { canAddExpenses: true },
      });
      if (!dbUser?.canAddExpenses) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to record expenses.' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const validation = createExpenseSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Invalid expense details.';
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const data = validation.data;
    const expenseNumber = await generateNextExpenseNumber();

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        shopName: data.shopName.trim(),
        category: data.category.trim(),
        description: data.description?.trim() || null,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        date: new Date(data.date),
        notes: data.notes?.trim() || null,
        billImage: data.billImage || null,
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
      message: 'Expense recorded successfully.',
      data: {
        ...expense,
        addedByName: expense.createdBy.name,
      },
    });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record expense. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const category = searchParams.get('category')?.trim();
  const paymentMethod = searchParams.get('method')?.trim().toUpperCase();
  const dateRange = searchParams.get('dateRange')?.trim();
  const volunteerId = searchParams.get('volunteerId')?.trim();

  try {
    const whereClause: any = {};

    if (volunteerId && volunteerId !== 'ALL') {
      whereClause.createdById = volunteerId;
    }

    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    if (paymentMethod && ['CASH', 'ONLINE'].includes(paymentMethod)) {
      whereClause.paymentMethod = paymentMethod;
    }

    if (dateRange === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      whereClause.date = { gte: startOfDay };
    } else if (dateRange === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      whereClause.date = { gte: startOfWeek };
    } else if (dateRange === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      whereClause.date = { gte: startOfMonth };
    }

    if (search && search.length > 0) {
      whereClause.OR = [
        { shopName: { contains: search } },
        { expenseNumber: { contains: search } },
        { description: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: 300,
      include: {
        createdBy: {
          select: { name: true, username: true, role: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: expenses.map((e) => ({
        ...e,
        addedByName: e.createdBy.name,
      })),
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}
