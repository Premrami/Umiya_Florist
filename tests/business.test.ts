import { describe, it, expect } from 'vitest';
import { calculateBill, can, isPaused } from '../src/lib/business';
import { validSignature } from '../src/lib/razorpay';
import { createHmac } from 'node:crypto';
describe('billing', () => {
  it('excludes skipped deliveries and applies adjustments in integer paise', () => {
    const records = Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      amount: 5000,
      status: i < 28 ? 'delivered' : 'skipped',
    }));
    expect(calculateBill(records, 20000, 10000).total).toBe(150000);
  });
  it('rejects duplicate charges', () => {
    expect(() =>
      calculateBill([
        { id: '1', status: 'delivered', amount: 1 },
        { id: '1', status: 'delivered', amount: 1 },
      ]),
    ).toThrow('Duplicate');
  });
  it('rejects fractions and excessive discounts', () => {
    expect(() => calculateBill([{ id: '1', status: 'delivered', amount: 0.1 }])).toThrow();
    expect(() => calculateBill([], 0, 100)).toThrow();
  });
  it('includes pause boundaries', () =>
    expect(isPaused('2026-09-02', [{ start_date: '2026-09-01', end_date: '2026-09-02' }])).toBe(
      true,
    ));
});
describe('permissions', () => {
  it('keeps editors away from finances and customer records', () => {
    expect(can('editor', 'finance')).toBe(false);
    expect(can('editor', 'crm')).toBe(false);
    expect(can('editor', 'content')).toBe(true);
  });
  it('limits managers and staff', () => {
    expect(can('manager', 'owner')).toBe(false);
    expect(can('staff', 'finance')).toBe(false);
    expect(can('unknown', 'content')).toBe(false);
  });
});
describe('webhook signatures', () => {
  const raw = '{"event":"payment_link.paid"}',
    secret = 'test-secret',
    signature = createHmac('sha256', secret).update(raw).digest('hex');
  it('accepts exact signed bytes', () => expect(validSignature(raw, signature, secret)).toBe(true));
  it('rejects modified body, malformed or missing signatures', () => {
    expect(validSignature(raw + ' ', signature, secret)).toBe(false);
    expect(validSignature(raw, '', secret)).toBe(false);
    expect(validSignature(raw, 'z'.repeat(64), secret)).toBe(false);
  });
});
import { validateEnvironment } from '../src/lib/env';
import { sameOrigin } from '../src/lib/origin';
import { limitedText } from '../src/lib/limited-body';
describe('request and configuration boundaries', () => {
  it('rejects partial provider configuration without returning secrets', () => {
    expect(() => validateEnvironment({ RAZORPAY_KEY_ID: 'test' })).toThrow(
      'Incomplete configuration',
    );
    expect(validateEnvironment({}).payments).toBe(false);
  });
  it('compares browser origins against the actual development host', () => {
    expect(
      sameOrigin(
        new Request('http://localhost:3000/api', {
          headers: { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' },
        }),
      ),
    ).toBe(true);
    expect(
      sameOrigin(
        new Request('http://localhost:3000/api', {
          headers: { host: '127.0.0.1:3000', origin: 'https://attacker.example' },
        }),
      ),
    ).toBe(false);
  });
  it('limits request bodies even without Content-Length', async () => {
    await expect(
      limitedText(new Request('http://localhost', { method: 'POST', body: 'x'.repeat(100) }), 20),
    ).rejects.toThrow('BODY_TOO_LARGE');
  });
});
