import { publicContent } from '@/lib/content';
import { Website } from '@/components/website';
export const dynamic = 'force-dynamic';
export default async function Page() {
  return <Website content={await publicContent()} />;
}
