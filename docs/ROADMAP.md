# Event Times — Roadmapa

Etapowy plan z pełnego audytu 2026-07-16. Każdy etap jest delegowany do Codex jako małe, jednozadaniowe prace i weryfikowany (`test`/`lint`/`build` + ręczny przegląd diffu) przed przejściem do następnego. Aktualizuj tutaj status wraz z domykaniem etapów; przenoś notatki z ukończonych etapów do `docs/DECISIONS.md` i `tasks/archive/`.

| Etap | Cel | Status |
|---|---|---|
| **A — Stabilność** | Error boundary, retry ładowania danych, bramka test/lint w CI | ✅ Ukończone (2026-07-16) |
| **B — Gotowość do publicznego launchu** | SEO/OG/theme-color meta tags (`og:image` = `public/og-image.png`), porządki w repo (usunięte zbędne logi i nieużywany favicon). ~~Decyzja CI dla `VITE_TICKETMASTER_API_KEY`~~ — rozwiązane 2026-07-19 backendem Cloudflare Worker (zobacz `DECISIONS.md`) | ✅ Ukończone (2026-07-20) |
| **E′ — Fundament mobilny** | Przyjęcie 820/1100 jako **oficjalnych** breakpointów (decyzja 2026-07-20), aktualizacja `docs/UI_RULES.md` §18; warunek wstępny dla etapów mobilnych H/I | ✅ Ukończone (2026-07-20) |
| **H — Profil mobilny** (plan krótkoterminowy #1, #2, #7a) | Skalowanie i animacja napisu „Karnetu" na mobile (#1), przebudowa układu profilu na mobile (#2), „Ostatnia aktywność" → 3 pozycje + afordancja „pokaż więcej" (#7a) | ✅ Ukończone (2026-07-20) — QA wizualne na telefonie zaległe |
| **I — Gesty paneli** (plan krótkoterminowy #4) | Gest przeciągnięcia w dół zamyka bottom-sheet/panele na mobile; bez kolizji z wewnętrznym scrollem, z poszanowaniem `prefers-reduced-motion` | ✅ Ukończone (2026-07-21) — QA na telefonie zaległe |
| **J — Wspomnienia** (plan krótkoterminowy #5) | Redesign wizualny + rozbudowa sekcji wspomnień w panelu eventu (dziś tylko zarys); wymaga wcześniejszego projektu UX | Planowane |
| **C — Cykl życia konta** | Usunięcie konta / eksport danych (reset hasła już zrobiony) | Planowane |
| **D — Panele i dostępność** | Escape/`role="dialog"` już zrobione; pozostaje ewentualny dalszy parytet i drobne a11y | Planowane |
| **E — Spójność mobile** | Po E′: naprawić pozostałe zbyt małe touch targets/tekst, dopracować bottom-sheety | Planowane |
| **F — Porządki techniczne** | Skonsolidować `requireDb()` (4 serwisy), spójna walidacja współrzędnych, **usunąć martwe pole `status`** (decyzja 2026-07-20: nieczytane i niezapisywane w formularzach), zmniejszyć duplikację VenuePanel/EventPanel | Planowane |
| **G — Dokumentacja** | Utrzymywać `docs/` jako aktualne po każdym etapie (ciągłe, nie jednorazowy pass) | W toku |

## Osobne duże projekty (poza batchem UI — wymagają własnego projektu/decyzji)

- **Dołączanie do eventu przez link** (plan krótkoterminowy #6). Skromna warstwa społeczna: właściciel akcji „Chcę iść/Byłem" generuje link zapraszający, inny zalogowany użytkownik przez link dopisuje się do tego eventu. **Bez** systemu znajomych i wiadomości w aplikacji (ewentualnie w przyszłości). Wymaga nowej, wąsko określonej struktury współdzielonej w Firestore + reguł; free-first. Wysokie ryzyko/rozmiar — nie wchodzi do batcha UI.
- **Pełny panel historii aktywności** (plan krótkoterminowy #7b). Osobny panel z całą historią, **filtrowanie po typie aktywności** (Polubione / Chcę iść / Byłem) i rozbudowa opcji. Duży, niezależny od #7a (skrócenia do 3 pozycji).
- Bundle 1,15 MB w jednym chunku — rozważyć lazy-load Admin/Auth (perf launchu).

## Odłożone (nie blokują MVP)

- Modularyzacja `App.css`.
- Pokrycie testami komponentowymi/integracyjnymi (kontrole UI przez Playwright z subagentem `ui-reviewer` mogą częściowo to pokryć w międzyczasie).
- Prawdziwy layout tabletowy.
- Ujednolicenie `AppToast` z per-component inline error/success messages.

## Jawnie poza zakresem, chyba że użytkownik poprosi

Pełny redesign, migracja frameworka, zamiana Firebase albo Leaflet, przebudowa modelu danych Firestore, płatne usługi, masowe instalacje zależności — zobacz `AGENTS.md`.
