// @vitest-environment jsdom
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { Login } from '../src/components/login';
import { Admin } from '../src/components/admin';
import { specs } from '../src/lib/modules';
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify({ data: [], count: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    ),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('protected UI', () => {
  it('offers no preview authentication bypass when backend is absent', () => {
    render(<Login configured={false} />);
    expect(
      (screen.getByRole('button', { name: 'Enter your studio' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getByText(/no preview login/)).toBeTruthy();
  });
  it('does not expose financial navigation to content editors', () => {
    render(<Admin module="cms" profile={{ display_name: 'Editor', role: 'editor' }} />);
    expect(screen.queryByRole('link', { name: 'Invoices' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Payments' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Website CMS' })).toBeTruthy();
  });
  it('retains a client form after a failed save instead of showing success', async () => {
    const fetcher = vi.mocked(fetch);
    fetcher.mockImplementation(
      async (_url, init) =>
        new Response(
          JSON.stringify(
            init?.method === 'POST' ? { error: 'Phone already exists' } : { data: [], count: 0 },
          ),
          {
            status: init?.method === 'POST' ? 400 : 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
    );
    render(<Admin module="clients" profile={{ display_name: 'Owner', role: 'owner' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add client' }));
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Development fixture' },
    });
    fireEvent.change(screen.getByLabelText('Phone (digits, country code)'), {
      target: { value: '919999999999' },
    });
    fireEvent.change(screen.getByLabelText('Customer type'), { target: { value: 'Other' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'active' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('Phone already exists'),
    );
    expect((screen.getByLabelText('Full name') as HTMLInputElement).value).toBe(
      'Development fixture',
    );
    expect(screen.queryByText('Your changes have been saved.')).toBeNull();
  });
});

describe('CMS deletion', () => {
  it.each([false, true])('requires confirmation and handles a failed request: %s', async (fail) => {
    const row = {
      id: '44444444-4444-4444-8444-444444444444',
      key: 'hero',
      draft: {},
      published_at: null,
    };
    let deleted = false;
    const fetcher = vi.mocked(fetch);
    fetcher.mockImplementation(async (_url, init) => {
      if (init?.method === 'POST') {
        if (!fail) deleted = true;
        return new Response(
          JSON.stringify(fail ? { error: 'Could not delete section' } : { data: null }),
          { status: fail ? 400 : 200 },
        );
      }
      return new Response(JSON.stringify({ data: deleted ? [] : [row], count: deleted ? 0 : 1 }), {
        status: 200,
      });
    });
    render(<Admin module="cms" profile={{ display_name: 'Editor', role: 'editor' }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(screen.getByText(/This permanently deletes/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete section' }));
    await waitFor(() =>
      expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1),
    );
    const submission = fetcher.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(JSON.parse(String(submission?.[1]?.body))).toMatchObject({
      action: 'delete_section',
      id: row.id,
    });
    if (fail) {
      await screen.findAllByText('Could not delete section');
      expect(screen.getByRole('button', { name: 'Delete section' })).toBeTruthy();
      expect(screen.queryByText('Section deleted successfully.')).toBeNull();
    } else {
      await screen.findByText('Section deleted successfully.');
      expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    }
  });
});

describe('business settings save', () => {
  it.each([false, true])('saves blank settings and alert switches set to %s', async (enabled) => {
    const row = {
      id: 1,
      private: {
        invoice_prefix: 'UF',
        quotation_prefix: 'UQ',
        due_days: 7,
        gstin: '',
        tax_bps: 0,
        invoice_footer: '',
        payment_instructions: '',
        retention_days: 365,
        default_delivery_charge: 0,
        inquiry_alert_phone: '+12025550123',
        inquiry_whatsapp_enabled: !enabled,
        inquiry_sms_enabled: !enabled,
      },
      public: { name: 'Umiya Florist' },
    };
    let submitted: any;
    vi.mocked(fetch).mockImplementation(async (_url, init) => {
      if (init?.method === 'POST') {
        submitted = JSON.parse(String(init.body));
        const parsed = specs.settings.schema.safeParse(submitted);
        return new Response(
          JSON.stringify(parsed.success ? { data: submitted } : { error: 'Invalid settings' }),
          {
            status: parsed.success ? 200 : 400,
          },
        );
      }
      return new Response(JSON.stringify({ data: [row], count: 1 }));
    });
    render(<Admin module="settings" profile={{ display_name: 'Owner', role: 'owner' }} />);
    await screen.findByText(/Umiya Florist/, { selector: '.cell-value' });
    fireEvent.click(screen.getByRole('button', { name: 'Edit settings' }));
    for (const label of [
      'Enable WhatsApp inquiry alerts to admin',
      'Enable SMS inquiry alerts to admin',
    ]) {
      fireEvent.click(screen.getByLabelText(label));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Your changes have been saved.');
    expect(submitted.private.gstin).toBe('');
    expect(submitted.private.payment_instructions).toBe('');
    expect(submitted.public.phone).toBe('');
    expect(submitted.public.instagram).toBe('');
    expect(submitted.private.inquiry_sms_enabled).toBe(enabled);
    expect(submitted.private.inquiry_whatsapp_enabled).toBe(enabled);
  });
});

describe('inquiry deletion', () => {
  it.each([false, true])('requires confirmation and handles a failed delete: %s', async (fail) => {
    const row = {
      id: '44444444-4444-4444-8444-444444444444',
      name: 'Inquiry fixture',
      phone: '+12025550123',
      type: 'General',
      message: 'Flowers',
      status: 'converted',
      customer_id: '55555555-5555-4555-8555-555555555555',
    };
    let deleted = false;
    const fetcher = vi.mocked(fetch);
    fetcher.mockImplementation(async (_url, init) => {
      if (init?.method === 'POST') {
        if (!fail) deleted = true;
        return new Response(
          JSON.stringify(fail ? { error: 'Could not delete inquiry' } : { data: { id: row.id } }),
          { status: fail ? 400 : 200 },
        );
      }
      return new Response(JSON.stringify({ data: deleted ? [] : [row], count: deleted ? 0 : 1 }));
    });
    render(<Admin module="inquiries" profile={{ display_name: 'Staff', role: 'manager' }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(screen.getByText(/Linked clients stay in Studio/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete inquiry' }));
    await waitFor(() =>
      expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1),
    );
    expect(
      JSON.parse(String(fetcher.mock.calls.find(([, init]) => init?.method === 'POST')?.[1]?.body)),
    ).toEqual({ action: 'delete_inquiry', id: row.id });
    if (fail) {
      await screen.findAllByText('Could not delete inquiry');
      expect(screen.getByRole('button', { name: 'Delete inquiry' })).toBeTruthy();
      expect(screen.queryByText('Inquiry deleted successfully.')).toBeNull();
    } else {
      await screen.findByText('Inquiry deleted successfully.');
      expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    }
  });
});

describe('Studio bottom navigation', () => {
  it('offers CRM shortcuts and opens the complete navigation with More', async () => {
    render(<Admin module="inquiries" profile={{ display_name: 'Owner', role: 'owner' }} />);
    const dock = within(screen.getByRole('navigation', { name: 'Studio quick navigation' }));
    expect(dock.getByRole('link', { name: 'Inquiries' }).getAttribute('href')).toBe(
      '/admin/inquiries',
    );
    expect(dock.getByRole('link', { name: 'Inquiries' }).getAttribute('aria-current')).toBe('page');
    expect(dock.getByRole('button', { name: 'More' }).getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(dock.getByRole('button', { name: 'More' }));
    expect(screen.getByRole('dialog', { name: 'Studio navigation' })).toBeTruthy();
    expect(dock.getByRole('button', { name: 'More' }).getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Studio navigation' })).toBeNull();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
  it('keeps client and inquiry shortcuts out of content editors’ navigation', () => {
    render(<Admin module="cms" profile={{ display_name: 'Editor', role: 'editor' }} />);
    const dock = within(screen.getByRole('navigation', { name: 'Studio quick navigation' }));
    expect(dock.queryByRole('link', { name: 'Inquiries' })).toBeNull();
    expect(dock.queryByRole('link', { name: 'Clients' })).toBeNull();
    expect(dock.getByRole('link', { name: 'Content' }).getAttribute('href')).toBe('/admin/cms');
  });
});
