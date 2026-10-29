import { describe, expect, it, vi } from 'vitest';
import {
  inquiryAlertConfiguration,
  inquiryAlertDetails,
  type InquiryAlertRecord,
} from '../src/lib/inquiry-alert-content';
import { sendInquiryAlert } from '../src/lib/inquiry-alert-provider';
const inquiry: InquiryAlertRecord = {
  id: '66666666-6666-4666-8666-666666666666',
  name: 'Development fixture',
  phone: '+12025550123',
  email: 'fixture@example.com',
  type: 'Pooja Flower Subscription',
  message: 'Fresh flowers every morning please.',
  details: {
    flowers: 'Jasmine and marigold',
    frequency: 'Daily',
    address: 'Development test address',
    budget: '500',
    date: '2026-11-01',
  },
};
const env = {
  TWILIO_ACCOUNT_SID: 'AC' + '1'.repeat(32),
  TWILIO_AUTH_TOKEN: 'test-only-token',
  TWILIO_WHATSAPP_FROM: '+12025550124',
  TWILIO_WHATSAPP_CONTENT_SID: 'HX' + '2'.repeat(32),
  TWILIO_SMS_FROM: '+12025550125',
};
const prefs = {
  inquiry_alert_phone: '+12025550126',
  inquiry_whatsapp_enabled: true,
  inquiry_sms_enabled: true,
};
const accepted = () =>
  new Response(JSON.stringify({ sid: 'SM' + '3'.repeat(32), status: 'queued' }), { status: 201 });
describe('admin inquiry alert messages', () => {
  it('includes the daily flower requirements, address, frequency, date, budget and message', () => {
    const text = inquiryAlertDetails(inquiry);
    for (const value of [
      'Jasmine and marigold',
      'Delivery frequency: Daily',
      'Development test address',
      '500',
      '2026-11-01',
      inquiry.message,
    ])
      expect(text).toContain(value);
  });
  it('flattens template variables and clearly marks shortened content', () => {
    const text = inquiryAlertDetails(
      { ...inquiry, message: 'first\nsecond\t' + '🌸'.repeat(1000) },
      400,
    );
    expect(text.length).toBeLessThanOrEqual(400);
    expect(text).not.toMatch(/[\n\r\t]/);
    expect(text).toContain('[More in Umiya Studio]');
  });
  it('does not report incomplete provider credentials or a malformed phone as ready', () => {
    expect(inquiryAlertConfiguration(prefs, {}).whatsappReady).toBe(false);
    expect(inquiryAlertConfiguration({ ...prefs, inquiry_alert_phone: '123' }, env).smsReady).toBe(
      false,
    );
    expect(
      inquiryAlertConfiguration(prefs, { ...env, TWILIO_WHATSAPP_CONTENT_SID: '' }).smsReady,
    ).toBe(true);
    expect(
      inquiryAlertConfiguration(prefs, { ...env, TWILIO_WHATSAPP_CONTENT_SID: '' }).whatsappReady,
    ).toBe(false);
  });
  it('never contacts a provider when alerts are off or missing configuration', async () => {
    const request = vi.fn();
    expect((await sendInquiryAlert('sms', inquiry, {}, env, request)).status).toBe('disabled');
    expect((await sendInquiryAlert('whatsapp', inquiry, prefs, {}, request)).status).toBe(
      'not_configured',
    );
    expect(request).not.toHaveBeenCalled();
  });
  it('sends the approved WhatsApp template to the admin rather than the customer', async () => {
    const request = vi.fn(async () => accepted());
    const result = await sendInquiryAlert('whatsapp', inquiry, prefs, env, request);
    expect(result.status).toBe('provider_accepted');
    const [url, init] = request.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/^https:\/\/api.twilio.com\//);
    const body = new URLSearchParams(String(init.body));
    expect(body.get('To')).toBe('whatsapp:' + prefs.inquiry_alert_phone);
    expect(body.get('ContentSid')).toBe(env.TWILIO_WHATSAPP_CONTENT_SID);
    const variables = JSON.parse(body.get('ContentVariables')!);
    expect(variables['4']).toContain('Delivery frequency: Daily');
    expect(variables['3']).toBe(inquiry.phone);
    expect(body.has('Body')).toBe(false);
  });
  it('bounds SMS content and supports a messaging service sender', async () => {
    const request = vi.fn(async () => accepted());
    await sendInquiryAlert(
      'sms',
      { ...inquiry, message: 'x'.repeat(3000) },
      prefs,
      { ...env, TWILIO_SMS_MESSAGING_SERVICE_SID: 'MG' + '4'.repeat(32) },
      request,
    );
    const body = new URLSearchParams(
      String((request.mock.calls[0] as unknown as [string, RequestInit])[1].body),
    );
    expect(body.get('To')).toBe(prefs.inquiry_alert_phone);
    expect(body.get('Body')!.length).toBeLessThanOrEqual(1500);
    expect(body.get('Body')).toContain('Jasmine and marigold');
    expect(body.get('Body')).toContain('More in Umiya Studio');
    expect(body.has('From')).toBe(false);
    expect(body.get('MessagingServiceSid')).toMatch(/^MG/);
  });
  it.each([400, 429, 500])(
    'records HTTP %s without claiming delivery or exposing provider error text',
    async (status) => {
      const result = await sendInquiryAlert(
        'sms',
        inquiry,
        prefs,
        env,
        vi.fn(
          async () =>
            new Response(JSON.stringify({ code: 12345, message: 'private upstream detail' }), {
              status,
            }),
        ),
      );
      expect(result.status).toBe(status >= 500 ? 'uncertain' : 'failed');
      expect(result.last_error).not.toContain('private upstream detail');
    },
  );
  it('does not automatically retry a timeout with an unknown provider outcome', async () => {
    const request = vi.fn(async () => {
      throw new Error('timeout');
    });
    const result = await sendInquiryAlert('sms', inquiry, prefs, env, request);
    expect(result.status).toBe('uncertain');
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('does not claim acceptance for an invalid success response', async () => {
    expect(
      (
        await sendInquiryAlert(
          'sms',
          inquiry,
          prefs,
          env,
          vi.fn(async () => new Response('{}', { status: 201 })),
        )
      ).status,
    ).toBe('uncertain');
  });
});
