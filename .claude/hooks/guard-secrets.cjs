#!/usr/bin/env node
'use strict';
// PreToolUse hook (Read|Edit|Write|Bash|PowerShell). Keeps .env/.env.local/
// .env.*.local content out of the agent's context and prevents force-adding
// them to git. .env.example is always allowed (placeholder values only).
const fs = require('fs');

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const toolName = String(input?.tool_name ?? '');
const filePath = String(input?.tool_input?.file_path ?? '');
const command = String(input?.tool_input?.command ?? '');

const ENV_FILE_RE = /(^|[\\/])\.env(\.[^\\/]+)?$/i;
const isExampleFile = (s) => /\.env\.example$/i.test(s);

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
}

if ((toolName === 'Read' || toolName === 'Edit' || toolName === 'Write') && filePath) {
  if (ENV_FILE_RE.test(filePath) && !isExampleFile(filePath)) {
    deny(`"${filePath}" wygląda na plik z sekretami (.env/.env.local). Odczyt/edycja przez agenta są zablokowane hookiem bezpieczeństwa — sekrety konfiguruje wyłącznie użytkownik ręcznie.`);
    process.exit(0);
  }
}

if ((toolName === 'Bash' || toolName === 'PowerShell') && command) {
  // Line-by-line: the .env mention and the read/force-add must be on the SAME
  // line, otherwise a heredoc commit message that merely mentions ".env" would
  // false-positive against the `cat <<EOF` on line one (happened in practice).
  for (const line of command.split('\n')) {
    const mentionsEnvFile = /\.env(\.[a-z0-9_-]+)?\b/i.test(line) && !/\.env\.example\b/i.test(line);
    if (!mentionsEnvFile) continue;
    const looksLikeRead = /\b(cat|type|Get-Content|less|more|head|tail)\b/i.test(line);
    const looksLikeForceAdd = /\bgit\s+add\b/i.test(line) && /(\s-[a-z]*f\b|--force\b)/i.test(line);
    if (looksLikeRead || looksLikeForceAdd) {
      deny('Polecenie odwołuje się do pliku .env i próbuje go odczytać lub wymusić dodanie do git (-f/--force) — zablokowane hookiem bezpieczeństwa.');
      process.exit(0);
    }
  }
}

process.exit(0);
