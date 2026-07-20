# Now

Jeden aktywny etap. Po ukończeniu przenieś podsumowanie do `tasks/archive/<data>-<slug>.md`.

## Aktualny cel

**Brak aktywnego etapu.** Duża seria zmian na profilu/Karnecie/auth (Etap I + siedem rund poprawek) ukończona 2026-07-21 (kod), zweryfikowana (`tsc`/`test`/`lint`/`build` czyste za każdym razem). Pierwsze sześć rund scommitowane i wypchnięte na `main`. **Siódma runda (scalenie nazwy wyświetlanej z nazwą użytkownika) jest zaimplementowana i zweryfikowana, ale jeszcze NIE scommitowana/wypchnięta** — czeka na decyzję o commicie+push. Następny krok: dokończyć commit/push tej rundy, potem QA na żywej aplikacji (GitHub Pages po deployu CI) — patrz sekcja niżej.

## Ukończone i wypchnięte (2026-07-21, chronologicznie)

1. **Etap I** — swipe-w-dół zamyka `VenuePanel`/`EventPanel`/`AdminPanel` na mobile.
2. **Poprawki Karnetu po QA Etapu H** — naprawiony swipe-reveal (pointer-based), „Metody logowania"/„Wyczyść aktywność" przeniesione z Karnetu, upload zdjęcia z dysku, poszerzona kolumna Karnetu.
3. **Karnet = główna wizytówka profilu** — chip „Uczestnik od…", pasek statystyk. Zasada w `docs/UI_RULES.md` §2.
4. **Poprawka luki karta↔przyciski** — `flex: 1 1 auto` zamiast `margin-top:auto`, karta realnie wypełnia kolumnę.
5. **„Edytuj profil" = dedykowany pełnoszerokościowy widok** — siatka kart, podgląd avatara na żywo, status e-maila + wysyłka linku weryfikacyjnego (`sendVerificationEmail`), Escape wychodzi z edycji zamiast zamykać panel.
6. **Nazwa użytkownika obowiązkowa** — nowy niedomykalny `src/components/UsernameGate.tsx` blokuje aplikację dla każdego zalogowanego konta bez nazwy (e-mail/hasło, Google, GitHub, retroaktywnie istniejące konta). Przy okazji: pole `displayName` w edycji profilu przemianowane z mylącego „Nazwa użytkownika" na „Nazwa wyświetlana".
7. **[NIESCOMMITOWANE] Nazwa wyświetlana scalona z nazwą użytkownika** — użytkownik ocenił posiadanie obu jako bezsensowne zaraz po zobaczeniu rundy 6 na żywo. Osobna sekcja „Nazwa użytkownika" w „Metody logowania" usunięta całkowicie; jedyne pole tożsamości (w „Podstawowych danych") jest teraz walidowane regułami nazwy użytkownika i przy zapisie synchronizuje Firebase `displayName`. `UsernameGate` też synchronizuje `displayName` od razu przy pierwszym ustawieniu. **Skutek widoczny**: Karnet od teraz pokazuje techniczny handle (np. `mikolaj-baginski`) zamiast swobodnego imienia — świadomy wybór, nie błąd.

Pełne uzasadnienie i szczegóły każdej rundy: `docs/DECISIONS.md` (kilka wpisów pod 2026-07-21), `docs/ARCHITECTURE.md` §Auth i konto zaktualizowane o obowiązkową i scaloną nazwę użytkownika.

Wszystko zaimplementowane przez Codex (kilka drobnych ręcznych poprawek po moim przeglądzie diffu po drodze), diff przejrzany w całości za każdym razem, zweryfikowane niezależnie po każdym kroku: `npx tsc --noEmit` czysto, `npm run test` 85/85, `npm run lint` czysto, `npm run build` czysto.

## Status Git

Rundy 1-6 scommitowane i wypchnięte na `main` 2026-07-21 (zobacz `git log` dla dokładnych commitów/wiadomości). GitHub Pages deploy jest bramkowany przez `npm run test`+`npm run lint` w CI (Etap A) — sprawdzić, że workflow przeszedł, zanim uzna się to za w pełni wdrożone. **Runda 7 (scalenie nazw) jest tylko w working tree, jeszcze nie scommitowana** — `git status` pokaże zmiany w `AccountPanel.tsx` i `UsernameGate.tsx`.

## QA WIZUALNE PILNE — nic z tego nie było jeszcze sprawdzone na żywo

- **`UsernameGate`** (najwyższe ryzyko — nowy, blokujący mechanizm dotykający każdego użytkownika): czy faktycznie pojawia się dla zalogowanego konta bez nazwy (w tym prawdopodobnie konto użytkownika przy najbliższym logowaniu), czy blokuje resztę aplikacji, czy nie da się go ominąć/zamknąć, czy `markUsernameSet()` poprawnie go chowa po sukcesie, czy błąd „zajęta nazwa"/inne błędy wyświetlają się czytelnie.
- **Widok edycji profilu**: siatka kart, podgląd avatara na żywo, status e-maila + wysyłka linku weryfikacyjnego, strzałka powrotu, Escape (pierwszy wraca do Karnetu, drugi zamyka panel), kolaps do 1 kolumny <767px.
- **Karnet — desktop**: karta wypełnia kolumnę bez przerwy przed przyciskami; statystyki i „Uczestnik od…" wyglądają dobrze.
- **Karnet — mobile**: te same nowe elementy nie psują proporcji pełnoekranowej karty ani swipe-reveal; swipe w górę/dół działa płynnie, nie psuje poziomego pagera.
- **Etap I**: swipe-w-dół zamyka VenuePanel/EventPanel/AdminPanel gdy treść jest na górze, normalnie przewija gdy nie jest.

## Kandydaci na następny etap (z `docs/ROADMAP.md`, po domknięciu QA)

- **Etap J — Wspomnienia**: redesign wizualny sekcji wspomnień w panelu eventu.
- **Etap C — Cykl życia konta**: usunięcie konta / eksport danych GDPR.
- **Etap F — Porządki techniczne**: konsolidacja `requireDb()`, spójna walidacja współrzędnych, usunięcie martwego pola `status`, redukcja duplikacji VenuePanel/EventPanel.
- Osobne duże projekty: dołączanie do eventu przez link (#6), pełny panel aktywności z filtrami (#7b).

## Problemy / ryzyka

- **`UsernameGate` jest nowe, blokujące zachowanie na produkcji bez wcześniejszego wizualnego QA** — jeśli coś w nim nie działa (np. gate się nie zamyka po sukcesie, albo pojawia się błędnie dla kont, które mają nazwę), realnie blokuje użytkowników z korzystania z aplikacji. Sprawdzić priorytetowo zaraz po deployu.
- #6 (link do eventu) wymaga nowej struktury Firestore + reguł — nie zaczynać bez osobnego projektu.

## Prompt do następnej sesji (gotowy do wklejenia)

> Kontynuuję Event Times. Duża seria zmian na profilu/Karnecie/auth (Etap I + sześć rund, w tym nowy obowiązkowy `UsernameGate` i pełnoszerokościowy widok edycji profilu) jest scommitowana i wypchnięta na `main` (2026-07-21). Najpierw przeczytaj `tasks/NOW.md` i `docs/PROJECT_STATE.md`, sprawdź czy CI/deploy GitHub Pages przeszedł, potem zapytaj mnie o feedback z testowania na żywej aplikacji — **szczególnie `UsernameGate`, który nie miał żadnego wizualnego sprawdzenia przed wypchnięciem i blokuje całą aplikację dla kont bez nazwy użytkownika**. Jeśli feedback wymaga poprawek, zacznij od nich (priorytetowo, jeśli `UsernameGate` blokuje kogoś niesłusznie). Jeśli wszystko OK, zapytaj który etap z `docs/ROADMAP.md` robimy dalej (J, C, F, czy coś innego).
