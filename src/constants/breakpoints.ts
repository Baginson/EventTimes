// Oficjalne breakpointy Event Times (decyzja 2026-07-20, docs/UI_RULES.md §18).
// Te wartości muszą pozostać zsynchronizowane z media queries w src/App.css —
// CSS nie może importować z TS, więc literały w App.css są ich świadomym lustrem.
//
// - 767px  — poniżej: panele wchodzą w tryb full-screen (App.css @media max-width: 767px)
// - 820px  — poniżej: panele venue/event/admin renderują się jako bottom sheet (mobile)
// - 1100px — zakres 821–1100px to węższy panel desktopowy; powyżej: pełny desktop
export const BREAKPOINT_PANEL_FULLSCREEN = 767
export const BREAKPOINT_MOBILE_PANEL = 820
export const BREAKPOINT_DESKTOP_WIDE = 1100

/** Media query przełączająca panele na bottom sheet (mobile). */
export const MOBILE_PANEL_MEDIA_QUERY = `(max-width: ${BREAKPOINT_MOBILE_PANEL}px)`
