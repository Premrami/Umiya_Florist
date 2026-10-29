import { z } from 'zod';
export const vitalsSchema = z
  .object({
    name: z.enum(['LCP', 'INP', 'CLS']),
    value: z.number().finite().min(0).max(600000),
    rating: z.enum(['good', 'needs-improvement', 'poor']),
    path: z.enum(['/', '/privacy']),
  })
  .strict();
