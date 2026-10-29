import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  service: vi.fn(),
  from: vi.fn(),
  remove: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  origin: vi.fn(),
}));
vi.mock('../src/lib/auth', () => ({
  authorize: mocks.authorize,
  apiError: (e: Error) =>
    Response.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 400 }),
}));
vi.mock('../src/lib/supabase/server', () => ({ service: mocks.service }));
vi.mock('../src/lib/origin', () => ({ sameOrigin: mocks.origin }));
vi.mock('../src/lib/razorpay', () => ({ razorpay: vi.fn() }));
import { POST } from '../src/app/api/admin/actions/route';
const id = '44444444-4444-4444-8444-444444444444';
const request = (recordId = id) =>
  new Request('http://localhost/api/admin/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_inquiry', id: recordId }),
  });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.origin.mockReturnValue(true);
  mocks.authorize.mockResolvedValue({ db: {} });
  mocks.service.mockReturnValue({ from: mocks.from });
  mocks.from.mockReturnValue({ delete: mocks.remove });
  mocks.remove.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ single: mocks.single });
  mocks.single.mockResolvedValue({ data: { id }, error: null });
});
describe('protected inquiry deletion', () => {
  it('deletes exactly one inquiry only after CRM authorization', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { id } });
    expect(mocks.authorize).toHaveBeenCalledWith('crm');
    expect(mocks.authorize.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.service.mock.invocationCallOrder[0],
    );
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith('inquiries');
    expect(mocks.eq).toHaveBeenCalledExactlyOnceWith('id', id);
    expect(mocks.select).toHaveBeenCalledWith('id');
  });
  it('refuses deletion when staff lacks CRM access', async () => {
    mocks.authorize.mockRejectedValue(new Error('FORBIDDEN'));
    expect((await POST(request())).status).toBe(403);
    expect(mocks.service).not.toHaveBeenCalled();
  });
  it('rejects cross-origin requests before authentication or database access', async () => {
    mocks.origin.mockReturnValue(false);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.authorize).not.toHaveBeenCalled();
    expect(mocks.service).not.toHaveBeenCalled();
  });
  it('rejects invalid record identifiers before accessing the database', async () => {
    expect((await POST(request('bad-id'))).status).toBe(400);
    expect(mocks.service).not.toHaveBeenCalled();
  });
  it('does not report success for a missing inquiry', async () => {
    mocks.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    expect((await POST(request())).status).toBe(404);
  });
  it('reports failed deletion instead of success', async () => {
    mocks.single.mockResolvedValue({ data: null, error: new Error('Database failed') });
    expect((await POST(request())).status).toBe(400);
  });
});
