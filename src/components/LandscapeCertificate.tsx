'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  FESTIVAL_CONFIG,
  buildWhatsAppCertificateShareUrl,
  buildWhatsAppCertificateMessage,
} from '@/config/festival.config';
import { Download, MessageCircle, Camera } from 'lucide-react';
import ImageLightboxModal from './ImageLightboxModal';

export interface CertificateData {
  certificateNumber: string;
  fullName: string;
  mobileNumber?: string | null;
  amount: number;
  paymentMethod: string; // CASH or ONLINE
  paymentStatus: string; // CASH_RECEIVED, PENDING, VERIFIED, REJECTED
  createdAt: string | Date;
  volunteerName?: string | null;
  paymentScreenshot?: string | null;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/jpeg';
  const raw = atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

interface LandscapeCertificateProps {
  data: CertificateData;
  onImageReady?: (dataUrl: string, blob?: Blob) => void;
  hideActions?: boolean;
}

export default function LandscapeCertificate({
  data,
  onImageReady,
  hideActions = false,
}: LandscapeCertificateProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);

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

    // Load authentic landscape pandal image for background watermark
    const bgImage = new Image();
    bgImage.src = FESTIVAL_CONFIG.pandalLandscapeImage;
    bgImage.crossOrigin = 'anonymous';

    // Load official red Bala Ganesh stamp/seal provided for project
    const stampImage = new Image();
    stampImage.src = FESTIVAL_CONFIG.officialStampRedImage || '/images/bala-ganesh-stamp-red.png';
    stampImage.crossOrigin = 'anonymous';

    const renderLayers = (imgLoaded: boolean, stampLoaded: boolean) => {
      // 1. BASE BACKGROUND: Pure Luxury Ivory / White Paper Stock
      const paperGradient = ctx.createLinearGradient(0, 0, width, height);
      paperGradient.addColorStop(0, '#ffffff');
      paperGradient.addColorStop(0.5, '#fafaf7');
      paperGradient.addColorStop(1, '#f6f5ef');
      ctx.fillStyle = paperGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. SUBTLE WATERMARK: Pandal & Deity Watermark (7% Opacity on White Paper)
      if (imgLoaded) {
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.drawImage(bgImage, 0, 0, width, height);
        ctx.restore();
      }

      // 3. ELEGANT GOLD & ROYAL BLUE DUAL BORDERS
      // Outer Deep Royal Blue Thick Border
      ctx.strokeStyle = '#0c1e54';
      ctx.lineWidth = 14;
      ctx.strokeRect(32, 32, width - 64, height - 64);

      // Middle Burnished Metallic Gold Border
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 4;
      ctx.strokeRect(50, 50, width - 100, height - 100);

      // Inner Royal Blue Hairline Border
      ctx.strokeStyle = 'rgba(12, 30, 84, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(60, 60, width - 120, height - 120);

      // 4. CORNER ROSETTES & ORNAMENTS (Metallic Gold with Royal Blue Center)
      const cornerInsets = [
        [50, 50],
        [width - 50, 50],
        [50, height - 50],
        [width - 50, height - 50],
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

      // 5. SACRED INVOCATION
      ctx.textAlign = 'center';

      // Sacred Om
      ctx.font = 'bold 36px Georgia, serif';
      ctx.fillStyle = '#b8860b';
      ctx.fillText('ॐ', width / 2, 105);

      // Sanskrit Header
      ctx.font = 'bold 18px Georgia, serif';
      ctx.fillStyle = '#b8860b';
      ctx.letterSpacing = '3px';
      ctx.fillText('॥ श्री गणेशाय नमः ॥', width / 2, 136);

      // 6. ASSOCIATION NAME (Deep Royal Blue Display)
      ctx.font = 'bold 46px sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.letterSpacing = '4px';
      ctx.fillText(FESTIVAL_CONFIG.associationName.toUpperCase(), width / 2, 192);

      // Subtitle
      ctx.font = 'bold 19px sans-serif';
      ctx.fillStyle = '#b8860b';
      ctx.letterSpacing = '2.5px';
      ctx.fillText(`GANESH FESTIVAL ${FESTIVAL_CONFIG.festivalYear} • ANNUAL UTSAV`, width / 2, 226);

      // 7. TITLE RIBBON: CERTIFICATE OF APPRECIATION (Royal Blue Badge with Gold Border)
      const ribbonW = 680;
      const ribbonH = 48;
      const ribbonX = (width - ribbonW) / 2;
      const ribbonY = 252;

      // Royal Blue Ribbon Fill
      const ribbonGrad = ctx.createLinearGradient(ribbonX, ribbonY, ribbonX + ribbonW, ribbonY + ribbonH);
      ribbonGrad.addColorStop(0, '#0c1e54');
      ribbonGrad.addColorStop(0.5, '#16358c');
      ribbonGrad.addColorStop(1, '#0c1e54');
      ctx.fillStyle = ribbonGrad;
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 2.5;
      roundRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, 24);
      ctx.fill();
      ctx.stroke();

      // Crisp White Lettering on Royal Blue Ribbon
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.letterSpacing = '3.5px';
      ctx.fillText('CERTIFICATE OF APPRECIATION', width / 2, ribbonY + 32);

      // 8. PRESENTATION INTRO
      ctx.font = 'italic 23px Georgia, serif';
      ctx.fillStyle = '#475569';
      ctx.letterSpacing = '0px';
      ctx.fillText('This certificate is proudly presented to', width / 2, 350);

      // 9. RECIPIENT FULL NAME (Hero in Deep Royal Blue with Gold Accents)
      ctx.font = 'bold 64px Georgia, serif';
      ctx.fillStyle = '#0c1e54';
      ctx.letterSpacing = '1.5px';
      ctx.fillText(data.fullName.toUpperCase(), width / 2, 428);

      // Ornate Gold Underline with Center Diamond
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 340, 448);
      ctx.lineTo(width / 2 + 340, 448);
      ctx.stroke();

      // Diamond ornament in center of underline
      ctx.fillStyle = '#0c1e54';
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2, 440);
      ctx.lineTo(width / 2 + 8, 448);
      ctx.lineTo(width / 2, 456);
      ctx.lineTo(width / 2 - 8, 448);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 10. PURPOSE LINE
      ctx.font = 'italic 22px Georgia, serif';
      ctx.fillStyle = '#334155';
      ctx.fillText('In appreciation of your valuable contribution towards the Ganesh Festival Chanda.', width / 2, 510);

      // 11. DETAILS GRID BOX (Crisp White Card with Royal Blue & Gold Borders)
      const boxW = 1440;
      const boxH = 135;
      const boxX = (width - boxW) / 2;
      const boxY = 574;

      ctx.save();
      ctx.shadowColor = 'rgba(12, 30, 84, 0.08)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, boxX, boxY, boxW, boxH, 18);
      ctx.fill();
      ctx.restore();

      // Gold Outer Border for the Details Box
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 2;
      roundRect(ctx, boxX, boxY, boxW, boxH, 18);
      ctx.stroke();

      const dateObj = new Date(data.createdAt);
      const formattedDate = dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const colW = boxW / 4;
      const colY1 = boxY + 44;
      const colY2 = boxY + 96;

      // Col 1: Contribution Amount
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.letterSpacing = '1px';
      ctx.fillText('CONTRIBUTION', boxX + colW * 0.5, colY1);
      ctx.font = 'bold 40px sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.fillText(`₹${data.amount.toLocaleString('en-IN')}`, boxX + colW * 0.5, colY2);

      // Col 2: Payment Method
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('PAYMENT METHOD', boxX + colW * 1.5, colY1);
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.fillText(data.paymentMethod, boxX + colW * 1.5, colY2);

      // Col 3: Certificate No
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('CERTIFICATE NO', boxX + colW * 2.5, colY1);
      ctx.font = 'bold 26px monospace';
      ctx.fillStyle = '#0c1e54';
      ctx.fillText(data.certificateNumber, boxX + colW * 2.5, colY2);

      // Col 4: Date
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('DATE', boxX + colW * 3.5, colY1);
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.fillText(formattedDate, boxX + colW * 3.5, colY2);

      // Gold Hairline Column Dividers
      ctx.strokeStyle = 'rgba(198, 146, 20, 0.35)';
      ctx.lineWidth = 1;
      [1, 2, 3].forEach((i) => {
        ctx.beginPath();
        ctx.moveTo(boxX + colW * i, boxY + 22);
        ctx.lineTo(boxX + colW * i, boxY + boxH - 22);
        ctx.stroke();
      });

      // 12. DEVOTIONAL BLESSING QUOTE
      ctx.font = 'italic 23px Georgia, serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(
        '"May Lord Ganesha shower divine blessings of health, happiness, and prosperity upon your family."',
        width / 2,
        760
      );

      // 13. OFFICIAL FOOTER
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#b8860b';
      ctx.letterSpacing = '3px';
      ctx.fillText('WITH GRATITUDE', width / 2, 830);

      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.letterSpacing = '2px';
      ctx.fillText(FESTIVAL_CONFIG.associationName.toUpperCase(), width / 2, 874);

      ctx.font = 'bold 17px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.letterSpacing = '1px';
      ctx.fillText(FESTIVAL_CONFIG.associationAddress, width / 2, 908);

      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#b8860b';
      ctx.letterSpacing = '1.5px';
      ctx.fillText('Ganpati Bappa Morya! 🙏', width / 2, 952);

      // 14. OFFICIAL RED SEAL PROVIDED FOR PROJECT (RIGHT BOTTOM)
      if (stampLoaded && stampImage.width > 0) {
        ctx.save();
        const redSealW = 220;
        const redSealH = 145;
        const redSealX = width - 360;
        const redSealY = 820;
        ctx.drawImage(stampImage, redSealX, redSealY, redSealW, redSealH);
        ctx.restore();
      }

      // 15. FOOTNOTE FINE PRINT
      ctx.font = '13px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(
        `OFFICIAL DIGITAL CERTIFICATE • CERT NO: ${data.certificateNumber} • ${FESTIVAL_CONFIG.associationAddress}`,
        width / 2,
        1025
      );

      // Export high-resolution JPG
      const url = canvas.toDataURL('image/jpeg', 0.96);
      setImageUrl(url);
      setIsGenerating(false);

      try {
        canvas.toBlob((blob) => {
          if (onImageReady) {
            onImageReady(url, blob || dataUrlToBlob(url));
          }
        }, 'image/jpeg', 0.96);
      } catch {
        if (onImageReady) {
          onImageReady(url, dataUrlToBlob(url));
        }
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

    if (bgDone || stampDone) {
      tryRender();
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
    const rawNumber = data.mobileNumber ? data.mobileNumber.replace(/[^0-9]/g, '') : '';
    const formattedPhone = rawNumber ? (rawNumber.startsWith('91') ? rawNumber : `91${rawNumber}`) : '';
    const phoneParam = formattedPhone ? `phone=${formattedPhone}&` : '';

    const message = buildWhatsAppCertificateMessage(data);
    const whatsAppChatUrl = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(message)}`;

    // Try clipboard copy so message + group link is ready
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(message);
      } catch {}
    }

    if (imageUrl) {
      try {
        const blob = dataUrlToBlob(imageUrl);
        const file = new File(
          [blob],
          `BalaGanesh_Certificate_${data.certificateNumber}.jpg`,
          { type: 'image/jpeg' }
        );

        if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          if (navigator.canShare({ files: [file], text: message })) {
            await navigator.share({
              files: [file],
              text: message,
              title: `${FESTIVAL_CONFIG.associationName} Certificate`,
            });
          } else {
            await navigator.share({
              files: [file],
              title: `${FESTIVAL_CONFIG.associationName} Certificate`,
            });
          }
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
        console.warn('Native file share failed:', err);
      }
    }

    // Fallback: auto-download JPG photo & open WhatsApp chat
    handleDownload();
    window.open(whatsAppChatUrl, '_blank');
  };

  return (
    <div className="w-full flex flex-col items-center">
      <canvas ref={canvasRef} className="hidden" />

      {/* 16:9 Landscape Certificate Container: Crisp White with Gold Frame */}
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border-2 border-devotional-gold-400 bg-white transition-all relative group">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`Certificate of Appreciation for ${data.fullName}`}
            className="w-full h-auto aspect-[16/9] object-contain block bg-white"
          />
        ) : (
          <div className="aspect-[16/9] w-full flex flex-col items-center justify-center gap-3 bg-white text-devotional-blue-950">
            <div className="w-10 h-10 border-3 border-devotional-gold-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-devotional-blue-950">Generating Official White & Gold Certificate...</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!hideActions && (
        <div className={`w-full max-w-2xl mt-5 grid grid-cols-1 ${data.paymentScreenshot ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
          <button
            onClick={handleDownload}
            disabled={!imageUrl}
            className="w-full py-3.5 px-4 rounded-xl btn-gold text-devotional-blue-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99] disabled:opacity-50"
          >
            <Download className="w-5 h-5 text-devotional-blue-950" />
            <span>Download Certificate</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99]"
          >
            <MessageCircle className="w-5 h-5" />
            <span>📲 Share on WhatsApp</span>
          </button>

          {data.paymentScreenshot && (
            <button
              onClick={() => setShowPaymentProofModal(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-devotional-blue-900 hover:bg-devotional-blue-800 border-2 border-devotional-gold-400/70 text-devotional-gold-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99]"
            >
              <Camera className="w-5 h-5 text-devotional-gold-400" />
              <span>View Payment Photo</span>
            </button>
          )}
        </div>
      )}

      {/* Payment Screenshot Lightbox Modal */}
      {data.paymentScreenshot && (
        <ImageLightboxModal
          isOpen={showPaymentProofModal}
          onClose={() => setShowPaymentProofModal(false)}
          imageUrl={data.paymentScreenshot}
          title={`Payment Photo: ${data.fullName} (₹${data.amount})`}
        />
      )}
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
