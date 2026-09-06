'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { buildWhatsAppExpenseVoucherShareUrl } from '@/config/festival.config';
import { Download, Printer, MessageCircle, X, Receipt, Image as ImageIcon } from 'lucide-react';

export interface ExpenseVoucherData {
  id: string;
  expenseNumber: string;
  shopName: string;
  category: string;
  description?: string | null;
  amount: number;
  paymentMethod: 'CASH' | 'ONLINE';
  date: string;
  notes?: string | null;
  billImage?: string | null;
  enteredBy: string;
  addedByName?: string;
  isAdvance?: boolean;
  totalCost?: number | null;
  advanceAmount?: number | null;
  pendingBalance?: number | null;
  createdAt: string;
}

interface ExpenseVoucherModalProps {
  expense: ExpenseVoucherData;
  onClose: () => void;
  onViewVendorPhoto?: (url: string) => void;
}

function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  return inWords(Math.floor(num)).trim() + ' Rupees Only';
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function ExpenseVoucherModal({
  expense,
  onClose,
  onViewVendorPhoto,
}: ExpenseVoucherModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const drawReceipt = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Authentic Vertical Retail Shop Bill / Cash Memo format
    const width = 1100;
    const height = 1500;
    canvas.width = width;
    canvas.height = height;

    const isAdv = Boolean(expense.isAdvance);
    const totalCost = expense.totalCost || expense.amount;
    const pending = expense.pendingBalance ?? (isAdv ? Math.max(0, totalCost - expense.amount) : 0);

    const dateObj = new Date(expense.date);
    const formattedDate = dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // 1. PAPER BASE: Crisp White Printed Receipt Paper
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 2. DOUBLE OUTER BORDER (Classic printed invoice book style)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    // 3. TOP META STRIP (Serial book indicator)
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('ESTIMATE / CASH MEMO', 50, 60);

    ctx.textAlign = 'center';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.letterSpacing = '2px';
    ctx.fillText('|| SHREE GANESHAY NAMAH ||', width / 2, 60);

    ctx.textAlign = 'right';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#64748b';
    ctx.letterSpacing = '0px';
    ctx.fillText('ORIGINAL CUSTOMER RECEIPT', width - 50, 60);

    // Divider Line below top strip
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 72);
    ctx.lineTo(width - 50, 72);
    ctx.stroke();

    // 4. SHOP OWNER / VENDOR HEADER
    ctx.textAlign = 'center';
    ctx.font = '900 36px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.letterSpacing = '1px';
    ctx.fillText(expense.shopName.toUpperCase(), width / 2, 118);

    // Shop Specialty / Tagline
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.letterSpacing = '1.5px';
    ctx.fillText(`DEALERS IN: ${expense.category.toUpperCase()} & FESTIVAL EVENT SUPPLIES`, width / 2, 146);

    // Shop Address & Contact
    ctx.font = 'normal 13px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.letterSpacing = '0.5px';
    ctx.fillText('Main Road, Shankarpally, Ranga Reddy Dist., Telangana • Ph: +91 98480 12345', width / 2, 170);

    // 5. MEMO TYPE BANNER
    const bannerW = 620;
    const bannerH = 34;
    const bannerX = (width - bannerW) / 2;
    const bannerY = 190;

    if (isAdv) {
      ctx.fillStyle = '#fef3c7'; // Amber tint for advance
      roundRect(ctx, bannerX, bannerY, bannerW, bannerH, 6);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      roundRect(ctx, bannerX, bannerY, bannerW, bannerH, 6);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '900 15px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#92400e';
      ctx.letterSpacing = '2px';
      ctx.fillText('★ ADVANCE PAYMENT CASH MEMO & RECEIPT ★', width / 2, bannerY + 23);
    } else {
      ctx.fillStyle = '#0f172a'; // Deep slate for full payment
      roundRect(ctx, bannerX, bannerY, bannerW, bannerH, 6);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.font = '900 15px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.letterSpacing = '2px';
      ctx.fillText('★ CASH MEMO & RETAIL PAYMENT RECEIPT ★', width / 2, bannerY + 23);
    }

    // 6. INVOICE META GRID (2 COLUMNS BOX)
    const metaBoxX = 50;
    const metaBoxY = 242;
    const metaBoxW = width - 100;
    const metaBoxH = 114;

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(metaBoxX, metaBoxY, metaBoxW, metaBoxH);

    // Vertical divider in Meta Box
    const midX = metaBoxX + 540;
    ctx.beginPath();
    ctx.moveTo(midX, metaBoxY);
    ctx.lineTo(midX, metaBoxY + metaBoxH);
    ctx.stroke();

    // Column 1: Billed To / Customer
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('BILLED TO (CUSTOMER):', metaBoxX + 16, metaBoxY + 22);

    ctx.font = '900 17px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('BALA GANESH ASSOCIATION', metaBoxX + 16, metaBoxY + 46);

    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Bhavani Nagar, Shankarpally, Telangana', metaBoxX + 16, metaBoxY + 68);

    ctx.font = 'normal 12px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Representative: ${expense.enteredBy || expense.addedByName || 'Committee Representative'}`, metaBoxX + 16, metaBoxY + 92);

    // Column 2: Bill Particulars
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('BILL NO     :', midX + 16, metaBoxY + 24);
    ctx.fillText('DATE        :', midX + 16, metaBoxY + 48);
    ctx.fillText('PAY METHOD  :', midX + 16, metaBoxY + 72);
    ctx.fillText('BILL TYPE   :', midX + 16, metaBoxY + 96);

    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(expense.expenseNumber, midX + 125, metaBoxY + 24);
    ctx.fillText(formattedDate, midX + 125, metaBoxY + 48);

    ctx.fillStyle = expense.paymentMethod === 'ONLINE' ? '#1d4ed8' : '#047857';
    ctx.fillText(`${expense.paymentMethod} (RECEIVED)`, midX + 125, metaBoxY + 72);

    ctx.fillStyle = isAdv ? '#b45309' : '#047857';
    ctx.fillText(isAdv ? 'ADVANCE PAYMENT' : 'FULL PAYMENT', midX + 125, metaBoxY + 96);

    // 7. ITEMIZED TABLE (Realistic Printed Invoice Grid)
    const tableX = 50;
    const tableY = 376;
    const tableW = width - 100;
    const tableH = 430;

    // Table Outer Border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tableX, tableY, tableW, tableH);

    // Header Background
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(tableX, tableY, tableW, 40);

    // Table Header Border Bottom
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tableX, tableY + 40);
    ctx.lineTo(tableX + tableW, tableY + 40);
    ctx.stroke();

    // Column Coordinates
    const colSnoX = tableX + 55;
    const colDescX = tableX + 580;
    const colCatX = tableX + 800;
    const colAmtX = tableX + tableW;

    // Vertical Grid Lines
    [colSnoX, colDescX, colCatX].forEach((xLine) => {
      ctx.beginPath();
      ctx.moveTo(xLine, tableY);
      ctx.lineTo(xLine, tableY + tableH);
      ctx.stroke();
    });

    // Column Headers Text
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText('S.NO', tableX + 27, tableY + 25);

    ctx.textAlign = 'left';
    ctx.fillText('DESCRIPTION / PARTICULARS OF ITEMS & SERVICES', tableX + 70, tableY + 25);
    ctx.fillText('HEAD / CATEGORY', colDescX + 16, tableY + 25);

    ctx.textAlign = 'right';
    ctx.fillText('AMOUNT (INR)', colAmtX - 20, tableY + 25);

    // Row 1 Data
    const row1Y = tableY + 75;
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#334155';
    ctx.fillText('1', tableX + 27, row1Y);

    ctx.textAlign = 'left';
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0f172a';
    const mainDesc = expense.description || expense.notes || `${expense.category} supplied for Ganesh Pandal`;
    ctx.fillText(mainDesc.length > 55 ? mainDesc.slice(0, 52) + '...' : mainDesc, tableX + 70, row1Y);

    ctx.font = 'normal 12px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Shop: ${expense.shopName} • Ganesh Festival Utsav`, tableX + 70, row1Y + 22);

    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(expense.category, colDescX + 16, row1Y + 8);

    ctx.textAlign = 'right';
    ctx.font = '900 17px monospace';
    ctx.fillStyle = '#0f172a';
    const firstRowAmount = isAdv ? totalCost : expense.amount;
    ctx.fillText(`₹${firstRowAmount.toLocaleString('en-IN')}.00`, colAmtX - 20, row1Y + 8);

    // Row 1 Divider
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tableX, row1Y + 36);
    ctx.lineTo(tableX + tableW, row1Y + 36);
    ctx.stroke();

    // Row 2 Data (If Advance Payment)
    if (isAdv) {
      const row2Y = row1Y + 70;
      ctx.textAlign = 'center';
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#334155';
      ctx.fillText('2', tableX + 27, row2Y);

      ctx.textAlign = 'left';
      ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#b45309';
      ctx.fillText('Less: Advance Amount Paid Today (Receipt Amount)', tableX + 70, row2Y);

      ctx.font = 'normal 12px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Paid via ${expense.paymentMethod} • Handed over to vendor`, tableX + 70, row2Y + 20);

      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#b45309';
      ctx.fillText('Advance Paid', colDescX + 16, row2Y + 6);

      ctx.textAlign = 'right';
      ctx.font = '900 16px monospace';
      ctx.fillStyle = '#b45309';
      ctx.fillText(`(-) ₹${expense.amount.toLocaleString('en-IN')}.00`, colAmtX - 20, row2Y + 6);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tableX, row2Y + 36);
      ctx.lineTo(tableX + tableW, row2Y + 36);
      ctx.stroke();
    }

    // Faint printed guidelines for blank rows (giving classic invoice pad look)
    const startBlankY = isAdv ? row1Y + 115 : row1Y + 45;
    for (let yPos = startBlankY; yPos < tableY + tableH - 20; yPos += 45) {
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tableX, yPos);
      ctx.lineTo(tableX + tableW, yPos);
      ctx.stroke();
    }

    // 8. FINANCIAL TOTALS BLOCK (Bottom-Right of Table)
    const totalsY = tableY + tableH + 16;
    const totalsW = 480;
    const totalsX = width - 50 - totalsW;

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(totalsX, totalsY, totalsW, isAdv ? 136 : 100);

    const tRow1 = totalsY + 30;
    const tRow2 = totalsY + 62;
    const tRow3 = totalsY + 104;

    if (isAdv) {
      // Total Agreed Contract
      ctx.textAlign = 'left';
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('TOTAL AGREED CONTRACT COST:', totalsX + 16, tRow1);

      ctx.textAlign = 'right';
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`₹${totalCost.toLocaleString('en-IN')}.00`, totalsX + totalsW - 16, tRow1);

      // Advance Paid Today
      ctx.textAlign = 'left';
      ctx.font = '900 13px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#047857';
      ctx.fillText('ADVANCE AMOUNT PAID TODAY:', totalsX + 16, tRow2);

      ctx.textAlign = 'right';
      ctx.font = '900 16px monospace';
      ctx.fillStyle = '#047857';
      ctx.fillText(`₹${expense.amount.toLocaleString('en-IN')}.00`, totalsX + totalsW - 16, tRow2);

      // Divider
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(totalsX, tRow2 + 12);
      ctx.lineTo(totalsX + totalsW, tRow2 + 12);
      ctx.stroke();

      // Pending Vendor Due Box
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(totalsX + 1, tRow2 + 13, totalsW - 2, 48);

      ctx.textAlign = 'left';
      ctx.font = '900 14px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#991b1b';
      ctx.fillText('PENDING BALANCE DUE TO SHOP:', totalsX + 16, tRow3 + 12);

      ctx.textAlign = 'right';
      ctx.font = '900 22px monospace';
      ctx.fillStyle = '#b91c1c';
      ctx.fillText(`₹${pending.toLocaleString('en-IN')}.00`, totalsX + totalsW - 16, tRow3 + 12);
    } else {
      // Subtotal
      ctx.textAlign = 'left';
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('SUBTOTAL:', totalsX + 16, tRow1);

      ctx.textAlign = 'right';
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`₹${expense.amount.toLocaleString('en-IN')}.00`, totalsX + totalsW - 16, tRow1);

      // Taxes
      ctx.textAlign = 'left';
      ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('TAX / GST (IF APPLICABLE):', totalsX + 16, tRow2);

      ctx.textAlign = 'right';
      ctx.font = 'normal 13px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('NIL / COMPOSITE', totalsX + totalsW - 16, tRow2);

      // Divider
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(totalsX, tRow2 + 12);
      ctx.lineTo(totalsX + totalsW, tRow2 + 12);
      ctx.stroke();

      // Net Amount Paid Box
      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(totalsX + 1, tRow2 + 13, totalsW - 2, 44);

      ctx.textAlign = 'left';
      ctx.font = '900 15px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#166534';
      ctx.fillText('TOTAL AMOUNT PAID (INR):', totalsX + 16, tRow3 + 6);

      ctx.textAlign = 'right';
      ctx.font = '900 24px monospace';
      ctx.fillStyle = '#15803d';
      ctx.fillText(`₹${expense.amount.toLocaleString('en-IN')}.00`, totalsX + totalsW - 16, tRow3 + 6);
    }

    // 9. AMOUNT IN WORDS BOX (Left side of Totals)
    const wordsX = 50;
    const wordsY = totalsY;
    const wordsW = width - 100 - totalsW - 20;
    const wordsH = isAdv ? 136 : 100;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, wordsX, wordsY, wordsW, wordsH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('AMOUNT IN WORDS:', wordsX + 14, wordsY + 22);

    ctx.font = 'italic bold 14px Georgia, serif';
    ctx.fillStyle = '#0f172a';
    const wordsText = numberToIndianWords(expense.amount);
    ctx.fillText(wordsText, wordsX + 14, wordsY + 48, wordsW - 28);

    if (expense.notes) {
      ctx.font = 'normal 11px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`Remarks: ${expense.notes}`, wordsX + 14, wordsY + 76, wordsW - 28);
    }

    // 10. AUTHENTIC PHYSICAL RUBBER STAMP (Tilted Paid Stamp)
    ctx.save();
    // Position stamp over lower center
    ctx.translate(330, 1140);
    ctx.rotate(-0.1); // -5.7 degrees tilt like a manual hand stamp

    const stampW = 260;
    const stampH = 88;

    // Outer stamp border
    ctx.strokeStyle = isAdv ? '#b45309' : '#b91c1c';
    ctx.lineWidth = 3.5;
    roundRect(ctx, -stampW / 2, -stampH / 2, stampW, stampH, 10);
    ctx.stroke();

    // Inner thin border
    ctx.strokeStyle = isAdv ? 'rgba(180, 83, 9, 0.4)' : 'rgba(185, 28, 28, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, -stampW / 2 + 5, -stampH / 2 + 5, stampW - 10, stampH - 10, 6);
    ctx.stroke();

    // Stamp text
    ctx.textAlign = 'center';
    ctx.fillStyle = isAdv ? '#b45309' : '#b91c1c';

    ctx.font = '900 24px Arial, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(isAdv ? '★ ADVANCE PAID ★' : '★ PAID IN FULL ★', 0, -8);

    ctx.font = 'bold 12px monospace';
    ctx.letterSpacing = '1px';
    ctx.fillText(`DATE: ${formattedDate}`, 0, 14);

    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.letterSpacing = '0.5px';
    ctx.fillText(`VIA ${expense.paymentMethod} • BALA GANESH`, 0, 30);

    ctx.restore();

    // 11. SIGNATURE BLOCK (Shop Owner Sign & Customer Sign)
    const signY = 1260;

    // Customer Signature (Left)
    ctx.textAlign = 'left';
    ctx.font = 'normal 13px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Received with thanks from:', 80, signY - 20);

    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Bala Ganesh Association', 80, signY);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, signY + 60);
    ctx.lineTo(340, signY + 60);
    ctx.stroke();

    ctx.font = 'normal 12px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Customer / Representative Signature', 80, signY + 80);

    // Shop Owner Signature (Right)
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`For ${expense.shopName.toUpperCase()}`, width - 80, signY);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width - 340, signY + 60);
    ctx.lineTo(width - 80, signY + 60);
    ctx.stroke();

    ctx.font = 'normal 12px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Authorized Signatory / Shopkeeper', width - 80, signY + 80);

    // 12. BOTTOM RECEIPT FOOTER & TERMS
    const footY = 1420;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, footY - 24);
    ctx.lineTo(width - 50, footY - 24);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'normal 11px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('• Goods once sold will not be taken back or exchanged. E. & O.E.', 50, footY);
    ctx.fillText('• This is an authentic retail receipt recorded for Bala Ganesh Association accounting.', 50, footY + 18);

    ctx.textAlign = 'right';
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Thank You! Visit Again 🙏', width - 50, footY);

    // Export to Data URL
    try {
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
    } catch (err) {
      console.error('Bill canvas export error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [expense]);

  useEffect(() => {
    drawReceipt();
  }, [drawReceipt]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    const safeShop = expense.shopName.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `Bill_Receipt_${expense.expenseNumber}_${safeShop}.png`;
    link.href = imageUrl;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const whatsAppUrl = buildWhatsAppExpenseVoucherShareUrl(expense);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#071338] border-2 border-devotional-gold-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 my-auto text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-devotional-gold-300">
                Shop Bill & Payment Receipt
              </h3>
              <p className="text-xs text-gray-300 font-mono">
                {expense.expenseNumber} • {expense.shopName} (₹{expense.amount.toLocaleString('en-IN')})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Rendered Preview Container (Clean Paper Bill View) */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-devotional-gold-500/30 bg-white max-h-[68vh] overflow-y-auto">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Shop Bill ${expense.expenseNumber}`}
              className="w-full h-auto object-contain block mx-auto"
            />
          ) : (
            <div className="aspect-[3/4] w-full flex flex-col items-center justify-center gap-3 bg-[#0a1845] text-devotional-gold-300 py-16">
              <div className="w-10 h-10 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold">Generating Shop Owner Cash Memo Bill...</p>
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        {imageUrl && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {/* Download Bill PNG */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 sm:flex-none min-w-[140px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-devotional-gold-500 text-devotional-blue-950 font-black text-xs flex items-center justify-center gap-2 shadow-gold-sm hover:brightness-110 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 text-devotional-blue-950" />
              <span>Download Bill</span>
            </button>

            {/* Share on WhatsApp */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none min-w-[150px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </a>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl bg-devotional-blue-900/90 border border-devotional-gold-500/40 text-devotional-gold-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4 text-devotional-gold-400" />
              <span>Print Bill</span>
            </button>

            {/* View Attached Vendor Paper Bill (if exists) */}
            {expense.billImage && onViewVendorPhoto && (
              <button
                type="button"
                onClick={() => onViewVendorPhoto(expense.billImage!)}
                className="py-2.5 px-4 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/40 text-devotional-gold-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <ImageIcon className="w-4 h-4 text-devotional-gold-400" />
                <span>Original Bill Photo</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
