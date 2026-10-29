import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  businessStructuredData,
  publicPageMetadata,
  publicSiteOrigin,
  serializeJsonLd,
} from '../src/lib/seo';
afterEach(() => vi.unstubAllEnvs());
describe('production SEO', () => {
  it('never emits a canonical for local/private origins', () => {
    for (const value of [
      '',
      'http://127.0.0.1:3000',
      'https://localhost',
      'https://10.0.0.1',
      'https://192.168.1.2',
      'https://172.16.0.1',
      'https://[::1]',
      'https://user:password@example.com',
    ])
      expect(publicSiteOrigin(value)).toBeUndefined();
  });
  it('uses one configured HTTPS origin for canonical and share metadata', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://flowers.example.com/');
    const m = publicPageMetadata('Privacy', 'Privacy details', '/privacy');
    expect(m.alternates?.canonical).toBe('https://flowers.example.com/privacy');
    expect(m.openGraph).toMatchObject({ url: 'https://flowers.example.com/privacy' });
    expect(m.twitter).toMatchObject({ card: 'summary_large_image' });
    expect(m.robots).toMatchObject({ index: true });
  });
  it('keeps local and deployment previews unindexed', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://127.0.0.1:3000');
    expect(publicPageMetadata('Home', 'Details').robots).toMatchObject({ index: false });
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://flowers.example.com');
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(publicPageMetadata('Home', 'Details').robots).toMatchObject({ index: false });
  });
  it('does not fabricate business contact or rich-result facts', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://flowers.example.com');
    const data = businessStructuredData({})!;
    expect(data['@graph'][0]).toMatchObject({ '@type': 'Organization', name: 'Umiya Florist' });
    expect(data['@graph'][0]).not.toHaveProperty('aggregateRating');
    expect(data['@graph'][0]).not.toHaveProperty('address');
    expect(
      businessStructuredData({ address: 'Owner verified address' })!['@graph'][0],
    ).toMatchObject({ '@type': 'Florist', address: 'Owner verified address' });
  });
  it('escapes script-closing content while retaining valid JSON', () => {
    const original = { name: '</script><script>test</script>' };
    const out = serializeJsonLd(original);
    expect(out).not.toContain('<');
    expect(JSON.parse(out)).toEqual(original);
  });
});
