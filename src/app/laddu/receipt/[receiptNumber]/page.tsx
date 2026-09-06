'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LadduReceipt, { LadduReceiptData } from '@/components/LadduReceipt';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, AlertCircle, Coins } from 'lucide-react';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export default function LadduReceiptViewPage() {
  const params = useParams();
  const router = useRouter();
  const receiptNumber = (params?.receiptNumber as string)?.toUpperCase();

  const [receiptData, setReceiptData] = useState<LadduReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ role: string; name: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const fetchReceipt = async () => {
    if (!receiptNumber) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/laddu/receipt/${receiptNumber}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setReceiptData(json.data);
      } else {
        setError(json.error || 'Laddu receipt not found');
      }
    } catch {
      setError('Unable to load receipt. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [receiptNumber]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#07112c] pb-24 md:pb-0">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(user ? '/laddu' : '/')}
            className="flex items-center gap-1.5 text-xs text-devotional-gold-300/80 hover:text-white transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{user ? 'Laddu Dashboard' : 'Home'}</span>
          </button>

          <button
            onClick={fetchReceipt}
            className="p-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white text-xs flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center gap-3 text-devotional-gold-300">
            <div className="w-8 h-8 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold">Loading Official Laddu Receipt...</p>
          </div>
        ) : error || !receiptData ? (
          <div className="rounded-3xl border border-red-500/30 bg-devotional-blue-900/60 p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 border border-red-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Laddu Receipt Not Found</h2>
            <p className="text-xs text-gray-300">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-xl btn-gold text-devotional-blue-950 font-bold text-xs"
            >
              Return Home
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full">
                Laddu Payment Receipt
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-devotional-gold-300 pt-1">
                {FESTIVAL_CONFIG.associationName}
              </h1>
              <p className="text-xs text-gray-400 font-mono">
                {receiptData.receiptNumber} • Laddu Year {receiptData.ladduYear}
              </p>
            </div>

            {/* Official 16:9 Laddu Receipt Canvas Component */}
            <LadduReceipt data={receiptData} />

            {user && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => router.push('/laddu')}
                  className="px-6 py-3 rounded-2xl bg-devotional-blue-900 hover:bg-devotional-blue-800 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>View All Laddu Collections</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
      {user && <MobileBottomNav userRole={user.role} userName={user.name} />}
    </div>
  );
}
