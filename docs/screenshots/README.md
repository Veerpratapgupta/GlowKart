# Screenshots for the Devpost submission

The hackathon rules require **screenshots of the project**. Capture these from the
deployed URL (or `npm run dev` locally) and upload them on the submission form:

| File | What to show |
|---|---|
| `01-discover.png` | Landing screen with the "Recorded demo · no API key needed" badge |
| `02-discover-mobile.png` | Same, mobile viewport (~390 px wide) |
| `03-capture-snapshot.png` | Snapshot step: selfie, observations with scores, disclaimer, mode notice |
| `04-matches.png` | Matches after switching finish to **Matte**; "Why this match" panel visible |
| `05-try-on.png` | Try-on preview with the Compare shades row |
| `06-result-cart.png` | Result: before/after, AI trail, cart with an item + subtotal |

Automated capture (optional):

```bash
npm install -D playwright-core @sparticuz/chromium   # ad-hoc only
npm run build && npm run start &                     # production build on :3000
node scripts/capture-screenshots.mjs http://localhost:3000
```

On a regular laptop, installing the full `playwright` package
(`npx playwright install chromium`) is the most portable option; the script
uses `@sparticuz/chromium`, which bundles its own binary but may need system
libraries on Debian/Ubuntu (`libnss3`, `libatk1.0-0`, …).

Screenshots land in this directory (`docs/screenshots/*.png`). Do not commit
machine-specific artifacts beyond these images; regenerate rather than edit.
