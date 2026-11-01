# Project Memory

This file is the durable, repository-local memory for agents. Update it only with verified decisions or non-obvious constraints.

## Product

- Product name: GlowCart.
- Core promise: Analyze → Explain → Recommend → Virtually try → Purchase.
- Primary user: a beauty shopper uncertain about which product fits their visible skin concerns.
- Hackathon value: connect YouCam Skin AI to e-commerce recommendations and YouCam VTO in one short journey.

## Engineering decisions

- Prototype first; add infrastructure only when a working vertical slice needs it.
- Guest flow comes before Clerk authentication.
- Local/static product data comes before Supabase persistence.
- YouCam secrets stay in server-side environment variables.
- The browser must not call protected provider endpoints directly.
- Recommendation logic should be deterministic and explainable for the demo.

## Workflow

- Main build environment: GitHub Codespaces.
- Local laptop: browser, camera permissions, responsive checks, and demo rehearsal.
- OpenCode agents are used sequentially for edits; read-only research/review may be parallel.
- Every milestone must pass its smallest relevant validation before the next phase begins.

## Update rule

Add a dated entry only after verifying a decision in the codebase or official provider documentation:

```text
## YYYY-MM-DD — Short decision
- Decision:
- Evidence:
- Consequence:
```

## 2026-10-31 — Phase 1 demo shell

- Decision: The first user journey is a guest-first, six-step flow using typed local demo data: discover, capture, snapshot, matches, preview, and result.
- Evidence: `components/flow/DemoJourney.tsx`, `lib/mock/skin-snapshot.ts`, `lib/mock/catalog.ts`; `npm run typecheck` and `npm run build` pass.
- Consequence: Provider adapters remain deferred until official YouCam request and response behavior is verified.

## 2026-10-31 — Credential-free judge access

- Decision: The final submission must provide a clearly labeled recorded-response mode in addition to optional live provider mode.
- Evidence: `OFFICIAL_VERIFICATION.md` records the indexed Devpost judge-access guidance and its requirement to make the workflow testable without private credentials.
- Consequence: A real YouCam integration must be completed before creating sanitized fixtures; recorded results cannot be presented as fresh inference.

## 2026-10-31 — YouCam integration gate

- Decision: Do not guess the YouCam authorization header or task/result schema.
- Evidence: `YOUCAM_API_RESEARCH.md`; a metadata-only probe returned HTTP 401 for both direct and Bearer header candidates, without recording response secrets.
- Consequence: Confirm the generated official request and key status in the YouCam console before implementing provider code.

## 2026-10-31 — Successful Skin AI probe

- Decision: Use SD `acne`, `pore`, and `moisture` as the first live adapter scope; interpret `ui_score` only, where higher is better.
- Evidence: One controlled official skill request returned success with those three result types plus aggregate metadata; details are sanitized in `YOUCAM_API_RESEARCH.md`.
- Consequence: Keep provider output normalized to typed observations and retain recorded-response mode for judge access.

## 2026-10-31 — Recorded analysis boundary

- Decision: Route all browser analysis requests through `/api/skin-analysis`; default to a sanitized recorded response and never guess the live upload contract.
- Evidence: Production build and route smoke tests passed for a valid PNG and an invalid text upload; the browser receives no provider credential.
- Consequence: The next implementation step is the server-side YouCam upload/task adapter after the official request schema is verified, followed by mapping live scores into the existing recommendation model.

## 2026-10-31 — Verified result fixture

- Decision: Recorded mode uses only the sanitized live probe signals: acne 99, moisture 72, and pore 61.
- Evidence: The production route returned those scored observations after the fixture normalization; unsupported undertone and contrast claims were removed.
- Consequence: Recommendations currently use the verified moisture signal for comfortable lipstick textures; do not infer undertone or medical conclusions until a provider signal supports them.

## 2026-10-31 — Live adapter boundary

- Decision: Implement the YouCam file registration, upload, Skin AI task, polling, and score normalization in `lib/youcam/skin-analysis.ts`.
- Evidence: The implementation follows the installed official skill flow, includes the required JSON format, and keeps the Authorization value server-only; `npm run typecheck` passes.
- Consequence: Keep `GLOWCART_ANALYSIS_MODE=recorded` by default. Enable live mode only after a direct application probe succeeds with the configured generated-client `YOUCAM_AUTHORIZATION` value.

## 2026-10-31 — Adapter hardening

- Decision: Validate provider HTTPS URLs and upload targets, filter provider-supplied upload headers to string values, propagate request cancellation, and mark analysis responses `no-store`.
- Evidence: `lib/youcam/skin-analysis.ts` and `/api/skin-analysis` compile with strict TypeScript after the hardening pass.
- Consequence: Preserve this boundary when adding VTO: provider parsing belongs in isolated server adapters, and browser responses must remain normalized, cache-disabled, and secret-free.

## 2026-10-31 — Review-first stability pass

- Decision: Keep analysis requests cancellable with a bounded client budget, map live provider failures to fixed safe messages, and describe recorded/live data and shade preview behavior honestly.
- Evidence: OpenCode auditor reviewed the flow; timeout alignment, privacy copy, landing copy, and polling listener cleanup were corrected without changing the product scope.
- Consequence: Do not add VTO implementation until its provider contract is separately verified and reviewed.

## 2026-10-31 — Live deployment security rule

- Decision: Keep the public deployment recorded-only; run live Skin AI only on a separately protected deployment with hosting access control.
- Evidence: Security review found that any public live route caller could consume provider credits even though the provider credential remains server-side.
- Consequence: Do not add improvised application auth or expose a bearer token in the browser just to enable live mode.

## 2026-10-31 — Focused regression suite

- Decision: Use Node’s built-in test runner with `tsx` for small route, adapter, and recommendation tests; do not add a browser test framework yet.
- Evidence: `npm test` passes 21 tests covering recorded/live route behavior, upload rejection, request-size limits, malformed multipart, unknown modes, provider normalization, insecure upload targets, provider HTTP/task errors, cancellation, polling timeout, invalid provider scores, and deterministic recommendation ranking.
- Consequence: Any VTO adapter or differentiator must add focused tests for its server boundary before UI wiring; live provider availability is never required in CI.

## 2026-10-31 — Protected live-mode gate

- Decision: Live Skin AI requests fail closed unless the deployment explicitly sets `GLOWCART_LIVE_DEPLOYMENT=protected`; public deployments remain recorded-only.
- Evidence: `/api/skin-analysis` enforces the marker, and the focused suite passes 21 tests including the missing-marker case and invalid provider score cases.
- Consequence: Configure the marker only on a separately access-controlled preview/deployment after the direct provider application probe succeeds.

## 2026-10-31 — Explainable recommendation evidence

- Decision: Recommendations expose a typed three-part evidence trail: “We noticed,” “This product offers,” and “Starting point.”
- Evidence: `lib/recommendations.ts`, `components/flow/MatchesStep.tsx`, and the recommendation tests; all 21 tests, typecheck, and production build pass.
- Consequence: Future provider signals must be mapped to supported observation labels before appearing in this trail; do not infer medical or unsupported beauty claims.

## 2026-10-31 — Direct live application verification

- Decision: The GlowCart server-side Skin AI adapter is verified against the configured live application boundary.
- Evidence: A protected production probe returned HTTP 200 with sanitized live observations `pore` 61, `moisture` 72, and `acne` 99; `npm test` passes 22 tests and the production build passes.
- Consequence: Keep recorded mode public by default; live Skin AI and VTO are ready only for separately protected environments.

## 2026-10-31 — Lipstick VTO verification and integration

- Decision: Use the verified YouCam makeup VTO contract for the selected catalog
  shade, while keeping credentials and provider calls server-side.
- Evidence: A controlled `Sun Coral` probe succeeded; the adapter tests cover
  signed upload header isolation, exact lipstick payload construction, polling,
  and insecure result URL rejection.
- Consequence: Keep `/api/virtual-try-on` behind
  `GLOWCART_LIVE_DEPLOYMENT=protected`, return no-store temporary HTTPS results,
  and do not spend provider units from the public recorded deployment.

## 2026-11-01 — Session-only recommendation personalization

- Decision: Ask for finish and occasion after the Skin AI snapshot and use both
  choices as deterministic ranking signals.
- Evidence: `lib/recommendations.ts`, `components/flow/SnapshotStep.tsx`, and
  the recommendation tests; the local suite passes 27 tests.
- Consequence: Recommendations can vary meaningfully without authentication,
  persistence, a database, or additional YouCam credits.

## 2026-11-01 — Recorded VTO safety fallback
- Decision: Recorded analysis never calls YouCam VTO; it presents a clearly
  labeled selfie-and-swatch shade simulation instead.
- Evidence: `DemoJourney`, `TryOnStep`, and the journey reducer route recorded
  selections to `vtoRecordedReady`; focused tests, typecheck, and production
  build pass.
- Consequence: Keep the public deployment recorded-only while preserving the
  protected live VTO path for configured deployments.
