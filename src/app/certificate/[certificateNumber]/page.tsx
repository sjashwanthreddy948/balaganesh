'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LandscapeCertificate, { CertificateData } from '@/components/LandscapeCertificate';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, AlertCircle, PlusCircle } from 'lucide-react';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export default function CertificateViewPage() {
  const params = useParams();
  const router = useRouter();
  const certNumber = (params?.certificateNumber as string)?.toUpperCase();

  const [certData, setCertData] = useState<CertificateData | null>(null);
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

  const fetchCertificate = async () => {
    if (!certNumber) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contributions/${certNumber}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setCertData(json.data);
      } else {
        setError(json.error || 'Certificate not found');
      }
    } catch {
      setError('Unable to load certificate. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificate();
  }, [certNumber]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#07112c] pb-24 md:pb-0">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-devotional-gold-300/80 hover:text-white transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={fetchCertificate}
            className="p-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white text-xs flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center gap-3 text-devotional-gold-300">
            <div className="w-8 h-8 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold">Loading Landscape Certificate...</p>
          </div>
        ) : error || !certData ? (
          <div className="rounded-3xl border border-red-500/30 bg-devotional-blue-900/60 p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 border border-red-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Certificate Not Found</h2>
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
              <h1 className="text-xl sm:text-2xl font-black text-devotional-gold-300">
                Certificate of Appreciation
              </h1>
              <p className="text-xs text-gray-400 font-mono">
                {certData.certificateNumber} • {FESTIVAL_CONFIG.associationName}
              </p>
            </div>

            {/* 16:9 Landscape Certificate */}
            <LandscapeCertificate data={certData} />

            <div className="pt-4 text-center">
              <button
                onClick={() => router.push('/contribute')}
                className="px-6 py-3 rounded-2xl bg-devotional-blue-900 hover:bg-devotional-blue-800 border border-devotional-gold-500/40 text-devotional-gold-200 hover:text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-devotional-gold-400" />
                <span>Record Another Contribution</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
      {user && <MobileBottomNav userRole={user.role} userName={user.name} />}
    </div>
  );
}
