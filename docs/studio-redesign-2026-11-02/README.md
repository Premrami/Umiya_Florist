# Studio visual redesign — 2 November 2026

Studio now shares the website's black, pearl, warm nude and rose-gold palette. DM Sans remains the display font and Montserrat the body/UI font. The approved wordmark is displayed on the black sidebar and on sign-in/password-recovery pages. Active navigation uses dusty rose, while overview cards, revenue chart, tables, empty states, form dialogs, status messages, calendar, actions and mobile quick navigation share the new visual system.

The stylesheet is `src/app/studio-theme.css`, imported after the website theme. Authentication, roles, API calls, CRUD operations, billing, exports and form validation are unchanged. The Studio navigation wrapper uses valid complementary/dialog semantics; the horizontal chart region can receive keyboard focus on narrow screens. Very narrow phones use one metric card per row to keep financial values readable. Existing menu transitions remain; CTA hover movement is suppressed to match the website.

## Executed checks

- Lint and TypeScript passed.
- 101 existing unit/integration tests passed, including Studio permission and form handling regressions.
- 54 browser checks passed across Chromium, Firefox and WebKit, including public flows, protected-route denial, inquiry confirmation, mobile navigation and the original intro animation.
- Isolated Studio fixtures rendered the actual Admin component with synthetic data at 320, 390, 768 and 1440px. Overview, client table, add-client dialog and mobile More menu had no observed horizontal page overflow, runtime errors or automated axe violations in the final run. Results: `fixture-checks.json`.
- Actual sign-in/recovery pages were checked at 320, 390 and 1440px; logo present, no overflow or axe violations. No authentication or recovery submission was sent.

The screenshots use sample data, not live business records. Fixtures existed only in a headless test browser and temporary files; no preview/authentication-bypass route was added to the application. All fixture API mutations were blocked. No live records, credentials, financial transactions or notifications were changed, and no deployment was performed. These checks do not replace authenticated staging acceptance of every real Studio workflow.

Production build: passed after the final styling and accessibility changes.
