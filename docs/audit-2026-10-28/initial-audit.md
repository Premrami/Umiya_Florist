# Umiya Florist — initial audit, 28 October 2026

Scope: existing Next.js 16.4.2 App Router application, React 19, TypeScript, GSAP, Tailwind/CSS, Supabase and optional payment/messaging providers. Preserve the approved wine/ivory brand and seed-to-logo introduction. No live payment, messages, customer mutations, or deployment.

This inspection precedes implementation. Baseline was captured from the production build on local port 3100; development remains on port 3000.

| Severity | Finding and affected files | Impact | Proposed fix |
|---|---|---|---|
| High | SEO metadata lacks canonical, OG image/URL and Twitter card (`layout.tsx`, public pages); configured app URL is localhost | Invalid production discovery/sharing | Shared metadata helper gated on a verified public HTTPS origin; page-specific metadata and launch checks, never invent a domain |
| High | Privacy page explicitly remains a launch draft (`privacy/page.tsx`) | Owner disclosures and contact/retention policy not ready | Preserve truthful status; report owner review as a launch blocker rather than inventing policy |
| High | Approved logo SVG embeds a large raster and transfers about 1.6 MB (`public/images/umiya-florist-logo-v2.svg`) | Unnecessary transfer on every view | Render the identical approved artwork to an optimized transparent asset, preserve original source |
| Medium | Automated axe confirms two contrast failures: about stamp and contact service-area line (`brand-theme.css`) | WCAG AA legibility failure | Correct foreground tokens without changing palette |
| Medium | No structured data (`page.tsx`) | Business/site identity missing from crawlers | Safe JSON-LD WebSite/Organization, only verified fields; gate Florist address markup until verified information exists |
| Medium | Testimonials lose their heading when populated; gallery dialog starts at H3 (`website.tsx`) | Inconsistent screen-reader hierarchy | Persistent H2 and dialog H2 |
| Medium | Form API errors are generic; duplicate submission relies on disabled-button rerender (`website.tsx`, inquiry route) | Poor correction guidance and rapid resubmission edge | Field-specific errors, linked messages, synchronous submission lock; retain idempotency |
| Medium | Existing end-to-end suite assumes unconfigured backend and old mobile hamburger (`tests/e2e/public.spec.ts`) | Tests may write live inquiries or fail for obsolete expectations | Mock inquiry submissions; verify authentication denial without setup assumptions; support new dock |
| Medium | Existing lint failure in initial alert load (`inquiry-alert-panel.tsx`) | Required quality check fails | Proper cancellable asynchronous loading; preserve alerts behavior |
| Low | Default 404 has framework styling; sitemap omits privacy; auth preview metadata coverage incomplete | Inconsistent failure UX and crawl instructions | Branded 404, explicit public route metadata and private noindex headers |
| Low | Environment/deployment details still need verification | HTTPS, hostname, provider readiness cannot be certified locally | Add production configuration checks and document manual launch requirements |

Baseline: every inspected page has one H1; public content is server-rendered, including without JavaScript. Public cards/forms, Studio role checks, origin checks, database RLS, scoped service credentials, private media, signed invoice links, and webhook verification exist. Security implementation will be reviewed and tested, not represented as a penetration-test certification.

Artifacts: baseline screenshots, axe results and Lighthouse JSON retained in the audit output folder after verification. Full responsive checks will cover 320, 375, 390, 430, 768, 1024, 1280, 1440 and 1920 px, plus mobile breakpoint boundaries.


## Implementation update — 29 October 2026

The original findings above are retained for traceability. Current technical fixes, executed test results and all deduplicated issue statuses are recorded in the [original audit reconciliation](report.md). Totals: 46 items; 23 FIXED, 7 PARTIALLY FIXED, 14 BLOCKED, 2 NOT APPLICABLE. Historical feature/accounting/infrastructure backlog remains explicitly tracked (R35–R45), rather than treated as verified production behavior. Final mobile LCP is 4.22s median (target not yet met); field INP and physical assistive-device acceptance remain unverified. No deployment or real external transactions were performed.
