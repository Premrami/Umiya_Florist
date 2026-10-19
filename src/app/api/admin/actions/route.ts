import { sameOrigin } from '@/lib/origin';
import { z } from 'zod';
import { createHash, randomBytes } from 'node:crypto';
import { authorize, apiError } from '@/lib/auth';
import { service } from '@/lib/supabase/server';
import { razorpay } from '@/lib/razorpay';
import { inr } from '@/lib/business';
const uuid = z.uuid(),
  amount = z.coerce.number().int().min(0).max(1e12);
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('credit'), id: uuid, amount, reason: z.string().min(3).max(1000) }),
  z.object({ action: z.literal('cancel_link'), id: uuid }),
  z.object({
    action: z.literal('subscription_item'),
    id: uuid,
    name: z.string().min(1).max(200),
    quantity: z.coerce.number().int().min(1).max(10000),
    amount,
  }),
  z.object({
    action: z.literal('price'),
    id: uuid,
    date: z.iso.date(),
    amount,
    reason: z.string().min(3).max(1000),
  }),
  z.object({
    action: z.literal('task'),
    id: uuid,
    name: z.string().min(1).max(300),
    date: z.iso.date(),
  }),
  z.object({ action: z.literal('task_done'), id: uuid }),
  z.object({
    action: z.literal('address'),
    id: uuid,
    label: z.string().min(1).max(100),
    address: z.string().min(3).max(1000),
  }),
  z.object({
    action: z.literal('followup'),
    id: uuid,
    name: z.string().min(1).max(300),
    date: z.iso.date(),
  }),
  z.object({
    action: z.literal('save_quote'),
    id: z.union([uuid, z.literal('')]),
    customer_id: uuid,
    name: z.string().min(1).max(300),
    valid_until: z.iso.date(),
    items: z
      .array(
        z.object({
          description: z.string().min(1).max(1000),
          quantity: z.coerce.number().int().min(1).max(10000),
          unit_price: amount,
        }),
      )
      .min(1)
      .max(100),
  }),
  z.object({
    action: z.literal('consent'),
    id: uuid,
    consent: z.boolean(),
    source: z.string().min(3).max(1000),
  }),
  z.object({
    action: z.literal('booking'),
    id: uuid,
    date: z.iso.date(),
    venue: z.string().min(1).max(500),
  }),
  z.object({ action: z.literal('schedule'), date: z.iso.date() }),
  z.object({ action: z.literal('monthly'), month: z.iso.date() }),
  z.object({ action: z.literal('finalize'), id: uuid }),
  z.object({ action: z.literal('publish'), id: uuid }),
  z.object({ action: z.literal('convert'), id: uuid }),
  z.object({ action: z.literal('pause'), id: uuid, start: z.iso.date(), end: z.iso.date() }),
  z.object({
    action: z.literal('payment'),
    id: uuid,
    amount,
    method: z.enum(['cash', 'bank', 'upi']),
    reference: z.string().max(300),
    key: uuid,
  }),
  z.object({
    action: z.literal('stock'),
    id: uuid,
    quantity: z.coerce.number().finite().min(-1e6).max(1e6),
    reason: z.enum(['purchase', 'received', 'used', 'waste', 'adjustment']),
    notes: z.string().max(1000),
    key: uuid,
  }),
  z.object({
    action: z.literal('invoice'),
    customer_id: uuid,
    event_id: z.union([uuid, z.literal('')]),
    description: z.string().min(1).max(1000),
    amount,
  }),
  z.object({
    action: z.literal('adjust'),
    id: uuid,
    description: z.string().min(1).max(1000),
    amount: z.coerce.number().int().min(-1e12).max(1e12),
  }),
  z.object({ action: z.literal('link'), id: uuid }),
  z.object({ action: z.literal('share'), id: uuid }),
  z.object({
    action: z.literal('share_status'),
    id: uuid,
    status: z.enum(['whatsapp_opened', 'manually_sent', 'failed']),
  }),
  z.object({ action: z.literal('revoke_share'), id: uuid }),
  z.object({
    action: z.literal('quote_status'),
    id: uuid,
    status: z.enum(['sent', 'accepted', 'rejected']),
  }),
  z.object({
    action: z.literal('expense'),
    id: uuid,
    name: z.string().min(1).max(300),
    category: z.string().min(1).max(100),
    amount,
  }),
]);
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new Error('FORBIDDEN');
    const p = schema.parse(await req.json());
    const permission = [
      'schedule',
      'stock',
      'pause',
      'expense',
      'task',
      'task_done',
      'subscription_item',
      'price',
    ].includes(p.action)
      ? 'operations'
      : p.action === 'publish'
        ? 'content'
        : ['convert', 'consent', 'address', 'followup'].includes(p.action)
          ? 'crm'
          : 'finance';
    const { db } = await authorize(permission);
    let result: unknown;
    let error: unknown;
    if (p.action === 'credit')
      ({ data: result, error } = await db.rpc('issue_credit', {
        p_id: p.id,
        p_amount: p.amount,
        p_reason: p.reason,
      }));
    if (p.action === 'cancel_link') {
      const { data: links, error: e } = await db
        .from('payment_links')
        .select('*')
        .eq('invoice_id', p.id)
        .in('status', ['created', 'partially_paid']);
      if (e) throw e;
      for (const link of links ?? []) {
        const cancelled = await razorpay('payment_links/' + link.provider_link_id + '/cancel', {});
        if (cancelled.status !== 'cancelled') throw new Error('Cancellation not confirmed');
        const { error: e } = await service()
          .from('payment_links')
          .update({ status: 'cancelled' })
          .eq('id', link.id);
        if (e) throw e;
      }
    }
    if (p.action === 'subscription_item')
      ({ data: result, error } = await db.rpc('add_subscription_item', {
        p_id: p.id,
        p_name: p.name,
        p_quantity: p.quantity,
        p_price: p.amount,
      }));
    if (p.action === 'price')
      ({ data: result, error } = await db.rpc('change_subscription_price', {
        p_id: p.id,
        p_date: p.date,
        p_amount: p.amount,
        p_reason: p.reason,
      }));
    if (p.action === 'task')
      ({ data: result, error } = await db
        .from('event_tasks')
        .insert({ event_id: p.id, name: p.name, due_date: p.date }));
    if (p.action === 'task_done')
      ({ data: result, error } = await db
        .from('event_tasks')
        .update({ status: 'done' })
        .eq('id', p.id));
    if (p.action === 'address')
      ({ data: result, error } = await db
        .from('customer_addresses')
        .insert({ customer_id: p.id, label: p.label, address: p.address }));
    if (p.action === 'followup')
      ({ data: result, error } = await db
        .from('customer_followups')
        .insert({ customer_id: p.id, name: p.name, due_at: p.date + 'T09:00:00+05:30' }));
    if (p.action === 'save_quote')
      ({ data: result, error } = await db.rpc('save_quotation', {
        p_id: p.id || null,
        p_customer: p.customer_id,
        p_name: p.name,
        p_valid: p.valid_until,
        p_items: p.items,
      }));
    if (p.action === 'consent')
      ({ data: result, error } = await db.rpc('set_marketing_consent', {
        p_id: p.id,
        p_consent: p.consent,
        p_source: p.source,
      }));
    if (p.action === 'booking')
      ({ data: result, error } = await db.rpc('accept_quote', {
        p_id: p.id,
        p_event_date: p.date,
        p_venue: p.venue,
      }));
    if (p.action === 'schedule')
      ({ data: result, error } = await db.rpc('schedule_deliveries', { p_date: p.date }));
    if (p.action === 'monthly')
      ({ data: result, error } = await db.rpc('generate_monthly', { p_month: p.month }));
    if (p.action === 'finalize')
      ({ data: result, error } = await db.rpc('finalize_invoice', { p_id: p.id }));
    if (p.action === 'publish')
      ({ data: result, error } = await db.rpc('publish_section', { p_id: p.id }));
    if (p.action === 'convert')
      ({ data: result, error } = await db.rpc('convert_inquiry', { p_id: p.id }));
    if (p.action === 'pause')
      ({ data: result, error } = await db.rpc('pause_subscription', {
        p_id: p.id,
        p_start: p.start,
        p_end: p.end,
      }));
    if (p.action === 'payment')
      ({ data: result, error } = await db.rpc('manual_payment', {
        p_invoice: p.id,
        p_amount: p.amount,
        p_method: p.method,
        p_reference: p.reference,
        p_key: p.key,
      }));
    if (p.action === 'stock')
      ({ data: result, error } = await db.rpc('stock_movement', {
        p_item: p.id,
        p_quantity: p.quantity,
        p_reason: p.reason,
        p_notes: p.notes,
        p_key: p.key,
      }));
    if (p.action === 'invoice')
      ({ data: result, error } = await db.rpc('create_direct_invoice', {
        p_customer: p.customer_id,
        p_event: p.event_id || null,
        p_description: p.description,
        p_amount: p.amount,
      }));
    if (p.action === 'adjust')
      ({ data: result, error } = await db.rpc('adjust_invoice', {
        p_id: p.id,
        p_description: p.description,
        p_amount: p.amount,
      }));
    if (p.action === 'quote_status')
      ({ data: result, error } = await db.rpc('transition_quote', {
        p_id: p.id,
        p_status: p.status,
      }));
    if (p.action === 'expense')
      ({ data: result, error } = await db
        .from('event_expenses')
        .insert({ event_id: p.id, name: p.name, category: p.category, amount: p.amount }));
    if (p.action === 'share_status')
      ({ data: result, error } = await service()
        .from('invoice_share_logs')
        .update({ status: p.status })
        .eq('id', p.id));
    if (p.action === 'revoke_share')
      ({ data: result, error } = await service()
        .from('invoice_share_logs')
        .update({ revoked_at: new Date().toISOString() })
        .eq('invoice_id', p.id)
        .is('revoked_at', null));
    if (p.action === 'share' || p.action === 'link') {
      const { data: inv, error: e } = await db
        .from('invoices')
        .select('*')
        .eq('id', p.id)
        .eq('status', 'finalized')
        .single();
      if (e || !inv) throw new Error('Finalized invoice required');
      const { data: balances, error: be } = await db
        .from('invoice_balances')
        .select('balance')
        .eq('id', p.id)
        .single();
      if (be) throw be;
      const balance = Number(balances.balance);
      if (p.action === 'link') {
        if (balance <= 0) throw new Error('No balance due');
        const { data: existing } = await db
          .from('payment_links')
          .select('*')
          .eq('invoice_id', p.id)
          .in('status', ['created', 'partially_paid'])
          .order('created_at', { ascending: false })
          .limit(1);
        if (existing?.length) result = { url: existing[0].url };
        else {
          const link = await razorpay('payment_links', {
            amount: balance,
            currency: 'INR',
            accept_partial: true,
            reference_id: p.id,
            description: 'Umiya Florist invoice UF-' + inv.number,
            notify: { sms: false, email: false },
            reminder_enable: false,
            notes: { invoice_id: p.id },
          });
          const { error: e } = await service().from('payment_links').insert({
            invoice_id: p.id,
            provider_link_id: link.id,
            url: link.short_url,
            amount: balance,
          });
          if (e) throw e;
          result = { url: link.short_url };
        }
      } else {
        const token = randomBytes(32).toString('base64url');
        const { data: log, error: e } = await service()
          .from('invoice_share_logs')
          .insert({
            invoice_id: p.id,
            token_hash: createHash('sha256').update(token).digest('hex'),
            expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
            status: 'prepared',
          })
          .select()
          .single();
        if (e) throw e;
        const invoiceUrl =
          (process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin) + '/api/invoice/' + token;
        const customer = inv.snapshot.customer;
        const message = `Hello ${customer.name},\n\nYour flower bill from Umiya Florist is ready.\nInvoice: ${inv.snapshot.number_label ?? 'UF-' + inv.number}\nBalance: ${inr(balance)}\nDue: ${inv.due_date}\nView your invoice (valid for 7 days):\n${invoiceUrl}\n\nThank you for choosing Umiya Florist.`;
        result = {
          share_id: log.id,
          message,
          whatsapp:
            'https://wa.me/' +
            String(customer.phone).replace(/\D/g, '') +
            '?text=' +
            encodeURIComponent(message),
          invoiceUrl,
        };
      }
    }
    if (error) throw error;
    return Response.json({ data: result ?? null });
  } catch (e) {
    return apiError(e);
  }
}
