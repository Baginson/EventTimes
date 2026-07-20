# Now

Jeden aktywny etap. Po ukończeniu przenieś podsumowanie do `tasks/archive/<data>-<slug>.md`.

## Aktualny cel

**Etap B (gotowość do publicznego launchu) — UKOŃCZONY 2026-07-20.** Następny: **Etap E′ — fundament mobilny** (przyjęcie 820/1100 jako oficjalnych breakpointów + aktualizacja `docs/UI_RULES.md` §18), warunek wstępny dla etapów mobilnych H/I z planu krótkoterminowego.

## Ukończone (Etap B)

- `index.html`: `description`, Open Graph (`og:type/site_name/locale/title/description/url/image` + `image:width/height/alt`), Twitter Card (`summary_large_image`), `theme-color=#064BFF`. `og:url`/`og:image` absolutne (`https://baginson.github.io/EventTimes/…`) — scrapery OG wymagają pełnych URL-i.
- `og:image` = `public/og-image.png` (skopiowany z gitignored `docs/design-references/OG-Image.png`, żeby GitHub Pages go serwował).
- Usunięty nieużywany `public/favicon.svg` (`git rm`) i lokalne `vite-*.log`.
- Poprawione nieaktualne dokumenty: `PROJECT_STATE.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md` (nowy wpis).

## Zmienione pliki

- `index.html` (meta tagi)
- `public/og-image.png` (nowy), `public/favicon.svg` (usunięty)
- `docs/PROJECT_STATE.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`
- `tasks/NOW.md` (ten plik)

## Testy / kontrola

- `npm run test` — **85/85** ✅
- `npm run lint` — czysto ✅
- `npm run build` — OK ✅ (ostrzeżenie o rozmiarze bundla 1,15 MB — znane, P3)
- `npx tsc --noEmit` — czysto ✅
- **Do zrobienia ręcznie po deployu**: sprawdzić podgląd OG linku (np. przez debugger udostępniania / wklejenie linku na komunikator) — działa dopiero na żywym `https://baginson.github.io/EventTimes/`.

## Niedokończona praca / następny krok

**Następny krok: Etap E′ (fundament mobilny).** Zakres: w `docs/UI_RULES.md` §18 zapisać 820/1100 jako oficjalne breakpointy (usunąć „znany rozjazd"), zsynchronizować literały (dziś 820px zduplikowany w `App.tsx:56` i `usePanelMotion.ts:8` — rozważyć wspólną stałą). Potem etapy mobilne:
- **H** — profil mobilny: skalowanie/animacja „Karnetu" (#1) + przebudowa układu profilu mobile (#2) + „Ostatnia aktywność" → 3 pozycje (`recentActivityLimit` w `AccountPanel.tsx:77`) + afordancja „pokaż więcej" (#7a).
- **I** — swipe-w-dół zamyka bottom-sheet (#4) — dziś `usePanelMotion` nie ma żadnego gestu drag.
- **J** — redesign wspomnień w EventPanel (#5) — najpierw projekt UX.

Osobne duże projekty (po decyzjach/projektach): dołączanie do eventu przez link (#6), pełny panel historii aktywności z filtrami (#7b), Etap C (usuwanie konta / eksport GDPR).

## Problemy / ryzyka

- Etap E′ dotyka `docs/UI_RULES.md` — zmiana stałej zasady UI (dozwolona, bo to świadoma decyzja użytkownika z 2026-07-20).
- Zadania mobilne H/I mają ryzyko regresji wizualnej (karta „Karnet" jest implementacją referencyjną palety) — weryfikować Playwrightem na 375px.
- #6 (link do eventu) wymaga nowej struktury Firestore + reguł — nie zaczynać bez osobnego projektu.

## Prompt do następnej sesji

> Kontynuuję Event Times po ukończeniu Etapu B (SEO/OG meta + porządki). Zacznij Etap E′ (fundament mobilny): w `docs/UI_RULES.md` §18 przyjmij 820/1100 jako oficjalne breakpointy i usuń zapis o „znanym rozjeździe", rozważ wspólną stałą dla literału 820px (`App.tsx:56`, `usePanelMotion.ts:8`). Przeczytaj najpierw `tasks/NOW.md`, `docs/PROJECT_STATE.md` i `docs/UI_RULES.md`. Nie ruszaj kodu aplikacji poza uzgodnieniem breakpointów. Po zmianach: `npm run test`/`lint`/`build` i aktualizacja `PROJECT_STATE.md`/`ROADMAP.md`.
