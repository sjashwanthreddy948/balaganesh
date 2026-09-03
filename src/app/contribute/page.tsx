'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FastContributionForm from '@/components/FastContributionForm';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function ContributePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#07112c]">
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
    </div>
  );
}
