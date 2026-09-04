'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Lock, User, AlertCircle, LogIn } from 'lucide-react';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
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
        setError(data.error || 'Invalid Login ID or Password.');
        setLoading(false);
        return;
      }

      // Redirect to unified Dashboard
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
        <div className="rounded-3xl border-2 border-devotional-gold-500/50 bg-[#071338]/90 backdrop-blur-md p-5 sm:p-7 shadow-2xl space-y-5">
          <div className="text-center space-y-1 border-b border-devotional-gold-500/20 pb-3">
            <h2 className="text-lg sm:text-xl font-black text-devotional-gold-300">
              Portal Login
            </h2>
            <p className="text-[11px] text-gray-300">
              Enter your credentials to access the festival portal
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
                Login ID <span className="text-amber-400 font-bold">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter Login ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 text-base font-medium"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1.5">
                Password <span className="text-amber-400 font-bold">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 text-base font-medium"
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
                  <span>Login to Portal</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
