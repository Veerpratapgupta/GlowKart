# Project Skills

These are lightweight operating skills for OpenCode agents. They are intentionally documented here rather than introducing a framework or plugin dependency.

## Design and product skills

## `product-discovery`

Translate the judge, user, and business problem into one measurable user outcome. Challenge broad requests, write assumptions down, and keep the MVP centered on the primary demo.

## `ux-flow-design`

Define each screen's job, primary action, copy, states, and recovery path before implementation. Prefer a guided flow over a dashboard for this project.

## `design-system`

Choose a small, intentional set of typography, color, spacing, shape, and motion tokens. Reuse tokens and components instead of inventing one-off styling.

## Engineering skills

## `frontend-implementation`

Build accessible, responsive Next.js UI with typed state and clear component boundaries. Keep visual polish separate from provider and data logic.

## `vertical-slice`

Turn one user-visible outcome into the smallest complete implementation. Trace UI, server boundary, data shape, error state, and validation before editing.

## `api-safety`

Keep YouCam credentials server-side. Validate uploads and request sizes, normalize provider responses into typed internal data, handle non-2xx responses explicitly, and avoid logging images or secrets.

## `provider-research`

Read the official provider documentation before writing an adapter. Record endpoint, authentication, input, response, limits, and error behavior; mark unknown details instead of guessing.

## `privacy-and-security`

Minimize image retention, keep secrets out of client code and logs, validate untrusted input, use safe error messages, and review upload/provider boundaries against OWASP-style risks.

## `testing`

Test domain transformations and error boundaries first, then run a browser happy path. Every bug fix gets a focused regression check when the project test setup supports it.

## `deployment`

Keep Codespaces, local browser testing, and Vercel responsibilities clear. Verify environment variables and the deployed HTTPS URL before calling a phase complete.

## `git-hygiene`

Keep commits small and phase-scoped. Review the diff before committing, never overwrite unrelated user work, and use commit messages that describe the finished vertical slice.

## Presentation skills

## `demo-storytelling`

Tell the judge the problem, show the shortest complete journey, make the YouCam moment visible, and end with consumer and retailer value. Rehearse the failure-safe backup path.

## `agent-prompting`

Give agents one outcome, boundaries, acceptance criteria, validation commands, and stop conditions. Use plan → implement → verify → review rather than one giant build prompt.

## `demo-reliability`

Optimize the exact judge path. Use stable sample data only as a visibly labeled fallback, provide retry states, avoid unnecessary network calls, and test the deployed HTTPS URL.

## `ui-polish`

Use a small visual system: clear hierarchy, accessible contrast, responsive layout, restrained motion, and useful empty/loading/error states. Do not add decorative complexity that hides the core flow.

## `scope-control`

Before implementing an idea, map it to the current phase in `FEATURES.md`. If it does not support the core demo, defer it rather than expanding the architecture.

## `review-and-verify`

Review the diff for regressions, run focused checks, and report exact commands. Never claim a provider integration works without testing the relevant route or clearly stating that credentials are unavailable.

## Using external OpenCode skills

The project has installed `frontend-design` from `anthropics/skills` through skills.sh. The installer reported no socket alerts and low risk, but agents must still read and review the local skill instructions before using it. It is for design direction and frontend polish only; it must not widen scope or choose provider architecture.

Installation source:

```bash
npx skills add anthropics/skills --skill frontend-design -y
```

Use the skill during the design gate and UI-polish phase. Pair it with the project's accessibility and scope-control rules.

The official `skin-analysis-expert` skill from `YouCam-API/skills` is also installed. Its source review reported no socket alerts and low risk. It is an agent helper and CLI reference, not a replacement for the application's server-side boundary. It reads `YOUCAM_API_KEY` from the environment, requires Python plus `requests`/`PyYAML`, and supports a zero-credit key validation command.

Installation:

```bash
npx skills add YouCam-API/skills --skill skin-analysis-expert --copy --yes
```

Use it to research and validate provider behavior; do not copy its credentials file into the repository and do not call it from browser code.
