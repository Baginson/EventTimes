# Now

Jeden aktywny etap. Po ukończeniu przenieś podsumowanie do `tasks/archive/<data>-<slug>.md`.

## Aktualny cel

**Brak aktywnego etapu — do wyboru następny.** Etap H (profil mobilny, wszystkie części) ukończony 2026-07-20, podsumowanie w `tasks/archive/2026-07-20-etap-h-profil-mobilny.md`. Etap E′ (breakpointy) też ukończony tego dnia.

## Ukończone ostatnio

- **Etap E′** (`3ebd1fc`): oficjalne breakpointy 767/820/1100, `src/constants/breakpoints.ts`.
- **Etap H** (`49c26d5`, `1dadb99`, + H3 ten commit): mobilny profil = pełny 3-stronicowy pager ze swipe-reveal Karnetu, kropkami pagera, skróconą „Ostatnią aktywnością” (5→3 + rozwijanie), i naprawionym stylem „Metody logowania”/przycisków na mobile (brakujący ancestor `.account-pass` w scoped CSS). Szczegóły: `tasks/archive/2026-07-20-etap-h-profil-mobilny.md`.

## Testy / kontrola (po H3)

`npx tsc --noEmit` czysto ✅ · `npm run test` 85/85 ✅ · `npm run lint` czysto ✅ · `npm run build` OK ✅ (znane ostrzeżenie o bundlu 1,15 MB, P3).

**QA WIZUALNE MOBILNEGO PROFILU WCIĄŻ NIEWYKONANE** — panel wymaga zalogowania (żywy Firebase + OAuth/hasło), nie da się headless. Do sprawdzenia przez użytkownika na telefonie: pełnoekranowy Karnet na starcie, swipe w górę wysuwa Edytuj/Wyloguj, swipe w bok między 3 stronami + kropki się aktualizują i są klikalne, „Metody logowania” w edycji ma biały box (nie goły border-top), długie nazwa/e-mail się zawijają, „Pokaż całą aktywność” działa, desktop bez zmian.

## Kandydaci na następny etap (z `docs/ROADMAP.md`)

- **Etap I — Gesty paneli**: swipe-w-dół zamyka bottom-sheet (`usePanelMotion` nie ma dziś gestu drag), plan krótkoterminowy #4.
- **Etap J — Wspomnienia**: redesign wizualny sekcji wspomnień w panelu eventu — najpierw projekt UX, plan krótkoterminowy #5.
- Osobne duże projekty (nie wchodzą do batcha UI bez decyzji): dołączanie do eventu przez link (#6), pełny panel aktywności z filtrami (#7b), Etap C (usuwanie konta / eksport GDPR).

## Problemy / ryzyka

- QA telefoniczne Etapu H (patrz wyżej) może jeszcze zwrócić drobne poprawki dosttrojenia (próg swipe, animacja, kolizja sticky-bar z `isEditing`) — sprawdzić po feedbacku użytkownika, zanim zacznie się kolejny etap.
- #6 (link do eventu) wymaga nowej struktury Firestore + reguł — nie zaczynać bez osobnego projektu.

## Prompt do następnej sesji (gotowy do wklejenia)

> Kontynuuję Event Times. Etap H (profil mobilny) i Etap E′ (breakpointy) ukończone 2026-07-20 — zobacz `tasks/archive/2026-07-20-etap-h-profil-mobilny.md`. Najpierw przeczytaj `tasks/NOW.md`, `docs/PROJECT_STATE.md`. **QA wizualne mobilnego profilu na telefonie wciąż zaległe** — jeśli mam feedback z tego QA, zacznij od niego. Jeśli nie, zapytaj mnie, który z kandydatów z `docs/ROADMAP.md` robimy dalej (Etap I — gest swipe-w-dół zamykający panele, czy Etap J — redesign wspomnień, czy coś innego).
