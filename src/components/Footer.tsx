import React from 'react';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export default function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-devotional-gold-500/20 bg-devotional-blue-950/90 py-6 px-4 text-center">
      <div className="max-w-md mx-auto space-y-3">
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

        <div className="pt-1">
          <p className="text-sm font-semibold tracking-wide text-devotional-gold-400">
            Ganpati Bappa Morya 🙏
          </p>
        </div>
      </div>
    </footer>
  );
}
