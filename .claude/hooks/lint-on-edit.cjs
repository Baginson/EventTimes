#!/usr/bin/env node
'use strict';
// PostToolUse hook (Edit|Write). Non-blocking: lints the touched file if it's
// a src/**/*.{ts,tsx,css} file and feeds any oxlint findings back as context.
// Never fails the tool call itself.
const fs = require('fs');
const { execSync } = require('child_process');

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const filePath = String(input?.tool_input?.file_path ?? input?.tool_response?.filePath ?? '');
if (!filePath) process.exit(0);

const isLintable = /[\\/]src[\\/].*\.tsx?$/i.test(filePath);
if (!isLintable || !fs.existsSync(filePath)) process.exit(0);

let output = '';
try {
  // oxlint exits 0 even when it reports warnings (only errors are non-zero),
  // so check stdout content on the success path too, not just the catch.
  output = execSync(`npx oxlint "${filePath}"`, { stdio: 'pipe' }).toString();
} catch (err) {
  output = ((err.stdout && err.stdout.toString()) || '') + ((err.stderr && err.stderr.toString()) || '');
}

if (output.trim()) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `oxlint zgłosił problem w ${filePath}:\n${output.slice(0, 1500)}`,
    },
  }));
}
process.exit(0);
