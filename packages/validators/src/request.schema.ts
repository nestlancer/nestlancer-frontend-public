import { z } from 'zod';

/** Align with backend CreateRequestDto + field-help registry (NL-BUG-REQ-001). */
export const REQUEST_TITLE_MIN = 5;
export const REQUEST_TITLE_MAX = 100;
export const REQUEST_DESCRIPTION_MIN = 20;
export const REQUEST_DESCRIPTION_MAX = 5000;

export const requestCreateSchema = z.object({
  title: z.string().min(REQUEST_TITLE_MIN).max(REQUEST_TITLE_MAX),
  description: z.string().min(REQUEST_DESCRIPTION_MIN).max(REQUEST_DESCRIPTION_MAX),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
});

export type RequestCreateInput = z.infer<typeof requestCreateSchema>;
