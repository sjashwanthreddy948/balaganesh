import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FESTIVAL_CONFIG } from '@/config/festival.config';
import { Sparkles, Users, PlusCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#07112c]">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col items-center justify-center text-center">
        {/* Devotional Hero Card with Authentic Ganesh Image */}
        <div className="w-full relative rounded-3xl overflow-hidden border-2 border-devotional-gold-500/40 shadow-blue-glow bg-devotional-blue-950 mb-6 group">
          <div className="relative w-full aspect-[9/13] sm:aspect-[4/5] overflow-hidden">
            <Image
              src={FESTIVAL_CONFIG.heroImage}
              alt={`${FESTIVAL_CONFIG.associationName} Ganesh Festival`}
              fill
              priority
              className="object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-devotional-blue-950 via-devotional-blue-950/25 to-transparent" />

            {/* Glowing Diya Badge */}
            <div className="absolute top-4 left-4 bg-devotional-blue-950/85 backdrop-blur-md border border-devotional-gold-500/40 px-3 py-1 rounded-full text-xs font-bold text-devotional-gold-300 shadow-gold-sm flex items-center gap-1.5">
              <span className="text-amber-400">🪔</span> {FESTIVAL_CONFIG.festivalYear} Utsav
            </div>
          </div>

          <div className="p-5 pt-3 bg-devotional-blue-950 text-center space-y-2">
            <p className="text-sm font-bold tracking-wider text-devotional-gold-400">
              {FESTIVAL_CONFIG.mantraHeader}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {FESTIVAL_CONFIG.heroSubtitle}
            </h2>
            <p className="text-xs sm:text-sm text-devotional-gold-100/80 max-w-xs mx-auto leading-relaxed pt-1">
              {FESTIVAL_CONFIG.heroDescription}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          {/* Primary Action for on-ground Volunteer / Staff collection */}
          <Link
            href="/dashboard"
            className="w-full py-4 px-6 rounded-2xl btn-gold text-devotional-blue-950 font-black text-base sm:text-lg tracking-wide shadow-gold-md flex items-center justify-center gap-2.5 transition-transform active:scale-[0.98]"
          >
            <Users className="w-5 h-5" />
            <span>Volunteer & Staff Portal</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          {/* Quick Record Link */}
          <Link
            href="/contribute"
            className="w-full py-3.5 px-6 rounded-2xl bg-devotional-blue-900 hover:bg-devotional-blue-800 border border-devotional-gold-500/30 text-devotional-gold-200 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-devotional-gold-400" />
            <span>+ Fast Add Contribution</span>
          </Link>

          <p className="text-[11px] text-devotional-gold-200/70 max-w-xs mx-auto pt-2">
            {FESTIVAL_CONFIG.heroTagline}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
