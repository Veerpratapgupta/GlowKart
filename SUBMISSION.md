# GlowKart — Submission Checklist (submit by Nov 2, 2026, 22:15 IST)

Hackathon: **YouCam API Skin AI & eCommerce VTO Hackathon** (Perfect Corp) —
<https://youcam-api-skin-ai-ecommerce.devpost.com/> · $6,000 cash · India is eligible.
Verified details: `OFFICIAL_VERIFICATION.md`.

## 1. Make the repo judge-ready (done — verify once more)

```bash
npm install
npm run typecheck   # clean
npm test            # 54/54 pass
npm run build       # passes (fonts are self-hosted, no external build-time calls)
```

- [x] MIT `LICENSE` present → make the GitHub repo **public** (or share privately with the organizers' email).
- [x] README explains problem, solution, YouCam APIs, quick start, recorded vs live mode.
- [x] No secrets committed (`.env*` gitignored; `YOUCAM_AUTHORIZATION` only server-side).
- [ ] Quick sanity: `git log -p -- . | grep -iE "api[_-]?key|authorization" | grep -v example` shows nothing real.

## 2. Deploy (recorded mode — no env vars needed)

- [x] Deployed on **Vercel**: <https://glow-kart-sigma.vercel.app> (master, recorded mode,
      no provider env vars). Set `NEXT_PUBLIC_SITE_URL=https://glow-kart-sigma.vercel.app`
      on the Vercel project so social-image URLs are absolute.
- [ ] Open the HTTPS URL in a clean browser (incognito), run the full journey once with **Use demo photo**: discover → snapshot → toggle finish to Matte → matches → try best match → compare shades → keep → save look → add to cart.
- [x] Paste the deployed URL into the Devpost form ("Project URL") **and** the repo URL
      (<https://github.com/Veerpratapgupta/GlowKart>).

## 3. Screenshots (required by the rules)

Capture 5–6 real screenshots and upload them on the form. Easiest: open the
deployed URL and screenshot these screens (browser devtools device toolbar for
one mobile shot):

1. Landing / Discover (badge: "Recorded demo · no API key needed")
2. Capture step after choosing the demo photo (selfie visible + mode notice)
3. Skin snapshot (observations + scores + disclaimer)
4. Matches with finish = Matte (ranking visibly changed, "Why this match")
5. Try-on preview with Compare shades
6. Result: before/after, AI trail, cart with item + subtotal

Optional automation (needs a machine with a browser + libs):

```bash
npm install -D playwright-core @sparticuz/chromium   # ad-hoc, not committed by default
npm run start &                                      # serve the production build
node scripts/capture-screenshots.mjs http://localhost:3000
# → writes docs/screenshots/*.png
```

(On a normal laptop, `npx playwright install chromium` with the full `playwright`
package is the more portable route; the script accepts any Chromium via
`@sparticuz/chromium`.) See `docs/screenshots/README.md`.

## 4. Demo video (required, 1–3 min, YouTube/Vimeo/Youku public link)

Record the deployed URL end-to-end following the **"Two-minute demo script"** in
`README.md`. Script outline (keep it under 2 minutes):

1. Landing: "GlowKart — skin-aware lipstick matching" (5 s).
2. "Use demo photo" → snapshot appears; point at the recorded-demo badge and the
   disclaimer (20 s).
3. Toggle finish to **Matte** → "See my lipstick matches"; ranking changes; show
   the "Why this match" panel (25 s).
4. "Try the best match" → labeled shade preview; use **Compare shades** (20 s).
5. "Keep this shade" → before/after + AI trail → **Save this look** (downloads a
   JPG) → **Add to cart** → subtotal (25 s).
6. Closing line: "Recorded mode replays real YouCam results for judging; live
   YouCam Skin AI + VTO run server-side on a protected deployment." (10 s).

Rules: no copyrighted music, no third-party trademarks; narrate which YouCam
APIs are used (AI Skin Analysis + Makeup VTO). Upload to YouTube (public or
unlisted) and paste the link on the form.

## 5. Devpost form fields

- Project name: **GlowKart**
- Tagline: "Skin-aware lipstick matching — see the shade before you buy"
- Description: paste the ready-made text in §5a below.
- URLs: deployed app + GitHub repo + video link.
- Upload screenshots + cover image (`public/og-image.png` works as the cover).
- Team: add members if any; check eligibility boxes (India is eligible).
- Awards: if your team has at least one self-identified woman member you are
  eligible for the **$1,000 Women in Tech** award; if you are an enrolled student,
  the **$1,000 Rising Star** award — tick those in the form.

## 6. Final checks right before pressing submit

- [ ] `npm run typecheck && npm test && npm run build` all green.
- [ ] Deployed URL loads in incognito in recorded mode, full journey works.
- [ ] Video link is public and plays; length 1–3 min.
- [ ] Screenshots uploaded.
- [ ] Repo public with LICENSE; no secrets in history.
- [ ] Submitted before **Nov 2, 2026, 22:15 IST** (11:45 a.m. EST).

### 5a. Ready-to-paste project description

> GlowKart is a guest-first beauty shopping demo for the YouCam API hackathon.
> **Problem:** online cosmetics buyers hesitate because product photos don't show
> whether a shade will suit them. **Flow:** selfie (upload, camera, or one-click
> demo photo) → **YouCam AI Skin Analysis** called server-side (file registration →
> upload → task → poll → normalized to plain-language, beauty-reference observations)
> → deterministic, explainable lipstick ranking (skin signals + finish/occasion
> preferences; every pick shows "We noticed / This product offers / Starting point")
> → **YouCam Makeup VTO** preview with finish-aware lip effects → before/after,
> "Save this look" download, and a prototype cart. **Judge access:** the public demo
> runs in a clearly labeled *recorded mode* that replays sanitized results captured
> from real YouCam calls — full journey, no key, zero units spent. **Live mode** runs
> the same routes against YouCam server-only behind an explicit protected-deployment
> gate and fails closed otherwise; the API key never reaches the browser.
> **Privacy:** images are validated (JPG/PNG ≤ 8 MB), downscaled client-side, sent
> abortably, and never stored. **Stack:** Next.js 16 + TypeScript + Tailwind,
> self-hosted fonts (offline-safe build), security headers, 54 tests
> (`npm run typecheck && npm test && npm run build`). **Impact:** shoppers get
> confidence before purchase; retailers get informed product views and a stronger
> discovery → try-on → cart path. Beauty guidance only — no medical claims.

### 5b. Video narration script (~100 s, record on the deployed URL)

| Time | On screen | Narration |
|---|---|---|
| 0:00–0:08 | Landing | "GlowKart — skin-aware lipstick matching. Upload a selfie and we'll find a shade that makes sense for you." |
| 0:08–0:20 | Click **Use demo photo** | "One click runs the whole demo in recorded mode — the badge up top says so — no API key needed. In live mode this exact call goes to YouCam." |
| 0:20–0:40 | Snapshot | "YouCam's **AI Skin Analysis API** runs server-side: file upload, task, poll. We normalize the scores into plain language — a beauty reference, not a diagnosis." |
| 0:40–1:00 | Toggle finish to **Matte** → matches | "Watch the ranking change. Every pick explains itself: what we noticed, what the product offers, and the starting point." |
| 1:00–1:20 | Try-on + Compare shades | "Now **YouCam Makeup VTO** previews the shade — here a recorded render on the demo face, clearly labeled; live mode renders your own photo. Compare shades side by side." |
| 1:20–1:40 | Keep → result → Save → Add to cart | "Keep the look — before/after shows the recorded demo-face render, your photo stays session-only — download it, add it to the cart. Live mode renders your own photo for real on a protected deployment." |
| 1:40–1:55 | Close on landing | "GlowKart: analyze, explain, recommend, preview, purchase. Built with the YouCam Skin AI and Makeup VTO APIs. Thanks!" |

Video rules: 1–3 min, public on YouTube/Vimeo/Youku, **no copyrighted music and no
third-party logos** (hide toolbars showing other brands), show the app working on the
device (one desktop run + one mobile shot is ideal). Optional but powerful: with your
1,000 free units, record a 15–20 s **live-mode** clip locally (protected deployment)
and cut it in labeled "live YouCam call" — judges explicitly look for evidence of a
real, fresh API integration.

### 5c. After submitting

- Post the demo video on LinkedIn and X — each qualifying post earns **500 bonus API
  units** (up to two posts).
- Submit at least 1–2 hours before the deadline (Nov 2, 22:15 IST) so you can still
  edit the form if something fails; Devpost allows edits until the deadline.
- Keep the deployed URL and repo public through judging (until ~Nov 24 winner
  announcement).

## How to record the video (practical)

Recommended: **OBS Studio** (free, Windows/macOS/Linux) — 1080p, record the
browser window only, show the cursor, hide toolbars/dock/notifications.
Alternatives: macOS `Cmd+Shift+5` screen recording, Windows `Win+G` Game Bar.

Workflow:

1. Open the **deployed HTTPS URL** in a clean browser profile (incognito).
2. Do one practice run of the §5b script without recording.
3. Record the real run following §5b (≈100 s): landing → **Use demo photo** →
   snapshot → toggle **Matte** → matches → **Try the best match** → **Compare
   shades** → **Keep this shade** → result → **Save this look** (show the
   download) → **Add to cart** → close.
4. One extra mobile pass (phone browser or DevTools device emulation) for the
   "works on the device" requirement.
5. Optional: 15–20 s **live-mode clip** recorded against `npm run dev` locally
   with `.env.local` (`GLOWCART_ANALYSIS_MODE=live`,
   `GLOWCART_LIVE_DEPLOYMENT=protected`, `YOUCAM_AUTHORIZATION`) — label it
   "live YouCam call" when editing. Never deploy the key.
6. Edit (CapCut / Clipchamp / iMovie / YouTube's own editor): trim to **1–3 min**,
   add short on-screen captions for each step, **no music** (rules forbid
   copyrighted audio), no third-party logos in frame, export MP4 1080p.
7. Upload to **YouTube as Public or Unlisted**, verify the link plays in an
   incognito window, paste it into the Devpost form.
