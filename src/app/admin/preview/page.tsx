import { authorize } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { publicContent } from '@/lib/content';
import { Website } from '@/components/website';
export const dynamic = 'force-dynamic';
export default async function Preview() {
  let auth;
  try {
    auth = await authorize('content');
  } catch {
    redirect('/login');
  }
  const content = await publicContent();
  const { data, error } = await auth.db.from('site_sections').select('key,draft');
  if (error) throw error;
  content.sections = {
    ...content.sections,
    ...Object.fromEntries((data ?? []).map((s) => [s.key, s.draft])),
  };
  content.preview = true;
  content.previewLabel = 'Unpublished CMS preview · visible only to authorized staff';
  return <Website content={content} />;
}
