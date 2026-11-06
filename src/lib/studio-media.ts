export type StudioMediaAsset = {
  id: string;
  name: string;
  path: string;
  public: boolean;
  mime_type: string;
  alt_text: string;
};
export const studioImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
export function approvedImageUrl(value: string): boolean {
  if (/^\/images\/[a-zA-Z0-9_.-]+$/.test(value)) return true;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'images.unsplash.com' || url.hostname.endsWith('.supabase.co'))
    );
  } catch {
    return false;
  }
}
export function publicMediaAssetUrl(
  asset: StudioMediaAsset,
  projectUrl: string | undefined,
): string | undefined {
  if (
    asset.public !== true ||
    !studioImageTypes.includes(asset.mime_type) ||
    !/^[a-zA-Z0-9_/-]+\.(jpe?g|png|webp)$/i.test(asset.path) ||
    asset.path.split('/').some((part) => !part || part === '..')
  )
    return;
  try {
    const url = new URL(projectUrl ?? '');
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) return;
    return `${url.origin}/storage/v1/object/public/promotional/${asset.path.split('/').map(encodeURIComponent).join('/')}`;
  } catch {
    return;
  }
}
