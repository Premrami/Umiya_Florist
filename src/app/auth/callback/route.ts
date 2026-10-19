import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
export async function GET(req: Request) {
  const u = new URL(req.url),
    code = u.searchParams.get('code'),
    base = process.env.NEXT_PUBLIC_APP_URL ?? u.origin;
  if (code) {
    const db = await supabase();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(base + '/login/recover');
  }
  return NextResponse.redirect(base + '/login?error=recovery_failed');
}
