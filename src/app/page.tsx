import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FESTIVAL_CONFIG } from '@/config/festival.config';
import { Users, PlusCircle, ArrowRight, Sparkles, Phone, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col items-center justify-center text-center">
        {/* Sanskrit Sacred Invocation Pill */}
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a1842]/80 border border-devotional-gold-500/40 shadow-gold-sm">
          <span className="text-amber-400 text-xs">🪔</span>
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-devotional-gold-200">
            {FESTIVAL_CONFIG.sanskritMantra}
          </span>
          <span className="text-amber-400 text-xs">🪔</span>
        </div>

        {/* Hero Card with Authentic 16:9 Landscape Pandal Image */}
        <div className="w-full relative rounded-3xl overflow-hidden border-2 border-devotional-gold-500/50 shadow-2xl bg-[#07112c]/90 backdrop-blur-md mb-6 group">
          {/* Authentic 16:9 Landscape Pandal Photo */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden">
            <Image
              src={FESTIVAL_CONFIG.pandalLandscapeImage}
              alt={`${FESTIVAL_CONFIG.associationName} Ganesh Pandal`}
              fill
              priority
              className="object-cover object-center transform group-hover:scale-[1.03] transition-transform duration-700"
            />
            {/* Soft Royal Blue Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07112c] via-[#07112c]/30 to-transparent" />

            {/* Glowing Festival Diya Badge */}
            <div className="absolute top-3.5 left-3.5 bg-[#050b1d]/85 backdrop-blur-md border border-devotional-gold-500/50 px-3 py-1 rounded-full text-xs font-bold text-devotional-gold-300 shadow-gold-sm flex items-center gap-1.5">
              <span>🕉️</span>
              <span>{FESTIVAL_CONFIG.festivalYear} Utsav</span>
            </div>
          </div>

          <div className="p-6 pt-3 space-y-2.5">
            <p className="text-xs sm:text-sm font-bold tracking-widest text-devotional-gold-400 uppercase">
              {FESTIVAL_CONFIG.mantraHeader}
            </p>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-wide">
              {FESTIVAL_CONFIG.associationName}
            </h2>
            <p className="text-xs sm:text-sm text-devotional-gold-100/85 max-w-lg mx-auto leading-relaxed">
              {FESTIVAL_CONFIG.heroDescription}
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full space-y-3.5 max-w-md">
          {/* Volunteer & Staff Portal CTA */}
          <Link
            href="/dashboard"
            className="w-full py-4 px-6 rounded-2xl btn-gold text-devotional-blue-950 font-black text-base sm:text-lg tracking-wide shadow-gold-md flex items-center justify-center gap-2.5 transition-transform active:scale-[0.98]"
          >
            <Users className="w-5 h-5 text-devotional-blue-950" />
            <span>Volunteer & Staff Portal</span>
            <ArrowRight className="w-5 h-5 text-devotional-blue-950" />
          </Link>

          {/* Rapid Add Contribution Link */}
          <Link
            href="/contribute"
            className="w-full py-3.5 px-6 rounded-2xl bg-[#0c1a45]/90 hover:bg-[#122561] border border-devotional-gold-500/40 text-devotional-gold-200 hover:text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-devotional-gold-400" />
            <span>+ Fast Add Contribution (Cash / Online)</span>
          </Link>

          {/* Subtext Tagline */}
          <p className="text-[11px] text-devotional-gold-200/70 max-w-xs mx-auto pt-1">
            {FESTIVAL_CONFIG.heroTagline}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
