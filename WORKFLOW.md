# Vibe-Engineering Workflow

This workflow is intentionally slower before code and faster after the design gate. It is the default agentic AI workflow for GlowCart.

## Gates

### Gate A — Product approval

Approve `PRODUCT_SPEC.md`: user, problem, promise, primary demo, MVP boundary, and success signals.

### Gate B — Experience approval

Approve `UX_SPEC.md`: screen jobs, content, visual direction, states, and accessibility requirements.

### Gate C — Architecture approval

Approve `ARCHITECTURE.md`: boundaries, provider strategy, data ownership, failure behavior, and deferred services.

### Gate D — Implementation

Run one small OpenCode prompt per phase. Do not ask one agent to build the entire app.

### Gate E — Verification

Run tests/build, inspect the diff, manually exercise the touched flow, and only then continue.

### Gate F — Demo readiness

Verify the deployed URL, record the primary path, test the backup path, and freeze scope before submission.

## Agent sequence

1. **Product/UX agent:** produce or refine one design artifact, no application code.
2. **Research agent:** verify external API or platform facts, no application edits.
3. **Planner agent:** turn the approved design into one bounded implementation task.
4. **Builder agent:** implement one user-visible vertical slice.
5. **Test agent:** add or run focused checks and reproduce the happy/error paths.
6. **Reviewer agent:** read-only findings with file and line references.
7. **Polish agent:** improve only the approved UI or demo issue.
8. **Memory agent:** update `REMEMBER.md` only with verified decisions.

Agents that edit application files run sequentially. Research and read-only review may run in parallel.

## OpenCode free-plan operating mode

OpenCode is the helper, not the source of project truth. Keep prompts and decisions in this repository so work remains resumable if free-model usage is exhausted.

- Use the repository agents in `.opencode/agents/`.
- Use one builder/fixer/debugger at a time for application edits.
- Use planner, researcher, auditor, verifier, and memory agents for bounded work.
- Prefer short prompts that point to the existing documents instead of pasting the whole project context.
- Stop after the loop limit; do not retry an exhausted model repeatedly.
- Never upgrade or add a paid service without explicit approval.

The local `frontend-design` skill is available to OpenCode. Add MCP servers only after reviewing their official source, permissions, and direct value to the current phase.

The official YouCam beauty MCP is now configured in the user-level OpenCode config:

- Server: `https://mcp-api-01.makeupar.com/mcp/beauty`
- Name: `youcam-beauty`
- Credential: environment placeholder only, never committed

It is for agent-assisted research and controlled provider tasks. The application must still use its own server-side adapter and recorded-response mode. Do not treat an MCP tool result as a substitute for application tests or judge-access documentation.

## Agent handoff contract

Every agent must leave a concise handoff:

```text
Status: complete | blocked
Goal:
Changed:
Validated:
Risks/limitations:
Next recommended agent:
```

The next agent must treat this as evidence, not truth: inspect the current files and rerun relevant checks.

## State machine

```text
DESIGN
  → PLAN
  → BUILD
  → TEST
  → REVIEW
  → ACCEPTED
  → next phase
```

On failure:

```text
TEST/REVIEW
  → FIX (same phase, narrow scope)
  → TEST
```

Never jump from BUILD directly to the next phase. Never silently convert a provider failure into success.

## Continuous engineering loop

Every implementation phase uses this loop:

```text
PROMPT
  → PLAN
  → CODE
  → AUDIT
  → FIX
  → DEBUG (only if a reproducible failure exists)
  → TEST
  → REMEMBER
  → HANDOFF
```

Rules:

- `PROMPT` states one user-visible outcome and its boundaries.
- `PLAN` identifies files, state transitions, risks, and checks before editing.
- `CODE` makes the smallest coherent change.
- `AUDIT` checks scope, security, accessibility, UX states, and regressions.
- `FIX` addresses only confirmed findings from the audit.
- `DEBUG` reproduces the failure first, then changes one likely cause at a time.
- `TEST` runs focused checks plus the relevant build/typecheck.
- `REMEMBER` records only verified, durable decisions in `REMEMBER.md`.
- `HANDOFF` records status and the exact next action.

### Loop limits

- Maximum two fix/debug iterations for one phase before stopping for human review.
- Never hide a failing test, delete a regression test, or weaken validation to get green output.
- If the same failure returns twice, stop and document the evidence instead of guessing.
- A new feature request starts a new loop; it is not folded into the current fix.

## Prompt contract

Every implementation prompt must contain:

- The exact user-visible outcome
- In-scope files or boundary
- Explicit out-of-scope items
- Acceptance criteria
- Required validation commands
- Security and error-handling constraints

## Stop conditions

Stop and ask for approval when:

- A feature requires authentication, payment, medical claims, or sensitive data persistence.
- YouCam documentation is ambiguous or unavailable.
- A proposed dependency changes the architecture.
- An agent wants to widen the scope beyond the active phase.
- Validation fails and the cause is not obvious after one focused repair.
- The implementation has no credential-free judge-test path after a real provider integration.

## GitHub Codespaces plan

- Codespaces: installs, builds, API integration, tests, deployment.
- Local laptop: browser, camera permissions, responsive checks, recording, presentation.
- Commit each green milestone with a narrow message.
- Keep a deployed URL and a recorded fallback after the first real integration.

## Current status

Product, UX, and architecture documents exist. The next implementation task is the Phase 1 demo shell, using typed mock data and no provider credentials.
