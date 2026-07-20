# graphify
- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.
## Zasady oszczędnego używania kontekstu

Pracuj możliwie bezpośrednio i oszczędnie.

* Nie uruchamiaj subagentów domyślnie. Użyj subagenta tylko wtedy, gdy zadanie rzeczywiście wymaga niezależnej równoległej analizy.
* Do prostych i średnich zadań wykonuj pracę samodzielnie w głównym kontekście.
* Nie deleguj zadania do Codexa, jeżeli szybciej możesz wykonać je bezpośrednio.
* Przed uruchomieniem Codexa krótko oceń, czy delegacja rzeczywiście zmniejszy koszt i ilość kontekstu.
* Nie czytaj całego repozytorium. Otwieraj tylko pliki bezpośrednio związane z zadaniem oraz ich konieczne zależności.
* Nie przeglądaj ponownie plików, których zawartość jest już znana w bieżącej sesji, chyba że mogły się zmienić.
* Nie uruchamiaj Playwrighta ani pełnego audytu UI, jeśli zadanie można zweryfikować przez analizę kodu lub krótką kontrolę konkretnego widoku.
* Nie twórz rozbudowanych raportów z wykonanej pracy. Po zakończeniu podaj jedynie krótkie podsumowanie zmian, zmienione pliki i ewentualne problemy.
* Nie analizuj całej dokumentacji projektu przy każdym zadaniu. Korzystaj z niej tylko wtedy, gdy konkretne wymaganie jest niejasne.
* Nie aktualizuj wszystkich plików Markdown automatycznie. Aktualizuj wyłącznie dokument, którego treść faktycznie stała się nieaktualna.
* Nie wykonuj dodatkowych ulepszeń poza zakresem zadania bez wyraźnej potrzeby.
* Jeżeli zadanie jest duże, podziel je na małe etapy wykonywane kolejno, zamiast uruchamiać wielu agentów jednocześnie.
## Dokumentacja projektu

Folder `docs/` jest główną bazą wiedzy projektu i jednocześnie vaultem Obsidiana.

Przed rozpoczęciem zadania:
1. Przeczytaj `docs/PROJECT_STATE.md`.
2. Przeczytaj tylko dokument bezpośrednio związany z zadaniem:
   - architektura i dane: `docs/ARCHITECTURE.md`
   - UI/UX: `docs/UI_RULES.md`
   - plan pracy: `docs/ROADMAP.md`
   - wcześniejsze decyzje: `docs/DECISIONS.md`

Nie czytaj automatycznie całego folderu `docs` ani całego repozytorium.

Po istotnej zmianie:
- zaktualizuj `docs/PROJECT_STATE.md`,
- zaktualizuj `docs/ROADMAP.md`, jeżeli etap został rozpoczęty lub zakończony,
- dopisz wpis na końcu `docs/DECISIONS.md`, jeżeli została podjęta trwała decyzja.
- zaktualizuj 'tasks/NOW.md' żeby znać następny krok na nowej sesji

## Ochrona przed wyczerpaniem limitu Claude Code

Deterministyczny strażnik limitu planu działa przez statusline + hook (nie polegaj na samej instrukcji tekstowej):

- `.claude/statusline.cjs` (statusLine) pokazuje model, użycie limitu 5h / 7d / kontekstu i czas resetu, oraz zapisuje ostatni odczyt do `.claude/usage-state.json` (gitignored).
- `.claude/hooks/usage-guard.cjs` (UserPromptSubmit) reaguje na **wyższą** wartość z limitu 5h i 7d i przy wejściu w nowy próg **raz** wstrzykuje instrukcje (dedup w `.claude/usage-guard-state.json`).

Gdy pojawi się wstrzyknięty komunikat `[OCHRONA LIMITU]`, zastosuj się do niego:
- **75%** — nie zaczynaj nowych dużych zadań ani subagentów; domknij bieżący mały wątek.
- **85%** — zakończ bieżącą atomową część, tylko celowana weryfikacja, zacznij przygotowanie przekazania.
- **90%** — zaktualizuj `tasks/NOW.md` (cel, zrobione, zmienione pliki, stan test/lint/typecheck/build, następny krok) i dodaj na końcu prompt do nowej sesji, pokaż go użytkownikowi, zakończ pracę.
- **95%** — tryb awaryjny: tylko bezpieczny zapis stanu i zakończenie sesji.

Gdy dane `rate_limits` są niedostępne lub odczyt jest przeterminowany, strażnik milczy i nie blokuje pracy.