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
  maxAmount: 100000,

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
 * Builds standard universal UPI payment link compatible with GPay, PhonePe, Paytm, BHIM, Cred
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
 * Formats WhatsApp share message
 */
export function buildWhatsAppShareUrl(contribution: {
  fullName: string;
  amount: number;
  receiptNumber: string;
  utr: string;
}): string {
  const cleanNumber = FESTIVAL_CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
  const message = `🙏 *${FESTIVAL_CONFIG.associationName}*

Thank you for your Ganesh festival Chanda contribution.

*Name:* ${contribution.fullName}
*Amount:* ₹${contribution.amount.toLocaleString('en-IN')}
*Receipt No:* ${contribution.receiptNumber}
*UTR / Transaction ID:* ${contribution.utr}

Ganpati Bappa Morya! 🙏`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
