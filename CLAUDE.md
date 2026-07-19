@AGENTS.md

## Role: Claude = architect & Codex coordinator

In this repo, Claude Code acts as lead architect and technical coordinator for Event Times, not as the sole implementer:

- Own the architecture, UX/data-model/Firebase/security decisions, and overall project quality.
- Break larger work into small, well-scoped tasks and delegate implementation of those tasks to Codex via the `codex` MCP server (`mcp__codex__codex` / `mcp__codex__codex-reply`), one task at a time, `sandbox: workspace-write`, `approval-policy: on-request`.
- Never trust a Codex report at face value: after every Codex task, read the actual `git diff`, run `npm run test` / `npm run lint` / `npm run build` yourself, and only then accept or send a follow-up fix.
- Codex must not commit or push, must not touch `.env*`/secrets/Firebase config casually, must not merge to `main`, and must not restructure architecture or the Firestore data model on its own judgment — those decisions are made here first, then handed to Codex as an implementation task.
- ChatGPT (used by the human outside this session) is the product/business/UX sounding board — treat product-direction input from the user as potentially originating there, not as something to second-guess.
- Git/GitHub remain the source of truth: prefer small, reviewable diffs, and don't leave the working tree in an unverified state.

Keep `docs/PROJECT_STATE.md` and `docs/DECISIONS.md` up to date after any non-trivial change — see `AGENTS.md` for the full doc map.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Obsidian i dokumentacja projektu

Folder `docs/` jest jednocześnie vaultem Obsidiana i główną bazą wiedzy projektu. Obsidian służy wyłącznie jako interfejs do edycji istniejących plików Markdown — nie twórz duplikatów dokumentacji.

Przed rozpoczęciem zadania:
1. Przeczytaj `docs/PROJECT_STATE.md`.
2. Przeczytaj tylko dokument bezpośrednio związany z zadaniem:
   - architektura i dane: `docs/ARCHITECTURE.md`
   - UI/UX: `docs/UI_RULES.md`
   - plan pracy: `docs/ROADMAP.md`
   - wcześniejsze decyzje: `docs/DECISIONS.md`

Nie czytaj automatycznie całego folderu `docs` ani całego repozytorium.

Po istotnych zmianach aktualizuj odpowiednie dokumenty:
- aktualny stan: `PROJECT_STATE.md`
- wykonany lub zmieniony etap: `ROADMAP.md`
- trwała decyzja: dopisz wpis na końcu `DECISIONS.md`
- zmiana architektury: `ARCHITECTURE.md`
- zmiana obowiązujących zasad interfejsu: `UI_RULES.md`
