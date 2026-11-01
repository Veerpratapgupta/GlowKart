# Copilot Execution Prompt

Copy everything inside the block below into Copilot.

```text
You are the implementation agent for the GlowCart hackathon project.

Before doing anything, read these files in this order:
1. AGENTS.md
2. FEATURES.md
3. SKILLS.md
4. REMEMBER.md
5. HANDOFF.md

HANDOFF.md is the source of truth for the findings, locked decisions, P0/P1 fixes, asset plan, acceptance criteria, and phase prompts. Do not reinterpret or skip it.

## Objective

Complete the GlowCart demo for the YouCam API Skin AI & eCommerce VTO Hackathon. The target journey is:
selfie -> YouCam Skin AI snapshot -> skin-aware lip recommendation with a visible score-to-finish rationale -> real YouCam lip VTO -> before/after result -> prototype cart.

## Locked decisions — do not change

1. The public Vercel deployment uses recorded mode:
   - GLOWCART_ANALYSIS_MODE=recorded
   - No YOUCAM_AUTHORIZATION on Vercel.
   - No live YouCam calls from the public app.
2. Live mode runs locally for asset generation and the demo video.
3. Use the Pexels 8789240 stock demo face only. Never use the user's face in the repo or video.
4. Label the stock face: "Demo face · stock photo · not a customer or endorser."
5. Commit and push at Phase 0 and at the final phase. Make the repo public only at Phase 7, after the final secret scan.
6. Do not add dependencies, auth, payments, a database, or external services.
7. Keep the cart as a prototype; do not add checkout.

## Non-negotiable safety rules

- Never print, commit, log, screenshot, or expose .env.local, YOUCAM_AUTHORIZATION, or any API key.
- Never put a YouCam key in browser code.
- Keep all YouCam calls server-side.
- Do not commit .env.local, .next, node_modules, or generated files containing secrets.
- Do not fake a VTO with a CSS overlay for the public demo. The recorded public demo must use real recorded YouCam VTO images.
- Do not claim recorded results are live or personalized.
- Do not imply the stock model is a customer or endorser.
- If you find a real secret in git history, stop immediately and report it. Do not make the repo public.

## Execution protocol

Work in the phase order defined in HANDOFF.md:

- Phase 0: checkpoint, baseline validation, secret scan, commit, push private.
- Phase 1: P0 correctness — VTO finish mapping, image downscaling, timeouts/maxDuration, Turbopack root.
- Phase 2: recorded VTO route + real recorded previews + result before/after.
- Phase 3: skin-score-driven recommendation bridge + "Use demo photo" CTA.
- Phase 4: stock face, credits, recorded Skin AI fixture, three recorded VTO images.
- Phase 5: Vercel recorded deployment and end-to-end verification.
- Phase 6: docs, LICENSE, SUBMISSION.md, screenshots.
- Phase 7: live-mode video script, final secret scan, final commit/push, make repo public, submit.

For each phase:
1. State the phase you are executing.
2. Make only the changes required by that phase.
3. Run the relevant focused tests plus:
   npm run typecheck
   npm test
   npm run build
4. If the phase passes, report in the AGENTS.md format and continue to the next phase.
5. If the phase fails or is blocked, stop and report the exact blocker. Do not silently skip, stub, or fake the missing behavior.

Report format:

Status: complete | blocked
Changed:
- path/to/file: short reason
Validated:
- command: result
Limitations:
- none, or a concrete follow-up

## Phase-specific reminders

Phase 1:
- lib/youcam/virtual-try-on.ts currently hardcodes texture: "matte" and colorIntensity: 100. Map sheer, satin, and matte correctly and update tests.
- components/flow/DemoJourney.tsx currently crops small images and upscales them. Replace with downscale-only processing: max 1600px, target ≤3.5MB, never upscale.
- Add export const maxDuration = 60 to both API routes. Add adapter deadlines: 45s analysis, 50s VTO. Shorten client timeouts to 50s analysis and 55s VTO.
- Add turbopack.root to next.config.ts to remove the workspace-root warning.

Phase 2:
- app/api/virtual-try-on/route.ts currently returns 503 in recorded mode. Read GLOWCART_ANALYSIS_MODE; recorded mode returns local /demo/vto-*.jpg assets without calling YouCam.
- DemoJourney.handleSelectProduct currently bypasses VTO when analysis.source === "recorded". Remove that bypass and always call the route.
- Carry mode and resultUrl through VirtualTryOnResponse, JourneyAction, journeyReducer, and DemoJourney.
- ResultStep must show a before/after hero, the recorded/live badge, the stock-photo notice, and an AI trail.
- TryOnStep must disable "Keep this shade" while loading or errored, and reset previewReady when the product or result changes.

Phase 3:
- All three products currently target only moisture. Update targetConcernIds and rank by acne, pore, and moisture scores plus finish fit.
- Return all three products; never return an empty recommendation list.
- Add a one-line "Skin AI -> finish" bridge in MatchesStep.
- Add "Use demo photo" to CaptureStep in both modes, with the stock-photo notice.

Phase 4:
- Download public/demo/demo-selfie.jpg from Pexels 8789240.
- Add public/demo/CREDITS.md with the Pexels source, license, and non-endorsement notice.
- Use the existing live adapters with node --env-file=.env.local --import tsx. Never print or hardcode the key.
- Download each VTO result URL immediately; YouCam result URLs expire.
- Generate all three: public/demo/vto-sun-coral.jpg, vto-soft-berry.jpg, vto-peach-nude.jpg.
- Inspect every generated image. If a shade fails, retry once, then report the limitation.

Phase 5:
- Deploy recorded mode to Vercel.
- Set only GLOWCART_ANALYSIS_MODE=recorded.
- Do not set YOUCAM_AUTHORIZATION or GLOWCART_LIVE_DEPLOYMENT on the public project.
- Verify the full journey on desktop and mobile. Confirm /api/virtual-try-on returns recorded assets and no 503.
- Confirm the public app makes no YouCam calls.

Phase 6:
- Update stale documentation: README, ARCHITECTURE, FEATURES, PRODUCT_SPEC, UX_SPEC, REMEMBER.
- Add LICENSE (MIT for code) and keep the Pexels asset exception in public/demo/CREDITS.md.
- Add SUBMISSION.md with public URL, repo URL, APIs used, exact judge path, live-vs-recorded explanation, privacy note, credits, and limitations.
- Capture the listed screenshots into docs/screenshots/ at 1440x900 and 390x844.

Phase 7:
- Prepare the 2-minute video script and shot list. Record live mode with the stock demo face; no presenter face or webcam.
- Run the final secret scan.
- Commit and push.
- Make the repo public only if the scan is clean:
  gh repo edit Veerpratapgupta/GlowKart --visibility public --accept-visibility-change-consequences
- If public is not possible, share the private repo with contact_event@PerfectCorp.com.
- Report final URLs and anything that still needs the human owner.

## Definition of done

The task is complete only when:
- The recorded public journey works end to end on mobile and desktop.
- All three products show real recorded YouCam VTO images.
- The result page has before/after, scores, rationale, AI trail, and YouCam branding.
- Recommendations visibly react to skin scores.
- Validation passes: npm run typecheck, npm test, npm run build.
- No secrets are exposed.
- The public deployment has no YouCam key and makes no live YouCam calls.
- Docs, screenshots, video, and submission copy are ready.
- The repo is public or shared with contact_event@PerfectCorp.com.

Start with Phase 0 now. Do not proceed to Phase 1 until the Phase 0 report is complete and validations pass.
```
