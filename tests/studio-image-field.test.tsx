// @vitest-environment jsdom
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => createElement('img', { src, alt }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }) }));
import { StudioImageField } from '../src/components/studio-image-field';
import { Admin } from '../src/components/admin';
const origin = 'https://preview.supabase.co';
const url = origin + '/storage/v1/object/public/promotional/sample.jpg';
const asset = {
  id: 'sample',
  name: 'Wedding photo.jpg',
  path: 'sample.jpg',
  public: true,
  mime_type: 'image/jpeg',
  alt_text: 'Wedding flowers',
};
function field(initialValue = '') {
  const onBusyChange = vi.fn();
  const view = render(
    <form aria-label="Photo form">
      <StudioImageField
        name="image_url"
        label="Photo"
        required
        initialValue={initialValue}
        onBusyChange={onBusyChange}
      />
    </form>,
  );
  return { ...view, onBusyChange };
}
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', origin);
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
  vi.unstubAllEnvs();
});
describe('photo upload and selection', () => {
  it('uploads through the existing API and stores its full returned URL', async () => {
    const fetcher = vi.fn(
      async () => new Response(JSON.stringify({ url, data: asset }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetcher);
    const { onBusyChange } = field();
    fireEvent.change(screen.getByLabelText('Photo description (optional)'), {
      target: { value: 'Wedding stage flowers' },
    });
    fireEvent.change(screen.getByLabelText('Upload photo'), {
      target: { files: [new File(['sample'], 'stage.jpg', { type: 'image/jpeg' })] },
    });
    await waitFor(() =>
      expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('image_url')).toBe(url),
    );
    expect(fetcher).toHaveBeenCalledOnce();
    const request = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(request[0]).toBe('/api/admin/media');
    expect((request[1].body as FormData).get('alt')).toBe('Wedding stage flowers');
    expect(onBusyChange.mock.calls.map(([value]) => value)).toEqual([true, false]);
    expect(screen.getByAltText('Photo preview')).toBeTruthy();
  });
  it('selects public images from the library without uploading or revealing private files', async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: [asset, { ...asset, id: 'private', name: 'Private photo', public: false }],
            count: 2,
          }),
        ),
    );
    vi.stubGlobal('fetch', fetcher);
    field();
    fireEvent.click(screen.getByRole('button', { name: 'Choose from Media library' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Use photo: Wedding photo.jpg' }));
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('image_url')).toBe(url);
    expect(screen.queryByRole('button', { name: 'Use photo: Private photo' })).toBeNull();
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it('rejects unsupported files before calling the server', () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    field();
    fireEvent.change(screen.getByLabelText('Upload photo'), {
      target: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] },
    });
    expect(screen.getByRole('alert').textContent).toContain('JPEG, PNG or WebP');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('keeps the existing photo when an upload fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'Upload failed' }), { status: 400 })),
    );
    field(url);
    fireEvent.change(screen.getByLabelText('Upload photo'), {
      target: { files: [new File(['sample'], 'new.jpg', { type: 'image/jpeg' })] },
    });
    expect((await screen.findByRole('alert')).textContent).toContain('Upload failed');
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('image_url')).toBe(url);
  });
  it('cancels an in-flight upload when its form is closed', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        signal = init.signal as AbortSignal;
        return new Promise((_resolve, reject) =>
          signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          ),
        );
      }),
    );
    const { unmount } = field();
    fireEvent.change(screen.getByLabelText('Upload photo'), {
      target: { files: [new File(['sample'], 'new.jpg', { type: 'image/jpeg' })] },
    });
    unmount();
    expect(signal?.aborted).toBe(true);
  });
  it('requires an occasion photo and saves a selected image through the unchanged service contract', async () => {
    const writes: Record<string, unknown>[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
          writes.push(JSON.parse(String(init.body)));
          return new Response(JSON.stringify({ data: {} }));
        }
        return new Response(
          JSON.stringify({
            data: path.startsWith('/api/admin/media') ? [asset] : [],
            count: path.startsWith('/api/admin/media') ? 1 : 0,
          }),
        );
      }),
    );
    render(<Admin module="services" profile={{ role: 'editor', display_name: 'Editor' }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add record' }));
    fireEvent.change(screen.getByLabelText('Service title'), { target: { value: 'Weddings' } });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Wedding flowers' },
    });
    fireEvent.change(screen.getByLabelText('Publishing'), { target: { value: 'published' } });
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }));
    expect((await screen.findByRole('alert')).textContent).toContain('choose a photo');
    expect(writes).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Choose from Media library' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Use photo: Wedding photo.jpg' }));
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }));
    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]).toEqual({
      name: 'Weddings',
      description: 'Wedding flowers',
      image_url: url,
      status: 'published',
    });
  });
});
