# Event Times — Agent Rules

Short, load-bearing rules for every agent working in this repo (Claude Code, Codex, ChatGPT, or anyone else). Detail lives in `docs/` — this file is the index of things that must never be violated.

## What this is

Event Times — mapowa aplikacja do odkrywania miejsc i wydarzeń (React + Vite + TypeScript + Leaflet + Firebase Auth + Firestore + GitHub Pages). Free-first: no Cloud Functions, no Firebase Storage, no paid Google Maps/Places API. Does not sell tickets — "Kup bilet" always redirects externally.

## Non-negotiable rules

- **Admin** is determined only by the existence of `admins/{uid}` in Firestore. Never by email, never by a client-side password, never `VITE_ADMIN_EMAIL`. Never `getDocs(collection(db, 'admins'))` or any list/query on `admins` — only `getDoc` on the current user's own uid.
- **Secrets**: never write API keys, passwords, or tokens into source files or commit them. `VITE_TICKETMASTER_API_KEY` and all `VITE_FIREBASE_*` keys live only in a local, non-committed env file and in GitHub Actions Secrets.
- **Coordinates** are always `{ lat: number, lng: number }` on the data model. Leaflet-specific `[lat, lng]` array conversion stays isolated inside the map-adapter layer (`src/components/EventMap.tsx`), never in services/utils/models.
- **Event status** (`upcoming`/`ongoing`/`past`) is always computed dynamically (`getEventStatus`), never stored as a literal field.
- No `00:00` shown for events without an explicit time.
- The `Zainteresowany` (interested) user action does not exist and must not be reintroduced. Current actions: `Polubione`, `Chcę iść` (upcoming only), `Byłem` (past only).
- `Kup bilet` shows only for non-past events with a `ticketUrl`.
- GitHub Pages base path is `/EventTimes/` (see `vite.config.ts`) — don't break `public/` asset paths.
- Firestore rules (`firestore.rules`) are the real security boundary — never rely on hiding a button in the UI as the only protection for an admin-only action.

## Typography (see `docs/UI_RULES.md` for full rules)

Bungee = large headings/brand only. IBM Plex Sans = descriptions/body text. Inter = buttons/chips/filters/small controls. Never switch the whole app to one font.

## Before calling a task done

Run and confirm all three pass:
```bash
npm run test
npm run lint
npm run build
```

## Don't, without an explicit ask first

Force-push, `git reset --hard`, delete a working feature, restructure the core architecture or Firestore data model, swap Leaflet or Firebase for something else, add a paid service, install a dependency globally, touch `firestore.rules` casually, or push/merge to `main` unsupervised.

## Where to look for more

- `docs/ARCHITECTURE.md` — stack, data model, service layer, Firebase structure.
- `docs/UI_RULES.md` — full design system (color, type, panels, motion, a11y).
- `docs/PROJECT_STATE.md` — what currently works, what's partial, known issues, priorities.
- `docs/DECISIONS.md` — why things are the way they are.
- `docs/ROADMAP.md` — staged plan for what's next.
- `graphify-out/` — queryable knowledge graph of the codebase (`graphify query "<question>"`).

`docs/design-references/` (local-only, gitignored) holds visual reference images for the brand direction; `docs/UI_RULES.md` §1 summarizes them for machines without the folder. The older local-only planning notes (`CODEX_INSTRUCTIONS.md`, `EVENT_TIMES_SPEC.md`, `docs/EVENT_TIMES_UI_RULES.md`) were consolidated into `docs/` and removed on 2026-07-16 — if a stray copy of one of them appears on some machine, ignore it; `docs/` is the only source of truth.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
