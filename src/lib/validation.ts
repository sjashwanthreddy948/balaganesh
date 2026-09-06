import { z } from 'zod';

export const indianMobileRegex = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/;

export const cleanIndianMobile = (val: string): string => {
  const digits = val.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
};

export interface NormalizedPhoneResult {
  valid: boolean;
  tenDigit: string;
  whatsappPhone: string; // "919876543210" for api.whatsapp.com/send?phone=919876543210
  displayPhone: string;  // "+919876543210"
}

export const normalizeIndianMobileForWhatsApp = (val?: string | null): NormalizedPhoneResult | null => {
  if (!val) return null;
  const digits = val.replace(/\D/g, '');
  let tenDigit = '';

  if (digits.length === 12 && digits.startsWith('91')) {
    tenDigit = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    tenDigit = digits.slice(1);
  } else if (digits.length === 10) {
    tenDigit = digits;
  }

  if (tenDigit.length === 10 && /^[6-9]\d{9}$/.test(tenDigit)) {
    return {
      valid: true,
      tenDigit,
      whatsappPhone: `91${tenDigit}`,
      displayPhone: `+91${tenDigit}`,
    };
  }

  return null;
};

// Standard preset expense categories
export const EXPENSE_CATEGORIES = [
  'Decorations',
  'Flowers',
  'Ganesh Idol',
  'Electrical',
  'Sound System',
  'Lighting',
  'Pooja Materials',
  'Food / Prasadam',
  'Printing',
  'Transport',
  'Cleaning',
  'Miscellaneous',
] as const;

// Fast Contribution Form Schema
export const createContributionSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter the donor's name.")
    .max(100, "Donor name cannot exceed 100 characters."),
  mobileNumber: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val || val === '') return true;
        const cleaned = cleanIndianMobile(val);
        return cleaned.length === 10 && /^[6789]/.test(cleaned);
      },
      {
        message: 'Please enter a valid 10-digit mobile number.',
      }
    ),
  address: z
    .string()
    .trim()
    .max(250, 'Address cannot exceed 250 characters.')
    .optional()
    .or(z.literal('')),
  amount: z.coerce
    .number({ invalid_type_error: 'Please enter a valid contribution amount.' })
    .int('Amount must be a whole number in rupees.')
    .positive('Please enter a valid contribution amount.')
    .min(10, 'Minimum contribution amount is ₹10.')
    .max(1000000, 'Maximum contribution limit is ₹10,00,000.'),
  paymentMethod: z.enum(['CASH', 'ONLINE', 'PAY_LATER'], {
    errorMap: () => ({ message: 'Please select CASH, ONLINE, or PAY LATER.' }),
  }),
  utr: z.string().trim().optional().or(z.literal('')),
  paymentScreenshot: z.string().optional().nullable(),
  notes: z.string().trim().max(300).optional(),
});

// Edit Contribution Schema (Admin only)
export const editContributionSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter the donor's name.")
    .max(100),
  mobileNumber: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val || val === '') return true;
        const cleaned = cleanIndianMobile(val);
        return cleaned.length === 10 && /^[6789]/.test(cleaned);
      },
      {
        message: 'Please enter a valid 10-digit mobile number.',
      }
    ),
  address: z.string().trim().max(250).optional().or(z.literal('')),
  amount: z.coerce
    .number()
    .int()
    .positive('Please enter a valid contribution amount.'),
  paymentMethod: z.enum(['CASH', 'ONLINE', 'PAY_LATER']).optional(),
  paymentStatus: z.enum(['CASH_RECEIVED', 'PENDING', 'VERIFIED', 'REJECTED', 'PAY_LATER']).optional(),
  notes: z.string().trim().max(300).optional(),
});

// Expense Creation Schema
export const createExpenseSchema = z.object({
  shopName: z
    .string()
    .trim()
    .min(2, 'Shop or Vendor Name must be at least 2 characters.')
    .max(150, 'Shop name cannot exceed 150 characters.'),
  category: z
    .string()
    .trim()
    .min(2, 'Expense category is required.')
    .max(80),
  description: z.string().trim().max(300).optional().or(z.literal('')),
  amount: z.coerce
    .number({ invalid_type_error: 'Please enter a valid amount.' })
    .int('Amount must be a whole number in rupees.')
    .positive('Amount must be greater than zero.'),
  paymentMethod: z.enum(['CASH', 'ONLINE'], {
    errorMap: () => ({ message: 'Please select CASH or ONLINE.' }),
  }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please provide a valid date.',
  }),
  notes: z.string().trim().max(400).optional().or(z.literal('')),
  billImage: z.string().optional().nullable(),
  enteredBy: z
    .string()
    .trim()
    .min(2, 'Please enter who is recording this expense.')
    .max(100),
  isAdvance: z.boolean().optional(),
  totalCost: z.coerce.number().int().positive().optional().nullable(),
  advanceAmount: z.coerce.number().int().positive().optional().nullable(),
  pendingBalance: z.coerce.number().int().nonnegative().optional().nullable(),
});

// Expense Editing Schema
export const editExpenseSchema = z.object({
  shopName: z.string().trim().min(2).max(150),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional().or(z.literal('')),
  amount: z.coerce.number().int().positive(),
  paymentMethod: z.enum(['CASH', 'ONLINE']),
  date: z.string().refine((val) => !isNaN(Date.parse(val))),
  notes: z.string().trim().max(400).optional().or(z.literal('')),
  billImage: z.string().optional().nullable(),
  enteredBy: z.string().trim().min(2).max(100).optional(),
  isAdvance: z.boolean().optional(),
  totalCost: z.coerce.number().int().positive().optional().nullable(),
  advanceAmount: z.coerce.number().int().positive().optional().nullable(),
  pendingBalance: z.coerce.number().int().nonnegative().optional().nullable(),
});

// Volunteer Creation Schema (Admin only)
export const createVolunteerSchema = z.object({
  name: z.string().trim().min(2, 'Volunteer name is required (at least 2 characters).'),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  mobile: z.string().trim().optional(),
  canAddExpenses: z.boolean().optional(),
});

// User Login Schema
export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

// Invitation Creation Schema
export const createInvitationSchema = z.object({
  title: z.string().trim().min(2, 'Event / Invitation title is required.').max(150),
  invitees: z.string().trim().min(2, 'Invitee name(s) is required.').max(200),
  husbandName: z.string().trim().max(100).optional().or(z.literal('')),
  wifeName: z.string().trim().max(100).optional().or(z.literal('')),
  eventDate: z.string().trim().min(1, 'Please select event date.'),
  eventTime: z.string().trim().min(1, 'Please specify event time (e.g. 7:00 PM).').max(80),
  venue: z.string().trim().min(2, 'Venue is required.').max(250),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  contactInfo: z.string().trim().max(100).optional().or(z.literal('')),
  mobileNumber: z.string().trim().optional().or(z.literal('')),
});

export type CreateContributionInput = z.infer<typeof createContributionSchema>;
export type EditContributionInput = z.infer<typeof editContributionSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type EditExpenseInput = z.infer<typeof editExpenseSchema>;
export type CreateVolunteerInput = z.infer<typeof createVolunteerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
