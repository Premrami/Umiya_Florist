import type { NextConfig } from 'next';
import { publicSiteOrigin } from './src/lib/seo';
const config: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    '/api/admin/pdf': ['./public/fonts/**'],
    '/api/invoice/*': ['./public/fonts/**'],
  },
  images: {
    qualities: [75, 100],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async redirects() {
    const origin = publicSiteOrigin();
    if (!origin || process.env.ENFORCE_CANONICAL_HOST !== 'true') return [];
    const host = new URL(origin).hostname;
    const alternate = host.startsWith('www.') ? host.slice(4) : 'www.' + host;
    return [
      {
        source: '/:path*',
        has: [{ type: 'host' as const, value: alternate }],
        destination: origin + '/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "script-src 'self' 'unsafe-inline'" +
                (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''),
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://images.unsplash.com https://*.supabase.co",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-src 'none'",
            ].join('; '),
          },
          ...(publicSiteOrigin() && process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
            : []),

          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      ...['/admin/:path*', '/login/:path*', '/auth/:path*', '/api/:path*'].map((source) => ({
        source,
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      })),
    ];
  },
};
export default config;
