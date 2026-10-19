// @vitest-environment jsdom
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Login } from '../src/components/login';
import { Admin } from '../src/components/admin';
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
