import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { authorize, apiError } from '@/lib/auth';
import { sameOrigin } from '@/lib/origin';
export async function GET(req: Request) {
  try {
    const { db } = await authorize('operations'),
      u = new URL(req.url);
    if (u.searchParams.has('event')) {
      const event = z.uuid().parse(u.searchParams.get('event'));
      const { data, error } = await db
        .from('event_attachments')
        .select('id,name,mime_type,bytes,created_at')
        .eq('event_id', event);
      if (error) throw error;
      return Response.json({ data });
    }
    const id = z.uuid().parse(u.searchParams.get('id'));
    const { data: file, error } = await db
      .from('event_attachments')
      .select('path')
      .eq('id', id)
      .single();
    if (error || !file) throw new Error('File unavailable');
    const { data, error: e } = await db.storage
      .from('private')
      .createSignedUrl(file.path, 60, { download: true });
    if (e) throw e;
    return Response.redirect(data.signedUrl, 303);
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new Error('FORBIDDEN');
    const { db } = await authorize('operations');
    const f = await req.formData(),
      event = z.uuid().parse(f.get('event_id')),
      file = f.get('file');
    if (!(file instanceof File) || file.size > 10 * 1024 * 1024) throw new Error('Invalid file');
    const { data: record } = await db.from('events').select('id').eq('id', event).single();
    if (!record) throw new Error('Event unavailable');
    const bytes = Buffer.from(await file.arrayBuffer()),
      jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
      png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      webp =
        bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP',
      pdf = bytes.subarray(0, 5).toString() === '%PDF-';
    const mime = jpeg
      ? 'image/jpeg'
      : png
        ? 'image/png'
        : webp
          ? 'image/webp'
          : pdf
            ? 'application/pdf'
            : '';
    if (mime !== file.type || !mime) throw new Error('Unsupported file');
    const path =
      event + '/' + randomUUID() + '.' + (pdf ? 'pdf' : jpeg ? 'jpg' : png ? 'png' : 'webp');
    const { error } = await db.storage
      .from('private')
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error) throw error;
    const { error: e } = await db.from('event_attachments').insert({
      event_id: event,
      name: file.name.slice(0, 200),
      path,
      mime_type: mime,
      bytes: file.size,
    });
    if (e) throw e;
    return Response.json({ message: 'Private file saved.' });
  } catch (e) {
    return apiError(e);
  }
}
