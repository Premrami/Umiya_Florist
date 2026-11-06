// @vitest-environment jsdom
import { createElement } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => createElement('img', { src, alt }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }) }));
import { Admin } from '../src/components/admin';
const id = '44444444-4444-4444-8444-444444444444';
const photo = {
  id,
  name: 'Weddings',
  description: 'Sample',
  status: 'published',
  image_url: '/images/wedding.jpg',
};
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('previews before deletion, cancels without a request, and restores deleted photos as drafts', async () => {
  let status = 'published';
  const writes: unknown[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body));
        writes.push(body);
        status = body.action === 'remove' ? 'archived' : 'draft';
        return new Response(JSON.stringify({ data: { id, status } }));
      }
      const deleted = path.includes('show_deleted=1');
      const data =
        path.startsWith('/api/admin/services') &&
        (deleted ? status === 'archived' : status !== 'archived')
          ? [{ ...photo, status }]
          : [];
      return new Response(JSON.stringify({ data, count: data.length }));
    }),
  );
  render(<Admin module="services" profile={{ role: 'editor', display_name: 'Editor' }} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Delete photo' }));
  expect(screen.getByAltText('Weddings photo to delete')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(writes).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Delete photo' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete photo' }));
  await waitFor(() => expect(writes).toEqual([{ id, action: 'remove' }]));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Delete photo' })).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: 'Show deleted photos' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Restore photo' }));
  await waitFor(() =>
    expect(writes).toEqual([
      { id, action: 'remove' },
      { id, action: 'restore' },
    ]),
  );
  expect(status).toBe('draft');
});
it('retains the confirmation and reports a failed deletion', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async (_path: string, init?: RequestInit) =>
        new Response(
          JSON.stringify(
            init?.method === 'POST'
              ? { error: 'Could not remove photo' }
              : { data: [photo], count: 1 },
          ),
          { status: init?.method === 'POST' ? 400 : 200 },
        ),
    ),
  );
  render(<Admin module="services" profile={{ role: 'editor', display_name: 'Editor' }} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Delete photo' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete photo' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Could not remove photo');
  expect(screen.getByRole('dialog')).toBeTruthy();
});
