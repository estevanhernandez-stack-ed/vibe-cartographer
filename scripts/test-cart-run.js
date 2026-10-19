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

test('same-named runs in two repos get separate worktrees', () => {
  const a = cart('init', '--repo', repo(), '--slug', 'todo');
  const b = cart('init', '--repo', repo(), '--slug', 'todo');
  assert.notStrictEqual(a.integration_worktree, b.integration_worktree);
  assert.ok(fs.existsSync(a.integration_worktree) && fs.existsSync(b.integration_worktree));
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

function stateOf(runDir) { return JSON.parse(fs.readFileSync(path.join(runDir, 'state.json'), 'utf8')); }

function branches(r) { return sh(r, 'git', 'branch', '--format=%(refname:short)').split('\n').filter(Boolean); }

test('start refuses an occupied path that is not its worktree, and leaves it alone', () => {
  const r = repo();
  const { runDir } = cart('init', '--repo', r, '--slug', 'occupied');
  cart('add-item', '--run', runDir, '--slug', 'one', '--stop-class', 'go');
  // A worker wrote into the reserved path before start ran.
  const dir = path.join(stateOf(runDir).worktree_root, '01');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'stray.txt'), 'mine\n');
  const f = cartFails('start', '--run', runDir, '--item', '1');
  assert.strictEqual(f.code, 1);
  assert.match(f.stderr, /not a worktree of cart\/occupied--01-one/);
  assert.strictEqual(stateOf(runDir).items[0].status, 'pending');
  assert.strictEqual(fs.readFileSync(path.join(dir, 'stray.txt'), 'utf8'), 'mine\n');
});

test('start re-creates a building item whose worktree folder was deleted', () => {
  const r = repo();
  const { runDir } = cart('init', '--repo', r, '--slug', 'vanished');
  cart('add-item', '--run', runDir, '--slug', 'one', '--stop-class', 'go');
  const s = cart('start', '--run', runDir, '--item', '1');
  commitIn(s.worktree, 'one.txt', '1\n');
  fs.rmSync(s.worktree, { recursive: true, force: true });
  const again = cart('start', '--run', runDir, '--item', '1');
  assert.strictEqual(again.item.status, 'building');
  assert.strictEqual(sh(again.worktree, 'git', 'rev-parse', '--abbrev-ref', 'HEAD'), 'cart/vanished--01-one');
  assert.ok(fs.existsSync(path.join(again.worktree, 'one.txt')), 'the commit survives');
});

test('cleanup of run A leaves a concurrent run B intact, and refuses B while it builds', () => {
  const ra = repo();
  const rb = repo();
  const a = cart('init', '--repo', ra, '--slug', 'night');
  const b = cart('init', '--repo', rb, '--slug', 'night');
  cart('add-item', '--run', a.runDir, '--slug', 'done', '--stop-class', 'go');
  cart('add-item', '--run', b.runDir, '--slug', 'busy', '--stop-class', 'go');
  const ai = cart('start', '--run', a.runDir, '--item', '1');
  commitIn(ai.worktree, 'a.txt', 'a2\n');
  cart('finish', '--run', a.runDir, '--item', '1', '--result', 'merged');
  const bi = cart('start', '--run', b.runDir, '--item', '1');
  commitIn(bi.worktree, 'b.txt', 'b\n');
  // A was reviewed and merged by the builder.
  sh(ra, 'git', 'merge', '-q', '--no-ff', '-m', 'take run', 'cart/night');

  const c = cart('cleanup', '--run', a.runDir);
  assert.deepStrictEqual(branches(ra), ['main']);
  assert.deepStrictEqual(c.kept, []);
  assert.ok(!fs.existsSync(stateOf(a.runDir).worktree_root), 'A worktree root removed');
  assert.ok(stateOf(a.runDir).cleanup, 'cleanup recorded in state.json');

  assert.ok(fs.existsSync(path.join(bi.worktree, 'b.txt')), 'B item worktree untouched');
  assert.ok(fs.existsSync(b.integration_worktree), 'B integration worktree untouched');
  assert.deepStrictEqual(branches(rb).sort(), ['cart/night', 'cart/night--01-busy', 'main']);

  const refused = cartFails('cleanup', '--run', b.runDir);
  assert.strictEqual(refused.code, 1);
  assert.match(refused.stderr, /not finished: item 1 \(building\)/);
  assert.ok(fs.existsSync(bi.worktree));
});

test('cleanup keeps held branches unless --include-held, and keeps a dirty worktree', () => {
  const r = repo();
  const { runDir } = cart('init', '--repo', r, '--slug', 'held');
  cart('add-item', '--run', runDir, '--slug', 'auth', '--stop-class', 'hold');
  const h = cart('start', '--run', runDir, '--item', '1');
  commitIn(h.worktree, 'auth.txt', 'gate\n');
  cart('finish', '--run', runDir, '--item', '1', '--result', 'held');
  fs.writeFileSync(path.join(h.worktree, 'notes.txt'), 'uncommitted\n');

  const first = cart('cleanup', '--run', runDir);
  assert.ok(fs.existsSync(path.join(h.worktree, 'notes.txt')), 'uncommitted work is never forced away');
  assert.ok(first.kept.some((k) => k.worktree && k.branch === 'cart/held--01-auth'));
  assert.ok(branches(r).includes('cart/held--01-auth'));
  assert.ok(!branches(r).includes('cart/held'), 'integration at base is reachable from main, so it goes');

  fs.rmSync(path.join(h.worktree, 'notes.txt'));
  const second = cart('cleanup', '--run', runDir, '--include-held');
  assert.ok(second.deleted_branches.includes('cart/held--01-auth'));
  assert.deepStrictEqual(branches(r), ['main']);
});

test('cleanup keeps an unpushed integration branch and says why', () => {
  const r = repo();
  const { runDir } = cart('init', '--repo', r, '--slug', 'unpushed');
  cart('add-item', '--run', runDir, '--slug', 'feat', '--stop-class', 'go');
  const s = cart('start', '--run', runDir, '--item', '1');
  commitIn(s.worktree, 'feat.txt', 'f\n');
  cart('finish', '--run', runDir, '--item', '1', '--result', 'merged');
  const c = cart('cleanup', '--run', runDir);
  assert.deepStrictEqual(branches(r).sort(), ['cart/unpushed', 'main']);
  assert.ok(c.deleted_branches.includes('cart/unpushed--01-feat'), 'merged item branch lives on in integration');
  assert.match(c.kept.find((k) => k.branch === 'cart/unpushed' && !k.worktree).reason, /not merged or pushed/);
  assert.ok(!fs.existsSync(stateOf(runDir).integration_worktree), 'its worktree goes; the branch stays');
});

// A clone whose origin has moved on by one commit since the clone was made.
function staleClone() {
  const origin = repo();
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-clone-'));
  sh(d, 'git', 'clone', '-q', origin, '.');
  sh(d, 'git', 'config', 'user.email', 't@example.com');
  sh(d, 'git', 'config', 'user.name', 't');
  commitIn(origin, 'later.txt', 'pushed after the clone\n');
  return { origin, clone: d };
}

test('init refuses a checkout behind the remote default, and creates nothing', () => {
  const { clone } = staleClone();
  const f = cartFails('init', '--repo', clone, '--slug', 'stale');
  assert.strictEqual(f.code, 1);
  assert.match(f.stderr, /1 commit behind origin\/main/);
  assert.match(f.stderr, /--base origin\/main/);
  assert.ok(!fs.existsSync(path.join(clone, 'docs', 'cart-runs')), 'no run folder');
  assert.deepStrictEqual(branches(clone), ['main']);
});

test('init --base origin/main cuts from the remote tip; the builder tree stays put', () => {
  const { origin, clone } = staleClone();
  const res = cart('init', '--repo', clone, '--slug', 'fresh', '--base', 'origin/main');
  assert.strictEqual(sh(clone, 'git', 'rev-parse', 'cart/fresh'), sh(origin, 'git', 'rev-parse', 'HEAD'));
  assert.ok(fs.existsSync(path.join(res.integration_worktree, 'later.txt')));
  assert.ok(!fs.existsSync(path.join(clone, 'later.txt')), 'builder tree not checked out');
  const s = stateOf(res.runDir);
  assert.strictEqual(s.base_ref, 'origin/main');
  assert.strictEqual(s.behind_at_start, 1);
});

test('init --base HEAD builds on the stale checkout on purpose', () => {
  const { clone } = staleClone();
  const res = cart('init', '--repo', clone, '--slug', 'onpurpose', '--base', 'HEAD');
  assert.strictEqual(sh(clone, 'git', 'rev-parse', 'cart/onpurpose'), sh(clone, 'git', 'rev-parse', 'HEAD'));
  assert.strictEqual(stateOf(res.runDir).base_ref, 'HEAD');
});

test('init with no remote does not refuse, and an unknown --base does', () => {
  const r = repo();
  const res = cart('init', '--repo', r, '--slug', 'local');
  assert.strictEqual(stateOf(res.runDir).base_ref, 'HEAD');
  assert.match(cartFails('init', '--repo', repo(), '--slug', 'x', '--base', 'nope/main').stderr, /unknown base "nope\/main"/);
});

test('a stale branch with nothing unique is pointed at origin/main', () => {
  const { clone } = staleClone();
  assert.match(cartFails('init', '--repo', clone, '--slug', 'x').stderr, /nothing origin\/main lacks.*--base origin\/main/);
});

test('a stale branch with its own commits is pointed at --merge, not at origin/main', () => {
  const { clone } = staleClone();
  commitIn(clone, 'feature.txt', 'only on the branch\n');
  const f = cartFails('init', '--repo', clone, '--slug', 'x');
  assert.match(f.stderr, /1 commit origin\/main does not have/);
  assert.match(f.stderr, /--merge origin\/main/);
});

test('init --merge origin/main brings the branch up to date in the run, not in the builder tree', () => {
  const { clone } = staleClone();
  commitIn(clone, 'feature.txt', 'only on the branch\n');
  const head = sh(clone, 'git', 'rev-parse', 'HEAD');
  const res = cart('init', '--repo', clone, '--slug', 'merged', '--merge', 'origin/main');
  for (const f of ['feature.txt', 'later.txt']) assert.ok(fs.existsSync(path.join(res.integration_worktree, f)), f);
  assert.strictEqual(sh(clone, 'git', 'rev-parse', 'HEAD'), head, 'builder branch not moved');
  assert.ok(!fs.existsSync(path.join(clone, 'later.txt')), 'builder tree untouched');
  const s = stateOf(res.runDir);
  assert.strictEqual(s.base_ref, 'HEAD');
  assert.strictEqual(s.merged_at_start, 'origin/main');
});

test('init --merge refuses a conflicting merge and creates nothing', () => {
  const { origin, clone } = staleClone();
  commitIn(origin, 'a.txt', 'theirs\n');
  commitIn(clone, 'a.txt', 'ours\n');
  const f = cartFails('init', '--repo', clone, '--slug', 'clash', '--merge', 'origin/main');
  assert.strictEqual(f.code, 1);
  assert.match(f.stderr, /conflicts.*a\.txt/s);
  assert.ok(!fs.existsSync(path.join(clone, 'docs', 'cart-runs')), 'no run folder');
  assert.deepStrictEqual(branches(clone), ['main']);
});

test.after(() => fs.rmSync(WT_ROOT, { recursive: true, force: true }));
