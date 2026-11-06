import { z } from 'zod';
import { authorize, apiError } from '@/lib/auth';
import { sameOrigin } from '@/lib/origin';
import { specs } from '@/lib/modules';
import { occasions, findOccasionService, occasionPhotos, occasionCoverKey } from '@/lib/occasions';
import { photos as referencePhotos } from '@/lib/public-content';
import { invalidatePublicContent } from '@/lib/public-cache';
import { readOccasionPhotos, preserveOccasionCover } from '@/lib/occasion-storage';
const batch = z
  .object({
    occasion: z.enum(occasions),
    placement: z.enum(['gallery', 'cover']).default('gallery'),
    description: z.string().trim().max(5000).default(''),
    status: z.enum(['draft', 'published']),
    photos: z.array(z.string().max(2000)).min(1).max(20),
  })
  .refine(
    (input) => input.placement !== 'cover' || input.photos.length === 1,
    'Choose exactly one main section image',
  );
export async function GET() {
  try {
    const { db } = await authorize('content');
    const { services, sections } = await readOccasionPhotos(db);
    const published = services.filter((row) => row.status === 'published');
    return Response.json({
      data: occasions.map((occasion) => {
        const section = sections.find((row) => row.key === occasionCoverKey(occasion));
        const legacy = findOccasionService(published, occasion);
        return {
          occasion,
          cover_url: section?.published?.image_url || legacy?.image_url || referencePhotos.wedding,
          draft_cover_url: section?.draft?.image_url || '',
          gallery_count: occasionPhotos(published, occasion).length,
        };
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new Error('FORBIDDEN');
    const { db } = await authorize('content');
    const input = batch.parse(await req.json());
    // Use the same image allowlist as every other Studio photo field.
    const entries = [...new Set(input.photos)].map((image_url) =>
      specs.services.schema.parse({
        name: input.occasion,
        description: input.description || input.occasion + ' floral decoration',
        image_url,
        status: input.status,
      }),
    );
    const { services, sections } = await readOccasionPhotos(db);
    const key = occasionCoverKey(input.occasion);
    if (input.placement === 'cover') {
      const draft = { image_url: input.photos[0], description: input.description };
      const { error } = await db.from('site_sections').upsert(
        {
          key,
          draft,
          ...(input.status === 'published'
            ? { published: draft, published_at: new Date().toISOString() }
            : {}),
        },
        { onConflict: 'key' },
      );
      if (error) throw error;
      invalidatePublicContent('cms');
      return Response.json({ count: 1, placement: 'cover' });
    }
    await preserveOccasionCover(db, input.occasion, services, sections);
    const name = findOccasionService(services, input.occasion)?.name ?? input.occasion;
    const newEntries = entries
      .map((entry) => ({ ...entry, name }) as Record<string, unknown>)
      .filter(
        (entry) =>
          !services.some(
            (row) =>
              row.status === input.status &&
              row.image_url === entry.image_url &&
              findOccasionService([row], input.occasion),
          ),
      );
    if (!newEntries.length) return Response.json({ count: 0, placement: 'gallery' });
    const { data, error } = await db.from('services').insert(newEntries).select('id');
    if (error) throw error;
    invalidatePublicContent('services');
    return Response.json({ count: data?.length ?? 0, placement: 'gallery' });
  } catch (error) {
    return apiError(error);
  }
}
