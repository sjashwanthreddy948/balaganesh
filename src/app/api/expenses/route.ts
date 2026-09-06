import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createExpenseSchema } from '@/lib/validation';
import { generateNextExpenseNumber } from '@/lib/expense-number';
import { getUserSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Login required to record expenses.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = createExpenseSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Invalid expense details.';
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const data = validation.data;
    const expenseNumber = await generateNextExpenseNumber();

    const isAdvance = Boolean(data.isAdvance);
    const totalCost = isAdvance ? (data.totalCost || data.amount) : (data.totalCost || data.amount);
    const advanceAmount = isAdvance ? data.amount : null;
    const pendingBalance = isAdvance ? Math.max(0, totalCost - data.amount) : 0;

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
        enteredBy: data.enteredBy.trim(),
        isAdvance,
        totalCost,
        advanceAmount,
        pendingBalance,
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
        id: expense.id,
        expenseNumber: expense.expenseNumber,
        shopName: expense.shopName,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        paymentMethod: expense.paymentMethod,
        date: expense.date.toISOString(),
        notes: expense.notes,
        billImage: expense.billImage,
        enteredBy: expense.enteredBy,
        addedByName: expense.enteredBy || expense.createdBy.name,
        isAdvance: expense.isAdvance,
        totalCost: expense.totalCost,
        advanceAmount: expense.advanceAmount,
        pendingBalance: expense.pendingBalance,
        createdAt: expense.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error recording expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record expense. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category')?.trim();
    const method = searchParams.get('method')?.trim();
    const dateRange = searchParams.get('dateRange')?.trim();
    const paymentType = searchParams.get('type')?.trim().toUpperCase();
    const all = searchParams.get('all') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = all ? 1000 : Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = all ? 0 : (page - 1) * limit;

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (method && (method === 'CASH' || method === 'ONLINE')) {
      where.paymentMethod = method;
    }

    if (paymentType === 'ADVANCE') {
      where.isAdvance = true;
    } else if (paymentType === 'FULL') {
      where.isAdvance = false;
    }

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      if (dateRange === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        where.date = { gte: startOfDay };
      } else if (dateRange === 'week') {
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        where.date = { gte: startOfWeek };
      } else if (dateRange === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        where.date = { gte: startOfMonth };
      }
    }

    if (search) {
      where.OR = [
        { shopName: { contains: search, mode: 'insensitive' } },
        { expenseNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { enteredBy: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, expenses] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: {
            select: { name: true, username: true, role: true },
          },
        },
      }),
    ]);

    const formatted = expenses.map((e) => ({
      id: e.id,
      expenseNumber: e.expenseNumber,
      shopName: e.shopName,
      category: e.category,
      description: e.description,
      amount: e.amount,
      paymentMethod: e.paymentMethod,
      date: e.date.toISOString(),
      notes: e.notes,
      billImage: e.billImage,
      enteredBy: e.enteredBy || e.createdBy.name,
      addedByName: e.enteredBy || e.createdBy.name,
      isAdvance: Boolean(e.isAdvance),
      totalCost: e.totalCost ?? e.amount,
      advanceAmount: e.advanceAmount ?? (e.isAdvance ? e.amount : null),
      pendingBalance: e.pendingBalance ?? 0,
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}
