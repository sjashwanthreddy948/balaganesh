'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FESTIVAL_CONFIG } from '@/config/festival.config';
import { Lock, User, AlertCircle, LogIn, MapPin } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // If already logged in, enter website directly to /dashboard
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          router.replace('/dashboard');
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, [router]);

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

      // Enter website: redirect to Dashboard
      router.push('/dashboard');
    } catch {
      setError('Unable to reach login service. Please try again.');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400">Loading website entrance...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

        {/* LOGIN ID AND PASSWORD FORM TO ENTER WEBSITE */}
        <div className="w-full rounded-3xl border-2 border-devotional-gold-500/50 bg-[#071338]/90 backdrop-blur-md p-6 sm:p-7 shadow-2xl space-y-5">
          <div className="text-center space-y-1 border-b border-devotional-gold-500/20 pb-3">
            <h2 className="text-base sm:text-lg font-black text-devotional-gold-300 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-devotional-gold-400" />
              <span>Enter Login to Access Website</span>
            </h2>
            <p className="text-[11px] text-gray-300">
              Please enter your login ID and password to proceed
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
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 text-sm font-medium focus:outline-none focus:border-devotional-gold-400"
                  autoFocus
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
                  placeholder="••••••••"
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

          {/* Quick Credentials Info Box */}
          <div className="bg-devotional-blue-950/80 border border-devotional-gold-500/20 rounded-xl p-3 text-[11px] text-gray-400 space-y-1">
            <p className="font-semibold text-devotional-gold-300">Default Access Credentials:</p>
            <p>• <b>Login ID:</b> <code className="text-white">admin</code></p>
            <p>• <b>Password:</b> <code className="text-white">BalaGaneshAdmin@2026</code></p>
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
