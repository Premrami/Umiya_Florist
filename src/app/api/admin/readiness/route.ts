import { authorize, apiError } from '@/lib/auth';
import { publicContent } from '@/lib/content';
import { launchChecks } from '@/lib/readiness';
export async function GET() {
  try {
    await authorize('owner');
    const { settings } = await publicContent({ fresh: true });
    return Response.json({ data: { checks: launchChecks(settings, process.env) } });
  } catch (error) {
    return apiError(error);
  }
}
