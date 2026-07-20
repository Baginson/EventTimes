#!/usr/bin/env node
'use strict';
// Claude Code statusLine command (Windows-friendly, Node — no jq needed).
// Reads the session JSON on stdin, prints ONE compact status line to stdout,
// and — as a side effect — persists the latest usage reading to
// .claude/usage-state.json for the usage-guard hook to act on.
//
// Hard rule: this must NEVER throw to stdout. The status bar shows whatever we
// print, so any failure falls back to a minimal line and swallows the error.
const fs = require('fs');
const path = require('path');

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf-8'));
  } catch {
    return {};
  }
}

// The harness can hand us the repo with a lowercase drive letter; canonicalise
// so the state file always lands in the same place regardless of casing.
function repoRoot() {
  let cwd = process.cwd();
  try {
    cwd = fs.realpathSync.native(cwd);
  } catch {}
  return cwd;
}

function num(v) {
  return typeof v === 'number' && isFinite(v) ? v : null;
}

function pct(v) {
  const n = num(v);
  return n === null ? null : Math.round(n);
}

// Unix epoch seconds -> local HH:MM, or null.
function clock(epochSec) {
  const n = num(epochSec);
  if (n === null) return null;
  try {
    return new Date(n * 1000).toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

// Atomic-ish write: temp file in the same dir, then rename (replaces on Win).
function writeStateAtomic(file, obj) {
  const tmp = file + '.' + process.pid + '.tmp';
  try {
    fs.writeFileSync(tmp, JSON.stringify(obj), 'utf-8');
    fs.renameSync(tmp, file);
  } catch {
    try {
      fs.writeFileSync(file, JSON.stringify(obj), 'utf-8');
    } catch {}
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {}
  }
}

const C = {
  dim: '\x1b[2m',
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function colorFor(p) {
  if (p === null) return C.dim;
  if (p >= 90) return C.red;
  if (p >= 75) return C.yellow;
  return C.green;
}

function seg(label, p, resetClock) {
  if (p === null) return `${C.dim}${label} —${C.reset}`;
  const r = resetClock ? `${C.dim}⟳${resetClock}${C.reset}` : '';
  return `${colorFor(p)}${label} ${p}%${C.reset}${r ? ' ' + r : ''}`;
}

function main() {
  const data = readStdin();

  const model = (data.model && data.model.display_name) || 'Claude';
  const rl = data.rate_limits || {};
  const five = rl.five_hour || {};
  const seven = rl.seven_day || {};

  const fivePct = pct(five.used_percentage);
  const sevenPct = pct(seven.used_percentage);
  const ctxPct = pct(data.context_window && data.context_window.used_percentage);
  const fiveReset = num(five.resets_at);
  const sevenReset = num(seven.resets_at);

  // Guard percentage = worst of the two rate-limit windows.
  let guardPct = null;
  let guardWindow = null;
  let guardResetsAt = null;
  if (fivePct !== null) {
    guardPct = fivePct;
    guardWindow = '5h';
    guardResetsAt = fiveReset;
  }
  if (sevenPct !== null && (guardPct === null || sevenPct > guardPct)) {
    guardPct = sevenPct;
    guardWindow = '7d';
    guardResetsAt = sevenReset;
  }

  // Persist reading for the usage-guard hook (single writer of this file).
  writeStateAtomic(path.join(repoRoot(), '.claude', 'usage-state.json'), {
    updatedAt: Date.now(),
    fiveHourPct: fivePct,
    sevenDayPct: sevenPct,
    contextPct: ctxPct,
    resetsAtFiveHour: fiveReset,
    resetsAtSevenDay: sevenReset,
    guardPct,
    guardWindow,
    guardResetsAt,
  });

  const parts = [
    `${C.cyan}${model}${C.reset}`,
    seg('5h', fivePct, clock(fiveReset)),
    seg('7d', sevenPct, clock(sevenReset)),
    seg('ctx', ctxPct, null),
  ];
  process.stdout.write(parts.join(`${C.dim} · ${C.reset}`));
}

try {
  main();
} catch {
  // Absolute last resort — keep the bar alive with something harmless.
  try {
    process.stdout.write('Claude');
  } catch {}
}
