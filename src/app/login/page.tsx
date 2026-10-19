import { Login } from '@/components/login';
import { configured } from '@/lib/supabase/server';
export const metadata = {
  title: 'Studio access | Umiya Florist',
  robots: { index: false, follow: false },
};
export default function Page() {
  return <Login configured={configured()} />;
}
