'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Lock, User, AlertCircle, LogIn } from 'lucide-react';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'VOLUNTEER' | 'ADMIN'>('VOLUNTEER');
  const [username, setUsername] = useState('balaganesh');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          {/* TAB SWITCHER */}
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

          <div className="text-center space-y-1 border-b border-devotional-gold-500/20 pb-3">
            {activeTab === 'VOLUNTEER' ? (
              <>
                <h2 className="text-lg sm:text-xl font-black text-devotional-gold-300 flex items-center justify-center gap-2">
                  <span>Volunteer Portal</span>
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
                <h2 className="text-lg sm:text-xl font-black text-devotional-gold-300 flex items-center justify-center gap-2">
                  <span>Admin Portal</span>
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
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1.5">
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
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 text-base font-medium"
                />
              </div>
              {activeTab === 'VOLUNTEER' && (
                <p className="text-[10px] text-devotional-gold-300/80 mt-1">
                  Volunteer ID: <b className="font-mono text-white">balaganesh</b> (used by all association volunteers)
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1.5">
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
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 text-base font-medium"
                  autoFocus
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
                  <span>{activeTab === 'VOLUNTEER' ? '🪔 Login as Volunteer' : '🔐 Login as Admin'}</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-gray-400 border-t border-devotional-gold-500/10">
            {activeTab === 'VOLUNTEER' ? (
              <span>Are you a committee member? Switch to <b>Admin Login</b> above.</span>
            ) : (
              <span>Collecting Chanda? Switch to <b>Volunteer Login</b> above.</span>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
