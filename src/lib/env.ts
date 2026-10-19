import { z } from 'zod';
export function validateEnvironment(raw: Record<string, string | undefined>) {
  const has = (k: string) => !!raw[k]?.trim();
  for (const group of [
    ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'],
    ['RESEND_API_KEY', 'EMAIL_FROM'],
  ])
    if (group.some(has) && !group.every(has))
      throw new Error('Incomplete configuration group: ' + group.join(', '));
  for (const key of ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SENTRY_DSN'])
    if (has(key) && !z.url().safeParse(raw[key]).success)
      throw new Error('Invalid configuration URL: ' + key);
  return {
    supabase: has('NEXT_PUBLIC_SUPABASE_URL') && has('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    payments: has('RAZORPAY_KEY_ID') && has('RAZORPAY_KEY_SECRET'),
    webhooks: has('RAZORPAY_WEBHOOK_SECRET'),
    email: has('RESEND_API_KEY') && has('EMAIL_FROM'),
    monitoring: has('SENTRY_DSN'),
    inquiries: has('SUPABASE_SERVICE_ROLE_KEY') && has('INQUIRY_RATE_LIMIT_SALT'),
  };
}
