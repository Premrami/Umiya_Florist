> Updated 29 October 2026: see the implementation reconciliation below for current issue statuses, measured results and release blockers. Original findings are preserved.

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


## Implementation reconciliation — 29 October 2026

This section updates the original audit in place; all original observations above remain historical evidence. Findings from this report, the initial audit, validation report and implementation-status document were deduplicated and cross-checked against the source. The 46 combined items include older product/financial acceptance backlog, not 46 newly discovered defects. A FIXED status may mean a previous fix was verified and preserved; it does not imply every listed file was newly changed today.

**23 FIXED · 7 PARTIALLY FIXED · 14 BLOCKED · 2 NOT APPLICABLE.** No deployment, production database write, migration, inquiry submission, payment or outbound customer message was performed. Blocked scope requires missing factual decisions, provider/staging access, upstream support or business acceptance; it is not represented as completed.

### Implemented and measured

- Public pages use anonymous published-content reads with 60-second tagged caching. Authorized successful public-content mutations invalidate the home/privacy pages; protected previews fetch fresh content. Private records and session cookies do not enter the public content cache. Production responses demonstrated STALE then HIT.
- Moved GSAP scroll/intro library loading off the initial bundle, preserved approved flower-to-logo choreography and cancellation/watchdogs, batched reveal geometry reads, removed two unused font packages, optimized responsive logo output and reduced favicon size from 67,749 to 5,898 bytes. The prior logo optimization remains intact.
- Added structured address and owner-reviewed privacy fields, truthful JSON-LD fallbacks, owner-only launch readiness, a release configuration gate, deployment-aware security headers and disabled-by-default privacy-limited first-party vitals.
- Fixed WebKit mobile modal focus return and connected Studio validation errors to the offending field.

| Production lab measurement | Previous audit | Final measurement |
| --- | --- | --- |
| Mobile Lighthouse performance | 85 | 86 in all three final runs |
| Mobile LCP | 4.38 s | 4.22 s median; 4.21–4.28 s range |
| Mobile TBT | 17.5 ms | 15.5 ms median |
| CLS | 0 | 0 |
| Desktop performance / LCP | 100 / 0.71 s | 99 / 0.85 s |
| Accessibility / best practices | See original evidence | 100 / 100 in all four final runs |

Mobile **LCP still exceeds 2.5 seconds**; desktop variation is reported rather than hidden. Local SEO remains 63 because localhost is intentionally noindex and no final public origin is configured. Synthetic interaction Event Timing peaked at 64ms in the observed menu/keyboard flow; this is **not field INP**. The 200ms INP target cannot be signed off without representative deployed traffic.

### Executed checks and boundaries

- 101 unit/integration tests across 15 files passed, including actual PostgreSQL/PGlite role/financial regression checks and cache/readiness/publish tests.
- 48 Playwright checks passed across Chromium, Firefox and WebKit desktop/mobile configurations. WebKit's initial focus-return failure was corrected before the final successful run. Full intro, skip/reduced motion, navigation and safe mocked inquiry behavior were exercised.
- Production responsive/axe checks passed at 320, 375, 390, 430, 459, 460, 768, 1024, 1280, 1440 and 1920px: no observed horizontal overflow, duplicate IDs, page errors or axe violations in the tested public/dialog states. This does not certify all authenticated Studio states or WCAG conformance.
- Lint, TypeScript, production build and diff whitespace checks passed. Dependency audit reported zero advisories, including development dependencies. Upstream ESLint peer ranges remain a separate compatibility warning.
- Compiled-public-asset boundary scan found no configured private secret values in the 59 checked files/HTML responses; values were never included in the evidence.
- Anonymous private API requests returned 401; telemetry returned 404 while disabled; no CSP violations were observed in the checked public flow.
- Release gate correctly fails for the missing final public HTTPS origin. Database/inquiry environment presence checks pass; presence does not prove live credentials, RLS transport, message delivery or recovery.

Evidence: [performance samples](implementation-2026-10-29/performance-summary.json), [responsive/axe results](implementation-2026-10-29/responsive-and-axe.json), [runtime checks](implementation-2026-10-29/runtime-verification.json), [dependency audit](implementation-2026-10-29/dependencies.json), [secret-boundary scan](implementation-2026-10-29/secret-boundary-scan.json), [machine-readable issue statuses](implementation-2026-10-29/item-statuses.json).

Automatic approval review rejected removing the intro's hidden SVG reference because that could alter the approved morph. That element and its selectors remain intact; only separately approved asset optimizations were applied.

### Per-issue implementation status

#### R01 — Page metadata, canonical URLs and query variants — FIXED

- **Root cause:** Metadata was incomplete in the original site.
- **Solution:** Retained production-aware per-page title/description, canonical and OG/Twitter metadata; shared the origin validator with the release checker.
- **Files / verification references:** `src/lib/seo.ts`, `src/lib/public-origin.mjs`, `tests/seo.test.ts`
- **Verification:** SEO unit tests; privacy route/browser checks.
- **Remaining limitations:** Public tags remain intentionally absent/noindex for localhost; see R02.

#### R02 — Real public HTTPS origin and live indexing — BLOCKED

- **Root cause:** No final public domain has been supplied.
- **Solution:** Added check:release/build:release and an owner launch checklist. Never guessed a domain or enabled local indexing.
- **Files / verification references:** `scripts/check-release.mjs`, `src/lib/readiness.ts`, `src/components/launch-readiness.tsx`, `package.json`
- **Verification:** check:release correctly fails only the public HTTPS-origin check; configured database/inquiry keys pass presence checks.
- **Remaining limitations:** Owner must supply the preferred HTTPS origin, configure the deployment and rebuild. No automatic deployment performed.

#### R03 — HTTPS/preferred-host redirects and HSTS — PARTIALLY FIXED

- **Root cause:** Host ownership and deployment topology are unknown.
- **Solution:** Added opt-in www/apex canonical redirect and production HTTPS-origin-gated HSTS; local development remains HTTP.
- **Files / verification references:** `next.config.ts`, `.env.example`
- **Verification:** Production build and config type checks; current environment deliberately leaves the redirect off.
- **Remaining limitations:** Live HTTPS, certificate and redirect-chain verification require the actual domain/hosting. ENFORCE_CANONICAL_HOST is off by default.

#### R04 — Robots, sitemap and private route indexing/cache rules — FIXED

- **Root cause:** Original coverage omitted privacy/private paths.
- **Solution:** Retained public-only sitemap and private noindex/no-store headers; cached only public pages.
- **Files / verification references:** `src/app/robots.ts`, `src/app/sitemap.ts`, `next.config.ts`, `src/app/page.tsx`
- **Verification:** Browser private-route tests; runtime private APIs 401; public response cache HIT.
- **Remaining limitations:** Sitemap needs R02 to contain real public URLs.

#### R05 — Structured local-business address/schema support — FIXED

- **Root cause:** Only a free-form address existed, insufficient for a reliable PostalAddress.
- **Solution:** Added optional owner-editable street/locality/region/postal/country fields and valid PostalAddress JSON-LD. Organization remains the fallback for incomplete facts.
- **Files / verification references:** `src/lib/business-details.ts`, `src/lib/modules.ts`, `src/lib/seo.ts`, `tests/seo.test.ts`
- **Verification:** Complete/partial address unit tests, settings tests, strict types/build.
- **Remaining limitations:** Real Google validation and business eligibility still require R02/R06; no result eligibility or rankings claimed.

#### R06 — Missing verified business contact/address/hours — BLOCKED

- **Root cause:** The requested verified facts have not been provided.
- **Solution:** Added fields and clear owner readiness actions; rendered supplied address/email consistently. Asked for the missing facts.
- **Files / verification references:** `src/lib/modules.ts`, `src/components/website.tsx`, `src/lib/readiness.ts`
- **Verification:** Fixture completeness checks; no invented contact/address values inserted.
- **Remaining limitations:** Owner must provide and approve real public data. Nothing was written to the live database.

#### R07 — Privacy draft, retention and contact disclosures — PARTIALLY FIXED

- **Root cause:** A generic draft lacked editable approved wording and review information.
- **Solution:** Wired privacy contact, retention wording and owner-reviewed date through Settings; the SSR notice uses them and remains explicitly a draft until complete. Added truthful configured-provider and metric data disclosures.
- **Files / verification references:** `src/app/privacy/page.tsx`, `src/lib/modules.ts`, `src/lib/business-details.ts`, `tests/launch-readiness.test.ts`
- **Verification:** Privacy route test; blank settings and readiness regression tests.
- **Remaining limitations:** Owner must approve actual policy, retention practice and contact details; no legal approval or automatic deletion is asserted.

#### R08 — JSON-LD escaping and fabricated rich-result claims — FIXED

- **Root cause:** Stored strings could otherwise close an inline script; unverified details must not become schema facts.
- **Solution:** Retained escaping tests, omitted invented ratings/hours/offers, and gated Florist on complete actual address components.
- **Files / verification references:** `src/lib/seo.ts`, `tests/seo.test.ts`
- **Verification:** Script-closing round-trip test and missing-address tests pass.
- **Remaining limitations:** None for the verified local scope.

#### R09 — One H1, conditional heading hierarchy, semantic landmarks — FIXED

- **Root cause:** Populated testimonials/gallery and Studio footer previously had hierarchy/landmark gaps.
- **Solution:** Retained corrected H2s, semantic footer, main landmarks and named navigation.
- **Files / verification references:** `src/components/website.tsx`, `src/components/admin.tsx`
- **Verification:** Public H1/anchor tests; axe at all requested widths and previous populated-content fixtures.
- **Remaining limitations:** None for the verified local scope.

#### R10 — Public/private internal links and obsolete mobile test assumptions — FIXED

- **Root cause:** Tests assumed missing credentials and old hamburger-only navigation.
- **Solution:** Current dock/Menu, anchor, privacy/404 and protected route tests use real route behavior and mocked writes.
- **Files / verification references:** `tests/e2e/public.spec.ts`, `playwright.config.ts`
- **Verification:** 48 Chromium/Firefox/WebKit browser checks including narrow and wide layouts.
- **Remaining limitations:** None for the verified local scope.

#### R11 — Unsafe external URLs — FIXED

- **Root cause:** Generic URL parsing previously allowed unsuitable protocols.
- **Solution:** Retained HTTPS-only approved external settings and restricted image hosts; empty optional settings still save.
- **Files / verification references:** `src/lib/modules.ts`, `tests/input-validation.test.ts`
- **Verification:** URL-scheme, blank setting, form-save tests; zero browser CSP violations.
- **Remaining limitations:** None for the verified local scope.

#### R12 — Public and Studio contrast/readability — FIXED

- **Root cause:** Secondary text tokens were too light or too dark for their surfaces.
- **Solution:** Retained the palette-preserving contrast corrections; new readiness/privacy content uses those tokens.
- **Files / verification references:** `src/app/brand-theme.css`
- **Verification:** Axe responsive/public dialog checks; screenshots.
- **Remaining limitations:** Automated checks do not certify all real screen-reader/device behavior.

#### R13 — Mobile/tablet/desktop reflow and touch navigation — FIXED

- **Root cause:** Small dialogs/titles and dock ordering previously needed correction.
- **Solution:** Retained responsive layouts and validated the additional settings/notice content.
- **Files / verification references:** `src/app/brand-theme.css`, `scripts/audit-responsive.mjs`
- **Verification:** 320/375/390/430/768/1024/1280/1440/1920 plus 459/460; no detected overflow.
- **Remaining limitations:** None for the verified local scope.

#### R14 — Modal keyboard access and trigger-focus restoration — FIXED

- **Root cause:** WebKit touch activation does not natively focus buttons.
- **Solution:** Explicitly focus menu trigger buttons before opening; retain Escape, background scroll locking and return focus.
- **Files / verification references:** `src/components/mobile-dock.tsx`, `src/components/website.tsx`
- **Verification:** Initially 47/48 engine checks passed; after the fix all 48 passed, including WebKit mobile focus return.
- **Remaining limitations:** None for the verified local scope.

#### R15 — Public form validation, duplicate requests and response states — FIXED

- **Root cause:** Generic errors and asynchronous disabled-state updates were insufficient.
- **Solution:** Retained field identification, synchronous duplicate guard, idempotency, unchecked optional consent, success reset and retry states.
- **Files / verification references:** `src/components/website.tsx`, `src/lib/inquiry-validation.ts`, `tests/e2e/public.spec.ts`
- **Verification:** Mocked errors/retry/success and duplicate-submit checks on all three engines; no live inquiry sent.
- **Remaining limitations:** None for the verified local scope.

#### R16 — Studio corrective field feedback and numeric validation — FIXED

- **Root cause:** Studio API errors did not identify the failing field.
- **Solution:** Added safe Zod field messages and focus/aria-invalid linkage; retained numeric/phone limits and valid signed/decimal business quantities.
- **Files / verification references:** `src/lib/auth.ts`, `src/components/admin.tsx`, `src/components/form-input.tsx`
- **Verification:** Unit/component/input validation suites, settings-save tests, strict types/build.
- **Remaining limitations:** Database/provider-state errors remain deliberately generic to avoid leaking internal details.

#### R17 — No-JavaScript usability — FIXED

- **Root cause:** Content was readable but the online form did not explain its JavaScript requirement.
- **Solution:** Added a no-JavaScript message and hid the JS-only submit action; preserved readable SSR content and links.
- **Files / verification references:** `src/components/website.tsx`
- **Verification:** No-JavaScript browser checks pass across engines.
- **Remaining limitations:** Online submission still requires JavaScript; no insecure URL/query-based submission fallback added.

#### R18 — Alert request cleanup and React lint failure — FIXED

- **Root cause:** Initial alerts fetch needed cancellation.
- **Solution:** Retained cancellable fetch and used the same pattern for readiness; avoided setState after cancelled animation imports.
- **Files / verification references:** `src/components/inquiry-alert-panel.tsx`, `src/components/launch-readiness.tsx`, `src/components/home-entrance.tsx`
- **Verification:** Lint clean; animation early-skip/cleanup/watchdog tests; no page errors.
- **Remaining limitations:** None for the verified local scope.

#### R19 — Critical development dependency advisories — FIXED

- **Root cause:** Old Vitest/worker and URI-parser versions were affected.
- **Solution:** Retained patched versions and rescanned after dependency cleanup.
- **Files / verification references:** `package.json`, `package-lock.json`
- **Verification:** Final npm audit reports zero advisories across production and development dependencies.
- **Remaining limitations:** None for the verified local scope.

#### R20 — ESLint plugin declared peer support — BLOCKED

- **Root cause:** Latest upstream React/import/a11y plugins still declare ESLint <=9; ESLint 9 is out of support.
- **Solution:** Kept the supported existing ESLint 10 and tested its behavior. Did not force plugin overrides or downgrade to unsupported tooling.
- **Files / verification references:** `package.json`, `package-lock.json`
- **Verification:** Registry peer ranges checked again; lint and types pass.
- **Remaining limitations:** Upstream compatible declarations/releases are required to remove installation peer warnings safely.

#### R21 — Slow public document/uncacheable cookie-bound content reads — FIXED

- **Root cause:** Public content used a request-cookie Supabase client and force-dynamic homepage rendering.
- **Solution:** Use a stateless anonymous client with tagged public fetch caching and one-minute ISR. Private/admin data is never cached.
- **Files / verification references:** `src/lib/content.ts`, `src/lib/public-cache.ts`, `src/app/page.tsx`, `src/app/privacy/page.tsx`
- **Verification:** Build lists / and /privacy as static/ISR; runtime STALE then HIT with public s-maxage=60; public-cache isolation tests pass.
- **Remaining limitations:** None for the verified local scope.

#### R22 — CMS freshness after caching — FIXED

- **Root cause:** Shared caching requires invalidation after publication/settings changes.
- **Solution:** Expire public data tags and public page paths after successful authorized public-content writes/publish/delete; drafts preview bypasses caches.
- **Files / verification references:** `src/lib/public-cache.ts`, `src/app/api/admin/[module]/route.ts`, `src/app/api/admin/actions/route.ts`, `src/app/admin/preview/page.tsx`
- **Verification:** Three mocked publish-route tests plus cache tests prove successful save ordering, no invalidation on failure and fresh preview reads.
- **Remaining limitations:** Live owner publish-to-host acceptance remains part of R35; no live CMS record was changed.

#### R23 — Initial JavaScript and unused imports/dependencies — FIXED

- **Root cause:** Animation plugins loaded before they were needed; two old UI font packages were unused.
- **Solution:** Split website motion, lazy-load GSAP only when the intro plays, remove unused font packages/imports, preserve fonts/animation assets.
- **Files / verification references:** `src/components/website-motion.ts`, `src/components/website.tsx`, `src/components/home-entrance.tsx`, `package.json`, `docs/assets.md`
- **Verification:** Unit cleanup/race tests, full intro playback on three engines, lint/types/build.
- **Remaining limitations:** Required React/GSAP runtime code is not treated as removable dead code.

#### R24 — Forced layout/reflow and animation lifecycle — PARTIALLY FIXED

- **Root cause:** Reveal setup interleaved geometry reads and transform writes.
- **Solution:** Batch initial reveal measurements before GSAP writes; preserve context/listener/tween cleanup and cancellation after lazy loading.
- **Files / verification references:** `src/components/website-motion.ts`, `src/components/home-entrance.tsx`
- **Verification:** Browser navigation/intro checks, no errors, cancellation/watchdog tests.
- **Remaining limitations:** GSAP/ScrollTrigger still performs necessary geometry work; no claim of zero layout work or deletion of the approved SVG morph.

#### R25 — Logo, favicon and responsive image delivery — FIXED

- **Root cause:** Oversized browser-tab variants and full-resolution display logos consumed extra bytes.
- **Solution:** Preserved exact favicon PNGs at 16/32/48px and high-resolution source; serve quality-100 responsive logos; keep original intro artwork.
- **Files / verification references:** `src/app/favicon.ico`, `src/components/website.tsx`, `next.config.ts`
- **Verification:** Favicon 67,749 to 5,898 bytes; image decode and viewport checks; original high-resolution monogram and approved logo remain.
- **Remaining limitations:** Automatic review rejected removing a hidden intro SVG because of animation risk. It was retained; only safer asset optimizations were applied.

#### R26 — Hero priority, fonts and CLS — FIXED

- **Root cause:** Hero discovery and font delivery competed with noncritical resources.
- **Solution:** Retained exact preloaded local fonts/fallbacks; add prioritized responsive hero preload and keep below-fold photos lazy.
- **Files / verification references:** `src/components/website.tsx`, `src/app/layout.tsx`, `next.config.ts`
- **Verification:** Lighthouse and browser image decode checks; responsive visual checks.
- **Remaining limitations:** See R27 for the measured mobile loading target rather than equating an optimization with a guaranteed score.

#### R27 — Mobile LCP <=2.5s — PARTIALLY FIXED

- **Root cause:** Transfer, discovery, initial client work and document fetching affected mobile loading.
- **Solution:** Implemented R21-R26 and measured repeated production runs; preserve all approved animations.
- **Files / verification references:** `src/lib/content.ts`, `src/components/website-motion.ts`, `src/components/website.tsx`, `next.config.ts`
- **Verification:** Three final production Lighthouse mobile runs: performance 86 each, median LCP 4215.18ms (range 4214.64–4284.75), CLS 0 and median TBT 15.5ms. Desktop performance 99, LCP 847.98ms.
- **Remaining limitations:** Mobile LCP remains above the requested 2500ms target. No deployed field Core Web Vitals claim; retain approved animation and verify on real hosting/networks after R02.

#### R28 — INP measurement and runtime performance visibility — PARTIALLY FIXED

- **Root cause:** No real field traffic or privacy-approved collection was available.
- **Solution:** Added disabled-by-default minimal first-party LCP/INP/CLS collection with strict payload/origin/size checks and DNT respect.
- **Files / verification references:** `src/components/web-vitals.tsx`, `src/lib/vitals.ts`, `src/app/api/vitals/route.ts`, `.env.example`
- **Verification:** Metric privacy/size/disabled tests; runtime endpoint 404 while disabled; synthetic maximum interaction duration 64ms.
- **Remaining limitations:** 64ms is an observed lab Event Timing duration, not field INP. Owner approval, deployed traffic and aggregation are required; collection remains off.

#### R29 — CSP and security-header hardening — PARTIALLY FIXED

- **Root cause:** There was no compatible app-wide policy or domain-gated HSTS.
- **Solution:** Added enforced self-hosted resource, object/base/frame/form restrictions and secure host policy without breaking Next/GSAP.
- **Files / verification references:** `next.config.ts`
- **Verification:** No securitypolicyviolation events in checked flows; all browser engine tests pass.
- **Remaining limitations:** Inline script/style allowance remains for current Next/GSAP/ISR architecture. A nonce/hash stricter policy needs a separate deployment tradeoff review.

#### R30 — Owner launch checklist and release guard — FIXED

- **Root cause:** Launch blockers existed only in documentation.
- **Solution:** Added owner-protected readiness API/panel, production configuration command, and build:release gate.
- **Files / verification references:** `src/lib/readiness.ts`, `src/app/api/admin/readiness/route.ts`, `src/components/launch-readiness.tsx`, `scripts/check-release.mjs`
- **Verification:** Owner gate tests; no secret data in response; real release check refuses the missing domain.
- **Remaining limitations:** A configuration pass is not a substitute for the remaining manual acceptance gates.

#### R31 — Cross-browser coverage — FIXED

- **Root cause:** Only Chromium had been exercised previously.
- **Solution:** Installed isolated Firefox/WebKit test engines and added repeatable opt-in projects.
- **Files / verification references:** `playwright.config.ts`, `tests/e2e/public.spec.ts`
- **Verification:** 48/48 checks passed on Chromium, Firefox and WebKit in wide/narrow profiles.
- **Remaining limitations:** WebKit emulation is not a claim of physical iPhone/Safari app acceptance.

#### R32 — Screen reader, text zoom and physical-device acceptance — PARTIALLY FIXED

- **Root cause:** Automated scans do not establish full WCAG certification.
- **Solution:** Verified semantic landmarks, labels, keyboard flow, 320px reflow, focus return, reduced motion and browser engines.
- **Files / verification references:** `scripts/audit-responsive.mjs`, `tests/e2e/public.spec.ts`
- **Verification:** Axe and keyboard/reflow evidence retained.
- **Remaining limitations:** Physical iOS/Android, VoiceOver/NVDA and user text-zoom acceptance still require manual assistive-device sessions.

#### R33 — Real credentials reported missing in 19 October report — NOT APPLICABLE

- **Root cause:** That is a historical statement, not the present environment.
- **Solution:** Current presence checks confirm local Supabase and inquiry keys exist; historical wording is preserved with a superseding status note.
- **Files / verification references:** `docs/implementation-status.md`, `docs/validation-report.md`
- **Verification:** check:release verifies presence without printing values.
- **Remaining limitations:** Presence does not certify live services, delivery, staging or deployment; see R35/R36.

#### R34 — FAQ/Product/review rich-result promises and 3D replacement — NOT APPLICABLE

- **Root cause:** No verified offers/ratings justify Product/Review schema; the approved current animation supersedes the old optional bloom-video request.
- **Solution:** Kept honest informational schema and the approved intro; did not invent rich-result facts or replace the design.
- **Files / verification references:** `src/lib/seo.ts`, `docs/audit-2026-10-28/report.md`
- **Verification:** Schema tests and full intro browser checks.
- **Remaining limitations:** No ranking guarantee or automatic asset-generation/replacement is part of this remediation.

#### R35 — Actual role sessions, Auth recovery and Supabase API/Storage RLS acceptance — BLOCKED

- **Root cause:** Isolated tests do not provide real owner/editor/accountant sessions or a separate staging environment.
- **Solution:** Retained permission guards, unit/database tests and public denial checks; no authentication bypass or production mutations used.
- **Files / verification references:** `tests/public-cache.test.ts`, `tests/public-publish.test.ts`, `tests/launch-routes.test.ts`
- **Verification:** Database tests and public denial checks pass; actual session acceptance not claimed.
- **Remaining limitations:** Requires owner-operated staging accounts and approved live-service test fixtures.

#### R36 — Payment/refund/webhook/email/SMS delivery and reconciliation acceptance — BLOCKED

- **Root cause:** Provider delivery/test events require approved accounts, fixtures and a reachable deployment.
- **Solution:** Preserved integrations and tested ledger/signature/alert behavior without real transactions or messages.
- **Files / verification references:** `tests/database.test.ts`, `tests/inquiry-alerts.test.ts`, `docs/testing.md`
- **Verification:** Local automated tests pass; no live payment/email/SMS/WhatsApp sent.
- **Remaining limitations:** External acceptance is needed. WhatsApp stays paused; no message dispatch or live payment is authorized as a test here.

#### R37 — Backups, restoration, hosting, incident/MFA/session policy and monitoring transport — BLOCKED

- **Root cause:** These require infrastructure administration and real recovery/session decisions.
- **Solution:** Provided release controls, secure defaults and a clear acceptance procedure without changing accounts or deploying.
- **Files / verification references:** `docs/deployment.md`, `docs/security.md`, `scripts/check-release.mjs`
- **Verification:** Local configuration and guard checks pass.
- **Remaining limitations:** Owner must verify backup restore, MFA/session limits, hosting access, monitoring transport and incident contacts.

#### R38 — GST/tax invoice layout, QR and accountant approval — BLOCKED

- **Root cause:** Jurisdiction/accounting choices and approved document requirements were not supplied.
- **Solution:** Preserved integer-paise billing, immutable ledgers and existing PDF tests; no speculative financial model changes.
- **Files / verification references:** `docs/implementation-status.md`, `docs/deployment.md`
- **Verification:** Financial/PDF regression tests remain passing.
- **Remaining limitations:** Requires accountant-approved GST breakdown, numbering, QR requirements and acceptance before implementation can be finalized.

#### R39 — Suppliers, purchase orders and full event material reservations — BLOCKED

- **Root cause:** This is unimplemented legacy master-brief feature scope, not a known technical defect in current inventory movement logic.
- **Solution:** Cross-checked current expense/stock/task flows and preserved them; did not invent procurement/reservation contracts.
- **Files / verification references:** `docs/implementation-status.md`, `docs/admin-guide.md`
- **Verification:** Existing booking and stock-ledger tests pass.
- **Remaining limitations:** Requires agreed supplier/PO/reservation workflow and an approved additive schema/migration plan.

#### R40 — Item-price edit/removal, client tags/birthdays and expanded reporting/export — BLOCKED

- **Root cause:** Historical feature backlog has no supplied data-retention/editing/export acceptance rules.
- **Solution:** Current item add/effective-price and truthful current-page export remain intact.
- **Files / verification references:** `docs/implementation-status.md`, `src/components/admin.tsx`
- **Verification:** Existing UI/financial tests pass.
- **Remaining limitations:** Requires approved product scope and safe historical billing/PII export rules; not falsely marked implemented.

#### R41 — Assignment-scoped field-staff, in-app MFA/owner role editing and auxiliary schema parity — BLOCKED

- **Root cause:** Assignments, ownership safeguards and provider MFA policy need explicit design; reserved staff is intentionally denied broad access.
- **Solution:** Preserved role/RLS boundaries and accountant billing identity; did not enable the reserved staff role or weaken access.
- **Files / verification references:** `docs/security.md`, `docs/implementation-status.md`
- **Verification:** Role/database tests pass.
- **Remaining limitations:** Requires approved authorization model, recovery policy and associated schema/provider setup.

#### R42 — Video/multiple media, drag sorting and comprehensive reuse/deletion safeguards — BLOCKED

- **Root cause:** These are separate legacy media features with no approved media lifecycle or storage policy.
- **Solution:** Preserved validated public images/private attachment foundations and existing upload restrictions.
- **Files / verification references:** `docs/implementation-status.md`, `docs/security.md`
- **Verification:** Existing media tests pass.
- **Remaining limitations:** Requires media/storage/retention decisions and safe migrations; no live media deleted or unsupported video pipeline asserted.

#### R43 — Quotation communication templates, bounce callbacks and orphan provider-link UI — BLOCKED

- **Root cause:** Approved templates/sender/provider events and operational reconciliation rules are missing.
- **Solution:** Retained existing reviewed invoice communication and provider idempotency paths; no automatic sending introduced.
- **Files / verification references:** `docs/implementation-status.md`, `docs/integrations.md`
- **Verification:** Existing provider/signature/local alert tests remain passing.
- **Remaining limitations:** Requires provider test setup, reviewed content, bounce/event contracts and owner reconciliation acceptance.

#### R44 — Full multilingual CMS, section ordering and section-specific content models — BLOCKED

- **Root cause:** These are unimplemented legacy product features beyond the approved current structured section model.
- **Solution:** Preserved existing CMS fields, mobile order and animations; no guessed translation or content/schema redesign.
- **Files / verification references:** `docs/implementation-status.md`
- **Verification:** Current CMS publishing/private preview tests and public navigation checks pass.
- **Remaining limitations:** Requires approved locale/content/editorial model and additive schema/UI acceptance.

#### R45 — Concurrency/load, restore and production monitoring tests — BLOCKED

- **Root cause:** There is no isolated staging deployment or approved load/restore target.
- **Solution:** Retained transactional/idempotency tests and added repeatable browser/configuration checks; no load was directed at live business services.
- **Files / verification references:** `docs/testing.md`, `tests/database.test.ts`, `scripts/audit-responsive.mjs`
- **Verification:** Local tests/production build pass.
- **Remaining limitations:** Requires a staging target, workload limits, restore access and monitoring alert destination.

#### R46 — Private secrets in client assets — FIXED

- **Root cause:** Audit requires a boundary check, not exposing credentials in reports.
- **Solution:** Retained server-only credential access and verify compiled public assets do not contain configured secret values.
- **Files / verification references:** `src/lib/content.ts`, `src/app/api/admin/readiness/route.ts`, `tests/public-cache.test.ts`, `tests/launch-routes.test.ts`
- **Verification:** Server/client boundary tests and a value-redacted compiled-asset scan.
- **Remaining limitations:** This is not a penetration-test certification.
