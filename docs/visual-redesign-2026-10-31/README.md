# Black & Rose Gold visual theme — 31 October 2026

The owner-provided palette is implemented in `src/app/luxury-theme.css`, imported after the existing theme. Pearl/nude section surfaces, black CTAs with 8px corners, rose-gold details, refined borders/cards/forms and a black footer replace the wine palette. Cormorant Garamond is self-hosted for display typography; DM Sans remains the UI font. Small text uses the provided charcoal where the provided taupe fails contrast on light surfaces; taupe remains an editorial accent.

Existing sections, content, responsive breakpoints, mobile marquee, navigation, filtering, forms, validation, endpoints and integrations remain intact. No animation component, path, timeline, event handler or backend module was changed for this redesign. Botanical stem/leaf colors are restyled through CSS, preserving the approved intro geometry and motion. Natural photograph content and approved logo artwork are retained.

## Verification executed

- Lint and TypeScript: passed.
- Unit/integration suite: 101 tests across 15 files passed.
- Production build: passed.
- Chromium, Firefox and WebKit desktop/mobile: 48 existing browser checks passed, including safe mocked inquiry submission, protected-route denial, navigation, focus return, reduced motion, skippable intro and full flower-to-logo sequence.
- Responsive/axe: all 11 widths (320, 375, 390, 430, 459, 460, 768, 1024, 1280, 1440, 1920px) passed with no observed overflow, duplicate IDs, page errors or automated accessibility violations in the tested public/dialog states. See `responsive-and-axe.json`.
- No real inquiries, customer messages, payments or database writes were sent. No deployment was performed. Automated checks do not replace physical-device/assistive-technology acceptance.

## Dependency boundary

The lockfile adds only `@fontsource-variable/cormorant-garamond` 5.3.0; all existing locked package versions are unchanged. The existing OFL font license is included with the package. Current npm advisory checks report moderate findings in the existing tooling/integration dependency graph; no broad dependency upgrades or automatic audit fixes were applied as part of this visual-only change.

## Owner typography follow-up

Display typography now uses self-hosted DM Sans; body/UI uses self-hosted Montserrat, sans-serif. The Cormorant package is retained but is no longer loaded by the page layout. No functionality, animation code or palette changes accompany this update. Lint/TypeScript and live responsive/font checks were repeated for this follow-up. Earlier test totals above describe the original visual-theme verification.

## Section layout follow-up

A CSS-only layout refinement adds balanced About/Pooja columns with framed images, a vertical event-category panel on desktop (horizontal on mobile), consistent collection cards, a featured gallery composition, boxed brand-value cards and a framed inquiry form. Mobile uses stacked layouts and smaller spacing; narrow tablet image tracks are constrained after lazy image loading. DOM order, event handlers, form/backend logic and motion code are unchanged.

Follow-up verification: lint and TypeScript passed; 16 desktop/mobile browser checks passed (including forms, focus, navigation and full intro). The 11-width responsive/axe run passed without observed overflow, duplicate IDs, runtime errors or automated accessibility violations in tested states. Scrolled/lazy-image and event-category checks also cover phone/tablet/desktop widths. No real inquiries or outbound messages were sent.
