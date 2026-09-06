import React from 'react';
import Link from 'next/link';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export default function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-devotional-gold-500/25 bg-gradient-to-b from-[#050c22] to-[#020612] py-8 pb-28 md:pb-8 px-4 text-center text-devotional-gold-100/90 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Association Branding */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center justify-center gap-2 mb-1">
            <span className="text-devotional-gold-400 text-lg">🕉️</span>
            <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-devotional-gold-300 drop-shadow-sm">
              BALA GANESH ASSOCIATION
            </h2>
            <span className="text-devotional-gold-400 text-lg">🕉️</span>
          </div>
          <p className="text-xs text-gray-300 font-medium">
            Bhavani Nagar, Shankarpally, Telangana
          </p>
          <p className="text-sm font-bold text-devotional-gold-400 pt-1 tracking-wide">
            Ganpati Bappa Morya! 🙏
          </p>
        </div>

        {/* Quick Navigation Links */}
        <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs font-semibold">
          <Link
            href="/"
            className="text-gray-300 hover:text-devotional-gold-300 transition-colors"
          >
            Home
          </Link>
          <span className="text-devotional-gold-500/40 hidden sm:inline">•</span>
          <Link
            href="/dashboard"
            className="text-gray-300 hover:text-devotional-gold-300 transition-colors"
          >
            Chanda
          </Link>
          <span className="text-devotional-gold-500/40 hidden sm:inline">•</span>
          <Link
            href="/laddu"
            className="text-devotional-gold-300 hover:text-devotional-gold-200 font-bold transition-colors"
          >
            Laddu Payments
          </Link>
          <span className="text-devotional-gold-500/40 hidden sm:inline">•</span>
          <Link
            href="/expenses"
            className="text-gray-300 hover:text-devotional-gold-300 transition-colors"
          >
            Expenses
          </Link>
          <span className="text-devotional-gold-500/40 hidden sm:inline">•</span>
          <a
            href={`https://wa.me/${FESTIVAL_CONFIG.whatsappNumber}?text=${encodeURIComponent('Namaste Bala Ganesh Association, I would like to inquire about the Ganesh Festival celebration.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-devotional-gold-300 transition-colors"
          >
            Contact
          </a>
        </nav>

        {/* Subtle Gold Divider */}
        <div className="w-full max-w-xl mx-auto border-t border-devotional-gold-500/20 pt-4" />

        {/* Copyright & Meta */}
        <div className="space-y-1 text-xs text-gray-400">
          <p className="font-medium text-gray-300">
            © 2026 Bala Ganesh Association. All Rights Reserved.
          </p>
          <p className="text-[11px] text-devotional-gold-400/80 font-medium">
            Built for Ganesh Festival Management
          </p>
        </div>
      </div>
    </footer>
  );
}

