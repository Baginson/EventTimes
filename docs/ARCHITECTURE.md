# Event Times — Architecture

Committed source of truth for stack and data model. (The original planning spec, `EVENT_TIMES_SPEC.md`, was consolidated into this file and removed on 2026-07-16 — recoverable from git history at `4edf906` if ever needed.)

## Product vision

Event Times is an interactive map of events: discover interesting places and events, plan attendance, and return to what you've been to — the user's own event history ("Byłem", activity feed) is a core product pillar, not an afterthought. Brand essence: **"Odkrywaj. Przeżywaj. Wracaj."** Long-term the product aims at three audiences — participants (find/plan/remember), organizers (promote events), and venues (visibility) — but the current MVP serves participants, with organizers/venues represented only through admin-managed data.

## Stack

- React 19 + TypeScript + Vite 8, single-page app (no router — panel state lives in `App.tsx`, no deep-linking yet).
- Leaflet / react-leaflet for the map.
- Firebase Auth (email/password + Google) and Cloud Firestore for data.
- GitHub Pages hosting, base path `/EventTimes/` (`vite.config.ts`).
- Vitest for unit tests, oxlint for linting. No component-testing library installed.
- Free-first: no Cloud Functions, no Firebase Storage, no paid Google Maps/Places API.

## Project scope

First version covers Leszno and the surrounding area — typical venues: MOK Leszno, Hala Trapez, Stadion im. Alfreda Smoczyka, Rynek, Lotnisko Leszno, plus generic types (aula, sala koncertowa, plener, teatr, klub). The data model is city-agnostic (`city` field on `Venue`), and the long-term direction is multi-city ("cały świat na mapie" per the brand poster), but city selection in the UI is currently a single hardcoded option (`src/components/CityFilter.tsx`) pending multi-city support.

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

Event status (`upcoming` / `ongoing` / `past`) is always computed at render time via `getEventStatus()` (`src/utils/eventStatus.ts`), never stored as a literal. Edge rules: an event with no `endDate` is judged by `startDate` alone; a date-range event is judged by range overlap with "now"; a past event stays valid data (archive, still shown under "Minione"). Missing `startTime`/`endTime` means the UI shows a date only, never a fake `00:00`.

## Firestore

Collections: `venues`, `events` (public read, admin-only write), `users/{uid}` + `users/{uid}/eventActions/{eventId}` + `users/{uid}/venueActions/{venueId}` + `users/{uid}/eventMemories/{eventId}` (all owner-only), `admins/{uid}` (get-only for the current user, never listable). Rules in `firestore.rules` match this exactly — reviewed and confirmed correct. Rules changes must be deployed manually in the Firebase Console (no CI deploy for rules).

`eventMemories/{eventId}` is the private per-user memory of a past event: `{ eventId, venueId, note (≤2000 chars), photos: MemoryPhoto[] (≤6: { id, url, publicId?, createdAt }), createdAt, updatedAt }` — service layer in `src/services/memoryService.ts`. Strictly private: no collection-group queries, owner-only rules, other users can never read them.

## Image uploads (Cloudinary)

Free-first means no Firebase Storage and no Cloud Functions, so user/admin image uploads go browser→Cloudinary via an **unsigned upload preset** (`src/services/cloudinaryService.ts`): gated by `VITE_CLOUDINARY_CLOUD_NAME` + `VITE_CLOUDINARY_UPLOAD_PRESET` (both safe-to-expose identifiers; no API secret in the client — deletes are therefore impossible from the app, replaced images simply remain in Cloudinary). Used by: EventForm cover-photo upload (writes `secure_url` into the existing `imageUrl` field) and event-memory photos. Uploaded URLs are public-by-obscurity (anyone holding the URL can view the image) — Firestore protects the listing, not the CDN asset. Restrict the preset in the Cloudinary dashboard (folder, formats, max size) as defense-in-depth.

## Deep links & sharing

No router — `src/App.tsx` reads `?venue=<id>` / `?event=<id>` once after the initial data load and opens the matching panel; panel open/close mirrors state back into the URL via `history.replaceState` (no back-stack management). `src/utils/shareLinks.ts` builds absolute share URLs on top of `BASE_URL` and wraps `navigator.share` with a clipboard fallback; both panels expose a share icon action (visible logged-out too).

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
