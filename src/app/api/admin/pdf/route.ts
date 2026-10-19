import { authorize, apiError } from '@/lib/auth';
import { documentPdf } from '@/lib/pdf';
import { z } from 'zod';
export async function GET(req: Request) {
  try {
    const { db } = await authorize('finance'),
      u = new URL(req.url),
      id = z.uuid().parse(u.searchParams.get('id')),
      quote = u.searchParams.get('kind') === 'quotation';
    const { data: record, error } = await db
      .from(quote ? 'quotations' : 'invoices')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !record) throw new Error('Missing document');
    const { data: payments, error: pe } = await db
      .from('payments')
      .select('amount')
      .eq('invoice_id', id);
    if (pe) throw pe;
    const { data: balance } = quote
      ? { data: null }
      : await db.from('invoice_balances').select('paid,credits,balance').eq('id', id).single();
    const bytes = await documentPdf(
      {
        ...record,
        ...balance,
        paid: balance?.paid ?? payments?.reduce((n, p) => n + p.amount, 0) ?? 0,
      },
      quote ? 'Quotation' : record.status === 'draft' ? 'Draft invoice' : 'Invoice',
    );
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="UF-${record.number}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
