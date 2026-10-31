# GlowCart

GlowCart is a focused hackathon prototype for the YouCam API Skin AI & eCommerce VTO challenge.

## Product promise

**Analyze → Explain → Recommend → Virtually try → Purchase**

The first release is intentionally small:

1. A user uploads a selfie.
2. YouCam Skin AI returns visible skin concerns.
3. GlowCart recommends products from a tiny catalog.
4. The user virtually tries one product with YouCam VTO.
5. The user sees a routine and a prototype cart.

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
```

## Environment variables

Copy `.env.example` to `.env.local` when later phases need credentials. Phase 0 runs with no variables set. Never commit real values.

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
