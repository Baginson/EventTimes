# Now

Jeden aktywny etap. Po ukończeniu przenieś podsumowanie do `tasks/archive/<data>-<slug>.md`.

## Aktualny cel

**Etap H — profil mobilny (w toku).** Ukończone wcześniej: Etap B (`adf8e5e`), Etap E′ (`3ebd1fc`).

## Ukończone w tej sesji (2026-07-20)

- **Etap B** (`adf8e5e`): SEO/OG/theme-color meta w `index.html` (`og:image` = `public/og-image.png`), usunięty `public/favicon.svg` + lokalne `vite-*.log`, poprawione nieaktualne dokumenty.
- **Etap E′** (`3ebd1fc`): oficjalne breakpointy 767/820/1100 w `docs/UI_RULES.md` §18, wspólna stała `src/constants/breakpoints.ts` (koniec duplikacji literału 820px w `App.tsx` i `usePanelMotion.ts`).
- **Etap H cz. 1** (`49c26d5`): mobilny profil = pager 3 stron. `AccountPanel.tsx` ma gałąź `isMobile` (refaktor delegowany Codexowi, diff zrecenzowany) — **desktop render bajt-identyczny**. Strona 1 Karnet + narzędzia (metody logowania na mobile w „Edytuj profil"), strona 2 Wspomnienia, strona 3 kolekcja + Ostatnia aktywność. `App.css`: poziomy CSS scroll-snap (bez nowych zależności).
- **Etap H — interakcja Karnetu (ten commit):** na mobile Karnet startuje na (prawie) pełny ekran; lekki swipe w górę (scroll `> 8px` → stan `passRevealed`, klasa `is-revealed`) skraca kartę i wysuwa z dołu (sticky + fade/slide) przyciski „Edytuj profil"/„Wyloguj". `prefers-reduced-motion` wyłącza animacje.

## Zmienione pliki (ten commit)

- `src/components/AccountPanel.tsx` — stan `passRevealed` + `onScroll`/klasa na `.account-page--pass`.
- `src/App.css` — `.account-page--pass` reveal: card `min-height` 84dvh → 60dvh (`.is-revealed`), `.account-quick-actions` sticky bottom + transform/opacity, reduced-motion.

## Testy / kontrola

- `npx tsc --noEmit` czysto ✅ · `npm run test` 85/85 ✅ · `npm run lint` czysto ✅ · `npm run build` OK ✅ (znane ostrzeżenie o bundlu 1,15 MB, P3).
- **QA WIZUALNE MOBILNEGO PROFILU NIEWYKONANE** — panel wymaga zalogowania (żywy Firebase + OAuth/hasło), nie da się headless tutaj. **Do sprawdzenia przez użytkownika na telefonie**: (1) Karnet na pełny ekran na starcie; (2) swipe w górę wysuwa Edytuj/Wyloguj + skraca kartę, animacja płynna; (3) swipe w prawo → Wspomnienia → w prawo → kolekcja+aktywność; (4) desktop bez zmian.

## Niedokończona praca / następny krok (Etap H — reszta = H3)

1. **Ucinanie nazwy użytkownika i e-maila** na karcie Karnetu — CSS: zawijanie / `clamp()` zamiast `text-overflow: ellipsis; white-space: nowrap` na `.account-pass-identity h1` (`#account-panel-title`) i `.account-pass-email`. (Zgłoszony bug — nazwa i e-mail się ucinają.)
2. **#7a**: `recentActivityLimit` 5 → 3 (`AccountPanel.tsx:~77`, `.slice` w `getRecentActivityItems`) + afordancja „Pokaż całą aktywność" (rozwija inline; pełny panel z filtrami = osobny projekt #7b).
3. **Kropki/wskaźnik stron** pagera (discoverability — dziś nie widać, że można swipe'ować). Mały stan JS (aktywna strona z `onScroll` pagera) + 3 kropki.
4. Dopracowanie stylu sekcji „Metody logowania" wewnątrz „Edytuj profil" na mobile.

Po H3: **Etap I** (swipe-w-dół zamyka bottom-sheet, #4 — `usePanelMotion` nie ma dziś gestu drag), **Etap J** (redesign wspomnień, #5 — najpierw projekt UX). Osobne duże projekty: dołączanie do eventu przez link (#6), pełny panel aktywności z filtrami (#7b), Etap C (usuwanie konta / eksport GDPR).

## Problemy / ryzyka

- Interakcja reveal używa scrolla jako gestu (scrollTop > 8px). Do potwierdzenia na realnym telefonie, czy odczucie jest „swipe z dołu do góry" zgodne z intencją; ewentualnie dostroić próg/animację po QA użytkownika.
- Sticky `.account-quick-actions` może nakładać się na treść pod kartą w trybie edycji (editForm) — do sprawdzenia w QA; ewentualnie ukryć reveal-bar przy `isEditing`.
- #6 (link do eventu) wymaga nowej struktury Firestore + reguł — nie zaczynać bez osobnego projektu.

## Prompt do następnej sesji (gotowy do wklejenia)

> Kontynuuję Event Times. Zrobione: Etapy B (SEO/OG), E′ (breakpointy 767/820/1100 + `src/constants/breakpoints.ts`) i Etap H cz. 1 + interakcja Karnetu (mobilny profil = pager 3 stron; Karnet pełnoekranowy, swipe w górę wysuwa Edytuj/Wyloguj i skraca kartę). Najpierw przeczytaj `tasks/NOW.md`, `docs/PROJECT_STATE.md`, `docs/UI_RULES.md`. Teraz dokończ **Etap H (H3)** w `src/components/AccountPanel.tsx` + `src/App.css`: (1) napraw ucinanie nazwy użytkownika i e-maila na karcie Karnetu (zawijanie/`clamp()` na `.account-pass-identity h1` i `.account-pass-email`); (2) #7a — `recentActivityLimit` 5→3 + „Pokaż całą aktywność" (rozwija inline); (3) kropki/wskaźnik stron pagera na mobile; (4) styl „Metody logowania" w „Edytuj profil" na mobile. Uwaga: mobilny profil renderuje się tylko po zalogowaniu — QA wizualne robi użytkownik na telefonie. Po zmianach: `npx tsc --noEmit`, `npm run test`, `npm run lint`, `npm run build`, potem zaktualizuj `PROJECT_STATE.md`/`ROADMAP.md`/`NOW.md`. Desktop musi zostać bez zmian.
