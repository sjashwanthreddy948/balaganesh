'use client';

import React, { useState } from 'react';
import {
  FESTIVAL_CONFIG,
  buildWhatsAppInvitationMessage,
} from '@/config/festival.config';
import { normalizeIndianMobileForWhatsApp } from '@/lib/validation';
import {
  X,
  MessageCircle,
  Send,
  Users,
  ExternalLink,
} from 'lucide-react';
import InvitationCardRenderer, {
  InvitationData,
} from './InvitationCardRenderer';

export type { InvitationData };

interface InvitationCardModalProps {
  invitation: InvitationData;
  onClose: () => void;
  initialLanguage?: 'TE' | 'EN' | 'BOTH';
}

export default function InvitationCardModal({
  invitation,
  onClose,
  initialLanguage = 'BOTH',
}: InvitationCardModalProps) {
  const [language, setLanguage] = useState<'TE' | 'EN' | 'BOTH'>(initialLanguage);
  const [individualMobile, setIndividualMobile] = useState('');

  // Direct send to individual devotee's mobile
  const handleSendToIndividual = () => {
    if (!individualMobile.trim()) return;
    const normalized = normalizeIndianMobileForWhatsApp(individualMobile);
    const phoneParam = normalized ? `phone=${normalized.whatsappPhone}&` : '';
    const message = buildWhatsAppInvitationMessage(invitation, language);
    const url = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-3xl bg-[#071338] border-2 border-devotional-gold-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 my-auto text-white">
        {/* Modal Header with Language Selector & Official Contact */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-devotional-gold-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-devotional-gold-400 flex items-center justify-center text-devotional-blue-950 font-black shadow-md shrink-0">
              <MessageCircle className="w-5 h-5 text-devotional-blue-950" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-devotional-gold-300 flex items-center gap-2">
                <span>Festival Invitation Card</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold">
                  Certificate Theme
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

        {/* Certificate-Themed Invitation Card Preview */}
        <InvitationCardRenderer
          invitation={invitation}
          language={language}
          showActions={true}
          maxPreviewHeight="max-h-[60vh]"
        />

        {/* Extra Bottom Bar: WhatsApp Group & Individual Devotee Invite */}
        <div className="pt-2 border-t border-devotional-gold-500/20 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <a
            href={FESTIVAL_CONFIG.whatsappGroupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-devotional-gold-300 hover:text-white font-semibold transition-colors"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Open Bala Ganesh Group</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </a>

          {/* Send to Individual Devotee Number */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <input
              type="tel"
              placeholder="Mobile (direct personal invite)"
              value={individualMobile}
              onChange={(e) => setIndividualMobile(e.target.value)}
              className="w-full sm:w-56 px-3 py-1.5 text-xs bg-devotional-blue-950 border border-devotional-gold-500/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={handleSendToIndividual}
              disabled={!individualMobile.trim()}
              className="py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1"
              title="Send personal invite to this mobile"
            >
              <Send className="w-3 h-3" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
