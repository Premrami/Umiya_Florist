import type { Metadata } from 'next';
import { postalAddress } from './business-details';

import { publicSiteOrigin } from './public-origin.mjs';
export { publicSiteOrigin } from './public-origin.mjs';
export function publicPageMetadata(title: string, description: string, path = '/'): Metadata {
  const origin = publicSiteOrigin();
  const url = origin ? new URL(path, origin).href : undefined;
  const image = origin
    ? {
        url: origin + '/images/social-card.jpg',
        width: 1200,
        height: 630,
        alt: 'Umiya Florist — Flowers for every occasion',
      }
    : undefined;
  return {
    title,
    description,
    robots: { index: !!origin && process.env.VERCEL_ENV !== 'preview', follow: true },
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Umiya Florist',
      ...(url ? { url } : {}),
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image.url] } : {}),
    },
  };
}
export function businessStructuredData(settings: Record<string, string>) {
  const origin = publicSiteOrigin();
  if (!origin) return undefined;
  const name = settings.name || 'Umiya Florist';
  const address = postalAddress(settings);
  const business = {
    '@type': address ? 'Florist' : 'Organization',
    '@id': origin + '/#business',
    name,
    url: origin,
    logo: origin + '/images/umiya-florist-logo.webp',
    ...(address ? { address } : {}),
    ...(settings.phone?.trim() ? { telephone: settings.phone.trim() } : {}),
    ...(settings.email?.trim() ? { email: settings.email.trim() } : {}),
    ...(settings.instagram?.startsWith('https://') ? { sameAs: [settings.instagram] } : {}),
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      business,
      {
        '@type': 'WebSite',
        '@id': origin + '/#website',
        url: origin,
        name,
        publisher: { '@id': origin + '/#business' },
      },
    ],
  };
}
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
