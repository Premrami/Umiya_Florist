import { z } from 'zod';
import { authorize, apiError } from '@/lib/auth';
import { service } from '@/lib/supabase/server';
import { sameOrigin } from '@/lib/origin';
const schema = z.object({
  invoice_id: z.uuid(),
  to: z.email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
  key: z.uuid(),
});
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new Error('FORBIDDEN');
    const { db } = await authorize('finance');
    const p = schema.parse(await req.json());
    const { data: inv, error } = await db
      .from('invoices')
      .select('id,customer_id')
      .eq('id', p.invoice_id)
      .eq('status', 'finalized')
      .single();
    if (error || !inv) throw new Error('Finalized invoice required');
    const { data: customer } = await db
      .rpc('billing_customers')
      .select('email')
      .eq('id', inv.customer_id)
      .single();
    if (customer?.email?.toLowerCase() !== p.to.toLowerCase())
      throw new Error('Recipient must match the customer’s stored email');
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
      throw new Error('Transactional email is not configured');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
        'Idempotency-Key': p.key,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [p.to],
        subject: p.subject,
        text: p.message,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Email provider did not accept the message');
    const result = await response.json();
    const { error: logError } = await service().from('communication_logs').upsert(
      {
        invoice_id: p.invoice_id,
        customer_id: inv.customer_id,
        channel: 'email',
        status: 'provider_accepted',
        provider_id: result.id,
      },
      { onConflict: 'provider_id' },
    );
    if (logError) throw logError;
    return Response.json({
      status: 'provider_accepted',
      message: 'The email provider accepted this message. Delivery is not yet confirmed.',
    });
  } catch (e) {
    return apiError(e);
  }
}
