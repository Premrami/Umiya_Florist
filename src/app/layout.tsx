import type { Metadata } from 'next';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource-variable/manrope';
import './globals.css';
export const metadata: Metadata = {
  title: 'Umiya Florist | Flowers for beautiful moments',
  description: 'Thoughtful bouquets, daily pooja flowers, and event decorations in Ahmedabad.',
  openGraph: {
    title: 'Umiya Florist',
    description: 'Where flowers become memories.',
    type: 'website',
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
