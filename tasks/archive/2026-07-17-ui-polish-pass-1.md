# UI polish pass 1 (2026-07-17)

**Goal**: audit the real running UI (desktop + mobile, Playwright) against `docs/UI_RULES.md` and the brand direction from `docs/design-references/`, then fix the highest-impact quality gaps without a rewrite.

**Audit verdict**: brand core already correct (typography split, pin colors, floating panels, search discipline, reduced-motion, zero console errors) — quality was leaking through micro-drift, not wrong direction.

**What shipped** (each a separate, reviewed, verified Codex task):
1. `085dc5b` — visual foundations: 22 ad-hoc radii → token scale, one-off shadows → tokens (+ `--shadow-button-soft`, `--shadow-cta` to preserve CTA hierarchy — a naive collapse flattened it; caught in code review and fixed), 4 text grays → `--color-muted`/`--color-ink-soft`, microcopy floor 11px.
2. `493534a` — VenuePanel description truncation (>450 chars, parity with EventPanel); both panels `role="dialog"` + Escape-to-close + focus-on-open (deliberately non-modal, no trap — map stays reachable); map pins get accessible names (`role="img"` + escaped `aria-label`).
3. `115bc0b` — touch targets ≥40px (compact Kup bilet chip 34→40, back button 36→40, Czytaj więcej 20→40), card descriptions 14px everywhere (was 12-13), chevron column in collapsible group headers per §8 (rotates on expand), `text-wrap: balance` on Bungee panel titles (kills single-letter orphans).

**Verification**: per task — own diff read, `code-reviewer` subagent, 64/64 tests, lint, build; end-to-end `ui-reviewer` Playwright passes before and after (screenshots: `.playwright-cli/ui-audit-before/` and `ui-audit-after/`).

**Deliberately NOT done** (tracked in `docs/PROJECT_STATE.md` / `docs/ROADMAP.md`): tablet breakpoint reconciliation, AppToast/inline-message unification, VenuePanel↔EventPanel dedup, mobile admin simplification, Escape double-close quirk when search dropdown overlaps a panel.
