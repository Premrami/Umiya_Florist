import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  authorize: vi.fn(),
  origin: vi.fn(),
  read: vi.fn(),
  preserve: vi.fn(),
  invalidate: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
}));
vi.mock('../src/lib/auth', () => ({
  authorize: m.authorize,
  apiError: (e: Error) =>
    Response.json({ error: e.message }, { status: e.message === 'FORBIDDEN' ? 403 : 400 }),
}));
vi.mock('../src/lib/origin', () => ({ sameOrigin: m.origin }));
vi.mock('../src/lib/occasion-storage', () => ({
  readOccasionPhotos: m.read,
  preserveOccasionCover: m.preserve,
}));
vi.mock('../src/lib/public-cache', () => ({ invalidatePublicContent: m.invalidate }));
import { POST } from '../src/app/api/admin/decoration-photo/route';
const id = '44444444-4444-4444-8444-444444444444';
const photo = { id, name: 'wedding', image_url: '/images/wedding.jpg', status: 'published' };
const db = { from: m.from };
const req = (action = 'remove', recordId = id) =>
  new Request('http://localhost/api/admin/decoration-photo', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: recordId, action }),
  });
beforeEach(() => {
  vi.clearAllMocks();
  m.origin.mockReturnValue(true);
  m.authorize.mockResolvedValue({ db });
  m.read.mockResolvedValue({ services: [photo], sections: [] });
  m.preserve.mockResolvedValue(undefined);
  m.from.mockReturnValue({ update: m.update });
  m.update.mockReturnValue({ eq: m.eq });
  m.eq.mockReturnValue({ select: m.select });
  m.select.mockReturnValue({ single: m.single });
  m.single.mockResolvedValue({ data: { id, status: 'archived' }, error: null });
});
it('archives one gallery assignment after content authorization and preserves the front image', async () => {
  const response = await POST(req());
  expect(response.status).toBe(200);
  expect(m.authorize).toHaveBeenCalledWith('content');
  expect(m.preserve).toHaveBeenCalledWith(db, 'Weddings', [photo], []);
  expect(m.from).toHaveBeenCalledExactlyOnceWith('services');
  expect(m.update).toHaveBeenCalledWith({ status: 'archived' });
  expect(m.eq).toHaveBeenCalledWith('id', id);
  expect(m.invalidate).toHaveBeenCalledWith('services');
});
it('restores a deleted photo only as a draft', async () => {
  m.read.mockResolvedValueOnce({ services: [{ ...photo, status: 'archived' }], sections: [] });
  m.single.mockResolvedValueOnce({ data: { id, status: 'draft' }, error: null });
  expect((await POST(req('restore'))).status).toBe(200);
  expect(m.update).toHaveBeenCalledWith({ status: 'draft' });
  expect(m.preserve).not.toHaveBeenCalled();
});
it('rejects requests without permission or from another origin', async () => {
  m.origin.mockReturnValueOnce(false);
  expect((await POST(req())).status).toBe(403);
  expect(m.authorize).not.toHaveBeenCalled();
  m.authorize.mockRejectedValueOnce(new Error('FORBIDDEN'));
  expect((await POST(req())).status).toBe(403);
  expect(m.read).not.toHaveBeenCalled();
  expect(m.from).not.toHaveBeenCalled();
});
it('validates the record identifier and action before accessing records', async () => {
  expect((await POST(req('remove', 'invalid'))).status).toBe(400);
  expect((await POST(req('erase-file'))).status).toBe(400);
  expect(m.read).not.toHaveBeenCalled();
});
it('reports missing photos and refuses to restore an active photo', async () => {
  m.read.mockResolvedValueOnce({ services: [], sections: [] });
  expect((await POST(req())).status).toBe(404);
  expect((await POST(req('restore'))).status).toBe(409);
  expect(m.from).not.toHaveBeenCalled();
});
it('does not archive if preserving the current front image fails', async () => {
  m.preserve.mockRejectedValueOnce(new Error('Could not preserve cover'));
  expect((await POST(req())).status).toBe(400);
  expect(m.update).not.toHaveBeenCalled();
  expect(m.invalidate).not.toHaveBeenCalled();
});
it('does not claim deletion succeeded after a failed or missing update', async () => {
  m.single.mockResolvedValueOnce({ data: null, error: new Error('Failed') });
  expect((await POST(req())).status).toBe(400);
  m.single.mockResolvedValueOnce({ data: null, error: null });
  expect((await POST(req())).status).toBe(404);
  expect(m.invalidate).not.toHaveBeenCalled();
});
