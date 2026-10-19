import { sameOrigin } from '@/lib/origin';
import { supabase } from '@/lib/supabase/server';
import { z } from 'zod';
export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: 'Invalid origin' }, { status: 403 });
  try {
    const input = await req.json();
    const db = await supabase();
    if (input.action === 'logout') {
      await db.auth.signOut();
      return Response.json({ ok: true });
    }
    if (input.action === 'reset') {
      const email = z.email().parse(input.email);
      const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/auth/callback',
      });
      if (error) throw error;
      return Response.json({
        message: 'If this account exists, a recovery email has been requested.',
      });
    }
    if (input.action === 'update') {
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user)
        return Response.json(
          { error: 'Open a valid recovery or invitation link first.' },
          { status: 401 },
        );
      const password = z.string().min(12).max(200).parse(input.password);
      const { error } = await db.auth.updateUser({ password });
      if (error) throw error;
      return Response.json({ ok: true });
    }
    const clean = z.object({ email: z.email(), password: z.string().min(8).max(200) }).parse(input);
    const { error } = await db.auth.signInWithPassword(clean);
    if (error)
      return Response.json({ error: 'Sign-in failed. Check your credentials.' }, { status: 401 });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: 'Authentication is unavailable. Configure Supabase before signing in.' },
      { status: 503 },
    );
  }
}
