import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
export async function GET(req: Request) {
  const u = new URL(req.url),
    hash = u.searchParams.get('token_hash'),
    type = u.searchParams.get('type'),
    base = process.env.NEXT_PUBLIC_APP_URL ?? u.origin;
  if (hash && (type === 'invite' || type === 'recovery')) {
    const db = await supabase();
    const { error } = await db.auth.verifyOtp({ token_hash: hash, type });
    if (!error) return NextResponse.redirect(base + '/login/recover');
  }
  return NextResponse.redirect(base + '/login?error=invalid_link');
}
