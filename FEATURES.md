# Feature Roadmap

Features are deliberately staged. Do not skip ahead because a later feature sounds useful.

## Phase 0 — Project foundation

**Goal:** A clean Next.js/TypeScript/Tailwind app that runs in Codespaces and deploys.

Acceptance:

- The app starts with one documented command.
- The landing page explains GlowCart in one sentence.
- Environment variables are documented without real values.
- A production build succeeds.

## Phase 1 — Demo shell

**Goal:** A complete clickable journey using typed mock data.

Screens:

- Landing
- Selfie upload
- Analysis result
- Product recommendations
- VTO
- Routine/cart result

Acceptance:

- A new user can finish the journey without a login.
- Every screen has loading, empty, and recoverable error states where applicable.
- Mock data is clearly separated from API adapters.

## Phase 2 — YouCam Skin AI

**Goal:** Replace only the analysis step with a secure, server-side YouCam integration.

Acceptance:

- Official endpoint, authentication, input, response, status, quota, and error behavior are documented in `YOUCAM_API_RESEARCH.md`.
- The browser never receives the YouCam secret.
- The server validates input and handles non-success responses explicitly.
- The UI displays the real response in user-friendly language.
- A labeled demo mode exists only if required for a stable presentation.
- A recorded-response path lets judges test the flow without private credentials or a fresh inference.

## Phase 3 — Recommendations

**Goal:** Map analysis concerns to a small, explainable product catalog.

Acceptance:

- Recommendations are deterministic and explainable.
- Each recommendation has name, image, price, benefit, and target concern.
- No unsupported medical claims are made.

## Phase 4 — YouCam VTO

**Goal:** Let the user try one selected product.

Acceptance:

- The integration uses a real YouCam VTO capability.
- The selected product is carried through from recommendations.
- Upload/camera permission and API errors have a recovery path.

## Phase 5 — Submission polish

**Goal:** Make the prototype judge-ready.

Acceptance:

- Deployed HTTPS URL works on a clean browser.
- Demo path completes in two minutes or less.
- README explains the problem, solution, YouCam APIs, setup, and limitations.
- A backup demo recording exists.
- Judges can test a clearly labeled recorded-response mode without API credentials.
- Live mode, if enabled, is documented separately and never exposes provider secrets.
- No unrelated features were added.

## Explicitly out of scope until Phase 5 is complete

Clerk, Supabase persistence, real payments, retailer dashboards, chatbots, custom ML, multi-category catalogs, native mobile apps, and complex analytics.
