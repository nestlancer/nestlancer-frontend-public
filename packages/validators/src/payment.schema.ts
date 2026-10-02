import { z } from 'zod';

export const paymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  projectId: z.string().uuid().optional(),
});

export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;
