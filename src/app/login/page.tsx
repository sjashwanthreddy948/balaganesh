'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Lock, User, AlertCircle, LogIn, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; username: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
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
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      // Redirect to unified Dashboard
      router.push('/dashboard');
    } catch {
      setError('Unable to reach authentication server.');
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

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-10 flex flex-col justify-center space-y-5">
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

        <div className="rounded-3xl border-2 border-devotional-gold-500/40 bg-devotional-blue-900/70 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-devotional-gold-500/20 border-2 border-devotional-gold-400 flex items-center justify-center shadow-gold-sm">
              <Lock className="w-7 h-7 text-devotional-gold-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-devotional-gold-300">
              Staff & Admin Login
            </h2>
            <p className="text-xs text-gray-300">
              {FESTIVAL_CONFIG.associationName} • {FESTIVAL_CONFIG.festivalYear}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1.5">
                Login ID (Username)
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 text-sm font-medium"
                  autoFocus={!currentUser}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-2xl btn-gold text-devotional-blue-950 font-black text-base flex items-center justify-center gap-2 shadow-gold-sm active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-devotional-blue-950 border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Helper Credentials Box for Easy Reference */}
          <div className="bg-devotional-blue-950/80 border border-devotional-gold-500/20 rounded-2xl p-3 text-[11px] text-gray-400 space-y-1">
            <p className="font-semibold text-devotional-gold-300">Default Access Credentials:</p>
            <p>• <b>Login ID:</b> <code className="text-white">admin</code></p>
            <p>• <b>Password:</b> <code className="text-white">BalaGaneshAdmin@2026</code></p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
