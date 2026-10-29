import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
}));
vi.mock('../src/lib/auth', () => ({
  authorize: mocks.authorize,
  apiError: () => Response.json({ error: 'Permission denied' }, { status: 403 }),
}));
import { GET } from '../src/app/api/admin/media/route';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ order: mocks.order });
  mocks.order.mockReturnValue({ range: mocks.range });
  mocks.authorize.mockResolvedValue({ db: { from: mocks.from } });
});
describe('media library listing', () => {
  it('serves a paginated JSON listing alongside the upload endpoint', async () => {
    const data = [{ id: 'fixture', name: 'bouquet.png' }];
    mocks.range.mockResolvedValue({ data, count: 26, error: null });
    const response = await GET(new Request('http://localhost/api/admin/media?page=1'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data, count: 26 });
    expect(mocks.authorize).toHaveBeenCalledWith('content');
    expect(mocks.from).toHaveBeenCalledWith('media_assets');
    expect(mocks.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mocks.range).toHaveBeenCalledWith(25, 49);
  });
  it('returns JSON for an empty library', async () => {
    mocks.range.mockResolvedValue({ data: [], count: 0, error: null });
    const response = await GET(new Request('http://localhost/api/admin/media'));
    expect(await response.json()).toEqual({ data: [], count: 0 });
  });
  it('does not read assets when content authorization fails', async () => {
    mocks.authorize.mockRejectedValue(new Error('FORBIDDEN'));
    const response = await GET(new Request('http://localhost/api/admin/media'));
    expect(response.status).toBe(403);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
