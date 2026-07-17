# Now

The single active task/stage. Keep this short — one thing at a time. When it's done, move a summary to `tasks/archive/<date>-<slug>.md` and replace this file's content with the next stage.

## Active

Nothing in progress. Immediate follow-ups from the features wave: (1) user deploys updated `firestore.rules` in Firebase Console (eventMemories block), (2) user creates the Cloudinary account + unsigned preset and fills `.env.local` to activate uploads. Then **Etap B — Public-launch readiness** per `docs/ROADMAP.md` (SEO/OG meta, Ticketmaster CI secret decision, stray-file cleanup) — note the new share deep links make the missing OG tags more visible (shared links have no preview cards yet).

## Recently completed

**Features wave** (2026-07-17) — Cloudinary unsigned uploads for event covers, `?venue=`/`?event=` share deep links with share buttons, private per-user event memories (note + up to 6 photos, EventPanel editing + AccountPanel collection). Commits `7c55749`, `377eed6`, `a4396b2`, `91daf09`. Security-reviewed + Playwright-QA'd. See `docs/DECISIONS.md`.

**UI polish pass 1** (2026-07-17) — token normalization, panel a11y, touch targets. Commits `085dc5b`, `493534a`, `115bc0b`.
