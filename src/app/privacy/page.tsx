import Link from 'next/link';
export const metadata = { title: 'Privacy | Umiya Florist' };
export default function Page() {
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
        This notice is a launch draft. The owner must add verified contact details, retention
        periods, and applicable privacy disclosures before accepting live customer data.
      </p>
    </main>
  );
}
