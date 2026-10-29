export type AlertChannel = 'whatsapp' | 'sms';
export type InquiryAlertRecord = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  type: string;
  message: string;
  details: Record<string, unknown> | null;
};
export type AlertPreferences = {
  inquiry_alert_phone?: string;
  inquiry_whatsapp_enabled?: boolean;
  inquiry_sms_enabled?: boolean;
};
export const alertFieldLabels: Record<string, string> = {
  flowers: 'Flowers',
  frequency: 'Delivery frequency',
  address: 'Delivery address',
  date: 'Preferred date',
  budget: 'Budget (INR)',
  occasion: 'Occasion',
  palette: 'Colour palette',
  size: 'Bouquet size',
  wrapping: 'Wrapping',
  gift_message: 'Gift message',
  event_type: 'Event type',
  venue: 'Venue',
  guests: 'Guests',
  preferred_contact: 'Preferred contact',
};
export const singleLine = (value: unknown) =>
  String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
export function clipAlert(value: string, max: number) {
  return value.length <= max
    ? value
    : value.slice(0, max - 1).replace(/[\uD800-\uDBFF]$/, '') + '…';
}
export function inquiryAlertDetails(inquiry: InquiryAlertRecord, max = 1200) {
  const rows = Object.entries(alertFieldLabels).flatMap(([key, label]) => {
    const value = singleLine(inquiry.details?.[key]);
    return value ? [`${label}: ${value}`] : [];
  });
  if (inquiry.email) rows.push(`Email: ${singleLine(inquiry.email)}`);
  rows.push(`Message: ${singleLine(inquiry.message)}`);
  const content = rows.join(' | ');
  const suffix = ' [More in Umiya Studio]';
  return content.length > max ? clipAlert(content, max - suffix.length) + suffix : content;
}
const phone = (value: unknown) => /^\+[1-9]\d{7,14}$/.test(String(value ?? ''));
export function inquiryAlertConfiguration(
  prefs: AlertPreferences,
  env: Record<string, string | undefined>,
) {
  const credentials =
    /^AC[0-9a-f]{32}$/i.test(env.TWILIO_ACCOUNT_SID ?? '') && !!env.TWILIO_AUTH_TOKEN?.trim();
  const recipient = phone(prefs.inquiry_alert_phone);
  const whatsapp =
    credentials &&
    recipient &&
    phone(env.TWILIO_WHATSAPP_FROM?.replace(/^whatsapp:/, '')) &&
    /^HX[0-9a-f]{32}$/i.test(env.TWILIO_WHATSAPP_CONTENT_SID ?? '');
  const sms =
    credentials &&
    recipient &&
    (phone(env.TWILIO_SMS_FROM) ||
      /^MG[0-9a-f]{32}$/i.test(env.TWILIO_SMS_MESSAGING_SERVICE_SID ?? ''));
  return {
    recipientConfigured: recipient,
    whatsappEnabled: prefs.inquiry_whatsapp_enabled === true,
    smsEnabled: prefs.inquiry_sms_enabled === true,
    whatsappReady: prefs.inquiry_whatsapp_enabled === true && whatsapp,
    smsReady: prefs.inquiry_sms_enabled === true && sms,
  };
}
