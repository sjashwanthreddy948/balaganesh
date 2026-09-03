import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FESTIVAL_CONFIG } from '@/config/festival.config';

export const metadata: Metadata = {
  metadataBase: new URL('https://balaganesh.org'),
  title: `${FESTIVAL_CONFIG.associationName} | Ganesh Festival Chanda`,
  description: `Contribute to ${FESTIVAL_CONFIG.associationName} Ganesh Festival Chanda and support our celebration.`,
  keywords: ['Bala Ganesh Association', 'Ganesh Chaturthi', 'Chanda', 'Festival Contribution', 'Ganesh Pandal', 'UPI Chanda'],
  authors: [{ name: FESTIVAL_CONFIG.associationName }],
  openGraph: {
    title: `${FESTIVAL_CONFIG.associationName} | Ganesh Festival Chanda`,
    description: `Contribute to ${FESTIVAL_CONFIG.associationName} Ganesh Festival Chanda and support our celebration.`,
    url: 'https://balaganesh.org',
    siteName: FESTIVAL_CONFIG.associationName,
    images: [
      {
        url: '/images/ganesh-festival.jpg',
        width: 800,
        height: 1200,
        alt: `${FESTIVAL_CONFIG.associationName} Ganesh Festival`,
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/images/ganesh-festival.jpg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#07112c',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#07112c] text-white selection:bg-devotional-gold-500 selection:text-devotional-blue-950 antialiased">
        {children}
      </body>
    </html>
  );
}
