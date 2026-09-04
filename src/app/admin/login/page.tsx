'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Lock, User, AlertCircle, LogIn, ShieldAlert } from 'lucide-react';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setError(data.error || 'Invalid Admin Credentials.');
        setLoading(false);
        return;
      }

      // Successful admin login
      window.location.href = '/dashboard';
    } catch {
      setError('Unable to reach authentication server.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center space-y-5">
        <div className="rounded-3xl border-2 border-rose-500/40 bg-[#071338]/95 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2 border-b border-rose-500/20 pb-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-7 h-7 text-rose-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-rose-300">
              Association Admin Portal
            </h1>
            <p className="text-xs text-gray-300">
              {FESTIVAL_CONFIG.associationName} • Committee Access Only
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
                Admin ID <span className="text-amber-400 font-bold">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter Admin ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-rose-400 text-base font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1.5">
                Admin Password <span className="text-amber-400 font-bold">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Enter Admin Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-rose-400 text-base font-medium"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Admin Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>🔐 Sign In as Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-gray-400 border-t border-rose-500/20">
            <span>Volunteer collecting Chanda? </span>
            <Link href="/" className="text-devotional-gold-300 hover:underline font-bold">
              Switch to Volunteer Portal →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
