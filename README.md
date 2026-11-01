# GlowCart

GlowCart is a focused hackathon prototype for the YouCam API Skin AI and beauty commerce challenge.

## Product promise

**Analyze → Explain → Recommend → Preview → Purchase**

The first release is intentionally small:

1. A user uploads a selfie.
2. YouCam Skin AI returns visible skin concerns.
3. The shopper chooses a finish and occasion, then GlowCart ranks products from
   a tiny catalog with an explanation.
4. A protected deployment can render one selected lipstick shade with YouCam VTO;
   the public recorded flow shows an explicitly labeled selfie-and-swatch
   simulation instead.
5. The user sees a prototype cart.

The public flow remains recorded-only by default. Live YouCam VTO is available
only on a separately protected deployment and consumes provider units.

## Setup

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Other commands:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # TypeScript check
npm test           # focused unit and route-boundary tests
```

## Environment variables

Copy `.env.example` to `.env.local` when later phases need credentials. Phase 0 runs with no variables set. Never commit real values.

The current analysis route defaults to `recorded` mode, which lets judges complete
the flow without credentials or inference credits. Set
`GLOWCART_ANALYSIS_MODE=live` only after the official YouCam upload contract is
verified and the server-side adapter is configured. Live mode requires the full
server-only `YOUCAM_AUTHORIZATION` value from the official generated client;
`YOUCAM_API_KEY` is also accepted as a legacy fallback variable name.
the adapter never guesses or exposes that value. Keep the public deployment in
recorded mode; use live mode only on a separately protected deployment or
preview environment, with `GLOWCART_LIVE_DEPLOYMENT=protected`. The route
fails closed when live mode is enabled without that explicit deployment marker.
The `/api/virtual-try-on` route uses the same protected-deployment rule and
returns a temporary HTTPS result URL without caching it.
In recorded mode, the browser does not call that route or YouCam; it reuses the
uploaded selfie and selected swatch for a clearly labeled simulation that is
not a live render.

## Development workflow

- Use GitHub Codespaces for the main build and deployment work.
- Use the local laptop for browser testing, camera permissions, and demo rehearsal.
- Use OpenCode agents with the prompts in [`PROMPTS.md`](./PROMPTS.md).
- Reusable OpenCode role agents live in [`.opencode/agents/`](./.opencode/agents/).
- Read [`AGENTS.md`](./AGENTS.md), [`FEATURES.md`](./FEATURES.md), [`SKILLS.md`](./SKILLS.md), and [`REMEMBER.md`](./REMEMBER.md) before changing code.
- Check [`OFFICIAL_VERIFICATION.md`](./OFFICIAL_VERIFICATION.md) before submission.
- Read [`YOUCAM_API_RESEARCH.md`](./YOUCAM_API_RESEARCH.md) before any provider integration.

The prototype must remain easy to run, easy to explain, and reliable on the happy path. Do not add authentication, payments, a large catalog, or a native app until the core demo is stable.

## OpenCode agent loop

Use the repository workflow:

```text
planner → builder → verifier → auditor → fixer/debugger → verifier → memory
```

OpenCode is optional and replaceable; the repository documents remain the source of truth.

The official YouCam `skin-analysis-expert` skill is installed under `.agents/skills/`, and the official YouCam beauty MCP is configured in the user-level OpenCode config. Both are development helpers; secrets remain in environment variables and the shipped application must keep its own server-side integration boundary.

## Judge access

The final prototype will provide a clearly labeled recorded-response mode so judges can test the complete journey without private YouCam credentials. Live provider mode will remain server-side and separately documented.
