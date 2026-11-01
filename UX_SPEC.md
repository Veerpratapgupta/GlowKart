# GlowKart UX and Visual Specification

**Status:** Implemented (2026-11-01) in `components/flow/` and `app/globals.css`; kept as the design reference.

## Chosen direction

**Clinical intelligence meets editorial beauty.**

The analysis experience should feel calm, trustworthy, and precise. The result and try-on experience should become warmer, more expressive, and aspirational. This contrast communicates: “the insight is considered; the choice is yours.”

Avoid the common beauty-dashboard pattern of pink gradients, floating glass cards, and generic AI sparkle icons.

## Visual system proposal

- **Base:** warm mineral white, ink brown, and muted stone.
- **Analysis accent:** deep botanical green or mineral blue for trust and clarity.
- **Beauty accent:** one saturated lipstick red/coral used sparingly for the selected product and primary action.
- **Type:** one distinctive editorial serif for major headlines paired with a highly readable neutral sans-serif for controls and data.
- **Shape:** generous editorial whitespace with a few strong framed panels; avoid card grids everywhere.
- **Motion:** short, purposeful transitions between analysis and reveal; respect reduced-motion preferences.
- **Imagery:** product macro photography and a clear user image; avoid generic stock beauty imagery.

## Navigation model

The MVP is a guided flow, not a dashboard:

```text
01 Discover → 02 Understand → 03 Choose → 04 See it → 05 Keep it
```

Use a persistent step indicator on desktop and a compact progress label on mobile. Back navigation must preserve the selected image and recommendation state.

## Screen blueprint

### Screen 1 — Discover

**Job:** Explain the value and start the journey.

- Headline: “Meet the lipstick that makes sense for you.”
- Supporting text: “A quick skin-aware beauty match, then a try-on before you decide.”
- Primary action: “Start with a selfie”
- Secondary reassurance: “No account required · Your image is used for this session”
- Visual: a strong lipstick swatch or editorial product image, not a generic hero gradient.

### Screen 2 — Your starting point

**Job:** Collect an image with trust and clarity.

- Two input choices: “Upload a selfie” and “Use camera”
- Simple framing guidance
- File type and size validation
- Privacy note without legal overclaiming
- Loading state with clear progress
- Retry path that does not reset the whole flow

### Screen 3 — Skin snapshot

**Job:** Translate API output into understandable observations.

- Title: “Here’s what we noticed”
- Two or three observations maximum
- Confidence or intensity only if the API meaning is verified
- Plain-language explanation under each observation
- Explicit note: “Beauty guidance, not a medical diagnosis.”
- CTA: “See my lipstick matches”

### Screen 4 — The edit

**Job:** Make the recommendation feel reasoned and limited.

- One “best starting point”
- Two alternatives
- Product image, shade name, price, benefit, and “Why this match”
- Avoid claiming that a shade is objectively correct
- CTA: “Try the best match”

### Screen 5 — Try the look

**Job:** Make VTO the emotional proof moment.

- Large preview area
- Selected shade visibly named
- Before/after or toggle only if supported by the API and UX quality
- Loading and camera permission recovery
- CTA: “Keep this look”
- Secondary: “Try another shade”

### Screen 6 — Your edit

**Job:** Convert confidence into a lightweight shopping action.

- Selected product and shade
- “Why it works for your starting point”
- Price and prototype add-to-cart
- “Build another look” restart path
- No payment or login interruption

## Content rules

- Say “we noticed,” not “you have.”
- Say “starting point,” not “perfect match.”
- Say “may help create the look,” not guaranteed outcome.
- Keep user-facing copy short enough to scan.
- Always explain why a recommendation appeared.

## Accessibility requirements

- Keyboard-complete flow
- Visible focus states
- Labels and error text associated with controls
- Alternative text for product and informational images
- Color is never the only status signal
- Contrast checked for text and controls
- Motion can be reduced
- Camera/upload actions work with assistive technology where browser support permits

## Design review gate

Before implementation, review a static wireframe or design pass for:

1. One dominant action per screen.
2. No screen depends on unexplained technical terms.
3. The VTO result is the visual climax.
4. The user can recover from every expected failure.
5. The complete path is understandable without narration.
