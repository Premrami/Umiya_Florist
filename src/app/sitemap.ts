import type { MetadataRoute } from 'next';
import { publicSiteOrigin } from '@/lib/seo';
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = publicSiteOrigin();
  return origin
    ? [
        { url: origin + '/', changeFrequency: 'weekly', priority: 1 },
        { url: origin + '/privacy', priority: 0.3 },
      ]
    : [];
}
