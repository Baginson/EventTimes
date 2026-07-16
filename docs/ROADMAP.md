# Event Times — Roadmap

Staged plan from the 2026-07-16 full audit. Each stage is delegated to Codex as small, single-purpose tasks and verified (`test`/`lint`/`build` + manual diff review) before moving to the next. Update status here as stages complete; move finished stage notes into `docs/DECISIONS.md` and `tasks/archive/`.

| Stage | Goal | Status |
|---|---|---|
| **A — Stability** | Error boundary, data-load retry, CI test/lint gate | ✅ Done (2026-07-16) |
| **B — Public-launch readiness** | SEO/OG/theme-color meta tags, `VITE_TICKETMASTER_API_KEY` CI decision, repo cleanup (stray logs, unused favicon) | Next |
| **C — Account lifecycle** | Password reset, account deletion / data export | Planned |
| **D — Panels & accessibility** | VenuePanel description truncation (parity with EventPanel), Escape/`role="dialog"`/focus trap on VenuePanel + EventPanel | Planned |
| **E — Mobile consistency** | Reconcile breakpoints with `docs/UI_RULES.md`, fix undersized touch targets/text (`.search-chevron`, `.event-card-description`) | Planned |
| **F — Technical cleanup** | Consolidate `requireDb()`, consistent coordinate validation, resolve the dead `status` field, reduce VenuePanel/EventPanel duplication | Planned |
| **G — Documentation** | Keep `docs/` current after each stage (ongoing, not a one-time pass) | Ongoing |

## Deferred (not MVP-blocking)

- Deep-linking/routing to a specific venue/event.
- `App.css` modularization.
- Component/integration test coverage (Playwright-driven UI checks via the `ui-reviewer` subagent can partially cover this in the meantime).
- Real tablet layout.
- Unifying `AppToast` with the per-component inline error/success messages.

## Explicitly out of scope unless the user asks

Full redesign, framework migration, swapping Firebase or Leaflet, Firestore data-model rebuild, paid services, mass dependency installs — see `AGENTS.md`.
