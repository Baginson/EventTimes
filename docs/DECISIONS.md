# Event Times — Log decyzji

Chronologiczny zapis decyzji, które kształtują projekt, wraz z ich uzasadnieniem. Dopisuj nowe wpisy na końcu; nie przepisuj historii — jeśli decyzja zostaje odwrócona, dodaj nowy wpis, który ją zastępuje, i napisz to wprost.

## 2026-07-09 — Firestore jako źródło prawdy dla danych publicznych

**Decyzja**: `venues`/`events` są czytane z Cloud Firestore i zapisywane do Cloud Firestore; `localStorage` staje się tylko fallbackiem (używanym, gdy brakuje env vars `VITE_FIREBASE_*`) oraz lokalnym mechanizmem backup/import-export.
**Dlaczego**: Oryginalny model wyłącznie na localStorage nie mógł obsłużyć wspólnego, publicznie edytowalnego datasetu zarządzanego przez prawdziwego admina.
**Status**: Obowiązuje. `src/services/venueService.ts` / `eventService.ts` spójnie implementują wzorzec Firestore-primary / localStorage-fallback.

## 2026-07-09 — Tożsamość admina wyłącznie przez dokument Firestore `admins/{uid}`

**Decyzja**: Status admina nigdy nie opiera się na emailu, haśle po stronie klienta ani `VITE_ADMIN_EMAIL`. Wynika z istnienia dokumentu Firestore pod `admins/{uid}`, sprawdzanego przez `getDoc` (nigdy `getDocs`/list) dla uid bieżącego użytkownika, a Firestore Rules są realną warstwą egzekwowania, nie ukrywanie UI.
**Dlaczego**: "Bezpieczeństwo" po stronie klienta (ukryte przyciski, zahardkodowane emaile) da się trywialnie obejść; publiczne repo nie może zawierać danych admina.
**Status**: Obowiązuje. Zweryfikowane w `firestore.rules` i `src/services/adminService.ts`.

## (sprzed tego logu) — Współrzędne jako provider-agnostic `{lat, lng}`

**Decyzja**: Lokalizacja venue w modelu danych zawsze ma format `{ lat: number, lng: number }`. Wymagana przez Leaflet kolejność tablicy `[lat, lng]` jest konwertowana tylko wewnątrz komponentu renderującego mapę, nigdy w services/utils/models.
**Dlaczego**: Leaflet jest pierwszą używaną biblioteką mapową, nie stałym zobowiązaniem — aplikacja powinna móc później zmienić providera mapy bez migracji danych.
**Status**: Obowiązuje, zweryfikowane jako czyste podczas audytu 2026-07-16 (nie znaleziono wycieku poza `EventMap.tsx`).

## (sprzed tego logu) — Status eventu liczony dynamicznie, nigdy zapisywany

**Decyzja**: `upcoming`/`ongoing`/`past` jest zawsze wyprowadzane z dat przez `getEventStatus()`, nigdy zapisywane jako literalne pole.
**Dlaczego**: Zapisane pole statusu rozjeżdża się z rzeczywistością (event po dacie zostaje po cichu "upcoming"), chyba że coś aktywnie je aktualizuje; liczenie zawsze daje poprawny wynik.
**Status**: Obowiązuje. Uwaga: w modelu danych istnieje też *inne*, ortogonalne pole `status` (`published`/`draft`/`cancelled` dla eventów, `active`/`draft`/`archived` dla venues), zapisywane przez formularze/services, ale nigdzie nieczytane w UI — wygląda jak porzucony publish-workflow feature, nie naruszenie tej decyzji, ale wymaga follow-up decision (podłączyć albo usunąć — śledzone w `docs/PROJECT_STATE.md`).

## 2026-07-11 — Szczegółowe dokumenty spec/instruction trzymane jako local-only

**Decyzja**: `CODEX_INSTRUCTIONS.md`, `EVENT_TIMES_SPEC.md`, `docs/EVENT_TIMES_UI_RULES.md`, `docs/design-references/` są gitignored — prywatne notatki robocze, nie część historii repo.
**Dlaczego**: (zgodnie z konfiguracją; pierwotne uzasadnienie nie zostało zapisane przed tym logiem — prawdopodobnie po to, by trzymać wczesne/nieoszlifowane dokumenty planistyczne poza publicznym repo).
**Status**: W praktyce zastąpione od 2026-07-16 — zobacz kolejny wpis. Same pliki pozostają gitignored i nietknięte.

## 2026-07-16 — Commitowane `docs/` staje się utrzymywanym źródłem prawdy

**Decyzja**: Utworzono `docs/ARCHITECTURE.md`, `docs/UI_RULES.md`, `docs/PROJECT_STATE.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md` jako commitowany, utrzymywany na bieżąco zestaw dokumentacji. Gdy nie zgadzają się ze starszymi gitignored local-only files, wygrywa `docs/`.
**Dlaczego**: Local-only files rozjechały się z faktyczną implementacją (np. typom `Venue`/`Event` w `EVENT_TIMES_SPEC.md` brakowało po ~7 pól istniejących w kodzie; feature importu z Ticketmaster nie był nigdzie udokumentowany). Commitowany zestaw dokumentów czytelny dla agentów i ludzi, będący częścią normalnego review flow, ma mniejsze ryzyko zgnicia.
**Status**: Obowiązuje.

## 2026-07-16 — Etap A: pass stabilności przed dalszą pracą nad funkcjami

**Decyzja**: Przed dodawaniem czegokolwiek nowego domknąć trzy największe luki stabilności znalezione w pełnym audycie: brak error boundary (każdy błąd renderowania robił white-screen aplikacji), brak retry po nieudanym początkowym fetchu Firestore oraz brak bramki test/lint w CI deployu GitHub Pages (regresja mogła trafić na produkcję po cichu).
**Dlaczego**: To fundamenty — budowanie kolejnych funkcji na aplikacji, która może zrobić white-screen przez dowolny bug, albo deployowanie bez istniejącego test suite, zwiększa ryzyko zamiast je zmniejszać.
**Status**: Zaimplementowane i zweryfikowane (`npm run test`/`lint`/`build` przechodzą). Zobacz `src/components/ErrorBoundary.tsx`, przycisk retry w data-error bannerze `App.tsx` i `.github/workflows/deploy.yml`.

## 2026-07-16 — Legacy planning docs scalone i usunięte

**Decyzja**: `CODEX_INSTRUCTIONS.md`, `EVENT_TIMES_SPEC.md` i `docs/EVENT_TIMES_UI_RULES.md` (local-only, gitignored planning notes) zostały usunięte po scaleniu ich pozostałej unikalnej treści z commitowanym zestawem `docs/`: przykłady venues, wizja produktu i zasady brzegowe statusu eventów do `docs/ARCHITECTURE.md`; esencja marki (z `docs/design-references/`), enumeracja filtra daty searcha i zasada dwóch trybów searcha do `docs/UI_RULES.md`. Ich wpisy w `.gitignore` celowo zostały zachowane, żeby nie dało się przypadkiem zacommitować starej kopii z innej maszyny. Ostatnie śledzone wersje da się odzyskać z historii git (usunięte ze śledzenia w `37205a2`; treść w `4edf906`).
**Dlaczego**: Trzy nakładające się i rozjeżdżające rulebooki oznaczały, że agenci mogli dostawać sprzeczne instrukcje zależnie od tego, który plik przeczytali (model danych w specu był ~7 pól za kodem). Jedno utrzymywane źródło prawdy (`docs/`) usuwa ten failure mode.
**Status**: Obowiązuje. `docs/design-references/` (obrazy + README) zostaje jako local-only visual reference; `docs/UI_RULES.md` §1 niesie jego streszczenie dla maszyn bez tego folderu.

## 2026-07-17 — UI polish pass 1: stylowanie tokens-first, non-modal panel dialogs

**Decyzja**: (1) Wszystkie radii/shadows/text-grays w `App.css` zostały sprowadzone do skali tokenów w `:root` — zahardkodowane wartości one-off nie są już akceptowalne w nowym CSS; dwa nowe tokeny cienia (`--shadow-button-soft`, `--shadow-cta`) dodano konkretnie dlatego, że naiwne scalenie spłaszczyłoby hierarchię cieni CTA (wyłapane w code review). (2) VenuePanel/EventPanel mają `role="dialog"` z Escape-to-close i focus-on-open, ale celowo są NON-modal — bez `aria-modal`, bez focus trap — bo mapa musi pozostać osiągalna za otwartym panelem (w przeciwieństwie do AuthModal/AccountPanel, które są prawdziwymi modalami z trapami). (3) Pinezki mapy wystawiają nazwy venues przez `role="img"` + HTML-escaped `aria-label` w markup divIcon (escaping dodany, bo nazwy przychodzą z Firestore i trafiają do surowego stringa HTML).
**Dlaczego**: Audyt sprzed redesignu wykazał, że rdzeń marki (podział typografii, kolory pinezek, pływające panele, dyscyplina searcha) był poprawnie zaimplementowany, a jakość ginęła w mikro-drifcie: 22 ad-hoc radii, ~10 one-off shadows, 4 konkurujące text grays, niewidoczne affordances zwijania, touch targets poniżej 40px, tekst kart poniżej 14px. Tokens-first + małe, celowane poprawki zachowują działającą tożsamość bez ryzykownego rewrite'u.
**Status**: Obowiązuje. Commity `085dc5b`, `493534a`, `115bc0b`. Zweryfikowane: 64/64 testów, lint, build, per-task code review, przejścia Playwright przed/po.

## 2026-07-18 — Profil przeprojektowany jako "Karnet Event Times"

**Decyzja**: Panel konta to jeden ekran, który w pełni przyjmuje język marki z posteru: granatowa karta przepustki uczestnika (żółta naklejka wordmark, imię Bungee, przyklejone zdjęcie, barcode w CSS) obok kremowej kolumny kolekcji, gdzie pasek statystyk Bungee z perforowanymi separatorami biletowymi działa jako tabs, memories renderują się jako przechylony pasek polaroidów, a ostatnia aktywność jako przerywany paragon. To celowo idzie dalej niż konserwatywne domyślne zasady `docs/UI_RULES.md` (creative license zaakceptowana przez użytkownika); mapa/search/panele zostają spokojniejsze.
**Dlaczego**: Stary dashboard był generyczną siatką SaaS z realnym bugiem layoutu — flexbox kompresował shrinkable activity grid wewnątrz scroll containera, malując cztery kafelki na sekcjach memories/recent. Layout tab-strip całkowicie usuwa klasę tego błędu (kolumny scrolla używają teraz dzieci z `flex-shrink: 0`) i daje profilowi tożsamość "twoja historia wydarzeń" z posteru produktu.
**Status**: Obowiązuje. Commit `47df5cd`, zweryfikowane live desktop+mobile kontem QA (`qa.claude.eventtimes@example.com` — usunąć albo zostawić do testów).

## 2026-07-17 — Cloudinary unsigned uploads, deep linki URL-param, prywatne memories

**Decyzja**: (1) Uploady obrazów używają **unsigned upload presets** Cloudinary bezpośrednio z przeglądarki — jedyny model uploadu zgodny z free-first (bez Cloud Functions do podpisywania requestów, bez Firebase Storage). Zaakceptowane tradeoffy: nazwa presetu trafia do bundle (każdy może uploadować na konto — ograniczać preset w panelu Cloudinary), brak usuwania po stronie klienta (brak secretu w kliencie), URL-e obrazów są public-by-obscurity. (2) Deep linki to zwykłe query params (`?venue=`/`?event=`) z `history.replaceState` — celowo NIE router; single-view map app go nie potrzebuje, a to utrzymuje obsługę base path GitHub Pages jako trywialną. (3) Memories żyją w `users/{uid}/eventMemories/{eventId}` pod tym samym wzorcem reguł `isOwner` co akcje użytkownika — jeden dokument per (user, event), zdjęcia ograniczone do 6, notatka do 2000 znaków, ściśle prywatne (bez sharing/social surface na tym etapie).
**Dlaczego**: Wszystkie trzy funkcje dało się zbudować w istniejącej architekturze (wzorzec env-gating, wzorzec service-layer, owner-scoped subcollections) bez nowych zależności, routera ani płatnych usług.
**Status**: Obowiązuje. Commity `7c55749`, `377eed6`, `a4396b2`, `91daf09`. Przejrzane pod kątem security (scope reguł, higiena sekretów, powierzchnia XSS) i QA'd Playwrightem. Deploy reguł do Firebase Console oczekuje na użytkownika.

## 2026-07-16 — Workflow agentów AI sformalizowany (AGENTS.md, docs/, subagents, hooks)

**Decyzja**: Claude Code jest architektem/koordynatorem; Codex (przez serwer MCP `codex`) implementuje wąsko scope'owane zadania pod review; ChatGPT jest product/UX sounding board poza tą sesją. Sformalizowane przez `AGENTS.md` (wspólne krótkie zasady), `CLAUDE.md` (rola + użycie graphify), `CLAUDE.local.md` (prywatne/lokalne notatki, gitignored), `docs/` (ten zestaw), `tasks/NOW.md` + `tasks/archive/`, trzech subagentów review (`code-reviewer`, `ui-reviewer`, `security-reviewer`), trzy workflow skills (`eventtimes-feature`, `eventtimes-ui-qa`, `eventtimes-release`) oraz safety hooks w `.claude/settings.json`.
**Dlaczego**: Projekt nie miał wspólnego, spisanego kontraktu opisującego, jak agenci mają nad nim współpracować, commitowanego stanu projektu/logu decyzji ani automatycznych zabezpieczeń przed destrukcyjnymi komendami lub wyciekiem sekretów.
**Status**: Obowiązuje od tego wpisu.

## 2026-07-18 — Nowa paleta UI (decyzja użytkownika)

**Decyzja**: Bazową paletą UI są niebieski, biały, czarny i szarości. Krem (`#FFF1C7`, `#FFF8E6`) i żółty (`#FFE15A`) są wycofane dla nowych powierzchni; pozostają tylko jako legacy i będą migrowane oportunistycznie. Czerwień jest zarezerwowana dla akcji destrukcyjnych. Profil "Karnet Event Times" jest implementacją referencyjną nowej palety: niebieska karta + biel, szara kolumna kolekcji.
**Dlaczego**: Użytkownik wybrał czystszy, bardziej spójny kierunek wizualny dla dalszego rozwoju aplikacji, bez kremowo-żółtej dominacji z wcześniejszego profilu.
**Status**: Obowiązuje. Szczegóły zapisane w `docs/UI_RULES.md` §2.

## 2026-07-19 — Efekt 3D tilt na karcie Karnetu

**Decyzja**: Wzorzec `tilt-effect` z 21st.dev/bundui został zaadaptowany jako `src/components/TiltCard.tsx` na już obecnym `framer-motion`. Nie dodano nowej zależności; pakiet `motion` z oryginalnego prompta został odrzucony jako duplikat. Tilt działa tylko przy `pointer: fine` i bez `prefers-reduced-motion: reduce`; na dotyku i przy ograniczonym ruchu renderowany jest statyczny `div`.
**Dlaczego**: Efekt ma wzmacniać fizyczny charakter Karnetu, ale bez pogarszania dostępności, obsługi dotykowej ani grafu zależności.
**Status**: Obowiązuje. Pochyla się wyłącznie statyczna wizytówka (brand, zdjęcie, tożsamość, rola, kod kreskowy); elementy interaktywne (`Edytuj profil`, `Wyloguj`, formularz) są pod kartą, poza obszarem tiltu.

## 2026-07-19 — Jeden przycisk powrotu w panelu eventu, zależny od źródła

**Decyzja**: Panel eventu pokazuje dokładnie jeden przycisk powrotu, sterowany stanem `eventOrigin: 'venue' | 'profile' | 'direct'` w `App.tsx`: z panelu miejsca → „Wróć do miejsca", z profilu → „Wróć do profilu", z wyszukiwarki/deep-linku → „Pokaż miejsce" (ta sama akcja co powrót do miejsca, ale etykieta nie udaje powrotu). Zastąpiło to flagę `wasEventOpenedFromProfile` i układ z dwoma przyciskami naraz.
**Dlaczego**: Wymaganie użytkownika — powrót ma automatycznie odzwierciedlać, skąd faktycznie przyszliśmy; dwa przyciski powrotu obok siebie były mylące.
**Status**: Obowiązuje. Zasada zapisana w `docs/UI_RULES.md` §9; zweryfikowana Playwrightem dla wszystkich trzech źródeł.

## 2026-07-19 — `docs/` po polsku, `00-START.md` jako punkt wejścia (vault Obsidiana)

**Decyzja**: Folder `docs/` jest vaultem Obsidiana i główną bazą wiedzy; cała naturalna treść dokumentacji jest prowadzona po polsku (nazwy plików, ścieżki, kod i dosłowne wartości techniczne zostają po angielsku). Jedynym nowym plikiem nawigacyjnym jest `docs/00-START.md` — pulpit z mapą dokumentów, linkami `[[...]]` i instrukcją co czytać/aktualizować. Każda informacja ma jedno główne miejsce; bez duplikatów, tagów, szablonów i frontmatteru. `docs/.obsidian/` i `docs/.smart-env/` pozostają niecommitowane.
**Dlaczego**: Użytkownik czyta i przegląda dokumentację samodzielnie w Obsidianie; wspólny, krótki system zmniejsza zużycie kontekstu w sesjach Claude/Codex.
**Status**: Obowiązuje. Istniejące dokumenty przetłumaczone 2026-07-19; zasady sesji zapisane w głównym `CLAUDE.md`.

## 2026-07-19 — Backend Cloudflare Worker (`eventtimes-api`) dla Ticketmaster i dojazdu

**Decyzja**: Frontend przestaje wywoływać `app.ticketmaster.com` bezpośrednio — wszystkie zapytania Ticketmaster idą przez `GET ${VITE_EVENTTIMES_API_URL}/api/ticketmaster/events[/:eventId]` (Worker trzyma klucz jako sekret, forwarduje parametry, dokłada `countryCode=PL`). Nowa sekcja „Dojazd" w panelach miejsca i wydarzenia liczy czas/dystans przez `POST /api/travel-time` (Geoapify, klucz też tylko w Workerze) w trybach drive/walk/bicycle. Wspólna logika: `src/services/eventTimesApi.ts` (baza URL), `src/services/travelTimeService.ts`, `src/hooks/useTravelTime.ts`, `src/components/TravelTimeSection.tsx`. `VITE_TICKETMASTER_API_KEY` zniknął z kodu frontendu; `VITE_EVENTTIMES_API_URL` to nie-sekret ustawiany wprost w `deploy.yml`.
**Dlaczego**: Publiczny klucz Ticketmaster w bundlu był blokerem launchu (P1 #3); Worker rozwiązuje to bez płacenia za Cloud Functions (free-first). Geoapify wymaga klucza, więc też musi żyć za proxy.
**Prywatność**: Lokalizacja użytkownika jest pobierana wyłącznie po kliknięciu „Sprawdź dojazd" i żyje tylko w pamięci hooka — nigdy w Firestore, localStorage/sessionStorage, URL ani logach.
**Ograniczenie**: Worker ma allowlistę CORS (`http://localhost:5173`, `https://baginson.github.io`) — dev server na innym porcie dostanie 403; zmiany allowlisty robi się w repo Workera, nie tutaj.
**Status**: Obowiązuje.

## 2026-07-19 — Multi-provider auth, łączenie kont i logowanie nazwą użytkownika

**Decyzja**: Jeden użytkownik = jeden Firebase `uid` = jeden dokument `users/{uid}` niezależnie od metody logowania (Google, GitHub, e-mail/hasło, nazwa użytkownika). Provideri OAuth żyją w rejestrze `src/auth/authProviders.ts` (dodanie kolejnego = rozszerzenie rejestru). Konflikt e-maila między providerami (`auth/account-exists-with-different-credential`) jest rozwiązywany przez pending credential: użytkownik loguje się dotychczasową metodą i dopiero wtedy `linkWithCredential` dowiązuje nową — nigdy nie łączymy kont po samej zgodności tekstu e-maila. „Ustaw hasło" dla kont Google = `EmailAuthProvider.credential` + `linkWithCredential` (wymaga zweryfikowanego e-maila). Odłączenie ostatniej metody logowania jest zablokowane. Logowanie nazwą użytkownika: autorytatywna mapa nazwa→{uid,email} w Cloudflare KV Workera `eventtimes-api` (NIE w Firestore), rejestracja nazwy za Bearer Firebase ID tokenem (JWKS), a endpoint logowania zwraca e-mail dopiero po zweryfikowaniu hasła w Firebase REST — dzięki temu nie da się enumerować kont ani poznać cudzego e-maila; hasła nie są nigdzie zapisywane. Kopia nazwy w `users/{uid}.username` służy tylko do wyświetlania. Pakiet zmian Workera + konfiguracja Firebase/GitHub: `docs/AUTH_SETUP.md`.
**Dlaczego**: Wymóg produktowy — brak duplikacji profili/wspomnień/list przy zmianie metody logowania; free-first (bez Cloud Functions i płatnych SMS-ów); KV zamiast Firestore, żeby klient nie mógł czytać cudzych adresów e-mail przy zachowaniu darmowej warstwy.
**Ograniczenie**: Istniejących historycznych duplikatów kont (dwa uid, ten sam e-mail) nie scalamy automatycznie — ewentualna migracja to osobna ręczna operacja. Rate limiting na KV jest best-effort (eventual consistency).
**Status**: Wdrożone (2026-07-20). Worker `eventtimes-api` ma endpointy `/api/auth/username-login` i `/api/auth/username` (binding `AUTH_KV`, var `FIREBASE_PROJECT_ID=eventtimes-b4c86`, sekret `FIREBASE_WEB_API_KEY`) — zweryfikowane sondami na żywym Workerze (generyczne 401, 405 na złej metodzie, rate limit 429, CORS z `Authorization`; Ticketmaster/travel-time bez regresji). Kod Workera żyje w osobnym repo `C:\Users\Mikołaj\eventtimes-api` (zcommitowany lokalnie, bez remote). GitHub provider skonfigurowany w Firebase Console + GitHub OAuth App. Pozostaje ręczna checklista logowania nazwą/łączenia kont w żywej aplikacji (`docs/AUTH_SETUP.md` §5).

## 2026-07-20 — Etap B (launch readiness) + decyzje z przeglądu przed dalszym rozwojem

**Decyzja**: Domknięto Etap B: `index.html` dostał `description`, komplet Open Graph (`og:type/site_name/locale/title/description/url/image` + wymiary/alt), Twitter Card (`summary_large_image`) i `theme-color=#064BFF`. `og:image` to `public/og-image.png` (znak marki 1734×907, ≈1.91:1; źródłowy plik leży w gitignored `docs/design-references/OG-Image.png`, więc kopia trafiła do `public/`, żeby GitHub Pages ją serwował). `og:url`/`og:image` są absolutne (`https://baginson.github.io/EventTimes/…`), bo scrapery OG wymagają pełnych URL-i — dlatego nie użyto `%BASE_URL%`. Usunięto nieużywany `public/favicon.svg` (ikona to `brand/event-times-mark.png`) i lokalne `vite-*.log`.

Przy okazji przeglądu ustalono kierunki (odpowiedzi użytkownika):
- **Breakpointy**: 820/1100 zostają **oficjalnymi** breakpointami; `docs/UI_RULES.md` §18 będzie do nich dostrojone (Etap E′), zamiast refaktoryzować kod do 767/768/1024. Uzasadnienie: to najpierw strona, docelowo apka na tym samym kodzie — mniej churnu.
- **Pole `status`** (`published/draft/…`): potwierdzone jako martwe (nieczytane w UI i nawet niezapisywane przez formularze) — **do usunięcia w Etapie F**.
- **„Idź na event z innym użytkownikiem" (#6)**: realizowane jako **dołączanie do eventu przez link zapraszający**, bez pełnego systemu znajomych/wiadomości — osobny projekt danych+reguł, nie batch UI.
- **Wspomnienia (#5)**: pełny redesign + rozbudowa (dziś zarys) — z krokiem projektowym UX.
- **Pełny panel aktywności (#7b)**: osobny duży projekt z filtrowaniem po typie aktywności.
- **Fallback localStorage**: produkcja stoi na Firebase; serwisy per-użytkownik/admina świadomie **nie mają** fallbacku (`ARCHITECTURE.md` §Service layer sprostowane).

**Dlaczego**: Etap B był zadeklarowanym „następnym" i domyka gotowość do publicznego udostępnienia (podgląd linku w social/komunikatorach, czyste repo). Reszta decyzji ustawia kolejność planu krótkoterminowego użytkownika bez rozdymania Etapu B.

**Status**: Obowiązuje. Zweryfikowane: `npm run test` 85/85, `npm run lint` czysto, `npm run build` czysto. Poprawiono nieaktualne dokumenty: `tasks/NOW.md`, `docs/PROJECT_STATE.md` (reset hasła nie jest już brakiem/blokerem; 85/85), `docs/ARCHITECTURE.md` (§Stack: +GitHub/username; §Service layer: brak fallbacku dla actions/memories), `docs/ROADMAP.md` (nowe etapy E′/H/I/J + osobne projekty #6/#7b/C).
