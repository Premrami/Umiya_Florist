import { invalidatePublicContent } from '@/lib/public-cache';
import { z } from 'zod';
import { sameOrigin } from '@/lib/origin';
import { authorize, apiError } from '@/lib/auth';
import { specs } from '@/lib/modules';
const context = async (ctx: { params: Promise<{ module: string }> }) => {
  const { module } = await ctx.params;
  const spec = specs[module];
  if (!spec) throw new Error('Invalid module');
  return { module, spec, ...(await authorize(spec.permission)) };
};
export async function GET(req: Request, ctx: { params: Promise<{ module: string }> }) {
  try {
    const { db, spec, module } = await context(ctx);
    const u = new URL(req.url),
      page = Math.max(0, Number(u.searchParams.get('page') ?? 0));
    let query = db.from(spec.table).select('*', { count: 'exact' });
    const search = (u.searchParams.get('search') ?? '')
      .replace(/[^a-zA-Z0-9 +@.-]/g, '')
      .slice(0, 100);
    if (
      search &&
      [
        'clients',
        'inquiries',
        'events',
        'catalog',
        'inventory',
        'marketing',
        'quotations',
      ].includes(module)
    )
      query = query.ilike('name', '%' + search + '%');
    const { data, error, count } = await query
      .order(module === 'settings' ? 'id' : 'created_at', { ascending: false })
      .range(page * 25, page * 25 + 24);
    if (error) throw error;
    if (module === 'invoices' && data?.length) {
      const { data: balances, error: e } = await db
        .from('invoice_balances')
        .select('id,paid,balance,credits')
        .in(
          'id',
          data.map((x) => x.id),
        );
      if (e) throw e;
      for (const row of data) Object.assign(row, balances?.find((x) => x.id === row.id) ?? {});
    }
    if (module === 'inventory' && data?.length) {
      const { data: balances, error: e } = await db.rpc('stock_balances', {
        p_ids: data.map((x) => x.id),
      });
      if (e) throw e;
      for (const row of data)
        row.stock =
          balances?.find((x: { item_id: string; stock: number }) => x.item_id === row.id)?.stock ??
          0;
    }
    return Response.json({ data, count });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: Request, ctx: { params: Promise<{ module: string }> }) {
  try {
    if (!sameOrigin(req)) throw new Error('FORBIDDEN');
    const { db, spec, module } = await context(ctx);
    const body = await req.json();
    const { id, ...fields } = body;
    if (id != null) {
      if (module === 'settings') {
        if (id !== 1) throw new Error('Invalid settings record');
      } else z.uuid().parse(id);
    }
    if (spec.readonly && !id) throw new Error('Use the dedicated action');
    if (['invoices', 'payments', 'staff', 'media', 'quotations'].includes(module))
      throw new Error('Use the dedicated action');
    const clean = spec.schema.parse(fields);
    const query = id
      ? db.from(spec.table).update(clean).eq('id', id)
      : db.from(spec.table).insert(clean);
    const { data, error } = await query.select().single();
    if (error) throw error;
    invalidatePublicContent(module);
    return Response.json({ data });
  } catch (e) {
    return apiError(e);
  }
}
