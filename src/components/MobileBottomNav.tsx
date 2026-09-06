'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  FileText,
  Menu,
  X,
  LogOut,
  FileSpreadsheet,
  PieChart,
  Shield,
  Coins,
  Mail,
} from 'lucide-react';

interface MobileBottomNavProps {
  userRole?: string;
  userName?: string;
  onOpenFinancialSummary?: () => void;
  onOpenExport?: () => void;
}

export default function MobileBottomNav({
  userRole = 'ADMIN',
  userName = 'Association Admin',
  onOpenFinancialSummary,
  onOpenExport,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Do not show navigation on login or home pages
  if (pathname === '/' || pathname === '/login') {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      label: 'Add Chanda',
      href: '/contribute',
      icon: PlusCircle,
      isPrimary: true,
      isActive: pathname === '/contribute',
    },
    {
      label: 'Expenses',
      href: '/expenses',
      icon: Receipt,
      isActive: pathname === '/expenses',
    },
    {
      label: 'Records',
      href: '/dashboard#chanda-list',
      icon: FileText,
      isActive: false,
    },
  ];

  return (
    <>
      {/* Fixed Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#050c24]/95 backdrop-blur-xl border-t border-devotional-gold-500/30 px-2 py-1 shadow-[0_-8px_20px_rgba(0,0,0,0.6)]"
        style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around">
          {/* Item 1: Dashboard */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center min-w-[50px] py-1.5 px-1.5 rounded-xl transition-all active:scale-95 ${
              pathname === '/dashboard'
                ? 'text-devotional-gold-300 font-extrabold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <LayoutDashboard className="w-5 h-5" />
              {pathname === '/dashboard' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-devotional-gold-400" />
              )}
            </div>
            <span className="text-[10px] mt-1 font-semibold">Chanda</span>
          </Link>

          {/* Item 2: Laddu Hub */}
          <Link
            href="/laddu"
            className={`flex flex-col items-center justify-center min-w-[50px] py-1.5 px-1.5 rounded-xl transition-all active:scale-95 ${
              pathname === '/laddu'
                ? 'text-amber-300 font-extrabold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <Coins className="w-5 h-5" />
              {pathname === '/laddu' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </div>
            <span className="text-[10px] mt-1 font-semibold">Laddu</span>
          </Link>

          {/* Item 3: Add Chanda (Prominent Elevated Action Button) */}
          <Link
            href="/contribute"
            className="flex flex-col items-center justify-center -mt-4 group active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-devotional-gold-400 to-amber-200 text-devotional-blue-950 flex items-center justify-center shadow-[0_4px_18px_rgba(223,177,53,0.5)] border-2 border-white/40">
              <PlusCircle className="w-6 h-6 text-devotional-blue-950" />
            </div>
            <span className="text-[9px] mt-1 font-extrabold text-devotional-gold-300 tracking-tight">
              + Chanda
            </span>
          </Link>

          {/* Item 4: Expenses */}
          <Link
            href="/expenses"
            className={`flex flex-col items-center justify-center min-w-[50px] py-1.5 px-1.5 rounded-xl transition-all active:scale-95 ${
              pathname === '/expenses'
                ? 'text-devotional-gold-300 font-extrabold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <Receipt className="w-5 h-5" />
              {pathname === '/expenses' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-devotional-gold-400" />
              )}
            </div>
            <span className="text-[10px] mt-1 font-semibold">Expenses</span>
          </Link>

          {/* Item 5: Menu / More */}
          <button
            type="button"
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center justify-center min-w-[50px] py-1.5 px-1.5 rounded-xl text-gray-400 hover:text-devotional-gold-300 transition-all active:scale-95"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-semibold">Menu</span>
          </button>
        </div>
      </nav>

      {/* Slide-up Menu Drawer */}
      {showMoreMenu && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl bg-[#06102f] border-t-2 border-devotional-gold-500/40 p-5 space-y-4 shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-devotional-blue-900 border border-devotional-gold-400 flex items-center justify-center text-devotional-gold-300">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{userName}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-devotional-gold-500 text-devotional-blue-950 font-black">
                    {userRole}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="p-2 rounded-xl bg-devotional-blue-900 text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link
                href="/dashboard"
                onClick={() => setShowMoreMenu(false)}
                className="p-3.5 rounded-2xl bg-devotional-blue-900/60 border border-devotional-gold-500/30 flex items-center gap-3 text-xs font-bold text-white hover:bg-devotional-blue-800 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-devotional-gold-400 shrink-0" />
                <span>Chanda Hub</span>
              </Link>

              <Link
                href="/laddu"
                onClick={() => setShowMoreMenu(false)}
                className="p-3.5 rounded-2xl bg-devotional-blue-900/60 border border-amber-500/30 flex items-center gap-3 text-xs font-bold text-white hover:bg-devotional-blue-800 transition-colors"
              >
                <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Laddu Payments</span>
              </Link>

              <Link
                href="/expenses"
                onClick={() => setShowMoreMenu(false)}
                className="p-3.5 rounded-2xl bg-devotional-blue-900/60 border border-devotional-gold-500/30 flex items-center gap-3 text-xs font-bold text-white hover:bg-devotional-blue-800 transition-colors"
              >
                <Receipt className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Expenses Tracker</span>
              </Link>

              <Link
                href="/contribute"
                onClick={() => setShowMoreMenu(false)}
                className="p-3.5 rounded-2xl bg-devotional-blue-900/60 border border-devotional-gold-500/30 flex items-center gap-3 text-xs font-bold text-white hover:bg-devotional-blue-800 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+ Add Chanda</span>
              </Link>

              <Link
                href="/invitations"
                onClick={() => setShowMoreMenu(false)}
                className="p-3.5 rounded-2xl bg-devotional-blue-900/60 border border-emerald-500/30 flex items-center gap-3 text-xs font-bold text-white hover:bg-devotional-blue-800 transition-colors"
              >
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Invitations Studio</span>
              </Link>

              <a
                href="/api/admin/export"
                download="bala-ganesh-chanda-2026.csv"
                onClick={() => setShowMoreMenu(false)}
                className="p-3.5 rounded-2xl bg-devotional-blue-900/60 border border-devotional-gold-500/30 flex items-center gap-3 text-xs font-bold text-white hover:bg-devotional-blue-800 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-devotional-gold-400 shrink-0" />
                <span>Export CSV</span>
              </a>
            </div>

            {/* Logout Button */}
            <div className="pt-2 border-t border-devotional-gold-500/20">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Association Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
