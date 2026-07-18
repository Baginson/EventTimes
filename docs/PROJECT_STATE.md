# Event Times — Project State

Last updated: 2026-07-17, after the features wave: Cloudinary uploads, share deep links, private event memories. Keep this current after every non-trivial change — this is the single place to check "what actually works right now."

## Working (verified: `npm run test` 64/64, `npm run lint` clean, `npm run build` clean)

- Map + venue pins (Leaflet), venue panel, event panel, search (Places/Events modes), city/type/date filters, event grouping (Trwa teraz/Nadchodzące/Minione).
- Firebase Auth (email/password + Google), Firestore-backed `venues`/`events`/user actions, `admins/{uid}` gating, Firestore rules — reviewed, correct.
- Admin CRUD (venue/event add/edit/delete/duplicate, pin move by map click, JSON import/export, Firestore refresh) — all implemented with confirmations and loading states.
- Ticketmaster search-and-import admin flow (built, but see "Blocked before public launch" — not wired into production CI secrets).
- Account panel: real Firestore-backed activity feed + preferences (not mocked).
- Mobile: real bottom-sheet treatment for panels (not just squeezed desktop CSS), `prefers-reduced-motion` handled in CSS and JS.
- CI: GitHub Pages deploy now gated on `npm run test` + `npm run lint` before build (added in Etap A).
- Global React error boundary + retry button on data-load failure (added in Etap A).
- Cloudinary cover-photo upload in EventForm (unsigned preset, env-gated; QA'd code paths locally — real upload needs the user's Cloudinary account configured).
- Shareable deep links (`?venue=`/`?event=`) + share buttons in both panels (Playwright-verified: auto-open on fresh load, URL sync, clipboard fallback, unknown ids harmless).
- Private event memories: note + up to 6 photos per past "Byłem" event, editable from EventPanel, listed in the profile. Rules deployed and verified E2E on 2026-07-18 (note saved and re-read through real Firestore); Cloudinary env configured locally, so uploads are active in dev.
- Profile = "Karnet Event Times" (2026-07-18 redesign): navy pass card + cream collection with stat-strip tabs, polaroid memories, receipt-style activity. The old tile-overlap layout bug is structurally fixed (see DECISIONS).

## Partially working / known drift

- **`status` field** (`published/draft/cancelled` on events, `active/draft/archived` on venues) is written by forms/services but never read anywhere in the UI — dead, undocumented field. Needs a decision: wire it up as a real publish workflow, or remove it.
- **Mobile admin panel** is visually a bottom sheet but functionally identical to desktop — full multi-tab CRUD + Ticketmaster + data tools on a phone screen, no real simplification.
- **Breakpoints diverge from `docs/UI_RULES.md`**: code uses 820px/1100px; the written rule says 767/768 and 1023/1024. No real tablet layout currently exists.
- **Two parallel feedback systems**: global `AppToast` vs. per-component inline error/success blocks (Admin/Account/Event/Venue panels, AuthModal) — not unified.
- Coordinate validation is inconsistent between `venueService.isVenue` (no lat/lng range check) and `googleMaps.isValidCoordinates` (range-checked).
- Escape-to-close with search dropdown open over a panel closes both at once (document-level listeners stack — same pre-existing pattern as AccountPanel; minor, tracked).

## Missing entirely

- Password reset (Firebase Auth flow not implemented anywhere).
- Account deletion / personal data export (only "clear activity" exists).
- Deep-linking / routing — no way to share or reload a link to a specific venue/event.
- SEO/Open Graph/theme-color meta tags in `index.html` (zero currently).
- Empty-Firestore messaging for non-admin users (currently admin-only).

## Blocked before public launch (P1)

1. Error boundary — **done** (Etap A).
2. Retry on data-load failure — **done** (Etap A).
3. `VITE_TICKETMASTER_API_KEY` is not passed as a secret in `.github/workflows/deploy.yml` — the Ticketmaster import feature is fully built but inert on the production GitHub Pages deploy. Needs either wiring into CI or an explicit documented decision to keep it dev/local-only.
4. Password reset flow.
5. SEO/OG/theme-color meta tags.
6. VenuePanel description truncation — **done** (UI polish pass, 2026-07-17): >450 chars truncates with Czytaj więcej/Zwiń opis, mirroring EventPanel.
7. Escape-to-close / `role="dialog"` on VenuePanel and EventPanel — **done** (UI polish pass, 2026-07-17). Deliberately non-modal: no `aria-modal`, no focus trap (map must stay reachable); focus moves into the panel on open. Map pins also gained accessible names (`role="img"` + escaped `aria-label`).
8. CI test/lint gate — **done** (Etap A).
9. Account deletion / data export (GDPR-relevant for a PL-facing app with accounts).

## Useful later, not MVP-blocking (P3)

- Deep-linking/routing.
- `App.css` modularization (currently 4100+ lines in one file).
- Component/integration tests (only pure utils/model functions have tests today).
- Real tablet breakpoint matching `docs/UI_RULES.md`.
- Unify AppToast vs. inline component messaging.
- Clean up stray `vite-*.log` files and the unused `public/favicon.svg`.

## Current priorities

Working through the staged plan from the audit, one small Codex-delegated task at a time, verified before moving on. Completed: Etap A (stability), UI polish pass 1 (2026-07-17: design-token normalization — 22 ad-hoc radii/one-off shadows/stray grays collapsed onto tokens with two new ones preserving CTA shadow hierarchy; VenuePanel truncation parity; panel dialog semantics; pin a11y names; ≥40px touch targets; 14px card-text floor; group-header chevrons; `text-wrap: balance` on panel titles). Next per `docs/ROADMAP.md`: Etap B (public-launch readiness: SEO meta, Ticketmaster CI secret decision, repo cleanup).

## Architecture decisions in effect

See `docs/DECISIONS.md` for the full log. Headlines: Firestore is the data source of truth (localStorage is fallback-only), admin is Firestore-doc-based only, coordinates are provider-agnostic `{lat,lng}`, event status is always computed dynamically, free-first (no paid Firebase/Maps services).
