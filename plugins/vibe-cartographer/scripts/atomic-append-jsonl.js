#!/usr/bin/env node
/**
 * atomic-append-jsonl.js
 *
 * Reads one JSON object from stdin and atomically appends it as a single
 * JSON line to <target-path>.
 *
 * Usage:
 *   node scripts/atomic-append-jsonl.js <target-path>
 *
 * Behavior:
 *   1. Read all of stdin.
 *   2. Parse as JSON. Exit 1 with "invalid JSON: <reason>" on parse failure.
 *   3. Serialize back to a single line (JSON.stringify — no embedded
 *      newlines by definition).
 *   4. Ensure parent directory exists (mkdirSync recursive).
 *   5. openSync with O_APPEND | O_WRONLY | O_CREAT — kernel-guaranteed
 *      atomicity for appends <= PIPE_BUF on POSIX. Windows accepts the
 *      flags but atomicity is weaker (acceptable for v1.5.0; lockfile
 *      fallback comes later if corruption is observed).
 *   6. writeSync the serialized line + '\n'.
 *   7. closeSync, exit 0.
 *
 * Exit codes:
 *   0 — success
 *   1 — failure (error written to stderr)
 *
 * Interface signature mirrors the future @626labs/plugin-core/session-logger
 * TS module so Phase 2 migration can drop in a typed function call without
 * changing SKILL contracts.
 *
 * Zero dependencies. Node 18+.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function fail(msg) {
  process.stderr.write(msg + '\n');
  process.exit(1);
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    fail('usage: atomic-append-jsonl.js <target-path>');
  }

  const raw = await readStdin();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    fail('invalid JSON: ' + err.message);
  }

  // Single-line JSON. JSON.stringify never emits raw newlines in keys/values
  // (they're escaped as \n) and the no-arg form produces no whitespace
  // newlines, so this is guaranteed to be one line.
  const line = JSON.stringify(parsed) + '\n';

  const dir = path.dirname(target);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    fail('could not create parent directory: ' + err.message);
  }

  // Explicit flags: O_APPEND | O_WRONLY | O_CREAT.
  const flags = fs.constants.O_APPEND | fs.constants.O_WRONLY | fs.constants.O_CREAT;

  let fd;
  try {
    fd = fs.openSync(target, flags, 0o644);
  } catch (err) {
    fail('could not acquire append: ' + err.message);
  }

  try {
    fs.writeSync(fd, line);
  } catch (err) {
    try { fs.closeSync(fd); } catch (_) { /* ignore */ }
    fail('could not write append: ' + err.message);
  }

  try {
    fs.closeSync(fd);
  } catch (err) {
    fail('could not close append: ' + err.message);
  }

  process.exit(0);
}

main().catch((err) => {
  fail('unexpected error: ' + (err && err.message ? err.message : String(err)));
});
