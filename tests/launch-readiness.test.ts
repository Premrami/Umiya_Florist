import { describe, it, expect } from 'vitest';
import { launchChecks } from '../src/lib/readiness';
import { privacyNoticeReady, formattedAddress } from '../src/lib/business-details';
import { vitalsSchema } from '../src/lib/vitals';
describe('launch settings and anonymous metrics', () => {
  it('does not mark missing business facts or local domain ready', () => {
    const checks = launchChecks({}, { NEXT_PUBLIC_APP_URL: 'http://localhost:3000' });
    expect(checks.find((x) => x.id === 'domain')?.ready).toBe(false);
    expect(checks.find((x) => x.id === 'privacy')?.ready).toBe(false);
    expect(privacyNoticeReady({})).toBe(false);
    expect(formattedAddress({})).toBe('');
  });
  it('accepts reviewed details without inventing a retention period', () => {
    const settings = {
      phone: '+919876543210',
      email: 'test@example.com',
      address_street: 'Test street',
      address_locality: 'Test city',
      address_region: 'Test state',
      address_postal_code: '12345',
      address_country: 'IN',
      privacy_contact_email: 'privacy@example.com',
      privacy_retention: 'Owner-approved fixture wording',
      privacy_reviewed_on: '2026-10-29',
    };
    expect(
      launchChecks(settings, {
        NEXT_PUBLIC_APP_URL: 'https://flowers.example.com',
        SUPABASE_SERVICE_ROLE_KEY: 'fixture',
        INQUIRY_RATE_LIMIT_SALT: 'fixture',
      }).every((c) => c.ready),
    ).toBe(true);
  });
  it('rejects metric payloads carrying queries or extra identifying data', () => {
    const valid = { name: 'INP', value: 80, rating: 'good', path: '/' };
    expect(vitalsSchema.safeParse(valid).success).toBe(true);
    for (const bad of [
      { ...valid, path: '/?phone=123' },
      { ...valid, email: 'test@example.com' },
      { ...valid, value: -1 },
      { ...valid, value: Infinity },
      { ...valid, path: '/admin/clients' },
    ])
      expect(vitalsSchema.safeParse(bad).success).toBe(false);
  });
});
