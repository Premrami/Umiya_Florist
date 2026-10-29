import { limitedText } from '@/lib/limited-body';
import { sameOrigin } from '@/lib/origin';
import { z } from 'zod';
import { inquirySchema } from '@/lib/inquiry-validation';
import { createHash } from 'node:crypto';
import { service } from '@/lib/supabase/server';
import { after } from 'next/server';
import { dispatchInquiryAlerts } from '@/lib/inquiry-alerts';
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  if (Number(request.headers.get('content-length') ?? 0) > 12000)
    return Response.json({ error: 'Inquiry too large' }, { status: 413 });
  try {
    const raw = await limitedText(request, 12000);
    if (raw.length > 12000) throw new Error('size');
    const input = inquirySchema.parse(JSON.parse(raw));
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
    const { data: inquiryId, error } = await db.rpc('submit_inquiry', {
      p_payload: input,
      p_rate_key: key,
    });
    if (error)
      return Response.json(
        {
          error: error.message.includes('Too many')
            ? 'Too many inquiries. Please try again later.'
            : 'Your inquiry could not be saved. Please try again.',
        },
        { status: error.message.includes('Too many') ? 429 : 503 },
      );
    // The database trigger queues alerts atomically with the inquiry. A provider failure never loses it.
    if (typeof inquiryId === 'string')
      after(async () => {
        try {
          await dispatchInquiryAlerts(inquiryId);
        } catch {
          console.error('Inquiry alert dispatch needs attention. Check the admin alert panel.');
        }
      });
    return Response.json({ received: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'BODY_TOO_LARGE')
      return Response.json({ error: 'Inquiry too large' }, { status: 413 });
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      const field = String(issue?.path[0] ?? '');
      const labels: Record<string, string> = {
        name: 'your name',
        phone: 'your phone number',
        email: 'your email address',
        message: 'your message',
        guests: 'the guest count',
        budget: 'your budget',
        date: 'the preferred date',
      };
      return Response.json(
        {
          error: `Please check ${labels[field] || field || 'the inquiry details'}. ${issue?.message ?? ''}`,
          field,
        },
        { status: 400 },
      );
    }
    if (error instanceof SyntaxError)
      return Response.json(
        { error: 'The inquiry could not be read. Please try again.' },
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
