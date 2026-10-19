import { z } from 'zod';
import { authorize, apiError } from '@/lib/auth';
import { service } from '@/lib/supabase/server';
import { sameOrigin } from '@/lib/origin';
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new Error('FORBIDDEN');
    await authorize('owner');
    const p = z
      .object({
        email: z.email(),
        name: z.string().min(2).max(100),
        role: z.enum(['admin', 'manager', 'accountant', 'editor']),
      })
      .parse(await req.json());
    const db = service();
    const { data, error } = await db.auth.admin.inviteUserByEmail(p.email, {
      redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/auth/callback',
    });
    if (error || !data.user) throw new Error('Invitation could not be created');
    const { error: e } = await db
      .from('profiles')
      .insert({ id: data.user.id, display_name: p.name, role: p.role });
    if (e)
      throw new Error(
        'Invitation created but profile provisioning failed. Complete the profile in Supabase before login.',
      );
    return Response.json({
      message:
        'The authentication provider accepted the invitation request. Email delivery is not confirmed.',
    });
  } catch (e) {
    return apiError(e);
  }
}
