// @vitest-environment jsdom
import { createElement } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => createElement('img', { src, alt }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
import { Admin } from '../src/components/admin';
import { StudioDataCache } from '../src/components/studio-data-cache';
const profile = { id: 'editor-one', role: 'editor', display_name: 'Editor' };
const photo = {
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Weddings',
  description: 'Original floral setup',
  status: 'published',
  image_url: '/images/wedding.jpg',
};
const response = (data: unknown[], count = data.length) =>
  new Response(JSON.stringify({ data, count }));
function workspace(module: string, id = profile.id) {
  return (
    <StudioDataCache>
      <Admin key={module + id} module={module} profile={{ ...profile, id }} />
    </StudioDataCache>
  );
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('restores a visited tab immediately and updates it after its background refresh', async () => {
  let visits = 0;
  let refresh!: (value: Response) => void;
  vi.stubGlobal(
    'fetch',
    vi.fn((path: string) => {
      if (path.startsWith('/api/admin/services')) {
        visits++;
        return visits === 1
          ? Promise.resolve(response([photo]))
          : new Promise<Response>((resolve) => {
              refresh = resolve;
            });
      }
      return Promise.resolve(response([]));
    }),
  );
  const view = render(workspace('services'));
  await screen.findByText('Original floral setup');
  view.rerender(workspace('cms'));
  await screen.findByText('A fresh start.');
  view.rerender(workspace('services'));
  expect(screen.getByText('Original floral setup')).toBeTruthy();
  expect(screen.queryByText('Loading your records…')).toBeNull();
  await waitFor(() => expect(visits).toBe(2));
  await act(async () => refresh(response([{ ...photo, description: 'Updated floral setup' }])));
  expect(await screen.findByText('Updated floral setup')).toBeTruthy();
});

it('isolates cached records between signed-in users', async () => {
  let visits = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn((path: string) => {
      if (path.startsWith('/api/admin/services')) {
        visits++;
        return visits === 1 ? Promise.resolve(response([photo])) : new Promise<Response>(() => {});
      }
      return Promise.resolve(response([]));
    }),
  );
  const view = render(workspace('services'));
  await screen.findByText('Original floral setup');
  view.rerender(workspace('services', 'editor-two'));
  expect(screen.queryByText('Original floral setup')).toBeNull();
  expect(screen.getByText('Loading your records…')).toBeTruthy();
});

it('ignores a late search response after a newer query has finished', async () => {
  let slow!: (value: Response) => void;
  let slowSignal: AbortSignal | undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn((path: string, init?: RequestInit) => {
      if (path.includes('search=old')) {
        slowSignal = init?.signal as AbortSignal;
        return new Promise<Response>((resolve) => {
          slow = resolve;
        });
      }
      if (path.includes('search=new'))
        return Promise.resolve(response([{ ...photo, name: 'Newest result' }]));
      return Promise.resolve(response([{ ...photo, name: 'Original floral setup' }]));
    }),
  );
  render(workspace('catalog'));
  await screen.findByText('Original floral setup');
  const search = screen.getByPlaceholderText(/Search/);
  fireEvent.change(search, { target: { value: 'old' } });
  await waitFor(() => expect(slow).toBeDefined());
  fireEvent.change(search, { target: { value: 'new' } });
  await screen.findByText('Newest result');
  expect(slowSignal?.aborted).toBe(true);
  await act(async () => slow(response([{ ...photo, name: 'Outdated result' }])));
  expect(screen.queryByText('Outdated result')).toBeNull();
  expect(screen.getByText('Newest result')).toBeTruthy();
});
