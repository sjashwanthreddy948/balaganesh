'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07112c]">
      <div className="w-8 h-8 border-2 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
