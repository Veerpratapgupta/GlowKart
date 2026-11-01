# Agent Operating Rules

These rules apply to every OpenCode agent working on GlowKart.

## Mission

Build a polished, reliable prototype for the YouCam hackathon. Optimize for one complete demo journey, not feature count.

## Non-negotiable rules

1. Read `FEATURES.md`, `SKILLS.md`, and `REMEMBER.md` before editing.
2. Work only on the assigned feature or phase.
3. Inspect existing code before creating new files or helpers.
4. Prefer the smallest change that proves the feature.
5. Do not add dependencies, services, authentication, payments, or database tables without a written feature requirement.
6. Never expose YouCam keys or other secrets in browser code, commits, logs, screenshots, or documentation.
7. Keep API calls server-side and return explicit, user-safe errors.
8. Use typed data and existing project conventions; avoid `any` and silent fallbacks.
9. Keep a demo fallback only when it is visibly labeled as demo data and does not pretend to be a live API result.
10. Do not modify files owned by another active agent. Agents must run sequentially when they can touch the same files.
11. Add focused tests for new behavior when the project has a test setup.
12. Run the smallest relevant validation command before reporting completion.
13. Follow the state machine in `WORKFLOW.md`; do not skip plan, test, or review handoffs.
14. Treat external API facts as unverified until documented by the provider-research agent.
15. Do not install a skill or dependency because it is popular; install it only when its source, permissions, and direct project value are understood.

## Definition of done

A task is done only when:

- The requested behavior works on the intended happy path.
- Loading, empty, invalid-input, and API-error states are handled where relevant.
- No secrets or unnecessary dependencies were introduced.
- Formatting, type-checking, linting, and focused tests pass.
- The agent reports changed files, validation commands, and any known limitation.

## Agent report format

```text
Status: complete | blocked
Changed:
- path/to/file: short reason
Validated:
- command: result
Limitations:
- none, or a concrete follow-up
```

## Loop responsibilities

- **Prompt agent:** turns the approved requirement into one bounded task.
- **Code agent:** edits only the assigned files and behavior.
- **Audit agent:** reviews the diff read-only and ranks actionable findings.
- **Fix agent:** resolves confirmed findings without unrelated refactors.
- **Debug agent:** reproduces a reported failure and isolates its cause.
- **Memory agent:** updates `REMEMBER.md` only after verification.

No agent may claim completion based only on generated code; the relevant check must have run.

## Ownership and handoff

Use one implementation agent at a time for the active vertical slice:

1. Explore and plan.
2. Implement.
3. Validate.
4. Review the diff.
5. Commit a coherent milestone.

Parallel agents may research or review read-only work, but they must not concurrently edit the same application files.
