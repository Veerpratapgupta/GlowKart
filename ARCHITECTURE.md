# GlowCart Architecture Proposal

**Status:** Design proposal — implementation is blocked until approved.

## Architecture goal

Make the smallest secure system that can deliver one reliable guest demo. Every boundary should be replaceable without rewriting the user flow.

## Proposed stack

- **Web:** Next.js App Router, TypeScript, Tailwind CSS
- **Hosting:** Vercel
- **Provider:** YouCam APIs through server-side route handlers
- **Initial data:** typed local catalog
- **Optional later persistence:** Supabase
- **Optional later identity:** Clerk, only for saved routines
- **Agent workflow:** OpenCode with the repository instructions and installed `frontend-design` skill

## Boundary map

```text
Browser UI
  ├─ session state: image, analysis, selected product, VTO result
  └─ calls internal route handlers
       ├─ /api/skin-analysis → YouCam Skin AI
       └─ /api/virtual-try-on → YouCam VTO

Typed domain layer
  ├─ SkinObservation
  ├─ Product
  ├─ Recommendation
  └─ TryOnResult

Provider adapters
  ├─ authentication and request construction
  ├─ input validation
  ├─ response normalization
  └─ explicit error mapping
```

## Data ownership

### Browser/session

Keep only the minimum session data required for the current flow. Do not persist a selfie by default.

### Server

Own provider credentials, request validation, response normalization, and safe error messages.

### Static catalog

Start with a tiny local catalog because it is deterministic, fast, and easy to demo. Product records should be shaped so a future Supabase query can replace the source without changing the UI.

## Environment plan

Names will be confirmed against official YouCam documentation before implementation. Secrets belong in Codespaces/Vercel environment settings and must never appear in client bundles or committed files.

## Failure strategy

- Invalid image: explain the requirement and offer retry.
- Provider timeout/non-2xx: show an honest retry state.
- Missing credentials: show setup error in development; never fabricate a live response.
- Unsupported VTO/product combination: keep the product selectable only when supported.
- Browser camera restriction: provide upload as the reliable alternate path.

## Judge-access strategy

The application has two explicit modes:

1. **Recorded demo mode:** sanitized fixtures captured from a verified YouCam integration allow judges to test the complete flow without credentials or consuming a new inference.
2. **Live mode:** server-side provider calls enabled only when deployment secrets are configured.

The UI must label which mode is active. Recorded results must never be presented as fresh analysis. The README must explain how to run recorded mode and how live mode is configured without publishing secrets.

## Supabase and Clerk decision

Do not add either to the MVP foundation. They are optional Phase 6 infrastructure:

- Supabase only when a judge-visible saved routine or retailer catalog requires persistence.
- Clerk only when an account creates clear demo value.

This avoids authentication, migrations, policies, and session bugs before the core proof exists.

## Quality gates

Each phase must pass:

1. Type-check and lint/build checks.
2. Focused route or component tests where behavior is non-trivial.
3. Manual happy-path browser run.
4. Error-state check for the touched boundary.
5. Read-only review agent against the current diff.
