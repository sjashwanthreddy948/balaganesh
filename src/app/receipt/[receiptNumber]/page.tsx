'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReceiptCanvas, { ReceiptData } from '@/components/ReceiptCanvas';
import { FESTIVAL_CONFIG, buildWhatsAppShareUrl } from '@/config/festival.config';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';

export default function ReceiptLookupPage() {
  const params = useParams();
  const router = useRouter();
  const receiptNumber = (params?.receiptNumber as string)?.toUpperCase();

  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipt = async () => {
    if (!receiptNumber) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contributions/${receiptNumber}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setReceiptData(json.data);
      } else {
        setError(json.error || 'Receipt not found');
      }
    } catch {
      setError('Unable to load receipt. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [receiptNumber]);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-xs font-medium text-devotional-gold-300/80 hover:text-devotional-gold-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center gap-3 text-devotional-gold-300">
            <div className="w-8 h-8 border-2 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Fetching Chanda Receipt {receiptNumber}...</p>
          </div>
        ) : error || !receiptData ? (
          <div className="rounded-3xl border border-red-500/30 bg-devotional-blue-900/60 p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 border border-red-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Receipt Not Found</h2>
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-devotional-gold-300">
                  Chanda Receipt
                </h2>
                <p className="text-xs text-gray-400">
                  Receipt ID: <span className="font-mono text-white">{receiptData.receiptNumber}</span>
                </p>
              </div>

              <button
                onClick={fetchReceipt}
                className="p-2 rounded-lg bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-devotional-gold-200 text-xs flex items-center gap-1"
                title="Refresh Status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Receipt Canvas */}
            <ReceiptCanvas data={receiptData} />

            {/* WhatsApp Share CTA */}
            <div className="space-y-3">
              <a
                href={buildWhatsAppShareUrl({
                  fullName: receiptData.fullName,
                  amount: receiptData.amount,
                  receiptNumber: receiptData.receiptNumber,
                  utr: receiptData.utr,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>📲 Share on WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
