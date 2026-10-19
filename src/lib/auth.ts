import 'server-only';
import { supabase } from './supabase/server';
import { can } from './business';
export async function authorize(permission?: string) {
  const db = await supabase();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new Error('UNAUTHORIZED');
  const { data: profile } = await db
    .from('profiles')
    .select('id,role,display_name')
    .eq('id', user.id)
    .eq('active', true)
    .single();
  if (!profile || (permission && !can(profile.role, permission))) throw new Error('FORBIDDEN');
  return { db, user, profile };
}
export function apiError(error: unknown) {
  const m = error instanceof Error ? error.message : '';
  const status =
    m === 'UNAUTHORIZED' ? 401 : m === 'FORBIDDEN' ? 403 : m.includes('configured') ? 503 : 400;
  return Response.json(
    {
      error:
        status === 503
          ? m
          : status === 401
            ? 'Please sign in'
            : status === 403
              ? 'Permission denied'
              : 'Request failed. Check the submitted data and record state.',
    },
    { status },
  );
}
