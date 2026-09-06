'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FESTIVAL_CONFIG, buildWhatsAppInvitationMessage } from '@/config/festival.config';
import { normalizeIndianMobileForWhatsApp } from '@/lib/validation';
import {
  Download,
  Share2,
  X,
  Printer,
  Copy,
  Check,
  Users,
  MessageCircle,
  ExternalLink,
  Send,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';

export interface InvitationData {
  id?: string;
  title: string;
  invitees: string;
  eventDate: string | Date;
  eventTime: string;
  venue: string;
  description?: string | null;
  contactInfo?: string | null;
  year?: number;
  createdBy?: { name: string; username?: string; role?: string };
}

interface InvitationCardModalProps {
  invitation: InvitationData;
  onClose: () => void;
}

export default function InvitationCardModal({ invitation, onClose }: InvitationCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedGroupLink, setCopiedGroupLink] = useState(false);
  const [individualMobile, setIndividualMobile] = useState('');

  const formattedDate = (() => {
    const d = new Date(invitation.eventDate);
    return isNaN(d.getTime())
      ? String(invitation.eventDate)
      : d.toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
  })();

  const drawInvitation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGenerating(true);

    // High-resolution portrait canvas (1200 x 1500)
    const width = 1200;
    const height = 1500;
    canvas.width = width;
    canvas.height = height;

    // 1. Rich Devotional Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#040b20');
    bgGrad.addColorStop(0.35, '#07153d');
    bgGrad.addColorStop(0.7, '#0b1d4d');
    bgGrad.addColorStop(1, '#050c24');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle Radial Glow behind Lord Ganesha & Header
    const radialGlow = ctx.createRadialGradient(width / 2, 280, 50, width / 2, 280, 550);
    radialGlow.addColorStop(0, 'rgba(234, 179, 8, 0.15)');
    radialGlow.addColorStop(0.6, 'rgba(217, 119, 6, 0.05)');
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // 2. Triple Sacred Golden Borders & Corner Rosettes
    // Outer Border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.strokeRect(35, 35, width - 70, height - 70);

    // Inner Delicate Gold Border
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(48, 48, width - 96, height - 96);

    // Inset Dotted Border
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(58, 58, width - 116, height - 116);
    ctx.setLineDash([]);

    // Corner Ornaments (Traditional Corner Accents)
    const corners = [
      [58, 58],
      [width - 58, 58],
      [58, height - 58],
      [width - 58, height - 58],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 3. Sacred Top Invocation
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.fillText('🕉️   శ్రీ వినాయక చవితి మహోత్సవం   🕉️', width / 2, 110);

    ctx.font = 'italic 17px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText(FESTIVAL_CONFIG.sanskritMantra, width / 2, 145);

    // Thin separator line
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(180, 165);
    ctx.lineTo(width - 180, 165);
    ctx.stroke();

    // 4. Association Name & Branding
    ctx.font = '900 48px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.letterSpacing = '2px';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;
    ctx.fillText(FESTIVAL_CONFIG.associationName, width / 2, 225);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.letterSpacing = '0px';

    ctx.font = 'bold 19px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(
      `${FESTIVAL_CONFIG.associationAddress} • Ganesh Festival ${FESTIVAL_CONFIG.festivalYear}`,
      width / 2,
      262
    );

    // 5. Decorative "CORDIAL INVITATION / ఆహ్వాన పత్రిక" Ribbon Banner
    const bannerY = 300;
    const bannerWidth = 720;
    const bannerHeight = 54;
    const bannerX = (width - bannerWidth) / 2;

    const bannerGrad = ctx.createLinearGradient(bannerX, 0, bannerX + bannerWidth, 0);
    bannerGrad.addColorStop(0, '#991b1b');
    bannerGrad.addColorStop(0.5, '#dc2626');
    bannerGrad.addColorStop(1, '#991b1b');

    ctx.fillStyle = bannerGrad;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerWidth, bannerHeight, 27);
    ctx.fill();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '1.5px';
    ctx.fillText('★ CORDIAL INVITATION / సాదర ఆహ్వానం ★', width / 2, bannerY + 36);
    ctx.letterSpacing = '0px';

    // 6. Invitee Name Card (Respectful Dedication)
    const inviteBoxY = 385;
    const inviteBoxWidth = 920;
    const inviteBoxHeight = 120;
    const inviteBoxX = (width - inviteBoxWidth) / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.roundRect(inviteBoxX, inviteBoxY, inviteBoxWidth, inviteBoxHeight, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'normal 17px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('గౌరవనీయులైన / Cordially Inviting:', width / 2, inviteBoxY + 36);

    ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#fef08a';
    // Truncate invitees if extremely long
    let displayInvitees = invitation.invitees;
    if (displayInvitees.length > 55) {
      displayInvitees = displayInvitees.substring(0, 52) + '...';
    }
    ctx.fillText(displayInvitees, width / 2, inviteBoxY + 84);

    // 7. Invitation Lead-in Text
    const leadY = 540;
    ctx.font = '500 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(
      'We cordially invite you with your family and friends to participate in the sacred celebrations of:',
      width / 2,
      leadY
    );

    // 8. Event Title Box (Luminous & Golden)
    const eventBoxY = 575;
    const eventBoxWidth = 960;
    const eventBoxHeight = 90;
    const eventBoxX = (width - eventBoxWidth) / 2;

    const eventGrad = ctx.createLinearGradient(eventBoxX, 0, eventBoxX + eventBoxWidth, 0);
    eventGrad.addColorStop(0, 'rgba(234, 179, 8, 0.15)');
    eventGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.35)');
    eventGrad.addColorStop(1, 'rgba(234, 179, 8, 0.15)');

    ctx.fillStyle = eventGrad;
    ctx.beginPath();
    ctx.roundRect(eventBoxX, eventBoxY, eventBoxWidth, eventBoxHeight, 20);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '900 38px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 10;
    ctx.fillText(`🪔  ${invitation.title.toUpperCase()}  🪔`, width / 2, eventBoxY + 58);
    ctx.shadowBlur = 0;

    // 9. Auspicious Details Box (Date, Time, Venue)
    const detailsY = 695;
    const detailsWidth = 960;
    const detailsHeight = 220;
    const detailsX = (width - detailsWidth) / 2;

    ctx.fillStyle = 'rgba(10, 25, 65, 0.7)';
    ctx.beginPath();
    ctx.roundRect(detailsX, detailsY, detailsWidth, detailsHeight, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3 Items Grid inside Details Box
    // Date
    ctx.textAlign = 'left';
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.fillText('📅  తేదీ / DATE:', detailsX + 45, detailsY + 55);

    ctx.font = '600 22px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(formattedDate, detailsX + 260, detailsY + 55);

    // Time
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.fillText('⏰  సమయం / TIME:', detailsX + 45, detailsY + 115);

    ctx.font = '600 22px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(invitation.eventTime, detailsX + 260, detailsY + 115);

    // Venue
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.fillText('📍  వేదిక / VENUE:', detailsX + 45, detailsY + 175);

    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    let displayVenue = invitation.venue;
    if (displayVenue.length > 48) {
      displayVenue = displayVenue.substring(0, 45) + '...';
    }
    ctx.fillText(displayVenue, detailsX + 260, detailsY + 175);

    // 10. Program Highlights / Schedule Details (if provided)
    ctx.textAlign = 'center';
    let currentY = 950;

    if (invitation.description && invitation.description.trim().length > 0) {
      ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.fillText('✨  కార్యక్రమ వివరాలు / PROGRAM HIGHLIGHTS  ✨', width / 2, currentY);

      currentY += 35;
      ctx.font = 'normal 19px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#e2e8f0';

      // Word wrapping for description
      const words = invitation.description.trim().split(' ');
      let line = '';
      const maxWidth = 900;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, width / 2, currentY);
          line = words[n] + ' ';
          currentY += 28;
          if (currentY > 1150) break; // prevent overflowing
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, width / 2, currentY);
      currentY += 45;
    } else {
      currentY += 40;
    }

    // 11. Divine Blessings Invocation
    ctx.font = 'italic bold 21px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(
      '🙏 "మీ రాకయే మాకు శుభప్రదం • All are cordially invited to receive Lord Ganesha blessings" 🙏',
      width / 2,
      Math.max(currentY, 1160)
    );

    // 12. Bottom Divider
    const divY = 1220;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, divY);
    ctx.lineTo(width - 100, divY);
    ctx.stroke();

    // 13. Association Sign-off & Contact
    const footY = 1265;
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText('BALA GANESH ASSOCIATION COMMITTEE', width / 2, footY);

    ctx.font = 'normal 18px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(
      'Bhavani Nagar, Shankarpally, Telangana • Youth Members & Volunteers',
      width / 2,
      footY + 32
    );

    const contactText = invitation.contactInfo?.trim()
      ? `Contact: ${invitation.contactInfo.trim()} • Official Group: ${FESTIVAL_CONFIG.contactNumber}`
      : `Official Contact: ${FESTIVAL_CONFIG.contactNumber}`;

    ctx.font = '600 18px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(contactText, width / 2, footY + 64);

    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('🙏  GANPATI BAPPA MORYA!  🙏', width / 2, footY + 115);

    // Export to Data URL
    try {
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
    } catch (err) {
      console.error('Failed to export canvas:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [invitation, formattedDate]);

  useEffect(() => {
    drawInvitation();
  }, [drawInvitation]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    const safeTitle = invitation.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `Bala_Ganesh_Invitation_${safeTitle}.png`;
    link.href = imageUrl;
    link.click();
  };

  const handleCopyMessage = async () => {
    const message = buildWhatsAppInvitationMessage(invitation);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 3000);
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleCopyGroupLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(FESTIVAL_CONFIG.whatsappGroupLink);
        setCopiedGroupLink(true);
        setTimeout(() => setCopiedGroupLink(false), 3000);
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  // One-click send to Bala Ganesh WhatsApp group
  const handleSendToWhatsAppGroup = () => {
    const message = buildWhatsAppInvitationMessage(invitation);

    // Also auto-copy to clipboard as convenience guarantee
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        navigator.clipboard.writeText(message);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 3000);
      } catch {}
    }

    // Opens WhatsApp without phone number -> prompts to choose Bala Ganesh group directly!
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Direct send to an individual devotee's mobile number
  const handleSendToIndividual = () => {
    if (!individualMobile.trim()) return;
    const normalized = normalizeIndianMobileForWhatsApp(individualMobile);
    const phoneParam = normalized ? `phone=${normalized.whatsappPhone}&` : '';
    const message = buildWhatsAppInvitationMessage(invitation);
    const url = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    if (!imageUrl) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Invitation - ${invitation.title}</title>
            <style>
              @page { size: portrait; margin: 0; }
              body { margin: 0; display: flex; align-items: center; justify-content: center; background: #000; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-3xl bg-[#071338] border-2 border-devotional-gold-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 my-auto text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-devotional-gold-400 flex items-center justify-center text-devotional-blue-950 font-black shadow-md">
              <MessageCircle className="w-5 h-5 text-devotional-blue-950" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-devotional-gold-300 flex items-center gap-2">
                <span>Festival Invitation Card</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-devotional-gold-500/20 border border-devotional-gold-400 text-devotional-gold-300 font-bold">
                  Bala Ganesh Group
                </span>
              </h3>
              <p className="text-xs text-gray-300">
                {invitation.title} • {formattedDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Rendered Visual Card Preview Container */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-devotional-gold-500/30 bg-[#040b20] max-h-[58vh] overflow-y-auto">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Invitation - ${invitation.title}`}
              className="w-full h-auto object-contain block mx-auto max-w-xl"
            />
          ) : (
            <div className="aspect-[3/4] w-full flex flex-col items-center justify-center gap-3 bg-[#0a1845] text-devotional-gold-300 py-20">
              <div className="w-10 h-10 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold">Rendering Devotional Invitation Card...</p>
            </div>
          )}
        </div>

        {/* Primary Action Buttons Bar */}
        <div className="space-y-3 pt-1">
          {/* Main WhatsApp Group Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Direct Send to Bala Ganesh WhatsApp Group */}
            <button
              type="button"
              onClick={handleSendToWhatsAppGroup}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4 text-white" />
              <span>Send to Bala Ganesh WhatsApp Group</span>
            </button>

            {/* Jump into WhatsApp Group */}
            <a
              href={FESTIVAL_CONFIG.whatsappGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-devotional-blue-900 hover:bg-devotional-blue-800 border-2 border-emerald-500/50 text-emerald-300 hover:text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Open Bala Ganesh WhatsApp Group</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Secondary Action Toolbar: Download, Copy, Print */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-devotional-gold-500/20 pt-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!imageUrl}
                className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-devotional-gold-500 text-devotional-blue-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4 text-devotional-blue-950" />
                <span>Download Card (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="py-2.5 px-3.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/40 text-devotional-gold-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                {copiedText ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-black">Copied Message!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-devotional-gold-400" />
                    <span>Copy WhatsApp Text</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="py-2.5 px-3.5 rounded-xl bg-devotional-blue-900/90 border border-devotional-gold-500/40 text-devotional-gold-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Printer className="w-4 h-4 text-devotional-gold-400" />
                <span>Print</span>
              </button>
            </div>

            {/* Send to individual number (optional) */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto mt-1 sm:mt-0">
              <input
                type="tel"
                placeholder="Mobile (optional direct invite)"
                value={individualMobile}
                onChange={(e) => setIndividualMobile(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 text-xs bg-devotional-blue-950 border border-devotional-gold-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleSendToIndividual}
                disabled={!individualMobile.trim()}
                className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold shrink-0 transition-colors"
                title="Send personal invite to this mobile"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
