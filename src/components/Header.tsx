import React from 'react';
import Link from 'next/link';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export default function Header() {
  return (
    <header className="w-full border-b border-devotional-gold-500/20 bg-devotional-blue-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full border border-devotional-gold-500/50 bg-devotional-blue-900 overflow-hidden flex items-center justify-center shadow-gold-sm">
            {/* Devotional symbol or small festival icon */}
            <span className="text-devotional-gold-400 text-lg font-bold">🕉️</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-wider uppercase text-devotional-gold-400 group-hover:text-devotional-gold-300 transition-colors">
              {FESTIVAL_CONFIG.associationName}
            </h1>
            <p className="text-[11px] text-devotional-gold-100/70 font-medium tracking-wide">
              {FESTIVAL_CONFIG.festivalYear} Ganesh Utsav Chanda
            </p>
          </div>
        </Link>

        {/* Minimal admin shortcut */}
        <Link
          href="/admin"
          className="text-xs text-devotional-gold-300/60 hover:text-devotional-gold-300 transition-colors px-2 py-1 rounded border border-devotional-gold-500/20 hover:border-devotional-gold-500/40"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}
