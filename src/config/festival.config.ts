import { normalizeIndianMobileForWhatsApp } from '@/lib/validation';

export const FESTIVAL_CONFIG = {
  associationName: process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'BALA GANESH ASSOCIATION',
  upiId: process.env.NEXT_PUBLIC_UPI_ID || 'rajashekarchilumula1656@okaxis',
  upiPayeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME || 'BALA GANESH ASSOCIATION',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210',
  contactNumber: process.env.NEXT_PUBLIC_CONTACT_NUMBER || '+91 98765 43210',
  associationAddress:
    process.env.NEXT_PUBLIC_ASSOCIATION_ADDRESS || 'Bhavani Nagar, Shankarpally, Telangana',
  festivalYear: process.env.NEXT_PUBLIC_FESTIVAL_YEAR || '2026',
  receiptPrefix: process.env.NEXT_PUBLIC_RECEIPT_PREFIX || 'BG2026',

  whatsappGroupLink:
    process.env.WHATSAPP_GROUP_INVITE_URL ||
    process.env.NEXT_PUBLIC_WHATSAPP_GROUP_LINK ||
    'https://chat.whatsapp.com/GNkn8pSUWtj9YWa9DInE8j',

  // Pre-configured quick donation chips
  quickAmounts: [100, 200, 500, 1000, 2000],
  defaultAmount: 500,
  minAmount: 10,
  maxAmount: 1000000,

  // Images
  heroImage: '/images/ganesh-landscape-pandal.jpg',
  pandalLandscapeImage: '/images/ganesh-landscape-pandal.jpg',
  portraitPandalImage: '/images/ganesh-festival.jpg',
  bannerImage: '/images/ganesh-banner.jpg',
  officialStampRedImage: '/images/bala-ganesh-stamp-red.png',
  officialStampBlueImage: '/images/bala-ganesh-stamp-blue.png',

  // Devotional mantras & strings
  sanskritMantra: 'ॐ गं गणपतये नमः • वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ',
  mantraHeader: '🙏 Ganpati Bappa Morya 🙏',
  heroSubtitle: 'Ganesh Festival Chanda',
  heroDescription:
    'Your contribution helps us celebrate and organize the Ganesh festival together.',
  heroTagline: 'Every contribution, big or small, helps make the celebration more special.',
};

/**
 * Universal UPI URI for immediate scan & pay
 */
export function buildUpiUri(amount: number, note?: string): string {
  const upiId = encodeURIComponent(FESTIVAL_CONFIG.upiId);
  const payeeName = encodeURIComponent(FESTIVAL_CONFIG.upiPayeeName);
  const formattedAmount = encodeURIComponent(amount.toFixed(2));
  const transactionNote = encodeURIComponent(
    note || `Chanda - ${FESTIVAL_CONFIG.associationName}`
  );

  return `upi://pay?pa=${upiId}&pn=${payeeName}&am=${formattedAmount}&cu=INR&tn=${transactionNote}`;
}

/**
 * Builds standard WhatsApp Certificate Share Message with official Ganesh WhatsApp group link
 */
export function buildWhatsAppCertificateMessage(contribution: {
  fullName: string;
  amount: number;
  paymentMethod?: string;
  certificateNumber: string;
  certificateUrl?: string;
}): string {
  const certUrl =
    contribution.certificateUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/certificate/${contribution.certificateNumber}`
      : `https://balaganesh.vercel.app/certificate/${contribution.certificateNumber}`);

  return `Namaste ${contribution.fullName} 🙏

Thank you for your valuable contribution of ₹${contribution.amount.toLocaleString('en-IN')} to Bala Ganesh Association for Ganesh Festival ${FESTIVAL_CONFIG.festivalYear}.

Certificate No: ${contribution.certificateNumber}

We sincerely appreciate your support.

Your Certificate of Appreciation:
${certUrl}

Ganpati Bappa Morya! 🙏

— ${FESTIVAL_CONFIG.associationName}`;
}

/**
 * Builds standard WhatsApp Share URL for Certificate of Appreciation
 * Formats donor name, amount, payment method, certificate number, and link with +91 phone number
 */
export function buildWhatsAppCertificateShareUrl(contribution: {
  fullName: string;
  amount: number;
  paymentMethod: string;
  certificateNumber: string;
  mobileNumber?: string | null;
  certificateUrl?: string;
}): string {
  const message = buildWhatsAppCertificateMessage(contribution);
  const normalized = normalizeIndianMobileForWhatsApp(contribution.mobileNumber);
  const phoneParam = normalized ? `phone=${normalized.whatsappPhone}&` : '';

  return `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(message)}`;
}

/**
 * Alias for legacy receipt share URL
 */
export function buildWhatsAppShareUrl(contribution: {
  fullName: string;
  amount: number;
  receiptNumber: string;
  utr?: string;
}): string {
  return buildWhatsAppCertificateShareUrl({
    fullName: contribution.fullName,
    amount: contribution.amount,
    paymentMethod: 'ONLINE',
    certificateNumber: contribution.receiptNumber,
  });
}

