#!/usr/bin/env node
'use strict';
// UserPromptSubmit hook: deterministic guard against running out of the Claude
// Code plan limit. It does NOT compute usage itself (hook stdin has no
// rate_limits) — it reads the reading persisted by .claude/statusline.cjs and,
// on each ESCALATION into a new threshold band (75/85/90/95), injects a
// one-time instruction block for Claude plus a short user-facing note.
//
// Reacts to the WORST of the 5h and 7-day windows (statusline already stores
// that as guardPct). Never blocks work; on any doubt it stays silent.
const fs = require('fs');
const path = require('path');

// --- locate state files (canonical repo root, casing-safe) -----------------
let root = process.cwd();
try {
  root = fs.realpathSync.native(root);
} catch {}
const STATE_FILE = path.join(root, '.claude', 'usage-state.json');
const GUARD_FILE = path.join(root, '.claude', 'usage-guard-state.json'); // single writer: this hook

// If the reading is older than this, treat usage as unknown and stay silent
// (rate_limits temporarily unavailable must never block normal work).
const STALE_MS = 15 * 60 * 1000;

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

function writeGuardState(band) {
  const tmp = GUARD_FILE + '.' + process.pid + '.tmp';
  const payload = JSON.stringify({ lastInjectedBand: band, updatedAt: Date.now() });
  try {
    fs.writeFileSync(tmp, payload, 'utf-8');
    fs.renameSync(tmp, GUARD_FILE);
  } catch {
    try {
      fs.writeFileSync(GUARD_FILE, payload, 'utf-8');
    } catch {}
  }
}

function bandOf(p) {
  if (p >= 95) return 95;
  if (p >= 90) return 90;
  if (p >= 85) return 85;
  if (p >= 75) return 75;
  return 0;
}

function clock(epochSec) {
  if (typeof epochSec !== 'number' || !isFinite(epochSec)) return null;
  try {
    return new Date(epochSec * 1000).toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

const MESSAGES = {
  75: {
    system: 'Limit planu 75% — nie zaczynaj nowych dużych zadań ani subagentów.',
    context:
      'PRÓG UŻYCIA 75%. Zbliżasz się do limitu planu. Zasady:\n' +
      '- Nie rozpoczynaj nowych dużych zadań.\n' +
      '- Nie uruchamiaj nowych subagentów ani Codexa bez wyraźnej potrzeby.\n' +
      '- Dokończ i domknij bieżący, mały wątek pracy.',
  },
  85: {
    system: 'Limit planu 85% — domknij bieżącą atomową część i przygotuj się do przekazania sesji.',
    context:
      'PRÓG UŻYCIA 85%. Zasady:\n' +
      '- Zakończ bieżącą małą, atomową część pracy.\n' +
      '- Nie rozpoczynaj następnego etapu.\n' +
      '- Wykonaj tylko niezbędną, celowaną weryfikację (bez pełnych audytów).\n' +
      '- Zacznij przygotowywać przekazanie sesji (checkpoint w tasks/NOW.md).',
  },
  90: {
    system: 'Limit planu 90% — przygotuj przekazanie: zaktualizuj tasks/NOW.md i zakończ pracę.',
    context:
      'PRÓG UŻYCIA 90% — PRZEKAZANIE SESJI. Wykonaj natychmiast i nie rozpoczynaj kolejnych zmian:\n' +
      '1. Zaktualizuj tasks/NOW.md: aktualny cel, ukończone elementy, zmienione pliki, stan test/lint/typecheck/build (nie oznaczaj jako wykonane, jeśli ich nie uruchomiono), niedokończona praca, problemy/ryzyka, jednoznaczny następny krok.\n' +
      '2. Na końcu tasks/NOW.md umieść krótki prompt gotowy do wklejenia w nowej sesji.\n' +
      '3. Pokaż ten prompt również użytkownikowi.\n' +
      '4. Zakończ pracę — żadnych nowych zadań ani szerokich analiz.',
  },
  95: {
    system: 'Limit planu 95% — TRYB AWARYJNY: tylko bezpieczny zapis stanu i zakończenie sesji.',
    context:
      'PRÓG UŻYCIA 95% — TRYB AWARYJNY. Dozwolone są WYŁĄCZNIE czynności potrzebne do bezpiecznego zapisania stanu i zakończenia sesji:\n' +
      '- Dokończ zapis tasks/NOW.md i prompt przekazania, jeśli jeszcze go nie ma.\n' +
      '- Nie wykonuj nowych zadań, edycji kodu ani szerokich analiz.\n' +
      '- Krótko potwierdź użytkownikowi, że sesję trzeba zakończyć.',
  },
};

function main() {
  const state = readJson(STATE_FILE);
  if (!state) process.exit(0); // no reading yet -> never block

  if (typeof state.updatedAt === 'number' && Date.now() - state.updatedAt > STALE_MS) {
    process.exit(0); // stale reading -> usage unknown -> stay silent
  }

  const guardPct = state.guardPct;
  if (typeof guardPct !== 'number' || !isFinite(guardPct)) {
    process.exit(0); // rate_limits unavailable -> never block
  }

  const band = bandOf(guardPct);
  const guard = readJson(GUARD_FILE) || {};
  const last = typeof guard.lastInjectedBand === 'number' ? guard.lastInjectedBand : 0;

  // Usage dropped below the last warned band (window reset): re-arm silently so
  // a future escalation warns again, but don't inject now.
  if (band < last) {
    writeGuardState(band);
    process.exit(0);
  }

  // Same band already warned, or below the first threshold: nothing to do.
  if (band === last || band < 75) {
    if (band !== last) writeGuardState(band);
    process.exit(0);
  }

  // Escalation into a new, higher band -> inject ONCE.
  const msg = MESSAGES[band];
  const win = state.guardWindow === '7d' ? 'tygodniowego (7d)' : 'planu 5h';
  const resetAt =
    clock(state.guardWindow === '7d' ? state.resetsAtSevenDay : state.resetsAtFiveHour);
  const resetTxt = resetAt ? ` Reset ${state.guardWindow || ''} ok. ${resetAt}.` : '';

  writeGuardState(band);
  process.stdout.write(
    JSON.stringify({
      systemMessage: `⚠️ ${msg.system} (limit ${win}: ${Math.round(guardPct)}%).${resetTxt}`,
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext:
          `[OCHRONA LIMITU] Wykorzystanie limitu ${win}: ${Math.round(guardPct)}%.` +
          `${resetTxt}\n${msg.context}`,
      },
    }),
  );
  process.exit(0);
}

try {
  main();
} catch {
  process.exit(0); // any failure -> do not block the prompt
}
