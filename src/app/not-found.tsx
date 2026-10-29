import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="error-page">
      <span className="eyebrow">UMIYA FLORIST · 404</span>
      <h1>This bloom is a little out of place.</h1>
      <p>The page you are looking for could not be found.</p>
      <Link href="/" className="button">
        Return to Umiya Florist
      </Link>
    </main>
  );
}
