---
name: eventtimes-release
description: Pre-deploy checklist for Event Times — verifies tests/lint/build, checks for stray debug code and secrets, confirms docs are current, and summarizes what's about to ship. Use before pushing to main/master, before asking the user to approve a push, or when asked to "prepare a release", "get ready to deploy", or "check if this is safe to ship".
---

# Event Times — Release checklist

Run this before pushing to `main`/`master` (GitHub Pages deploys automatically on push) or before telling the user something is ready to ship. This is a check, not an action — never push/merge yourself; report status and let the user decide.

## 1. Clean state

- `git status` — no unexpected untracked/modified files. Nothing that looks like a stray debug artifact (`*.log`, temp files) staged.
- `git diff --stat` against the last pushed commit (or `origin/main` if available) to see the real shipping surface.

## 2. Quality gates (must all pass — these now also run in CI, but verify locally first so nothing reaches GitHub Actions broken)

```bash
npm run test
npm run lint
npm run build
```

## 3. Secret hygiene

- Grep the diff for anything that looks like a hardcoded key/token (`grep -riE "api[_-]?key|secret|password" <changed files>` as a rough pass, then read hits with judgment — plenty of matches will be legitimate variable names).
- Confirm `.env`, `.env.local`, `.env.*.local` are not staged (`git status` should never show them; `.gitignore` covers this, but verify no `-f`/`--force` add happened).
- If the diff touches `.github/workflows/*.yml`, dispatch the `security-reviewer` subagent for a focused pass.
- If a new feature needs a new secret (e.g. a new API key), confirm it's documented in `README.md`'s env/secrets list and added to GitHub Actions Secrets — not just `.env.example`. Third-party API keys (Ticketmaster, Geoapify) belong in Cloudflare Worker secrets, never in the frontend build; the frontend only needs the non-secret `VITE_EVENTTIMES_API_URL` (set directly in `deploy.yml` since 2026-07-19).

## 4. Debug/dead-code sweep

- Grep changed files for `console.log`, `debugger`, commented-out blocks, and literal `TODO`/`FIXME`/`HACK` left behind unintentionally.
- Confirm no temporary test code (e.g. a manually-added `throw new Error('test')` used to verify an error boundary) survived into the diff.

## 5. Docs in sync

- If the change is user-visible or architecturally meaningful, confirm `docs/PROJECT_STATE.md` reflects it (and `docs/DECISIONS.md` has an entry if a real decision was made).
- If `README.md`'s setup/env/secrets instructions are now stale relative to the change, update them — don't leave a public-facing doc gap.

## 6. Report

Summarize: what's about to ship, quality gate results, any secret/debug findings, whether docs are current, and any open risk. Let the user make the actual push/merge call — this skill informs that decision, it doesn't make it.
