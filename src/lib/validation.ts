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

// Fast Contribution Form Schema for Volunteers and Admins
export const createContributionSchema = z
  .object({
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
    paymentMethod: z.enum(['CASH', 'ONLINE'], {
      errorMap: () => ({ message: 'Please select CASH or ONLINE.' }),
    }),
    utr: z.string().trim().optional(),
    paymentScreenshot: z.string().optional().nullable(),
    notes: z.string().trim().max(300).optional(),
  })
  .refine(
    (data) => {
      // If ONLINE, UTR is required
      if (data.paymentMethod === 'ONLINE') {
        return !!data.utr && data.utr.trim().length >= 4;
      }
      return true;
    },
    {
      message: 'UTR is required for online contributions.',
      path: ['utr'],
    }
  );

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
  notes: z.string().trim().max(300).optional(),
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
});

// User Login Schema
export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export type CreateContributionInput = z.infer<typeof createContributionSchema>;
export type EditContributionInput = z.infer<typeof editContributionSchema>;
export type CreateVolunteerInput = z.infer<typeof createVolunteerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
