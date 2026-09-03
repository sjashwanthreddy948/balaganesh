import { z } from 'zod';

// Indian Mobile Number: 10 digits starting with 6, 7, 8, or 9 (with optional +91 or 0 prefix)
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

export const contributionFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter your full name (at least 2 characters)')
    .max(100, 'Name cannot exceed 100 characters'),
  mobileNumber: z
    .string()
    .trim()
    .refine(
      (val) => {
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
    .max(250, 'Address cannot exceed 250 characters')
    .optional()
    .or(z.literal('')),
  amount: z
    .coerce
    .number({ invalid_type_error: 'Please enter a valid contribution amount.' })
    .int('Amount must be a whole number in rupees')
    .min(10, 'Minimum contribution amount is ₹10')
    .max(100000, 'Maximum single contribution is ₹1,00,000'),
  utr: z
    .string()
    .trim()
    .min(6, 'Please enter your transaction ID / UTR (at least 6 characters)')
    .max(50, 'Transaction ID cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'UTR must contain only letters, numbers, hyphens or underscores'),
  paymentScreenshot: z.string().optional().nullable(),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type ContributionInput = z.infer<typeof contributionFormSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
