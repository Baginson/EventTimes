# Event Times — Architektura

Utrwalone źródło prawdy dla stacku i modelu danych. (Oryginalna specyfikacja planistyczna, `EVENT_TIMES_SPEC.md`, została scalona z tym plikiem i usunięta 2026-07-16 — w razie potrzeby da się ją odzyskać z historii git w `4edf906`.)

## Wizja produktu

Event Times to interaktywna mapa wydarzeń: pozwala odkrywać ciekawe miejsca i eventy, planować udział oraz wracać do tego, gdzie użytkownik już był — własna historia eventów użytkownika ("Byłem", aktywność) jest jednym z głównych filarów produktu, a nie dodatkiem. Esencja marki: **"Odkrywaj. Przeżywaj. Wracaj."** Długoterminowo produkt jest skierowany do trzech grup — uczestników (znajdowanie/planowanie/pamiętanie), organizatorów (promocja eventów) i venues (widoczność) — ale obecne MVP obsługuje uczestników, a organizatorzy/venues są reprezentowani tylko przez dane zarządzane przez admina.

## Stack

- React 19 + TypeScript + Vite 8, aplikacja single-page (bez routera — stan paneli żyje w `App.tsx`, bez deep linków na poziomie routera).
- Leaflet / react-leaflet do mapy.
- Firebase Auth (email/hasło + reset, Google, GitHub, logowanie nazwą użytkownika przez Worker) i Cloud Firestore dla danych.
- Hosting na GitHub Pages, base path `/EventTimes/` (`vite.config.ts`).
- Vitest do testów jednostkowych, oxlint do lintowania. Brak zainstalowanej biblioteki do testów komponentów.
- Free-first: bez Cloud Functions, bez Firebase Storage, bez płatnego Google Maps/Places API.

## Zakres projektu

Pierwsza wersja obejmuje Leszno i okolice — typowe miejsca: MOK Leszno, Hala Trapez, Stadion im. Alfreda Smoczyka, Rynek, Lotnisko Leszno, plus typy ogólne (aula, sala koncertowa, plener, teatr, klub). Model danych jest niezależny od miasta (pole `city` na `Venue`), a długoterminowy kierunek to wiele miast ("cały świat na mapie" zgodnie z posterem marki), ale wybór miasta w UI jest obecnie pojedynczą, zahardkodowaną opcją (`src/components/CityFilter.tsx`) do czasu wsparcia wielu miast.

## Model danych (tak jak jest zaimplementowany — zobacz `docs/DECISIONS.md` dla rozjazdu spec-vs-code, który to prostuje)

Typy `Venue` i `EventTimesEvent` znajdują się w `src/data/mockVenues.ts` / `src/data/mockEvents.ts` (to także źródło danych fallback/seed — zobacz niżej).

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

Współrzędne zawsze mają format `{ lat, lng }`. Konwersja na kolejność tablicy Leafleta `[lat, lng]` jest odizolowana wyłącznie w `src/components/EventMap.tsx` — nigdy w services/utils/models. Dzięki temu model danych można później przepiąć na innego providera mapy bez ruszania danych venue/eventów.

Status eventu (`upcoming` / `ongoing` / `past`) jest zawsze liczony w czasie renderowania przez `getEventStatus()` (`src/utils/eventStatus.ts`), nigdy zapisywany jako literal. Zasady brzegowe: event bez `endDate` jest oceniany tylko po `startDate`; event z zakresem dat jest oceniany po przecięciu zakresu z "teraz"; przeszły event pozostaje poprawnymi danymi (archiwum, nadal pokazywany pod "Minione"). Brak `startTime`/`endTime` oznacza, że UI pokazuje tylko datę, nigdy fałszywe `00:00`.

## Firestore

Kolekcje: `venues`, `events` (publiczny odczyt, zapis tylko dla admina), `users/{uid}` + `users/{uid}/eventActions/{eventId}` + `users/{uid}/venueActions/{venueId}` + `users/{uid}/eventMemories/{eventId}` (wszystkie tylko dla właściciela), `admins/{uid}` (tylko get dla bieżącego użytkownika, nigdy listowanie). Reguły w `firestore.rules` dokładnie temu odpowiadają — zostały przejrzane i potwierdzone jako poprawne. Zmiany reguł trzeba wdrażać ręcznie w Firebase Console (brak deployu reguł w CI).

`eventMemories/{eventId}` to prywatna, per-user pamiątka z przeszłego eventu: `{ eventId, venueId, note (≤2000 chars), photos: MemoryPhoto[] (≤6: { id, url, publicId?, createdAt }), createdAt, updatedAt }` — service layer w `src/services/memoryService.ts`. Ściśle prywatne: bez collection-group queries, reguły tylko dla właściciela, inni użytkownicy nigdy nie mogą ich czytać.

## Upload obrazów (Cloudinary)

Free-first oznacza brak Firebase Storage i brak Cloud Functions, więc uploady obrazów użytkownika/admina idą browser→Cloudinary przez **unsigned upload preset** (`src/services/cloudinaryService.ts`): bramkowane przez `VITE_CLOUDINARY_CLOUD_NAME` + `VITE_CLOUDINARY_UPLOAD_PRESET` (oba to bezpieczne do ujawnienia identyfikatory; w kliencie nie ma API secret — usuwanie jest więc niemożliwe z aplikacji, a zastąpione obrazy po prostu zostają w Cloudinary). Używane przez: upload zdjęcia okładkowego w EventForm (zapisuje `secure_url` do istniejącego pola `imageUrl`) oraz zdjęcia w event memories. Wgrane URL-e są public-by-obscurity (każdy mający URL może zobaczyć obraz) — Firestore chroni listing, nie asset w CDN. Ogranicz preset w panelu Cloudinary (folder, formaty, maksymalny rozmiar) jako defense-in-depth.

## Deep linki i udostępnianie

Brak routera — `src/App.tsx` czyta `?venue=<id>` / `?event=<id>` raz po początkowym załadowaniu danych i otwiera pasujący panel; otwarcie/zamknięcie panelu odzwierciedla stan z powrotem w URL przez `history.replaceState` (bez zarządzania back-stack). `src/utils/shareLinks.ts` buduje absolutne URL-e do udostępniania na bazie `BASE_URL` i opakowuje `navigator.share` fallbackiem do schowka; oba panele pokazują akcję udostępniania jako ikonę (widoczną także dla niezalogowanych).

Status admina opiera się wyłącznie na dokumencie Firestore (`admins/{uid}` existence), nigdy na emailu ani haśle po stronie klienta.

## Service layer

Dane publiczne (`venueService`, `eventService`) stosują wzorzec Firestore-primary z fallbackiem localStorage: jeśli `db` (`src/lib/firebase.ts`) jest skonfigurowane, czytają/zapisują Firestore; jeśli nie (`VITE_FIREBASE_*` env vars nie istnieją), przechodzą na `localStorage`, seedowane przy pierwszym użyciu z `mockVenues`/`mockEvents`. Mockowe współrzędne są przybliżone — dane wyłącznie do UI-dev, nie do wysyłki.

Serwisy per-użytkownik i admina (`userActionService`, `memoryService`, `userProfileService`, `adminService`) **wymagają Firebase**: używają lokalnego `requireDb()` i rzucają czytelny błąd, gdy `db` nie istnieje (brak fallbacku localStorage — akcje, wspomnienia, profil i bramkowanie admina nie mają sensu bez zalogowanego użytkownika). Produkcja stoi na Firebase, więc to jest ścieżka docelowa. `requireDb()` jest dziś zduplikowany w tych czterech serwisach — konsolidacja zaplanowana w Etapie F. `ticketmasterService`/`travelTimeService` idą przez Cloudflare Worker; `localBackupService` to import/eksport JSON w localStorage.

## Mapa i geo

`src/components/EventMap.tsx` renderuje venues jako markery Leafleta: Deep Navy domyślnie, Electric Blue dla wybranego/aktywnego, bez numerowanych bąbli klastrów jako głównego rozwiązania. `src/utils/geo.ts` / `src/utils/venueDisplay.ts` / `src/utils/googleMaps.ts` obsługują dystans, formatowanie adresu (zasady prefiksu `ul.`) i walidację współrzędnych — oddzielone od warstwy renderowania mapy.

## Auth i konto

`src/auth/AuthProvider.tsx` opakowuje Firebase Auth: e-mail/hasło (logowanie, rejestracja, reset), OAuth przez rejestr providerów w `src/auth/authProviders.ts` (Google, GitHub — kolejni provideri dochodzą przez rozszerzenie rejestru) oraz łączenie kont: pending credential po `auth/account-exists-with-different-credential` jest dowiązywany `linkWithCredential` po potwierdzeniu dostępu do dotychczasowej metody (nigdy po samej zgodności e-maila), `linkPassword` (wymaga zweryfikowanego e-maila), `linkProvider`/`unlinkProvider` z blokadą odłączenia ostatniej metody. Jeden użytkownik = jeden `uid` = jeden dokument `users/{uid}` niezależnie od metody logowania. Logowanie nazwą użytkownika: pole „E-mail lub nazwa użytkownika" w `AuthModal` rozstrzyga po `@` (`src/utils/username.ts`), nazwy rozwiązuje Worker (`src/services/usernameService.ts`) — mapa nazw żyje w Cloudflare KV, a e-mail jest zwracany dopiero po zweryfikowaniu hasła w Firebase (szczegóły i pakiet Workera: `docs/AUTH_SETUP.md`). **Nazwa użytkownika jest obowiązkowa (decyzja 2026-07-21)**: `AuthProvider` wystawia `needsUsername` (Firestore `users/{uid}.username` puste → `true`), a `App.tsx` renderuje ponad wszystkim niedomykalny `src/components/UsernameGate.tsx` dla każdego zalogowanego konta bez nazwy — dotyczy jednolicie e-mail/hasła, Google, GitHuba, i retroaktywnie kont sprzed tej zmiany. **Nazwa wyświetlana (Firebase `displayName`) i nazwa użytkownika są scalone w jedno (decyzja 2026-07-21, tego samego dnia)** — osobne pole „Nazwa wyświetlana" nie istnieje już w edycji profilu; jedyne pole tożsamości w „Podstawowych danych" jest walidowane regułami nazwy użytkownika (`isValidUsername`) i po zapisie synchronizuje `displayName` na tę samą wartość (`saveProfile()` w `AccountPanel.tsx`, oraz `UsernameGate` przy pierwszym ustawieniu). Karnet (czyta `currentUser.displayName`) pokazuje więc techniczny handle, nie swobodne imię i nazwisko — świadomy wybór produktowy. Zmiana nazwy później nadal żyje w widoku edycji profilu (osobna sekcja w „Metody logowania" została usunięta jako zbędna po scaleniu). `src/components/AccountPanel.tsx` pokazuje activity feed + preferencje oparte o Firestore (prawdziwe dane, bez mocków). Akcje użytkownika (`Polubione`, `Chcę iść`, `Byłem`) żyją w `users/{uid}/eventActions` / `venueActions`, są scope'owane i walidowane zarówno po stronie klienta, jak i przez reguły Firestore.

## Panel admina

`src/components/AdminPanel.tsx` + `AdminEventsSection` / `AdminDataSection` / `EventForm` / `VenueForm` / `TicketmasterImportSection` obejmują CRUD venues/eventów, ustawianie pinezki kliknięciem w mapę, import/export JSON oraz flow wyszukiwania i importu z Ticketmaster (`src/services/ticketmasterService.ts`). Wszystkie akcje destrukcyjne są za `window.confirm`.

## Backend (Cloudflare Worker)

Frontend rozmawia z backendem `eventtimes-api` na Cloudflare Workers przez `VITE_EVENTTIMES_API_URL` (repo Workera jest osobne; nie zmieniamy go stąd). Wspólna baza URL i błąd konfiguracji żyją w `src/services/eventTimesApi.ts`. Endpointy: `GET /api/ticketmaster/events` i `GET /api/ticketmaster/events/:eventId` (proxy Discovery API — klucz Ticketmaster jest sekretem Workera, frontend go nie zna; Worker forwarduje parametry zapytania i dokłada `countryCode=PL`), `POST /api/travel-time` (Geoapify — czas i dystans dojazdu; klucz Geoapify też żyje tylko w Workerze) oraz `POST /api/auth/username-login` i `POST /api/auth/username` (logowanie/rejestracja nazwy użytkownika: mapa nazw w Cloudflare KV `AUTH_KV`, weryfikacja Firebase ID tokena przez JWKS, rate limiting, e-mail ujawniany dopiero po poprawnym haśle — pełny pakiet zmian: `docs/AUTH_SETUP.md`). Worker ma allowlistę CORS originów: `http://localhost:5173` i `https://baginson.github.io`. Sekcja „Dojazd" (`src/components/TravelTimeSection.tsx` + `src/hooks/useTravelTime.ts` + `src/services/travelTimeService.ts`) pobiera lokalizację użytkownika wyłącznie po kliknięciu i trzyma ją tylko w pamięci komponentu — nigdy w Firestore, storage, URL ani logach.

## Mobile

Jeden główny breakpoint na 820px (`usePanelMotion.ts` i `App.css` są zgodne) przełącza panele venue/event/admin z pływających desktopowych kart na bottom sheets, przechodząc w full-screen poniżej 767px. `MobileBottomBar.tsx` to mobilny punkt wejścia do search/profil/admin. `prefers-reduced-motion` jest respektowane zarówno w CSS, jak i w hooku animacji paneli opartym o framer-motion.
