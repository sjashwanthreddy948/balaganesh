'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FESTIVAL_CONFIG, buildWhatsAppLadduReceiptShareUrl } from '@/config/festival.config';
import { Download, MessageCircle, Link2, Copy, Check, Printer, AlertCircle } from 'lucide-react';

export interface LadduReceiptData {
  receiptNumber: string;
  personName: string;
  mobileNumber?: string | null;
  address?: string | null;
  ladduYear: number;
  amountPaid: number;
  totalPaid: number;
  totalDue: number;
  remainingBalance: number;
  paymentMethod: string; // CASH or ONLINE
  utr?: string | null;
  status: string; // UNPAID, PARTIALLY_PAID, PAID
  date: string | Date;
  volunteerName?: string | null;
  paymentScreenshot?: string | null;
}

export function ladduDataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/png';
  const raw = atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
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

interface LadduReceiptProps {
  data: LadduReceiptData;
  onImageReady?: (dataUrl: string, blob?: Blob) => void;
  hideActions?: boolean;
}

export default function LadduReceipt({
  data,
  onImageReady,
  hideActions = false,
}: LadduReceiptProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const receiptUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/laddu/receipt/${data.receiptNumber}`
      : `https://balaganesh.vercel.app/laddu/receipt/${data.receiptNumber}`;

  const isFullyPaid = data.remainingBalance <= 0 || data.status === 'PAID';

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(receiptUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const drawReceipt = useCallback(() => {
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

      // Title Ribbon: LADDU PAYMENT RECEIPT
      const ribbonW = 740;
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

      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.letterSpacing = '3.5px';
      ctx.fillText('LADDU PAYMENT RECEIPT', width / 2, ribbonY + 29);

      // 6. RECEIPT META BAR (Receipt No, Utsav Year, Date)
      const metaY = 304;

      // Receipt Number (Left)
      ctx.textAlign = 'left';
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#0c1e54';
      ctx.fillText(`RECEIPT NO: ${data.receiptNumber}`, 120, metaY);

      // Auction Year (Center)
      ctx.textAlign = 'center';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillStyle = '#b8860b';
      ctx.letterSpacing = '1.5px';
      ctx.fillText(`LADDU UTSAV: ${data.ladduYear}`, width / 2, metaY);

      // Formatted Date (Right)
      const dateObj = new Date(data.date);
      const formattedDate = dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      ctx.textAlign = 'right';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`DATE: ${formattedDate}`, width - 120, metaY);

      // Divider Line Under Meta Bar
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(120, 322);
      ctx.lineTo(width - 120, 322);
      ctx.stroke();

      // 7. DEVOTEE HONOR BANNER (Clean, Non-Overlapping Hero)
      ctx.textAlign = 'center';
      ctx.font = 'italic 19px Georgia, serif';
      ctx.fillStyle = '#64748b';
      ctx.letterSpacing = '0px';
      ctx.fillText('Receipt issued with gratitude to', width / 2, 354);

      // Devotee Full Name with Auto-Scaling Font to Prevent Clipping
      let nameFontSize = 46;
      ctx.font = `bold ${nameFontSize}px Georgia, serif`;
      const displayName = data.personName.toUpperCase();
      while (ctx.measureText(displayName).width > 1200 && nameFontSize > 28) {
        nameFontSize -= 2;
        ctx.font = `bold ${nameFontSize}px Georgia, serif`;
      }
      ctx.fillStyle = '#0c1e54';
      ctx.letterSpacing = '1.5px';
      ctx.fillText(displayName, width / 2, 404);

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

      // Devotee Mobile & Address Subtitle
      const contactParts = [];
      if (data.mobileNumber) contactParts.push(`📱 +91 ${data.mobileNumber}`);
      if (data.address) contactParts.push(`📍 ${data.address}`);
      const contactText = contactParts.length > 0 ? contactParts.join('  •  ') : 'Registered Association Devotee';

      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.letterSpacing = '0.5px';
      ctx.fillText(contactText, width / 2, 446);

      // 8. TWO FLOATING PARTICULARS CARDS (Side-by-Side with Wide Breathing Room)
      const cardY = 475;
      const cardH = 290;
      const cardW = 820;

      // -------------------------------------------------------------
      // LEFT CARD: Devotee & Transaction Particulars
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
      ctx.fillText('PARTICULARS & PAYMENT METHOD', leftX + 30, cardY + 28);

      // Left Card: Row 1
      const col1X = leftX + 30;
      const col2X = leftX + 440;

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.letterSpacing = '1px';
      ctx.fillText('PAYMENT MODE', col1X, cardY + 76);
      ctx.fillText('AUCTION UTSAV YEAR', col2X, cardY + 76);

      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = data.paymentMethod === 'ONLINE' ? '#1d4ed8' : '#047857';
      ctx.fillText(data.paymentMethod === 'ONLINE' ? 'ONLINE (UPI)' : 'CASH PAYMENT', col1X, cardY + 104);

      ctx.fillStyle = '#b8860b';
      ctx.fillText(`${data.ladduYear} Annual Utsav`, col2X, cardY + 104);

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
      ctx.fillText(data.paymentMethod === 'ONLINE' ? 'TRANSACTION ID / UTR' : 'PAYMENT TYPE', col1X, cardY + 152);
      ctx.fillText('SETTLEMENT STATUS', col2X, cardY + 152);

      if (data.paymentMethod === 'ONLINE') {
        ctx.font = 'bold 19px monospace';
        ctx.fillStyle = '#0c1e54';
        ctx.fillText(data.utr || 'VERIFIED ONLINE', col1X, cardY + 180);
      } else {
        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#059669';
        ctx.fillText('Direct Cash Handover', col1X, cardY + 180);
      }

      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = isFullyPaid ? '#047857' : '#d97706';
      ctx.fillText(isFullyPaid ? '✓ FULLY SETTLED' : 'PARTIAL INSTALLMENT', col2X, cardY + 180);

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
      ctx.fillText('RECEIVED ON BEHALF OF', col1X, cardY + 230);
      ctx.fillText('RECORDED BY VOLUNTEER', col2X, cardY + 230);

      ctx.font = 'bold 19px sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.fillText('Bala Ganesh Association', col1X, cardY + 258);

      ctx.fillStyle = '#334155';
      ctx.fillText(data.volunteerName || 'Association Committee', col2X, cardY + 258);

      // -------------------------------------------------------------
      // RIGHT CARD: Financial Account Breakdown
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
      ctx.fillText('FINANCIAL ACCOUNT STATEMENT', rightX + 30, cardY + 28);

      const rLabelX = rightX + 30;
      const rValueX = rightX + cardW - 30;

      // Right Card: Row 1 (Total Laddu Due)
      ctx.textAlign = 'left';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.letterSpacing = '0px';
      ctx.fillText('Total Laddu Auction Due:', rLabelX, cardY + 78);

      ctx.textAlign = 'right';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.fillText(`₹${data.totalDue.toLocaleString('en-IN')}`, rValueX, cardY + 78);

      ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rLabelX, cardY + 98);
      ctx.lineTo(rValueX, cardY + 98);
      ctx.stroke();

      // Right Card: Row 2 (Amount Paid This Receipt)
      ctx.textAlign = 'left';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#047857';
      ctx.fillText('Amount Paid (This Receipt):', rLabelX, cardY + 134);

      ctx.textAlign = 'right';
      ctx.font = '900 32px sans-serif';
      ctx.fillStyle = '#047857';
      ctx.fillText(`+ ₹${data.amountPaid.toLocaleString('en-IN')}`, rValueX, cardY + 134);

      ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rLabelX, cardY + 154);
      ctx.lineTo(rValueX, cardY + 154);
      ctx.stroke();

      // Right Card: Row 3 (Cumulative Paid to Date)
      ctx.textAlign = 'left';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Cumulative Paid to Date:', rLabelX, cardY + 188);

      ctx.textAlign = 'right';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(`₹${data.totalPaid.toLocaleString('en-IN')}`, rValueX, cardY + 188);

      // Right Card: Row 4 Highlighted Remaining Balance Box
      const pillBoxX = rightX + 20;
      const pillBoxY = cardY + 214;
      const pillBoxW = cardW - 40;
      const pillBoxH = 58;

      ctx.fillStyle = isFullyPaid ? '#ecfdf5' : '#fffbeb';
      roundRect(ctx, pillBoxX, pillBoxY, pillBoxW, pillBoxH, 12);
      ctx.fill();

      ctx.strokeStyle = isFullyPaid ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 1.5;
      roundRect(ctx, pillBoxX, pillBoxY, pillBoxW, pillBoxH, 12);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '900 22px sans-serif';
      ctx.fillStyle = isFullyPaid ? '#047857' : '#b45309';
      ctx.fillText('Remaining Balance Due:', pillBoxX + 20, pillBoxY + 37);

      ctx.textAlign = 'right';
      ctx.font = '900 32px sans-serif';
      ctx.fillStyle = isFullyPaid ? '#047857' : '#d97706';
      ctx.fillText(`₹${data.remainingBalance.toLocaleString('en-IN')}`, pillBoxX + pillBoxW - 20, pillBoxY + 37);

      // 9. DYNAMIC STATUS STAMP BADGE (Centered Below Cards)
      const badgeY = 812;
      ctx.save();
      if (isFullyPaid) {
        // FULLY PAID GREEN BADGE
        const badgeW = 460;
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
        ctx.fillText('✓ FULLY PAID & SETTLED', width / 2, badgeY + 35);
      } else {
        // REMAINING BALANCE AMBER BADGE
        const badgeW = 560;
        const badgeH = 54;
        const bX = (width - badgeW) / 2;

        ctx.fillStyle = '#fffbeb';
        roundRect(ctx, bX, badgeY, badgeW, badgeH, 27);
        ctx.fill();

        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3.5;
        roundRect(ctx, bX, badgeY, badgeW, badgeH, 27);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = '900 23px sans-serif';
        ctx.fillStyle = '#b45309';
        ctx.letterSpacing = '1px';
        ctx.fillText(`REMAINING BALANCE: ₹${data.remainingBalance.toLocaleString('en-IN')}`, width / 2, badgeY + 35);
      }
      ctx.restore();

      // 10. DEVOTIONAL BLESSING & OFFICIAL FOOTER
      ctx.textAlign = 'center';
      ctx.font = 'italic 20px Georgia, serif';
      ctx.fillStyle = '#334155';
      ctx.letterSpacing = '0px';
      ctx.fillText(
        '"May Lord Ganesha bestow divine health, joy, and prosperous abundance upon your family."',
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
        `Official Computer-Generated Receipt • Verification URL: ${receiptUrl}`,
        width / 2,
        1016
      );

      // Export Canvas Data
      try {
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        setImageUrl(dataUrl);
        const blob = ladduDataUrlToBlob(dataUrl);
        if (onImageReady) onImageReady(dataUrl, blob);
      } catch (err) {
        console.error('Canvas export error:', err);
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

    // Render immediately with base layers, re-render when assets load
    tryRender();
  }, [data, isFullyPaid, onImageReady, receiptUrl]);

  useEffect(() => {
    drawReceipt();
  }, [drawReceipt]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.download = `Laddu_Receipt_${data.receiptNumber}_${data.personName.replace(/\s+/g, '_')}.png`;
    link.href = imageUrl;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const whatsAppUrl = buildWhatsAppLadduReceiptShareUrl(data);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Rendered Preview Container */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-devotional-gold-500/40 bg-[#07112c]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Laddu Receipt ${data.receiptNumber}`}
            className="w-full h-auto object-contain block"
          />
        ) : (
          <div className="aspect-[16/9] w-full flex flex-col items-center justify-center gap-3 bg-[#0a1845] text-devotional-gold-300">
            <div className="w-10 h-10 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold">Generating Official Laddu Receipt...</p>
          </div>
        )}
      </div>

      {/* Compact Action Toolbar */}
      {!hideActions && imageUrl && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {/* Download Image Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 sm:flex-none min-w-[140px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-devotional-gold-500 text-devotional-blue-950 font-black text-xs flex items-center justify-center gap-2 shadow-gold-sm hover:brightness-110 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 text-devotional-blue-950" />
            <span>Download PNG</span>
          </button>

          {/* Send on WhatsApp Button */}
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none min-w-[150px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </a>

          {/* Copy Public Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="py-2.5 px-3.5 rounded-xl bg-devotional-blue-900/90 border border-devotional-gold-500/40 text-devotional-gold-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            title="Copy Public Receipt Link"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-devotional-gold-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-3.5 rounded-xl bg-devotional-blue-900/90 border border-devotional-gold-500/40 text-devotional-gold-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            title="Print Receipt"
          >
            <Printer className="w-4 h-4 text-devotional-gold-400" />
            <span>Print</span>
          </button>
        </div>
      )}
    </div>
  );
}
