import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  authorize: vi.fn(),
  origin: vi.fn(),
  invalidate: vi.fn(),
  insert: vi.fn(),
  selectInserted: vi.fn(),
  from: vi.fn(),
  order: vi.fn(),
  sections: vi.fn(),
  upsert: vi.fn(),
}));
vi.mock('../src/lib/auth', () => ({
  authorize: m.authorize,
  apiError: () => Response.json({ error: 'Request failed' }, { status: 400 }),
}));
vi.mock('../src/lib/origin', () => ({ sameOrigin: m.origin }));
vi.mock('../src/lib/public-cache', () => ({ invalidatePublicContent: m.invalidate }));
import { GET, POST } from '../src/app/api/admin/occasion-gallery/route';
const payload = {
  occasion: 'Weddings',
  description: 'Floral backdrop',
  status: 'published',
  photos: ['/images/hero.jpg', '/images/wedding.jpg'],
};
const request = (body: unknown = payload) =>
  new Request('http://localhost/api/admin/occasion-gallery', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.clearAllMocks();
  m.origin.mockReturnValue(true);
  let n = 0;
  m.order.mockImplementation(() =>
    ++n % 2
      ? { order: m.order }
      : Promise.resolve({
          data: [{ name: 'wedding', image_url: '/images/roses.jpg', status: 'published' }],
          error: null,
        }),
  );
  m.insert.mockReturnValue({ select: m.selectInserted });
  m.selectInserted.mockResolvedValue({ data: [{ id: '1' }, { id: '2' }], error: null });
  m.sections.mockResolvedValue({
    data: [
      {
        key: 'occasion_weddings',
        published: { image_url: '/images/roses.jpg' },
        draft: { image_url: '/images/roses.jpg' },
      },
    ],
    error: null,
  });
  m.upsert.mockResolvedValue({ error: null });
  m.from.mockImplementation((table) =>
    table === 'site_sections'
      ? { select: () => ({ in: m.sections }), upsert: m.upsert }
      : { select: () => ({ order: m.order }), insert: m.insert },
  );
  m.authorize.mockResolvedValue({ db: { from: m.from } });
});
it('validates and atomically inserts all gallery entries using the existing occasion name', async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ count: 2, placement: 'gallery' });
  expect(m.authorize).toHaveBeenCalledWith('content');
  expect(m.insert).toHaveBeenCalledOnce();
  expect(m.insert.mock.calls[0][0]).toEqual(
    payload.photos.map((image_url) => ({
      name: 'wedding',
      description: 'Floral backdrop',
      status: 'published',
      image_url,
    })),
  );
  expect(m.invalidate).toHaveBeenCalledWith('services');
});
it('rejects unapproved photos without writing or invalidating public content', async () => {
  expect(
    (await POST(request({ ...payload, photos: ['https://unsafe.example/a.jpg'] }))).status,
  ).toBe(400);
  expect(m.insert).not.toHaveBeenCalled();
  expect(m.invalidate).not.toHaveBeenCalled();
});
it('rejects empty, oversized batches and unknown occasions', async () => {
  for (const body of [
    { ...payload, photos: [] },
    { ...payload, photos: Array(21).fill('/images/hero.jpg') },
    { ...payload, occasion: 'Unknown' },
  ])
    expect((await POST(request(body))).status).toBe(400);
  expect(m.insert).not.toHaveBeenCalled();
});
it('does not access the database for cross-origin or unauthorized requests', async () => {
  m.origin.mockReturnValue(false);
  await POST(request());
  expect(m.authorize).not.toHaveBeenCalled();
  m.origin.mockReturnValue(true);
  m.authorize.mockRejectedValueOnce(new Error('FORBIDDEN'));
  await POST(request());
  expect(m.from).not.toHaveBeenCalled();
});
it('never reports success or invalidates the website after a failed batch write', async () => {
  m.selectInserted.mockResolvedValueOnce({ data: null, error: new Error('database error') });
  expect((await POST(request())).status).toBe(400);
  expect(m.invalidate).not.toHaveBeenCalled();
});

it('reuses an existing matching published photo without creating duplicate records', async () => {
  let n = 0;
  m.order.mockImplementation(() =>
    ++n % 2
      ? { order: m.order }
      : Promise.resolve({
          data: [{ name: 'wedding', image_url: '/images/hero.jpg', status: 'published' }],
          error: null,
        }),
  );
  const response = await POST(request({ ...payload, photos: ['/images/hero.jpg'] }));
  expect(await response.json()).toEqual({ count: 0, placement: 'gallery' });
  expect(m.insert).not.toHaveBeenCalled();
});

it('publishes one independent front image and never inserts it into the gallery', async () => {
  const response = await POST(
    request({ ...payload, placement: 'cover', photos: ['/images/hero.jpg'] }),
  );
  expect(response.status).toBe(200);
  expect(m.insert).not.toHaveBeenCalled();
  expect(m.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      key: 'occasion_weddings',
      draft: { image_url: '/images/hero.jpg', description: payload.description },
      published: { image_url: '/images/hero.jpg', description: payload.description },
    }),
    { onConflict: 'key' },
  );
  expect(m.invalidate).toHaveBeenCalledWith('cms');
});
it('keeps the published front image unchanged when saving a draft replacement', async () => {
  await POST(
    request({ ...payload, placement: 'cover', status: 'draft', photos: ['/images/hero.jpg'] }),
  );
  expect(m.upsert.mock.calls[0][0]).not.toHaveProperty('published');
  expect(m.upsert.mock.calls[0][0]).not.toHaveProperty('published_at');
  expect(m.insert).not.toHaveBeenCalled();
});
it('rejects multiple front images and invalid photo placement', async () => {
  for (const body of [
    { ...payload, placement: 'cover' },
    { ...payload, placement: 'unknown' },
  ])
    expect((await POST(request(body))).status).toBe(400);
  expect(m.from).not.toHaveBeenCalled();
});
it('pins the existing main image before adding gallery-only photos', async () => {
  m.sections.mockResolvedValueOnce({ data: [], error: null });
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(m.upsert.mock.calls[0][0].published.image_url).toBe('/images/roses.jpg');
  expect(m.insert).toHaveBeenCalledOnce();
});
it('reports the current front image and per-occasion gallery count to authorized admins', async () => {
  const response = await GET();
  const result = await response.json();
  expect(result.data.find((row: { occasion: string }) => row.occasion === 'Weddings')).toEqual({
    occasion: 'Weddings',
    cover_url: '/images/roses.jpg',
    draft_cover_url: '/images/roses.jpg',
    gallery_count: 1,
  });
});

it('keeps an unpublished draft main image private when gallery photos are published', async () => {
  m.sections.mockResolvedValueOnce({
    data: [{ key: 'occasion_weddings', draft: { image_url: '/images/hero.jpg' }, published: null }],
    error: null,
  });
  const guarded = vi.fn().mockResolvedValue({ error: null });
  const where = vi.fn().mockReturnValue({ is: guarded });
  const update = vi.fn().mockReturnValue({ eq: where });
  m.from.mockImplementation((table) =>
    table === 'site_sections'
      ? { select: () => ({ in: m.sections }), upsert: m.upsert, update }
      : { select: () => ({ order: m.order }), insert: m.insert },
  );
  expect((await POST(request())).status).toBe(200);
  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({ published: { image_url: '/images/roses.jpg' } }),
  );
  expect(update.mock.calls[0][0]).not.toHaveProperty('draft');
  expect(guarded).toHaveBeenCalledWith('published', null);
});

it('does not claim a main-image update succeeded when CMS storage fails', async () => {
  m.upsert.mockResolvedValueOnce({ error: new Error('Storage failed') });
  const response = await POST(
    request({ ...payload, placement: 'cover', photos: ['/images/hero.jpg'] }),
  );
  expect(response.status).toBe(400);
  expect(m.insert).not.toHaveBeenCalled();
  expect(m.invalidate).not.toHaveBeenCalled();
});
