'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FastContributionForm from '@/components/FastContributionForm';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';

export default function ContributePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          router.replace('/login?redirect=/contribute');
        }
      })
      .catch(() => {
        router.replace('/login?redirect=/contribute');
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400">Verifying login authorization...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between pb-24 md:pb-0">
      <Header />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-xs text-devotional-gold-300/80 hover:text-white mb-4 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <FastContributionForm onSuccess={() => {}} />
      </main>

      <Footer />
      <MobileBottomNav userRole={user?.role} userName={user?.name} />
    </div>
  );
}
