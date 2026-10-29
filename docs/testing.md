# Testing

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
# In a second terminal:
npm run test:e2e
```

Vitest covers integer billing, duplicate deliveries, role permissions, signature validation, request limits/configuration and React form/error boundaries. PGlite applies every production migration, then checks actual PostgreSQL roles, RLS, billing, snapshots, payments, refunds, credit notes, stock ledgers, quotations/bookings, prices, pauses, consent and archival.

Playwright tests the public website at desktop and mobile sizes: navigation, filtering, dialogs, inquiry flow validation, honest missing-configuration failure, protected-route denial, unchecked optional consent, reduced motion, no-JavaScript rendering, POST form privacy and horizontal overflow. The local config uses Chrome on macOS by default; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` or install Playwright Chromium for other hosts. Screenshots are written to `docs/`.

Production performance runs use a production server, not development timing:

```sh
npm run build
npm run start -- --port 3001
npx lighthouse http://127.0.0.1:3001 --chrome-flags="--headless" --output=json --output=html --output-path=docs/lighthouse-mobile
npx lighthouse http://127.0.0.1:3001 --preset=desktop --chrome-flags="--headless" --output=json --output=html --output-path=docs/lighthouse-desktop
```

Local Lighthouse scores are lab samples from this computer, not real-user field data or guarantees. INP requires suitable real interactions/field collection. See the validation report for measured results and limits.

Before launch, rerun actual authenticated admin workflows, provider test payments, Storage permissions, email failures and restores against staging. No test here proves a real payment or email was received.


## Implementation verification — 29 October 2026

Current executed totals: 101 Vitest tests / 15 files and 48 Playwright checks. Test results and limitations are reconciled in `docs/audit-2026-10-28/report.md`. Browser inquiry submissions use controlled mocks; do not send real customer records or messages when rerunning. Database regression tests use isolated PGlite, not the live Supabase project.

To run all three browser engines, install the matching Playwright Firefox/WebKit builds, start a production server separately, then run:

```sh
npx playwright install firefox webkit
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 PLAYWRIGHT_CROSS_BROWSER=1 npm run test:e2e
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run audit:responsive
npm run check:release
```

Use a port you control. `check:release` is read-only and intentionally fails until the real HTTPS origin and required configuration exist. `build:release` runs that gate before building; it never deploys. A normal `build` remains available for local verification.

Cache tests cover anonymous-only published reads, fresh protected previews, and invalidation only after successful authorized writes. Readiness-route tests deny nonowners before data reads. Vitals tests cover disabled collection, same-origin enforcement, body limits and exclusion of customer fields. Production public responses should expose a 60-second shared cache; admin/private routes must remain protected and uncached.

Cross-engine emulation and axe are not physical iPhone/Android, VoiceOver/NVDA or real-user INP certification. Three final mobile Lighthouse runs all scored 86, with 4.22s median LCP; keep this remaining performance shortfall visible.
