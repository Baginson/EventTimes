#!/usr/bin/env node
'use strict';
// Stop hook. Non-blocking: only runs the full test/lint/build suite when
// something relevant (src/config) actually changed since the last commit,
// so a casual conversational turn doesn't pay a multi-second tax. Reports
// via systemMessage/additionalContext; never forces continuation.
const { execSync } = require('child_process');

function run(cmd) {
  try {
    const out = execSync(cmd, { stdio: 'pipe' }).toString();
    return { ok: true, out };
  } catch (err) {
    const out = ((err.stdout && err.stdout.toString()) || '') + ((err.stderr && err.stderr.toString()) || '');
    return { ok: false, out };
  }
}

let status = '';
try {
  status = execSync('git status --porcelain', { stdio: 'pipe' }).toString();
} catch {
  process.exit(0); // not a git repo / git unavailable - skip silently
}

const RELEVANT = /\.(tsx?|css|json|ya?ml)\b|package\.json|vite\.config|tsconfig/i;
if (!status.trim() || !RELEVANT.test(status)) {
  process.exit(0); // nothing relevant changed - skip verification
}

const testRes = run('npm run test --silent');
const lintRes = run('npm run lint --silent');
const buildRes = run('npm run build --silent');

const summary = [
  `test: ${testRes.ok ? 'OK' : 'FAIL'}`,
  `lint: ${lintRes.ok ? 'OK' : 'FAIL'}`,
  `build: ${buildRes.ok ? 'OK' : 'FAIL'}`,
].join(', ');

const anyFail = !testRes.ok || !lintRes.ok || !buildRes.ok;

const payload = {
  systemMessage: `Weryfikacja końcowa (zmiany w src/config wykryte): ${summary}`,
};

if (anyFail) {
  const details = [testRes, lintRes, buildRes]
    .filter((r) => !r.ok)
    .map((r) => r.out.slice(0, 1200))
    .join('\n---\n');
  payload.hookSpecificOutput = {
    hookEventName: 'Stop',
    additionalContext: `Weryfikacja końcowa (npm run test/lint/build) wykryła problem:\n${details}`,
  };
}

process.stdout.write(JSON.stringify(payload));
process.exit(0);
