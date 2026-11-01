# GlowCart Hackathon Handoff — Findings, Decisions, Plan, and Copilot Prompts

> Audience: implementation agent (Copilot).
> Read `AGENTS.md`, `FEATURES.md`, `SKILLS.md`, and `REMEMBER.md` first.
> Do not print, commit, or expose `.env.local` or `YOUCAM_AUTHORIZATION`.
> Work in the phase order below. Run the validation commands after each phase.

## 1. Objective

Ship a polished, judge-ready GlowCart demo for the YouCam API Skin AI & eCommerce VTO Hackathon.

Target story:

1. Upload a selfie.
2. Get a YouCam Skin AI snapshot.
3. See lip products recommended with a visible skin-score → finish rationale.
4. Preview a real YouCam lip VTO.
5. Keep a shade and see it in a before/after result with a prototype cart.

Equal-weight judging criteria:

- Technological implementation
- Design
- Potential impact
- Quality of idea

Submission needs:

- Working public app URL
- Public code repo
- 1–3 minute demo video
- Screenshots
- Text description
- Judge testing path without credentials

Official deadline: **Nov 2, 2026, 11:45 a.m. ET / 9:15 p.m. IST**.

## 2. Locked Decisions

These are settled; do not re-litigate them.

1. **Public deployment uses recorded mode.**
   - `GLOWCART_ANALYSIS_MODE=recorded`
   - No `YOUCAM_AUTHORIZATION` on Vercel.
   - Public judges get one reliable, complete journey with no API cost or timeout risk.

2. **Live mode is used locally for asset generation and the demo video.**
   - `.env.local` already has live mode and a working key.
   - Use live mode to generate the recorded fixture and the three recorded VTO images.
   - Record the video in live mode so the integration is visibly real.

3. **Use a stock demo face, never the user's face.**
   - Primary: Pexels photo **8789240 “Portrait of Brunette Asian Woman”** by Darina Belonogova.
   - Source: `https://www.pexels.com/photo/portrait-of-brunette-asian-woman-8789240/`
   - Download URL:

     ```bash
     curl -L -o public/demo/demo-selfie.jpg \
       "https://images.pexels.com/photos/8789240/pexels-photo-8789240.jpeg?auto=compress&cs=tinysrgb&w=1200"
     ```

   - Fallbacks: Pexels `8789218` (“Pretty Woman in White Blouse”) and `8789224`.
   - Pexels license: free to use and modify; attribution not required; do not imply endorsement; do not sell unaltered copies; do not redistribute on stock platforms.
   - Label prominently: **“Demo face · stock photo · not a customer or endorser.”**
   - Add credit in `public/demo/CREDITS.md`.

4. **Commit, push, and make the repo public — after a secret scan.**
   - Repo: `Veerpratapgupta/GlowKart` (currently private).
   - Current uncommitted work must be checkpointed before new changes.
   - Make public only after the final secret scan and final validation.

5. **Timebox: 4–6 hours.**
   - Prioritize the recorded public journey and the video over extra features.

## 3. Current State (verified)

- Baseline is green:
  - `npm run typecheck` passes.
  - `npm test` passes, 27/27.
  - `npm run build` passes (Next.js 16.4.3 / Turbopack).
- Build warning: Next infers a workspace root outside the repo because `/home/veer/package-lock.json` exists. Fix in `next.config.ts` with `turbopack.root`.
- Git: last commit `bad0ac9` (“Add official YouCam skill and MCP workflow”), 26 files uncommitted, 67 tracked files, repo private.
- `.env.local`:
  - `GLOWCART_ANALYSIS_MODE=live`
  - `GLOWCART_LIVE_DEPLOYMENT=protected`
  - `YOUCAM_AUTHORIZATION` present (length 74; never print it).
  - `.env.local` is gitignored; no secrets are currently tracked.
- Tooling: Node 24.22.0, npm 11.19.1, `tsx` 4.20.6 devDependency, `curl`, `jq`, `ffmpeg`. No ImageMagick. No `vercel` CLI.
- YouCam MCP tools return 401 (`InvalidAccessToken` / `InvalidApiKey`). Do not rely on MCP. Use the app's existing adapters with `.env.local`.
- No `public/` directory, no `LICENSE`, no submission assets, no screenshots, no video yet.
- Current app behavior:
  - Recorded Skin AI works.
  - Recorded VTO does **not** call YouCam; `DemoJourney.handleSelectProduct` dispatches `vtoRecordedReady`, and `TryOnStep` shows the selfie with a swatch tint overlay.
  - Live VTO works locally only when `GLOWCART_LIVE_DEPLOYMENT=protected`.
  - `app/api/virtual-try-on/route.ts` returns **503** in recorded mode because it only checks the live gate.
  - `ResultStep` never receives `vtoResultUrl`, so the final result has no before/after.

## 4. P0 Findings — Fix Before Polish

### P0.1 VTO ignores product finish

- `lib/youcam/virtual-try-on.ts:168-169` hardcodes:

  ```ts
  texture: "matte",
  colorIntensity: 100,
  ```

- Every product is rendered as full matte, regardless of `product.finish` (`sheer`, `satin`, `matte`).
- Tests currently assert matte, so they encode the bug.

Fix:

```ts
function lipEffectFor(product: Product) {
  switch (product.finish) {
    case "sheer":
      return {
        texture: "sheer" as const,
        colorIntensity: 60,
        transparencyIntensity: 35,
      };
    case "satin":
      return { texture: "satin" as const, colorIntensity: 78 };
    case "matte":
      return { texture: "matte" as const, colorIntensity: 90 };
  }
}
```

Use this in the VTO payload. Keep `shape: { name: "original" }` and `style: { type: "full" }`.
Update `test/youcam-virtual-try-on.test.ts` to assert all three mappings.

### P0.2 Recorded VTO is a dead end

- `app/api/virtual-try-on/route.ts:35` only checks `GLOWCART_LIVE_DEPLOYMENT`; recorded mode gets a 503.
- `components/flow/DemoJourney.tsx:347-353` bypasses the route when `analysis.source === "recorded"`.
- `journey.ts` has `vtoRecordedReady` but it sets `vtoResultUrl: null`.

Fix:

- Add `lib/mock/recorded-vto.ts`:

  ```ts
  export const recordedVtoResults = {
    "sun-coral-balm": "/demo/vto-sun-coral.jpg",
    "soft-berry-tint": "/demo/vto-soft-berry.jpg",
    "peach-nude-cream": "/demo/vto-peach-nude.jpg",
  } as const;

  export const demoFaceUrl = "/demo/demo-selfie.jpg";
  ```

- `app/api/virtual-try-on/route.ts`:
  - Read `const mode = process.env.GLOWCART_ANALYSIS_MODE ?? "recorded";`
  - If `mode === "recorded"`: validate image/product, return:

    ```json
    {
      "mode": "recorded",
      "resultUrl": "/demo/vto-sun-coral.jpg",
      "demoFaceUrl": "/demo/demo-selfie.jpg"
    }
    ```

    with `Cache-Control: no-store`.
  - If `mode === "live"`: keep the existing protected gate and `createLipstickVto` call.
  - Invalid mode: 500 with a safe error.
- `VirtualTryOnResponse` in `lib/types.ts`:

  ```ts
  export interface VirtualTryOnResponse {
    mode: "recorded" | "live";
    resultUrl: string;
    demoFaceUrl?: string;
  }
  ```

- `DemoJourney.handleSelectProduct`: remove the recorded bypass; always call `requestVto(product)`.
- `requestVto`: parse `mode` from the response and dispatch one action:

  ```ts
  dispatch({ type: "vtoReady", resultUrl, source: mode });
  ```

- Change `JourneyAction` `vtoReady` to include `source: VtoSource`; update the reducer.
- Remove or stop using `vtoRecordedReady`.
- Keep the swatch-overlay render only as a visible fallback if a recorded asset is missing; the main path must use the recorded VTO image.

### P0.3 Image pipeline makes small images worse

- `components/flow/DemoJourney.tsx:26-78`:
  - Crops 70% when the longest side is under 640px.
  - Upscales to 640px.
  - Returns the original if it is already ≥640px, even if it is 8MB.
- YouCam expects a usable face image; cropping/upscaling tiny images damages quality.
- Vercel request body limit is about 4.5MB; the current 8MB server cap can allow requests Vercel rejects.

Fix:

- Replace `normalizeAnalysisImage` with a downscale-only converter:
  - Load with `createImageBitmap(file, { imageOrientation: "from-image" })`; fall back to `<img>`.
  - Target longest side **1600px**.
  - Never upscale.
  - If longest side ≤1600 and `file.size ≤ 3.2MB`, return the original.
  - Otherwise draw to canvas at the scaled size, export JPEG quality `0.85`.
  - If still >3.5MB, retry at 1280px / `0.8`.
  - If still >3.5MB, reject with a safe error.
- Keep server `MAX_SELFIE_BYTES = 8MB` as the absolute guard, but the client should stay under ~3.5MB.
- Remove the 70% crop and the 640px upscale behavior.
- Add a pure helper for dimensions so it can be unit tested without a DOM.

### P0.4 Timeouts exceed Vercel limits

- Client analysis timeout is `420_000ms` (`DemoJourney.tsx:164`).
- VTO adapter: `MAX_POLLS=20`, `POLL_INTERVAL_MS=3000`, plus a 120s create request. Worst case is far beyond 60s.
- No `maxDuration` export in either API route.

Fix:

- Add `export const maxDuration = 60;` to:
  - `app/api/skin-analysis/route.ts`
  - `app/api/virtual-try-on/route.ts`
- Add an overall deadline inside each adapter:
  - Skin analysis: `45_000ms`
  - VTO: `50_000ms`
  - Before each request/poll, compute remaining time; abort with a typed timeout error when exhausted.
  - Use the remaining budget for per-request signals (`Math.min(20_000, remaining)`).
- Client timeouts:
  - Analysis: `50_000ms`
  - VTO: `55_000ms`
  - Show the existing timeout message from `lib/analysis-errors.ts`; add a VTO equivalent.
- Ensure `AbortError` maps to a user-safe 504/timeout message, not a generic 503.

### P0.5 Result page has no VTO before/after

- `components/flow/ResultStep.tsx` props do not include `vtoResultUrl` or `vtoSource`.
- `DemoJourney` does not pass them.

Fix:

- Add to `ResultStepProps`:

  ```ts
  vtoResultUrl: string | null;
  vtoSource: VtoSource | null;
  beforeImageUrl: string | null;
  analysis: SkinSnapshot | null;
  ```

- Pass from `DemoJourney`: `state.vtoResultUrl`, `state.vtoSource`, `state.selfieUrl`, `state.analysis`.
- Add a before/after hero at the top:
  - Before: `beforeImageUrl` or `/demo/demo-selfie.jpg` in recorded mode.
  - After: `vtoResultUrl` if present; otherwise show a clear “VTO unavailable” note.
  - Label: “Before” / “YouCam VTO preview”.
  - In recorded mode: “Recorded YouCam VTO · demo face”.
  - Stock-photo notice: “Demo face · stock photo · not a customer or endorser.”
- Add an “AI trail” details panel:
  - Skin AI scores used.
  - Recommendation rationale.
  - VTO mode (`live` or `recorded`).
  - “Powered by YouCam Skin AI + Makeup VTO”.
- Keep the existing product/cart sections; do not remove the prototype-cart copy.

### P0.6 Try-on action gating and labels

- `TryOnStep` uses `previewReady`, but it can stay true while a new shade loads because it is not reset on product change.
- Recorded mode currently renders a swatch overlay, not a real VTO.
- Badge says “Recorded shade simulation”; it should say it is a recorded YouCam VTO on a demo face.

Fix:

- Reset `previewReady` when `product.id`, `vtoResultUrl`, or `vtoPhase` changes.
- Disable “Keep this shade” while `vtoPhase === "loading"` or `"error"`.
- Show a loading overlay and a retry action on error.
- Badge:
  - Live: “Live YouCam VTO”
  - Recorded: “Recorded YouCam VTO · demo face”
- Show `vtoResultUrl` for recorded mode; use the swatch overlay only as a fallback if the asset is missing.
- Add the stock-photo notice under the preview.

## 5. P1 Findings — Winning Polish

### P1.1 Recommendations ignore acne and pores

- `lib/mock/catalog.ts`: all three products target only `["moisture"]`.
- `lib/recommendations.ts` filters to products with at least one match and sorts by match count. With all products at one match, the order is catalog order.
- The current fixture has acne 99, moisture 72, pore 61. The recommendation does not react to the two most visible signals.

Fix:

- Update `targetConcernIds`:
  - `sun-coral-balm`: `["moisture", "acne"]`
  - `soft-berry-tint`: `["pore", "moisture"]`
  - `peach-nude-cream`: `["pore", "acne"]`
- Add a deterministic finish preference:

  ```ts
  function preferredFinishes(snapshot: SkinSnapshot): FinishPreference[] {
    const score = (id: ConcernId) =>
      snapshot.observations.find((o) => o.id === id)?.uiScore ?? 50;
    const acne = score("acne");
    const pore = score("pore");
    const moisture = score("moisture");

    if (acne >= 85 || pore >= 70) return ["sheer", "satin", "matte"];
    if (moisture < 65) return ["satin", "sheer", "matte"];
    if (pore < 70) return ["satin", "matte", "sheer"];
    return ["satin", "sheer", "matte"];
  }
  ```

  Interpret these as “clear-looking skin / visible texture” signals, not diagnoses. The point is to show that the finish recommendation is driven by the scores.
- Score each product:
  - `concernFit = matched.length * 3`
  - `finishFit = product.finish === preferred[0] ? 2 : product.finish === preferred[1] ? 1 : 0`
  - `preferenceFit = product.finish === preferences.finish ? 1 : 0`
  - Sort by `concernFit + finishFit + preferenceFit`, then by catalog order.
- Return all three products; do not filter to an empty list.
- Reason copy: include the top two scores and the finish decision, e.g.
  “Your acne signal is 99/100 and pore texture is 61/100, so we started with a sheer, comfortable balm instead of a heavy matte.”
- Update `test/recommendations.test.ts`:
  - High acne → sheer product ranks first.
  - High pore / lower acne → satin product ranks first.
  - All products still returned.
- Add a short bridge line in `MatchesStep` above the cards:
  “Skin AI → finish: [score summary]. We led with [finish].”
  Keep it one or two lines; do not add a new screen.

### P1.2 Recorded mode honesty

- The public demo must never imply the uploaded judge photo was analyzed.
- In recorded mode, after capture show:
  “This public demo replays a recorded YouCam result from our demo face. Your uploaded photo is not analyzed in recorded mode.”
- In live mode show:
  “Live YouCam call · your photo is sent for analysis and not stored by this prototype.”
- Keep the disclaimer “Beauty guidance, not a medical diagnosis.”

### P1.3 Sample-photo CTA

- Add a “Use demo photo” button to `CaptureStep`.
- It must be available in both modes:
  - Recorded: it triggers the recorded journey.
  - Live: it triggers a real live call on the stock photo. This is what the video will use.
- Implementation:
  - Fetch `/demo/demo-selfie.jpg`, convert to a `File`, call `onFileAccepted(file)`.
  - Show a small label: “Stock demo photo · not a customer or endorser.”
  - Handle fetch failure with a safe error.
- Do not use the camera or the user's face for the demo.

### P1.4 Branding and visual polish

- Add “Powered by YouCam Skin AI + Makeup VTO” to the landing/footer and result page.
- Add compact score bars for acne, pore, moisture in `SnapshotStep` if not already clear.
- Make the before/after the visual hero of `ResultStep`.
- Use the existing design system; do not add a UI library.
- Mobile-first: test at 390×844 and 1440×900.
- Add `app/error.tsx` with a friendly retry, if missing.

### P1.5 Documentation truth

Update stale claims:

- `README.md`: remove Phase 0 language; add live URL, video, screenshots, judge path, live vs recorded, YouCam APIs, privacy, credits, license.
- `ARCHITECTURE.md`: VTO is implemented, not deferred.
- `FEATURES.md`: mark shipped vs recorded-only.
- `PRODUCT_SPEC.md` / `UX_SPEC.md`: remove “blocked” statuses.
- `REMEMBER.md`: record the locked decisions (recorded public mode, stock demo face, live video).
- Replace “purchase” language with “prototype cart / no checkout.”
- Add explicit limitation: public demo uses recorded outputs; live mode is local/video-only.

## 6. Asset Plan

### 6.1 Stock face

```bash
mkdir -p public/demo
curl -L -o public/demo/demo-selfie.jpg \
  "https://images.pexels.com/photos/8789240/pexels-photo-8789240.jpeg?auto=compress&cs=tinysrgb&w=1200"
file public/demo/demo-selfie.jpg
```

- Visually inspect. The face must be front-facing, well lit, and unobstructed.
- If YouCam rejects it, try `8789218` or `8789224`.
- Add `public/demo/CREDITS.md`:

  ```md
  # Demo Assets

  Demo face: “Portrait of Brunette Asian Woman” by Darina Belonogova.
  Source: https://www.pexels.com/photo/portrait-of-brunette-asian-woman-8789240/
  License: Pexels License — https://www.pexels.com/license/
  This person is not a customer, employee, or endorser of GlowCart.
  ```

### 6.2 Recorded Skin AI fixture

- Run the existing live adapter against the stock face:

  ```bash
  node --env-file=.env.local --import tsx scripts/generate-demo-assets.ts
  ```

- Create `scripts/generate-demo-assets.ts` that:
  - Reads `public/demo/demo-selfie.jpg` as a `File`.
  - Calls `analyzeSkin(file)`.
  - Prints the snapshot JSON (never the key).
  - Updates `lib/mock/skin-snapshot.ts` values manually from the output.
- Keep the existing schema (`source: "recorded"`, disclaimer, observations).
- Update the detail copy to say “recorded demo face” rather than “your score.”
- Current fixture values are acne 99, moisture 72, pore 61; replace them with the real stock-face result if it differs.
- Do not add masks or new fields unless the UI needs them.

### 6.3 Three recorded VTO images

- After P0.1 is fixed, use the same script or a second script:
  - For each product, call `createLipstickVto(file, product)`.
  - Download `resultUrl` immediately; YouCam result URLs expire.
  - Write:
    - `public/demo/vto-sun-coral.jpg`
    - `public/demo/vto-soft-berry.jpg`
    - `public/demo/vto-peach-nude.jpg`
  - Inspect each image. The lips must be visible and the face must match the source.
- If a shade fails, retry once; if it still fails, use the best available shade and document the limitation. Do not fake a VTO with a CSS overlay for the public demo.
- Do not commit the generation script if it contains any secret. A script that reads `process.env` is fine; never hardcode the key.
- Check unit balance first. MCP is 401; use the YouCam dashboard or a signed-in browser.

### 6.4 Source image sizing

- The Pexels image is 2:3 portrait. Keep it around 1200px wide for the repo.
- VTO output will preserve the source aspect ratio. Use `object-cover` in a 4:5 frame.
- Keep each recorded JPEG under ~500KB if possible; total repo assets should stay small.

## 7. Implementation Order

### Phase 0 — Checkpoint (15 min)

1. Run `npm run typecheck && npm test && npm run build`.
2. Secret scan:

   ```bash
   git grep -nE 'YOUCAM_AUTHORIZATION|Bearer [A-Za-z0-9+/=]{20,}|sk-[A-Za-z0-9]{20,}|api[_-]?key' -- . ':!package-lock.json'
   git log -p --all -S 'YOUCAM_AUTHORIZATION' --oneline
   git check-ignore -v .env.local
   git status --short
   ```

   Inspect every hit. Do not print secret values. If a real key is in history, stop and rotate it before making the repo public.
3. Commit the current work:

   ```bash
   git add -A
   git commit -m "Checkpoint working MVP before judge-mode polish"
   ```

4. Push to the private repo. Do not make it public yet.

### Phase 1 — P0 correctness (45 min)

1. Fix VTO finish mapping + tests.
2. Replace image normalization with downscale-only + tests for dimension helper.
3. Add deadlines, `maxDuration`, shorter client timeouts, and timeout messages.
4. Add `turbopack.root` to `next.config.ts`.
5. Run typecheck + focused tests.

### Phase 2 — Recorded VTO + result before/after (45 min)

1. Add `lib/mock/recorded-vto.ts`.
2. Update the VTO route for recorded/live modes.
3. Update `VirtualTryOnResponse`, `JourneyAction`, reducer, and `DemoJourney.requestVto`.
4. Remove the recorded bypass in `handleSelectProduct`.
5. Update `TryOnStep` gating, labels, and recorded image rendering.
6. Add `ResultStep` before/after + AI trail.
7. Run typecheck + tests.

### Phase 3 — Recommendation bridge + sample CTA (30 min)

1. Update catalog `targetConcernIds`.
2. Implement finish-aware ranking and reason copy.
3. Add the `MatchesStep` bridge line.
4. Add “Use demo photo” to `CaptureStep`.
5. Add recorded/live honesty notices.
6. Update recommendations tests.
7. Run typecheck + tests.

### Phase 4 — Assets + fixture (45 min)

1. Download the stock face; add credits.
2. Generate the live analysis fixture; update `lib/mock/skin-snapshot.ts`.
3. Generate three recorded VTO images; inspect them.
4. Verify recorded route returns the right asset per product.
5. Run the full recorded flow locally with no key:

   ```bash
   GLOWCART_ANALYSIS_MODE=recorded npm run dev
   ```

6. Click through: demo photo → snapshot → matches → all 3 shades → keep → result → cart.

### Phase 5 — Deploy recorded mode (30 min)

1. Deploy to Vercel (dashboard or `npx vercel`).
2. Vercel env vars:
   - `GLOWCART_ANALYSIS_MODE=recorded`
   - Do **not** set `YOUCAM_AUTHORIZATION`.
   - Do **not** set `GLOWCART_LIVE_DEPLOYMENT` for the public deployment.
3. Verify:
   - No 503 on `/api/virtual-try-on`.
   - Recorded VTO images load from `/demo/...`.
   - No console errors.
   - Mobile and desktop flows complete.
   - The public app never calls YouCam.
4. If Vercel enforces a lower duration limit, `maxDuration = 60` still covers the recorded flow; the live flow is local-only.

### Phase 6 — Docs + submission assets (30 min)

1. Update README, ARCHITECTURE, FEATURES, PRODUCT_SPEC, UX_SPEC, REMEMBER.
2. Add `LICENSE` (MIT for code) and keep `public/demo/CREDITS.md` for the asset exception.
3. Add `SUBMISSION.md`:
   - Public URL
   - Repo URL
   - APIs used: YouCam Skin AI, YouCam Makeup VTO
   - Judge path (exact clicks)
   - Live vs recorded explanation
   - Privacy note
   - Credits
   - Known limitations
4. Screenshots (save to `docs/screenshots/`):
   - Landing hero
   - Capture with demo photo CTA
   - Snapshot scores
   - Matches + bridge
   - Try-on before/after (recorded badge)
   - Result + cart
   - Mobile view
5. Use 1440×900 desktop and 390×844 mobile.

### Phase 7 — Video + publish (30–45 min)

Record a 2-minute screen capture in **live mode** using the stock demo face. No presenter face or webcam is required.

Script:

- 0:00–0:10 — “GlowCart turns one selfie into a skin-aware lip shade try-on.”
- 0:10–0:25 — Live mode; click “Use demo photo”; show the stock-photo label.
- 0:25–0:40 — Skin AI scores: acne, pore, moisture; show the live badge.
- 0:40–0:55 — Recommendation bridge: why this finish.
- 0:55–1:15 — VTO on three shades; show before/after.
- 1:15–1:30 — Keep shade → result → prototype cart.
- 1:30–1:45 — Architecture: Next.js server routes, YouCam Skin AI + VTO, no key in browser; public demo is recorded for reliability.
- 1:45–2:00 — Public URL, repo, “Powered by YouCam.”

Production:

- Use OBS or similar; 1080p; clear cursor; no personal data.
- Add captions.
- Upload as unlisted YouTube (or the platform Devpost accepts).
- Do not show `.env.local`, terminal env vars, or the key.
- Do not show the user's face.

Publish:

1. Final secret scan.
2. Commit final changes.
3. Push.
4. Make repo public:

   ```bash
   gh repo edit Veerpratapgupta/GlowKart --visibility public --accept-visibility-change-consequences
   ```

   Or use GitHub Settings → General → Danger Zone. If public is not possible, share the private repo with `contact_event@PerfectCorp.com`.
5. Submit before the deadline with URL, repo, video, screenshots, and description.

## 8. Non-Negotiables

- Never expose `YOUCAM_AUTHORIZATION` in browser code, commits, logs, screenshots, videos, or docs.
- Never commit `.env.local`, `.next`, `node_modules`, or generated output containing secrets.
- Keep all YouCam calls server-side.
- No new dependencies, auth, payments, databases, or external services.
- Use existing types and conventions; no `any`.
- Do not use the user's face in the repo or video.
- Do not imply the stock model is a customer or endorser.
- Do not claim recorded results are live or personalized.
- Do not add a feature that does not help the one demo journey.
- Keep the prototype cart; do not add checkout.
- Run `npm run typecheck`, `npm test`, and `npm run build` before reporting completion.

## 9. Acceptance Checklist

- [ ] VTO respects `sheer`, `satin`, and `matte`; tests cover all three.
- [ ] Small images are never cropped or upscaled; large images are downscaled to ≤1600px and ≤3.5MB.
- [ ] Analysis and VTO return before 60s; routes export `maxDuration = 60`.
- [ ] Recorded VTO route returns the correct local asset for each product; no 503.
- [ ] Try-on shows a real recorded VTO image, not a swatch overlay, with an honest badge.
- [ ] “Keep this shade” is disabled while loading/error.
- [ ] Result page shows before/after, scores, rationale, AI trail, and YouCam branding.
- [ ] Recommendations react to acne/pore/moisture and explain the finish choice.
- [ ] “Use demo photo” works in both modes; stock-photo notice is visible.
- [ ] Recorded mode clearly says the uploaded photo is not analyzed.
- [ ] Public Vercel deployment runs recorded mode with no YouCam key.
- [ ] Local live flow works with the stock face and is used for the video.
- [ ] README, ARCHITECTURE, FEATURES, PRODUCT_SPEC, UX_SPEC, REMEMBER are current.
- [ ] `LICENSE` and `public/demo/CREDITS.md` exist.
- [ ] `SUBMISSION.md`, screenshots, and 2-minute video are ready.
- [ ] Secret scan is clean; repo is public or shared with `contact_event@PerfectCorp.com`.
- [ ] `npm run typecheck`, `npm test`, `npm run build` pass.

## 10. Known Limitations to State Honestly

- The public demo replays recorded YouCam outputs for reliability and cost control.
- Live mode is demonstrated in the video and runs locally with a server-side key.
- The demo face is a licensed stock photo, not a customer or endorser.
- VTO is a visual shade preview, not a medical or dermatological recommendation.
- The cart is a prototype; there is no checkout, account, or order.
- Skin scores are beauty-reference signals, not diagnoses.
- Results depend on lighting, angle, and image quality.

## 11. Copy-Paste Prompts for Copilot

### Master prompt

```text
You are the implementation agent for GlowCart. Read AGENTS.md, FEATURES.md, SKILLS.md, REMEMBER.md, and HANDOFF.md first. Execute only the phase named in my next message. Do not touch .env.local, print secrets, add dependencies, or deploy before Phase 5. Use existing types and design conventions; avoid any. Run the phase validation commands. Report in the AGENTS.md format: Status, Changed, Validated, Limitations.
```

### Phase 0 — checkpoint and secret scan

```text
Execute Phase 0 of HANDOFF.md only. Run typecheck, tests, and build. Run the secret-scan commands and inspect results without printing secret values. If a real key appears in git history, stop and report; do not proceed. Otherwise commit the current work with the message "Checkpoint working MVP before judge-mode polish" and push to the private repo. Do not make the repo public. Report changed files, validation results, and any secret-scan concern.
```

### Phase 1 — P0 correctness

```text
Execute Phase 1 of HANDOFF.md only. Fix the VTO finish mapping in lib/youcam/virtual-try-on.ts and update its tests. Replace the crop/upscale image pipeline in components/flow/DemoJourney.tsx with a downscale-only converter (max 1600px, target ≤3.5MB) and add a pure dimension-helper test. Add 60s maxDuration exports, adapter deadlines, and shorter client timeouts; add safe timeout messages. Add turbopack.root to next.config.ts. Do not touch recorded VTO routing, recommendations, UI polish, assets, or deployment. Run typecheck and the focused tests, then report.
```

### Phase 2 — recorded VTO and result before/after

```text
Execute Phase 2 of HANDOFF.md only. Add lib/mock/recorded-vto.ts. Update the VTO route to support recorded mode without a key and live mode behind the protected gate. Update VirtualTryOnResponse, JourneyAction, journeyReducer, and DemoJourney.requestVto to carry mode and result URL. Remove the recorded bypass in handleSelectProduct. Update TryOnStep gating/labels/recorded rendering and add the ResultStep before/after hero plus AI trail. Keep the existing swatch overlay only as a labeled fallback. Run typecheck and tests, then report.
```

### Phase 3 — recommendation bridge and sample CTA

```text
Execute Phase 3 of HANDOFF.md only. Update catalog targetConcernIds and implement finish-aware recommendation ranking driven by acne, pore, and moisture scores. Add the one-line MatchesStep bridge. Add the "Use demo photo" CTA to CaptureStep for both modes, with the stock-photo notice and safe error handling. Add recorded/live honesty notices. Extend recommendation tests for high-acne and high-pore cases. Do not change VTO routing or deployment. Run typecheck and tests, then report.
```

### Phase 4 — demo assets and recorded fixture

```text
Phase 4 is already executed in the working tree with Pexels 8789224; 8789240 failed YouCam face checks. Do not overwrite public/demo assets or lib/mock/skin-snapshot.ts. The real recorded fixture is acne 92, pore 80, moisture 78. To verify or regenerate explicitly, use public/demo/demo-selfie.jpg, the existing live adapters with node --env-file=.env.local --import tsx, and download each VTO result immediately to public/demo/vto-*.jpg. Never print or hardcode the key. Inspect each image and verify the recorded flow locally. Do not commit .env.local. Report generated files, API outcomes, and any failed shade.
```

### Phase 5 — Vercel recorded deployment

```text
Execute Phase 5 of HANDOFF.md only. Deploy the app to Vercel in recorded mode. Set GLOWCART_ANALYSIS_MODE=recorded. Do not set YOUCAM_AUTHORIZATION or GLOWCART_LIVE_DEPLOYMENT on the public project. Verify the full recorded journey on desktop and mobile: demo photo, snapshot, matches, all three VTO images, keep, result, cart. Confirm /api/virtual-try-on returns recorded assets and no 503, and that the public app makes no YouCam calls. Report the deployment URL, checks, and any limitation.
```

### Phase 6 — docs and submission assets

```text
Execute Phase 6 of HANDOFF.md only. Update README, ARCHITECTURE, FEATURES, PRODUCT_SPEC, UX_SPEC, and REMEMBER to match the shipped behavior. Add LICENSE (MIT for code) and keep the Pexels asset exception in public/demo/CREDITS.md. Add SUBMISSION.md with URL, repo, APIs, judge path, live-vs-recorded explanation, privacy, credits, and limitations. Capture the listed screenshots into docs/screenshots/ at desktop and mobile sizes. Do not change application behavior. Report changed files and checks.
```

### Phase 7 — video, publish, submit

```text
Execute Phase 7 of HANDOFF.md only. Prepare the 2-minute screen-recording script and shot list for live mode using the stock demo face; no presenter face or webcam. Run the final secret scan. Commit the final changes and push. Make the repo public with gh repo edit Veerpratapgupta/GlowKart --visibility public --accept-visibility-change-consequences, or share it with contact_event@PerfectCorp.com if public is not possible. Verify the public URL, video, screenshots, and submission copy. Do not claim recorded results are live. Report the final URLs, checks, and anything that still needs the human owner.
```
