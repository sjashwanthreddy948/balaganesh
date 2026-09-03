'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FESTIVAL_CONFIG, buildWhatsAppCertificateShareUrl } from '@/config/festival.config';
import { Download, Share2, MessageCircle, Check, ShieldCheck, Clock, Award, Sparkles } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  const drawCertificate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High resolution 16:9 landscape canvas
    const width = 1920;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    // 1. Deep Royal Blue Background Gradient (Pandal Velvet Silk inspiration)
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      100,
      width / 2,
      height / 2,
      width / 1.2
    );
    bgGradient.addColorStop(0, '#102359'); // Rich royal blue center
    bgGradient.addColorStop(0.5, '#0c1a45');
    bgGradient.addColorStop(1, '#050b1d'); // Deepest midnight blue border
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle festive golden rays/starlight background glow
    const radialGlow = ctx.createRadialGradient(width / 2, 280, 20, width / 2, 280, 700);
    radialGlow.addColorStop(0, 'rgba(243, 202, 62, 0.14)');
    radialGlow.addColorStop(1, 'rgba(243, 202, 62, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Ornate Double Gold Border
    // Outer Thick Gold Border
    ctx.strokeStyle = '#e5b31e';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Inner Thin Filigree Border
    ctx.strokeStyle = 'rgba(243, 202, 62, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(54, 54, width - 108, height - 108);

    // Corner decorative rosettes
    const corners = [
      [40, 40],
      [width - 40, 40],
      [40, height - 40],
      [width - 40, height - 40],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = '#f3ca3e';
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();

      // Small surrounding diamond
      ctx.strokeStyle = '#e5b31e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 4. Sacred Header
    ctx.textAlign = 'center';

    // Om symbol
    ctx.font = 'bold 36px serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('ॐ', width / 2, 110);

    // Association Name
    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#fef08a'; // Bright gold
    ctx.letterSpacing = '3px';
    ctx.fillText(FESTIVAL_CONFIG.associationName.toUpperCase(), width / 2, 168);

    // Subtitle
    ctx.font = '600 22px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.letterSpacing = '2px';
    ctx.fillText(`GANESH FESTIVAL ${FESTIVAL_CONFIG.festivalYear}`, width / 2, 204);

    // 5. Title Ribbon: CERTIFICATE OF APPRECIATION
    const ribbonW = 680;
    const ribbonH = 46;
    const ribbonX = (width - ribbonW) / 2;
    const ribbonY = 228;

    ctx.fillStyle = 'rgba(229, 179, 30, 0.18)';
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
    ctx.fillText('This certificate is proudly presented to', width / 2, 335);

    // 7. Donor Full Name (Largest & Most Prominent Feature)
    ctx.font = 'bold 62px Georgia, serif';
    ctx.fillStyle = '#ffd700';
    ctx.letterSpacing = '1px';
    ctx.fillText(data.fullName.toUpperCase(), width / 2, 415);

    // Elegant gold underline below recipient name
    ctx.strokeStyle = 'rgba(229, 179, 30, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 320, 435);
    ctx.lineTo(width / 2 + 320, 435);
    ctx.stroke();

    // Center jewel diamond on underline
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(width / 2, 428);
    ctx.lineTo(width / 2 + 7, 435);
    ctx.lineTo(width / 2, 442);
    ctx.lineTo(width / 2 - 7, 435);
    ctx.closePath();
    ctx.fill();

    // 8. Purpose Subtext
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('in appreciation of their valuable contribution towards', width / 2, 480);

    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '2px';
    ctx.fillText('GANESH FESTIVAL CHANDA', width / 2, 524);

    // 9. Details Grid Box (Amount, Payment Method, Certificate #, Date)
    const boxW = 1440;
    const boxH = 135;
    const boxX = (width - boxW) / 2;
    const boxY = 570;

    // Details box background
    ctx.fillStyle = 'rgba(12, 27, 68, 0.7)';
    ctx.strokeStyle = 'rgba(229, 179, 30, 0.4)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.stroke();

    // Format Date: e.g. 03 September 2026
    const dateObj = new Date(data.createdAt);
    const formattedDate = dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // 4 Column Grid inside Details Box
    const colW = boxW / 4;
    const colY1 = boxY + 44;
    const colY2 = boxY + 95;

    // Col 1: Contribution Amount
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

    // Col 3: Certificate Number
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

    // Dividers between columns
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
    const isVerified = data.paymentStatus === 'VERIFIED' || data.paymentStatus === 'CASH_RECEIVED';
    const isRejected = data.paymentStatus === 'REJECTED';

    const stampW = 460;
    const stampH = 46;
    const stampX = (width - stampW) / 2;
    const stampY = 735;

    if (isVerified) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.strokeStyle = '#10b981';
    } else if (isRejected) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.strokeStyle = '#ef4444';
    } else {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
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

    // 11. Devotional Gratitude Message
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText(
      '"Your valuable contribution helps us celebrate Ganesh Chaturthi and bring our community together."',
      width / 2,
      830
    );

    // 12. Bottom Signature & Association Signoff
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.letterSpacing = '3px';
    ctx.fillText('WITH GRATITUDE', width / 2, 895);

    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.letterSpacing = '2px';
    ctx.fillText(FESTIVAL_CONFIG.associationName.toUpperCase(), width / 2, 935);

    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.letterSpacing = '1px';
    ctx.fillText('Ganpati Bappa Morya! 🙏', width / 2, 980);

    // Subtle digital verification footnote
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillText(
      `OFFICIAL DIGITAL CERTIFICATE • ${data.certificateNumber} • ${FESTIVAL_CONFIG.associationAddress}`,
      width / 2,
      1035
    );

    // Export generated high-resolution JPG
    const url = canvas.toDataURL('image/jpeg', 0.96);
    setImageUrl(url);
    setIsGenerating(false);
    if (onImageReady) {
      onImageReady(url);
    }
  }, [data, onImageReady]);

  useEffect(() => {
    drawCertificate();
  }, [drawCertificate]);

  // Download Handler
  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `BalaGanesh_Certificate_${data.certificateNumber}_${data.fullName.replace(/\s+/g, '_')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Native Web Share API (Works directly on Android/iOS to share file to WhatsApp)
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
          // Fallback to URL
          handleWhatsAppShare();
        }, 'image/jpeg', 0.95);
      } else {
        handleWhatsAppShare();
      }
    } catch (err) {
      console.log('Share dismissed or failed:', err);
      handleWhatsAppShare();
    }
  };

  // WhatsApp Share URL Fallback
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
      {/* Hidden 1920x1080 canvas used for rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 16:9 Landscape Certificate Container */}
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border-2 border-devotional-gold-500/50 bg-[#07112c] transition-all">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`Certificate of Appreciation for ${data.fullName}`}
            className="w-full h-auto aspect-[16/9] object-contain block bg-[#07112c]"
          />
        ) : (
          <div className="aspect-[16/9] w-full flex flex-col items-center justify-center gap-3 text-devotional-gold-300">
            <div className="w-10 h-10 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold">Generating Official Landscape Certificate...</p>
          </div>
        )}
      </div>

      {/* Action Buttons: Download, Share, WhatsApp */}
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

// Rounded rectangle canvas helper
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
