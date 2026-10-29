import type { MetadataRoute } from 'next';
import { publicSiteOrigin } from '@/lib/seo';
export default function robots(): MetadataRoute.Robots {
  const origin = publicSiteOrigin();
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/login', '/auth/', '/api/'] },
    ...(origin ? { sitemap: origin + '/sitemap.xml' } : {}),
  };
}
