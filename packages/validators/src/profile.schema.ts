import { z } from 'zod';

const phoneSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => !value || /^\+?[1-9]\d{1,14}$/.test(value) || /^[6-9]\d{9}$/.test(value),
    'Enter a valid mobile number (10 digits or +91…)'
  );

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters').max(50),
  phone: phoneSchema,
  bio: z.string().max(2000).optional(),
  headline: z.string().max(160).optional(),
  skills: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
