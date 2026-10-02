import { z } from 'zod';

export const projectCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10_000),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
