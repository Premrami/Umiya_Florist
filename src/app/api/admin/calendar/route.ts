import { authorize, apiError } from '@/lib/auth';
import { z } from 'zod';
export async function GET(req: Request) {
  try {
    const { db } = await authorize('operations'),
      month = z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .parse(new URL(req.url).searchParams.get('month'));
    const start = month + '-01',
      d = new Date(start + 'T00:00:00Z');
    d.setUTCMonth(d.getUTCMonth() + 1);
    const { data, error } = await db
      .from('events')
      .select('id,name,event_date,status')
      .gte('event_date', start)
      .lt('event_date', d.toISOString().slice(0, 10))
      .order('event_date')
      .limit(500);
    if (error) throw error;
    return Response.json({ data });
  } catch (e) {
    return apiError(e);
  }
}
