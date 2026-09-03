export const FESTIVAL_CONFIG = {
  associationName: process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'BALA GANESH ASSOCIATION',
  upiId: process.env.NEXT_PUBLIC_UPI_ID || 'balaganesh@upi',
  upiPayeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME || 'BALA GANESH ASSOCIATION',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210',
  contactNumber: process.env.NEXT_PUBLIC_CONTACT_NUMBER || '+91 98765 43210',
  associationAddress:
    process.env.NEXT_PUBLIC_ASSOCIATION_ADDRESS || 'Main Road, Ganesh Pandal Ground, Hyderabad, Telangana',
  festivalYear: process.env.NEXT_PUBLIC_FESTIVAL_YEAR || '2026',
  receiptPrefix: process.env.NEXT_PUBLIC_RECEIPT_PREFIX || 'BG2026',

  // Pre-configured quick donation chips
  quickAmounts: [100, 200, 500, 1000, 2000],
  defaultAmount: 500,
  minAmount: 10,
  maxAmount: 1000000,

  // Images
  heroImage: '/images/ganesh-festival.jpg',
  bannerImage: '/images/ganesh-banner.jpg',

  // Devotional mantras & strings
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
 * Builds standard WhatsApp Share URL for Certificate of Appreciation
 */
export function buildWhatsAppCertificateShareUrl(contribution: {
  fullName: string;
  amount: number;
  paymentMethod: string;
  certificateNumber: string;
  mobileNumber?: string | null;
}): string {
  const message = `🙏 *${FESTIVAL_CONFIG.associationName}*

Thank you *${contribution.fullName}* for your valuable contribution towards our Ganesh Festival.

*Contribution:* ₹${contribution.amount.toLocaleString('en-IN')}
*Payment Method:* ${contribution.paymentMethod}
*Certificate No:* ${contribution.certificateNumber}

Ganpati Bappa Morya! 🙏`;

  const targetNumber = contribution.mobileNumber
    ? contribution.mobileNumber.replace(/[^0-9]/g, '')
    : FESTIVAL_CONFIG.whatsappNumber.replace(/[^0-9]/g, '');

  const phoneParam = targetNumber ? `phone=${targetNumber.startsWith('91') ? targetNumber : '91' + targetNumber}&` : '';

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
