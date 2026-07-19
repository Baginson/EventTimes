# Event Times — Roadmapa

Etapowy plan z pełnego audytu 2026-07-16. Każdy etap jest delegowany do Codex jako małe, jednozadaniowe prace i weryfikowany (`test`/`lint`/`build` + ręczny przegląd diffu) przed przejściem do następnego. Aktualizuj tutaj status wraz z domykaniem etapów; przenoś notatki z ukończonych etapów do `docs/DECISIONS.md` i `tasks/archive/`.

| Etap | Cel | Status |
|---|---|---|
| **A — Stabilność** | Error boundary, retry ładowania danych, bramka test/lint w CI | ✅ Ukończone (2026-07-16) |
| **B — Gotowość do publicznego launchu** | SEO/OG/theme-color meta tags, decyzja CI dla `VITE_TICKETMASTER_API_KEY`, porządki w repo (zbędne logi, nieużywany favicon) | Następne |
| **C — Cykl życia konta** | Reset hasła, usunięcie konta / eksport danych | Planowane |
| **D — Panele i dostępność** | Skracanie opisu VenuePanel (parytet z EventPanel), Escape/`role="dialog"`/focus trap w VenuePanel + EventPanel | Planowane |
| **E — Spójność mobile** | Uzgodnić breakpointy z `docs/UI_RULES.md`, naprawić zbyt małe touch targets/tekst (`.search-chevron`, `.event-card-description`) | Planowane |
| **F — Porządki techniczne** | Skonsolidować `requireDb()`, spójna walidacja współrzędnych, rozwiązać martwe pole `status`, zmniejszyć duplikację VenuePanel/EventPanel | Planowane |
| **G — Dokumentacja** | Utrzymywać `docs/` jako aktualne po każdym etapie (ciągłe, nie jednorazowy pass) | W toku |

## Odłożone (nie blokują MVP)

- Modularyzacja `App.css`.
- Pokrycie testami komponentowymi/integracyjnymi (kontrole UI przez Playwright z subagentem `ui-reviewer` mogą częściowo to pokryć w międzyczasie).
- Prawdziwy layout tabletowy.
- Ujednolicenie `AppToast` z per-component inline error/success messages.

## Jawnie poza zakresem, chyba że użytkownik poprosi

Pełny redesign, migracja frameworka, zamiana Firebase albo Leaflet, przebudowa modelu danych Firestore, płatne usługi, masowe instalacje zależności — zobacz `AGENTS.md`.
