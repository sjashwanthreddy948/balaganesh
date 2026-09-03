'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FESTIVAL_CONFIG } from '@/config/festival.config';
import { Download, Share2, CheckCircle, Clock } from 'lucide-react';

export interface ReceiptData {
  receiptNumber: string;
  fullName: string;
  mobileNumber: string;
  amount: number;
  utr: string;
  paymentStatus: string;
  createdAt: string | Date;
}

interface ReceiptCanvasProps {
  data: ReceiptData;
  onImageGenerated?: (dataUrl: string) => void;
}

export default function ReceiptCanvas({ data, onImageGenerated }: ReceiptCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const drawReceipt = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High resolution canvas for crisp image
    const width = 1000;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;

    // 1. Background - Deep royal blue pandal gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#07112c');
    bgGradient.addColorStop(0.5, '#0d1f4d');
    bgGradient.addColorStop(1, '#050b1e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle decorative festival glow in the center top
    const radialGlow = ctx.createRadialGradient(width / 2, 220, 20, width / 2, 220, 450);
    radialGlow.addColorStop(0, 'rgba(229, 179, 30, 0.12)');
    radialGlow.addColorStop(1, 'rgba(229, 179, 30, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Double Gold Border
    // Outer border
    ctx.strokeStyle = '#e5b31e';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Inner thin border
    ctx.strokeStyle = 'rgba(243, 202, 62, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(42, 42, width - 84, height - 84);

    // Corner decorative corner brackets
    const cornerSize = 35;
    const corners = [
      [30, 30],
      [width - 30, 30],
      [30, height - 30],
      [width - 30, height - 30],
    ];
    ctx.fillStyle = '#f3ca3e';
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Header: Sacred Symbol & Association Name
    ctx.textAlign = 'center';
    
    // Om symbol
    ctx.font = 'bold 38px serif';
    ctx.fillStyle = '#f3ca3e';
    ctx.fillText('ॐ', width / 2, 95);

    // Association Name
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.letterSpacing = '2px';
    ctx.fillText(FESTIVAL_CONFIG.associationName.toUpperCase(), width / 2, 145);

    // Subtitle: GANESH FESTIVAL
    ctx.font = '600 20px sans-serif';
    ctx.fillStyle = '#e8efff';
    ctx.fillText(`GANESH FESTIVAL ${FESTIVAL_CONFIG.festivalYear}`, width / 2, 180);

    // Title badge: CHANDA CONTRIBUTION RECEIPT
    const badgeY = 205;
    const badgeW = 480;
    const badgeH = 38;
    ctx.fillStyle = 'rgba(229, 179, 30, 0.15)';
    ctx.strokeStyle = '#e5b31e';
    ctx.lineWidth = 1.5;
    roundRect(ctx, (width - badgeW) / 2, badgeY, badgeW, badgeH, 19);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#fff7c2';
    ctx.fillText('CHANDA CONTRIBUTION RECEIPT', width / 2, badgeY + 25);

    // Divider line with small center diamond
    ctx.strokeStyle = 'rgba(229, 179, 30, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 275);
    ctx.lineTo(width - 120, 275);
    ctx.stroke();

    // Center gold diamond
    ctx.fillStyle = '#e5b31e';
    ctx.beginPath();
    ctx.moveTo(width / 2, 270);
    ctx.lineTo(width / 2 + 6, 275);
    ctx.lineTo(width / 2, 280);
    ctx.lineTo(width / 2 - 6, 275);
    ctx.closePath();
    ctx.fill();

    // 5. Receipt Details Card Box
    const cardX = 75;
    const cardY = 305;
    const cardW = width - 150;
    const cardH = 680;

    // Card background
    ctx.fillStyle = 'rgba(12, 27, 68, 0.75)';
    ctx.strokeStyle = 'rgba(229, 179, 30, 0.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.fill();
    ctx.stroke();

    // Format date: e.g. 03 September 2026
    const dateObj = new Date(data.createdAt);
    const formattedDate = dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // Details Grid items
    const startY = cardY + 60;
    const rowGap = 62;
    const leftLabelX = cardX + 50;
    const rightValueX = cardX + cardW - 50;

    const details = [
      { label: 'Receipt No:', value: data.receiptNumber, highlight: true },
      { label: 'Date:', value: formattedDate },
      { label: 'Name:', value: data.fullName },
      { label: 'Mobile:', value: data.mobileNumber },
      { label: 'Amount:', value: `₹${Number(data.amount).toLocaleString('en-IN')}`, isAmount: true },
      { label: 'Payment Method:', value: 'UPI' },
      { label: 'UTR / Txn ID:', value: data.utr },
    ];

    details.forEach((item, index) => {
      const currentY = startY + index * rowGap;

      // Label
      ctx.textAlign = 'left';
      ctx.font = '500 20px sans-serif';
      ctx.fillStyle = '#cbd5e1'; // light slate
      ctx.fillText(item.label, leftLabelX, currentY);

      // Value
      ctx.textAlign = 'right';
      if (item.isAmount) {
        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = '#ffd700'; // shiny gold
        ctx.fillText(item.value, rightValueX, currentY);
      } else if (item.highlight) {
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(item.value, rightValueX, currentY);
      } else {
        ctx.font = '600 21px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.value, rightValueX, currentY);
      }

      // Thin separator except after last row
      if (index < details.length - 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftLabelX, currentY + 22);
        ctx.lineTo(rightValueX, currentY + 22);
        ctx.stroke();
      }
    });

    // 6. Status Seal / Stamp inside details box
    const isVerified = data.paymentStatus === 'VERIFIED';
    const statusY = startY + details.length * rowGap + 5;
    const stampW = cardW - 100;
    const stampH = 58;
    const stampX = cardX + 50;

    if (isVerified) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.strokeStyle = '#10b981';
    } else {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.strokeStyle = '#f59e0b';
    }
    ctx.lineWidth = 2;
    roundRect(ctx, stampX, statusY, stampW, stampH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 18px sans-serif';
    if (isVerified) {
      ctx.fillStyle = '#34d399';
      ctx.fillText('✓ STATUS: PAYMENT VERIFIED', width / 2, statusY + 36);
    } else {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('⏳ STATUS: PAYMENT RECEIVED (PENDING VERIFICATION)', width / 2, statusY + 36);
    }

    // 7. Bottom Devotional Section
    ctx.textAlign = 'center';
    
    ctx.font = 'italic 24px serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('🙏 Thank you for your contribution 🙏', width / 2, 1050);

    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('Ganpati Bappa Morya!', width / 2, 1105);

    // Association address & contact
    ctx.font = '400 16px sans-serif';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
    ctx.fillText(FESTIVAL_CONFIG.associationAddress, width / 2, 1160);

    ctx.font = '500 16px sans-serif';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText(`Contact: ${FESTIVAL_CONFIG.contactNumber}  |  WhatsApp: ${FESTIVAL_CONFIG.whatsappNumber}`, width / 2, 1195);

    // Security watermark/footer note
    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillText(`DIGITAL RECEIPT ID: ${data.receiptNumber} • BALA GANESH UTSAV`, width / 2, 1270);

    // Generate output data URL
    const url = canvas.toDataURL('image/jpeg', 0.95);
    setImageUrl(url);
    setIsGenerating(false);
    if (onImageGenerated) {
      onImageGenerated(url);
    }
  }, [data, onImageGenerated]);

  useEffect(() => {
    drawReceipt();
  }, [drawReceipt]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `BalaGanesh_Chanda_Receipt_${data.receiptNumber}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden high-res canvas used for generating crisp JPG */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Rendered receipt image preview */}
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-2 border-devotional-gold-500/50 bg-[#07112c] transition-all">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`Chanda Receipt ${data.receiptNumber}`}
            className="w-full h-auto object-contain block"
          />
        ) : (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-devotional-gold-300">
            <div className="w-8 h-8 border-2 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Generating official receipt image...</p>
          </div>
        )}
      </div>

      {/* Action Buttons: Download & WhatsApp */}
      <div className="w-full max-w-md mt-5 space-y-3">
        <button
          onClick={handleDownload}
          disabled={!imageUrl}
          className="w-full py-3.5 px-4 rounded-xl btn-gold text-devotional-blue-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99] disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          <span>Download Receipt (JPG)</span>
        </button>
      </div>
    </div>
  );
}

// Helper to draw rounded rectangle on canvas
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
