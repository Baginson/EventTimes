# Now

The single active task/stage. Keep this short — one thing at a time. When it's done, move a summary to `tasks/archive/<date>-<slug>.md` and replace this file's content with the next stage.

## Active

Nothing in progress. **Etap B — Public-launch readiness** is next per `docs/ROADMAP.md`: SEO/OG/theme-color meta tags in `index.html`, a decision + implementation for `VITE_TICKETMASTER_API_KEY` in CI, cleanup of stray `vite-*.log` files and the unused `public/favicon.svg`.

## Recently completed

**UI polish pass 1** (2026-07-17) — full Playwright-driven UI/UX audit (17 before/after screenshot pairs in `.playwright-cli/ui-audit-{before,after}/`), then three verified Codex tasks: design-token normalization (radii/shadows/grays), VenuePanel truncation + non-modal dialog semantics + pin a11y names, touch-target/text-size floors + group chevrons + title balance. Commits `085dc5b`, `493534a`, `115bc0b`. See `tasks/archive/2026-07-17-ui-polish-pass-1.md`.

**AI workflow configuration** (2026-07-16) — `AGENTS.md`, `CLAUDE.md`/`CLAUDE.local.md`, `docs/`, `tasks/`, three review subagents, three workflow skills, safety hooks, graphify integration. See `docs/DECISIONS.md`.
