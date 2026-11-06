import { z } from 'zod';
import { authorize, apiError } from '@/lib/auth';
import { sameOrigin } from '@/lib/origin';
import { occasions, findOccasionService } from '@/lib/occasions';
import { readOccasionPhotos, preserveOccasionCover } from '@/lib/occasion-storage';
import { invalidatePublicContent } from '@/lib/public-cache';
const requestSchema = z.object({ id: z.uuid(), action: z.enum(['remove', 'restore']) });
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new Error('FORBIDDEN');
    const input = requestSchema.parse(await req.json());
    const { db } = await authorize('content');
    const { services, sections } = await readOccasionPhotos(db);
    const photo = services.find((row) => row.id === input.id);
    if (!photo)
      return Response.json(
        { error: 'This decoration photo could not be found. Refresh and try again.' },
        { status: 404 },
      );
    if (input.action === 'restore' && photo.status !== 'archived')
      return Response.json({ error: 'This photo is not in deleted photos.' }, { status: 409 });
    if (input.action === 'remove' && photo.status === 'published') {
      const occasion = occasions.find((name) => findOccasionService([photo], name));
      if (occasion) await preserveOccasionCover(db, occasion, services, sections);
    }
    // Archive the gallery assignment. Shared media files and independent main images remain intact.
    const status = input.action === 'remove' ? 'archived' : 'draft';
    const { data, error } = await db
      .from('services')
      .update({ status })
      .eq('id', input.id)
      .select('id,status')
      .single();
    if (error) throw error;
    if (!data)
      return Response.json(
        { error: 'The photo was not updated. Please refresh and try again.' },
        { status: 404 },
      );
    invalidatePublicContent('services');
    return Response.json({ data });
  } catch (error) {
    return apiError(error);
  }
}
