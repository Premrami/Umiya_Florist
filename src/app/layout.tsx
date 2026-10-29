import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './brand-theme.css';
const displayFont = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2',
      style: 'normal',
      weight: '100 900',
    },
    {
      path: '../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-italic.woff2',
      style: 'italic',
      weight: '100 900',
    },
  ],
  variable: '--font-fraunces',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});
const bodyFont = localFont({
  src: '../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2',
  variable: '--font-dm-sans',
  display: 'swap',
  weight: '100 1000',
});
export const metadata: Metadata = {
  title: 'Umiya Florist',
  description: 'Bouquets, daily pooja flowers, and event decorations in Ahmedabad.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
