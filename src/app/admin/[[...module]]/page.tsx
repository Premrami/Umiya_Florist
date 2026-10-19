import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { authorize } from '@/lib/auth';
import { configured } from '@/lib/supabase/server';
import { modules, can } from '@/lib/business';
import { specs } from '@/lib/modules';
import { Admin } from '@/components/admin';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Umiya Studio', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ module?: string[] }> }) {
  if (!configured()) redirect('/login');
  const path = (await params).module ?? ['dashboard'];
  if (path.length > 1 || !modules.includes(path[0] as (typeof modules)[number])) notFound();
  let auth;
  try {
    auth = await authorize();
  } catch {
    redirect('/login');
  }
  const activeModule = path[0];
  if (specs[activeModule] && !can(auth.profile.role, specs[activeModule].permission))
    return (
      <main className="error-page">
        <h1>Access restricted.</h1>
        <p>Your account does not have permission for this section.</p>
        <Link href="/admin/dashboard">Return to dashboard</Link>
      </main>
    );
  return <Admin module={activeModule} profile={auth.profile} />;
}
