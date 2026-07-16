#!/usr/bin/env node
'use strict';
// PreToolUse hook (Bash|PowerShell). Blocks a short list of destructive
// git/filesystem commands. Heuristic, not a full shell parser — intended to
// stop an impulsive/accidental destructive command, not a determined bypass.
const fs = require('fs');

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const command = String(input?.tool_input?.command ?? '');
if (!command) process.exit(0);

// Destructive operations inside the session scratchpad/temp dir are fine.
const SCRATCHPAD_ALLOW = /AppData[\\/]Local[\\/]Temp[\\/]claude/i;
if (SCRATCHPAD_ALLOW.test(command)) process.exit(0);

const RULES = [
  [/\bgit\s+push\b[^\n]*\s(--force(?!-with-lease)|-f)\b/i,
    'git push --force jest zablokowany przez hook bezpieczeństwa. Użyj --force-with-lease po jawnej zgodzie użytkownika, albo poproś go o ręczne wykonanie.'],
  [/\bgit\s+reset\b[^\n]*--hard\b/i,
    'git reset --hard jest zablokowany przez hook bezpieczeństwa (ryzyko utraty niezacommitowanej pracy).'],
  [/\bgit\s+clean\b[^\n]*-[a-z]*f/i,
    'git clean -f jest zablokowany przez hook bezpieczeństwa (nieodwracalne usunięcie plików).'],
  [/\bgit\s+branch\b[^\n]*-D\b/i,
    'git branch -D jest zablokowany przez hook bezpieczeństwa (wymuszone usunięcie brancha).'],
  [/\bgit\s+checkout\s+--\s+\.\s*$/i,
    'git checkout -- . jest zablokowany przez hook bezpieczeństwa (odrzuca niezacommitowane zmiany).'],
  [/\bgit\s+checkout\s+--\s+\.\s/i,
    'git checkout -- . jest zablokowany przez hook bezpieczeństwa (odrzuca niezacommitowane zmiany).'],
  [/\brm\s+[^\n]*-[a-z]*r[a-z]*f\b/i,
    'rm -rf jest zablokowany przez hook bezpieczeństwa poza katalogiem scratchpad.'],
  [/\brm\s+[^\n]*-[a-z]*f[a-z]*r\b/i,
    'rm -fr jest zablokowany przez hook bezpieczeństwa poza katalogiem scratchpad.'],
  [/\brm\s+[^\n]*--recursive\b[^\n]*--force\b/i,
    'rm --recursive --force jest zablokowany przez hook bezpieczeństwa poza katalogiem scratchpad.'],
  [/Remove-Item\b[^\n]*-Recurse\b[^\n]*-Force\b/i,
    'Remove-Item -Recurse -Force jest zablokowany przez hook bezpieczeństwa poza katalogiem scratchpad.'],
  [/Remove-Item\b[^\n]*-Force\b[^\n]*-Recurse\b/i,
    'Remove-Item -Force -Recurse jest zablokowany przez hook bezpieczeństwa poza katalogiem scratchpad.'],
];

for (const [re, reason] of RULES) {
  if (re.test(command)) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }));
    process.exit(0);
  }
}

process.exit(0);
