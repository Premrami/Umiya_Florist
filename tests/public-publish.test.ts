import { beforeEach, describe, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  origin: vi.fn(),
  invalidate: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
}));
vi.mock('../src/lib/auth', () => ({
  authorize: mocks.authorize,
  apiError: () => Response.json({ error: 'Invalid request' }, { status: 400 }),
}));
vi.mock('../src/lib/origin', () => ({ sameOrigin: mocks.origin }));
vi.mock('../src/lib/public-cache', () => ({ invalidatePublicContent: mocks.invalidate }));
import { POST } from '../src/app/api/admin/[module]/route';
const payload = {
  name: 'Fixture flowers',
  category: 'Fixture',
  image_url: '/images/roses.jpg',
  price: '',
  sort_order: '0',
  status: 'published',
};
const request = (body: unknown) =>
  new Request('http://localhost/api/admin/catalog', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.origin.mockReturnValue(true);
  mocks.authorize.mockResolvedValue({ db: { from: mocks.from } });
  mocks.from.mockReturnValue({ insert: mocks.insert });
  mocks.insert.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ single: mocks.single });
  mocks.single.mockResolvedValue({ data: { id: 'fixture' }, error: null });
});
describe('publishing cache synchronization', () => {
  it('expires public content only after a successful authorized save', async () => {
    const res = await POST(request(payload), { params: Promise.resolve({ module: 'catalog' }) });
    expect(res.status).toBe(200);
    expect(mocks.authorize).toHaveBeenCalledWith('content');
    expect(mocks.invalidate).toHaveBeenCalledExactlyOnceWith('catalog');
    expect(mocks.single.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.invalidate.mock.invocationCallOrder[0],
    );
  });
  it('does not report or invalidate a failed database save', async () => {
    mocks.single.mockResolvedValue({ data: null, error: { message: 'Fixture failure' } });
    expect(
      (await POST(request(payload), { params: Promise.resolve({ module: 'catalog' }) })).status,
    ).toBe(400);
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
  it('rejects invalid data before mutating or invalidating content', async () => {
    expect(
      (
        await POST(request({ ...payload, image_url: 'javascript:alert(1)' }), {
          params: Promise.resolve({ module: 'catalog' }),
        })
      ).status,
    ).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
});
