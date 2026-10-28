# Umiya Florist

A Next.js application combining an editorial floral showcase with a protected studio workspace. Business records persist in Supabase PostgreSQL; no browser-local data store or authentication bypass is used.

**Launch status: not deployed or production approved.** Read [implementation status](docs/implementation-status.md) and [validation report](docs/validation-report.md). Missing configuration is shown explicitly rather than simulated.

## Start locally

Requires Node.js 20.9+ and npm. Tested with Node.js 24.13.1.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:3000`. Without Supabase credentials the public page is a labeled design preview, forms return an unavailable message, and owner login is disabled. There are no default passwords.

For working persistence, configure Supabase and apply every migration in numerical order using the [deployment guide](docs/deployment.md). Invite the initial owner through Supabase Auth and provision its profile. Seed only isolated development projects.

```sh
npm run typecheck
npm test
npm run build
npm run start
```

`npm run test:e2e` expects the local server on port 3000. Browser configuration supports `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; otherwise install Chromium with `npx playwright install chromium` outside macOS or use the documented Chrome path. `npm run db:types` regenerates schema types from migrations using embedded PostgreSQL.

## What is implemented

- Responsive floral website, local reference photography and fonts, category filtering, collection dialogs, event categories, daily flower inquiries, custom bouquet summary, gallery, approved testimonials, social gallery and FAQs.
- Validated, idempotent inquiry intake with shared database rate limiting and an unchecked optional marketing consent.
- Supabase cookie authentication, session refresh, invitation/reset routes, explicit role permissions and RLS.
- CRM, customer addresses/history/follow-ups, subscriptions, pauses, future prices, item pricing and daily delivery occurrence snapshots.
- Monthly draft billing from delivered records, adjustments, immutable finalized invoices, itemized quotations, accepted quotation to booking, PDF generation with Latin/Gujarati/Devanagari fonts, configurable invoice prefix/terms/flat tax and expiring/revocable invoice links.
- Reviewed manual WhatsApp opening and truthful share states; manually initiated transactional email through Resend.
- Event calendar, expenses, tasks and private event attachments; stock movement ledger and low-stock reporting.
- CMS drafts, protected website preview, publishing, revision history, approved portfolio/reviews, media uploads and server-rendered published content.
- Razorpay payment link creation, raw-body webhook signatures, provider API verification, duplicate event/payment protection, partial receipts, processed refunds and credit notes.
- Database-derived financial reports and CSV export of the visible page. Configuration flags distinguish credentials present from services verified.

## Documentation

[Architecture](docs/architecture.md) · [Database](docs/database.md) · [Admin guide](docs/admin-guide.md) · [Deployment](docs/deployment.md) · [Integrations](docs/integrations.md) · [Security](docs/security.md) · [Testing](docs/testing.md) · [Asset sources](docs/assets.md)

This is a substantial locally verified implementation. Some requested advanced workflows and all external-service acceptance checks remain pending; the status file lists them explicitly. Do not import actual customer data until the security and privacy setup is completed.

Admin inquiry phone alerts: see [WhatsApp/SMS setup](docs/inquiry-alerts.md). Delivery requires configured Twilio senders, template and admin number; channels are off by default.
