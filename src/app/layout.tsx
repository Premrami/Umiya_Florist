import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { WebVitals } from '@/components/web-vitals';
import './globals.css';
import './brand-theme.css';
import './luxury-theme.css';
import './studio-theme.css';
const displayFont = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2',
      style: 'normal',
      weight: '100 1000',
    },
    {
      path: '../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-italic.woff2',
      style: 'italic',
      weight: '100 1000',
    },
  ],
  variable: '--font-dm-sans',
  display: 'swap',
  adjustFontFallback: 'Arial',
});
const bodyFont = localFont({
  src: '../../node_modules/@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2',
  variable: '--font-montserrat',
  display: 'swap',
  weight: '100 900',
});
export const metadata: Metadata = {
  title: 'Umiya Florist',
  description: 'Bouquets, daily pooja flowers, and event decorations in Ahmedabad.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        {children}
        {process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS === 'true' && <WebVitals />}
      </body>
    </html>
  );
}
