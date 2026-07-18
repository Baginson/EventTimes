# Event Times — Decision Log

Chronological record of decisions that shape the project, with the reasoning behind them. Append new entries at the bottom; don't rewrite history — if a decision is reversed, add a new entry that supersedes it and say so.

## 2026-07-09 — Firestore as the source of truth for public data

**Decision**: `venues`/`events` are read from and written to Cloud Firestore; `localStorage` becomes a fallback only (used when `VITE_FIREBASE_*` env vars are absent) plus a local backup/import-export mechanism.
**Why**: The original localStorage-only model couldn't support a shared, publicly-editable dataset behind a real admin.
**Status**: In effect. `src/services/venueService.ts` / `eventService.ts` implement the Firestore-primary / localStorage-fallback pattern consistently.

## 2026-07-09 — Admin identity via `admins/{uid}` Firestore doc only

**Decision**: Admin status is never based on email, a client-side password, or `VITE_ADMIN_EMAIL`. It's the existence of a Firestore document at `admins/{uid}`, checked with `getDoc` (never `getDocs`/list) on the current user's own uid, and Firestore Rules are the real enforcement layer, not UI hiding.
**Why**: Client-side "security" (hidden buttons, hardcoded emails) is trivially bypassable; a public repo cannot contain admin credentials.
**Status**: In effect. Verified in `firestore.rules` and `src/services/adminService.ts`.

## (predates this log) — Coordinates as provider-agnostic `{lat, lng}`

**Decision**: Venue location is always `{ lat: number, lng: number }` on the data model. Leaflet's `[lat, lng]` array-order requirement is converted only inside the map-rendering component, never in services/utils/models.
**Why**: Leaflet is the first map library used, not a permanent commitment — the app should be able to switch map providers later without a data migration.
**Status**: In effect, verified clean during the 2026-07-16 audit (no leakage found outside `EventMap.tsx`).

## (predates this log) — Event status computed dynamically, never stored

**Decision**: `upcoming`/`ongoing`/`past` is always derived from dates via `getEventStatus()`, never written as a literal field.
**Why**: A stored status field drifts from reality (an event silently stays "upcoming" after its date passes) unless something actively updates it; computing it is always correct.
**Status**: In effect. Note: a *different*, orthogonal `status` field (`published`/`draft`/`cancelled` for events, `active`/`draft`/`archived` for venues) also exists in the data model, is written by forms/services, but is not read anywhere in the UI — it looks like an abandoned publish-workflow feature, not a violation of this decision, but it needs a follow-up decision (wire it up or remove it — tracked in `docs/PROJECT_STATE.md`).

## 2026-07-11 — Detailed spec/instruction docs kept local-only

**Decision**: `CODEX_INSTRUCTIONS.md`, `EVENT_TIMES_SPEC.md`, `docs/EVENT_TIMES_UI_RULES.md`, `docs/design-references/` are gitignored — private working notes, not part of the repo history.
**Why**: (as configured; original reasoning not recorded before this log — possibly to keep early-stage/unpolished planning docs out of a public repo).
**Status**: Superseded in practice as of 2026-07-16 — see the next entry. The files themselves remain gitignored and untouched.

## 2026-07-16 — Committed `docs/` becomes the maintained source of truth

**Decision**: Created `docs/ARCHITECTURE.md`, `docs/UI_RULES.md`, `docs/PROJECT_STATE.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md` as the committed, kept-current documentation set. Where they disagree with the older gitignored local-only files, `docs/` wins.
**Why**: The local-only files had drifted from the actual implementation (e.g. `Venue`/`Event` types in `EVENT_TIMES_SPEC.md` were missing ~7 fields each that exist in code; the Ticketmaster import feature wasn't documented anywhere). A committed, agent-and-human-readable doc set that's part of the normal review flow is less likely to rot.
**Status**: In effect.

## 2026-07-16 — Etap A: stability pass before further feature work

**Decision**: Before adding anything new, close the three biggest stability gaps found in the full audit: no error boundary (any render error white-screened the app), no retry on a failed initial Firestore fetch, and no test/lint gate in the GitHub Pages deploy CI (a regression could ship silently).
**Why**: These are foundational — building more features on top of an app that can white-screen from any bug, or deploying without running the existing test suite, compounds risk rather than reducing it.
**Status**: Implemented and verified (`npm run test`/`lint`/`build` all pass). See `src/components/ErrorBoundary.tsx`, the retry button in `App.tsx`'s data-error banner, and `.github/workflows/deploy.yml`.

## 2026-07-16 — Legacy planning docs consolidated and removed

**Decision**: `CODEX_INSTRUCTIONS.md`, `EVENT_TIMES_SPEC.md`, and `docs/EVENT_TIMES_UI_RULES.md` (local-only, gitignored planning notes) were deleted after their remaining unique content was merged into the committed `docs/` set: venue examples, product vision, and event-status edge rules into `docs/ARCHITECTURE.md`; brand essence (from `docs/design-references/`), the search date-filter enumeration, and the two-mode search rule into `docs/UI_RULES.md`. Their `.gitignore` entries were deliberately kept so a stale copy on another machine can never be accidentally committed. Last tracked versions remain recoverable from git history (deleted from tracking in `37205a2`; content at `4edf906`).
**Why**: Three overlapping, drifting rulebooks meant agents could receive conflicting instructions depending on which file they read (the spec's data model was ~7 fields behind the code). One maintained source of truth (`docs/`) removes that failure mode.
**Status**: In effect. `docs/design-references/` (images + its README) stays as local-only visual reference; `docs/UI_RULES.md` §1 carries its summary for machines without the folder.

## 2026-07-17 — UI polish pass 1: tokens-first styling, non-modal panel dialogs

**Decision**: (1) All radii/shadows/text-grays in `App.css` collapsed onto the `:root` token scale — hardcoded one-off values are no longer acceptable in new CSS; two new shadow tokens (`--shadow-button-soft`, `--shadow-cta`) were added specifically because a naive collapse would have flattened the CTA shadow hierarchy (caught by code review). (2) VenuePanel/EventPanel are `role="dialog"` with Escape-to-close and focus-on-open, but deliberately NON-modal — no `aria-modal`, no focus trap — because the map must remain reachable behind an open panel (unlike AuthModal/AccountPanel, which are true modals with traps). (3) Map pins expose venue names via `role="img"` + HTML-escaped `aria-label` inside the divIcon markup (escaping added because names come from Firestore and land in a raw HTML string).
**Why**: The pre-redesign audit found the brand core (typography split, pin colors, floating panels, search discipline) correctly implemented, with quality lost in micro-drift: 22 ad-hoc radii, ~10 one-off shadows, 4 competing text grays, invisible collapse affordances, sub-40px touch targets, sub-14px card text. Tokens-first + small targeted fixes preserve the working identity instead of a risky rewrite.
**Status**: In effect. Commits `085dc5b`, `493534a`, `115bc0b`. Verified: 64/64 tests, lint, build, per-task code review, Playwright before/after passes.

## 2026-07-18 — Profile redesigned as the "Karnet Event Times"

**Decision**: The account panel is the one screen that fully embraces the poster brand language: a navy participant-pass card (yellow sticker wordmark, Bungee name, taped photo, CSS barcode) next to a cream collection column where a Bungee stat strip with ticket-perforation dividers acts as tabs, memories render as a tilted polaroid strip, and recent activity as a dashed receipt. This deliberately goes further than `docs/UI_RULES.md`'s conservative defaults (user-authorized creative license); the map/search/panels keep their calmer styling.
**Why**: The old dashboard was a generic SaaS grid with a real layout bug — flexbox compressed the shrinkable activity grid inside its scroll container, painting the four tiles over the memories/recent sections. The tab-strip layout removes the bug class entirely (scroll columns now use `flex-shrink: 0` children) and gives the profile the "twoja historia wydarzeń" identity from the product poster.
**Status**: In effect. Commit `47df5cd`, verified live desktop+mobile with a QA account (`qa.claude.eventtimes@example.com` — delete or keep for testing).

## 2026-07-17 — Cloudinary unsigned uploads, URL-param deep links, private memories

**Decision**: (1) Image uploads use Cloudinary **unsigned upload presets** directly from the browser — the only upload model compatible with free-first (no Cloud Functions to sign requests, no Firebase Storage). Accepted tradeoffs: the preset name ships in the bundle (anyone can upload to the account — mitigate with preset restrictions in the Cloudinary dashboard), no client-side deletion (no secret in the client), image URLs are public-by-obscurity. (2) Deep links are plain query params (`?venue=`/`?event=`) with `history.replaceState` — deliberately NOT a router; a single-view map app doesn't need one, and this keeps the GitHub Pages base path handling trivial. (3) Memories live at `users/{uid}/eventMemories/{eventId}` under the same `isOwner` rules pattern as user actions — one doc per (user, event), photos capped at 6, note at 2000 chars, strictly private (no sharing/social surface in this stage).
**Why**: All three features were buildable within the existing architecture (env-gating pattern, service-layer pattern, owner-scoped subcollections) without new dependencies, a router, or paid services.
**Status**: In effect. Commits `7c55749`, `377eed6`, `a4396b2`, `91daf09`. Security-reviewed (rules scoping, secrets hygiene, XSS surface) and Playwright-QA'd. Rules deployment to Firebase Console pending on the user.

## 2026-07-16 — AI agent workflow formalized (AGENTS.md, docs/, subagents, hooks)

**Decision**: Claude Code is the architect/coordinator; Codex (via the `codex` MCP server) implements narrowly-scoped tasks under review; ChatGPT is the product/UX sounding board outside this session. Formalized via `AGENTS.md` (shared short rules), `CLAUDE.md` (role + graphify usage), `CLAUDE.local.md` (private/local notes, gitignored), `docs/` (this set), `tasks/NOW.md` + `tasks/archive/`, three review subagents (`code-reviewer`, `ui-reviewer`, `security-reviewer`), three workflow skills (`eventtimes-feature`, `eventtimes-ui-qa`, `eventtimes-release`), and safety hooks in `.claude/settings.json`.
**Why**: The project had no shared, written contract for how agents should collaborate on it, no committed project-state/decision record, and no automated guardrails against destructive commands or secret leakage.
**Status**: In effect as of this entry.
