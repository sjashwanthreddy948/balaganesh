'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FESTIVAL_CONFIG } from '@/config/festival.config';
import { LogIn, LayoutDashboard, Receipt, Coins } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="w-full border-b border-devotional-gold-500/20 bg-[#050b1d]/85 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full border border-devotional-gold-500/50 bg-[#0c1a45] overflow-hidden flex items-center justify-center shadow-gold-sm">
            <span className="text-devotional-gold-400 text-lg font-bold">🕉️</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-wider uppercase text-devotional-gold-400 group-hover:text-devotional-gold-300 transition-colors">
              {FESTIVAL_CONFIG.associationName}
            </h1>
            <p className="text-[10px] text-devotional-gold-100/70 font-medium tracking-wide">
              {FESTIVAL_CONFIG.festivalYear} Ganesh Utsav Management
            </p>
          </div>
        </Link>

        {/* Removed from home page per user request */}
        {!isHomePage && (
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/40 text-devotional-gold-300 hover:text-white text-xs font-bold transition-all shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chanda</span>
                </Link>

                <Link
                  href="/laddu"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-devotional-blue-900 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Laddu</span>
                </Link>

                <Link
                  href="/expenses"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/40 text-devotional-gold-300 hover:text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Receipt className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Expenses</span>
                </Link>

                <span className="text-[9px] px-2 py-1 rounded-full bg-devotional-gold-500 text-devotional-blue-950 font-black ml-1">
                  {user.role}
                </span>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-xs font-bold text-devotional-gold-300 hover:text-white px-3 py-1.5 rounded-xl border border-devotional-gold-500/30 bg-devotional-blue-900/60 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-devotional-gold-400" />
                <span>Login</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
