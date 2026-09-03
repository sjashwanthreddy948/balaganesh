import React from 'react';
import { FESTIVAL_CONFIG } from '@/config/festival.config';
import { Phone, MessageCircle } from 'lucide-react';

export default function Footer() {
  const cleanWhatsAppNumber = FESTIVAL_CONFIG.whatsappNumber.replace(/[^0-9]/g, '');

  return (
    <footer className="w-full mt-auto border-t border-devotional-gold-500/20 bg-devotional-blue-950/90 py-8 px-4 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold tracking-wider uppercase text-devotional-gold-400">
            {FESTIVAL_CONFIG.associationName}
          </h2>
          <p className="text-xs text-devotional-gold-100/70 font-medium">
            Ganesh Festival Chanda Collection • {FESTIVAL_CONFIG.festivalYear}
          </p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto pt-1">
            {FESTIVAL_CONFIG.associationAddress}
          </p>
        </div>

        {/* Contact numbers */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-1">
          <a
            href={`tel:${FESTIVAL_CONFIG.contactNumber.replace(/[^0-9+]/g, '')}`}
            className="flex items-center gap-1.5 text-devotional-gold-300 hover:text-devotional-gold-200 bg-devotional-blue-900/60 px-3 py-1.5 rounded-full border border-devotional-gold-500/30 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-devotional-gold-400" />
            <span>Contact: {FESTIVAL_CONFIG.contactNumber}</span>
          </a>

          <a
            href={`https://wa.me/${cleanWhatsAppNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-500/30 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp: {FESTIVAL_CONFIG.whatsappNumber}</span>
          </a>
        </div>

        <div className="pt-2">
          <p className="text-sm font-semibold tracking-wide text-devotional-gold-400">
            Ganpati Bappa Morya 🙏
          </p>
        </div>
      </div>
    </footer>
  );
}
