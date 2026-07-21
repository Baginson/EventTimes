# Now

Jeden aktywny etap. Po ukończeniu przenieś podsumowanie do `tasks/archive/<data>-<slug>.md`.

## Aktualny cel

**Aktywny wątek: duża rozbudowa `docs/` jako bazy wiedzy (bez zmian w kodzie), 2026-07-21.** `docs/` przebudowane z 6 do ~20 dokumentów tematycznych. Runda 1: struktura + pierwsza partia 10 pytań w `docs/OPEN_QUESTIONS.md`. Runda 2: użytkownik odpowiedział na wszystkie 10 pytań — ustalenia w `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`, `PROJECT_OVERVIEW.md`, `BUSINESS.md`, `FEATURES.md`, `ADMIN.md`, `BACKLOG.md`, `RISKS.md`, `DEPLOYMENT.md`, `SECURITY.md`, `DATA_MODEL.md`, `INTEGRATIONS.md`, `GLOSSARY.md`. **Runda 3 (ten checkpoint, 2026-07-21)**: druga partia pytań na wyraźną prośbę użytkownika — duży nacisk na UI jako wyróżnik marki + kilka doprecyzowań produktowych. Odpowiedzi zapisane: `docs/DECISIONS.md` (2 nowe duże wpisy), `docs/OPEN_QUESTIONS.md` (partia 2 w całości odpowiedziana, partia 3 naszkicowana), `docs/UI_RULES.md` (jawny podział Poster UI/Neutral UI w §20, głos marki i ikonografia w §1, uwaga o dark mode w §2), `docs/KARNET.md` (nowa sekcja „Przyszła wizja: udostępnialny Karnet", potwierdzony zakres personalizacji karty), `docs/BUSINESS.md` (priorytet monetyzacji: afiliacja→promocja→reszta, „EventTimes Stage" ma dostać powierzchnię w aplikacji), `docs/BACKLOG.md` (pola formularza zgłoszeniowego, dark mode, „EventTimes Stage" w aplikacji, zaktualizowany opis udostępnialnego Karnetu i kryteriów ekspansji), `docs/FEATURES.md`, `docs/ADMIN.md`. Kluczowe ustalenia: styl posterowy to świadomy, trwały wyróżnik marki (Poster UI: powitanie/onboarding/Karnet/podsumowania/promo/wybrane empty states; Neutral UI: formularze/ustawienia/admin/moderacja/logowanie — czytelność ponad wszystko); dark mode potwierdzony kierunek (możliwy przed 1.0, bez priorytetu); logo to pierwsza, nie ostateczna wersja; Karnet ma docelowo być udostępnialny (eksport PNG, statystyki, wirusowy wzrost) — dziś wciąż w pełni prywatny; monetyzacja: afiliacja biletowa pierwsza, potem płatna promocja.

**Jedna konkretna, gotowa do wykonania poprawka konfiguracji CI zidentyfikowana, ale NIE wykonana** (czeka na osobną zgodę, bo dotyka `.github/workflows/deploy.yml`): `deploy.yml` nie przekazuje `VITE_CLOUDINARY_CLOUD_NAME`/`VITE_CLOUDINARY_UPLOAD_PRESET` do builda produkcyjnego, mimo że właściciel projektu potwierdził, że Cloudinary ma w pełni działać na produkcji. Patrz `docs/DEPLOYMENT.md`, `docs/RISKS.md`.

**Runda 4 (2026-07-21, ostatnia dziś)**: dopięcie ostatnich pięciu otwartych wątków + nowy plik `docs/QA_CHECKLIST.md` (odhaczalna lista manualnego QA, wpięta do `00-START.md`/`TESTING.md`). Ustalenia w `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md` (partia 3 odpowiedziana, partia 4 naszkicowana), `docs/ADMIN.md`, `docs/KARNET.md`, `docs/UI_RULES.md`, `docs/BUSINESS.md`, `docs/BACKLOG.md`, `docs/RISKS.md`. Kluczowe: AI-moderacja zgłoszeń wdrażana etapami (najpierw tylko wspiera człowieka — duplikaty/kompletność/formatowanie/wiarygodność, auto-zatwierdzanie dopiero po udowodnionej skuteczności); formularz zgłoszeniowy dostanie podstawową ochronę antyspamową **od pierwszej wersji**; udostępnialny Karnet v1 = cały Karnet naraz, zawsze po świadomym kliknięciu „Udostępnij"; dark mode ma być zaprojektowany osobno (nie prosta inwersja kolorów); „EventTimes Stage" w UI powstaje dopiero przy pierwszej realnej aktywacji, jako charakterystyczna nieregularna naklejka (nie badge) — architektura ma być gotowa wcześniej.

**Poprawka `deploy.yml` (Cloudinary) — wdrożona (2026-07-21)**: sekrety dodane (`gh secret set`), wpięte do `build`, commit `6808bee` wypchnięty na `feature/auth-multiprovider-and-ux`.

**`docs/` przestało być commitowane (2026-07-21)** — na wyraźną prośbę właściciela projektu, bo repo `Baginson/EventTimes` jest **publiczne**, a `docs/` zaczęło zawierać materiał biznesowy/bezpieczeństwa wrażliwy na publiczną widoczność. `docs/` dodane do `.gitignore` (jeden wpis, zastępuje wcześniejsze węższe), siedem wcześniej scommitowanych plików odśledzonych (`git rm -r --cached docs/`) — zostają na dysku, przestają być częścią przyszłych commitów. **Uwaga trwała**: te siedem plików (w tym `AUTH_SETUP.md` z realnym kodem bezpieczeństwa Workera) pozostaje widoczne w historii commitów na `origin/main` — odśledzenie nie usuwa historii. Pełne wymazanie wymagałoby przepisania historii + force-push (nie wykonane, czeka na osobną jawną zgodę, jeśli to ma sens dla właściciela). Pełny wpis: `docs/DECISIONS.md` (ale ten plik od teraz jest lokalny, nieśledzony w git).

Wszystko z bieżącej sesji (deploy.yml fix + `.gitignore`/odśledzenie docs) scalone do `main` i wypchnięte na żądanie właściciela projektu.

**Następny krok**: użytkownik decyduje, czy chce, żebym przepisał historię git i force-pushował, żeby w pełni usunąć starą treść `docs/` z publicznej historii `origin/main` (destrukcyjna operacja, świadomie nie wykonana bez jawnej zgody). Poza tym: `docs/OPEN_QUESTIONS.md` §Partia 4 ma wstępną listę kandydatów na przyszłość (mechanizm rate limitingu formularza, warianty naklejki „EventTimes Stage", trwały vs. generowany URL udostępnianego Karnetu, konkretna paleta dark mode). `docs/QA_CHECKLIST.md` czeka na przejście przez użytkownika (sekcja Karnet — desktop już odhaczona).

**Osobny, niedokończony wątek kodu sprzed tej sesji (nie dotknięty tutaj)**: duża seria zmian na profilu/Karnecie/auth (Etap I + osiem rund poprawek) ukończona 2026-07-21 (kod), zweryfikowana (`tsc`/`test`/`lint`/`build` czyste za każdym razem). Pierwsze sześć rund scommitowane i wypchnięte na `main`. **Rundy 7 i 8 (scalenie nazwy wyświetlanej z nazwą użytkownika, potem częściowe cofnięcie) są zaimplementowane i zweryfikowane, ale wciąż jeszcze NIE scommitowane/wypchnięte** — czeka na decyzję o commicie+push, potem QA na żywej aplikacji. Sprawdź `git status` na starcie kolejnej sesji, żeby potwierdzić czy to nadal aktualne.

## Ukończone i wypchnięte (2026-07-21, chronologicznie)

1. **Etap I** — swipe-w-dół zamyka `VenuePanel`/`EventPanel`/`AdminPanel` na mobile.
2. **Poprawki Karnetu po QA Etapu H** — naprawiony swipe-reveal (pointer-based), „Metody logowania"/„Wyczyść aktywność" przeniesione z Karnetu, upload zdjęcia z dysku, poszerzona kolumna Karnetu.
3. **Karnet = główna wizytówka profilu** — chip „Uczestnik od…", pasek statystyk. Zasada w `docs/UI_RULES.md` §2.
4. **Poprawka luki karta↔przyciski** — `flex: 1 1 auto` zamiast `margin-top:auto`, karta realnie wypełnia kolumnę.
5. **„Edytuj profil" = dedykowany pełnoszerokościowy widok** — siatka kart, podgląd avatara na żywo, status e-maila + wysyłka linku weryfikacyjnego (`sendVerificationEmail`), Escape wychodzi z edycji zamiast zamykać panel.
6. **Nazwa użytkownika obowiązkowa** — nowy niedomykalny `src/components/UsernameGate.tsx` blokuje aplikację dla każdego zalogowanego konta bez nazwy (e-mail/hasło, Google, GitHub, retroaktywnie istniejące konta). Przy okazji: pole `displayName` w edycji profilu przemianowane z mylącego „Nazwa użytkownika" na „Nazwa wyświetlana".
7. **[NIESCOMMITOWANE] Nazwa wyświetlana scalona z nazwą użytkownika** — użytkownik ocenił posiadanie obu jako bezsensowne zaraz po zobaczeniu rundy 6 na żywo. Osobna sekcja „Nazwa użytkownika" w „Metody logowania" usunięta całkowicie; jedyne pole tożsamości (w „Podstawowych danych") było walidowane regułami nazwy użytkownika i przy zapisie synchronizowało Firebase `displayName`. `UsernameGate` też synchronizował `displayName` od razu przy pierwszym ustawieniu. Skutek: Karnet pokazywał techniczny handle zamiast imienia.
8. **[NIESCOMMITOWANE] Częściowe cofnięcie rundy 7** — zaraz po zobaczeniu efektu użytkownik zapytał skąd bierze się imię i nazwisko i poprosił o osobną sekcję „Imię i Nazwisko". Nie jest to powrót do stanu sprzed rundy 7 (tamten problem to były dwa pola wyglądające jak duplikat w dwóch różnych, niejasnych miejscach) — teraz oba pola żyją razem w „Podstawowych danych", jasno nazwane i rozdzielone: „Imię i nazwisko" (`displayName`, obok avatara) i „Nazwa użytkownika" (osobne pole pod nim). `saveProfile()` zapisuje realne imię, z nazwą użytkownika tylko jako fallbackiem gdy puste. `UsernameGate` dotyka już tylko nazwy użytkownika, nie `displayName`. `AuthModal` też ujednolicony na „Imię i nazwisko". **Skutek**: Karnet znowu pokazuje prawdziwe imię.

Pełne uzasadnienie i szczegóły każdej rundy: `docs/DECISIONS.md` (kilka wpisów pod 2026-07-21), `docs/ARCHITECTURE.md` §Auth i konto zaktualizowane o finalny stan (osobne pola, obowiązkowa nazwa użytkownika).

Wszystko zaimplementowane przez Codex (kilka drobnych ręcznych poprawek po moim przeglądzie diffu po drodze), diff przejrzany w całości za każdym razem, zweryfikowane niezależnie po każdym kroku: `npx tsc --noEmit` czysto, `npm run test` 85/85, `npm run lint` czysto, `npm run build` czysto.

## Status Git

Rundy 1-6 scommitowane i wypchnięte na `main` 2026-07-21 (zobacz `git log` dla dokładnych commitów/wiadomości). GitHub Pages deploy jest bramkowany przez `npm run test`+`npm run lint` w CI (Etap A) — sprawdzić, że workflow przeszedł, zanim uzna się to za w pełni wdrożone. **Rundy 7+8 (scalenie nazw, potem częściowe cofnięcie) są tylko w working tree, jeszcze nie scommitowane** — `git status` pokaże zmiany w `AccountPanel.tsx`, `UsernameGate.tsx`, `AuthModal.tsx`. Efekt netto rund 7+8 razem = „Imię i nazwisko" i „Nazwa użytkownika" jako dwa osobne, jasno nazwane pola w „Podstawowych danych".

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
