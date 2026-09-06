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

    // Load authentic stamp image if available
    const stampImage = new Image();
    stampImage.src = FESTIVAL_CONFIG.officialStampRedImage || '/images/bala-ganesh-stamp-red.png';
    stampImage.crossOrigin = 'anonymous';

    const renderLayers = (stampLoaded: boolean) => {
      // 1. BASE: Royal Parchment Ivory Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(0.5, '#fcfaf4');
      bgGrad.addColorStop(1, '#f7f2e5');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. ORNATE DEVOTIONAL BORDERS
      // Outer Gold Frame
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 14;
      ctx.strokeRect(36, 36, width - 72, height - 72);

      // Thin Inner Border
      ctx.strokeStyle = '#8b6508';
      ctx.lineWidth = 3;
      ctx.strokeRect(54, 54, width - 108, height - 108);

      // Corner Accents
      const drawCorner = (x: number, y: number, rot: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(0, 0, 48, 8);
        ctx.fillRect(0, 0, 8, 48);
        ctx.beginPath();
        ctx.arc(20, 20, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawCorner(70, 70, 0);
      drawCorner(width - 70, 70, Math.PI / 2);
      drawCorner(width - 70, height - 70, Math.PI);
      drawCorner(70, height - 70, -Math.PI / 2);

      // 3. WATERMARK: Ganesh Mantra Watermark in Center
      ctx.save();
      ctx.font = 'bold 240px serif';
      ctx.fillStyle = 'rgba(212, 175, 55, 0.05)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🕉️', width / 2, height / 2);
      ctx.restore();

      // 4. HEADER: Association Branding
      ctx.fillStyle = '#7a1f0a'; // Sacred Kumkum / Deep Maroon
      ctx.font = 'bold 36px "Cinzel", "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.fillText('🙏 ॐ गं गणपतये नमः • वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ 🙏', width / 2, 110);

      ctx.fillStyle = '#081735'; // Deep Midnight Blue
      ctx.font = '900 68px "Cinzel", "Arial", sans-serif';
      ctx.fillText(FESTIVAL_CONFIG.associationName, width / 2, 185);

      ctx.fillStyle = '#555555';
      ctx.font = '600 28px "Arial", sans-serif';
      ctx.fillText(FESTIVAL_CONFIG.associationAddress, width / 2, 230);

      // 5. RECEIPT BANNER
      ctx.fillStyle = '#991b1b'; // Crimson Red Pill
      ctx.beginPath();
      ctx.roundRect(width / 2 - 380, 260, 760, 56, 28);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px "Arial", sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('LADDU PAYMENT RECEIPT', width / 2, 298);

      // 6. RECEIPT META BAR (Receipt # and Date)
      ctx.fillStyle = '#444444';
      ctx.font = 'bold 26px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`RECEIPT NO: ${data.receiptNumber}`, 140, 365);

      const formattedDate = new Date(data.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      ctx.textAlign = 'right';
      ctx.font = 'bold 26px "Arial", sans-serif';
      ctx.fillText(`DATE: ${formattedDate}`, width - 140, 365);

      // Separator Line
      ctx.strokeStyle = '#e2d8b7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(140, 385);
      ctx.lineTo(width - 140, 385);
      ctx.stroke();

      // 7. MAIN PARTICULARS GRID
      // Left Box: Devotee & Laddu Info
      ctx.fillStyle = '#faf7ed';
      ctx.beginPath();
      ctx.roundRect(140, 410, 800, 360, 18);
      ctx.fill();
      ctx.strokeStyle = '#d5c79e';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#8b6508';
      ctx.font = 'bold 24px "Arial", sans-serif';
      ctx.fillText('DEVOTEE PARTICULARS', 175, 455);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 24px "Arial", sans-serif';
      ctx.fillText('Person Name:', 175, 510);
      ctx.font = '900 36px "Arial", sans-serif';
      ctx.fillStyle = '#081735';
      ctx.fillText(data.personName, 380, 510);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 24px "Arial", sans-serif';
      ctx.fillText('Mobile No:', 175, 565);
      ctx.font = 'bold 28px monospace';
      ctx.fillText(data.mobileNumber || 'Not Specified', 380, 565);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 24px "Arial", sans-serif';
      ctx.fillText('Laddu Auction Year:', 175, 620);
      ctx.font = '900 32px "Arial", sans-serif';
      ctx.fillStyle = '#b45309';
      ctx.fillText(`${data.ladduYear} Utsav`, 430, 620);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 24px "Arial", sans-serif';
      ctx.fillText('Payment Method:', 175, 675);
      ctx.font = 'bold 26px "Arial", sans-serif';
      ctx.fillStyle = data.paymentMethod === 'ONLINE' ? '#2563eb' : '#059669';
      ctx.fillText(`${data.paymentMethod}${data.utr ? ` (UTR: ${data.utr})` : ''}`, 410, 675);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 24px "Arial", sans-serif';
      ctx.fillText('Received By:', 175, 730);
      ctx.font = 'bold 26px "Arial", sans-serif';
      ctx.fillStyle = '#4b5563';
      ctx.fillText(data.volunteerName || 'Association Committee', 380, 730);

      // Right Box: Financial Breakdown
      ctx.fillStyle = '#faf7ed';
      ctx.beginPath();
      ctx.roundRect(980, 410, 800, 360, 18);
      ctx.fill();
      ctx.strokeStyle = '#d5c79e';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#8b6508';
      ctx.font = 'bold 24px "Arial", sans-serif';
      ctx.fillText('PAYMENT BREAKDOWN', 1015, 455);

      // Total Due
      ctx.fillStyle = '#4b5563';
      ctx.font = 'bold 26px "Arial", sans-serif';
      ctx.fillText('Total Laddu Due:', 1015, 510);
      ctx.textAlign = 'right';
      ctx.font = 'bold 30px "Arial", sans-serif';
      ctx.fillStyle = '#111827';
      ctx.fillText(`₹${data.totalDue.toLocaleString('en-IN')}`, 1740, 510);

      // Amount Paid This Receipt
      ctx.textAlign = 'left';
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 28px "Arial", sans-serif';
      ctx.fillText('Amount Paid Now:', 1015, 570);
      ctx.textAlign = 'right';
      ctx.font = '900 38px "Arial", sans-serif';
      ctx.fillStyle = '#047857';
      ctx.fillText(`₹${data.amountPaid.toLocaleString('en-IN')}`, 1740, 570);

      // Total Paid So Far
      ctx.textAlign = 'left';
      ctx.fillStyle = '#4b5563';
      ctx.font = 'bold 26px "Arial", sans-serif';
      ctx.fillText('Total Paid To Date:', 1015, 625);
      ctx.textAlign = 'right';
      ctx.font = 'bold 30px "Arial", sans-serif';
      ctx.fillStyle = '#111827';
      ctx.fillText(`₹${data.totalPaid.toLocaleString('en-IN')}`, 1740, 625);

      // Divider inside Right Box
      ctx.strokeStyle = '#d5c79e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(1015, 655);
      ctx.lineTo(1740, 655);
      ctx.stroke();

      // Remaining Balance
      ctx.textAlign = 'left';
      ctx.fillStyle = isFullyPaid ? '#065f46' : '#b45309';
      ctx.font = '900 30px "Arial", sans-serif';
      ctx.fillText('Remaining Balance:', 1015, 715);
      ctx.textAlign = 'right';
      ctx.font = '900 42px "Arial", sans-serif';
      ctx.fillStyle = isFullyPaid ? '#047857' : '#d97706';
      ctx.fillText(`₹${data.remainingBalance.toLocaleString('en-IN')}`, 1740, 715);

      // 8. BIG STATUS STAMP
      ctx.save();
      ctx.translate(width / 2, 855);
      if (isFullyPaid) {
        // GREEN FULLY PAID STAMP
        ctx.fillStyle = '#ecfdf5';
        ctx.beginPath();
        ctx.roundRect(-240, -42, 480, 84, 42);
        ctx.fill();
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#065f46';
        ctx.font = '900 36px "Arial", sans-serif';
        ctx.fillText('✓ FULLY PAID', 0, 12);
      } else {
        // AMBER REMAINING BALANCE STAMP
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.roundRect(-300, -42, 600, 84, 42);
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#b45309';
        ctx.font = '900 34px "Arial", sans-serif';
        ctx.fillText(`REMAINING: ₹${data.remainingBalance.toLocaleString('en-IN')}`, 0, 12);
      }
      ctx.restore();

      // 9. OFFICIAL STAMP / SEAL (Right Side)
      if (stampLoaded && stampImage.complete && stampImage.naturalWidth > 0) {
        ctx.save();
        ctx.drawImage(stampImage, width - 360, height - 240, 180, 180);
        ctx.restore();
      }

      // 10. FOOTER NOTE
      ctx.fillStyle = '#6b7280';
      ctx.font = 'italic 22px "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('This is an official computer-generated receipt issued by Bala Ganesh Association. Ganpati Bappa Morya! 🙏', width / 2, height - 70);

      // Finish Canvas Render
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

    stampImage.onload = () => renderLayers(true);
    stampImage.onerror = () => renderLayers(false);

    if (stampImage.complete) {
      renderLayers(true);
    }
  }, [data, isFullyPaid, onImageReady]);

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
