import { authorize, apiError } from '@/lib/auth';
export async function GET(req: Request) {
  try {
    const { db, profile } = await authorize();
    const u = new URL(req.url),
      kind = u.searchParams.get('kind');
    if (kind === 'consented') {
      await authorize('marketing');
      const { data, error } = await db
        .from('customers')
        .select('id,name,phone,whatsapp')
        .eq('marketing_consent', true)
        .not('consent_at', 'is', null)
        .eq('status', 'active')
        .limit(100);
      if (error) throw error;
      return Response.json({ data });
    }
    if (kind === 'customer_history') {
      await authorize('crm');
      const id = u.searchParams.get('id');
      const tables = [
        'customer_addresses',
        'customer_followups',
        'flower_subscriptions',
        'invoices',
        'payments',
        'events',
      ];
      const history: Record<string, unknown> = {};
      for (const table of tables) {
        if (table === 'payments') continue;
        const { data, error } = await db.from(table).select('*').eq('customer_id', id).limit(100);
        history[table] = error ? 'Access restricted' : data;
      }
      return Response.json({ data: history });
    }
    if (kind === 'event_tasks') {
      await authorize('operations');
      const { data, error } = await db
        .from('event_tasks')
        .select('*')
        .eq('event_id', u.searchParams.get('id'))
        .limit(100);
      if (error) throw error;
      return Response.json({ data });
    }
    if (kind === 'subscription_items') {
      await authorize('operations');
      const id = u.searchParams.get('id');
      const { data, error } = await db
        .from('subscription_items')
        .select('*')
        .eq('subscription_id', id)
        .limit(100);
      if (error) throw error;
      return Response.json({ data });
    }
    if (kind === 'details') {
      const id = u.searchParams.get('id'),
        activeModule = u.searchParams.get('module');
      const table =
        activeModule === 'events'
          ? 'event_expenses'
          : activeModule === 'inventory'
            ? 'inventory_movements'
            : activeModule === 'subscriptions'
              ? 'subscription_pause_periods'
              : null;
      if (!table) throw new Error('Invalid module');
      const column =
        activeModule === 'events'
          ? 'event_id'
          : activeModule === 'inventory'
            ? 'item_id'
            : 'subscription_id';
      const { data, error } = await db
        .from(table)
        .select('*')
        .eq(column, id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return Response.json({ data });
    }
    if (profile.role === 'accountant') {
      const { data, error } = await db.rpc('billing_customers');
      if (error) throw error;
      return Response.json({
        data: (data ?? []).filter((c: { status: string }) => c.status === 'active'),
      });
    }
    const { data, error } = await db
      .from('customers')
      .select('id,name')
      .eq('status', 'active')
      .order('name')
      .limit(1000);
    if (error) throw error;
    return Response.json({ data });
  } catch (e) {
    return apiError(e);
  }
}
