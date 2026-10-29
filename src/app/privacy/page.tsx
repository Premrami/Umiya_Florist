import Link from 'next/link';
import { publicPageMetadata } from '@/lib/seo';
import { publicContent } from '@/lib/content';
import { privacyNoticeReady } from '@/lib/business-details';
export const revalidate = 60;
export const metadata = publicPageMetadata(
  'Privacy | Umiya Florist',
  'How Umiya Florist uses inquiry details, promotional consent and business records, and how to request access, correction or deletion.',
  '/privacy',
);
export default async function Page() {
  const { settings } = await publicContent();
  const ready = privacyNoticeReady(settings);
  return (
    <main className="error-page">
      <Link href="/">← Umiya Florist</Link>
      <h1 style={{ marginTop: 40 }}>Your privacy matters.</h1>
      <p>
        We use the information you provide to respond to inquiries, arrange services, and maintain
        necessary business and billing records. Promotional messages require your optional consent.
        You can ask the studio to withdraw that consent or request access, correction, or deletion
        of your information, subject to required record retention.
      </p>
      <p>
        Our service providers may include Supabase for secure data and authentication and Razorpay
        for payments. Staff access is restricted according to their role. Invoice links expire and
        can be revoked.
      </p>
      <p>
        When phone inquiry alerts are enabled, Twilio processes the inquiry details to deliver the
        admin’s SMS or WhatsApp notification. Email delivery may use Resend when configured. We do
        not include inquiry contents in optional website performance measurements.
      </p>
      {settings.privacy_retention && (
        <section>
          <h2>How long we keep information</h2>
          <p>{settings.privacy_retention}</p>
        </section>
      )}
      {settings.privacy_contact_email && (
        <section>
          <h2>Contact the studio about privacy</h2>
          <p>
            <a href={'mailto:' + settings.privacy_contact_email}>
              {settings.privacy_contact_email}
            </a>
          </p>
        </section>
      )}
      {ready ? (
        <p>
          Reviewed by the studio on{' '}
          <time dateTime={settings.privacy_reviewed_on}>{settings.privacy_reviewed_on}</time>.
        </p>
      ) : (
        <p>
          This notice is a launch draft. The owner must add verified contact details, retention
          wording, and a reviewed date in Studio Settings before treating it as a finished policy.
        </p>
      )}
    </main>
  );
}
