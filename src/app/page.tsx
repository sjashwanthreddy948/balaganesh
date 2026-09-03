'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FESTIVAL_CONFIG } from '@/config/festival.config';
import { Lock, User, AlertCircle, LogIn, MapPin, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; username: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check current session
  const checkSession = () => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {
        setCurrentUser(null);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  };

  useEffect(() => {
    checkSession();
  }, []);

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
        setError(data.error || 'Invalid Login ID or Password');
        setLoading(false);
        return;
      }

      // Successful login -> route to dashboard
      router.push('/dashboard');
    } catch {
      setError('Unable to reach authentication server. Please try again.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setUsername('');
    setPassword('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center space-y-6">
        {/* Sanskrit Sacred Invocation Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a1842]/80 border border-devotional-gold-500/40 shadow-gold-sm">
          <span className="text-amber-400 text-xs">🪔</span>
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-devotional-gold-200">
            {FESTIVAL_CONFIG.sanskritMantra}
          </span>
          <span className="text-amber-400 text-xs">🪔</span>
        </div>

        {/* Association Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#0c1a45] border-2 border-devotional-gold-400 flex items-center justify-center shadow-gold-md">
            <span className="text-3xl">🕉️</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-white">
            <span className="gold-text-gradient">{FESTIVAL_CONFIG.associationName}</span>
          </h1>

          <p className="text-xs sm:text-sm font-bold text-devotional-gold-200 tracking-wider">
            Ganesh Festival {FESTIVAL_CONFIG.festivalYear}
          </p>
        </div>

        {/* ACTIVE SESSION STATUS (If already logged in) */}
        {currentUser && (
          <div className="w-full rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-white">Currently Signed In: </span>
                <span className="font-bold text-devotional-gold-300">{currentUser.name}</span>{' '}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900 border border-emerald-500/30 text-emerald-200 uppercase font-black">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="py-2.5 px-3 rounded-xl btn-gold text-devotional-blue-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl bg-red-950/70 border border-red-500/40 hover:bg-red-900 text-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout / Switch</span>
              </button>
            </div>
          </div>
        )}

        {/* LOGIN ID AND PASSWORD FORM */}
        <div className="w-full rounded-3xl border-2 border-devotional-gold-500/50 bg-[#071338]/90 backdrop-blur-md p-6 sm:p-7 shadow-2xl space-y-5">
          <div className="text-center space-y-1 border-b border-devotional-gold-500/20 pb-3">
            <h2 className="text-base sm:text-lg font-black text-devotional-gold-300 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-devotional-gold-400" />
              <span>Login to Enter Website</span>
            </h2>
            <p className="text-[11px] text-gray-300">
              Enter your Login ID and password to access Chanda & Expenses
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 flex items-start gap-2 text-xs text-red-200 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-devotional-gold-200 font-semibold mb-1.5">
                Login ID (Username) <span className="text-amber-400 font-bold">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter your Login ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 text-sm font-medium focus:outline-none focus:border-devotional-gold-400"
                  autoFocus={!currentUser}
                />
              </div>
            </div>

            <div>
              <label className="block text-devotional-gold-200 font-semibold mb-1.5">
                Password <span className="text-amber-400 font-bold">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 text-sm font-medium focus:outline-none focus:border-devotional-gold-400"
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
                  <span>🕉️ Enter Website</span>
                </>
              )}
            </button>
          </form>
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
