'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FESTIVAL_CONFIG } from '@/config/festival.config';
import { User, LogIn, LayoutDashboard } from 'lucide-react';

export default function Header() {
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
    <header className="w-full border-b border-devotional-gold-500/20 bg-devotional-blue-950/85 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full border border-devotional-gold-500/50 bg-devotional-blue-900 overflow-hidden flex items-center justify-center shadow-gold-sm">
            <span className="text-devotional-gold-400 text-lg font-bold">🕉️</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-wider uppercase text-devotional-gold-400 group-hover:text-devotional-gold-300 transition-colors">
              {FESTIVAL_CONFIG.associationName}
            </h1>
            <p className="text-[10px] text-devotional-gold-100/70 font-medium tracking-wide">
              {FESTIVAL_CONFIG.festivalYear} Ganesh Utsav Chanda
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/40 text-devotional-gold-300 hover:text-white text-xs font-bold transition-all shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-devotional-gold-500 text-devotional-blue-950 ml-1 font-black">
                {user.role}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs font-bold text-devotional-gold-300 hover:text-white px-3 py-1.5 rounded-xl border border-devotional-gold-500/30 bg-devotional-blue-900/60 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-devotional-gold-400" />
              <span>Staff Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
