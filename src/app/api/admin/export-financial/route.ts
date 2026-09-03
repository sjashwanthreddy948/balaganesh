import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export async function GET(req: NextRequest) {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch contributions
    const contributions = await prisma.contribution.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        createdBy: { select: { name: true } },
      },
    });

    // 2. Fetch expenses
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'asc' },
      include: {
        createdBy: { select: { name: true } },
      },
    });

    // Compute totals
    let totalChanda = 0;
    let cashChanda = 0;
    let onlineChanda = 0;

    for (const c of contributions) {
      if (c.paymentStatus === 'CASH_RECEIVED') {
        totalChanda += c.amount;
        cashChanda += c.amount;
      } else if (c.paymentMethod === 'ONLINE' && c.paymentStatus === 'VERIFIED') {
        totalChanda += c.amount;
        onlineChanda += c.amount;
      }
    }

    let totalExpenses = 0;
    let cashExpenses = 0;
    let onlineExpenses = 0;
    const categoryTotals: Record<string, number> = {};

    for (const e of expenses) {
      totalExpenses += e.amount;
      if (e.paymentMethod === 'CASH') cashExpenses += e.amount;
      else onlineExpenses += e.amount;

      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    }

    const remainingBalance = totalChanda - totalExpenses;
    const cashBalance = cashChanda - cashExpenses;
    const onlineBalance = onlineChanda - onlineExpenses;

    const escapeCsv = (str: string | number | null | undefined) => {
      if (str === null || str === undefined) return '""';
      const val = String(str).replace(/"/g, '""');
      return `"${val}"`;
    };

    const csvLines: string[] = [];

    // Header
    csvLines.push(`${FESTIVAL_CONFIG.associationName} - FESTIVAL FINANCIAL REPORT ${FESTIVAL_CONFIG.festivalYear}`);
    csvLines.push(`Generated On: ${new Date().toLocaleString('en-IN')}`);
    csvLines.push('');

    // Section 1: Executive Summary
    csvLines.push('==============================================');
    csvLines.push('FINANCIAL SUMMARY OVERVIEW');
    csvLines.push('==============================================');
    csvLines.push('Metric,Amount (INR)');
    csvLines.push(`Total Chanda Collected (Verified/Received),${totalChanda}`);
    csvLines.push(`Total Expenses,${totalExpenses}`);
    csvLines.push(`REMAINING FESTIVAL BALANCE,${remainingBalance}`);
    csvLines.push('');
    csvLines.push('CASH & BANK BREAKDOWN');
    csvLines.push(`Cash Chanda Received,${cashChanda}`);
    csvLines.push(`Cash Expenses Paid,${cashExpenses}`);
    csvLines.push(`ESTIMATED CASH BALANCE,${cashBalance}`);
    csvLines.push(`Verified Online Chanda,${onlineChanda}`);
    csvLines.push(`Online Expenses Paid,${onlineExpenses}`);
    csvLines.push(`ONLINE BANK BALANCE,${onlineBalance}`);
    csvLines.push('');

    // Section 2: Expense Category Breakdown
    csvLines.push('==============================================');
    csvLines.push('EXPENSES BY CATEGORY');
    csvLines.push('==============================================');
    csvLines.push('Category,Total Spent (INR),Percentage');
    for (const [cat, amt] of Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])) {
      const pct = totalExpenses > 0 ? ((amt / totalExpenses) * 100).toFixed(1) : '0';
      csvLines.push(`${escapeCsv(cat)},${amt},${pct}%`);
    }
    csvLines.push('');

    // Section 3: Itemized Expenses
    csvLines.push('==============================================');
    csvLines.push('ITEMIZED EXPENSES');
    csvLines.push('==============================================');
    csvLines.push('Expense No,Shop/Vendor,Category,Description,Amount (INR),Payment Method,Date,Recorded By,Notes');
    for (const e of expenses) {
      csvLines.push([
        escapeCsv(e.expenseNumber),
        escapeCsv(e.shopName),
        escapeCsv(e.category),
        escapeCsv(e.description || ''),
        e.amount,
        e.paymentMethod,
        escapeCsv(new Date(e.date).toLocaleDateString('en-IN')),
        escapeCsv(e.createdBy.name),
        escapeCsv(e.notes || ''),
      ].join(','));
    }
    csvLines.push('');

    // Section 4: Itemized Chanda Contributions
    csvLines.push('==============================================');
    csvLines.push('ITEMIZED CHANDA CONTRIBUTIONS');
    csvLines.push('==============================================');
    csvLines.push('Certificate No,Donor Name,Mobile,Amount (INR),Payment Method,Status,Date,Recorded By');
    for (const c of contributions) {
      csvLines.push([
        escapeCsv(c.certificateNumber),
        escapeCsv(c.fullName),
        escapeCsv(c.mobileNumber || ''),
        c.amount,
        c.paymentMethod,
        c.paymentStatus,
        escapeCsv(new Date(c.createdAt).toLocaleDateString('en-IN')),
        escapeCsv(c.createdBy.name),
      ].join(','));
    }

    const csvContent = csvLines.join('\n');
    const filename = `BalaGanesh_Financial_Report_${FESTIVAL_CONFIG.festivalYear}_${Date.now()}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating financial CSV:', error);
    return NextResponse.json({ error: 'Failed to export financial report' }, { status: 500 });
  }
}
