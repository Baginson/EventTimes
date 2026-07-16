# Etap A — Stability pass (2026-07-16)

**Goal**: close the three biggest stability gaps found in the full architecture/quality audit before building anything new.

**What shipped**:
1. Global React error boundary (`src/components/ErrorBoundary.tsx`, wired in `src/main.tsx` between `AuthProvider` and `App`) — a render error now shows a branded fallback with a reload button instead of a white screen.
2. "Spróbuj ponownie" retry button in the data-load error banner (`src/App.tsx`), re-invoking the existing `refreshPublicData(true)` — no logic changes to the fetch itself.
3. GitHub Pages deploy workflow (`.github/workflows/deploy.yml`) now runs `npm run test` and `npm run lint` between `npm ci` and the build step — a regression can no longer ship silently.

**How it was done**: three separate, narrowly-scoped Codex tasks via the `codex` MCP server (`sandbox: workspace-write`, `approval-policy: never` for this stage), each reviewed via `git diff` and independently re-verified with `npm run test` / `npm run lint` / `npm run build` before moving to the next task.

**Verified**: 64/64 tests, clean lint, clean build, all three re-confirmed independently after each Codex task (Codex's own sandbox reported a `spawn EPERM` running Vitest — a sandbox artifact, not a real failure; the independent re-run always passed).

**Known residual risk**: the new CI gate only proves itself at the next real push to `main`/`master` — there's no way to dry-run a GitHub Actions workflow from here.

**Follow-up**: Etap B (public-launch readiness) — see `docs/ROADMAP.md`.
