---
name: eventtimes-feature
description: Playbook for adding or changing a feature in Event Times, from scoping through Codex delegation to documentation update. Use when asked to build a new feature/section, extend an existing one, or make a non-trivial change to the Event Times app itself (not to its AI/tooling config).
---

# Event Times — Feature workflow

Follow this order. Don't skip steps to save time — each one prevents a class of mistake this project has actually hit.

## 1. Orient

- Read `docs/PROJECT_STATE.md` (what currently works / is partial / is missing) and `docs/ROADMAP.md` (what stage we're in).
- If `graphify-out/graph.json` exists, run `graphify query "<question about the area you're touching>"` before grepping around manually — it's usually a smaller, more relevant context than raw source browsing.
- Check `docs/ARCHITECTURE.md` and `docs/UI_RULES.md` for anything that constrains the approach (data model shape, admin gating, typography, panel conventions).
- If the feature idea might come from `EVENT_TIMES_SPEC.md`/`CODEX_INSTRUCTIONS.md` (older local-only notes) rather than `docs/`, sanity-check it's still the intended direction before building it — those files can be stale.

## 2. Scope before delegating

- Decide the architecture/data-model/UX shape yourself — this is not Codex's call (see `AGENTS.md`).
- Break the work into small, single-purpose tasks. One Codex task at a time.
- For each task, write: concrete goal, exact files/areas in scope, expected behavior, what must NOT change, completion criteria, and the test commands to run (`npm run test`, `npm run lint`, `npm run build` at minimum).

## 3. Delegate to Codex

- `mcp__codex__codex` with `cwd` = repo root, `sandbox: workspace-write`, `approval-policy: on-request` (per `AGENTS.md` — Codex should not need standing full-auto approval for feature work; escalate to `never` only for a task you've already scoped very tightly and trust, as established in early-stage stability fixes).
- Ask Codex to report back only: changed files, a short summary, test results, open issues — not full diffs (you'll read those yourself).

## 4. Verify — don't trust the report

- Read the actual `git diff`.
- Confirm nothing outside the stated scope changed.
- Run `npm run test`, `npm run lint`, `npm run build` yourself.
- For anything UI-visible, consider dispatching the `ui-reviewer` subagent to actually drive it in a browser (desktop + mobile) before calling it done.
- For anything touching auth/Firebase/secrets/CI, dispatch the `security-reviewer` subagent.
- Consider the `code-reviewer` subagent for a second pass against `AGENTS.md`/`docs/ARCHITECTURE.md` before accepting.

## 5. Close the loop

- If something's wrong, send a specific fix task via `codex-reply` (same thread) rather than a vague "fix it."
- Once accepted: update `docs/PROJECT_STATE.md` (what now works / changed), and if it was a real decision (not just an implementation detail), add an entry to `docs/DECISIONS.md`.
- Update `tasks/NOW.md` to the next task; if a whole stage finished, archive a short summary to `tasks/archive/<date>-<slug>.md`.
- After code changes, run `graphify update .` if the graph exists (AST-only, no API cost) so the next session's queries stay accurate.

## Guardrails (from `AGENTS.md`, repeated because they matter most here)

No `Zainteresowany` action, admin only via `admins/{uid}`, coordinates always `{lat,lng}`, event status always computed, Bungee never in body/forms/buttons, no secrets in source, don't restructure architecture or the data model without discussing it first.
