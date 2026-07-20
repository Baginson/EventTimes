# Now

Jeden aktywny etap. Po ukończeniu przenieś podsumowanie do `tasks/archive/<data>-<slug>.md`.

## Aktualny cel

**Etap B (launch readiness) — UKOŃCZONY 2026-07-20** (commit `adf8e5e`). **Etap E′ (fundament mobilny) — UKOŃCZONY 2026-07-20** (niezacommitowany — patrz niżej). Następny: **Etap H — profil mobilny** (plan krótkoterminowy #1/#2/#7a).

## Ukończone (Etap E′ — fundament mobilny)

- **Oficjalne breakpointy** 767/820/1100 zapisane w `docs/UI_RULES.md` §18 (usunięty „znany rozjazd"); wcześniejsza spec 767/768/1024 świadomie odrzucona.
- Wspólna stała `src/constants/breakpoints.ts` (`MOBILE_PANEL_MEDIA_QUERY` + wartości progów); literał 820px usunięty z `App.tsx` i `usePanelMotion.ts` (koniec duplikacji).
- `docs/PROJECT_STATE.md` — wzmianka o rozjeździe oznaczona jako rozwiązana.

## Zmienione pliki (Etap E′, niezacommitowane)

- `src/constants/breakpoints.ts` (nowy)
- `src/App.tsx` (import stałej zamiast lokalnego literału)
- `src/hooks/usePanelMotion.ts` (import stałej)
- `docs/UI_RULES.md` §18, `docs/PROJECT_STATE.md`, `tasks/NOW.md`

## Testy / kontrola (Etap E′)

- `npx tsc --noEmit` — czysto ✅ · `npm run test` — **85/85** ✅ · `npm run lint` — czysto ✅ · `npm run build` — OK ✅ (znane ostrzeżenie o bundlu 1,15 MB, P3)

## Niedokończona praca / następny krok

**Następny: Etap H — profil mobilny** (plan krótkoterminowy):
- **#1** skalowanie i animacja napisu „Karnetu" na mobile,
- **#2** przebudowa układu profilu na mobile,
- **#7a** „Ostatnia aktywność" → 3 pozycje (`recentActivityLimit` w `AccountPanel.tsx:77`, `.slice` ~l. 689) + afordancja „pokaż więcej".

Potem **I** (swipe-w-dół zamyka bottom-sheet, #4 — `usePanelMotion` nie ma dziś gestu drag), **J** (redesign wspomnień, #5 — najpierw projekt UX). Osobne duże projekty: dołączanie do eventu przez link (#6), pełny panel aktywności z filtrami (#7b), Etap C (usuwanie konta / eksport GDPR).

## Problemy / ryzyka

- Zadania mobilne H/I mają ryzyko regresji wizualnej (karta „Karnet" jest implementacją referencyjną palety) — weryfikować Playwrightem na 375px.
- #6 (link do eventu) wymaga nowej struktury Firestore + reguł — nie zaczynać bez osobnego projektu.
- Etap B: podgląd OG linku sprawdzalny dopiero na żywym `https://baginson.github.io/EventTimes/`.

## Prompt do następnej sesji

> Kontynuuję Event Times po Etapach B (SEO/OG meta) i E′ (oficjalne breakpointy 767/820/1100 + wspólna stała `src/constants/breakpoints.ts`). Zacznij **Etap H — profil mobilny**: #1 skalowanie/animacja „Karnetu" na mobile, #2 przebudowa układu profilu mobile, #7a „Ostatnia aktywność" → 3 pozycje + „pokaż więcej". Przeczytaj najpierw `tasks/NOW.md`, `docs/PROJECT_STATE.md`, `docs/UI_RULES.md`. Praca głównie w `src/components/AccountPanel.tsx` (1278 l.) + `App.css`. Weryfikuj Playwrightem na 375px (ryzyko regresji karty „Karnet"). Po zmianach: `npm run test`/`lint`/`build` + aktualizacja `PROJECT_STATE.md`/`ROADMAP.md`.
