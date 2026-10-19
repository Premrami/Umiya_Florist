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
