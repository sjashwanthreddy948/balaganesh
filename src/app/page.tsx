import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FESTIVAL_CONFIG } from '@/config/festival.config';
import { Lock, PlusCircle, ArrowRight, Receipt, MapPin, Phone } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 sm:py-16 flex flex-col items-center justify-center text-center space-y-6">
        {/* Sanskrit Sacred Invocation Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a1842]/80 border border-devotional-gold-500/40 shadow-gold-sm">
          <span className="text-amber-400 text-xs">🪔</span>
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-devotional-gold-200">
            {FESTIVAL_CONFIG.sanskritMantra}
          </span>
          <span className="text-amber-400 text-xs">🪔</span>
        </div>

        {/* Association Branding & Festival Greeting */}
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#0c1a45] border-2 border-devotional-gold-400 flex items-center justify-center shadow-gold-md mb-2">
            <span className="text-2xl">🕉️</span>
          </div>

          <p className="text-xs sm:text-sm font-extrabold tracking-widest text-devotional-gold-400 uppercase">
            {FESTIVAL_CONFIG.mantraHeader}
          </p>

          <h1 className="text-3xl sm:text-5xl font-black tracking-wide text-white">
            <span className="gold-text-gradient">{FESTIVAL_CONFIG.associationName}</span>
          </h1>

          <p className="text-sm sm:text-base font-bold text-devotional-gold-200 tracking-wider">
            Ganesh Festival {FESTIVAL_CONFIG.festivalYear}
          </p>

          <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed pt-1">
            {FESTIVAL_CONFIG.heroDescription}
          </p>
        </div>

        {/* Primary Action Buttons (Entry Only With Login) */}
        <div className="w-full max-w-md space-y-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full py-4 px-6 rounded-2xl btn-gold text-devotional-blue-950 font-black text-base sm:text-lg tracking-wide shadow-gold-md flex items-center justify-center gap-2.5 transition-transform active:scale-[0.98]"
          >
            <Lock className="w-5 h-5 text-devotional-blue-950" />
            <span>Association Staff Portal (Login)</span>
            <ArrowRight className="w-5 h-5 text-devotional-blue-950" />
          </Link>

          <Link
            href="/contribute"
            className="w-full py-3.5 px-6 rounded-2xl bg-[#0c1a45]/90 hover:bg-[#122561] border border-devotional-gold-500/40 text-devotional-gold-200 hover:text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-devotional-gold-400" />
            <span>+ Enter Contribution (Staff Login Required)</span>
          </Link>
        </div>

        {/* Secondary Expense Shortcut */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/expenses"
            className="px-4 py-2 rounded-xl bg-devotional-blue-950/80 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-rose-400" />
            <span>Expense Tracker & Remaining Balance →</span>
          </Link>
        </div>

        {/* Pandal Info Footer */}
        <div className="text-[11px] text-gray-400 space-y-1 pt-4 border-t border-devotional-gold-500/10 max-w-sm">
          <p className="flex items-center justify-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-devotional-gold-400 shrink-0" />
            <span>{FESTIVAL_CONFIG.associationAddress}</span>
          </p>
          <p className="flex items-center justify-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-devotional-gold-400 shrink-0" />
            <span>Hotline: {FESTIVAL_CONFIG.contactNumber}</span>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
