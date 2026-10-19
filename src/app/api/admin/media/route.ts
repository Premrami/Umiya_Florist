import { sameOrigin } from '@/lib/origin';
import { authorize, apiError } from '@/lib/auth';
import { randomUUID } from 'node:crypto';
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new Error('FORBIDDEN');
    const { db } = await authorize('content');
    const f = await req.formData(),
      file = f.get('file'),
      alt = String(f.get('alt') ?? '').trim();
    if (!(file instanceof File) || !alt || alt.length > 500 || file.size > 10 * 1024 * 1024)
      throw new Error('Invalid file');
    const bytes = Buffer.from(await file.arrayBuffer());
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
      png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      webp =
        bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
    const detected = jpeg ? 'image/jpeg' : png ? 'image/png' : webp ? 'image/webp' : '';
    if (detected !== file.type) throw new Error('Invalid image');
    const path = randomUUID() + '.' + (jpeg ? 'jpg' : png ? 'png' : 'webp');
    const { error } = await db.storage
      .from('promotional')
      .upload(path, bytes, { contentType: detected, upsert: false });
    if (error) throw error;
    const { data: asset, error: e } = await db
      .from('media_assets')
      .insert({
        name: file.name.slice(0, 200),
        path,
        public: true,
        mime_type: detected,
        bytes: file.size,
        alt_text: alt,
      })
      .select()
      .single();
    if (e) throw e;
    return Response.json({
      data: asset,
      url: db.storage.from('promotional').getPublicUrl(path).data.publicUrl,
    });
  } catch (e) {
    return apiError(e);
  }
}
