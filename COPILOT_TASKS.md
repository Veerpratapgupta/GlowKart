# Copilot next tasks

Phase 4 is already in progress in the working tree. Do not edit, revert, or regenerate:

- `public/demo/demo-selfie.jpg`
- `public/demo/vto-sun-coral.jpg`
- `public/demo/vto-soft-berry.jpg`
- `public/demo/vto-peach-nude.jpg`
- `public/demo/CREDITS.md`
- `lib/mock/skin-snapshot.ts`

The recorded fixture now uses the real stock-face result: acne **92**, pore **80**, moisture **78**. The stock face is Pexels **8789224**; YouCam rejected 8789240 for face size/angle. Ignore the older 8789240 instruction in `COPILOT_PROMPT.md`.

Work one task at a time. Do not commit. Report using the `AGENTS.md` format.

---

## Task 1 — Fix recommendation integrity (start now)

Copy this prompt into Copilot:

```text
You are the implementation agent for GlowCart. Before editing, read AGENTS.md, FEATURES.md, SKILLS.md, REMEMBER.md, HANDOFF.md, lib/recommendations.ts, components/flow/SnapshotStep.tsx, components/flow/MatchesStep.tsx, and test/recommendations.test.ts.

Implement only the Phase 3 recommendation-integrity fix.

Observed defects:
1. With the demo snapshot, changing finish or occasion does not change the product order or primary. Every combination returns Sun Coral, Soft Berry, Peach Nude.
2. `occasion` is not used in ranking at all.
3. Explicit finish is worth only +1, while the skin-derived leading finish is worth +2, so a requested satin finish can lose to a sheer product.
4. Alternative reasons are false. Example: with the default sheer preference, selecting satin Soft Berry produces “we favored a sheer finish, while this satin option reflects your sheer preference.”
5. `test/recommendations.test.ts` has a test named “preferences change the deterministic ranking and explanation” that asserts the exact same order as the default case. It is testing wording, not ranking.

Required behavior:
- Finish and occasion must meaningfully affect ranking.
- `sheer` + `everyday` must lead with Sun Coral.
- `satin` + `bold` must lead with Soft Berry.
- `satin` + `everyday` must lead with a satin product when one is available; Soft Berry is acceptable.
- `matte` has no catalog product. Fall back to the closest available option and say truthfully that no matte product is available; never claim a matte match.
- A reason may claim a preference match only when the product actually has that finish/occasion. For an alternative, say it is a different finish/occasion option, not that it “reflects” a preference it does not have.
- Keep the Skin AI scores visible in the rationale. Do not remove the skin-aware bridge.
- Return all three products, one primary, deterministic order. Never return an empty list.
- Suggested weighting, if useful: matched concern * 3, explicit finish match +4, occasion match +2, skin-derived leading finish +2, secondary +1. Adjust only if the acceptance cases require it.
- Use typed data, no `any`, no new dependencies, no comments, and no unrelated refactors.

Tests:
- Replace or rename the misleading preference test.
- Add deterministic tests for `sheer/everyday`, `satin/bold`, `satin/everyday`, and unavailable `matte`.
- Assert the primary/order changes where required.
- Assert an alternative reason never falsely claims the selected preference.
- Use inline `SkinSnapshot` fixtures; do not import or edit `lib/mock/skin-snapshot.ts`.

Allowed files:
- `lib/recommendations.ts`
- `test/recommendations.test.ts`
- `components/flow/SnapshotStep.tsx` only if its “These choices change the order of your matches” copy becomes inaccurate. Do not change UI structure.

Do not touch:
- `public/demo/**`
- `lib/mock/skin-snapshot.ts`
- `lib/mock/recorded-vto.ts`
- `lib/youcam/**`
- `app/api/**`
- `components/flow/CaptureStep.tsx`
- `components/flow/DemoJourney.tsx`

Validate:
- `npm run typecheck`
- `npm test`
- `git diff --check`

Do not commit. Report changed files, exact test result, and any behavior you had to compromise.
```

---

## Task 2 — Fix TimeoutError classification (after Task 1)

Copy this prompt into Copilot:

```text
You are the implementation agent for GlowCart. Before editing, read AGENTS.md, HANDOFF.md, lib/analysis-errors.ts, lib/youcam/virtual-try-on.ts, lib/youcam/skin-analysis.ts, app/api/virtual-try-on/route.ts, app/api/skin-analysis/route.ts, and the related route/adapter tests.

Implement only the timeout-classification fix.

Confirmed defect:
- `AbortSignal.timeout()` throws a `DOMException` named `TimeoutError`.
- Adapters and API routes only recognize `AbortError`, so real provider timeouts become 503 “temporarily unavailable” instead of 504 “took too long.”
- Isolated route probe with `GLOWCART_LIVE_DEPLOYMENT=protected` and a mocked `new DOMException("timed out", "TimeoutError")` returned 503.

Required behavior:
- Treat both `AbortError` and `TimeoutError` as timeouts where appropriate.
- Route-level provider timeouts must return 504 with the existing user-safe timeout message.
- Client-side `getAnalysisErrorMessage` and `getVtoErrorMessage` must classify `TimeoutError` as a timeout.
- In `providerFetch`, distinguish a parent/caller abort from a provider deadline timeout. Do not label every abort as a provider timeout. Preserve the caller’s abort reason when the parent signal is the cause.
- Do not change normal validation, provider payloads, recorded-mode behavior, or UI copy.

Tests:
- Add a route test mocking a `TimeoutError` and assert 504 plus the timeout message.
- Add coverage for the client error helpers.
- Add adapter-level coverage if the existing test harness supports it.
- Keep all existing tests passing.

Allowed files:
- `lib/analysis-errors.ts`
- `lib/youcam/virtual-try-on.ts`
- `lib/youcam/skin-analysis.ts`
- `app/api/virtual-try-on/route.ts`
- `app/api/skin-analysis/route.ts`
- `test/virtual-try-on-route.test.ts`
- `test/skin-analysis-route.test.ts`
- `test/analysis-errors.test.ts` if it already exists or is needed
- `test/youcam-virtual-try-on.test.ts`
- `test/youcam-skin-analysis.test.ts`

Do not touch:
- `public/demo/**`
- `lib/mock/skin-snapshot.ts`
- `lib/mock/recorded-vto.ts`
- `lib/recommendations.ts`
- `test/recommendations.test.ts`
- `components/**`

Validate:
- `npm run typecheck`
- `npm test`
- `git diff --check`

Do not commit. Report changed files, the exact timeout test result, and any remaining limitation.
```

---

## Task 3 — Recorded-mode regression coverage and label honesty (after Task 2)

Copy this prompt into Copilot:

```text
You are the implementation agent for GlowCart. Before editing, read AGENTS.md, HANDOFF.md, app/api/skin-analysis/route.ts, app/api/virtual-try-on/route.ts, lib/mock/recorded-analysis.ts, lib/mock/recorded-vto.ts, lib/mock/skin-snapshot.ts, components/flow/CaptureStep.tsx, components/flow/ResultStep.tsx, and the existing route/journey tests.

Implement only the recorded-mode regression and disclosure-copy task.

Required behavior:
- Recorded Skin AI returns `mode: "recorded"` and the fixture from `demoSkinSnapshot` without calling YouCam or requiring provider env vars.
- Recorded VTO returns the correct `/demo/vto-*.jpg` URL for each product without calling YouCam or requiring provider env vars.
- The recorded demo face URL is `/demo/demo-selfie.jpg`.
- All four referenced demo image files exist in `public/demo/` and are non-empty JPEGs.
- The stock-face disclosure uses the locked wording: “Demo face · stock photo · not a customer or endorser.” Update only the label/copy if it differs.
- The recorded result still says the preview is not a fresh render of the visitor’s photo.

Tests:
- Add recorded-route tests for all three product IDs.
- Assert no fetch/provider call happens in recorded mode.
- Assert the four public asset paths exist.
- Keep the tests independent of Copilot’s uncommitted fixture values; assert stable IDs/source/mode, not a hardcoded score unless necessary.
- Do not use the network.

Allowed files:
- `test/skin-analysis-route.test.ts`
- `test/virtual-try-on-route.test.ts`
- `test/journey.test.ts`
- `components/flow/CaptureStep.tsx` only for the exact disclosure label

Do not touch:
- `public/demo/**`
- `lib/mock/skin-snapshot.ts`
- `lib/mock/recorded-vto.ts`
- `lib/recommendations.ts`
- `test/recommendations.test.ts`
- `lib/youcam/**`
- `app/api/**` unless a test exposes a real bug; report it before changing.

Validate:
- `npm run typecheck`
- `npm test`
- `git diff --check`

Do not commit. Report changed files, the recorded-mode test result, and any spec mismatch.
```

---

## Dependency and ownership notes

- Task 1 and Task 2 touch different files and can be done in sequence without overlapping Phase 4.
- Task 3 touches test files that Task 2 may also touch; run it after Task 2.
- Copilot must not commit or push.
- The Phase 4 owner keeps `public/demo/**` and `lib/mock/skin-snapshot.ts`.
- After Tasks 1–3, the next work is Phase 5 deployment, Phase 6 docs/screenshots, and the live-mode video; those need a public URL and are not ready yet.
