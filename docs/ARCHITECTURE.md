# Event Times — Architecture

Committed source of truth for stack and data model. Supersedes the older, gitignored `EVENT_TIMES_SPEC.md` where the two disagree (this file is kept current; that one is not).

## Stack

- React 19 + TypeScript + Vite 8, single-page app (no router — panel state lives in `App.tsx`, no deep-linking yet).
- Leaflet / react-leaflet for the map.
- Firebase Auth (email/password + Google) and Cloud Firestore for data.
- GitHub Pages hosting, base path `/EventTimes/` (`vite.config.ts`).
- Vitest for unit tests, oxlint for linting. No component-testing library installed.
- Free-first: no Cloud Functions, no Firebase Storage, no paid Google Maps/Places API.

## Project scope

First version covers Leszno and the surrounding area. The data model is city-agnostic (`city` field on `Venue`), but city selection in the UI is currently a single hardcoded option (`src/components/CityFilter.tsx`) pending multi-city support.

## Data model (as implemented — see `docs/DECISIONS.md` for the spec-vs-code drift this corrects)

`Venue` and `EventTimesEvent` types live in `src/data/mockVenues.ts` / `src/data/mockEvents.ts` (also the fallback/seed data source — see below).

```ts
type Venue = {
  id: string
  name: string                // required in code (spec had it optional)
  slug?: string
  city: string
  country?: string
  address: string
  venueType: string
  type?: string                // legacy/alt field, folded into venueType by normalizeVenue()
  category?: string            // legacy/alt field, folded into venueType by normalizeVenue()
  coordinates: { lat: number; lng: number }
  capacity?: number
  description: string          // required in code (spec had it optional)
  googleMapsUrl?: string
  websiteUrl?: string
  imageUrl?: string
  images?: MediaImage[]
  status?: 'active' | 'draft' | 'archived'   // written by forms/services, not read anywhere in UI — see DECISIONS.md
  createdAt?: string
  updatedAt?: string
}

type EventTimesEvent = {
  id: string
  venueId: string
  name: string
  title?: string                // legacy/alt field, folded into name by normalizeEvent()
  slug?: string
  eventType: string
  category?: string             // legacy/alt field, folded into eventType by normalizeEvent()
  description: string           // required in code (spec had it optional)
  startDate: string
  endDate?: string
  startTime?: string             // composed into startDate's ISO time by EventForm
  endTime?: string
  ticketUrl?: string
  sourceUrl?: string
  imageUrl?: string
  images?: MediaImage[]
  organizer?: string
  isPromoted?: boolean
  status?: 'published' | 'draft' | 'cancelled'   // written, not read anywhere in UI — see DECISIONS.md
  externalIds?: { ticketmaster?: string }        // Ticketmaster import dedupe key
  createdAt?: string
  updatedAt?: string
}
```

Coordinates are always `{ lat, lng }`. Leaflet's `[lat, lng]` array order conversion is isolated inside `src/components/EventMap.tsx` only — never in services/utils/models. This keeps the data model swappable to a different map provider later without touching venue/event data.

Event status (`upcoming` / `ongoing` / `past`) is always computed at render time via `getEventStatus()` (`src/utils/eventStatus.ts`), never stored as a literal. Missing `startTime`/`endTime` means the UI shows a date only, never a fake `00:00`.

## Firestore

Collections: `venues`, `events` (public read, admin-only write), `users/{uid}` + `users/{uid}/eventActions/{eventId}` + `users/{uid}/venueActions/{venueId}` (owner-only), `admins/{uid}` (get-only for the current user, never listable). Rules in `firestore.rules` match this exactly — reviewed and confirmed correct.

Admin status is Firestore-doc-based only (`admins/{uid}` existence), never email- or client-side-password-based.

## Service layer

`src/services/*.ts` (`venueService`, `eventService`, `adminService`, `userProfileService`, `userActionService`, `ticketmasterService`, `localBackupService`) all follow the same pattern: if `db` (`src/lib/firebase.ts`) is configured, read/write Firestore; if not (`VITE_FIREBASE_*` env vars missing), fall back to `localStorage`, seeded from `mockVenues`/`mockEvents` on first use. This fallback is a real runtime path (any deployment without Firebase env vars hits it), not just a test fixture — the mock coordinates are flagged approximate in a comment and should be treated as UI-dev-only data, not shipped as real venue data.

## Map & geo

`src/components/EventMap.tsx` renders venues as Leaflet markers: Deep Navy default, Electric Blue selected/active, no numbered cluster bubbles. `src/utils/geo.ts` / `src/utils/venueDisplay.ts` / `src/utils/googleMaps.ts` handle distance, address formatting (`ul.` prefix rules), and coordinate validation — kept separate from the map-rendering layer.

## Auth & account

`src/auth/AuthProvider.tsx` wraps Firebase Auth (email/password, Google sign-in; no password reset yet — see `docs/PROJECT_STATE.md`). `src/components/AccountPanel.tsx` shows a Firestore-backed activity feed + preferences (real data, no mocks). User actions (`Polubione`, `Chcę iść`, `Byłem`) live in `users/{uid}/eventActions` / `venueActions`, scoped and validated both client-side and by Firestore rules.

## Admin panel

`src/components/AdminPanel.tsx` + `AdminEventsSection` / `AdminDataSection` / `EventForm` / `VenueForm` / `TicketmasterImportSection` cover venue/event CRUD, pin placement by map click, JSON import/export, and a Ticketmaster search-and-import flow (`src/services/ticketmasterService.ts`, gated by `VITE_TICKETMASTER_API_KEY`). All destructive actions are behind `window.confirm`. See `docs/PROJECT_STATE.md` for known gaps (e.g. this feature is currently undocumented and not wired into the production CI secrets).

## Mobile

Single primary breakpoint at 820px (`usePanelMotion.ts` and `App.css` agree) switches venue/event/admin panels from floating desktop cards to bottom sheets, escalating to full-screen below 767px. `MobileBottomBar.tsx` is the mobile entry point for search/profile/admin. `prefers-reduced-motion` is respected in both CSS and the framer-motion panel-motion hook.
