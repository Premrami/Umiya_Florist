import { limitedText } from '@/lib/limited-body';
import { sameOrigin } from '@/lib/origin';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { service } from '@/lib/supabase/server';
const schema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: z
      .string()
      .min(10)
      .max(20)
      .regex(/^[+0-9 ()-]+$/)
      .transform((v) => v.replace(/[^+0-9]/g, ''))
      .pipe(z.string().regex(/^\+?[1-9]\d{9,14}$/)),
    email: z.union([z.email(), z.literal('')]).optional(),
    type: z.string().min(1).max(100),
    message: z.string().min(5).max(3000),
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
    guests: z.string().max(10).optional(),
    preferred_contact: z.string().max(100).optional(),
    date: z.string().max(10).optional(),
    budget: z.string().max(100).optional(),
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
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  if (Number(request.headers.get('content-length') ?? 0) > 12000)
    return Response.json({ error: 'Inquiry too large' }, { status: 413 });
  try {
    const raw = await limitedText(request, 12000);
    if (raw.length > 12000) throw new Error('size');
    const input = schema.parse(JSON.parse(raw));
    const salt = process.env.INQUIRY_RATE_LIMIT_SALT;
    if (!salt) throw new Error('configuration');
    // Vercel controls x-vercel-forwarded-for. For other hosts configure a trusted proxy; no arbitrary forwarded-for trust.
    const ip = process.env.VERCEL
      ? (request.headers.get('x-vercel-forwarded-for') ?? 'unknown')
      : 'local';
    const key = createHash('sha256')
      .update(ip + salt)
      .digest('hex');
    const db = service();
    const { error } = await db.rpc('submit_inquiry', { p_payload: input, p_rate_key: key });
    if (error)
      return Response.json(
        {
          error: error.message.includes('Too many')
            ? 'Too many inquiries. Please try again later.'
            : 'Your inquiry could not be saved. Please try again.',
        },
        { status: error.message.includes('Too many') ? 429 : 503 },
      );
    return Response.json({ received: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'BODY_TOO_LARGE')
      return Response.json({ error: 'Inquiry too large' }, { status: 413 });
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return Response.json(
        { error: 'Please check your name, phone, and message.' },
        { status: 400 },
      );
    return Response.json(
      {
        error:
          'Inquiry service is not configured yet. Please try again once the studio has connected its backend.',
      },
      { status: 503 },
    );
  }
}
