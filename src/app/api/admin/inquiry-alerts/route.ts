import { z } from 'zod';
import { authorize, apiError } from '@/lib/auth';
import { sameOrigin } from '@/lib/origin';
import { service } from '@/lib/supabase/server';
import { dispatchInquiryAlerts } from '@/lib/inquiry-alerts';
import { inquiryAlertConfiguration } from '@/lib/inquiry-alert-content';
export const maxDuration = 60;
export async function GET() {
  try {
    const { db } = await authorize('owner');
    const [settings, jobs] = await Promise.all([
      db.from('site_settings').select('private').eq('id', 1).single(),
      db
        .from('inquiry_notifications')
        .select(
          'id,inquiry_id,channel,status,attempts,last_error,created_at,updated_at,provider_id,provider_status',
        )
        .order('created_at', { ascending: false })
        .limit(12),
    ]);
    if (settings.error) throw settings.error;
    if (jobs.error)
      return Response.json(
        { error: 'Admin alerts need database update 014. Follow the inquiry alerts setup guide.' },
        { status: 503 },
      );
    return Response.json({
      data: {
        config: inquiryAlertConfiguration(settings.data?.private ?? {}, process.env),
        jobs: jobs.data,
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new Error('FORBIDDEN');
    await authorize('owner');
    const { id } = z.object({ id: z.uuid() }).parse(await req.json());
    const db = service();
    const [{ data: job, error }, { data: settings, error: settingsError }] = await Promise.all([
      db
        .from('inquiry_notifications')
        .select('inquiry_id,channel,status,attempts')
        .eq('id', id)
        .single(),
      db.from('site_settings').select('private').eq('id', 1).single(),
    ]);
    if (error || settingsError || !job) throw new Error('Invalid alert');
    if (!['failed', 'not_configured', 'disabled'].includes(job.status) || job.attempts >= 5)
      throw new Error('Alert cannot be retried');
    const config = inquiryAlertConfiguration(settings?.private ?? {}, process.env);
    if (!(job.channel === 'whatsapp' ? config.whatsappReady : config.smsReady))
      return Response.json(
        { error: 'Complete the admin phone, channel and provider setup first.' },
        { status: 400 },
      );
    const { data: claimed, error: retryError } = await db
      .from('inquiry_notifications')
      .update({
        status: 'pending',
        last_error: null,
        provider_id: null,
        provider_status: null,
        lease_token: null,
        locked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .in('status', ['failed', 'not_configured', 'disabled'])
      .select('id')
      .single();
    if (retryError || !claimed) throw new Error('Alert state changed');
    await dispatchInquiryAlerts(job.inquiry_id, id);
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
