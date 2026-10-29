import { limitedText } from '@/lib/limited-body';
import { sameOrigin } from '@/lib/origin';
import { vitalsSchema } from '@/lib/vitals';
export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS !== 'true')
    return new Response(null, { status: 404 });
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  try {
    const result = vitalsSchema.safeParse(JSON.parse(await limitedText(request, 1024)));
    if (!result.success) return new Response(null, { status: 400 });
    // Intentionally exclude cookies, IP, user agent, queries, metric IDs and inquiry values.
    console.info('public-web-vital', JSON.stringify(result.data));
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(null, {
      status: error instanceof Error && error.message === 'BODY_TOO_LARGE' ? 413 : 400,
    });
  }
}
