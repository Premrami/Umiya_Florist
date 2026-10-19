import { createHash } from 'node:crypto';
import { service } from '@/lib/supabase/server';
import { documentPdf } from '@/lib/pdf';
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return new Response('Link unavailable', { status: 404 });
  try {
    const db = service();
    const { data: log } = await db
      .from('invoice_share_logs')
      .select('invoice_id')
      .eq('token_hash', createHash('sha256').update(token).digest('hex'))
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();
    if (!log) return new Response('This invoice link has expired or was revoked.', { status: 404 });
    const { data: inv } = await db
      .from('invoices')
      .select('*')
      .eq('id', log.invoice_id)
      .eq('status', 'finalized')
      .single();
    if (!inv) return new Response('Unavailable', { status: 404 });
    const { data: balance, error: be } = await db
      .from('invoice_balances')
      .select('paid,credits,balance')
      .eq('id', inv.id)
      .single();
    if (be) throw be;
    const bytes = await documentPdf({ ...inv, ...balance });
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="UF-${inv.number}.pdf"`,
        'Cache-Control': 'private, no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch {
    return new Response('Invoice service unavailable', { status: 503 });
  }
}
