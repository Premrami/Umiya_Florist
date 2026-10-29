# Umiya Florist — audit and implementation report

28 October 2026 · Local project review · No production deployment

## A. Audit summary and readiness

The existing Next.js 16.4.2 App Router, React 19, TypeScript, GSAP, Supabase, and CSS/Tailwind architecture was retained. The wine/ivory palette, Fraunces/DM Sans typography, logo, mobile dock, section transitions, flower hover effects, seed-to-logo intro, Studio workflows, and financial logic remain.

**Status: improved and verified locally; not yet cleared for public production launch.** Safe code fixes are complete. Domain/business/privacy configuration and real deployment acceptance remain owner-controlled. Mobile synthetic LCP is improved but still above the requested target.

The severity-ranked inspection was saved before implementation in [initial-audit.md](initial-audit.md). Additional populated-content and dependency findings were investigated during verification.

| Severity | Finding | Outcome |
|---|---|---|
| Critical (development dependencies) | Test runner/worker advisories surfaced in the full npm scan | Upgraded Vitest to the patched 4.x release; vulnerable worker dependency removed. Full final npm audit is clean. |
| High | No verified public HTTPS canonical origin | Added domain-gated canonical/share/schema support. The configured URL remains local; production domain is still required. |
| High | Privacy notice explicitly remains a launch draft; verified public contact details incomplete | Kept truthful content. Owner review and real business information remain launch blockers. |
| High/performance | Approved SVG shipped about 1.71 MB of embedded image data | Same artwork now uses a 105,072-byte transparent WebP: about 94% smaller. Original files retained. |
| Medium | Contrast failures in stamp, contact area, populated cards/captions, Studio metadata, labels and badges | Corrected colors using existing palette tokens; inspected public and Studio fixtures have zero automated violations. |
| Medium | Conditional heading and landmark issues | Persistent testimonials H2, gallery dialog H2, semantic Studio footer, named Studio navigation. |
| Medium | Form correction/duplicate-submit edge cases | Added field-specific API feedback, linked invalid-field messages, synchronous submission guard, retained idempotency and optional unchecked marketing consent. |
| Medium | Stale tests assumed missing backend and could submit actual inquiries | Replaced with deterministic mocked submissions and current dock/authentication tests. |
| Medium | Lint failure and uncancelled initial alerts request | Cancellable initial alert fetch; lint now passes. |
| Medium | Business external URL fields accepted non-HTTPS schemes | Restricted to HTTPS; blank optional settings remain valid; regression test added. |
| Low | Incomplete share metadata, sitemap, branded 404, private crawl/cache headers | Implemented and tested. |
| Low | Test tooling peer compatibility | Retained the supported existing ESLint 10 after checking plugin compatibility; lint/types pass. Some upstream plugin peer declarations still stop at ESLint 9. |

No customer records, SMS/WhatsApp messages, invitations, real payments, schema migrations, or deployments were performed during this audit.

## B. SEO and content

- Public routes are `/` and `/privacy`. Each inspected route has one H1 and a main landmark. The marketing H1 and approved visual copy remain. Private login/recovery routes also retain sensible headings.
- Homepage and privacy now have distinct titles/descriptions and production-aware canonical, Open Graph and Twitter large-image metadata. The share image uses the approved logo, with no invented claims.
- Canonicals strip query/fragment variants to the public page path. A canonical is never fabricated from localhost/private-network settings. The `/privacy` page does not inherit the homepage canonical.
- Homepage sections and links are server-rendered. Browser testing with JavaScript disabled confirmed the primary heading remains visible. Interactive online inquiry submission requires JavaScript; it was tested with mocked APIs.
- Every hash navigation target checked exists; no duplicate IDs or placeholder `href="#"` were found. Public links and the 404/return flow were exercised. External contact destinations were inspected as URLs; no messages were sent.
- `robots.txt` excludes admin, login, auth and API paths. Sitemap includes homepage/privacy only when a public HTTPS origin is configured. Private routes also send `X-Robots-Tag: noindex, nofollow` and private/no-store cache headers.
- Local and deployment-preview metadata deliberately uses `noindex`. **The final local Lighthouse SEO score of 63 is not a live-site SEO score**: localhost has no public canonical, public sitemap origin, or share URLs and is intentionally unindexable. Configure the real HTTPS origin, rebuild for production, and inspect the generated public tags before launch.
- No HTTP-to-HTTPS or www/apex redirect was invented. Those must be verified on the chosen hosting/domain configuration.

### Structured data

Added safely escaped JSON-LD for WebSite and business identity. It uses configured/visible fields only, with Organization as the fallback; Florist is selected only when an owner-provided address exists. Reviews, ratings, opening hours, geocoordinates, offers and prices are never fabricated. Script-closing strings are regression-tested for safe escaping.

Current local configuration deliberately emits no public-URL schema. After a real domain is configured, validate the rendered output in Google's Rich Results Test. WebSite/Organization identity markup is informational and does not itself promise a special result. **LocalBusiness rich-result eligibility is not established**: Google's required address is a structured PostalAddress; this project currently stores a free-form address, and verified structured address data is still needed. See [Google's LocalBusiness requirements](https://developers.google.com/search/docs/appearance/structured-data/local-business).

No Product rich-result markup was added to this inquiry-led catalog with unverified offer details. FAQ content remains semantic `<details>` elements. FAQ rich results were retired by Google in 2026; no ranking/result promise is made. See [Google Search documentation updates](https://developers.google.com/search/updates).

## C. UI/UX, responsiveness and accessibility

Preserved the approved layout and animations. Contrast corrections make secondary information readable without changing the brand palette. The exact existing font files now load through `next/font/local`, including italic display type, with preloads and fallback metrics.

Verified widths: **320, 375, 390, 430, 768, 1024, 1280, 1440, 1920px**, plus the 459/460px dock breakpoint. All checked public sections and inquiry dialogs fit without horizontal overflow or clipping. Mobile navigation remains Home → About → Flowers → Pooja Flowers → More, with Contact in the top bar and remaining sections in More.

Modals now lock background scrolling and restore focus. Escape, More menu focus return, anchor navigation, reduced-motion behavior, and no-JavaScript content were exercised. Automated axe checks cover WCAG 2/2.1/2.2 A/AA tags and relevant best practices. Results: zero violations in checked public pages/dialogs and populated catalog/portfolio/social/FAQ fixtures; zero in checked Studio client/inventory/settings fixtures and dialogs. Fixtures contain test data only and are not a claim of authenticated live-record testing.

All editable Studio forms were also inspected during the preceding input audit at 320/390px, with representative tablet/desktop checks. Numeric and phone rules, integer paise, signed adjustments/stock, date/budget/guest limits, optional blank settings, error retention and mocked success/reset behavior have regression coverage.

Automated scans and Chromium inspection do **not** establish full WCAG certification. Safari/iOS, Firefox, real-device assistive technology, screen-reader reading order and text-zoom acceptance remain manual deployment checks.

## D. Measured performance

Local production build, headless Chrome, Lighthouse mobile throttling and desktop preset. These are lab snapshots, not field percentiles or a guarantee for the deployed site. Runs varied; intermediate measurements are retained rather than hiding them.

| Metric | Before mobile | Final mobile | Measured desktop |
|---|---:|---:|---:|
| Performance score | 74 | 85 | 100 |
| Accessibility score | 100* | 100 | 100 |
| Best Practices score | 100 | 100 | 100 |
| FCP | 1.82s | 0.91s | 0.25s |
| LCP | 9.91s | 4.38s | 0.71s |
| Total Blocking Time | 32ms | 17.5ms | 0ms |
| CLS | 0.0081 | 0 | 0 |

*The initial Lighthouse snapshot did not expose below-fold contrast failures that the dedicated axe audit found. Lighthouse's score was not treated as proof of accessibility.

Implemented: logo reduction (~94%), precomputed transparency to avoid the large filtered SVG transfer, exact self-hosted font preloading/fallback metrics, responsive image sizing, eager/high-priority hero loading, and retained lazy loading for below-fold photography. No visual effects were removed to chase a score. The logo comparison showed a maximum difference of 2/255 in color channels at antialiased transparent edges (mean difference ~0.004/255); approved artwork/layout are unchanged.

**The mobile LCP ≤2.5s target remains unmet.** An earlier final-asset run reached 3.28s/93 performance; the last priority-adjusted run was 4.38s/85. The intro-skipped mobile diagnostic was 4.22s, so the remaining synthetic delay must not be blamed on the animation alone. Priorities for deployed measurement are CDN/TTFB, image selection and initial client JS, followed by measured code splitting if warranted. The intro itself still takes roughly 10 seconds after it starts, is skippable and respects reduced motion; its timing was intentionally preserved.

INP is not reported as measured. No field traffic was available, and TBT is not a substitute for INP. Real-user Core Web Vitals require deployment/device/network data; see [Google's Web Vitals guidance](https://web.dev/articles/vitals).

## E. Important files changed

| Files | Change |
|---|---|
| `src/lib/seo.ts`, `tests/seo.test.ts` | Public-origin validation, page metadata, honest business JSON-LD and script escaping tests |
| `src/app/page.tsx`, `privacy/page.tsx`, `robots.ts`, `sitemap.ts`, `not-found.tsx`, `admin/preview/page.tsx` | Public SEO, schema, crawl rules, branded 404 and private preview metadata |
| `src/app/layout.tsx` | Preload the existing local font files through Next.js |
| `src/components/website.tsx` | Logo/hero loading, semantic headings, modal focus/scroll, active navigation and accessible form errors/duplicate guard |
| `src/components/home-entrance.tsx` | Optimized approved logo reference; animation choreography preserved |
| `src/components/admin.tsx` | Named navigation, semantic footer and Studio consistency |
| `src/components/inquiry-alert-panel.tsx` | Cancellable initial request |
| `src/app/api/public/inquiries/route.ts` | Helpful validation error with field identification |
| `src/lib/modules.ts`, `tests/input-validation.test.tsx` | Safe external HTTPS links with empty-setting compatibility |
| `src/app/globals.css`, `brand-theme.css` | Palette-preserving AA contrast fixes, font variables and scoped footer styling |
| `next.config.ts` | Private/auth/API noindex and no-store headers |
| `public/images/umiya-florist-logo.webp`, `social-card.jpg` | Smaller approved logo and share card; original source retained |
| `tests/e2e/public.spec.ts`, `tests/home-entrance.test.tsx` | Deterministic no-live-write browser tests and clean image test mock |
| `package.json`, `package-lock.json` | Patched Vitest/URI dependency, retained ESLint 10, repeatable audit command |
| `scripts/audit-responsive.mjs` | Repeatable responsive and axe audit with screenshots |

Existing unrelated work was preserved. No database migration or production settings were altered.

## F. Verification and evidence

Executed successfully:

- `npm run lint` — clean after fixes.
- `npm run typecheck` — passed.
- `npm test` — **85 tests passed**, including database permission/financial invariants, PDF, inquiry alerts/deletion, settings, input and SEO tests.
- `npm run build` — production compilation passed.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npx playwright test --workers=1 --reporter=line` — **14 tests passed**, desktop/mobile.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 AUDIT_OUTPUT_DIR=docs/audit-2026-10-28 npm run audit:responsive` — **11 widths, zero detected failures**.
- `npm audit --omit=dev --json` initially found no production advisories. Full `npm audit --json` identified four development-tool advisories; targeted upgrades fixed them. The final full scan reports zero advisories.
- Isolated Studio and populated public-content fixture scans — all checked pages/dialogs clear after fixes.
- Production anonymous boundary checks — admin API 401; cron 401; invalid invoice token 404; inquiry without Origin 403. Private routes carry noindex/no-store. Auth redirect behavior passed browser tests (Next can stream a document redirect with HTTP 200).
- Full intro observation — seed, bloom, final y-bud and completed opening observed on mobile/desktop; no page errors. Reduced motion and Escape separately verified.

Screenshots: [before mobile](baseline-intro0.png), [after mobile](after-390.png), [after desktop](after-1440.png). Machine-readable results: `responsive-and-axe.json`, `studio-fixture-axe.json`, `conditional-content-axe.json`, `route-security-checks.json`, `asset-comparison.json`, `intro-animation.json`, `performance-summary.json`, Lighthouse JSON reports, and before/after dependency scans in this folder.

Warnings: package installation reports upstream React/import/accessibility lint plugins whose peer declarations still stop at ESLint 9. ESLint 9 was considered but its registry release is end-of-support, so the original supported ESLint 10 was retained; lint and types pass. Playwright printed an environment color-formatting warning (`NO_COLOR`/`FORCE_COLOR`); it did not affect tests. Intermediate failed checks were corrected and rerun: script escaping, empty optional HTTPS settings, conditional contrast and Studio footer scope. Final results above reflect passing reruns.

## G. Remaining owner/deployment actions

1. Set the real, preferred HTTPS origin in `NEXT_PUBLIC_APP_URL`; rebuild the production environment. Verify HTTP→HTTPS and www/apex redirect behavior, actual canonicals, public indexing and sitemap on that host. Register Search Console and inspect the deployed homepage/privacy URLs.
2. Enter verified public contact details, full address, service areas and hours. Complete and approve the privacy notice with actual contact, retention and provider disclosures. The current draft must not be presented as a finished policy.
3. Validate business schema on the public URL. Add verified structured PostalAddress fields before claiming LocalBusiness rich-result eligibility. Never add invented ratings/reviews or unverified offers.
4. Repeat mobile field measurements and improve the outstanding LCP target on actual hosting. Keep the intro unchanged unless an explicit product decision authorizes shortening or changing replay behavior. Establish field INP/CLS/LCP observation without collecting inquiry contents.
5. Exercise actual owner/editor/accountant sessions, password invitations/recovery, Supabase Data API/Storage RLS, backups/restore and provider test modes in a separate staging environment. No live payment/messages were performed here. WhatsApp remains paused as requested.
6. Complete real Safari/iOS, Firefox, screen-reader and zoom testing. Configure deployment-specific CSP/session/MFA/incident policy; a strict generic CSP was not inserted because it could break Next.js/GSAP/provider behavior.
7. Track upstream ESLint plugin peer support for ESLint 10; no forced plugin overrides or unsupported ESLint downgrade were retained.
8. Preserve the existing accounting/staff scope limits documented in `docs/deployment.md` and `docs/security.md`: accountant review of tax compliance and assignment-scoped field-staff workflows remain outside this visual/technical audit.

This report documents executed checks and remaining work. It is not a penetration-test certificate, legal approval, guaranteed ranking claim, or a production deployment sign-off.
