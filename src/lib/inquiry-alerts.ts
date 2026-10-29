import 'server-only';
import { service } from './supabase/server';
import { sendInquiryAlert } from './inquiry-alert-provider';
import type { AlertChannel, AlertPreferences, InquiryAlertRecord } from './inquiry-alert-content';
export async function dispatchInquiryAlerts(inquiryId?: string, notificationId?: string) {
  const db = service();
  const { data: settings, error: settingsError } = await db
    .from('site_settings')
    .select('private')
    .eq('id', 1)
    .single();
  if (settingsError) throw new Error('Could not read alert settings');
  const prefs = (settings?.private ?? {}) as AlertPreferences;
  const { data: jobs, error } = await db.rpc('claim_inquiry_notifications', {
    p_inquiry_id: inquiryId ?? null,
    p_notification_id: notificationId ?? null,
    p_limit: 4,
  });
  if (error) throw new Error('Could not claim inquiry alerts');
  await Promise.all(
    (jobs ?? []).map(
      async (job: {
        id: string;
        inquiry_id: string;
        channel: AlertChannel;
        lease_token: string;
      }) => {
        const { data: inquiry, error: inquiryError } = await db
          .from('inquiries')
          .select('id,name,phone,email,type,message,details')
          .eq('id', job.inquiry_id)
          .single();
        const result =
          inquiryError || !inquiry
            ? {
                status: 'failed',
                last_error: 'The inquiry could not be read. No message was sent.',
              }
            : await sendInquiryAlert(
                job.channel,
                inquiry as InquiryAlertRecord,
                prefs,
                process.env,
              );
        const { error: saveError } = await db
          .from('inquiry_notifications')
          .update({ ...result, updated_at: new Date().toISOString() })
          .eq('id', job.id)
          .eq('lease_token', job.lease_token)
          .eq('status', 'processing');
        if (saveError) throw new Error('Could not save alert result');
      },
    ),
  );
  return (jobs ?? []).length;
}
