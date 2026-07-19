# Event Times — Stan projektu

Ostatnia aktualizacja: 2026-07-19, po iteracji profilu Karnet (paleta blue/white/gray, tryb podglądu wspomnień, karta z 3D tilt) i nawigacji powrotu w panelu eventu zależnej od źródła. Utrzymuj ten plik po każdej nietrywialnej zmianie — to jedno miejsce do sprawdzenia, "co naprawdę działa teraz".

## Działa (zweryfikowane: `npm run test` 64/64, `npm run lint` czysto, `npm run build` czysto)

- Mapa + pinezki venues (Leaflet), panel venue, panel eventu, search (tryby Places/Events), filtry miasta/typu/daty, grupowanie eventów (Trwa teraz/Nadchodzące/Minione).
- Firebase Auth (email/password + Google), `venues`/`events`/akcje użytkownika oparte o Firestore, bramkowanie `admins/{uid}`, reguły Firestore — przejrzane, poprawne.
- Admin CRUD (dodawanie/edycja/usuwanie/duplikowanie venue/eventu, przesuwanie pinezki kliknięciem w mapę, import/export JSON, odświeżenie Firestore) — wszystko zaimplementowane z confirmami i stanami ładowania.
- Admin flow wyszukiwania i importu z Ticketmaster (zbudowany, ale zobacz "Zablokowane przed publicznym launchem" — niepodłączony do sekretów CI produkcji).
- Panel konta: prawdziwy activity feed + preferencje oparte o Firestore (bez mocków).
- Mobile: prawdziwe bottom-sheet treatment dla paneli (nie tylko ściśnięty desktopowy CSS), `prefers-reduced-motion` obsłużone w CSS i JS.
- CI: deploy GitHub Pages jest teraz bramkowany przez `npm run test` + `npm run lint` przed buildem (dodane w Etap A).
- Globalny React error boundary + przycisk retry przy błędzie ładowania danych (dodane w Etap A).
- Upload zdjęcia okładkowego do Cloudinary w EventForm (unsigned preset, bramkowany env; ścieżki kodu QA'd lokalnie — prawdziwy upload wymaga skonfigurowania konta Cloudinary użytkownika).
- Panel eventu pokazuje dokładnie jeden przycisk powrotu zależny od źródła (`eventOrigin: 'venue' | 'profile' | 'direct'` w `App.tsx`): "Wróć do miejsca" / "Wróć do profilu" / "Pokaż miejsce". Zweryfikowane Playwrightem dla wszystkich trzech źródeł 2026-07-19.
- Udostępnialne deep linki (`?venue=`/`?event=`) + przyciski share w obu panelach (zweryfikowane Playwrightem: auto-open po świeżym załadowaniu, sync URL, fallback schowka, nieznane ids bez szkód).
- Prywatne event memories: notatka + do 6 zdjęć per przeszły event "Byłem", edytowalne z EventPanel, listowane w profilu. Zapisane memories otwierają się w podglądzie read-only z przełącznikiem "Edytuj" (2026-07-19). Reguły wdrożone i zweryfikowane E2E 2026-07-18 (notatka zapisana i odczytana przez prawdziwy Firestore); env Cloudinary skonfigurowany lokalnie, więc uploady są aktywne w dev.
- Profil = "Karnet Event Times" (redesign 2026-07-18, przemalowany + tilt 2026-07-19): electric-blue pass card (biały tekst, barcode, 3D tilt przez `TiltCard` tylko na fine pointers) + jasnoszara kolekcja ze stat-strip tabs, polaroid memories, aktywnością w stylu paragonu. Implementacja referencyjna palety blue/white/gray (UI_RULES §2). Zweryfikowane Playwrightem na desktopie i 375px 2026-07-19. Stary bug overlapu kafelków jest strukturalnie naprawiony (zobacz DECISIONS).

## Częściowo działa / znany drift

- **Pole `status`** (`published/draft/cancelled` na eventach, `active/draft/archived` na venues) jest zapisywane przez formularze/services, ale nigdzie nieczytane w UI — martwe, nieudokumentowane pole. Wymaga decyzji: podłączyć jako prawdziwy publish workflow albo usunąć.
- **Mobilny panel admina** wizualnie jest bottom sheetem, ale funkcjonalnie identyczny z desktopem — pełny wielozakładkowy CRUD + Ticketmaster + narzędzia danych na ekranie telefonu, bez prawdziwego uproszczenia.
- **Breakpointy rozjeżdżają się z `docs/UI_RULES.md`**: kod używa 820px/1100px; pisemna zasada mówi 767/768 i 1023/1024. Obecnie nie ma prawdziwego layoutu tabletowego.
- **Dwa równoległe systemy feedbacku**: globalny `AppToast` vs. per-component inline bloki error/success (Admin/Account/Event/Venue panels, AuthModal) — nieujednolicone.
- Walidacja współrzędnych jest niespójna między `venueService.isVenue` (brak sprawdzenia zakresu lat/lng) i `googleMaps.isValidCoordinates` (sprawdza zakres).
- Escape-to-close przy otwartym search dropdownie nad panelem zamyka oba naraz (nakładają się listenery na poziomie document — ten sam istniejący wcześniej wzorzec co AccountPanel; drobne, śledzone).

## Brakuje całkowicie

- Reset hasła (flow Firebase Auth niezaimplementowany nigdzie).
- Usunięcie konta / eksport danych osobowych (istnieje tylko "clear activity").
- SEO/Open Graph/theme-color meta tags w `index.html` (obecnie zero).
- Komunikat empty-Firestore dla użytkowników niebędących adminami (obecnie tylko admin-only).

## Zablokowane przed publicznym launchem (P1)

1. Error boundary — **done** (Etap A).
2. Retry przy błędzie ładowania danych — **done** (Etap A).
3. `VITE_TICKETMASTER_API_KEY` nie jest przekazywany jako sekret w `.github/workflows/deploy.yml` — feature importu z Ticketmaster jest w pełni zbudowany, ale nieaktywny w produkcyjnym deployu GitHub Pages. Wymaga podłączenia do CI albo jawnie udokumentowanej decyzji, że zostaje tylko dev/local.
4. Flow resetu hasła.
5. SEO/OG/theme-color meta tags.
6. Skracanie opisu VenuePanel — **done** (UI polish pass, 2026-07-17): >450 znaków skraca się z Czytaj więcej/Zwiń opis, analogicznie do EventPanel.
7. Escape-to-close / `role="dialog"` na VenuePanel i EventPanel — **done** (UI polish pass, 2026-07-17). Celowo non-modal: bez `aria-modal`, bez focus trap (mapa musi pozostać dostępna); focus przenosi się do panelu po otwarciu. Pinezki mapy dostały też dostępne nazwy (`role="img"` + escaped `aria-label`).
8. Bramka test/lint w CI — **done** (Etap A).
9. Usunięcie konta / eksport danych (istotne dla GDPR w aplikacji skierowanej do PL).

## Przydatne później, nie blokuje MVP (P3)

- Deep-linking/routing.
- Modularyzacja `App.css` (obecnie 4100+ linii w jednym pliku).
- Testy komponentowe/integracyjne (dziś testy mają tylko czyste utils/model functions).
- Prawdziwy breakpoint tabletowy zgodny z `docs/UI_RULES.md`.
- Ujednolicenie AppToast vs. inline component messaging.
- Posprzątać zbędne pliki `vite-*.log` i nieużywany `public/favicon.svg`.

## Obecne priorytety

Praca idzie według etapowego planu z audytu, po jednym małym zadaniu delegowanym do Codex naraz, zweryfikowanym przed przejściem dalej. Ukończone: Etap A (stabilność), UI polish pass 1 (2026-07-17: normalizacja design tokens — 22 ad-hoc radii/one-off shadows/zbędne grays sprowadzone do tokenów z dwoma nowymi tokenami zachowującymi hierarchię cienia CTA; parytet skracania VenuePanel; semantyka dialogów paneli; nazwy a11y pinezek; touch targets ≥40px; minimum 14px dla tekstu kart; chevrons nagłówków grup; `text-wrap: balance` na tytułach paneli). Następnie według `docs/ROADMAP.md`: Etap B (gotowość do publicznego launchu: SEO meta, decyzja sekretu CI Ticketmaster, porządki w repo).

## Obowiązujące decyzje architektoniczne

Zobacz pełny log w `docs/DECISIONS.md`. Najważniejsze: Firestore jest źródłem prawdy dla danych (localStorage tylko jako fallback), admin opiera się wyłącznie na dokumencie Firestore, współrzędne są provider-agnostic `{lat,lng}`, status eventu jest zawsze liczony dynamicznie, free-first (bez płatnych usług Firebase/Maps).
