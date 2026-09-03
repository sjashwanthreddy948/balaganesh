'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FESTIVAL_CONFIG, buildWhatsAppCertificateShareUrl } from '@/config/festival.config';
import { Download, MessageCircle, Share2, Sparkles, CheckCircle2 } from 'lucide-react';

export interface CertificateData {
  certificateNumber: string;
  fullName: string;
  mobileNumber?: string | null;
  amount: number;
  paymentMethod: string; // CASH or ONLINE
  paymentStatus: string; // CASH_RECEIVED, PENDING, VERIFIED, REJECTED
  createdAt: string | Date;
  volunteerName?: string | null;
}

interface LandscapeCertificateProps {
  data: CertificateData;
  onImageReady?: (dataUrl: string) => void;
}

export default function LandscapeCertificate({ data, onImageReady }: LandscapeCertificateProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const drawCertificate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High resolution 16:9 landscape canvas (1920 × 1080)
    const width = 1920;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    // Load authentic landscape pandal image
    const bgImage = new Image();
    bgImage.src = FESTIVAL_CONFIG.pandalLandscapeImage;
    bgImage.crossOrigin = 'anonymous';

    const renderLayers = (imgLoaded: boolean) => {
      // 1. Draw Authentic Pandal Background with 50% transparency wash
      if (imgLoaded) {
        ctx.drawImage(bgImage, 0, 0, width, height);

        // 50% Translucent Royal Blue Wash Overlay
        const washGradient = ctx.createLinearGradient(0, 0, 0, height);
        washGradient.addColorStop(0, 'rgba(5, 11, 29, 0.50)');
        washGradient.addColorStop(0.5, 'rgba(7, 18, 48, 0.48)');
        washGradient.addColorStop(1, 'rgba(4, 9, 24, 0.55)');
        ctx.fillStyle = washGradient;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Fallback rich gradient if image is still loading
        const bgGradient = ctx.createRadialGradient(
          width / 2,
          height / 2,
          100,
          width / 2,
          height / 2,
          width / 1.2
        );
        bgGradient.addColorStop(0, '#102359');
        bgGradient.addColorStop(0.5, '#0c1a45');
        bgGradient.addColorStop(1, '#050b1d');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Subtle golden starlight aura centered from top chandelier
      const chandelierGlow = ctx.createRadialGradient(width / 2, 80, 20, width / 2, 80, 650);
      chandelierGlow.addColorStop(0, 'rgba(255, 215, 0, 0.18)');
      chandelierGlow.addColorStop(0.5, 'rgba(243, 202, 62, 0.08)');
      chandelierGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = chandelierGlow;
      ctx.fillRect(0, 0, width, height);

      // 3. Ornate Double Gold Borders with Corner Flourishes
      // Outer Solid Gold Border
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 6;
      ctx.strokeRect(36, 36, width - 72, height - 72);

      // Inner Filigree Border
      ctx.strokeStyle = 'rgba(243, 202, 62, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 48, width - 96, height - 96);

      // Corner Corner Rosettes / Jewels
      const corners = [
        [36, 36],
        [width - 36, 36],
        [36, height - 36],
        [width - 36, height - 36],
      ];
      corners.forEach(([cx, cy]) => {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e5b31e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 4. Sacred Header & Invocations
      ctx.textAlign = 'center';

      // Om symbol
      ctx.font = 'bold 36px Georgia, serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('ॐ', width / 2, 105);

      // Association Name
      ctx.font = 'bold 44px sans-serif';
      ctx.fillStyle = '#fff7c2';
      ctx.letterSpacing = '3px';
      ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
      ctx.shadowBlur = 10;
      ctx.fillText(FESTIVAL_CONFIG.associationName.toUpperCase(), width / 2, 162);
      ctx.shadowBlur = 0; // reset

      // Subtitle
      ctx.font = '600 21px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.letterSpacing = '2px';
      ctx.fillText(`GANESH FESTIVAL ${FESTIVAL_CONFIG.festivalYear}`, width / 2, 198);

      // 5. Title Ribbon: CERTIFICATE OF APPRECIATION
      const ribbonW = 660;
      const ribbonH = 46;
      const ribbonX = (width - ribbonW) / 2;
      const ribbonY = 224;

      ctx.fillStyle = 'rgba(229, 179, 30, 0.22)';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      roundRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, 23);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.letterSpacing = '3px';
      ctx.fillText('CERTIFICATE OF APPRECIATION', width / 2, ribbonY + 31);

      // 6. Presentation Line
      ctx.font = 'italic 24px Georgia, serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.letterSpacing = '0px';
      ctx.fillText('This certificate is proudly presented to', width / 2, 330);

      // 7. Recipient Full Name (Huge & Golden)
      ctx.font = 'bold 62px Georgia, serif';
      ctx.fillStyle = '#ffd700';
      ctx.letterSpacing = '1.5px';
      ctx.shadowColor = 'rgba(255, 215, 0, 0.45)';
      ctx.shadowBlur = 14;
      ctx.fillText(data.fullName.toUpperCase(), width / 2, 412);
      ctx.shadowBlur = 0;

      // Ornate Gold Underline
      ctx.strokeStyle = 'rgba(229, 179, 30, 0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 320, 432);
      ctx.lineTo(width / 2 + 320, 432);
      ctx.stroke();

      // Center diamond on underline
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(width / 2, 425);
      ctx.lineTo(width / 2 + 7, 432);
      ctx.lineTo(width / 2, 439);
      ctx.lineTo(width / 2 - 7, 432);
      ctx.closePath();
      ctx.fill();

      // 8. Purpose Line
      ctx.font = 'italic 22px Georgia, serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('in appreciation of their valuable contribution towards', width / 2, 478);

      ctx.font = 'bold 30px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.letterSpacing = '2px';
      ctx.fillText('GANESH FESTIVAL CHANDA', width / 2, 520);

      // 9. Details Grid Box (Amount, Payment Method, Certificate #, Date)
      const boxW = 1440;
      const boxH = 135;
      const boxX = (width - boxW) / 2;
      const boxY = 566;

      ctx.fillStyle = 'rgba(6, 14, 38, 0.85)';
      ctx.strokeStyle = 'rgba(229, 179, 30, 0.5)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, boxX, boxY, boxW, boxH, 16);
      ctx.fill();
      ctx.stroke();

      const dateObj = new Date(data.createdAt);
      const formattedDate = dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const colW = boxW / 4;
      const colY1 = boxY + 44;
      const colY2 = boxY + 95;

      // Col 1: Contribution
      ctx.textAlign = 'center';
      ctx.font = '600 16px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('CONTRIBUTION', boxX + colW * 0.5, colY1);
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`₹${data.amount.toLocaleString('en-IN')}`, boxX + colW * 0.5, colY2);

      // Col 2: Payment Method
      ctx.font = '600 16px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('PAYMENT METHOD', boxX + colW * 1.5, colY1);
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(data.paymentMethod, boxX + colW * 1.5, colY2);

      // Col 3: Certificate No
      ctx.font = '600 16px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('CERTIFICATE NO', boxX + colW * 2.5, colY1);
      ctx.font = 'bold 26px monospace';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(data.certificateNumber, boxX + colW * 2.5, colY2);

      // Col 4: Date
      ctx.font = '600 16px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('DATE', boxX + colW * 3.5, colY1);
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(formattedDate, boxX + colW * 3.5, colY2);

      // Column Dividers
      ctx.strokeStyle = 'rgba(229, 179, 30, 0.25)';
      ctx.lineWidth = 1;
      [1, 2, 3].forEach((i) => {
        ctx.beginPath();
        ctx.moveTo(boxX + colW * i, boxY + 20);
        ctx.lineTo(boxX + colW * i, boxY + boxH - 20);
        ctx.stroke();
      });

      // 10. Status Seal Stamp
      const isCash = data.paymentMethod === 'CASH';
      const isVerified = data.paymentStatus === 'VERIFIED' || isCash;
      const isRejected = data.paymentStatus === 'REJECTED';

      const stampW = 460;
      const stampH = 46;
      const stampX = (width - stampW) / 2;
      const stampY = 732;

      if (isVerified) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.strokeStyle = '#10b981';
      } else if (isRejected) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.strokeStyle = '#ef4444';
      } else {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.strokeStyle = '#f59e0b';
      }
      ctx.lineWidth = 1.5;
      roundRect(ctx, stampX, stampY, stampW, stampH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = 'bold 18px sans-serif';
      if (isCash) {
        ctx.fillStyle = '#34d399';
        ctx.fillText('✓ STATUS: CASH RECEIVED', width / 2, stampY + 29);
      } else if (isVerified) {
        ctx.fillStyle = '#34d399';
        ctx.fillText('✓ STATUS: PAYMENT VERIFIED', width / 2, stampY + 29);
      } else if (isRejected) {
        ctx.fillStyle = '#f87171';
        ctx.fillText('✕ STATUS: PAYMENT REJECTED', width / 2, stampY + 29);
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('⏳ STATUS: PENDING VERIFICATION', width / 2, stampY + 29);
      }

      // 11. Devotional Gratitude Quote
      ctx.font = 'italic 22px Georgia, serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText(
        '"Your valuable contribution helps us celebrate Ganesh Chaturthi and bring our community together."',
        width / 2,
        826
      );

      // 12. Signoff
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.letterSpacing = '3px';
      ctx.fillText('WITH GRATITUDE', width / 2, 892);

      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.letterSpacing = '2px';
      ctx.fillText(FESTIVAL_CONFIG.associationName.toUpperCase(), width / 2, 932);

      ctx.font = 'bold 26px sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.letterSpacing = '1px';
      ctx.fillText('Ganpati Bappa Morya! 🙏', width / 2, 976);

      // Footnote
      ctx.font = '14px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(
        `OFFICIAL DIGITAL CERTIFICATE • ${data.certificateNumber} • ${FESTIVAL_CONFIG.associationAddress}`,
        width / 2,
        1032
      );

      // Export generated high-resolution JPG
      const url = canvas.toDataURL('image/jpeg', 0.96);
      setImageUrl(url);
      setIsGenerating(false);
      if (onImageReady) {
        onImageReady(url);
      }
    };

    bgImage.onload = () => renderLayers(true);
    bgImage.onerror = () => renderLayers(false);
    // In case image is already cached
    if (bgImage.complete) {
      renderLayers(true);
    }
  }, [data, onImageReady]);

  useEffect(() => {
    drawCertificate();
  }, [drawCertificate]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `BalaGanesh_Certificate_${data.certificateNumber}_${data.fullName.replace(/\s+/g, '_')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNativeShare = async () => {
    if (!canvasRef.current) return;
    try {
      if (navigator.share && navigator.canShare) {
        canvasRef.current.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File(
            [blob],
            `Certificate_${data.certificateNumber}.jpg`,
            { type: 'image/jpeg' }
          );

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${FESTIVAL_CONFIG.associationName} - Certificate of Appreciation`,
              text: `Certificate of Appreciation for ${data.fullName} (₹${data.amount}) - Ganpati Bappa Morya!`,
              files: [file],
            });
            return;
          }
          handleWhatsAppShare();
        }, 'image/jpeg', 0.95);
      } else {
        handleWhatsAppShare();
      }
    } catch {
      handleWhatsAppShare();
    }
  };

  const handleWhatsAppShare = () => {
    const url = buildWhatsAppCertificateShareUrl({
      fullName: data.fullName,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      certificateNumber: data.certificateNumber,
      mobileNumber: data.mobileNumber,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="w-full flex flex-col items-center">
      <canvas ref={canvasRef} className="hidden" />

      {/* 16:9 Landscape Certificate Container */}
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border-2 border-devotional-gold-500/60 bg-[#050b1d] transition-all relative group">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`Certificate of Appreciation for ${data.fullName}`}
            className="w-full h-auto aspect-[16/9] object-contain block"
          />
        ) : (
          <div className="aspect-[16/9] w-full flex flex-col items-center justify-center gap-3 text-devotional-gold-300">
            <div className="w-10 h-10 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold">Generating Official Landscape Certificate...</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-2xl mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleDownload}
          disabled={!imageUrl}
          className="w-full py-3.5 px-4 rounded-xl btn-gold text-devotional-blue-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99] disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          <span>Download Certificate (JPG)</span>
        </button>

        <button
          onClick={handleNativeShare}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99]"
        >
          <MessageCircle className="w-5 h-5" />
          <span>📲 Share on WhatsApp</span>
        </button>
      </div>
    </div>
  );
}

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
