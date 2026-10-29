import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  configured: vi.fn(),
  tag: vi.fn(),
  path: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.create }));
vi.mock('../src/lib/supabase/server', () => ({ configured: mocks.configured }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.path, revalidateTag: mocks.tag }));
import { publicContent } from '../src/lib/content';
import { invalidatePublicContent } from '../src/lib/public-cache';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.configured.mockReturnValue(true);
  mocks.create.mockReturnValue({
    from: (table: string) => {
      const query: any = {
        select: () => query,
        eq: () => query,
        order: () => query,
        then: (resolve: any) =>
          Promise.resolve({
            data: table === 'public_site_settings' ? [{ public: { name: 'Fixture' } }] : [],
            error: null,
          }).then(resolve),
      };
      return query;
    },
  });
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fixture.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-fixture');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'private-fixture');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe('anonymous public caching', () => {
  it('uses only the anonymous key and tagged public fetch cache', async () => {
    const content = await publicContent();
    expect(content.settings.name).toBe('Fixture');
    expect(mocks.create.mock.calls[0].slice(0, 2)).toEqual([
      'https://fixture.supabase.co',
      'public-fixture',
    ]);
    const options = mocks.create.mock.calls[0][2];
    expect(options.auth.persistSession).toBe(false);
    await options.global.fetch('https://fixture.supabase.co/rest/v1/public_site_settings', {});
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        cache: 'force-cache',
        next: { revalidate: 60, tags: ['published-content'] },
      }),
    );
  });
  it('keeps authorized draft-preview reads fresh', async () => {
    await publicContent({ fresh: true });
    const options = mocks.create.mock.calls[0][2];
    await options.global.fetch('https://fixture.supabase.co/rest/v1/public_site_settings', {});
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect((vi.mocked(fetch).mock.calls[0][1] as any).next).toBeUndefined();
  });
  it('expires public data on content changes but never on private-record changes', () => {
    invalidatePublicContent('inquiries');
    invalidatePublicContent('clients');
    expect(mocks.tag).not.toHaveBeenCalled();
    invalidatePublicContent('cms');
    expect(mocks.tag).toHaveBeenCalledExactlyOnceWith('published-content', { expire: 0 });
    expect(mocks.path).toHaveBeenCalledWith('/', 'page');
    expect(mocks.path).toHaveBeenCalledWith('/privacy', 'page');
  });
});
