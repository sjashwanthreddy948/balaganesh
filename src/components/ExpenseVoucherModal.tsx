'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FESTIVAL_CONFIG, buildWhatsAppExpenseVoucherShareUrl } from '@/config/festival.config';
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

  const drawVoucher = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High resolution 16:9 canvas (1920 × 1080)
    const width = 1920;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    const bgImage = new Image();
    bgImage.src = '/images/ganesh-landscape-pandal.jpg';
    bgImage.crossOrigin = 'anonymous';

    const stampImage = new Image();
    stampImage.src = FESTIVAL_CONFIG.officialStampRedImage || '/images/bala-ganesh-stamp-red.png';
    stampImage.crossOrigin = 'anonymous';

    const renderLayers = (bgLoaded: boolean, stampLoaded: boolean) => {
      // 1. BASE: Premium Parchment Ivory Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(0.4, '#fdfbf7');
      bgGrad.addColorStop(1, '#f8f3e8');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. SUBTLE WATERMARK: Pandal / Deity Watermark (7.5% Opacity)
      if (bgLoaded && bgImage.complete && bgImage.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = 0.075;
        ctx.drawImage(bgImage, 0, 0, width, height);
        ctx.restore();
      }

      // 3. ELEGANT ROYAL BLUE & METALLIC GOLD DUAL BORDERS
      // Outer Deep Royal Blue Thick Border
      ctx.strokeStyle = '#0c1e54';
      ctx.lineWidth = 14;
      ctx.strokeRect(32, 32, width - 64, height - 64);

      // Middle Burnished Metallic Gold Border
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 4;
      ctx.strokeRect(48, 48, width - 96, height - 96);

      // Inner Hairline Border
      ctx.strokeStyle = 'rgba(12, 30, 84, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(58, 58, width - 116, height - 116);

      // 4. CORNER ROSETTES & ORNAMENTS
      const cornerInsets = [
        [48, 48],
        [width - 48, 48],
        [48, height - 48],
        [width - 48, height - 48],
      ];

      cornerInsets.forEach(([cx, cy]) => {
        // Outer Gold Ring
        ctx.strokeStyle = '#c69214';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.stroke();

        // Inner Gold Rosette
        ctx.fillStyle = '#dfb135';
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();

        // Royal Blue Center Jewel
        ctx.fillStyle = '#0c1e54';
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. SACRED INVOCATION & TOP HEADER
      ctx.textAlign = 'center';

      // Sacred Om
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillStyle = '#b8860b';
      ctx.fillText('ॐ', width / 2, 94);

      // Sanskrit Header
      ctx.font = 'bold 16px Georgia, serif';
      ctx.fillStyle = '#b8860b';
      ctx.letterSpacing = '3px';
      ctx.fillText('॥ श्री गणेशाय नमः ॥', width / 2, 122);

      // Association Name
      ctx.font = 'bold 44px sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.letterSpacing = '4px';
      ctx.fillText(FESTIVAL_CONFIG.associationName.toUpperCase(), width / 2, 172);

      // Association Location Subtitle
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.letterSpacing = '1.5px';
      ctx.fillText('Bhavani Nagar, Shankarpally, Telangana • Ganesh Festival Annual Utsav', width / 2, 204);

      // Title Ribbon: EXPENSE PAYMENT VOUCHER & BILL
      const ribbonW = 820;
      const ribbonH = 44;
      const ribbonX = (width - ribbonW) / 2;
      const ribbonY = 226;

      const ribbonGrad = ctx.createLinearGradient(ribbonX, ribbonY, ribbonX + ribbonW, ribbonY + ribbonH);
      ribbonGrad.addColorStop(0, '#0c1e54');
      ribbonGrad.addColorStop(0.5, '#1e3a8a');
      ribbonGrad.addColorStop(1, '#0c1e54');
      ctx.fillStyle = ribbonGrad;
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 2;
      roundRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, 22);
      ctx.fill();
      ctx.stroke();

      const isAdv = Boolean(expense.isAdvance);
      const titleText = isAdv ? 'ADVANCE PAYMENT VOUCHER & BILL' : 'EXPENSE PAYMENT VOUCHER & BILL';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.letterSpacing = '3px';
      ctx.fillText(titleText, width / 2, ribbonY + 29);

      // 6. RECEIPT META BAR (Voucher No, Category, Date)
      const metaY = 304;

      // Voucher Number (Left)
      ctx.textAlign = 'left';
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#0c1e54';
      ctx.fillText(`VOUCHER NO: ${expense.expenseNumber}`, 120, metaY);

      // Category (Center)
      ctx.textAlign = 'center';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillStyle = '#b8860b';
      ctx.letterSpacing = '1.5px';
      ctx.fillText(`HEAD / CATEGORY: ${expense.category.toUpperCase()}`, width / 2, metaY);

      // Formatted Date (Right)
      const dateObj = new Date(expense.date);
      const formattedDate = dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      ctx.textAlign = 'right';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`EXPENSE DATE: ${formattedDate}`, width - 120, metaY);

      // Divider Line Under Meta Bar
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(120, 322);
      ctx.lineTo(width - 120, 322);
      ctx.stroke();

      // 7. PAYEE / VENDOR & AMOUNT HERO
      ctx.textAlign = 'center';
      ctx.font = 'italic 19px Georgia, serif';
      ctx.fillStyle = '#64748b';
      ctx.letterSpacing = '0px';
      ctx.fillText('Payment disbursed to vendor / beneficiary', width / 2, 354);

      // Vendor Shop Name with Auto-Scaling Font
      let vendorFontSize = 44;
      ctx.font = `bold ${vendorFontSize}px Georgia, serif`;
      const displayVendor = expense.shopName.toUpperCase();
      while (ctx.measureText(displayVendor).width > 1200 && vendorFontSize > 28) {
        vendorFontSize -= 2;
        ctx.font = `bold ${vendorFontSize}px Georgia, serif`;
      }
      ctx.fillStyle = '#0c1e54';
      ctx.letterSpacing = '1.5px';
      ctx.fillText(displayVendor, width / 2, 404);

      // Ornate Underline with Center Diamond
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 280, 420);
      ctx.lineTo(width / 2 + 280, 420);
      ctx.stroke();

      // Center Diamond
      ctx.fillStyle = '#0c1e54';
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width / 2, 413);
      ctx.lineTo(width / 2 + 7, 420);
      ctx.lineTo(width / 2, 427);
      ctx.lineTo(width / 2 - 7, 420);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sub-description line
      const purposeText = expense.description || 'Ganesh Festival Official Expenditure';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.letterSpacing = '0.5px';
      ctx.fillText(purposeText, width / 2, 446);

      // 8. TWO FLOATING PARTICULARS CARDS (Side-by-Side)
      const cardY = 475;
      const cardH = 290;
      const cardW = 820;

      // -------------------------------------------------------------
      // LEFT CARD: Payment & Authorization Details
      // -------------------------------------------------------------
      const leftX = 120;
      ctx.save();
      ctx.shadowColor = 'rgba(12, 30, 84, 0.06)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, leftX, cardY, cardW, cardH, 16);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 2;
      roundRect(ctx, leftX, cardY, cardW, cardH, 16);
      ctx.stroke();

      // Left Card Header Bar
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(leftX + 16, cardY);
      ctx.lineTo(leftX + cardW - 16, cardY);
      ctx.arcTo(leftX + cardW, cardY, leftX + cardW, cardY + 16, 16);
      ctx.lineTo(leftX + cardW, cardY + 44);
      ctx.lineTo(leftX, cardY + 44);
      ctx.lineTo(leftX, cardY + 16);
      ctx.arcTo(leftX, cardY, leftX + 16, cardY, 16);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(198, 146, 20, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftX, cardY + 44);
      ctx.lineTo(leftX + cardW, cardY + 44);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#b8860b';
      ctx.letterSpacing = '1.5px';
      ctx.fillText('DISBURSEMENT & VOUCHER PARTICULARS', leftX + 30, cardY + 28);

      // Left Card: Row 1
      const col1X = leftX + 30;
      const col2X = leftX + 440;

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.letterSpacing = '1px';
      ctx.fillText('PAYMENT METHOD', col1X, cardY + 76);
      ctx.fillText('BUDGET CATEGORY', col2X, cardY + 76);

      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = expense.paymentMethod === 'ONLINE' ? '#1d4ed8' : '#047857';
      ctx.fillText(expense.paymentMethod === 'ONLINE' ? 'ONLINE (UPI / BANK)' : 'CASH PAYMENT', col1X, cardY + 104);

      ctx.fillStyle = '#b8860b';
      ctx.fillText(expense.category, col2X, cardY + 104);

      // Left Card: Row 1 Divider
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(col1X, cardY + 124);
      ctx.lineTo(leftX + cardW - 30, cardY + 124);
      ctx.stroke();

      // Left Card: Row 2
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.letterSpacing = '1px';
      ctx.fillText('AUTHORIZATION STATUS', col1X, cardY + 152);
      ctx.fillText('RECORDED & AUDITED BY', col2X, cardY + 152);

      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#059669';
      ctx.fillText('✓ COMMITTEE APPROVED', col1X, cardY + 180);

      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.fillText(expense.enteredBy || expense.addedByName || 'Committee Admin', col2X, cardY + 180);

      // Left Card: Row 2 Divider
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(col1X, cardY + 202);
      ctx.lineTo(leftX + cardW - 30, cardY + 202);
      ctx.stroke();

      // Left Card: Row 3
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.letterSpacing = '1px';
      ctx.fillText('ORGANIZATION', col1X, cardY + 230);
      ctx.fillText('DOCUMENT PROOF ATTACHMENT', col2X, cardY + 230);

      ctx.font = 'bold 19px sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.fillText('Bala Ganesh Association', col1X, cardY + 258);

      ctx.fillStyle = expense.billImage ? '#047857' : '#64748b';
      ctx.fillText(expense.billImage ? '✓ Vendor Bill Photo Attached' : 'Official Committee Voucher', col2X, cardY + 258);

      // -------------------------------------------------------------
      // RIGHT CARD: Financial Statement & Amount
      // -------------------------------------------------------------
      const rightX = 980;
      ctx.save();
      ctx.shadowColor = 'rgba(12, 30, 84, 0.06)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, rightX, cardY, cardW, cardH, 16);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 2;
      roundRect(ctx, rightX, cardY, cardW, cardH, 16);
      ctx.stroke();

      // Right Card Header Bar
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(rightX + 16, cardY);
      ctx.lineTo(rightX + cardW - 16, cardY);
      ctx.arcTo(rightX + cardW, cardY, rightX + cardW, cardY + 16, 16);
      ctx.lineTo(rightX + cardW, cardY + 44);
      ctx.lineTo(rightX, cardY + 44);
      ctx.lineTo(rightX, cardY + 16);
      ctx.arcTo(rightX, cardY, rightX + 16, cardY, 16);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(198, 146, 20, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rightX, cardY + 44);
      ctx.lineTo(rightX + cardW, cardY + 44);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#b8860b';
      ctx.letterSpacing = '1.5px';
      ctx.fillText('PAYMENT AMOUNT & NOTES', rightX + 30, cardY + 28);

      const rLabelX = rightX + 30;
      const rValueX = rightX + cardW - 30;

      // Right Card: Row 1 (Vendor Name)
      ctx.textAlign = 'left';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.letterSpacing = '0px';
      ctx.fillText('Payee / Shop Name:', rLabelX, cardY + 78);

      ctx.textAlign = 'right';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.fillText(expense.shopName, rValueX, cardY + 78);

      ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rLabelX, cardY + 98);
      ctx.lineTo(rValueX, cardY + 98);
      ctx.stroke();

      // Right Card: Row 2 (Purpose / Notes)
      ctx.textAlign = 'left';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Expense Note / Purpose:', rLabelX, cardY + 134);

      ctx.textAlign = 'right';
      ctx.font = 'italic 18px Georgia, serif';
      ctx.fillStyle = '#334155';
      const shortNotes = expense.notes || expense.description || 'Ganesh Festival Expense';
      ctx.fillText(shortNotes.length > 32 ? shortNotes.slice(0, 30) + '...' : shortNotes, rValueX, cardY + 134);

      ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rLabelX, cardY + 154);
      ctx.lineTo(rValueX, cardY + 154);
      ctx.stroke();

      // Right Card: Row 3 (Disbursed Date)
      ctx.textAlign = 'left';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Entry Logged Date:', rLabelX, cardY + 188);

      ctx.textAlign = 'right';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(new Date(expense.createdAt).toLocaleDateString('en-IN'), rValueX, cardY + 188);

      // Right Card: Row 4 Highlighted Net Amount Paid Box
      const pillBoxX = rightX + 20;
      const pillBoxY = cardY + 214;
      const pillBoxW = cardW - 40;
      const pillBoxH = 58;

      if (isAdv) {
        const totalCost = expense.totalCost || expense.amount;
        const pending = expense.pendingBalance ?? Math.max(0, totalCost - expense.amount);

        ctx.fillStyle = '#fffbeb'; // Soft amber
        roundRect(ctx, pillBoxX, pillBoxY, pillBoxW, pillBoxH, 12);
        ctx.fill();

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        roundRect(ctx, pillBoxX, pillBoxY, pillBoxW, pillBoxH, 12);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = '900 17px sans-serif';
        ctx.fillStyle = '#92400e';
        ctx.fillText(`Advance Paid (Cost: ₹${totalCost.toLocaleString('en-IN')} | Due: ₹${pending.toLocaleString('en-IN')}):`, pillBoxX + 16, pillBoxY + 36);

        ctx.textAlign = 'right';
        ctx.font = '900 32px sans-serif';
        ctx.fillStyle = '#b45309';
        ctx.fillText(`₹${expense.amount.toLocaleString('en-IN')}`, pillBoxX + pillBoxW - 16, pillBoxY + 38);
      } else {
        ctx.fillStyle = '#fff1f2'; // Soft rose background for expenses
        roundRect(ctx, pillBoxX, pillBoxY, pillBoxW, pillBoxH, 12);
        ctx.fill();

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        roundRect(ctx, pillBoxX, pillBoxY, pillBoxW, pillBoxH, 12);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = '900 22px sans-serif';
        ctx.fillStyle = '#9f1239';
        ctx.fillText('Total Amount Disbursed:', pillBoxX + 20, pillBoxY + 37);

        ctx.textAlign = 'right';
        ctx.font = '900 34px sans-serif';
        ctx.fillStyle = '#e11d48';
        ctx.fillText(`₹${expense.amount.toLocaleString('en-IN')}`, pillBoxX + pillBoxW - 20, pillBoxY + 37);
      }

      // 9. DYNAMIC STATUS STAMP BADGE (Centered Below Cards)
      const badgeY = 812;
      ctx.save();
      const badgeW = isAdv ? 520 : 480;
      const badgeH = 54;
      const bX = (width - badgeW) / 2;

      ctx.fillStyle = '#ecfdf5';
      roundRect(ctx, bX, badgeY, badgeW, badgeH, 27);
      ctx.fill();

      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3.5;
      roundRect(ctx, bX, badgeY, badgeW, badgeH, 27);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '900 24px sans-serif';
      ctx.fillStyle = '#047857';
      ctx.letterSpacing = '1.5px';
      ctx.fillText(isAdv ? '✓ ADVANCE PAYMENT VERIFIED & PAID' : '✓ EXPENSE VERIFIED & PAID', width / 2, badgeY + 35);
      ctx.restore();

      // 10. DEVOTIONAL BLESSING & OFFICIAL FOOTER
      ctx.textAlign = 'center';
      ctx.font = 'italic 20px Georgia, serif';
      ctx.fillStyle = '#334155';
      ctx.letterSpacing = '0px';
      ctx.fillText(
        '"May Lord Ganesha bestow divine health, joy, and prosperous abundance upon our community."',
        width / 2,
        902
      );

      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.letterSpacing = '2px';
      ctx.fillText('Ganpati Bappa Morya! 🙏 • BALA GANESH ASSOCIATION', width / 2, 944);

      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#b8860b';
      ctx.letterSpacing = '1.5px';
      ctx.fillText('Bhavani Nagar, Shankarpally, Telangana', width / 2, 974);

      // 11. OFFICIAL RED SEAL (Right Side Clearance)
      if (stampLoaded && stampImage.complete && stampImage.naturalWidth > 0) {
        ctx.save();
        const sealW = 190;
        const sealH = 130;
        ctx.drawImage(stampImage, width - 330, 820, sealW, sealH);
        ctx.restore();
      }

      // 12. AUDIT / VERIFICATION LINE
      ctx.font = '13px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.letterSpacing = '0.5px';
      ctx.fillText(
        `Official Bala Ganesh Association Expense Bill & Payment Voucher • ${expense.expenseNumber}`,
        width / 2,
        1016
      );

      // Export Canvas Data
      try {
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        setImageUrl(dataUrl);
      } catch (err) {
        console.error('Expense canvas export error:', err);
      } finally {
        setIsGenerating(false);
      }
    };

    let bgDone = bgImage.complete;
    let stampDone = stampImage.complete;

    const tryRender = () => {
      renderLayers(bgDone, stampDone);
    };

    bgImage.onload = () => {
      bgDone = true;
      tryRender();
    };
    bgImage.onerror = () => {
      bgDone = false;
      tryRender();
    };

    stampImage.onload = () => {
      stampDone = true;
      tryRender();
    };
    stampImage.onerror = () => {
      stampDone = false;
      tryRender();
    };

    tryRender();
  }, [expense]);

  useEffect(() => {
    drawVoucher();
  }, [drawVoucher]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    const safeShop = expense.shopName.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `Expense_Bill_${expense.expenseNumber}_${safeShop}.png`;
    link.href = imageUrl;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const whatsAppUrl = buildWhatsAppExpenseVoucherShareUrl(expense);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-4xl bg-[#071338] border-2 border-devotional-gold-500/50 rounded-3xl p-5 shadow-2xl space-y-4 my-auto text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-devotional-gold-500/20 border border-devotional-gold-400 flex items-center justify-center text-devotional-gold-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-devotional-gold-300">
                Official Expense Bill & Voucher
              </h3>
              <p className="text-xs text-gray-400 font-mono">
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

        {/* Rendered Preview Container */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-devotional-gold-500/40 bg-[#050c24]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Expense Bill ${expense.expenseNumber}`}
              className="w-full h-auto object-contain block"
            />
          ) : (
            <div className="aspect-[16/9] w-full flex flex-col items-center justify-center gap-3 bg-[#0a1845] text-devotional-gold-300">
              <div className="w-10 h-10 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold">Generating Official Expense Bill...</p>
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
              <span>Download Bill PNG</span>
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
              <span>Print</span>
            </button>

            {/* View Attached Vendor Paper Bill (if exists) */}
            {expense.billImage && onViewVendorPhoto && (
              <button
                type="button"
                onClick={() => onViewVendorPhoto(expense.billImage!)}
                className="py-2.5 px-4 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/40 text-devotional-gold-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <ImageIcon className="w-4 h-4 text-devotional-gold-400" />
                <span>View Vendor Bill Photo</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
