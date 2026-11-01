# Official Hackathon Verification

**Last verified:** 2026-11-01 (web search + indexed Devpost/press pages; Devpost
pages block direct automated fetches, so re-open the live pages in a browser
before submitting).

## Event (verified)

- **Name:** YouCam API Skin AI & eCommerce VTO Hackathon (Perfect Corp, on Devpost)
- **URL:** <https://youcam-api-skin-ai-ecommerce.devpost.com/>
- **Deadline:** **November 2, 2026, 11:45 a.m. ET (EST)** = **November 2, 2026, 22:15 IST** (US clocks fall back Nov 1). From India, submit by tomorrow 22:15 IST — today is Nov 1.
- **Format:** Online, public. Winners announced on or around **November 24, 2026**.
- **Prizes ($6,000 cash):** 1st $2,500 · 2nd $1,000 · 3rd $500 · Women in Tech $1,000 · Rising Star (student) $1,000.
- **Free units:** every registered participant gets **1,000 free YouCam API units**.
- **Eligibility:** India is **not** on the excluded countries/territories list
  (excluded: Afghanistan, Antarctica, Belarus, Brazil, China, Crimea, Cuba,
  Djibouti, Donetsk PR, Iran, Iraq, Italy, North Korea, Luhansk PR, Quebec,
  Russia, Somalia, Sudan, Ukraine, Venezuela, Vietnam, Western Sahara). The
  challenge page even has an "(For India region, please click HERE)" note.
- **Brief:** integrate at least one YouCam API into a functional web or mobile
  prototype with clear consumer or retail value, in skincare, beauty, fashion,
  or e-commerce.

## What to submit (verified from the Devpost "What to Submit" section)

1. **Code repository URL** — public with a relevant license (we ship MIT
   `LICENSE`), or private shared with the organizers' email.
2. **Text description** — features, functionality, and clear consumer/retail value.
3. **Screenshots of the project** (required) — see `docs/screenshots/README.md`
   for what to capture; `scripts/capture-screenshots.mjs` can automate it.
4. **1–3 minute demo video** — end-to-end, explains which YouCam API is used,
   shows the project working on the device it was built for, publicly visible on
   **YouTube (preferred), Vimeo, or Youku**, linked on the submission form; no
   third-party trademarks or copyrighted music.
5. Exit interview if chosen as winner; agreement to a blog article.

Bonus (not judging): 500 extra API units per qualifying demo-video social post, up to 2.

## Judging criteria (verified)

- **Technological implementation** — at least one YouCam API integrated
  thoroughly and skillfully; clear consumer/retail value; working, non-trivial code.
- **Design** — a complete, coherent product experience, not just a tech demo.
- **Potential impact** — credible, specific case for a real problem and audience.
- **Quality of the idea** (per press coverage).

## GlowKart's alignment

| Requirement | GlowKart response | Status |
|---|---|---|
| ≥1 YouCam API in a working web prototype | Skin AI analysis + Makeup VTO, server-side adapters (`lib/youcam/`), recorded demo mode for judges | ✅ |
| Consumer/retail value | Selfie → explainable lipstick match → try-on → cart | ✅ |
| Recorded demo path without credentials | Default `recorded` mode, labeled on every screen; matches the judge-access forum guidance and what other entrants ship | ✅ |
| Live mode without exposing secrets | `GLOWCART_ANALYSIS_MODE=live` + `GLOWCART_LIVE_DEPLOYMENT=protected` gate; routes fail closed; key server-only | ✅ |
| License | MIT `LICENSE` | ✅ |
| Screenshots | capture via `scripts/capture-screenshots.mjs` or manually; save to `docs/screenshots/` | ⏳ do before submit |
| Demo video 1–3 min | follow the README "Two-minute demo script"; upload to YouTube unlisted/public | ⏳ do before submit |
| Deployed HTTPS URL | deploy recorded mode (e.g. Vercel) and link it | ⏳ do before submit |

## Release blockers (do not submit until all are done)

- [ ] Repo is public (or shared with organizers) and `README.md` runs clean from scratch (`npm install && npm run dev`).
- [ ] Deployed HTTPS URL works on a clean browser in recorded mode.
- [ ] Screenshots captured and uploaded to the Devpost form.
- [ ] 1–3 min demo video uploaded to YouTube/Vimeo/Youku and linked.
- [ ] Description text written on the form (problem, solution, YouCam APIs used, how to run, recorded vs live mode).
- [ ] No secrets anywhere in git history (`git log -p | grep -i youcam` style check; `.env*` is gitignored).
- [ ] Final `npm run typecheck && npm test && npm run build` all pass.
