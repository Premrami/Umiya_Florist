import { publicSiteOrigin } from './seo';
import { postalAddress, privacyNoticeReady } from './business-details';
export type ReadinessCheck = { id: string; label: string; ready: boolean; nextAction: string };
export function launchChecks(
  settings: Record<string, string>,
  environment: Record<string, string | undefined>,
): ReadinessCheck[] {
  return [
    {
      id: 'domain',
      label: 'Public HTTPS website address',
      ready: !!publicSiteOrigin(environment.NEXT_PUBLIC_APP_URL),
      nextAction: 'Set NEXT_PUBLIC_APP_URL to your final HTTPS domain and rebuild.',
    },
    {
      id: 'contact',
      label: 'Public contact details',
      ready: !!settings.phone?.trim() && !!settings.email?.trim(),
      nextAction: 'Add the verified business phone and email in Settings.',
    },
    {
      id: 'address',
      label: 'Structured shop address',
      ready: !!postalAddress(settings),
      nextAction:
        'Complete street, city, state, postal code and two-letter country code in Settings.',
    },
    {
      id: 'privacy',
      label: 'Reviewed privacy notice',
      ready: privacyNoticeReady(settings),
      nextAction:
        'Add privacy contact email, approved retention wording and reviewed date in Settings.',
    },
    {
      id: 'preview',
      label: 'Production indexing environment',
      ready: environment.VERCEL_ENV !== 'preview',
      nextAction:
        'Deploy as production after verifying public metadata; preview builds stay unindexed.',
    },
    {
      id: 'inquiry',
      label: 'Inquiry storage configuration',
      ready: !!environment.SUPABASE_SERVICE_ROLE_KEY && !!environment.INQUIRY_RATE_LIMIT_SALT,
      nextAction: 'Configure the server-only database key and inquiry rate-limit salt.',
    },
  ];
}
