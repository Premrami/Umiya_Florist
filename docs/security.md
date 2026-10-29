# Security model and review boundaries

- No authentication bypass, default password, public registration or browser-local financial store.
- Server handlers validate identity and module/action permissions. Every protected database table has RLS. Security-definer functions check a narrow permission and set their search_path; default PUBLIC function execution is explicitly revoked for exposed financial/public-write functions.
- Anonymous users can read published catalog/service/portfolio/testimonial/social/FAQ rows and restricted public setting/section views. They cannot read clients, inquiries, staff, drafts, invoices, payment ledgers or private storage.
- Ordinary SDK calls use user-bound credentials. Service-role access stays server-only and is limited to integration/public-intake workflows after their relevant checks.
- Browser mutations verify Origin against the configured canonical application URL (development uses Host). Public inquiry bodies are streamed with a size limit, validated with Zod, checked for a honeypot and rate-limited in PostgreSQL. Inquiries and financial requests have idempotency keys.
- Stored content is structured text rendered by React. No arbitrary executable CMS HTML is accepted. Remote image URLs are restricted to HTTPS approved image hosts or bundled local paths.
- Financial data uses integer paise, unique constraints, source references, locks and transactions. Invoice snapshots and billed deliveries are protected. Credit notes and provider refunds do not mutate original invoices.
- Promotional uploads validate declared type, magic bytes, size, safe random filename and alt text. Private event attachments use a separate private bucket; authorized downloads receive a short-lived signed URL. Anonymous uploading is denied.
- Invoice links contain an unguessable bearer token, store only hashes, expire and can be revoked. Anyone holding an unexpired link can view that specific document; instruct customers not to forward it. No permanent public invoice object is created.
- Marketing is optional, unchecked by default, and records consent source/time and opt-out events. Campaign recipient preparation filters active customers with consent. There is no bulk dispatch.
- CSV export neutralizes spreadsheet formula prefixes. Responses include anti-framing, nosniff and referrer headers; admin pages are marked noindex.

## Remaining security work before launch

Exercise RLS through the actual Supabase Data API and Storage service; configure and verify MFA/session policy; run a real invitation/reset flow; add staging load/concurrency tests and upload malware scanning where appropriate; review CSP for deployment-specific image/monitoring domains; validate backup restore and incident contacts. Accountants now use a narrow billing-identity function instead of direct customer-table access. Assignment-scoped field-staff access remains outstanding. Do not activate the reserved staff role for operational use.

This is not an independent penetration test, legal certification or production security sign-off.


## Implementation additions — 29 October 2026

Published-content caching uses a stateless anonymous-key client and published views/tables, never a visitor session or service-role key. Authorized public-module writes invalidate the shared cache. Owner-only readiness returns checks and suggested actions without credential values; authorization occurs before settings reads.

An enforced compatible CSP now restricts sources, objects, frames, base URLs and forms. Next/GSAP still require the documented inline allowances; this is not a nonce/hash strict CSP. Validate actual hosting, images and optional monitoring before tightening it. HSTS is gated on a valid production HTTPS origin; development permits the framework evaluator and local HTTP.

Optional first-party vitals are disabled by default, respect Do Not Track, restrict path/metric fields, enforce same origin and a 1KB request limit. They do not include queries, metric IDs or inquiry data. Logging/hosting retention and abuse monitoring still require deployment review; this is not an analytics consent determination.

Local compiled-public-asset scanning found no configured secret values in the checked output. This is a regression boundary check, not comprehensive penetration testing. Real Supabase transport/RLS, MFA/recovery, backup restoration and provider acceptance remain staging requirements.
