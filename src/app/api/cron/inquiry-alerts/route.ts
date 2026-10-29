import { timingSafeEqual } from 'node:crypto';
import { dispatchInquiryAlerts } from '@/lib/inquiry-alerts';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = Buffer.from(req.headers.get('authorization') ?? '');
  const expected = Buffer.from('Bearer ' + (secret ?? ''));
  if (
    !secret ||
    secret.length < 32 ||
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return Response.json({ processed: await dispatchInquiryAlerts() });
  } catch {
    return Response.json({ error: 'Could not process inquiry alerts' }, { status: 503 });
  }
}
