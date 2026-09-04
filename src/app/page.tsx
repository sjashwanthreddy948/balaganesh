'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FESTIVAL_CONFIG } from '@/config/festival.config';
import { Lock, User, AlertCircle, LogIn, MapPin } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'VOLUNTEER' | 'ADMIN'>('VOLUNTEER');
  const [username, setUsername] = useState('balaganesh');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchTab = (tab: 'VOLUNTEER' | 'ADMIN') => {
    setActiveTab(tab);
    setError(null);
    setPassword('');
    if (tab === 'VOLUNTEER') {
      setUsername('balaganesh');
    } else {
      setUsername('admin');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || `Invalid ${activeTab === 'VOLUNTEER' ? 'Volunteer' : 'Admin'} Password.`);
        setLoading(false);
        return;
      }

      // Successful login -> route directly into Chanda Dashboard
      window.location.href = '/dashboard';
    } catch {
      setError('Unable to reach authentication server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 sm:py-10 flex flex-col items-center justify-center space-y-5">
        {/* Sanskrit Sacred Invocation Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a1842]/80 border border-devotional-gold-500/40 shadow-gold-sm">
          <span className="text-amber-400 text-xs">🪔</span>
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-devotional-gold-200">
            {FESTIVAL_CONFIG.sanskritMantra}
          </span>
          <span className="text-amber-400 text-xs">🪔</span>
        </div>

        {/* Association Branding */}
        <div className="text-center space-y-1.5">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#0c1a45] border-2 border-devotional-gold-400 flex items-center justify-center shadow-gold-md">
            <span className="text-3xl">🕉️</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-white">
            <span className="gold-text-gradient">{FESTIVAL_CONFIG.associationName}</span>
          </h1>

          <p className="text-xs sm:text-sm font-bold text-devotional-gold-200 tracking-wider">
            Ganesh Festival {FESTIVAL_CONFIG.festivalYear} • Chanda Portal
          </p>
        </div>

        {/* SEPARATED LOGIN PORTAL CONTAINER */}
        <div className="w-full rounded-3xl border-2 border-devotional-gold-500/50 bg-[#071338]/90 backdrop-blur-md p-5 sm:p-7 shadow-2xl space-y-5">
          {/* TAB SWITCHER: VOLUNTEER vs ADMIN */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-devotional-blue-950 border border-devotional-gold-500/30">
            <button
              type="button"
              onClick={() => switchTab('VOLUNTEER')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'VOLUNTEER'
                  ? 'bg-devotional-gold-500 text-devotional-blue-950 shadow-gold-sm scale-[1.02]'
                  : 'text-devotional-gold-200 hover:text-white'
              }`}
            >
              <span>🪔</span>
              <span>VOLUNTEER</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('ADMIN')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ADMIN'
                  ? 'bg-devotional-gold-500 text-devotional-blue-950 shadow-gold-sm scale-[1.02]'
                  : 'text-devotional-gold-200 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>ADMIN</span>
            </button>
          </div>

          {/* TAB HEADER */}
          <div className="text-center space-y-1 border-b border-devotional-gold-500/20 pb-3">
            {activeTab === 'VOLUNTEER' ? (
              <>
                <h2 className="text-base sm:text-lg font-black text-devotional-gold-300 flex items-center justify-center gap-2">
                  <span>Volunteer Access</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-devotional-gold-500/20 text-devotional-gold-300 border border-devotional-gold-500/40">
                    Shared ID
                  </span>
                </h2>
                <p className="text-[11px] text-gray-300">
                  Shared access for all volunteers to collect Chanda & add expenses
                </p>
              </>
            ) : (
              <>
                <h2 className="text-base sm:text-lg font-black text-devotional-gold-300 flex items-center justify-center gap-2">
                  <span>Admin Access</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Full Control
                  </span>
                </h2>
                <p className="text-[11px] text-gray-300">
                  Restricted to authorized association committee members
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-devotional-gold-200 font-semibold mb-1 text-xs">
                {activeTab === 'VOLUNTEER' ? 'Shared Volunteer ID' : 'Admin Login ID'}{' '}
                <span className="text-amber-400 font-bold">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder={activeTab === 'VOLUNTEER' ? 'balaganesh' : 'admin'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 text-base font-medium focus:outline-none focus:border-devotional-gold-400"
                />
              </div>
              {activeTab === 'VOLUNTEER' && (
                <p className="text-[10px] text-devotional-gold-300/80 mt-1">
                  Volunteer ID: <b className="font-mono text-white">balaganesh</b> (used by all association volunteers)
                </p>
              )}
            </div>

            <div>
              <label className="block text-devotional-gold-200 font-semibold mb-1 text-xs">
                {activeTab === 'VOLUNTEER' ? 'Volunteer Password' : 'Admin Password'}{' '}
                <span className="text-amber-400 font-bold">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder={activeTab === 'VOLUNTEER' ? 'Enter Volunteer Password' : 'Enter Admin Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 text-base font-medium focus:outline-none focus:border-devotional-gold-400"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl btn-gold text-devotional-blue-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-gold-sm transition-transform active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-devotional-blue-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{activeTab === 'VOLUNTEER' ? '🪔 Login as Volunteer' : '🔐 Login as Admin'}</span>
                </>
              )}
            </button>
          </form>

          {/* Volunteer / Admin Quick Toggle Footer Note */}
          <div className="pt-2 text-center text-[11px] text-gray-400 border-t border-devotional-gold-500/10">
            {activeTab === 'VOLUNTEER' ? (
              <span>Are you a committee member? Switch to <b>Admin Login</b> above.</span>
            ) : (
              <span>Collecting Chanda? Switch to <b>Volunteer Login</b> above.</span>
            )}
          </div>
        </div>

        {/* Pandal Info Footer */}
        <div className="text-[11px] text-gray-400 space-y-1 pt-2 max-w-sm text-center">
          <p className="flex items-center justify-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-devotional-gold-400 shrink-0" />
            <span>{FESTIVAL_CONFIG.associationAddress}</span>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
