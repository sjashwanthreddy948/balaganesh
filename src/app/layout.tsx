import type { Metadata, Viewport } from 'next';
import Image from 'next/image';
import './globals.css';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export const metadata: Metadata = {
  metadataBase: new URL('https://balaganesh.org'),
  title: `${FESTIVAL_CONFIG.associationName} | Ganesh Festival 2026`,
  description: `Official Chanda contribution & appreciation certificate platform for ${FESTIVAL_CONFIG.associationName}.`,
  keywords: ['Bala Ganesh Association', 'Ganesh Chaturthi', 'Chanda', 'Festival Contribution', 'Ganesh Pandal', 'Certificate of Appreciation', 'Expense Tracker'],
  authors: [{ name: FESTIVAL_CONFIG.associationName }],
  openGraph: {
    title: `${FESTIVAL_CONFIG.associationName} | Ganesh Festival 2026`,
    description: `Official Chanda contribution & appreciation certificate platform for ${FESTIVAL_CONFIG.associationName}.`,
    url: 'https://balaganesh.org',
    siteName: FESTIVAL_CONFIG.associationName,
    images: [
      {
        url: '/images/ganesh-landscape-pandal.jpg',
        width: 1920,
        height: 1080,
        alt: `${FESTIVAL_CONFIG.associationName} Ganesh Festival`,
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/images/ganesh-landscape-pandal.jpg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-black text-white selection:bg-devotional-gold-500 selection:text-devotional-blue-950 antialiased relative">
        {/* Fullscreen Background Layer with 75% Black Tint */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          <Image
            src="/images/ganesh-landscape-pandal.jpg"
            alt="Bala Ganesh Pandal Background"
            fill
            priority
            className="object-cover object-center transform scale-100"
          />
          {/* 75% Black Tint Overlay */}
          <div className="absolute inset-0 bg-black/75" />
          
          {/* Subtle Warm Golden Accent from Top Chandelier */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-radial from-amber-400/15 via-transparent to-transparent pointer-events-none" />
        </div>

        {children}
      </body>
    </html>
  );
}
