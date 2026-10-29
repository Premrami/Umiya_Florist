// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FormInput } from '../src/components/form-input';
import { inquirySchema } from '../src/lib/inquiry-validation';
import { phoneSchema } from '../src/lib/phone-validation';
import { specs } from '../src/lib/modules';
afterEach(cleanup);
const inquiry = {
  name: 'Test customer',
  phone: '+919876543210',
  type: 'General',
  message: 'Test inquiry details',
  idempotency_key: '12345678-1234-4234-8234-123456789012',
};
describe('input validation', () => {
  it('normalizes phone formatting and rejects alphabetic or misplaced plus characters at the API', () => {
    expect(phoneSchema.parse('+91 (98765) 43210')).toBe('+919876543210');
    for (const phone of [
      'abc9876543210',
      '91+9876543210',
      '0000000000',
      '123',
      '+1234567890123456',
    ])
      expect(inquirySchema.safeParse({ ...inquiry, phone }).success).toBe(false);
  });
  it('rejects invalid guests, budgets, whitespace messages and impossible dates', () => {
    for (const patch of [
      { guests: '1e3' },
      { guests: '1.5' },
      { guests: '0' },
      { guests: '100001' },
      { budget: 'abc' },
      { budget: '-5' },
      { budget: '1.001' },
      { date: '2026-02-31' },
      { message: '       ' },
    ])
      expect(inquirySchema.safeParse({ ...inquiry, ...patch }).success).toBe(false);
    expect(
      inquirySchema.safeParse({ ...inquiry, guests: '25', budget: '2500.50', date: '2099-12-31' })
        .success,
    ).toBe(true);
  });
  it('filters typed and pasted phone text and preserves country code', () => {
    render(<FormInput aria-label="Phone" type="tel" />);
    const input = screen.getByLabelText('Phone') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '+91abc98765xyz43210' } });
    expect(input.value).toBe('+919876543210');
  });
  it('blocks exponent and decimal typing for whole paise without blocking shortcuts', () => {
    render(<FormInput aria-label="Price" type="number" min={0} step={1} />);
    const input = screen.getByLabelText('Price');
    for (const key of ['e', 'E', 'a', '-', '+', '.'])
      expect(fireEvent.keyDown(input, { key })).toBe(false);
    expect(fireEvent.keyDown(input, { key: 'a', ctrlKey: true })).toBe(true);
    expect(fireEvent.keyDown(input, { key: 'Backspace' })).toBe(true);
    expect(fireEvent.paste(input, { clipboardData: { getData: () => '2e3' } })).toBe(false);
  });
  it('allows negative and fractional stock but keeps amounts integral on the server', () => {
    render(<FormInput aria-label="Stock" type="number" min={-1e9} step="any" />);
    const input = screen.getByLabelText('Stock');
    expect(fireEvent.keyDown(input, { key: '-' })).toBe(true);
    expect(fireEvent.keyDown(input, { key: '.' })).toBe(true);
    expect(fireEvent.paste(input, { clipboardData: { getData: () => '-2.5' } })).toBe(true);
    const base = {
      customer_id: '12345678-1234-4234-8234-123456789012',
      name: 'Subscription',
      frequency: 'daily',
      start_date: '2026-10-28',
      end_date: '',
      status: 'active',
    };
    expect(specs.subscriptions.schema.safeParse({ ...base, daily_amount: '5.5' }).success).toBe(
      false,
    );
  });
  it('allows blank external links but rejects unsafe schemes in business settings', () => {
    const base = {
      private: {
        invoice_prefix: 'INV',
        quotation_prefix: 'QUO',
        due_days: 7,
        gstin: '',
        tax_bps: 0,
        invoice_footer: '',
        payment_instructions: '',
        retention_days: 365,
        default_delivery_charge: 0,
      },
      public: {
        name: 'Test florist',
        phone: '',
        whatsapp: '',
        address: '',
        hours: '',
        instagram: '',
        map_url: '',
        google_business: '',
      },
    };
    expect(specs.settings.schema.safeParse(base).success).toBe(true);
    for (const instagram of ['javascript:alert(1)', 'http://example.com'])
      expect(
        specs.settings.schema.safeParse({ ...base, public: { ...base.public, instagram } }).success,
      ).toBe(false);
    expect(
      specs.settings.schema.safeParse({
        ...base,
        public: { ...base.public, instagram: 'https://example.com' },
      }).success,
    ).toBe(true);
  });
});
