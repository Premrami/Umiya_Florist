import { z } from 'zod';
import { phoneSchema } from './phone-validation';
export const inquirySchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: phoneSchema,
    email: z.union([z.email(), z.literal('')]).optional(),
    type: z.string().min(1).max(100),
    message: z.string().trim().min(5).max(3000),
    idempotency_key: z.uuid(),
    marketing_consent: z.boolean().default(false),
    website: z.literal('').optional(),
    occasion: z.string().max(100).optional(),
    flowers: z.string().max(500).optional(),
    palette: z.string().max(100).optional(),
    size: z.string().max(100).optional(),
    wrapping: z.string().max(100).optional(),
    gift_message: z.string().max(300).optional(),
    address: z.string().max(500).optional(),
    frequency: z.string().max(100).optional(),
    event_type: z.string().max(100).optional(),
    venue: z.string().max(300).optional(),
    guests: z
      .union([
        z.literal(''),
        z
          .string()
          .regex(/^[0-9]+$/)
          .refine((v) => Number(v) >= 1 && Number(v) <= 100000, 'Use 1–100,000 guests'),
      ])
      .optional(),
    preferred_contact: z.string().max(100).optional(),
    date: z
      .union([
        z.literal(''),
        z.iso
          .date()
          .refine(
            (v) =>
              v >=
              new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()),
            'Choose today or a future date',
          ),
      ])
      .optional(),
    budget: z
      .union([
        z.literal(''),
        z
          .string()
          .regex(/^[0-9]+(?:\.[0-9]{1,2})?$/)
          .refine((v) => Number(v) <= 1e12, 'Budget is too large'),
      ])
      .optional(),
  })
  .superRefine((v, ctx) => {
    const required =
      v.type === 'Custom Bouquet'
        ? ['occasion', 'flowers', 'palette', 'size', 'wrapping']
        : v.type === 'Pooja Flower Subscription'
          ? ['address', 'flowers', 'frequency']
          : v.type === 'General' || v.type.startsWith('Bouquet:')
            ? []
            : ['event_type', 'venue', 'date'];
    for (const key of required)
      if (!(v as Record<string, unknown>)[key])
        ctx.addIssue({ code: 'custom', path: [key], message: 'Required' });
  });
