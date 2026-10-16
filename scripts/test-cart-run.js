#!/usr/bin/env node
// Tests for plugins/vibe-cartographer/scripts/cart-run.js. Run: node --test scripts/test-cart-run.js
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPT = path.join(__dirname, '..', 'plugins', 'vibe-cartographer', 'scripts', 'cart-run.js');
const WT_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'cwt-'));

function sh(cwd, cmd, ...a) { return execFileSync(cmd, a, { cwd, encoding: 'utf8' }).trim(); }

function cart(...a) {
  const out = execFileSync(process.execPath, [SCRIPT, ...a], {
    encoding: 'utf8', env: { ...process.env, CART_WORKTREE_ROOT: WT_ROOT }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(out);
}

function cartFails(...a) {
  try { cart(...a); } catch (e) { return { code: e.status, stderr: String(e.stderr) }; }
  throw new Error('expected cart-run to fail');
}

function repo({ commit = true } = {}) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-repo-'));
  sh(d, 'git', 'init', '-q', '-b', 'main');
  sh(d, 'git', 'config', 'user.email', 't@example.com');
  sh(d, 'git', 'config', 'user.name', 't');
  if (commit) {
    fs.writeFileSync(path.join(d, 'a.txt'), 'a\n');
    sh(d, 'git', 'add', '-A');
    sh(d, 'git', 'commit', '-q', '-m', 'init');
  }
  return d;
}

function commitIn(wt, file, body) {
  fs.writeFileSync(path.join(wt, file), body);
  sh(wt, 'git', 'add', file);
  sh(wt, 'git', 'commit', '-q', '-m', `edit ${file}`);
}

test('init writes the five run files, branches, and leaves the builder tree alone', () => {
  const r = repo();
  fs.writeFileSync(path.join(r, 'a.txt'), 'dirty\n');
  const res = cart('init', '--repo', r, '--slug', 'Nightly Work', '--date', '2026-10-16');
  assert.strictEqual(res.run, 'nightly-work');
  for (const f of ['brief.md', 'list.md', 'state.json', 'decisions.md', 'report.md']) {
    assert.ok(fs.existsSync(path.join(res.runDir, f)), f);
  }
  assert.ok(res.runDir.endsWith(path.join('docs', 'cart-runs', '2026-10-16-nightly-work')));
  assert.strictEqual(sh(r, 'git', 'rev-parse', '--abbrev-ref', 'HEAD'), 'main');
  assert.strictEqual(fs.readFileSync(path.join(r, 'a.txt'), 'utf8'), 'dirty\n');
  assert.deepStrictEqual(res.uncommitted_at_start, ['a.txt']);
  assert.strictEqual(sh(r, 'git', 'rev-parse', '--verify', 'cart/nightly-work'), sh(r, 'git', 'rev-parse', 'HEAD'));
});

test('a colliding run gets -2', () => {
  const r = repo();
  cart('init', '--repo', r, '--slug', 'dup', '--date', '2026-10-16');
  const second = cart('init', '--repo', r, '--slug', 'dup', '--date', '2026-10-16');
  assert.strictEqual(second.run, 'dup-2');
  assert.strictEqual(second.integration_branch, 'cart/dup-2');
});

test('no commits means no unattended run', () => {
  const f = cartFails('init', '--repo', repo({ commit: false }), '--slug', 'x');
  assert.strictEqual(f.code, 1);
  assert.match(f.stderr, /at least one commit/);
});

test('go item: start, merge into integration, worktree removed', () => {
  const r = repo();
  const { runDir } = cart('init', '--repo', r, '--slug', 'go');
  cart('add-item', '--run', runDir, '--slug', 'Add Sub', '--stop-class', 'go');
  const s = cart('start', '--run', runDir, '--item', '1');
  assert.strictEqual(s.item.branch, 'cart/go--01-add-sub');
  assert.strictEqual(s.item.status, 'building');
  commitIn(s.worktree, 'sub.txt', 'sub\n');
  const f = cart('finish', '--run', runDir, '--item', '1', '--result', 'merged');
  assert.strictEqual(f.item.status, 'merged');
  assert.ok(!fs.existsSync(s.worktree));
  assert.match(sh(r, 'git', 'log', '--oneline', '-1', 'cart/go'), /merge: item 01 add-sub/);
  assert.strictEqual(sh(r, 'git', 'rev-parse', '--abbrev-ref', 'HEAD'), 'main');
});

test('hold item is built but cannot merge; its dependent stacks on it and is held too', () => {
  const r = repo();
  const { runDir } = cart('init', '--repo', r, '--slug', 'hold');
  cart('add-item', '--run', runDir, '--slug', 'admin-only-delete', '--stop-class', 'hold');
  cart('add-item', '--run', runDir, '--slug', 'audit-log', '--stop-class', 'go', '--on', '1');
  const h = cart('start', '--run', runDir, '--item', '1');
  commitIn(h.worktree, 'auth.txt', 'admin only\n');
  const refused = cartFails('finish', '--run', runDir, '--item', '1', '--result', 'merged');
  assert.match(refused.stderr, /hold-class/);
  cart('finish', '--run', runDir, '--item', '1', '--result', 'held');
  const d = cart('start', '--run', runDir, '--item', '2');
  assert.ok(fs.existsSync(path.join(d.worktree, 'auth.txt')), 'dependent builds on the hold branch');
  assert.match(cartFails('finish', '--run', runDir, '--item', '2', '--result', 'merged').stderr, /held item 1/);
  assert.strictEqual(sh(r, 'git', 'rev-parse', 'cart/hold'), sh(r, 'git', 'rev-parse', 'main'), 'integration untouched');
});

test('stop item cannot start', () => {
  const r = repo();
  const { runDir } = cart('init', '--repo', r, '--slug', 'stop');
  cart('add-item', '--run', runDir, '--slug', 'rotate-keys', '--stop-class', 'stop');
  assert.match(cartFails('start', '--run', runDir, '--item', '1').stderr, /stop-class/);
});

test('two failed checks park the item; an environmental error does not count', () => {
  const r = repo();
  const { runDir } = cart('init', '--repo', r, '--slug', 'park');
  cart('add-item', '--run', runDir, '--slug', 'flaky', '--stop-class', 'go');
  cart('start', '--run', runDir, '--item', '1');
  assert.strictEqual(cart('check', '--run', runDir, '--item', '1', '--command', 'npm test', '--result', 'error').parked, false);
  assert.strictEqual(cart('check', '--run', runDir, '--item', '1', '--command', 'npm test', '--result', 'fail').parked, false);
  const second = cart('check', '--run', runDir, '--item', '1', '--command', 'npm test', '--result', 'fail');
  assert.strictEqual(second.parked, true);
  assert.strictEqual(second.item.status, 'parked');
});

test('resume returns the first non-terminal item and re-enters a building item', () => {
  const r = repo();
  const { runDir } = cart('init', '--repo', r, '--slug', 'resume');
  for (const s of ['one', 'two', 'three']) cart('add-item', '--run', runDir, '--slug', s, '--stop-class', 'go');
  const one = cart('start', '--run', runDir, '--item', '1');
  commitIn(one.worktree, 'one.txt', '1\n');
  cart('finish', '--run', runDir, '--item', '1', '--result', 'merged');
  const two = cart('start', '--run', runDir, '--item', '2');
  // Simulate a killed session: item 2 is left "building".
  assert.strictEqual(cart('resume', '--run', runDir).next.n, 2);
  const again = cart('start', '--run', runDir, '--item', '2');
  assert.strictEqual(again.resumed, true);
  assert.strictEqual(again.worktree, two.worktree);
  const status = cart('status', '--run', runDir);
  assert.deepStrictEqual([status.tally.merged, status.tally.building, status.tally.pending], [1, 1, 1]);
});

test.after(() => fs.rmSync(WT_ROOT, { recursive: true, force: true }));
