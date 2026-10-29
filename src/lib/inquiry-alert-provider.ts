import {
  clipAlert,
  inquiryAlertConfiguration,
  inquiryAlertDetails,
  singleLine,
  type AlertChannel,
  type AlertPreferences,
  type InquiryAlertRecord,
} from './inquiry-alert-content';
export type AlertOutcome = {
  status: 'disabled' | 'not_configured' | 'provider_accepted' | 'failed' | 'uncertain';
  provider_id?: string;
  provider_status?: string;
  last_error: string | null;
};
export async function sendInquiryAlert(
  channel: AlertChannel,
  inquiry: InquiryAlertRecord,
  prefs: AlertPreferences,
  env: Record<string, string | undefined>,
  request: typeof fetch = fetch,
): Promise<AlertOutcome> {
  const config = inquiryAlertConfiguration(prefs, env);
  const enabled = channel === 'whatsapp' ? config.whatsappEnabled : config.smsEnabled;
  const ready = channel === 'whatsapp' ? config.whatsappReady : config.smsReady;
  if (!enabled) return { status: 'disabled', last_error: 'This alert channel is off in Settings.' };
  if (!ready)
    return {
      status: 'not_configured',
      last_error: 'Complete the admin phone and Twilio setup before sending.',
    };
  const fields = new URLSearchParams();
  const admin = prefs.inquiry_alert_phone!;
  if (channel === 'whatsapp') {
    fields.set('To', 'whatsapp:' + admin);
    fields.set('From', 'whatsapp:' + env.TWILIO_WHATSAPP_FROM!.replace(/^whatsapp:/, ''));
    fields.set('ContentSid', env.TWILIO_WHATSAPP_CONTENT_SID!);
    fields.set(
      'ContentVariables',
      JSON.stringify({
        '1': clipAlert(singleLine(inquiry.type), 80),
        '2': clipAlert(singleLine(inquiry.name), 100),
        '3': singleLine(inquiry.phone),
        '4': inquiryAlertDetails(inquiry, 900),
        '5': inquiry.id.slice(0, 8),
      }),
    );
  } else {
    fields.set('To', admin);
    if (env.TWILIO_SMS_MESSAGING_SERVICE_SID)
      fields.set('MessagingServiceSid', env.TWILIO_SMS_MESSAGING_SERVICE_SID);
    else fields.set('From', env.TWILIO_SMS_FROM!);
    fields.set(
      'Body',
      clipAlert(
        [
          'UMIYA FLORIST - New inquiry',
          `Type: ${singleLine(inquiry.type)}`,
          `Client: ${singleLine(inquiry.name)}`,
          `Phone: ${singleLine(inquiry.phone)}`,
          inquiryAlertDetails(inquiry, 1000),
          `Reference: ${inquiry.id.slice(0, 8)}. Open Umiya Studio > Inquiries for complete details.`,
        ].join('\n'),
        1500,
      ),
    );
  }
  try {
    const response = await request(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            Buffer.from(env.TWILIO_ACCOUNT_SID + ':' + env.TWILIO_AUTH_TOKEN).toString('base64'),
        },
        body: fields.toString(),
        signal: AbortSignal.timeout(8000),
        redirect: 'error',
      },
    );
    const json = await response.json().catch(() => ({}));
    if (!response.ok)
      return {
        status: response.status >= 500 ? 'uncertain' : 'failed',
        last_error: `Twilio HTTP ${response.status}${Number.isInteger(json.code) ? ' · code ' + json.code : ''}. Check provider logs.`,
      };
    if (!/^(SM|MM)[0-9a-f]{32}$/i.test(json.sid ?? ''))
      return {
        status: 'uncertain',
        last_error: 'Provider response did not include a valid message ID. Check Twilio logs.',
      };
    if (['failed', 'undelivered', 'canceled'].includes(json.status))
      return {
        status: 'failed',
        provider_id: json.sid,
        provider_status: json.status,
        last_error: 'Provider reported that this message was not sent.',
      };
    return {
      status: 'provider_accepted',
      provider_id: json.sid,
      provider_status: singleLine(json.status).slice(0, 40),
      last_error: null,
    };
  } catch {
    return {
      status: 'uncertain',
      last_error: 'The provider result could not be confirmed. Check Twilio logs before resending.',
    };
  }
}
