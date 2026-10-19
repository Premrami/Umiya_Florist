import { limitedText } from '@/lib/limited-body';
import { createHash } from 'node:crypto';
import { validSignature, razorpay } from '@/lib/razorpay';
import { service } from '@/lib/supabase/server';
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: 'Webhook is not configured' }, { status: 503 });
  let raw: string;
  try {
    raw = await limitedText(req, 256000);
  } catch {
    return new Response(null, { status: 413 });
  }
  if (raw.length > 256000) return new Response(null, { status: 413 });
  if (!validSignature(raw, req.headers.get('x-razorpay-signature') ?? '', secret))
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  try {
    const e = JSON.parse(raw);
    if (e.event === 'refund.processed') {
      const refund = e.payload?.refund?.entity,
        eventId = req.headers.get('x-razorpay-event-id');
      if (!eventId || !refund?.id) throw new Error('Missing refund mapping');
      const verified = await razorpay('refunds/' + encodeURIComponent(refund.id));
      if (
        verified.status !== 'processed' ||
        verified.payment_id !== refund.payment_id ||
        verified.amount !== refund.amount
      )
        throw new Error('Refund verification failed');
      const { error } = await service().rpc('post_provider_refund', {
        p_event: eventId,
        p_hash: createHash('sha256').update(raw).digest('hex'),
        p_payment: verified.payment_id,
        p_refund: verified.id,
        p_amount: verified.amount,
      });
      if (error) throw error;
      return Response.json({ accepted: true });
    }
    if (['payment_link.expired', 'payment_link.cancelled'].includes(e.event)) {
      const link = e.payload?.payment_link?.entity,
        verified = await razorpay('payment_links/' + encodeURIComponent(link.id));
      if (!['expired', 'cancelled'].includes(verified.status))
        throw new Error('Link state mismatch');
      const { error } = await service()
        .from('payment_links')
        .update({ status: verified.status })
        .eq('provider_link_id', verified.id);
      if (error) throw error;
      return Response.json({ accepted: true });
    }
    if (!['payment_link.paid', 'payment_link.partially_paid'].includes(e.event))
      return Response.json({ ignored: true });
    const link = e.payload?.payment_link?.entity,
      payment = e.payload?.payment?.entity,
      eventId = req.headers.get('x-razorpay-event-id');
    if (!eventId || !link?.id || !payment?.id) throw new Error('Missing mapping');
    const [verifiedLink, verifiedPayment] = await Promise.all([
      razorpay('payment_links/' + encodeURIComponent(link.id)),
      razorpay('payments/' + encodeURIComponent(payment.id)),
    ]);
    if (
      verifiedPayment.status !== 'captured' ||
      verifiedPayment.currency !== 'INR' ||
      verifiedPayment.order_id !== verifiedLink.order_id ||
      verifiedPayment.amount !== payment.amount ||
      verifiedLink.reference_id !== link.reference_id
    )
      throw new Error('Verification failed');
    const { error } = await service().rpc('post_provider_payment', {
      p_event: eventId,
      p_hash: createHash('sha256').update(raw).digest('hex'),
      p_link: verifiedLink.id,
      p_reference: verifiedLink.reference_id,
      p_payment: verifiedPayment.id,
      p_amount: verifiedPayment.amount,
      p_currency: verifiedPayment.currency,
      p_link_amount: verifiedLink.amount,
    });
    if (error) throw error;
    return Response.json({ accepted: true });
  } catch {
    return Response.json(
      { error: 'Payment could not be reconciled. Retry or review this event.' },
      { status: 422 },
    );
  }
}
