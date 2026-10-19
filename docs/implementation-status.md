# Implementation status — 19 October 2026

**Overall: substantial local implementation; not the full production acceptance milestone.** Source and migrations are implemented and checked locally. Live services have not been provisioned. Never present this as a deployed, fully verified production platform.

## Phase checklist

| Phase | Implemented | Verification / remaining work |
|---|---|---|
| 1 Foundation | Next.js App Router, strict TypeScript, Tailwind v4, local fonts/tokens, validation, shared UI, ESLint and formatting | Production build and typecheck pass |
| 2 Public site | Responsive single page, editorial hero, bouquets, daily pooja, event categories, inquiry builder, gallery, approved reviews, social, FAQ, contact, footer | 12 desktop/mobile Playwright checks pass; approved photography and real bloom footage still needed |
| 3 Database/auth | Relational migrations, RLS, role checks, cookie auth, session refresh, owner provisioning, invitation/reset routes | Actual PostgreSQL RLS tests pass; live Supabase/Auth/Storage/MFA acceptance pending |
| 4 CMS | Draft/published sections, protected preview, revisions, catalog/services/portfolio/reviews/social/FAQ forms, public media uploads | Actual PostgreSQL publishing tests pass; live upload/publish verification pending |
| 5 CRM/subscriptions | Clients, addresses/history/follow-ups, consent, fixed/item pricing, effective prices, pauses, delivery occurrence ledger | Database tests pass; full authenticated browser acceptance pending |
| 6 Billing | Monthly drafts, delivered-only sources, adjustments, immutable finalization, itemized quotes, PDFs, expiring/revocable manual shares, receipts | Money/idempotency/snapshot tests pass; PDF visual QA and provider-connected browser scenarios pending |
| 7 Events/inventory | Quote-to-booking, event calendar, tasks, expenses, private attachments, movement ledger, low-stock figures | Booking/stock tests pass; supplier/purchase and material-reservation workflows remain incomplete |
| 8 Payments/communications | Razorpay links, signatures, provider fetches, partial receipts, event deduplication, verified refund ledger, credits, reviewed invoice email, opt-in campaign preparation | Database and signature tests pass; no real provider test transactions or email delivery verified |
| 9 Quality/reports | Stored-data metrics, monthly graph, current-page CSV, audit logs, loading/error/empty states, responsive drawer, accessibility work | Local tests and Lighthouse reported separately; real admin sessions/load tests pending |
| 10 Production preparation | Environment template, migration/restore procedures, deployment and owner guides, dependency lockfile | Vercel project/domain, secrets, monitoring transport, production smoke tests and sign-off pending |

## Verified locally

See `validation-report.md` for final counts, commands, screenshots and performance results. Tests exercise actual migration SQL in embedded PostgreSQL rather than a hand-written imitation of billing functions. Public preview never simulates persistence or payment success.

## External blockers

- Supabase project URL, anon key, server-only service-role key and initial owner identity.
- Razorpay test/live credentials, webhook secret and provider account setup.
- Resend API key, verified sender/domain; actual Auth email templates and delivery.
- Optional Sentry DSN and alert configuration; Vercel account/project/domain.
- Verified address, phone, WhatsApp, email, hours, map/social profiles and business privacy/retention decisions.
- Accountant-approved GST/tax, invoice-prefix and due-date rules.
- Approved business imagery, genuine bloom video if desired, and publication permissions. No reference screenshots were attached.

## Unfinished requested scope (requires implementation, not just credentials)

- Accountant approval of the implemented flat invoice tax model, document layout and applicable GST breakdown. Defaults are zero GST, `UF-` and seven-day terms; these invoice settings are configurable. Quotation-specific tax/numbering customization still needs completion.
- Dedicated supplier and purchase-order workflows, full event material reservation/consumption flows, item-price editing/removal UX, client tags/birthday fields, and advanced CRM reporting/export across all pages.
- Assignment-scoped field-staff permissions and UI; mandatory in-app MFA enrollment and owner role editing. The reserved staff role is denied broad access. Accountant access uses a tested billing-identity function and cannot query private CRM records directly.
- Full schema parity with every auxiliary entity requested in the master brief. Current schema covers implemented workflows; unused roles/permissions join tables, supplier/purchase and campaign-recipient/template entities are not all present.
- Video uploads/resizing, multiple media per catalog/project, drag sorting and comprehensive asset reuse/deletion safeguards. Current public image and private document uploads are functional foundations.
- Dedicated quotation WhatsApp/email sharing and branded HTML email templates/delivery-bounce callbacks. Invoice WhatsApp and reviewed plain-text invoice email are implemented.
- QR rendering and accountant-compliant GST breakdown. The generator now embeds Latin, Gujarati and Devanagari TrueType fonts and has a paginated PDF regression test; sample rendering was inspected on the first and last pages, including Indic mark positioning.
- Full multilingual content administration, editable section ordering, section-specific content fields beyond the current structured headline/description/image model, and a genuinely photorealistic bloom/3D asset.
- Provider reconciliation UI for orphaned link creation, production concurrency/restore/load testing, end-to-end admin browser runs with actual Supabase sessions, and external-service monitoring validation.

These are explicit limitations. Passing the local build and tests does not close the entire master brief. Do not accept real customer data or payments until the launch gates and applicable remaining scope have been completed.
