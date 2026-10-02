import { z } from 'zod';

const quoteLineItemSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Add at least one line item with a description the client will understand.'),
  quantity: z.number().positive('Each line item needs a quantity of at least 1.'),
  unitPrice: z.number().positive('Each line item needs a unit price greater than 0.'),
});

const quoteSchedulePresetSchema = z.enum([
  '50-50',
  '30-70',
  '30-40-30',
  '25-25-25-25',
  '100-upfront',
]);

const quoteInstallmentSchema = z.object({
  label: z.string().trim().min(1, 'Each payment installment needs a label.'),
  percentage: z.number().min(0),
  dueTrigger: z.enum(['on_accept', 'on_prior_approved', 'on_date']).optional(),
  amount: z.number().min(0).optional(),
  dueDate: z.string().optional(),
});

/**
 * Admin create-quote body. Mirrors requests CreateQuoteDto checks the quote builder enforces.
 */
export const createQuoteSchema = z
  .object({
    items: z
      .array(quoteLineItemSchema)
      .min(1, 'Add at least one line item with a description the client will understand.'),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{3}$/, 'Choose a 3-letter currency code (e.g. INR).')
      .transform((value) => value.toUpperCase()),
    taxPercentage: z.number().min(0),
    validUntil: z.string().min(1, 'Set how long this quote stays valid for the client.'),
    termsAndConditions: z
      .string()
      .max(2000, 'Project-specific terms must be 2000 characters or fewer.')
      .optional(),
    internalNotes: z
      .string()
      .max(1000, 'Internal notes must be 1000 characters or fewer.')
      .optional(),
    requiresContract: z.boolean().optional(),
    schedulePreset: quoteSchedulePresetSchema.optional(),
    paymentSchedule: z.array(quoteInstallmentSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const expiry = new Date(data.validUntil);
    if (Number.isNaN(expiry.getTime()) || expiry.getTime() < Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valid-until date must be in the future.',
        path: ['validUntil'],
      });
    }
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    if (subtotal <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Quote total must be greater than zero.',
        path: ['items'],
      });
    }
    if (data.paymentSchedule) {
      const pct = data.paymentSchedule.reduce((sum, row) => sum + row.percentage, 0);
      if (pct !== 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Custom payment schedule percentages must total 100%.',
          path: ['paymentSchedule'],
        });
      }
    }
  });

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

/** Client acceptance of a quote. Mirrors quotes AcceptQuoteDto. */
export const acceptQuoteSchema = z.object({
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Check the agreement box below to continue.' }),
  }),
  signatureName: z
    .string()
    .trim()
    .min(1, 'Enter your legal name to sign.')
    .max(100, 'Legal name must be 100 characters or fewer.'),
  signatureDate: z.string().min(1, 'Signature time is missing.'),
  notes: z.string().max(1000).optional(),
});

export type AcceptQuoteInput = z.infer<typeof acceptQuoteSchema>;
