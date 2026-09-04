/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    DATABASE_URL:
      process.env.DATABASE_URL ||
      'postgresql://postgres.msmowdflwmucdmqxvbnh:Bala%402026Ganesh@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    JWT_SECRET:
      process.env.JWT_SECRET || 'bala-ganesh-association-super-secret-jwt-key-2026',
    ADMIN_DEFAULT_USER: process.env.ADMIN_DEFAULT_USER || 'admin',
    ADMIN_DEFAULT_PASSWORD: process.env.ADMIN_DEFAULT_PASSWORD || 'Bala@2026Ganesh',
    NEXT_PUBLIC_ASSOCIATION_NAME:
      process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'BALA GANESH ASSOCIATION',
    NEXT_PUBLIC_FESTIVAL_YEAR: process.env.NEXT_PUBLIC_FESTIVAL_YEAR || '2026',
    NEXT_PUBLIC_RECEIPT_PREFIX: process.env.NEXT_PUBLIC_RECEIPT_PREFIX || 'BG2026',
    NEXT_PUBLIC_UPI_ID:
      process.env.NEXT_PUBLIC_UPI_ID || 'rajashekarchilumula1656@okaxis',
    NEXT_PUBLIC_UPI_PAYEE_NAME:
      process.env.NEXT_PUBLIC_UPI_PAYEE_NAME || 'BALA GANESH ASSOCIATION',
    NEXT_PUBLIC_ASSOCIATION_ADDRESS:
      process.env.NEXT_PUBLIC_ASSOCIATION_ADDRESS ||
      'Bhavani Nagar, Shankarpally, Telangana',
    NEXT_PUBLIC_WHATSAPP_GROUP_LINK:
      process.env.NEXT_PUBLIC_WHATSAPP_GROUP_LINK ||
      'https://chat.whatsapp.com/GNkn8pSUWtj9YWa9DInE8j',
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
};

export default nextConfig;
