import type { authorize } from './auth';
import { occasions, occasionCoverKey, findOccasionService } from './occasions';
import { photos as referencePhotos } from './public-content';
import { invalidatePublicContent } from './public-cache';
export async function readOccasionPhotos(db: Awaited<ReturnType<typeof authorize>>['db']) {
  const [services, sections] = await Promise.all([
    db
      .from('services')
      .select('id,name,image_url,status,description')
      .order('created_at')
      .order('id'),
    db
      .from('site_sections')
      .select('key,draft,published')
      .in('key', occasions.map(occasionCoverKey)),
  ]);
  if (services.error) throw services.error;
  if (sections.error) throw sections.error;
  return { services: services.data ?? [], sections: sections.data ?? [] };
}

export async function preserveOccasionCover(
  db: Awaited<ReturnType<typeof authorize>>['db'],
  occasion: string,
  services: Record<string, any>[],
  sections: Record<string, any>[],
) {
  const key = occasionCoverKey(occasion);
  const section = sections.find((row) => row.key === key);
  const legacy = findOccasionService(
    services.filter((row) => row.status === 'published'),
    occasion,
  );
  if (!section?.published?.image_url) {
    const published = { image_url: legacy?.image_url || referencePhotos.wedding };
    const coverSnapshot = {
      key,
      draft: section?.draft ?? published,
      published,
      published_at: new Date().toISOString(),
    };
    // Do not overwrite a main image another editor published after our read.
    const { error } = section
      ? await db
          .from('site_sections')
          .update({ published, published_at: coverSnapshot.published_at })
          .eq('key', key)
          .is('published', null)
      : await db
          .from('site_sections')
          .upsert(coverSnapshot, { onConflict: 'key', ignoreDuplicates: true });
    if (error) throw error;
    invalidatePublicContent('cms');
  }
}
