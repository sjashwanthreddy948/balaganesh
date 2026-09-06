'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  FESTIVAL_CONFIG,
  buildWhatsAppInvitationMessage,
} from '@/config/festival.config';
import {
  Download,
  Send,
  Printer,
  Maximize2,
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

function drawRoundRect(
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

interface InvitationCardRendererProps {
  invitation: InvitationData;
  language?: 'TE' | 'EN' | 'BOTH';
  onEnlarge?: () => void;
  showActions?: boolean;
  maxPreviewHeight?: string;
}

export default function InvitationCardRenderer({
  invitation,
  language = 'BOTH',
  onEnlarge,
  showActions = true,
  maxPreviewHeight = 'max-h-[58vh]',
}: InvitationCardRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  // Format date display
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

    // High-resolution portrait canvas (1200 x 1650)
    const width = 1200;
    const height = 1650;
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
      // 1. BASE BACKGROUND: Pure Luxury Ivory / White Paper Stock (Certificate Style)
      const paperGradient = ctx.createLinearGradient(0, 0, width, height);
      paperGradient.addColorStop(0, '#ffffff');
      paperGradient.addColorStop(0.35, '#fafaf7');
      paperGradient.addColorStop(0.7, '#f7f6ef');
      paperGradient.addColorStop(1, '#f4f2e9');
      ctx.fillStyle = paperGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. SUBTLE WATERMARK: Pandal & Deity Watermark (8% Opacity on White Paper)
      if (imgLoaded && bgImage.width > 0) {
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.drawImage(bgImage, 0, 0, width, height);
        ctx.restore();
      }

      // 3. ELEGANT GOLD & ROYAL BLUE DUAL BORDERS (Exact Certificate Theme)
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

      // 4. CORNER ROSETTES (Metallic Gold with Royal Blue Center Jewel)
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

      // Cursor for guaranteed sequential vertical flow (ZERO OVERLAPPING)
      let currentY = 110;

      // 5. SACRED INVOCATION
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
      ctx.fillText('॥ श्री गणेशाय नमः ॥ • ॐ गं गणपतये नमः', width / 2, currentY);
      ctx.letterSpacing = '0px';
      currentY += 45;

      // 6. ASSOCIATION NAME (Deep Royal Blue Display with Gold Accent)
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

      // 7. TITLE RIBBON: ROYAL BLUE WITH METALLIC GOLD BORDER
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

      // 8. POOJA HOST COUPLE SECTION (HERO HOST SECTION)
      const hName = invitation.husbandName?.trim();
      const wName = invitation.wifeName?.trim();
      const hasCouple = Boolean(hName || wName);

      if (hasCouple) {
        const isBilingual = language === 'BOTH';
        const hostBoxW = 1020;
        const hostBoxH = isBilingual ? 210 : 175;
        const hostBoxX = (width - hostBoxW) / 2;
        const hostBoxY = currentY;

        // Luxury White Card with Gold Drop Shadow & Double Gold-Royal Blue Borders
        ctx.save();
        ctx.shadowColor = 'rgba(12, 30, 84, 0.12)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = '#ffffff';
        drawRoundRect(ctx, hostBoxX, hostBoxY, hostBoxW, hostBoxH, 20);
        ctx.fill();
        ctx.restore();

        // Outer Burnished Gold Frame
        ctx.strokeStyle = '#c69214';
        ctx.lineWidth = 3.5;
        drawRoundRect(ctx, hostBoxX, hostBoxY, hostBoxW, hostBoxH, 20);
        ctx.stroke();

        // Inner Royal Blue Hairline
        ctx.strokeStyle = 'rgba(12, 30, 84, 0.35)';
        ctx.lineWidth = 1.2;
        drawRoundRect(ctx, hostBoxX + 6, hostBoxY + 6, hostBoxW - 12, hostBoxH - 12, 16);
        ctx.stroke();

        // Top Category Pill/Header
        const categoryY = hostBoxY + 30;
        ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#991b1b';
        ctx.letterSpacing = '1.5px';
        const hostCategory =
          language === 'TE'
            ? '🌸  నేటి విశేష పూజా దంపతులు (POOJA HOSTS)  🌸'
            : language === 'EN'
            ? "🌸  TODAY'S AUSPICIOUS POOJA HOSTS  🌸"
            : "🌸  నేటి విశేష పూజా దంపతులు / TODAY'S POOJA HOSTS  🌸";
        ctx.fillText(hostCategory, width / 2, categoryY);
        ctx.letterSpacing = '0px';

        // HERO COUPLE NAMES
        const coupleTelugu =
          hName && wName
            ? `శ్రీ మరియు శ్రీమతి ${hName} - ${wName} దంపతులు`
            : hName
            ? `శ్రీ ${hName} & కుటుంబ సభ్యులు`
            : `శ్రీమతి ${wName} & కుటుంబ సభ్యులు`;

        const coupleEnglish =
          hName && wName
            ? `Sri ${hName} & Smt. ${wName} (and Family)`
            : hName
            ? `Sri ${hName} & Family`
            : `Smt. ${wName} & Family`;

        if (language === 'TE') {
          // PURE TELUGU HERO DISPLAY (EXTRA LARGE 44px)
          let teSize = 44;
          ctx.font = `bold ${teSize}px "Segoe UI", Arial, sans-serif`;
          while (ctx.measureText(coupleTelugu).width > 940 && teSize > 28) {
            teSize -= 2;
            ctx.font = `bold ${teSize}px "Segoe UI", Arial, sans-serif`;
          }
          ctx.fillStyle = '#0c1e54';
          const nameY = hostBoxY + 84;
          ctx.fillText(coupleTelugu, width / 2, nameY);

          // Ornate Gold Underline with Diamond
          const teWidth = Math.min(ctx.measureText(coupleTelugu).width + 60, 920);
          ctx.strokeStyle = '#c69214';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(width / 2 - teWidth / 2, nameY + 16);
          ctx.lineTo(width / 2 + teWidth / 2, nameY + 16);
          ctx.stroke();

          // Center Diamond on Underline
          ctx.fillStyle = '#0c1e54';
          ctx.strokeStyle = '#c69214';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(width / 2, nameY + 9);
          ctx.lineTo(width / 2 + 7, nameY + 16);
          ctx.lineTo(width / 2, nameY + 23);
          ctx.lineTo(width / 2 - 7, nameY + 16);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Sponsoring note
          ctx.font = 'italic 16px "Segoe UI", Arial, sans-serif';
          ctx.fillStyle = '#475569';
          ctx.fillText(
            'వారి సౌజన్యంతో నేటి విశేష పూజ & తీర్థ ప్రసాద వితరణ కార్యక్రమం',
            width / 2,
            hostBoxY + 144
          );
        } else if (language === 'EN') {
          // PURE ENGLISH HERO DISPLAY (EXTRA LARGE 44px)
          let enSize = 44;
          ctx.font = `bold ${enSize}px Georgia, "Segoe UI", Arial, sans-serif`;
          while (ctx.measureText(coupleEnglish).width > 940 && enSize > 28) {
            enSize -= 2;
            ctx.font = `bold ${enSize}px Georgia, "Segoe UI", Arial, sans-serif`;
          }
          ctx.fillStyle = '#0c1e54';
          const nameY = hostBoxY + 84;
          ctx.fillText(coupleEnglish, width / 2, nameY);

          // Ornate Gold Underline with Diamond
          const enWidth = Math.min(ctx.measureText(coupleEnglish).width + 60, 920);
          ctx.strokeStyle = '#c69214';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(width / 2 - enWidth / 2, nameY + 16);
          ctx.lineTo(width / 2 + enWidth / 2, nameY + 16);
          ctx.stroke();

          // Center Diamond on Underline
          ctx.fillStyle = '#0c1e54';
          ctx.strokeStyle = '#c69214';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(width / 2, nameY + 9);
          ctx.lineTo(width / 2 + 7, nameY + 16);
          ctx.lineTo(width / 2, nameY + 23);
          ctx.lineTo(width / 2 - 7, nameY + 16);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Sponsoring note
          ctx.font = 'italic 16px "Segoe UI", Arial, sans-serif';
          ctx.fillStyle = '#475569';
          ctx.fillText(
            "Graciously hosting today's sacred pooja followed by divine Mahaprasadam",
            width / 2,
            hostBoxY + 144
          );
        } else {
          // BILINGUAL DISPLAY (TELUGU 38px + ENGLISH 28px HERO DUAL DISPLAY)
          let teSize = 38;
          ctx.font = `bold ${teSize}px "Segoe UI", Arial, sans-serif`;
          while (ctx.measureText(coupleTelugu).width > 940 && teSize > 26) {
            teSize -= 2;
            ctx.font = `bold ${teSize}px "Segoe UI", Arial, sans-serif`;
          }
          ctx.fillStyle = '#0c1e54';
          const teY = hostBoxY + 76;
          ctx.fillText(coupleTelugu, width / 2, teY);

          let enSize = 28;
          ctx.font = `bold ${enSize}px "Segoe UI", Arial, sans-serif`;
          while (ctx.measureText(coupleEnglish).width > 940 && enSize > 20) {
            enSize -= 2;
            ctx.font = `bold ${enSize}px "Segoe UI", Arial, sans-serif`;
          }
          ctx.fillStyle = '#b8860b';
          const enY = hostBoxY + 120;
          ctx.fillText(coupleEnglish, width / 2, enY);

          // Ornate Gold Underline with Diamond under English
          const dualWidth = Math.min(
            Math.max(ctx.measureText(coupleTelugu).width, ctx.measureText(coupleEnglish).width) +
              50,
            920
          );
          ctx.strokeStyle = '#c69214';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(width / 2 - dualWidth / 2, enY + 16);
          ctx.lineTo(width / 2 + dualWidth / 2, enY + 16);
          ctx.stroke();

          // Diamond
          ctx.fillStyle = '#0c1e54';
          ctx.strokeStyle = '#c69214';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(width / 2, enY + 10);
          ctx.lineTo(width / 2 + 6, enY + 16);
          ctx.lineTo(width / 2, enY + 22);
          ctx.lineTo(width / 2 - 6, enY + 16);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Sponsoring note
          ctx.font = 'italic 15px "Segoe UI", Arial, sans-serif';
          ctx.fillStyle = '#475569';
          ctx.fillText(
            'వారి సౌజన్యంతో నేటి విశేష పూజ & ప్రసాదం • Followed by Divine Mahaprasadam',
            width / 2,
            hostBoxY + 184
          );
        }

        currentY = hostBoxY + hostBoxH + 24;
      }

      // 9. INVITEE DEDICATION CARD
      const inviteBoxW = 980;
      const inviteBoxH = 68;
      const inviteBoxX = (width - inviteBoxW) / 2;
      const inviteBoxY = currentY;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      drawRoundRect(ctx, inviteBoxX, inviteBoxY, inviteBoxW, inviteBoxH, 14);
      ctx.fill();

      ctx.strokeStyle = '#0c1e54';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(
        language === 'TE'
          ? 'గౌరవనీయులైన / CORDIAL INVITATION TO:'
          : 'CORDIAL INVITATION TO:',
        width / 2,
        inviteBoxY + 25
      );

      ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#0c1e54';
      let dispInvitees = invitation.invitees || 'All Devotees & Colony Residents';
      if (dispInvitees.length > 50) {
        dispInvitees = dispInvitees.substring(0, 48) + '...';
      }
      ctx.fillText(dispInvitees, width / 2, inviteBoxY + 53);

      currentY = inviteBoxY + inviteBoxH + 25;

      // 10. SACRED EVENT TITLE BANNER
      const eventBoxW = 980;
      const eventBoxH = 75;
      const eventBoxX = (width - eventBoxW) / 2;
      const eventBoxY = currentY;

      const eventGrad = ctx.createLinearGradient(
        eventBoxX,
        eventBoxY,
        eventBoxX + eventBoxW,
        eventBoxY + eventBoxH
      );
      eventGrad.addColorStop(0, '#ffffff');
      eventGrad.addColorStop(0.5, '#fffdf7');
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

      // 11. AUSPICIOUS DETAILS BOX (DATE, TIME, VENUE, PRASADAM)
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
      ctx.fillText(
        language === 'TE' ? '📅  తేదీ / DATE:' : '📅  DATE:',
        detailsBoxX + 45,
        detailsBoxY + 48
      );

      ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(formattedDate, detailsBoxX + 260, detailsBoxY + 48);

      // Row 2: Time
      ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#c69214';
      ctx.fillText(
        language === 'TE' ? '⏰  సమయం / TIME:' : '⏰  TIME:',
        detailsBoxX + 45,
        detailsBoxY + 102
      );

      ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(invitation.eventTime, detailsBoxX + 260, detailsBoxY + 102);

      // Row 3: Venue
      ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#c69214';
      ctx.fillText(
        language === 'TE' ? '📍  వేదిక / VENUE:' : '📍  VENUE:',
        detailsBoxX + 45,
        detailsBoxY + 156
      );

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
      ctx.fillText(
        language === 'TE' ? '🍽️  తీర్థ ప్రసాదం:' : '🍽️  PRASADAM:',
        detailsBoxX + 45,
        detailsBoxY + 210
      );

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

      // 12. PROGRAM DETAILS (WORD WRAPPED DYNAMICALLY - ZERO OVERLAP)
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

      // 13. DIVINE BLESSINGS INVOCATION
      ctx.font = 'italic bold 19px Georgia, serif';
      ctx.fillStyle = '#b8860b';
      const blessingText =
        language === 'TE'
          ? '🙏 "మీ రాకయే మాకు శుభప్రదం • భక్తులందరికీ స్వామివారి కృపాకటాక్షాలు కలగాలని కోరుచున్నాము" 🙏'
          : language === 'EN'
          ? '🙏 "All are cordially invited to receive the divine blessings of Lord Ganesha" 🙏'
          : '🙏 "మీ రాకయే మాకు శుభప్రదం • May Lord Ganesha shower divine blessings upon you & your family" 🙏';
      ctx.fillText(blessingText, width / 2, Math.max(currentY, 1370));

      // 14. BOTTOM SEPARATOR LINE
      const divY = 1420;
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(100, divY);
      ctx.lineTo(width - 100, divY);
      ctx.stroke();

      // 15. OFFICIAL RED SEAL STAMP (EXACT CERTIFICATE STYLE)
      if (stampLoaded && stampImage.width > 0) {
        ctx.save();
        const redSealW = 210;
        const redSealH = 140;
        const redSealX = width - 290;
        const redSealY = 1430;
        ctx.drawImage(stampImage, redSealX, redSealY, redSealW, redSealH);
        ctx.restore();
      }

      // 16. LEFT SIDE CERTIFICATE FOOTNOTE
      ctx.save();
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'left';
      ctx.fillText('OFFICIAL DIGITAL INVITATION', 90, 1495);
      ctx.fillText(`SAMITHI REF: BG-${invitation.year || 2026}`, 90, 1515);
      ctx.restore();

      // 17. FOOTER & OFFICIAL CONTACT (MINNU 9059375693)
      const footY = 1465;
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.letterSpacing = '1px';
      ctx.fillText('BALA GANESH ASSOCIATION COMMITTEE', width / 2, footY);
      ctx.letterSpacing = '0px';

      ctx.font = '600 17px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(
        'Bhavani Nagar, Shankarpally, Telangana • Youth Members & Volunteers',
        width / 2,
        footY + 30
      );

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

    // Render immediate crisp vector paper & text, then re-render with watermark & stamp
    tryRender();
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

  const handleSendToWhatsAppGroup = () => {
    const message = buildWhatsAppInvitationMessage(invitation, language);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        navigator.clipboard.writeText(message);
      } catch {}
    }
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
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
    <div className="space-y-3">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Certificate Frame & Card Preview */}
      <div
        className={`relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#0c1e54] ring-2 ring-[#c69214]/60 bg-white ${maxPreviewHeight} overflow-y-auto`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Invitation Card - ${invitation.title}`}
            className="w-full h-auto object-contain block mx-auto"
          />
        ) : (
          <div className="aspect-[3/4] w-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-white to-[#f7f6ef] text-[#0c1e54] py-20">
            <div className="w-10 h-10 border-3 border-[#c69214] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[#0c1e54]">
              Rendering Certificate-Themed Invitation...
            </p>
          </div>
        )}
      </div>

      {/* Quick Action Toolbar */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Download PNG */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={!imageUrl}
              className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#c69214] via-[#e6b743] to-[#c69214] text-[#0c1e54] font-black text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 text-[#0c1e54]" />
              <span>Download Card (PNG)</span>
            </button>

            {/* Direct Send to Bala Ganesh WhatsApp Group */}
            <button
              type="button"
              onClick={handleSendToWhatsAppGroup}
              className="py-2.5 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              title="Post invitation to Bala Ganesh WhatsApp Group"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>Send WhatsApp</span>
            </button>

            {/* Enlarge / Fullscreen if callback provided */}
            {onEnlarge && (
              <button
                type="button"
                onClick={onEnlarge}
                className="py-2.5 px-3 rounded-xl bg-[#0c1e54] hover:bg-[#15348f] border border-[#c69214]/60 text-[#fcd34d] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#fcd34d]" />
                <span>Enlarge</span>
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Print</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
