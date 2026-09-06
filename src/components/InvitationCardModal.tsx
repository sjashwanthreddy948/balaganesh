'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  FESTIVAL_CONFIG,
  buildWhatsAppInvitationMessage,
  buildWhatsAppInvitationShareUrl,
} from '@/config/festival.config';
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
  Languages,
} from 'lucide-react';

export interface InvitationData {
  id?: string;
  title: string;
  invitees: string;
  husbandName?: string | null;
  wifeName?: string | null;
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
  initialLanguage?: 'TE' | 'EN' | 'BOTH';
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export default function InvitationCardModal({
  invitation,
  onClose,
  initialLanguage = 'BOTH',
}: InvitationCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [copiedText, setCopiedText] = useState(false);
  const [individualMobile, setIndividualMobile] = useState('');
  const [language, setLanguage] = useState<'TE' | 'EN' | 'BOTH'>(initialLanguage);

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

    // High-resolution portrait canvas (1200 x 1650) with ample vertical breathing room
    const width = 1200;
    const height = 1650;
    canvas.width = width;
    canvas.height = height;

    // 1. BASE BACKGROUND: Pure Luxury Ivory / White Paper Stock (Certificate Style)
    const paperGradient = ctx.createLinearGradient(0, 0, width, height);
    paperGradient.addColorStop(0, '#ffffff');
    paperGradient.addColorStop(0.4, '#fcfbf8');
    paperGradient.addColorStop(0.8, '#f7f6ef');
    paperGradient.addColorStop(1, '#f3f1e7');
    ctx.fillStyle = paperGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. ELEGANT GOLD & ROYAL BLUE DUAL BORDERS (Exact Certificate Theme)
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
    ctx.strokeRect(62, 62, width - 124, height - 124);

    // 3. CORNER ROSETTES (Metallic Gold with Royal Blue Center Jewel)
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

    // Cursor for guaranteed sequential vertical flow (NO OVERLAPPING)
    let currentY = 110;

    // 4. SACRED INVOCATION
    ctx.textAlign = 'center';

    // Sacred Om
    ctx.font = 'bold 38px Georgia, serif';
    ctx.fillStyle = '#b8860b';
    ctx.fillText('ॐ', width / 2, currentY);
    currentY += 34;

    // Sanskrit Shloka
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillStyle = '#b8860b';
    ctx.letterSpacing = '3px';
    ctx.fillText('॥ श्री गणेशాయ नमः ॥ • ॐ गं गणपतये नमः', width / 2, currentY);
    ctx.letterSpacing = '0px';
    currentY += 45;

    // 5. ASSOCIATION NAME (Deep Royal Blue Display with Gold Accent)
    ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0c1e54';
    ctx.letterSpacing = '3px';
    ctx.fillText(FESTIVAL_CONFIG.associationName, width / 2, currentY);
    ctx.letterSpacing = '0px';
    currentY += 34;

    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#b8860b';
    ctx.letterSpacing = '2px';
    ctx.fillText(
      `${FESTIVAL_CONFIG.associationAddress.toUpperCase()} • UTSAV ${FESTIVAL_CONFIG.festivalYear}`,
      width / 2,
      currentY
    );
    ctx.letterSpacing = '0px';
    currentY += 36;

    // 6. TITLE RIBBON: ROYAL BLUE WITH METALLIC GOLD BORDER
    const ribbonW = 760;
    const ribbonH = 50;
    const ribbonX = (width - ribbonW) / 2;
    const ribbonY = currentY;

    const ribbonGrad = ctx.createLinearGradient(ribbonX, ribbonY, ribbonX + ribbonW, ribbonY + ribbonH);
    ribbonGrad.addColorStop(0, '#0c1e54');
    ribbonGrad.addColorStop(0.5, '#16358c');
    ribbonGrad.addColorStop(1, '#0c1e54');

    ctx.fillStyle = ribbonGrad;
    ctx.strokeStyle = '#c69214';
    ctx.lineWidth = 3;
    drawRoundRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, 25);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '2px';
    const ribbonText =
      language === 'TE'
        ? '★ విశేష పూజా ఆహ్వాన పత్రిక ★'
        : language === 'EN'
        ? '★ CORDIAL POOJA INVITATION ★'
        : '★ CORDIAL INVITATION / సాదర ఆహ్వానం ★';
    ctx.fillText(ribbonText, width / 2, ribbonY + 34);
    ctx.letterSpacing = '0px';
    currentY = ribbonY + ribbonH + 32;

    // 7. POOJA HOST COUPLE SECTION (If Husband / Wife Names Provided)
    const hName = invitation.husbandName?.trim();
    const wName = invitation.wifeName?.trim();
    const hasCouple = Boolean(hName || wName);

    if (hasCouple) {
      const hostBoxW = 980;
      const hostBoxH = 145;
      const hostBoxX = (width - hostBoxW) / 2;
      const hostBoxY = currentY;

      // Clean White Card with Royal Blue and Gold Border
      ctx.fillStyle = '#ffffff';
      drawRoundRect(ctx, hostBoxX, hostBoxY, hostBoxW, hostBoxH, 18);
      ctx.fill();

      // Dual Border
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Top Header inside Host Box
      ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#991b1b';
      ctx.letterSpacing = '1px';
      const hostCategory =
        language === 'TE'
          ? '🌸  నేటి విశేష పూజా దంపతులు  🌸'
          : language === 'EN'
          ? '🌸  TODAY\'S SPECIAL POOJA HOSTS  🌸'
          : '🌸  నేటి విశేష పూజా దంపతులు / TODAY\'S POOJA HOSTS  🌸';
      ctx.fillText(hostCategory, width / 2, hostBoxY + 28);
      ctx.letterSpacing = '0px';

      // Couple Names in Telugu
      if (language !== 'EN') {
        const coupleTelugu =
          hName && wName
            ? `శ్రీ మరియు శ్రీమతి ${hName} - ${wName} దంపతులు`
            : hName
            ? `శ్రీ ${hName} & కుటుంబ సభ్యులు`
            : `శ్రీమతి ${wName} & కుటుంబ సభ్యులు`;

        ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#0c1e54';
        ctx.fillText(coupleTelugu, width / 2, hostBoxY + 68);
      }

      // Couple Names in English
      if (language !== 'TE') {
        const coupleEnglish =
          hName && wName
            ? `Sri ${hName} & Smt. ${wName} (and Family)`
            : hName
            ? `Sri ${hName} & Family`
            : `Smt. ${wName} & Family`;

        ctx.font = language === 'EN' ? 'bold 28px "Segoe UI", Arial, sans-serif' : '600 20px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = language === 'EN' ? '#0c1e54' : '#b8860b';
        ctx.fillText(coupleEnglish, width / 2, language === 'EN' ? hostBoxY + 74 : hostBoxY + 98);
      }

      // Sponsoring note
      ctx.font = 'italic 15px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#475569';
      const sponsorNote =
        language === 'TE'
          ? 'వారి సౌజన్యంతో నేటి విశేష పూజ & తీర్థ ప్రసాద వితరణ కార్యక్రమం'
          : language === 'EN'
          ? 'Graciously hosting today\'s sacred pooja followed by divine Mahaprasadam'
          : 'వారి సౌజన్యంతో నేటి విశేష పూజ & ప్రసాదం • Followed by Divine Mahaprasadam';
      ctx.fillText(sponsorNote, width / 2, hostBoxY + 128);

      currentY = hostBoxY + hostBoxH + 25;
    }

    // 8. INVITEE DEDICATION CARD
    const inviteBoxW = 980;
    const inviteBoxH = 68;
    const inviteBoxX = (width - inviteBoxW) / 2;
    const inviteBoxY = currentY;

    ctx.fillStyle = '#ffffff';
    drawRoundRect(ctx, inviteBoxX, inviteBoxY, inviteBoxW, inviteBoxH, 16);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'normal 15px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    const invitePrefix =
      language === 'TE'
        ? 'ఆహ్వానితులు:'
        : language === 'EN'
        ? 'Cordially Inviting:'
        : 'ఆహ్వానితులు / Cordially Inviting:';
    ctx.fillText(invitePrefix, width / 2, inviteBoxY + 26);

    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0c1e54';
    let dispInvitees = invitation.invitees || 'All Devotees & Colony Residents';
    if (dispInvitees.length > 55) {
      dispInvitees = dispInvitees.substring(0, 52) + '...';
    }
    ctx.fillText(dispInvitees, width / 2, inviteBoxY + 54);

    currentY = inviteBoxY + inviteBoxH + 26;

    // 9. EVENT OCCASION TITLE BOX
    const eventBoxW = 980;
    const eventBoxH = 82;
    const eventBoxX = (width - eventBoxW) / 2;
    const eventBoxY = currentY;

    const eventGrad = ctx.createLinearGradient(eventBoxX, 0, eventBoxX + eventBoxW, 0);
    eventGrad.addColorStop(0, '#f8fafc');
    eventGrad.addColorStop(0.5, '#fef9c3');
    eventGrad.addColorStop(1, '#f8fafc');

    ctx.fillStyle = eventGrad;
    drawRoundRect(ctx, eventBoxX, eventBoxY, eventBoxW, eventBoxH, 18);
    ctx.fill();

    ctx.strokeStyle = '#c69214';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '900 32px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0c1e54';
    ctx.fillText(`🪔  ${invitation.title.toUpperCase()}  🪔`, width / 2, eventBoxY + 52);

    currentY = eventBoxY + eventBoxH + 26;

    // 10. AUSPICIOUS DETAILS BOX (DATE, TIME, VENUE, PRASADAM)
    const detailsBoxW = 980;
    const detailsBoxH = 240;
    const detailsBoxX = (width - detailsBoxW) / 2;
    const detailsBoxY = currentY;

    ctx.fillStyle = '#ffffff';
    drawRoundRect(ctx, detailsBoxX, detailsBoxY, detailsBoxW, detailsBoxH, 18);
    ctx.fill();

    ctx.strokeStyle = '#0c1e54';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4 Detailed Rows inside white box
    ctx.textAlign = 'left';

    // Row 1: Date
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#c69214';
    ctx.fillText(language === 'TE' ? '📅  తేదీ / DATE:' : '📅  DATE:', detailsBoxX + 45, detailsBoxY + 48);

    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(formattedDate, detailsBoxX + 260, detailsBoxY + 48);

    // Row 2: Time
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#c69214';
    ctx.fillText(language === 'TE' ? '⏰  సమయం / TIME:' : '⏰  TIME:', detailsBoxX + 45, detailsBoxY + 102);

    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(invitation.eventTime, detailsBoxX + 260, detailsBoxY + 102);

    // Row 3: Venue
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#c69214';
    ctx.fillText(language === 'TE' ? '📍  వేదిక / VENUE:' : '📍  VENUE:', detailsBoxX + 45, detailsBoxY + 156);

    ctx.font = '600 19px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0f172a';
    let dispVenue = invitation.venue;
    if (dispVenue.length > 46) {
      dispVenue = dispVenue.substring(0, 43) + '...';
    }
    ctx.fillText(dispVenue, detailsBoxX + 260, detailsBoxY + 156);

    // Row 4: Prasadam Distribution
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText(language === 'TE' ? '🍽️  తీర్థ ప్రసాదం:' : '🍽️  PRASADAM:', detailsBoxX + 45, detailsBoxY + 210);

    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#047857';
    const prasadamText =
      language === 'TE'
        ? 'పూజ అనంతరం భక్తులందరికీ అన్నప్రసాదం / తీర్థ ప్రసాద వితరణ'
        : language === 'EN'
        ? 'Followed by Divine Mahaprasadam / Annaprasadam Distribution'
        : 'పూజ అనంతరం అన్నప్రసాదం (Followed by Divine Mahaprasadam)';
    ctx.fillText(prasadamText, detailsBoxX + 260, detailsBoxY + 210);

    currentY = detailsBoxY + detailsBoxH + 28;

    // 11. PROGRAM DETAILS (WORD WRAPPED DYNAMICALLY - ZERO OVERLAP)
    ctx.textAlign = 'center';
    if (invitation.description && invitation.description.trim().length > 0) {
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#b8860b';
      ctx.fillText(
        language === 'TE'
          ? '✨  కార్యక్రమ విశేషాలు  ✨'
          : language === 'EN'
          ? '✨  PROGRAM HIGHLIGHTS  ✨'
          : '✨  కార్యక్రమ వివరాలు / PROGRAM HIGHLIGHTS  ✨',
        width / 2,
        currentY
      );
      currentY += 28;

      ctx.font = 'normal 17px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#334155';

      const words = invitation.description.trim().split(' ');
      let line = '';
      const maxWidth = 920;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, width / 2, currentY);
          line = words[n] + ' ';
          currentY += 24;
          if (currentY > 1390) break;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, width / 2, currentY);
      currentY += 32;
    } else {
      currentY += 15;
    }

    // 12. DIVINE BLESSINGS INVOCATION
    ctx.font = 'italic bold 19px Georgia, serif';
    ctx.fillStyle = '#b8860b';
    const blessingText =
      language === 'TE'
        ? '🙏 "మీ రాకయే మాకు శుభప్రదం • భక్తులందరికీ స్వామివారి కృపాకటాక్షాలు కలగాలని కోరుచున్నాము" 🙏'
        : language === 'EN'
        ? '🙏 "All are cordially invited to receive the divine blessings of Lord Ganesha" 🙏'
        : '🙏 "మీ రాకయే మాకు శుభప్రదం • May Lord Ganesha shower divine blessings upon you & your family" 🙏';
    ctx.fillText(blessingText, width / 2, Math.max(currentY, 1370));

    // 13. BOTTOM SEPARATOR LINE
    const divY = 1420;
    ctx.strokeStyle = '#c69214';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, divY);
    ctx.lineTo(width - 100, divY);
    ctx.stroke();

    // 14. FOOTER & OFFICIAL CONTACT (MINNU 9059375693)
    const footY = 1465;
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#0c1e54';
    ctx.letterSpacing = '1px';
    ctx.fillText('BALA GANESH ASSOCIATION COMMITTEE', width / 2, footY);
    ctx.letterSpacing = '0px';

    ctx.font = '600 17px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Bhavani Nagar, Shankarpally, Telangana • Youth Members & Volunteers', width / 2, footY + 30);

    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText('Official Contact: MINNU 9059375693', width / 2, footY + 62);

    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#c69214';
    ctx.fillText('🙏  GANPATI BAPPA MORYA!  🙏', width / 2, footY + 105);

    // Export to Data URL
    try {
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
    } catch (err) {
      console.error('Failed to export canvas:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [invitation, formattedDate, language]);

  useEffect(() => {
    drawInvitation();
  }, [drawInvitation]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    const safeTitle = invitation.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `Bala_Ganesh_Invitation_${safeTitle}_${language}.png`;
    link.href = imageUrl;
    link.click();
  };

  const handleCopyMessage = async () => {
    const message = buildWhatsAppInvitationMessage(invitation, language);
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

  // Send to Bala Ganesh WhatsApp group in chosen language
  const handleSendToWhatsAppGroup = () => {
    const message = buildWhatsAppInvitationMessage(invitation, language);

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        navigator.clipboard.writeText(message);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 3000);
      } catch {}
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Direct send to individual devotee's mobile
  const handleSendToIndividual = () => {
    if (!individualMobile.trim()) return;
    const normalized = normalizeIndianMobileForWhatsApp(individualMobile);
    const phoneParam = normalized ? `phone=${normalized.whatsappPhone}&` : '';
    const message = buildWhatsAppInvitationMessage(invitation, language);
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
              body { margin: 0; display: flex; align-items: center; justify-content: center; background: #fff; }
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
        {/* Modal Header with Language Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-devotional-gold-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-devotional-gold-400 flex items-center justify-center text-devotional-blue-950 font-black shadow-md shrink-0">
              <MessageCircle className="w-5 h-5 text-devotional-blue-950" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-devotional-gold-300 flex items-center gap-2">
                <span>Festival Invitation Card</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold">
                  Bala Ganesh Theme
                </span>
              </h3>
              <p className="text-xs text-gray-300">
                Official Contact: <span className="text-amber-300 font-bold font-mono">MINNU 9059375693</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Language Selector Segmented Control */}
            <div className="inline-flex rounded-xl bg-devotional-blue-950 p-1 border border-devotional-gold-500/40 shadow-sm text-xs font-bold">
              <button
                type="button"
                onClick={() => setLanguage('TE')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  language === 'TE'
                    ? 'bg-amber-500 text-devotional-blue-950 font-black shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                తెలుగు
              </button>
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  language === 'EN'
                    ? 'bg-amber-500 text-devotional-blue-950 font-black shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('BOTH')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  language === 'BOTH'
                    ? 'bg-amber-500 text-devotional-blue-950 font-black shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Both
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-gray-300 hover:text-white transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Rendered Visual Card Preview Container (Crisp White Paper View) */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-devotional-gold-500/30 bg-white max-h-[58vh] overflow-y-auto">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Invitation - ${invitation.title}`}
              className="w-full h-auto object-contain block mx-auto max-w-xl"
            />
          ) : (
            <div className="aspect-[3/4] w-full flex flex-col items-center justify-center gap-3 bg-[#0a1845] text-devotional-gold-300 py-20">
              <div className="w-10 h-10 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold">Rendering White &amp; Gold Royal Invitation Card...</p>
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
              <span>
                Send ({language === 'TE' ? 'తెలుగు' : language === 'EN' ? 'English' : 'Both'}) to WhatsApp Group
              </span>
            </button>

            {/* Jump into WhatsApp Group */}
            <a
              href={FESTIVAL_CONFIG.whatsappGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-devotional-blue-900 hover:bg-devotional-blue-800 border-2 border-emerald-500/50 text-emerald-300 hover:text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Open Bala Ganesh Group</span>
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
                    <span className="text-emerald-400 font-black">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-devotional-gold-400" />
                    <span>Copy Text</span>
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
                placeholder="Mobile (direct invite)"
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
