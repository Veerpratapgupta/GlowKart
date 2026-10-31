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
