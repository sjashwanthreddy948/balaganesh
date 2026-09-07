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

const TELUGU_FONT =
  '"Noto Sans Telugu", "Gautami", "Nirmala UI", "Segoe UI", Arial, sans-serif';
const SERIF_FONT = 'Georgia, "Noto Sans Telugu", "Gautami", serif';

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
    if (isNaN(d.getTime())) return String(invitation.eventDate);

    if (language === 'TE') {
      const weekdaysTe = [
        'ఆదివారం',
        'సోమవారం',
        'మంగళవారం',
        'బుధవారం',
        'గురువారం',
        'శుక్రవారం',
        'శనివారం',
      ];
      const monthsTe = [
        'జనవరి',
        'ఫిబ్రవరి',
        'మార్చి',
        'ఏప్రిల్',
        'మే',
        'జూన్',
        'జూలై',
        'ఆగస్టు',
        'సెప్టెంబర్',
        'అక్టోబర్',
        'నవంబర్',
        'డిసెంబర్',
      ];
      return `${weekdaysTe[d.getDay()]}, ${d.getDate()} ${monthsTe[d.getMonth()]} ${d.getFullYear()}`;
    }

    return d.toLocaleDateString('en-IN', {
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
      let currentY = 108;

      // 5. SACRED INVOCATION
      ctx.textAlign = 'center';

      // Sacred Om
      ctx.font = `bold 38px ${SERIF_FONT}`;
      ctx.fillStyle = '#b8860b';
      ctx.fillText('ॐ', width / 2, currentY);
      currentY += 34;

      // Sanskrit Shloka (zero letter-spacing for Brahmic/Indic script)
      ctx.font = `bold 18px ${SERIF_FONT}`;
      ctx.fillStyle = '#b8860b';
      ctx.letterSpacing = '0px';
      ctx.fillText('॥ श्री गणेशाय नमः ॥ • ॐ गं गणपतये नमः', width / 2, currentY);
      currentY += 44;

      // 6. ASSOCIATION NAME (Deep Royal Blue Display with Gold Accent)
      ctx.font = '900 42px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#0c1e54';
      ctx.letterSpacing = '2px';
      ctx.fillText(FESTIVAL_CONFIG.associationName, width / 2, currentY);
      ctx.letterSpacing = '0px';
      currentY += 33;

      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#b8860b';
      ctx.letterSpacing = '1.5px';
      ctx.fillText(
        `${FESTIVAL_CONFIG.associationAddress.toUpperCase()} • UTSAV ${FESTIVAL_CONFIG.festivalYear}`,
        width / 2,
        currentY
      );
      ctx.letterSpacing = '0px';
      currentY += 35;

      // 7. TITLE RIBBON: ROYAL BLUE WITH METALLIC GOLD BORDER
      const ribbonW = 760;
      const ribbonH = 48;
      const ribbonX = (width - ribbonW) / 2;
      const ribbonY = currentY;

      const ribbonGrad = ctx.createLinearGradient(ribbonX, ribbonY, ribbonX + ribbonW, ribbonY + ribbonH);
      ribbonGrad.addColorStop(0, '#0c1e54');
      ribbonGrad.addColorStop(0.5, '#16358c');
      ribbonGrad.addColorStop(1, '#0c1e54');

      ctx.fillStyle = ribbonGrad;
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 3;
      drawRoundRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, 24);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold 21px ${TELUGU_FONT}`;
      ctx.fillStyle = '#ffffff';
      ctx.letterSpacing = '0px';
      const ribbonText =
        language === 'TE'
          ? '★ విశేష పూజా ఆహ్వాన పత్రిక ★'
          : language === 'EN'
          ? '★ CORDIAL POOJA INVITATION ★'
          : '★ CORDIAL INVITATION / సాదర ఆహ్వానం ★';
      ctx.fillText(ribbonText, width / 2, ribbonY + 32);
      currentY = ribbonY + ribbonH + 24;

      // 8. POOJA HOST COUPLE SECTION (HERO HOST SECTION)
      const hName = invitation.husbandName?.trim();
      const wName = invitation.wifeName?.trim();
      const hasCouple = Boolean(hName || wName);

      if (hasCouple) {
        const isBilingual = language === 'BOTH';
        const hostBoxW = 1020;
        const hostBoxH = isBilingual ? 205 : 175;
        const hostBoxX = (width - hostBoxW) / 2;
        const hostBoxY = currentY;

        // Luxury White Card with Gold Drop Shadow & Double Gold-Royal Blue Borders
        ctx.save();
        ctx.shadowColor = 'rgba(12, 30, 84, 0.1)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = '#ffffff';
        drawRoundRect(ctx, hostBoxX, hostBoxY, hostBoxW, hostBoxH, 18);
        ctx.fill();
        ctx.restore();

        // Outer Burnished Gold Frame
        ctx.strokeStyle = '#c69214';
        ctx.lineWidth = 3;
        drawRoundRect(ctx, hostBoxX, hostBoxY, hostBoxW, hostBoxH, 18);
        ctx.stroke();

        // Inner Royal Blue Hairline
        ctx.strokeStyle = 'rgba(12, 30, 84, 0.3)';
        ctx.lineWidth = 1.2;
        drawRoundRect(ctx, hostBoxX + 6, hostBoxY + 6, hostBoxW - 12, hostBoxH - 12, 14);
        ctx.stroke();

        // Top Category Pill/Header
        const categoryY = hostBoxY + 28;
        ctx.font = `bold 16px ${TELUGU_FONT}`;
        ctx.fillStyle = '#991b1b';
        ctx.letterSpacing = '0px';
        const hostCategory =
          language === 'TE'
            ? '🌸  నేటి విశేష పూజా దంపతులు (POOJA HOSTS)  🌸'
            : language === 'EN'
            ? "🌸  TODAY'S AUSPICIOUS POOJA HOSTS  🌸"
            : "🌸  నేటి విశేష పూజా దంపతులు / TODAY'S POOJA HOSTS  🌸";
        ctx.fillText(hostCategory, width / 2, categoryY);

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
          // PURE TELUGU HERO DISPLAY (AUTO-SCALED WITH GENEROUS DESCENT CLEARANCE)
          let teSize = 38;
          ctx.font = `bold ${teSize}px ${TELUGU_FONT}`;
          while (ctx.measureText(coupleTelugu).width > 920 && teSize > 20) {
            teSize -= 1.5;
            ctx.font = `bold ${teSize}px ${TELUGU_FONT}`;
          }
          ctx.fillStyle = '#0c1e54';
          const nameY = hostBoxY + 76;
          ctx.fillText(coupleTelugu, width / 2, nameY);

          // Ornate Gold Underline placed safely below Telugu descenders
          const teWidth = Math.min(ctx.measureText(coupleTelugu).width + 50, 920);
          const lineY = nameY + 26;
          ctx.strokeStyle = '#c69214';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(width / 2 - teWidth / 2, lineY);
          ctx.lineTo(width / 2 + teWidth / 2, lineY);
          ctx.stroke();

          // Center Diamond on Underline
          ctx.fillStyle = '#0c1e54';
          ctx.strokeStyle = '#c69214';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(width / 2, lineY - 6);
          ctx.lineTo(width / 2 + 6, lineY);
          ctx.lineTo(width / 2, lineY + 6);
          ctx.lineTo(width / 2 - 6, lineY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Sponsoring note
          ctx.font = `italic 16px ${TELUGU_FONT}`;
          ctx.fillStyle = '#475569';
          ctx.fillText(
            'వారి సౌజన్యంతో నేటి విశేష పూజ & తీర్థ ప్రసాద వితరణ కార్యక్రమం',
            width / 2,
            hostBoxY + 144
          );
        } else if (language === 'EN') {
          // PURE ENGLISH HERO DISPLAY
          let enSize = 40;
          ctx.font = `bold ${enSize}px ${SERIF_FONT}`;
          while (ctx.measureText(coupleEnglish).width > 920 && enSize > 22) {
            enSize -= 1.5;
            ctx.font = `bold ${enSize}px ${SERIF_FONT}`;
          }
          ctx.fillStyle = '#0c1e54';
          const nameY = hostBoxY + 76;
          ctx.fillText(coupleEnglish, width / 2, nameY);

          // Ornate Gold Underline with Diamond
          const enWidth = Math.min(ctx.measureText(coupleEnglish).width + 50, 920);
          const lineY = nameY + 22;
          ctx.strokeStyle = '#c69214';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(width / 2 - enWidth / 2, lineY);
          ctx.lineTo(width / 2 + enWidth / 2, lineY);
          ctx.stroke();

          // Center Diamond on Underline
          ctx.fillStyle = '#0c1e54';
          ctx.strokeStyle = '#c69214';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(width / 2, lineY - 6);
          ctx.lineTo(width / 2 + 6, lineY);
          ctx.lineTo(width / 2, lineY + 6);
          ctx.lineTo(width / 2 - 6, lineY);
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
          // BILINGUAL DISPLAY (TELUGU 32px + ENGLISH 24px DUAL DISPLAY WITH ZERO OVERLAP)
          let teSize = 32;
          ctx.font = `bold ${teSize}px ${TELUGU_FONT}`;
          while (ctx.measureText(coupleTelugu).width > 920 && teSize > 20) {
            teSize -= 1.5;
            ctx.font = `bold ${teSize}px ${TELUGU_FONT}`;
          }
          ctx.fillStyle = '#0c1e54';
          const teY = hostBoxY + 70;
          ctx.fillText(coupleTelugu, width / 2, teY);

          let enSize = 24;
          ctx.font = `bold ${enSize}px ${SERIF_FONT}`;
          while (ctx.measureText(coupleEnglish).width > 920 && enSize > 18) {
            enSize -= 1.5;
            ctx.font = `bold ${enSize}px ${SERIF_FONT}`;
          }
          ctx.fillStyle = '#b8860b';
          const enY = hostBoxY + 114;
          ctx.fillText(coupleEnglish, width / 2, enY);

          // Ornate Gold Underline with Diamond under English
          const dualWidth = Math.min(
            Math.max(ctx.measureText(coupleTelugu).width, ctx.measureText(coupleEnglish).width) + 50,
            920
          );
          const lineY = enY + 18;
          ctx.strokeStyle = '#c69214';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(width / 2 - dualWidth / 2, lineY);
          ctx.lineTo(width / 2 + dualWidth / 2, lineY);
          ctx.stroke();

          // Diamond
          ctx.fillStyle = '#0c1e54';
          ctx.strokeStyle = '#c69214';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(width / 2, lineY - 5);
          ctx.lineTo(width / 2 + 5, lineY);
          ctx.lineTo(width / 2, lineY + 5);
          ctx.lineTo(width / 2 - 5, lineY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Sponsoring note
          ctx.font = `italic 15px ${TELUGU_FONT}`;
          ctx.fillStyle = '#475569';
          ctx.fillText(
            'వారి సౌజన్యంతో నేటి విశేష పూజ & ప్రసాదం • Followed by Divine Mahaprasadam',
            width / 2,
            hostBoxY + 176
          );
        }

        currentY = hostBoxY + hostBoxH + 20;
      }

      // 9. INVITEE DEDICATION CARD (COMFORTABLE 78px HEIGHT FOR BILINGUAL / TELUGU MATRAS)
      const inviteBoxW = 980;
      const inviteBoxH = 78;
      const inviteBoxX = (width - inviteBoxW) / 2;
      const inviteBoxY = currentY;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      drawRoundRect(ctx, inviteBoxX, inviteBoxY, inviteBoxW, inviteBoxH, 14);
      ctx.fill();

      ctx.strokeStyle = '#0c1e54';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.font = `bold 14px ${TELUGU_FONT}`;
      ctx.fillStyle = '#475569';
      ctx.fillText(
        language === 'TE'
          ? 'గౌరవనీయులైన / CORDIAL INVITATION TO:'
          : 'CORDIAL INVITATION TO:',
        width / 2,
        inviteBoxY + 26
      );

      let invSize = 22;
      ctx.font = `bold ${invSize}px ${TELUGU_FONT}`;
      let dispInvitees = invitation.invitees || 'All Devotees & Colony Residents';
      while (ctx.measureText(dispInvitees).width > 900 && invSize > 16) {
        invSize -= 1;
        ctx.font = `bold ${invSize}px ${TELUGU_FONT}`;
      }
      ctx.fillStyle = '#0c1e54';
      ctx.fillText(dispInvitees, width / 2, inviteBoxY + 58);

      currentY = inviteBoxY + inviteBoxH + 20;

      // 10. SACRED EVENT TITLE BANNER (AUTO-SCALED ZERO OVERFLOW)
      const eventBoxW = 980;
      const eventBoxH = 72;
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
      drawRoundRect(ctx, eventBoxX, eventBoxY, eventBoxW, eventBoxH, 16);
      ctx.fill();

      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      let titleSize = 28;
      ctx.font = `900 ${titleSize}px ${TELUGU_FONT}`;
      const titleText = `🪔  ${invitation.title.trim()}  🪔`;
      while (ctx.measureText(titleText).width > eventBoxW - 60 && titleSize > 18) {
        titleSize -= 1.5;
        ctx.font = `900 ${titleSize}px ${TELUGU_FONT}`;
      }
      ctx.fillStyle = '#0c1e54';
      ctx.fillText(titleText, width / 2, eventBoxY + 46);

      currentY = eventBoxY + eventBoxH + 22;

      // 11. AUSPICIOUS DETAILS BOX (AUTO-SCALED VALUES & SAFE MARGINS)
      const detailsBoxW = 980;
      const detailsBoxH = 244;
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
      const labelX = detailsBoxX + 40;
      const valueX = detailsBoxX + 240;
      const maxValW = 690;

      // Row 1: Date
      ctx.font = `bold 18px ${TELUGU_FONT}`;
      ctx.fillStyle = '#c69214';
      ctx.fillText(
        language === 'TE' ? '📅  తేదీ / DATE:' : '📅  DATE:',
        labelX,
        detailsBoxY + 46
      );

      let dSize = 19;
      ctx.font = `600 ${dSize}px ${TELUGU_FONT}`;
      while (ctx.measureText(formattedDate).width > maxValW && dSize > 14) {
        dSize -= 0.5;
        ctx.font = `600 ${dSize}px ${TELUGU_FONT}`;
      }
      ctx.fillStyle = '#0f172a';
      ctx.fillText(formattedDate, valueX, detailsBoxY + 46);

      // Row 2: Time
      ctx.font = `bold 18px ${TELUGU_FONT}`;
      ctx.fillStyle = '#c69214';
      ctx.fillText(
        language === 'TE' ? '⏰  సమయం / TIME:' : '⏰  TIME:',
        labelX,
        detailsBoxY + 100
      );

      let tSize = 19;
      ctx.font = `600 ${tSize}px ${TELUGU_FONT}`;
      while (ctx.measureText(invitation.eventTime).width > maxValW && tSize > 14) {
        tSize -= 0.5;
        ctx.font = `600 ${tSize}px ${TELUGU_FONT}`;
      }
      ctx.fillStyle = '#0f172a';
      ctx.fillText(invitation.eventTime, valueX, detailsBoxY + 100);

      // Row 3: Venue
      ctx.font = `bold 18px ${TELUGU_FONT}`;
      ctx.fillStyle = '#c69214';
      ctx.fillText(
        language === 'TE' ? '📍  వేదిక / VENUE:' : '📍  VENUE:',
        labelX,
        detailsBoxY + 154
      );

      let vSize = 18;
      ctx.font = `600 ${vSize}px ${TELUGU_FONT}`;
      let dispVenue = invitation.venue;
      while (ctx.measureText(dispVenue).width > maxValW && vSize > 13) {
        vSize -= 0.5;
        ctx.font = `600 ${vSize}px ${TELUGU_FONT}`;
      }
      ctx.fillStyle = '#0f172a';
      ctx.fillText(dispVenue, valueX, detailsBoxY + 154);

      // Row 4: Prasadam Distribution
      ctx.font = `bold 18px ${TELUGU_FONT}`;
      ctx.fillStyle = '#b91c1c';
      ctx.fillText(
        language === 'TE'
          ? '🍽️  తీర్థ ప్రసాదం:'
          : language === 'EN'
          ? '🍽️  PRASADAM:'
          : '🍽️  తీర్థ ప్రసాదం:',
        labelX,
        detailsBoxY + 208
      );

      const prasadamText =
        language === 'TE'
          ? 'పూజ అనంతరం భక్తులందరికీ అన్నప్రసాదం / తీర్థ ప్రసాద వితరణ'
          : language === 'EN'
          ? 'Followed by Divine Mahaprasadam / Annaprasadam'
          : 'పూజ అనంతరం అన్నప్రసాదం (Followed by Divine Mahaprasadam)';

      let pSize = 17;
      ctx.font = `bold ${pSize}px ${TELUGU_FONT}`;
      while (ctx.measureText(prasadamText).width > maxValW && pSize > 13) {
        pSize -= 0.5;
        ctx.font = `bold ${pSize}px ${TELUGU_FONT}`;
      }
      ctx.fillStyle = '#047857';
      ctx.fillText(prasadamText, valueX, detailsBoxY + 208);

      currentY = detailsBoxY + detailsBoxH + 24;

      // 12. PROGRAM DETAILS (WORD WRAPPED & STRICTLY BOUNDED)
      ctx.textAlign = 'center';
      if (invitation.description && invitation.description.trim().length > 0) {
        ctx.font = `bold 18px ${TELUGU_FONT}`;
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
        currentY += 26;

        ctx.font = `normal 16px ${TELUGU_FONT}`;
        ctx.fillStyle = '#334155';

        const maxTextWidth = 900;
        const paragraphs = invitation.description.trim().split('\n');
        let linesCount = 0;
        const maxLines = 4;

        for (const para of paragraphs) {
          if (!para.trim() || linesCount >= maxLines) continue;
          const words = para.trim().split(/\s+/);
          let currentLine = '';

          for (let n = 0; n < words.length; n++) {
            const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxTextWidth && currentLine) {
              ctx.fillText(currentLine, width / 2, currentY);
              currentY += 24;
              linesCount++;
              currentLine = words[n];
              if (linesCount >= maxLines) break;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine && linesCount < maxLines) {
            ctx.fillText(currentLine, width / 2, currentY);
            currentY += 24;
            linesCount++;
          }
        }
      }

      // 13. DIVINE BLESSINGS INVOCATION (BOUNDED & PROPORTIONED)
      ctx.fillStyle = '#b8860b';
      if (language === 'TE') {
        let bSize = 18;
        ctx.font = `italic bold ${bSize}px ${SERIF_FONT}`;
        const blessingText =
          '🙏 "మీ రాకయే మాకు శుభప్రదం • భక్తులందరికీ స్వామివారి కృపాకటాక్షాలు కలగాలని కోరుచున్నాము" 🙏';
        while (ctx.measureText(blessingText).width > 960 && bSize > 14) {
          bSize -= 0.5;
          ctx.font = `italic bold ${bSize}px ${SERIF_FONT}`;
        }
        ctx.fillText(blessingText, width / 2, 1382);
      } else if (language === 'EN') {
        ctx.font = `italic bold 18px ${SERIF_FONT}`;
        const blessingText =
          '🙏 "All are cordially invited to receive the divine blessings of Lord Ganesha" 🙏';
        ctx.fillText(blessingText, width / 2, 1382);
      } else {
        // Bilingual: Two distinct balanced lines
        ctx.font = `bold 16px ${TELUGU_FONT}`;
        ctx.fillText(
          '🙏 "మీ రాకయే మాకు శుభప్రదం • భక్తులందరికీ స్వామివారి కృపాకటాక్షాలు కలగాలని కోరుచున్నాము" 🙏',
          width / 2,
          1370
        );
        ctx.font = `italic 15px ${SERIF_FONT}`;
        ctx.fillText(
          '"All devotees are cordially invited to seek the divine blessings of Lord Ganesha"',
          width / 2,
          1394
        );
      }

      // 14. BOTTOM SEPARATOR LINE
      const divY = 1415;
      ctx.strokeStyle = '#c69214';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(100, divY);
      ctx.lineTo(width - 100, divY);
      ctx.stroke();

      // 15. OFFICIAL RED SEAL STAMP (EXACT CERTIFICATE STYLE)
      if (stampLoaded && stampImage.width > 0) {
        ctx.save();
        const redSealW = 190;
        const redSealH = 130;
        const redSealX = width - 260;
        const redSealY = 1435;
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
      const footY = 1460;
      ctx.textAlign = 'center';
      ctx.font = `bold 22px ${TELUGU_FONT}`;
      ctx.fillStyle = '#0c1e54';
      ctx.fillText('BALA GANESH ASSOCIATION COMMITTEE', width / 2, footY);

      ctx.font = `600 16px ${TELUGU_FONT}`;
      ctx.fillStyle = '#475569';
      ctx.fillText(
        'Bhavani Nagar, Shankarpally, Telangana • Youth Members & Volunteers',
        width / 2,
        footY + 28
      );

      ctx.font = `bold 18px ${TELUGU_FONT}`;
      ctx.fillStyle = '#b91c1c';
      ctx.fillText('Official Contact: MINNU 9059375693', width / 2, footY + 58);

      ctx.font = `bold 20px ${TELUGU_FONT}`;
      ctx.fillStyle = '#c69214';
      ctx.fillText('🙏  GANPATI BAPPA MORYA!  🙏', width / 2, footY + 98);

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
      {/* Hidden processing canvas strictly prevented from rendering on screen */}
      <canvas ref={canvasRef} style={{ display: 'none' }} className="hidden" />

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
