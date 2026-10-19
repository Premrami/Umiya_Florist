import { authorize, apiError } from '@/lib/auth';
import { validateEnvironment } from '@/lib/env';
export async function GET() {
  try {
    await authorize('owner');
    return Response.json({ data: validateEnvironment(process.env) });
  } catch (e) {
    return apiError(e);
  }
}
