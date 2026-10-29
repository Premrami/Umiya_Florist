# Architecture

One Next.js 16 App Router project with React 19, strict TypeScript, Tailwind v4, GSAP and Lucide. The approved Fraunces and DM Sans fonts are self-hosted with next/font/local; public published content uses anonymous, tagged fetch caching with immediate invalidation after successful CMS changes. A static floral composition is the honest fallback for missing bloom footage; no WebGL scene or photorealistic growth is claimed.

`src/components/website.tsx` provides the single-page public experience. `src/lib/content.ts` reads only published records and restricted public views. Dynamic rendering reflects published CMS updates without redeployment. Draft preview requires the content permission.

`src/components/admin.tsx` supplies the operational workspace, shared record forms, dialogs, reports, calendar and ledgers. `src/lib/modules.ts` declares whitelisted module fields and validation; there is no arbitrary table endpoint. Domain actions call narrowly scoped PostgreSQL functions.

Ordinary admin queries use a cookie-bound Supabase client and RLS. The service client is limited to public inquiry intake, verified payment posting, provider-backed sharing, invitations and selected integration writes after authorization. Secrets remain on the server.

Financial amounts are integer paise. Delivery records capture occurrence prices; monthly invoices reference delivered occurrences with unique source constraints. PostgreSQL transactions and row/advisory locks protect financial workflows. Finalization snapshots issuer, recipient and items. Credits and refunds remain separate ledgers.

Customers are business records, separate from staff Auth users. Profiles assign one explicit role: owner, admin, manager, accountant or editor. The reserved staff role is denied broad access until assignment-scoped views are implemented. No public customer account is required.

External services: Supabase Auth/PostgreSQL/Storage, Razorpay HTTP API, Resend HTTP API, optional Sentry. Vercel is the deployment target. No external project has been provisioned by this build.
