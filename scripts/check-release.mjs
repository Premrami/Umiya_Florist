import nextEnv from '@next/env';
import { publicSiteOrigin } from '../src/lib/public-origin.mjs';
nextEnv.loadEnvConfig(process.cwd());
const env = process.env;
const checks = [
  {
    id: 'public-https-origin',
    ready: !!publicSiteOrigin(env.NEXT_PUBLIC_APP_URL),
    action: 'Set NEXT_PUBLIC_APP_URL to the final public HTTPS origin.',
  },
  ...[
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'INQUIRY_RATE_LIMIT_SALT',
  ].map((key) => ({
    id: key,
    ready: !!env[key]?.trim(),
    action: `Configure ${key} in the deployment environment.`,
  })),
  {
    id: 'production-environment',
    ready: env.VERCEL_ENV !== 'preview',
    action: 'Use the production environment for the launch build; previews remain noindex.',
  },
];
console.log(
  JSON.stringify(
    {
      purpose:
        'Configuration check only. Does not deploy, authenticate, send messages, or replace owner/staging acceptance.',
      checks,
    },
    null,
    2,
  ),
);
process.exitCode = checks.every((check) => check.ready) ? 0 : 1;
