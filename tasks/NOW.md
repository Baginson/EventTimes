# Now

Jeden aktywny etap. Po ukończeniu przenieś podsumowanie do `tasks/archive/<data>-<slug>.md`.

## Aktualny cel

**Poprzedni wątek (2026-07-21, zakończony)**: duża rozbudowa `docs/` jako bazy wiedzy + 4 rundy pytań produktowych/UI (wszystkie odpowiedziane, `docs/OPEN_QUESTIONS.md` partia 4 czeka na przyszłość) + naprawa CI dla Cloudinary (`deploy.yml`, sekrety dodane) + `docs/` przeniesione do `.gitignore` (publiczne repo, wrażliwa treść) — historia git NIE przepisywana (świadoma decyzja, brak realnych sekretów w historii). Pełne szczegóły: `docs/DECISIONS.md` (lokalny, nieśledzony w git).

**Aktywny wątek: kolejna partia poprawek UX + bugfixy na mobile (2026-07-21), zgłoszona przez właściciela projektu po realnym testowaniu.** 11 zgłoszonych rzeczy, status:

1. ✅ Karnet mobile scroll fight — `touch-action: pan-x` na stronie Karnetu pagera.
2. 🔄 **W TRAKCIE** — logowanie nazwą użytkownika nie działa dla nowego konta (`testowy0`), mimo że Worker zwraca 200 OK z poprawnym e-mailem (potwierdzone `wrangler tail` + dane w KV poprawne). Bug jest po stronie klienta/przeglądarki, nie backendu. Diagnoza w toku przez Playwright (odtwarzanie całego flow niezależnie od użytkownika).
3. ✅ Pierwsza konfiguracja — pełnoekranowy widok zamiast banera wciśniętego w Karnet.
4. ℹ️ Username Gate — nie do przetestowania na obecnym koncie (brak starego konta bez nazwy), ale to ten sam kod co nowa rejestracja — niski priorytet ryzyka.
5. ✅ Swipe naturalność — `dragMomentum`+spring w `usePanelSwipeToClose` (Venue/Event/Admin).
6. ✅ Ostrzeżenie przy niezapisanych zmianach — edycja profilu, EventForm, VenueForm.
7. ✅ Pager swipe-down zamyka panel — ujednolicone w jeden handler na `.account-pager`.
8. ✅ Zdjęcie przez URL usunięte z edycji avatara (zostało w EventForm/VenueForm — admin, celowo).
9. ✅ Przeskalowanie panelu po wspomnieniu — naprawiony brak `min-width:0` w zagnieżdżonym gridzie `.event-memory*`.
10. ✅ Zdjęcia miejsc — dodany upload z dysku (Cloudinary) do `VenueForm.tsx`, parytet z `EventForm.tsx`.
11. ✅ Autofocus na mobile — `autoFocus` gated przez `useMediaQuery('(pointer: fine)')` w 6 miejscach (UsernameGate, EventForm, VenueForm, AuthModal×3).

**Dodatkowa poprawka po pierwszym realnym teście (2026-07-21)**: swipe-down na stronie Karnetu wymagał DWÓCH osobnych gestów — pierwszy chowa przyciski, dopiero drugi (gdy już schowane) zamyka panel. Naprawione przez `passRevealedAtDragStartRef` (stan revealed zamrożony na początku gestu, nie live).

Zweryfikowane niezależnie po każdej zmianie: `npx tsc --noEmit` czysto, `npm run test` 85/85, `npm run lint` czysto, `npm run build` czysto.

**Następny krok**: dokończyć diagnozę #2 przez Playwright, wypchnąć całość na `main` (właściciel projektu explicite prosił, żeby móc testować na telefonie), potem QA na żywym telefonie dla #1/#5/#7 (nie do zweryfikowania headless).

**Poprawka `deploy.yml` (Cloudinary) — wdrożona (2026-07-21)**: sekrety dodane (`gh secret set`), wpięte do `build`, commit `6808bee` wypchnięty na `feature/auth-multiprovider-and-ux`.

**`docs/` przestało być commitowane (2026-07-21)** — na wyraźną prośbę właściciela projektu, bo repo `Baginson/EventTimes` jest **publiczne**, a `docs/` zaczęło zawierać materiał biznesowy/bezpieczeństwa wrażliwy na publiczną widoczność. `docs/` dodane do `.gitignore` (jeden wpis, zastępuje wcześniejsze węższe), siedem wcześniej scommitowanych plików odśledzonych (`git rm -r --cached docs/`) — zostają na dysku, przestają być częścią przyszłych commitów. **Uwaga trwała**: te siedem plików (w tym `AUTH_SETUP.md` z realnym kodem bezpieczeństwa Workera) pozostaje widoczne w historii commitów na `origin/main` — odśledzenie nie usuwa historii. Pełne wymazanie wymagałoby przepisania historii + force-push (nie wykonane, czeka na osobną jawną zgodę, jeśli to ma sens dla właściciela). Pełny wpis: `docs/DECISIONS.md` (ale ten plik od teraz jest lokalny, nieśledzony w git).

Wszystko z bieżącej sesji (deploy.yml fix + `.gitignore`/odśledzenie docs) scalone do `main` i wypchnięte na żądanie właściciela projektu.

**Przepisanie historii git — świadomie ODRZUCONE (2026-07-21)**: po sprawdzeniu pełnej historii repo (skan pod kątem `.env`/kluczy API/kluczy prywatnych — nic nie znalezione, `.env.local` nigdy niescommitowany) właściciel projektu zdecydował, że nie warto rewrite'ować historii + force-push tylko dla szczegółów implementacji Workera w `AUTH_SETUP.md` (żadnych realnych sekretów w historii nie ma). Historia `origin/main`/`origin/feature/auth-multiprovider-and-ux` zostaje nietknięta. Potwierdzone: `docs/` nie jest śledzone w obecnym HEAD, `.gitignore` poprawnie je ignoruje, working tree czyste. Backup pełnej historii przed tą decyzją zapisany lokalnie w scratchpadzie sesji (nieistotny teraz, że rewrite odrzucony).

**Następny krok**: brak zaplanowanego zadania — czekam na kierunek od właściciela projektu. Kandydaci: przejście przez `docs/QA_CHECKLIST.md` (sekcja Karnet — desktop już odhaczona, reszta czeka, `UsernameGate` 🔴 najważniejsze), `docs/OPEN_QUESTIONS.md` §Partia 4 (mechanizm rate limitingu formularza, warianty naklejki „EventTimes Stage", trwały vs. generowany URL udostępnianego Karnetu, paleta dark mode), albo nowe zadanie produktowe/kodowe.

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
