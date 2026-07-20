# Etap H — profil mobilny (ukończone 2026-07-20)

Mobilny profil (`AccountPanel.tsx` + `App.css`) przebudowany z ciasnego CSS na desktopowym layoucie na dedykowany 3-stronicowy poziomy pager: strona 1 = Karnet + narzędzia (Edytuj profil/Wyloguj, Metody logowania w edycji, Wyczyść aktywność), strona 2 = Wspomnienia, strona 3 = kolekcja (stat-strip + lista) + Ostatnia aktywność. Desktop pozostał bajt-identyczny przez cały etap — wszystkie zmiany szły przez nową gałąź `isMobile` / klasę `.account-page--pass` obok istniejącej `.account-pass`.

## Commity

1. `49c26d5` — Etap H cz. 1: struktura pagera (refaktor delegowany Codexowi, zrecenzowany diff).
2. `1dadb99` — interakcja Karnetu: swipe w górę (scroll `> 8px`) skraca kartę (84dvh → 60dvh) i wysuwa sticky przyciski Edytuj/Wyloguj z dołu; `prefers-reduced-motion` wyłącza animacje.
3. (ten commit, H3 — reszta) — patrz niżej.

## H3 (ostatnia część)

1. **Zawijanie nazwy/e-maila na Karnecie**: `.account-pass-card h1`/`.account-pass-email` miały już `overflow-wrap: anywhere` od pierwszej wersji Karnetu (nie było tam faktycznie `text-overflow: ellipsis`/`white-space: nowrap` — zweryfikowane pełną historią gita). Dodane defensywnie: `min-width: 0` na `.account-pass-identity` (grid item) i `align-items: flex-start` na mobilnym `.account-pass-head` (zamiast `center`), żeby wielolinijkowa nazwa nie wyglądała na wyśrodkowaną/uciętą względem avatara.
2. **#7a**: `recentActivityLimit` 5 → 3 w `AccountPanel.tsx`. `getRecentActivityItems()` zwraca teraz pełną listę (bez `.slice`); `renderRecentActivity` dostaje pełną listę i lokalnie tnie do limitu, plus przycisk „Pokaż całą aktywność”/„Zwiń aktywność” (stan `isRecentActivityExpanded`, rozwija inline, widoczny tylko gdy jest więcej niż limit).
3. **Kropki pagera**: nowy `.account-pager-dots` (3 kropki, `role="tablist"`), stan `activePagerPage` aktualizowany przez `onScroll` na `.account-pager` (`Math.round(scrollLeft / clientWidth)`), klik w kropkę scrolluje pager (`scrollTo({behavior:'smooth'})`) przez `pagerRef`. Kropki są `position: absolute` względem `.account-panel`, nie zabierają miejsca w layoucie.
4. **Styl „Metody logowania”/„Edytuj profil”/przycisków szybkich akcji na mobile — realny bug**: CSS `.account-pass .account-login-methods` / `.account-pass .account-profile-edit` / `.account-pass .account-quick-actions` (biały box na niebieskim Karnecie, 2-kolumnowe przyciski) był scoped pod ancestor `.account-pass`, którego mobilny DOM **nie ma** — mobilna strona 1 renderuje się pod `.account-page.account-page--pass`, nie `.account-pass`. Efekt: na mobile te sekcje spadały do starszych, generycznych reguł (goły border-top, szare pełnoszerokościowe przyciski) zamiast białego boxa/białych pigułek dopasowanych do niebieskiej karty. Naprawione dopisaniem `.account-page--pass` jako alternatywnego ancestora do tych samych bloków reguł (żadna reguła `.account-pass` nie została zmieniona — desktop nietknięty).

## Weryfikacja

`npx tsc --noEmit` czysto, `npm run test` 85/85, `npm run lint` czysto, `npm run build` OK (znane ostrzeżenie 1,15 MB bundle, P3, nietknięte w tym etapie).

**QA wizualne na prawdziwym telefonie nadal zaległe** — panel renderuje się tylko po zalogowaniu (żywy Firebase + OAuth/hasło), nie da się pokryć headless. Do sprawdzenia przez użytkownika: pełnoekranowy Karnet na starcie, swipe w górę wysuwa przyciski, swipe w bok między 3 stronami, kropki pokazują aktywną stronę i są klikalne, „Metody logowania” w edycji wygląda jak biały box (nie goły tekst), długie nazwy/e-maile się zawijają a nie wyglądają uciętych.

## Zmienione pliki

- `src/components/AccountPanel.tsx`
- `src/App.css`
