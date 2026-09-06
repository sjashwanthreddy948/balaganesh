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
 * Builds standard WhatsApp Pay Later Reminder Message (NO certificate link until paid)
 */
export function buildWhatsAppPayLaterReminderMessage(contribution: {
  fullName: string;
  amount: number;
  certificateNumber?: string;
}): string {
  return `Namaste ${contribution.fullName} 🙏

Warm greetings from Bala Ganesh Association – Ganesh Festival ${FESTIVAL_CONFIG.festivalYear}!

This is a friendly reminder regarding your pledged Chanda of ₹${contribution.amount.toLocaleString('en-IN')}.

Pledge Reference: ${contribution.certificateNumber || 'PLEDGE'}

Payment options:
• Cash: Hand over to our association volunteer
• Online (UPI): ${FESTIVAL_CONFIG.upiId}

Once payment is marked as paid, your official Certificate of Appreciation will be issued.

Thank you for your valuable support & devotion!
Ganpati Bappa Morya! 🙏

— ${FESTIVAL_CONFIG.associationName}`;
}

/**
 * Builds WhatsApp Share URL for Pay Later Reminder
 */
export function buildWhatsAppPayLaterReminderShareUrl(contribution: {
  fullName: string;
  amount: number;
  mobileNumber?: string | null;
  certificateNumber?: string;
}): string {
  const message = buildWhatsAppPayLaterReminderMessage(contribution);
  const normalized = normalizeIndianMobileForWhatsApp(contribution.mobileNumber);
  const phoneParam = normalized ? `phone=${normalized.whatsappPhone}&` : '';

  return `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(message)}`;
}

/**
 * Builds standard WhatsApp Laddu Payment Receipt Message
 */
export function buildWhatsAppLadduReceiptMessage(laddu: {
  personName: string;
  ladduYear: number;
  amountPaid: number;
  totalPaid: number;
  totalDue: number;
  remainingBalance: number;
  status: string;
  receiptNumber: string;
  receiptUrl?: string;
}): string {
  const receiptUrl =
    laddu.receiptUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/laddu/receipt/${laddu.receiptNumber}`
      : `https://balaganesh.vercel.app/laddu/receipt/${laddu.receiptNumber}`);

  const statusText =
    laddu.remainingBalance <= 0 || laddu.status === 'PAID'
      ? '✓ FULLY PAID'
      : `REMAINING BALANCE: ₹${laddu.remainingBalance.toLocaleString('en-IN')}`;

  return `Namaste ${laddu.personName} 🙏

Thank you for your payment of ₹${laddu.amountPaid.toLocaleString('en-IN')} towards Bala Ganesh Association Laddu (${laddu.ladduYear}).

Receipt No: ${laddu.receiptNumber}
Laddu Year: ${laddu.ladduYear}
Amount Paid Now: ₹${laddu.amountPaid.toLocaleString('en-IN')}
Total Paid: ₹${laddu.totalPaid.toLocaleString('en-IN')} / ₹${laddu.totalDue.toLocaleString('en-IN')}
Status: ${statusText}

Your Official Laddu Payment Receipt:
${receiptUrl}

Ganpati Bappa Morya! 🙏

— ${FESTIVAL_CONFIG.associationName}`;
}

/**
 * Builds WhatsApp Share URL for Laddu Payment Receipt
 */
export function buildWhatsAppLadduReceiptShareUrl(laddu: {
  personName: string;
  ladduYear: number;
  amountPaid: number;
  totalPaid: number;
  totalDue: number;
  remainingBalance: number;
  status: string;
  receiptNumber: string;
  mobileNumber?: string | null;
  receiptUrl?: string;
}): string {
  const message = buildWhatsAppLadduReceiptMessage(laddu);
  const normalized = normalizeIndianMobileForWhatsApp(laddu.mobileNumber);
  const phoneParam = normalized ? `phone=${normalized.whatsappPhone}&` : '';

  return `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(message)}`;
}

/**
 * Builds standard WhatsApp Expense Voucher Message
 */
export function buildWhatsAppExpenseVoucherMessage(expense: {
  expenseNumber: string;
  shopName: string;
  category: string;
  amount: number;
  paymentMethod: string;
  date: string | Date;
  description?: string | null;
  enteredBy?: string;
  isAdvance?: boolean;
  totalCost?: number | null;
  pendingBalance?: number | null;
}): string {
  const formattedDate = new Date(expense.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const isAdv = Boolean(expense.isAdvance);
  const totalCost = expense.totalCost || expense.amount;
  const pending = expense.pendingBalance ?? (isAdv ? Math.max(0, totalCost - expense.amount) : 0);

  return `*BALA GANESH ASSOCIATION* 🙏
*OFFICIAL EXPENSE ${isAdv ? 'ADVANCE ' : ''}VOUCHER & BILL*
────────────────────────
*Voucher No:* ${expense.expenseNumber}
*Vendor:* ${expense.shopName}
*Category:* ${expense.category}
*Payment Nature:* ${isAdv ? '⚡ ADVANCE PAYMENT' : '✓ FULL PAYMENT'}
${isAdv ? `*Total Contract Cost:* ₹${totalCost.toLocaleString('en-IN')}\n*Advance Paid:* ₹${expense.amount.toLocaleString('en-IN')}\n*Pending Due to Vendor:* ₹${pending.toLocaleString('en-IN')}\n` : `*Amount Paid:* ₹${expense.amount.toLocaleString('en-IN')}\n`}*Payment Method:* ${expense.paymentMethod}
*Date:* ${formattedDate}
${expense.description ? `*Purpose:* ${expense.description}\n` : ''}*Authorized By:* ${expense.enteredBy || 'Association Committee'}
────────────────────────
Ganpati Bappa Morya! 🙏
— Bala Ganesh Association, Bhavani Nagar, Shankarpally`;
}

/**
 * Builds WhatsApp Share URL for Expense Voucher
 */
export function buildWhatsAppExpenseVoucherShareUrl(expense: {
  expenseNumber: string;
  shopName: string;
  category: string;
  amount: number;
  paymentMethod: string;
  date: string | Date;
  description?: string | null;
  enteredBy?: string;
  isAdvance?: boolean;
  totalCost?: number | null;
  pendingBalance?: number | null;
}): string {
  const message = buildWhatsAppExpenseVoucherMessage(expense);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

/**
 * Builds standard WhatsApp Festival Invitation Message
 */
export function buildWhatsAppInvitationMessage(invitation: {
  title: string;
  invitees: string;
  eventDate: string | Date;
  eventTime: string;
  venue: string;
  description?: string | null;
  contactInfo?: string | null;
}): string {
  const dateObj = new Date(invitation.eventDate);
  const formattedDate = isNaN(dateObj.getTime())
    ? String(invitation.eventDate)
    : dateObj.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const detailsBlock = invitation.description?.trim()
    ? `\n✨ *కార్యక్రమ వివరాలు / Program Details:*\n${invitation.description.trim()}\n`
    : '';

  const contactBlock = invitation.contactInfo?.trim()
    ? `📞 *సంప్రదించండి / Contact:* ${invitation.contactInfo.trim()}\n`
    : `📞 *Contact:* ${FESTIVAL_CONFIG.contactNumber}\n`;

  return `🕉️ *శ్రీ వినాయక చవితి మహోత్సవ ఆహ్వానం* 🕉️
*${FESTIVAL_CONFIG.associationName}*
*${FESTIVAL_CONFIG.associationAddress}*
━━━━━━━━━━━━━━━━━━━━━━━
🌸 *CORDIAL INVITATION / సాదర ఆహ్వానం* 🌸

గౌరవనీయులైన / Dear *${invitation.invitees}*,

మేము మిమ్మల్ని మరియు మీ కుటుంబ సభ్యులను, స్నేహితులను మా గణేష్ ఉత్సవాల్లో పాల్గొనవలసిందిగా సాదరంగా ఆహ్వానిస్తున్నాము.

We cordially invite you and your family to grace the auspicious occasion of:

🪔 *${invitation.title.toUpperCase()}* 🪔
━━━━━━━━━━━━━━━━━━━━━━━
📅 *తేదీ / Date:* ${formattedDate}
⏰ *సమయం / Time:* ${invitation.eventTime}
📍 *వేదిక / Venue:* ${invitation.venue}
${detailsBlock}
🙏 *మీ రాకయే మాకు శుభప్రదం! Lord Ganesha blessings to you and your family.*

👥 *Join Our Official Bala Ganesh WhatsApp Group:*
${FESTIVAL_CONFIG.whatsappGroupLink}

━━━━━━━━━━━━━━━━━━━━━━━
— *Bala Ganesh Association Committee & Youth Members*
${contactBlock}
🙏 *Ganpati Bappa Morya!* 🙏`;
}

/**
 * Builds WhatsApp Share URL for Invitation (Defaults to open picker for Bala Ganesh Group)
 */
export function buildWhatsAppInvitationShareUrl(invitation: {
  title: string;
  invitees: string;
  eventDate: string | Date;
  eventTime: string;
  venue: string;
  description?: string | null;
  contactInfo?: string | null;
  mobileNumber?: string | null;
}): string {
  const message = buildWhatsAppInvitationMessage(invitation);
  const normalized = normalizeIndianMobileForWhatsApp(invitation.mobileNumber);
  const phoneParam = normalized ? `phone=${normalized.whatsappPhone}&` : '';
  return `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(message)}`;
}




