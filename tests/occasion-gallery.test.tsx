// @vitest-environment jsdom
import { createElement } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => createElement('img', { src, alt }),
}));
import { OccasionGallery } from '../src/components/occasion-gallery';
import { StudioImageField } from '../src/components/studio-image-field';
import { StudioOccasionGallery } from '../src/components/studio-occasion-gallery';
import { occasionPhotos } from '../src/lib/occasions';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('groups matching published photos, removes repeats and excludes other occasions and unsafe URLs', () => {
  expect(
    occasionPhotos(
      [
        { name: 'wedding', image_url: '/images/hero.jpg', status: 'published' },
        { name: 'Weddings', image_url: '/images/wedding.jpg', status: 'published' },
        { name: 'Weddings', image_url: '/images/hero.jpg', status: 'published' },
        { name: 'Weddings', image_url: '/images/roses.jpg', status: 'draft' },
        { name: 'Weddings', image_url: 'https://unsafe.example/image.jpg', status: 'published' },
        { name: 'Birthdays', image_url: '/images/bouquet.jpg', status: 'published' },
      ],
      'Weddings',
    ),
  ).toEqual(['/images/hero.jpg', '/images/wedding.jpg']);
});
it('opens photos, wraps navigation and returns to the thumbnail gallery', () => {
  render(
    <OccasionGallery occasion="Weddings" photos={['/images/hero.jpg', '/images/wedding.jpg']} />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open weddings photo 1' }));
  expect(screen.getByRole('status').textContent).toContain('1 of 2');
  fireEvent.click(screen.getByRole('button', { name: 'Previous occasion photo' }));
  expect(screen.getByRole('status').textContent).toContain('2 of 2');
  fireEvent.keyDown(screen.getByRole('button', { name: 'Next occasion photo' }), {
    key: 'ArrowRight',
  });
  expect(screen.getByRole('status').textContent).toContain('1 of 2');
  fireEvent.click(screen.getByRole('button', { name: 'Back to gallery' }));
  expect(screen.getByRole('button', { name: 'Open weddings photo 2' })).toBeTruthy();
});
it('shows an honest empty gallery and disables navigation for a single photo', () => {
  const view = render(<OccasionGallery occasion="Birthdays" photos={[]} />);
  expect(screen.getByText(/Photos for this occasion are being gathered/)).toBeTruthy();
  view.unmount();
  render(<OccasionGallery occasion="Weddings" photos={['/images/hero.jpg']} />);
  fireEvent.click(screen.getByRole('button', { name: 'Open weddings photo 1' }));
  expect(
    (screen.getByRole('button', { name: 'Next occasion photo' }) as HTMLButtonElement).disabled,
  ).toBe(true);
});
it('uploads several photos, retains successful uploads on failure, and can remove a selection', async () => {
  let calls = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      ++calls === 1
        ? new Response(JSON.stringify({ url: '/images/hero.jpg' }))
        : new Response(JSON.stringify({ error: 'Upload failed' }), { status: 400 }),
    ),
  );
  render(
    <form aria-label="Photos">
      <StudioImageField
        name="photos"
        label="Gallery photos"
        initialValue=""
        multiple
        onBusyChange={() => {}}
      />
    </form>,
  );
  fireEvent.change(screen.getByLabelText('Upload gallery photos'), {
    target: {
      files: [
        new File(['1'], 'one.jpg', { type: 'image/jpeg' }),
        new File(['2'], 'two.jpg', { type: 'image/jpeg' }),
      ],
    },
  });
  expect((await screen.findByRole('alert')).textContent).toContain('Upload failed');
  expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('photos')).toBe(
    '["/images/hero.jpg"]',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Remove selected photo 1' }));
  expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('photos')).toBe('[]');
});
it('blocks empty album saves, then saves an occasion batch with the selected publication state', async () => {
  const save = vi.fn(async () => {}),
    done = vi.fn();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ url: '/images/hero.jpg' }))),
  );
  render(<StudioOccasionGallery onSave={save} onDone={done} />);
  fireEvent.click(screen.getByRole('button', { name: 'Save gallery photos' }));
  expect(screen.getByRole('alert').textContent).toContain('at least one');
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Upload gallery photos'), {
    target: { files: [new File(['1'], 'one.jpg', { type: 'image/jpeg' })] },
  });
  await screen.findByAltText('Selected gallery photo 1');
  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: 'Save gallery photos' }) as HTMLButtonElement).disabled,
    ).toBe(false),
  );
  fireEvent.change(screen.getByLabelText('Occasion'), { target: { value: 'Balloon Decorations' } });
  fireEvent.change(screen.getByLabelText('Publishing'), { target: { value: 'published' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save gallery photos' }));
  await waitFor(() => expect(done).toHaveBeenCalledOnce());
  expect(save).toHaveBeenCalledWith({
    occasion: 'Balloon Decorations',
    placement: 'gallery',
    description: '',
    status: 'published',
    photos: ['/images/hero.jpg'],
  });
});

it('shows the selected occasion and saves a main photo without adding a gallery batch', async () => {
  const save = vi.fn(async () => {}),
    done = vi.fn();
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async (path: string, init?: RequestInit) =>
        new Response(
          JSON.stringify(
            init?.method === 'POST'
              ? { url: '/images/hero.jpg' }
              : {
                  data: [
                    {
                      occasion: 'Weddings',
                      cover_url: '/images/wedding.jpg',
                      draft_cover_url: '',
                      gallery_count: 3,
                    },
                    {
                      occasion: 'Balloon Decorations',
                      cover_url: '/images/roses.jpg',
                      draft_cover_url: '',
                      gallery_count: 7,
                    },
                  ],
                },
          ),
        ),
    ),
  );
  render(<StudioOccasionGallery onSave={save} onDone={done} />);
  expect(await screen.findByAltText('Weddings current main image')).toBeTruthy();
  expect(screen.getByText('3 published gallery photos')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Occasion'), { target: { value: 'Balloon Decorations' } });
  expect(screen.getByText('7 published gallery photos')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Photo use'), { target: { value: 'cover' } });
  expect(screen.getByText('Main image for Balloon Decorations')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Upload main section image'), {
    target: { files: [new File(['1'], 'cover.jpg', { type: 'image/jpeg' })] },
  });
  await screen.findByAltText('Main section image preview');
  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: 'Save main section image' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save main section image' }));
  await waitFor(() => expect(done).toHaveBeenCalledOnce());
  expect(save).toHaveBeenCalledWith({
    occasion: 'Balloon Decorations',
    placement: 'cover',
    description: '',
    status: 'draft',
    photos: ['/images/hero.jpg'],
  });
});
