# GlowKart

GlowKart is a hackathon prototype for the **YouCam API — Skin AI × e-commerce** challenge. It turns a selfie into an explainable lipstick match and a shade preview before purchase — no account, no login wall.

**Product promise: Analyze → Explain → Recommend → Preview → Purchase**

1. A user uploads a selfie (or uses the camera, or the stock demo photo).
2. YouCam Skin AI returns visible skin observations in plain language.
3. The shopper tunes finish + occasion, and GlowKart ranks a tiny curated catalog **with a visible reason for every pick**.
4. The shopper previews the shade (YouCam VTO on a protected deployment; a clearly labeled selfie-and-swatch simulation in the public recorded demo), can compare shades side by side, and keeps the look.
5. The kept look lands in a prototype cart with subtotal, removable items, and a "Save this look" download.

## Quick start (judges)

Requires Node.js 20+.

```bash
npm install
npm run dev      # then open http://localhost:3000
```

No environment variables are needed: the app runs in **recorded demo mode** by default, so the full journey works with zero API keys. A visible badge on every screen states which mode is active.

```bash
npm run build      # production build (works offline — fonts are self-hosted)
npm run start      # serve the production build
npm run typecheck  # TypeScript check
npm test           # 54 unit + route-boundary tests
```

## Two-minute demo script

1. **Discover** — landing explains the promise in one sentence; badge says *Recorded demo · no API key needed*.
2. **Capture** — click **Use demo photo** (or upload any front-facing JPG/PNG ≤ 8 MB).
3. **Snapshot** — three plain-language observations with scores + the "not a medical diagnosis" disclaimer. Toggle **finish/occasion** to see the ranking change.
4. **Matches** — one best starting point + two alternatives, each with "We noticed / This product offers / Starting point".
5. **Try-on** — labeled shade preview; use **Compare shades** to flip between recommendations without going back.
6. **Result** — before/after, the AI trail, **Save this look** (downloads a JPG), **Add to cart**, remove items, see the subtotal.

## YouCam integration & modes

| Mode | What happens | When to use |
|---|---|---|
| `recorded` (default) | `/api/skin-analysis` and `/api/virtual-try-on` return sanitized fixtures captured from a real YouCam integration; the preview is a labeled selfie-and-swatch simulation. No network calls to YouCam, no credits spent. | Public deployment / judging |
| `live` | Server-side calls to YouCam Skin AI (`/s2s/v2.1/task/skin-analysis`) and lipstick VTO (`/s2s/v2.0/task/makeup-vto`) with upload → task → poll, explicit timeout/error mapping, and finish-aware lip effects. | Only on a separately protected deployment |

Live mode requires the server-only `YOUCAM_AUTHORIZATION` value (legacy `YOUCAM_API_KEY` also accepted) **and** `GLOWCART_LIVE_DEPLOYMENT=protected`; both routes fail closed (503) otherwise, so a public deployment can never spend provider credits. Set `GLOWCART_ANALYSIS_MODE=live` to select live mode. Secrets never reach the browser and are never committed (see `.env.example`).

In recorded mode the browser still calls the app's own API routes, so the public journey exercises exactly the same server boundary — validation (type/size), mode gating, and safe error mapping included.

## Architecture

```text
Browser UI (React client components, session-only state)
  └─ internal route handlers
       ├─ /api/skin-analysis  → lib/youcam/skin-analysis.ts → YouCam Skin AI
       └─ /api/virtual-try-on → lib/youcam/virtual-try-on.ts → YouCam VTO
Typed domain layer: SkinSnapshot, Product, Recommendation, TryOnResult
Static curated catalog: lib/mock/catalog.ts (swap for a DB later without UI changes)
```

- Self-hosted variable fonts (Archivo + Fraunces via `@fontsource-variable/*`) — the production build needs no external font network access.
- Security headers on every route; selfie files are validated (JPG/PNG, ≤ 8 MB), downscaled client-side, sent with an abortable request, and never persisted.
- Custom 404/error screens, skip link, focus management on step change, `prefers-reduced-motion` respected.

## Demo assets & credits

The stock demo face and the three recorded VTO images are credited in [`public/demo/CREDITS.md`](./public/demo/CREDITS.md) (Pexels license; YouCam-generated renders, labeled as recorded). The depicted person is not a customer or endorser.

## Honest limitations

- Recorded mode replays a recorded result from the demo face — it never presents a fixture as a fresh inference of the visitor's photo.
- The catalog is intentionally tiny (6 curated shades); the cart is a prototype (no payment/checkout).
- Beauty reference scores only — no medical claims.

## For judges (2-minute orientation)

- **Run it:** `npm install && npm run dev` → open http://localhost:3000 → click **Use demo photo** → the full journey runs with zero API keys in labeled recorded mode. Deployed URL: see the Devpost submission.
- **Code map:** `app/api/*/route.ts` (validation, mode gating, safe errors) → `lib/youcam/skin-analysis.ts` + `lib/youcam/virtual-try-on.ts` (YouCam File API upload → task create → poll → normalize; finish-aware lip effects; never leak IDs/keys) → `lib/recommendations.ts` (deterministic, explainable ranking) → `components/flow/journey.ts` (UI state machine) + `components/flow/*` (screens) → `test/` (54 route/adapter/reducer tests). `npm run typecheck && npm test && npm run build` all pass; the build is offline-safe (self-hosted fonts).
- **Impact:** for shoppers, GlowKart removes the "will this suit me?" hesitation before buying cosmetics online; for retailers, it turns an uninformed product view into an informed one and strengthens the discovery → try-on → cart path. Beauty-reference scores only — no medical claims.

## Submission

Submitting to the YouCam API Skin AI & eCommerce VTO Hackathon (deadline
**Nov 2, 2026, 22:15 IST**)? Follow [`SUBMISSION.md`](./SUBMISSION.md) —
deploy, screenshots (`docs/screenshots/`, helper: `scripts/capture-screenshots.mjs`),
1–3 min video, and the Devpost form. Verified hackathon facts:
[`OFFICIAL_VERIFICATION.md`](./OFFICIAL_VERIFICATION.md).

## Development workflow

- Read [`AGENTS.md`](./AGENTS.md), [`FEATURES.md`](./FEATURES.md), [`SKILLS.md`](./SKILLS.md), and [`REMEMBER.md`](./REMEMBER.md) before changing code.
- Check [`OFFICIAL_VERIFICATION.md`](./OFFICIAL_VERIFICATION.md) before submission.
- Read [`YOUCAM_API_RESEARCH.md`](./YOUCAM_API_RESEARCH.md) before any provider integration.
- OpenCode prompts and role agents: [`PROMPTS.md`](./PROMPTS.md), [`.opencode/agents/`](./.opencode/agents/).
