import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';

export async function GET() {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const contributions = await prisma.contribution.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
      },
    });

    const headers = [
      'Certificate No',
      'Donor Name',
      'Mobile',
      'Address',
      'Amount (INR)',
      'Payment Method',
      'Payment Status',
      'UTR / Txn ID',
      'Volunteer / Collected By',
      'Date & Time (IST)',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = contributions.map((c) => {
      const dateStr = new Date(c.createdAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
      });

      return [
        escapeCsv(c.certificateNumber),
        escapeCsv(c.fullName),
        escapeCsv(c.mobileNumber || 'N/A'),
        escapeCsv(c.address || 'N/A'),
        escapeCsv(c.amount),
        escapeCsv(c.paymentMethod),
        escapeCsv(c.paymentStatus),
        escapeCsv(c.utr || 'N/A'),
        escapeCsv(c.createdBy.name),
        escapeCsv(dateStr),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="BalaGanesh_Chanda_Contributions_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
