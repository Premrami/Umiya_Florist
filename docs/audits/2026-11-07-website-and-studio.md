# Website and Studio audit — 7 November 2026

The tested public website flows, Studio layouts, and source checks pass after the fixes below. This audit used the current local project and an optimized production build at http://127.0.0.1:3000/. No deployment was made.

## Fixed

1. **Studio text contrast:** inquiry alert descriptions, configuration and launch notes, and calendar dates inherited faint legacy colors. The Studio theme now uses the existing charcoal text token for these elements. Rechecks found no automated accessibility violations on the exercised screens and forms.
2. **Netlify preview indexing:** SEO previously recognized Vercel previews only. Netlify deploy previews, branch deploys, and its development context now receive noindex metadata and a site-wide `X-Robots-Tag: noindex, nofollow` header. Production remains indexable when its public HTTPS origin is configured. The Studio readiness check and release configuration check use the same environment detection. Reference: [Netlify build environment variables](https://docs.netlify.com/build/configure-builds/environment-variables/).
3. **Additional form coverage:** added browser tests for daily-flower and event inquiries, including required fields, phone sanitization, guest-number filtering, submitted details, consent defaults, and successful confirmation. All requests in these tests are intercepted and simulated.

## Verification

| Check                                  | Result                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| ESLint, TypeScript, whitespace checks  | Passed                                                                                               |
| Unit/component/database tests          | 145 passed across 21 test files                                                                      |
| Optimized production build             | Passed; 30 static pages generated                                                                    |
| Public browser tests                   | 72 passed across Chrome, Firefox and WebKit, each at mobile and desktop sizes                        |
| Website responsive/accessibility audit | 11 widths: 320, 375, 390, 430, 459, 460, 768, 1024, 1280, 1440, 1920px                               |
| Studio screen layouts                  | All 22 modules at 320, 390, 768, 1440px: 88 screen checks                                            |
| Studio create/settings form layouts    | 14 forms at each of those four widths: 56 form checks                                                |
| Loaded public images                   | No broken images detected after scrolling every section at 390/1440px                                |
| Public anchors                         | No missing section targets                                                                           |
| Semantic checks                        | One H1, no duplicate IDs, no missing image alt attributes                                            |
| Public routes/assets                   | robots.txt, sitemap.xml, favicon, SVG icon, social card, login, recovery and privacy return HTTP 200 |
| Private access                         | Anonymous Studio access redirects to login; private APIs remain protected and noindex                |

The browser suite exercises collection/occasion navigation, mobile More, keyboard close/focus return, gallery navigation, custom-bouquet inquiries, daily-flower inquiries, event inquiries, compact contact forms, failed submissions and retries, duplicate submission prevention, success popups, 404/privacy pages, server-rendered content without JavaScript, intro skip, and the complete seed → flower → logo sequence. Existing animation behavior was preserved.

Phone fields sanitize letters and preserve the optional country-code plus sign. Numeric controls prevent alphabetic/exponent input and respect integer, decimal and signed-stock requirements as appropriate. Server validation tests cover invalid phone numbers, whitespace messages, invalid dates, budgets and guest counts.

## Loading performance

One Lighthouse mobile run against the local optimized homepage with simulated mobile throttling:

| Metric                   | Result                                        |
| ------------------------ | --------------------------------------------- |
| Performance              | 84/100                                        |
| Accessibility            | 100/100                                       |
| Best practices           | 100/100                                       |
| SEO                      | 63/100 — local site intentionally has noindex |
| First contentful paint   | 1.1 seconds                                   |
| Largest contentful paint | 4.6 seconds                                   |
| Total blocking time      | 20 milliseconds                               |
| Cumulative layout shift  | 0                                             |

Mobile loading performance still has room to improve, especially LCP under throttling, responsive image delivery and initial scripts/styles. These are measured improvement opportunities; the animation timing and website layout were not changed for a synthetic score. This single local run does not establish real-user production performance.

## Required before public indexing

`npm run check:release` finds the database/inquiry configuration present but the **final public HTTPS origin missing** in the local configuration. Until `NEXT_PUBLIC_APP_URL` is set to the confirmed public website origin and the app is rebuilt, the site deliberately omits canonical URLs and sitemap entries and marks public pages noindex. This is why the local Lighthouse SEO score is reduced. Do not remove those protections just to raise the local score.

After configuring the confirmed origin in the hosting environment, rebuild and check the deployed canonical, sitemap and indexability. Public title, description, social metadata generation and structured-data generation have passing source tests. Structured business address data requires complete verified owner-entered details.

## Scope and practical limits

- Studio browser checks render the actual components/styles in an isolated fixture with sample records and mocked API responses. Authentication was not bypassed in the application. Authenticated production account workflows were not exercised.
- Existing unit/component/database tests cover protected actions and data handling. They do not prove every operation against the live database.
- No real inquiries, payments, staff invitations, password recovery emails, SMS or WhatsApp messages were sent. Delivery and provider setup remain separate live checks.
- Automated accessibility results and visual inspection cover the recorded states and widths; they are not a guarantee of every browser/device/content combination. User-uploaded content can differ from the tested records.

## Changed files

- `src/app/studio-theme.css` — legible supporting text and calendar dates.
- `src/lib/public-origin.mjs` — shared preview environment detection.
- `src/lib/seo.ts` — preview noindex metadata.
- `next.config.ts` — preview noindex response header.
- `src/lib/readiness.ts` and `scripts/check-release.mjs` — matching release/readiness detection.
- `tests/seo.test.ts` — Netlify preview and production indexing regression coverage.
- `tests/e2e/public.spec.ts` — daily and event inquiry browser coverage.

Evidence, screenshots and JSON reports: `/Users/premrami/.codex/visualizations/2026/10/19/01a1532e-88bd-79c3-85c8-f76a0614b54c/audit-2026-11-07/`.
