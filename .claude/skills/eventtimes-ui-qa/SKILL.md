---
name: eventtimes-ui-qa
description: Run a UI/UX QA pass on the running Event Times app across desktop and mobile viewports, checked against docs/UI_RULES.md. Use after any UI-affecting change (panels, search, forms, mobile layout, admin screens), or when asked to "review the UI", "check mobile", "QA the app", or "test the UI".
---

# Event Times — UI QA pass

## When to use

After a UI-affecting change lands (from Codex or directly), before marking it done — especially anything touching `src/components/*Panel*.tsx`, `src/components/Search*.tsx`, `src/components/MobileBottomBar.tsx`, or `App.css`.

## Steps

1. Make sure the dev server is running (`npm run dev`). Note the actual port Vite picked — don't assume 5173.
2. Dispatch the `ui-reviewer` subagent with the specific area to check (e.g. "review the venue panel description behavior on desktop and mobile" or "review the search dropdown empty/loading/filtered states"). Give it the dev server URL.
3. Read its report. Cross-check anything it flags as "new" against `docs/PROJECT_STATE.md`'s known-gaps list — don't re-open something already tracked there unless it's gotten worse.
4. If real regressions are found, do not fix them inline as part of "QA" — scope them as a proper Codex task per `eventtimes-feature`, or fix directly yourself if trivial and clearly in-scope, then re-run this pass.
5. Summarize pass/fail against `docs/UI_RULES.md`'s specific sections relevant to what changed (e.g. §7 Panels, §11 Search, §18 Responsiveness, §19 Accessibility) — cite the section number, don't just say "looks fine."

## What "good" looks like

- Matches `docs/UI_RULES.md`, not just "looks nice."
- Desktop: floating panels, map always visible, correct font usage (Bungee only on large headings/brand).
- Mobile (test at 375×812 at minimum): bottom sheet panels, ≥40px touch targets, bottom bar hides when a panel is open, no desktop layout crammed onto the viewport.
- No new console errors or failed network requests introduced.
- Loading/empty/error states present and match `docs/UI_RULES.md` §16-17 copy where applicable.

## What NOT to do

Don't install Playwright MCP or any other browser automation tool for this — `playwright-cli` (already installed as a skill) is sufficient and is what `ui-reviewer` uses. Don't spin up a second dev server if one is already running. Don't treat this skill as a substitute for `npm run test`/`lint`/`build` — those are separate, always required, and covered by `eventtimes-release`.
