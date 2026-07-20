# Now

Jedno aktywne zadanie/etap. Po ukończeniu przenieś podsumowanie do `tasks/archive/<data>-<slug>.md`.

## Aktywne: Rozbudowa systemu logowania — implementacja frontendu UKOŃCZONA, czeka na wdrożenie zewnętrzne

**Stan 2026-07-19 (wieczór):** wszystkie 5 etapów z planu zrealizowane i zweryfikowane (test 85/85, lint, build). Przegląd `security-reviewer` zakończony: brak znalezisk krytycznych; dwa istotne (timing side-channel i rate limiting per nazwa w kodzie Workera) poprawione w `docs/AUTH_SETUP.md`; drobne (modułowy pending credential w `AuthProvider.tsx` — nieszkodliwy, do ewentualnego refaktoru przy okazji).

Zrobione:
- Etap 1 (Codex, przyjęty): `src/auth/authProviders.ts` (rejestr Google/GitHub), `AuthProvider.tsx` — `signInWithProvider`, `resetPassword`, pending-credential linking (`completePendingLink`), `linkPassword`, `linkProvider`, `unlinkProvider`, `authNotice`/`pendingLinkInfo`/`authVersion`; nowe kody w `authErrors.ts`; `UserProvider` += 'github'.
- Etap 2 (Codex, przyjęty): `AuthModal.tsx` — tryby login/register/reset, pole „E-mail lub nazwa użytkownika", „Nie pamiętam hasła" (neutralny komunikat), „Kontynuuj z Google/GitHubem", blokada podwójnego submitu, style `auth-*` w `App.css`.
- Etap 3 (Codex, przyjęty): `AccountPanel.tsx` — sekcja „Metody logowania" (statusy, Połącz/Odłącz z guardem ostatniej metody, „Ustaw hasło"), podsekcja „Nazwa użytkownika"; `userProfileService.ts` — `username` w ustawieniach + `saveUsernameToProfile`.
- Etap 4 (Claude): `src/utils/username.ts` (+6 testów), `src/services/usernameService.ts` (klient Workera, generyczne błędy).
- Etap 5 (Claude): `docs/AUTH_SETUP.md` — kompletny pakiet kodu Workera (KV `AUTH_KV`, JWKS, rate limiting, e-mail dopiero po weryfikacji hasła) + instrukcje Firebase Console/GitHub OAuth + checklista testów ręcznych; zaktualizowane `ARCHITECTURE.md`, `PROJECT_STATE.md`, wpis w `DECISIONS.md`.

### Wdrożenie zewnętrzne — ZROBIONE (2026-07-20)
1. ✅ GitHub OAuth App + provider GitHub w Firebase Console (callback Firebase, „One account per email", Authorized domains: localhost + baginson.github.io).
2. ✅ Worker `eventtimes-api` (osobne repo `C:\Users\Mikołaj\eventtimes-api`, ściągnięte `wrangler init --from-dash`): dodane `src/authUsername.js` + `src/cors.js`, routing w `worker.js`, binding `AUTH_KV` (id `c1cc4ed5308942de945025fb093d27a2`) i var `FIREBASE_PROJECT_ID=eventtimes-b4c86` w `wrangler.jsonc`, sekret `FIREBASE_WEB_API_KEY`. Wdrożone i zweryfikowane sondami (401/405/429/CORS, brak regresji TM/travel-time). Zcommitowane lokalnie (`3b62987`), bez remote.

### Pozostaje (wymaga użytkownika w żywej aplikacji)
- Ręczna checklista `docs/AUTH_SETUP.md` §5: rejestracja nazwy w profilu → logowanie nazwą+hasłem; „Ustaw hasło" na koncie Google; łączenie GitHub↔Google przez pending-credential; Połącz/Odłącz w „Metody logowania". Wymaga prawdziwych popupów OAuth.
- Rozważyć commit paczek z drzewa głównego repo (patrz niżej) po akceptacji użytkownika.
- Rozważyć założenie remote dla repo Workera (teraz kod jest tylko lokalnie + w Cloudflare).

## Niezacommitowane zmiany w drzewie (test 85/85, lint, build — zielone)

1. **Worker/Dojazd + import TM przez proxy** (wcześniejsza sesja).
2. **Poprawki UX 2026-07-19** — ikona Share, `NavigationButton`, klikalna nazwa miejsca, centrowanie pinezki w widocznym obszarze mapy.
3. **System logowania 2026-07-19** — pliki wymienione wyżej.

## Ostatnio ukończone

**Rozbudowa logowania: multi-provider + łączenie kont + nazwa użytkownika** (2026-07-19) — opis wyżej. **Poprawki UX paneli + centrowanie mapy** (2026-07-19). **Backend Cloudflare Worker: Ticketmaster proxy + „Dojazd"** (2026-07-19).
