# Event Times — UI / UX Rules

Committed source of truth for design rules. (The original `docs/EVENT_TIMES_UI_RULES.md` was consolidated into this file and removed on 2026-07-16 — recoverable from git history.)

## 1. Visual direction

Editorial map app + event poster. Bold but readable, distinctive, local premium product — not a generic SaaS template, not glassmorphism, not heavy gradients, not stock dashboard look.

**Brand essence** (from the product poster in `docs/design-references/`, local-only folder): "Mapa wydarzeń. Miejsca. Ludzie. Wszystko w jednym." / "Odkrywaj. Przeżywaj. Wracaj." Short imperative slogans, big blocky electric-blue wordmark on cream or paper texture, cutout/sticker product elements, repeated text as a graphic pattern, blue tape accents. The poster's UI mockups (floating right venue panel with Nadchodzące/Minione groups, mobile bottom sheet, search as the top entry point) match the implemented app — treat that poster as the reference for how Event Times should *feel*, never as a layout to copy 1:1.

`docs/design-references/README.md` (local-only, gitignored — reference images include third-party brand work) explains what to take from each image and what not to copy. If working on a machine without that folder, this section is the summary.

## 2. Colors

- Electric Blue `#064BFF` — active elements, CTAs, selected pins, badges, key accents.
- Deep Navy `#07142F` — text, default pins, icons, base elements.
- Cream `#FFF1C7` / Soft Cream `#FFF8E6` — card/panel backgrounds, empty states, poster-inspired elements.
- White `#FFFFFF` — clean cards/panels.
- Light Border `#E3E8F2`, Muted Text `#64748B`, Accent Yellow `#FFE15A`.
- Danger Red `#EF4444` — destructive actions only.
- Don't add new colors without a strong reason.

## 3. Typography

- **Bungee** — large venue/event names, brand headlines, a few strong section titles only. Never for descriptions, forms, dates, addresses, tooltips, buttons, filters, the admin panel, or long text.
- **IBM Plex Sans** — descriptions, longer text, panel content, narrative copy.
- **Inter** — buttons, tooltips, pin hover labels, chips, badges, counters, filters, inputs, selects, small controls, search dropdown, small actions (Nawiguj, Byłem, Chcę iść).
- Never switch the whole app globally to Inter.

## 4. Long text

Long descriptions truncate with "Czytaj więcej" / "Zwiń opis" (currently implemented in `EventPanel`, missing in `VenuePanel` — see `docs/PROJECT_STATE.md`). Preserve paragraphs, line-height ~1.55–1.7. No empty description section when there's no description. Long titles wrap (`overflow-wrap`), never truncate or overflow the panel.

## 5. UI hierarchy

Every screen/panel answers: what is it, where is it, when is it, what can I do. Event panel order: type, status, name, date, user action, venue, description, source, ticket (if applicable). Venue panel order: type, name, address, navigation, description, events. Don't put multiple equal-weight CTAs side by side without clear hierarchy.

## 6. Map

Map is always the priority; panels float over it, never fully obscure it without reason. Floating panels on desktop, bottom sheet on mobile. Pins are minimal: Deep Navy default, Electric Blue selected/active, subtle ring on hover/active, no classic numbered cluster bubbles as the primary solution.

## 7. Panels

**Desktop**: `position: fixed`, margin from top/bottom, map visible above and below, border-radius 24–32px, subtle shadow/border, internal scroll, never a full-screen white wall.

**Mobile**: bottom sheet, comfortable scroll, large touch targets, less information at once, never the desktop layout crammed onto a phone.

## 8. Venue panel

Sections aligned and consistent; event count must not look like an accidental element. "Nadchodzące"/"Minione" headers share identical layout; counters and chevrons sit in fixed columns (not manual margins):
```css
.event-group-toggle {
  display: grid;
  grid-template-columns: 1fr auto 24px;
  align-items: center;
  gap: 12px;
}
```
Empty-events state uses the real brand mark (`public/brand/event-times-mark.png`), never a placeholder "ET" circle.

## 9. Event panel

Compact and readable: no wall of text, date near the title, "Byłem"/"Chcę iść" high up (not buried at the bottom), venue card compact, description only if present, source as a small link, ticket button only when it makes sense. No "Zainteresowany". Heart: icon alone, no text, top-right corner, clear active state.

## 10. Events

Status computed dynamically (`ongoing`/`upcoming`/`past`), never stored. Upcoming before past; past is an archive but still relevant. No time shown for events without one. Description optional, no empty section when absent.

## 11. Search

Two modes — Miejsca and Wydarzenia — that never mix results. Never shows the whole database on open: results appear only once the user types (min. 2 characters), picks a place/event type, or picks a date. The events date filter offers: Wszystkie, Dzisiaj, Jutro, Weekend, Wybierz datę (single day or an od–do range). Events tab groups results into Trwa teraz / Nadchodzące / Minione, no redundant per-card status badge. Places tab never shows everything unfiltered. Dropdown looks like a designed panel, not a raw list, with real empty states and a working expand arrow.

## 12. Forms

Short and practical: only truly necessary fields required, description optional, past dates allowed, time optional with a "Bez godziny" option, human error messages (not relying solely on HTML validation). No poster typography in forms.

## 13. User actions

Logged out: sees public data, "Kup bilet" (non-past + ticketUrl), "Nawiguj"; never sees like/want-to-go/been. Logged in: can like a venue/event, mark "Chcę iść"/"Byłem". Never bring back "Zainteresowany".

## 14. Admin

Practical, visually calmer — doesn't need the poster treatment. `admins/{uid}` gating, no passwords in code, no `VITE_ADMIN_EMAIL`, regular users never see the admin panel, Firestore Rules are the real security boundary.

## 15. Animation

Helps, doesn't distract. Used for: panel open/close, section expand, hover/active, save, loading, toasts, filter change. Not for: everything at once, large map elements without reason, text that hinders reading. Timing: small interactions 120–180ms, panels/dropdowns 180–260ms, larger transitions 260–360ms. Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`. Always respect `@media (prefers-reduced-motion: reduce)`.

## 16. Loading

No old textual "Ładowanie Event Times..." panel. Initial Firestore load: full-screen overlay, blurred background (`rgba(7, 20, 47, 0.28)`, `backdrop-filter: blur(8px)`), centered white "Event Times" text, white spinner below (34×34px, 0.8s linear infinite), no large card, no extra technical text. On error, loading disappears and an error message appears (as of Etap A, with a retry action).

## 17. Empty states

Never show emptiness unexplained: "Brak wydarzeń dla tego miejsca.", "Brak wyników dla wybranych filtrów.", and — for admins on an empty Firestore — a hint to import JSON. Empty states may use the small brand mark, never oversized.

## 18. Responsiveness

Mobile is not a smaller desktop. Breakpoints per this spec: mobile ≤767px, tablet 768–1023px, desktop 1024px+ — **note**: the current implementation actually uses 820px/1100px as its primary breakpoints (see `docs/PROJECT_STATE.md`), which is a known, tracked divergence, not yet reconciled to this spec.

Mobile: bottom sheet, larger buttons, larger touch spacing, less at once, search as the primary entry point, admin less exposed. Desktop: floating search, floating right panel, map always visible, admin/profile top-right.

## 19. Accessibility

Good contrast, visible focus, `aria-label` on icon buttons, comfortable touch targets, never rely on color alone, statuses understandable as text. Minimums: button/input height 40–48px on mobile, icon hit area ≥40px, body text never smaller than 14px.

## 20. Where the poster style is allowed

Allowed: promotional graphics, hero/landing, empty states, badges, onboarding, "How it works" sections, subtle paper texture, tape/sticker accents. Don't overdo it in: forms, admin panel, results lists, the map, or anywhere the user needs to read data quickly.

## 21. Final rule

Every UI change must satisfy three questions: does the user understand what they're seeing faster? Can they more easily click what they need? Does it look like Event Times, not a generic template? If not — don't make the change.
