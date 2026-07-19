# Powrót z panelu eventu — automatyczne wykrywanie źródła — 2026-07-19

Follow-up do iteracji Karnetu (wymaganie dopisane przez użytkownika w NOW.md).

## Zakres

Panel eventu pokazuje dokładnie **jeden** przycisk powrotu zależny od źródła otwarcia:

- z panelu miejsca → „Wróć do miejsca”,
- z profilu (wspomnienie/kolekcja) → „Wróć do profilu”,
- z wyszukiwarki lub deep-linku → „Pokaż miejsce” (przejście do miejsca bez udawania powrotu).

Implementacja: `src/App.tsx` — stan `eventOrigin: 'venue' | 'profile' | 'direct'` + `selectEventFromVenue()` (zastąpiły flagę `wasEventOpenedFromProfile`); `src/components/EventPanel.tsx` — prop `origin`, pojedynczy przycisk w `.event-back-row`. Zasada zapisana w `docs/UI_RULES.md` §9, wpis w `docs/DECISIONS.md`.

## Weryfikacja

`npm run test` 64/64 ✅, `npm run lint` ✅, `npm run build` ✅. Playwright: wszystkie trzy źródła sprawdzone (deep-link → „Pokaż miejsce”; panel miejsca → „Wróć do miejsca”; profil → „Wróć do profilu” + działający powrót do otwartego profilu), konsola bez błędów.
