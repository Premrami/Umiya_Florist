import { revalidatePath, revalidateTag } from 'next/cache';
export const PUBLIC_CONTENT_TAG = 'published-content';
export const PUBLIC_CONTENT_MAX_AGE = 60;
const publicModules = new Set([
  'settings',
  'catalog',
  'cms',
  'services',
  'portfolio',
  'testimonials',
  'social',
  'faqs',
]);
/** Only successful, authorized content mutations call this helper. Private records never enter this cache. */
export function invalidatePublicContent(module: string) {
  if (!publicModules.has(module)) return;
  revalidateTag(PUBLIC_CONTENT_TAG, { expire: 0 });
  revalidatePath('/', 'page');
  revalidatePath('/privacy', 'page');
}
