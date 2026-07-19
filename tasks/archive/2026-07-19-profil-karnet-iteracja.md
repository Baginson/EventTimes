# Iteracja profilu (Karnet): paleta, wspomnienia, powrót, tilt — 2026-07-19

Dokończona iteracja profilu rozpoczęta 2026-07-18 (checkpoint po limicie sesji) + efekt tilt z briefu 21st.dev.

## Zakres

1. **Nowa paleta Karnetu** — niebieski/biały/czarny/szarości; krem i żółty wycofane (`docs/UI_RULES.md` §2, wpis w `docs/DECISIONS.md`). Karta = electric blue + biel, kolekcja = szary surface + białe karty. Nowe tokeny `--color-ink`, `--color-surface`.
2. **Wspomnienie: tryb podglądu** — zapisane wspomnienie pokazuje notatkę jako tekst + przycisk „Edytuj”; edycja ma „Anuluj” przywracające zapisane wartości (`EventPanel.tsx`).
3. **„Wróć do profilu”** — event otwarty z profilu (wspomnienie/kolekcja) dostaje przycisk powrotu do profilu (`App.tsx`: `wasEventOpenedFromProfile`, `EventPanel.tsx`: `onReturnToProfile`).
4. **Tilt 3D na karcie Karnetu** — `src/components/TiltCard.tsx` na istniejącym `framer-motion` (bez nowej zależności); tylko `pointer: fine`, wyłączony przy `prefers-reduced-motion`; pochyla się tylko statyczna wizytówka, przyciski pod kartą (`AccountPanel.tsx`, `App.css`).
5. Porządki: artefakty Obsidiana i `tasks/references/` w `.gitignore` + `ignorePatterns` w `.oxlintrc.json`.

## Weryfikacja

- `npm run test` 64/64 ✅, `npm run lint` ✅, `npm run build` ✅.
- Weryfikacja wizualna Playwright (2026-07-19, świeże konto QA `qa.claude2.eventtimes@example.com`): paleta, tilt (transform + reset), podgląd→edycja→anuluj wspomnienia, „Wróć do profilu”, mobile 375px, konsola bez błędów.
- Znany drobiazg (istniał wcześniej): etykieta „WYDARZENIA” w pasku statystyk skraca się na 375px.
