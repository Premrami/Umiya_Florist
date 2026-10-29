import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ origin: vi.fn(), authorize: vi.fn(), content: vi.fn() }));
vi.mock('../src/lib/origin', () => ({ sameOrigin: mocks.origin }));
vi.mock('../src/lib/auth', () => ({
  authorize: mocks.authorize,
  apiError: () => Response.json({ error: 'Permission denied' }, { status: 403 }),
}));
vi.mock('../src/lib/content', () => ({ publicContent: mocks.content }));
import { POST } from '../src/app/api/vitals/route';
import { GET } from '../src/app/api/admin/readiness/route';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.origin.mockReturnValue(true);
  mocks.authorize.mockResolvedValue({});
  mocks.content.mockResolvedValue({ settings: {} });
  vi.spyOn(console, 'info').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
const req = (data: unknown) =>
  new Request('http://localhost/api/vitals', { method: 'POST', body: JSON.stringify(data) });
describe('opt-in public metrics', () => {
  it('is off by default and refuses foreign origins', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_WEB_VITALS', 'false');
    expect((await POST(req({}))).status).toBe(404);
    vi.stubEnv('NEXT_PUBLIC_ENABLE_WEB_VITALS', 'true');
    mocks.origin.mockReturnValue(false);
    expect((await POST(req({}))).status).toBe(403);
    expect(console.info).not.toHaveBeenCalled();
  });
  it('records only minimal valid anonymous metrics and rejects injected identifiers', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_WEB_VITALS', 'true');
    const metric = { name: 'INP', value: 42, rating: 'good', path: '/' };
    expect((await POST(req(metric))).status).toBe(204);
    expect(console.info).toHaveBeenCalledExactlyOnceWith(
      'public-web-vital',
      JSON.stringify(metric),
    );
    expect((await POST(req({ ...metric, email: 'test@example.com' }))).status).toBe(400);
    expect((await POST(req({ ...metric, path: '/?phone=123' }))).status).toBe(400);
  });
  it('limits request size before logging', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_WEB_VITALS', 'true');
    expect((await POST(req({ data: 'x'.repeat(1500) }))).status).toBe(413);
    expect(console.info).not.toHaveBeenCalled();
  });
});
describe('owner readiness', () => {
  it('does not read settings before owner authorization', async () => {
    mocks.authorize.mockRejectedValue(new Error('FORBIDDEN'));
    expect((await GET()).status).toBe(403);
    expect(mocks.content).not.toHaveBeenCalled();
  });
  it('returns action states without credentials', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'sensitive-fixture');
    const response = await GET();
    expect(mocks.authorize).toHaveBeenCalledWith('owner');
    const text = await response.text();
    expect(text).not.toContain('sensitive-fixture');
    expect(JSON.parse(text).data.checks).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'address', ready: false })]),
    );
  });
});
