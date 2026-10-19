import { authorize, apiError } from '@/lib/auth';
export async function GET() {
  try {
    const { db } = await authorize();
    const { data, error } = await db.rpc('studio_overview');
    if (error) throw error;
    return Response.json({ data });
  } catch (e) {
    return apiError(e);
  }
}
