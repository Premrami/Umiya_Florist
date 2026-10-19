import { configured, supabase } from './supabase/server';
import { referenceCatalog, type PublicContent } from './public-content';
export async function publicContent(): Promise<PublicContent> {
  if (!configured())
    return {
      preview: true,
      catalog: referenceCatalog,
      sections: {},
      settings: {},
      portfolio: [],
      testimonials: [],
      services: [],
      social: [],
      faqs: [],
    };
  const db = await supabase();
  const results = await Promise.all([
    db.from('catalog_items').select('*').eq('status', 'published').order('sort_order'),
    db.from('public_site_sections').select('*'),
    db.from('public_site_settings').select('*'),
    db.from('portfolio_projects').select('*').eq('status', 'published'),
    db.from('testimonials').select('*').eq('status', 'published'),
    db.from('services').select('*').eq('status', 'published'),
    db.from('social_posts').select('*').eq('status', 'published'),
    db.from('faqs').select('*').eq('status', 'published'),
  ]);
  if (results.some((r) => r.error)) throw new Error('Published content could not be loaded');
  const [c, s, b, p, t, v, social, faqs] = results;
  return {
    preview: false,
    catalog: c.data ?? [],
    sections: Object.fromEntries((s.data ?? []).map((x) => [x.key, x.published])),
    settings: b.data?.[0]?.public ?? {},
    portfolio: p.data ?? [],
    testimonials: t.data ?? [],
    services: v.data ?? [],
    social: social.data ?? [],
    faqs: faqs.data ?? [],
  };
}
