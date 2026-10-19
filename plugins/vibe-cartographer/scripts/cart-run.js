#!/usr/bin/env node
/**
 * cart-run.js
 *
 * Owns the mechanics of an unattended Cart run so the agent never improvises
 * them: the run folder, state.json, branch layout, worktrees, local merges and
 * resume. The agent keeps the judgment (what to build, which stop class).
 * Rules: skills/guide/references/unattended-run.md.
 *
 * Usage (every command prints one JSON object on stdout):
 *   node cart-run.js init     --repo <dir> --slug <slug> [--date YYYY-MM-DD] [--base <ref>] [--merge <ref>]
 *   node cart-run.js add-item --run <runDir> --slug <item-slug> --stop-class go|hold|stop [--title <t>] [--on <N>]
 *   node cart-run.js start    --run <runDir> --item <N>
 *   node cart-run.js check    --run <runDir> --item <N> --command <cmd> --result pass|fail|error
 *   node cart-run.js finish   --run <runDir> --item <N> --result merged|held|parked|stopped [--reason <r>]
 *   node cart-run.js resume   --run <runDir>
 *   node cart-run.js status   --run <runDir>
 *   node cart-run.js cleanup  --run <runDir> [--include-held]
 *
 * Invariants:
 *   - Never checks out anything in the builder's working tree. All work
 *     happens in worktrees under a short root (~/.cwt/<run-slug>/).
 *   - Branches: integration cart/<slug>; items cart/<slug>--<NN>-<item-slug>.
 *   - Run folder: docs/cart-runs/<date>-<slug>/ with brief.md, list.md,
 *     state.json, decisions.md, report.md. A colliding folder gets -2, -3.
 *   - A `check` that fails twice (result "fail"; "error" is environmental and
 *     does not count) parks the item automatically.
 *   - `finish merged` refuses a `hold` or `stop` item; `start` refuses `stop`.
 *   - `init` fetches and refuses a checkout behind the remote default branch
 *     unless --base or --merge names the base. --merge cuts from the branch
 *     and merges the ref in the integration worktree, after proving it clean.
 *   - `start` refuses a path that exists but is not the item's worktree.
 *   - The worktree root's parent is shared by every concurrent run. `cleanup`
 *     touches only this run's worktrees and branches, never forces a removal,
 *     and never deletes recursively.
 *
 * Exit codes: 0 ok, 1 usage or state error, 2 git or environment error
 * (the item is parked with the error before exiting 2 when one is known).
 *
 * Zero dependencies. Node 18+.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const TERMINAL = ['merged', 'held', 'parked', 'stopped'];
const CLASSES = ['go', 'hold', 'stop'];
const TEMPLATES = {
  'brief.md': 'run-brief-template.md',
  'list.md': 'run-list-template.md',
  'decisions.md': 'run-decisions-template.md',
  'report.md': 'run-report-template.md',
};
const TEMPLATE_DIR = path.join(__dirname, '..', 'skills', 'guide', 'templates');

class CartError extends Error {
  constructor(message, code = 1) { super(message); this.code = code; }
}

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) out._.push(a);
    else if (argv[i + 1] === undefined || argv[i + 1].startsWith('--')) out[a.slice(2)] = true;
    else { out[a.slice(2)] = argv[i + 1]; i++; }
  }
  return out;
}

function need(a, key) {
  if (a[key] === undefined || a[key] === '') throw new CartError(`missing --${key}`);
  return a[key];
}

function git(cwd, ...gitArgs) {
  try {
    return execFileSync('git', gitArgs, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    throw new CartError(`git ${gitArgs.join(' ')} failed: ${(e.stderr || e.message).trim()}`, 2);
  }
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'run';
}

function pad(n) { return String(n).padStart(2, '0'); }

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function writeJsonAtomic(file, obj) {
  const tmp = `${file}.tmp`;
  const fd = fs.openSync(tmp, 'w');
  fs.writeSync(fd, JSON.stringify(obj, null, 2) + '\n');
  fs.fsyncSync(fd);
  fs.closeSync(fd);
  fs.renameSync(tmp, file);
}

function loadState(runDir) {
  const file = path.join(runDir, 'state.json');
  if (!fs.existsSync(file)) throw new CartError(`no state.json in ${runDir}`);
  return { file, state: JSON.parse(fs.readFileSync(file, 'utf8')) };
}

function saveState(file, state) { writeJsonAtomic(file, state); }

function itemOf(state, n) {
  const item = state.items.find((i) => i.n === Number(n));
  if (!item) throw new CartError(`no item ${n}`);
  return item;
}

function worktreeRoot(slug) {
  return path.join(process.env.CART_WORKTREE_ROOT || path.join(os.homedir(), '.cwt'), slug);
}

// Compare paths the way the OS does: git prints forward slashes, Windows ignores case.
function samePath(a, b) { return normPath(a) === normPath(b); }

function normPath(p) {
  let r;
  try { r = fs.realpathSync.native(p); } catch { r = path.resolve(p); }
  return process.platform === 'win32' ? r.toLowerCase() : r;
}

function isUnder(p, root) { return normPath(p).startsWith(normPath(root) + path.sep); }

function worktrees(repo) {
  const out = [];
  let cur = null;
  for (const line of git(repo, 'worktree', 'list', '--porcelain').split('\n')) {
    if (line.startsWith('worktree ')) { cur = { path: line.slice(9), branch: '' }; out.push(cur); }
    else if (cur && line.startsWith('branch refs/heads/')) cur.branch = line.slice(18);
  }
  return out;
}

function ownsBranch(state, b) { return b === state.integration_branch || b.startsWith(`${state.integration_branch}--`); }

function addWorktree(repo, dir, branch, from) {
  // One retry with a shorter path; never fall back to the builder's tree.
  const attempts = [dir, path.join(path.dirname(dir), path.basename(dir).slice(0, 4))];
  let lastErr;
  for (const d of attempts) {
    try {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      if (from) git(repo, 'worktree', 'add', '-b', branch, d, from);
      else git(repo, 'worktree', 'add', d, branch);
      return d;
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

function cmdInit(a) {
  const repo = path.resolve(need(a, 'repo'));
  const slug = slugify(need(a, 'slug'));
  try { git(repo, 'rev-parse', 'HEAD'); } catch (e) {
    throw new CartError('unattended runs need a git repo with at least one commit');
  }
  // Porcelain lines start with a status column that may be a space, so read them untrimmed.
  const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: repo, encoding: 'utf8' })
    .split('\n').filter(Boolean).map((l) => l.slice(3));
  const { base, baseRef, merge, behind, warnings } = resolveBase(repo, a.base, a.merge);
  const date = a.date || today();
  const runsDir = path.join(repo, 'docs', 'cart-runs');
  let runSlug = slug;
  let runDir = path.join(runsDir, `${date}-${runSlug}`);
  for (let k = 2; fs.existsSync(runDir) || branchExists(repo, `cart/${runSlug}`); k++) {
    runSlug = `${slug}-${k}`;
    runDir = path.join(runsDir, `${date}-${runSlug}`);
  }
  fs.mkdirSync(runDir, { recursive: true });
  for (const [name, tpl] of Object.entries(TEMPLATES)) {
    const src = path.join(TEMPLATE_DIR, tpl);
    fs.writeFileSync(path.join(runDir, name), fs.existsSync(src) ? fs.readFileSync(src, 'utf8') : '');
  }
  const integration = `cart/${runSlug}`;
  git(repo, 'branch', integration, base);
  // Keyed by repo and run, so same-named runs in two repos never share a worktree root.
  const root = worktreeRoot(`${slugify(path.basename(repo)).slice(0, 16)}-${runSlug}`);
  const intWt = addWorktree(repo, path.join(root, 'int'), integration, null);
  if (merge) git(intWt, 'merge', '--no-ff', '-m', `merge: ${merge} into the run base`, merge);
  const state = {
    run: runSlug,
    repo,
    base_commit: base,
    base_ref: baseRef,
    merged_at_start: merge,
    behind_at_start: behind,
    integration_branch: integration,
    integration_worktree: intWt,
    worktree_root: root,
    builder_branch: git(repo, 'rev-parse', '--abbrev-ref', 'HEAD'),
    uncommitted_at_start: dirty,
    started_at: new Date().toISOString(),
    items: [],
  };
  saveState(path.join(runDir, 'state.json'), state);
  return {
    runDir, run: runSlug, integration_branch: integration, integration_worktree: intWt,
    base_ref: baseRef, behind_at_start: behind, uncommitted_at_start: dirty, warnings,
  };
}

// The run's base. A checkout behind the remote default would build and verify
// against stale code (2026-10-17: a run cut from a branch 424 commits behind
// main), so that case is refused unless --base names the base on purpose.
function resolveBase(repo, wanted, merge) {
  if (wanted === true) throw new CartError('--base needs a ref (origin/main, or HEAD)');
  if (merge === true) throw new CartError('--merge needs a ref (usually origin/main)');
  const warnings = [];
  const hasOrigin = git(repo, 'remote').split('\n').includes('origin');
  if (hasOrigin) {
    try {
      execFileSync('git', ['fetch', '--quiet', 'origin'], { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
    } catch (e) {
      warnings.push(`git fetch origin failed, so the staleness check uses the last fetch: ${String(e.stderr || e.message).trim()}`);
    }
  }
  let remoteDefault = null;
  if (hasOrigin) {
    try { remoteDefault = git(repo, 'symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD'); } catch {
      remoteDefault = ['origin/main', 'origin/master'].find((r) => branchRefExists(repo, `refs/remotes/${r}`)) || null;
    }
  }
  const behind = remoteDefault ? Number(git(repo, 'rev-list', '--count', `HEAD..${remoteDefault}`)) : 0;
  const ahead = remoteDefault ? Number(git(repo, 'rev-list', '--count', `${remoteDefault}..HEAD`)) : 0;
  const commitOf = (ref, what) => {
    try { return git(repo, 'rev-parse', '--verify', '--quiet', `${ref}^{commit}`); } catch {
      throw new CartError(`unknown ${what} "${ref}"`);
    }
  };
  const baseRef = typeof wanted === 'string' ? wanted : 'HEAD';
  const base = commitOf(baseRef, 'base');
  if (typeof merge === 'string') {
    // Prove the merge is clean before anything is created; it runs in the integration worktree later.
    const mergeCommit = commitOf(merge, 'merge ref');
    const conflicts = mergeConflicts(repo, base, mergeCommit);
    if (conflicts.length) {
      throw new CartError(`merging ${merge} into ${baseRef} conflicts in: ${conflicts.join(', ')}. Resolve it on the branch yourself, then start the run.`);
    }
    return { base, baseRef, merge, behind, warnings };
  }
  if (typeof wanted === 'string') return { base, baseRef, merge: null, behind, warnings };
  if (behind > 0) {
    const where = git(repo, 'rev-parse', '--abbrev-ref', 'HEAD');
    const n = (k) => `${k} commit${k === 1 ? '' : 's'}`;
    const way = ahead === 0
      ? `It has nothing ${remoteDefault} lacks, so pass --base ${remoteDefault} to build on the remote tip and lose nothing.`
      : `It also has ${n(ahead)} ${remoteDefault} does not have, so --base ${remoteDefault} would leave that work out. ` +
        `Pass --merge ${remoteDefault} to cut the run from this branch with ${remoteDefault} merged in (your checkout stays as it is).`;
    throw new CartError(
      `the checkout (${where}) is ${n(behind)} behind ${remoteDefault}; a run cut from it builds and verifies against stale code. ${way} ` +
      'Or pass --base HEAD to build on this checkout as it stands, on purpose.',
    );
  }
  return { base, baseRef, merge: null, behind, warnings };
}

// Files a merge of `theirs` into `ours` would conflict in, without touching any worktree.
function mergeConflicts(repo, ours, theirs) {
  try {
    execFileSync('git', ['merge-tree', '--write-tree', '--name-only', ours, theirs], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return [];
  } catch (e) {
    if (e.status !== 1) throw new CartError(`git merge-tree failed: ${String(e.stderr || e.message).trim()}`, 2);
    const lines = String(e.stdout).split('\n');
    const end = lines.indexOf('', 1);
    return lines.slice(1, end === -1 ? undefined : end).filter(Boolean);
  }
}

function branchRefExists(repo, ref) {
  try { git(repo, 'rev-parse', '--verify', '--quiet', ref); return true; } catch { return false; }
}

function branchExists(repo, b) {
  try { git(repo, 'rev-parse', '--verify', '--quiet', `refs/heads/${b}`); return true; } catch { return false; }
}

function cmdAddItem(a) {
  const { file, state } = loadState(need(a, 'run'));
  const cls = need(a, 'stop-class');
  if (!CLASSES.includes(cls)) throw new CartError(`stop class must be one of ${CLASSES.join(', ')}`);
  const n = state.items.length + 1;
  const slug = slugify(need(a, 'slug'));
  const item = {
    n, slug, title: a.title || slug, stop_class: cls, status: 'pending',
    branch: `${state.integration_branch}--${pad(n)}-${slug}`, worktree: '', on: a.on ? Number(a.on) : null,
    checks: [], reason: '',
  };
  if (item.on) itemOf(state, item.on);
  state.items.push(item);
  saveState(file, state);
  return { item };
}

function cmdStart(a) {
  const { file, state } = loadState(need(a, 'run'));
  const item = itemOf(state, need(a, 'item'));
  if (item.stop_class === 'stop') throw new CartError(`item ${item.n} is stop-class; write it up, don't build it`);
  if (TERMINAL.includes(item.status)) throw new CartError(`item ${item.n} is already ${item.status}`);
  const dir = item.worktree || path.join(state.worktree_root, pad(item.n));
  // Forget worktrees whose folders are gone, so a deleted one can be re-created on its branch.
  git(state.repo, 'worktree', 'prune');
  const registered = worktrees(state.repo).find((w) => samePath(w.path, dir));
  if (registered) {
    if (registered.branch !== item.branch) {
      throw new CartError(`${dir} is a worktree of ${registered.branch || 'a detached HEAD'}, not a worktree of ${item.branch}`);
    }
    item.worktree = dir;
    item.status = 'building';
    saveState(file, state);
    return { item, resumed: true, worktree: dir };
  }
  if (fs.existsSync(dir)) {
    throw new CartError(`${dir} already exists and is not a worktree of ${item.branch}; move it aside, then start again`);
  }
  // Dependents of a hold item build on the hold branch; everything else on the integration tip.
  let from = state.integration_branch;
  if (item.on) {
    const dep = itemOf(state, item.on);
    if (dep.status === 'held' || dep.stop_class === 'hold') from = dep.branch;
  }
  try {
    item.worktree = branchExists(state.repo, item.branch)
      ? addWorktree(state.repo, dir, item.branch, null)
      : addWorktree(state.repo, dir, item.branch, from);
  } catch (e) {
    item.status = 'parked';
    item.reason = `worktree could not be created: ${e.message}`;
    saveState(file, state);
    throw e;
  }
  item.status = 'building';
  saveState(file, state);
  return { item, resumed: false, worktree: item.worktree };
}

function cmdCheck(a) {
  const { file, state } = loadState(need(a, 'run'));
  const item = itemOf(state, need(a, 'item'));
  const result = need(a, 'result');
  if (!['pass', 'fail', 'error'].includes(result)) throw new CartError('result must be pass, fail or error');
  item.checks.push({ attempt: item.checks.length + 1, command: need(a, 'command'), result });
  const failures = item.checks.filter((c) => c.result === 'fail').length;
  let parked = false;
  if (failures >= 2 && item.status === 'building') {
    item.status = 'parked';
    item.reason = `check failed twice: ${a.command}`;
    parked = true;
  }
  saveState(file, state);
  return { item, failures, parked };
}

function cmdFinish(a) {
  const { file, state } = loadState(need(a, 'run'));
  const item = itemOf(state, need(a, 'item'));
  const result = need(a, 'result');
  if (!TERMINAL.includes(result)) throw new CartError(`result must be one of ${TERMINAL.join(', ')}`);
  if (result === 'merged') {
    if (item.stop_class !== 'go') throw new CartError(`item ${item.n} is ${item.stop_class}-class; it cannot merge unattended`);
    if (item.on) {
      const dep = itemOf(state, item.on);
      if (dep.status === 'held') throw new CartError(`item ${item.n} builds on held item ${dep.n}; finish it as held`);
    }
    git(state.integration_worktree, 'merge', '--no-ff', '-m', `merge: item ${pad(item.n)} ${item.slug}`, item.branch);
    if (item.worktree && fs.existsSync(item.worktree)) git(state.repo, 'worktree', 'remove', '--force', item.worktree);
    item.worktree = '';
  }
  item.status = result;
  if (a.reason) item.reason = a.reason;
  saveState(file, state);
  return { item };
}

function cmdResume(a) {
  const { state } = loadState(need(a, 'run'));
  const next = state.items.find((i) => !TERMINAL.includes(i.status));
  return next ? { done: false, next } : { done: true };
}

function cmdStatus(a) {
  const { state } = loadState(need(a, 'run'));
  const tally = Object.fromEntries(['pending', 'building', ...TERMINAL].map((s) => [s, 0]));
  for (const i of state.items) tally[i.status]++;
  return {
    run: state.run, integration_branch: state.integration_branch, base_commit: state.base_commit,
    builder_branch: state.builder_branch, uncommitted_at_start: state.uncommitted_at_start, tally,
    items: state.items.map(({ n, slug, stop_class, status, branch, reason }) => ({ n, slug, stop_class, status, branch, reason })),
  };
}

function cmdCleanup(a) {
  const { file, state } = loadState(need(a, 'run'));
  const open = state.items.filter((i) => !TERMINAL.includes(i.status));
  if (open.length) {
    throw new CartError(`run is not finished: ${open.map((i) => `item ${i.n} (${i.status})`).join(', ')}; cleanup runs only on a finished run`);
  }
  const includeHeld = a['include-held'] === true;
  const removed = [];
  const deleted = [];
  const kept = [];

  // Worktrees: only this run's branches, only under this run's root, never forced.
  // A dirty or busy worktree is kept; uncommitted work is what a forced removal destroys.
  git(state.repo, 'worktree', 'prune');
  for (const w of worktrees(state.repo)) {
    if (!w.branch || !ownsBranch(state, w.branch)) continue;
    if (!isUnder(w.path, state.worktree_root)) {
      kept.push({ worktree: w.path, branch: w.branch, reason: 'outside the run worktree root; not the run\'s to remove' });
      continue;
    }
    try { git(state.repo, 'worktree', 'remove', w.path); removed.push(w.path); }
    catch (e) { kept.push({ worktree: w.path, branch: w.branch, reason: e.message }); }
  }

  const byBranch = new Map(state.items.map((i) => [i.branch, i]));
  const ours = git(state.repo, 'for-each-ref', '--format=%(refname:short)', 'refs/heads/cart/')
    .split('\n').filter((b) => b && ownsBranch(state, b));
  const del = (b) => {
    try { git(state.repo, 'branch', '-D', b); deleted.push(b); }
    catch (e) { kept.push({ branch: b, reason: e.message }); }
  };
  const isAncestor = (b, of) => {
    try { git(state.repo, 'merge-base', '--is-ancestor', b, of); return true; } catch { return false; }
  };

  for (const b of ours.filter((x) => x !== state.integration_branch)) {
    const item = byBranch.get(b);
    if (!item) kept.push({ branch: b, reason: 'not an item of this run' });
    else if (item.status === 'merged') {
      if (isAncestor(b, state.integration_branch)) del(b);
      else kept.push({ branch: b, reason: 'has commits the integration branch does not' });
    } else if (includeHeld) del(b);
    else kept.push({ branch: b, reason: `${item.status}; pass --include-held to delete it` });
  }

  // The integration branch is the unpushed night's work: delete it only when
  // another branch or a remote already has its tip.
  if (ours.includes(state.integration_branch)) {
    const holders = git(state.repo, 'for-each-ref', '--format=%(refname:short)', '--contains', state.integration_branch, 'refs/heads', 'refs/remotes')
      .split('\n').filter((r) => r && !ownsBranch(state, r));
    if (holders.length) del(state.integration_branch);
    else kept.push({ branch: state.integration_branch, reason: 'not merged or pushed anywhere; push or merge it, then clean up again' });
  }

  // Only this run's root, and only if empty. Never a recursive delete: the parent is shared by every run.
  let rootRemoved = false;
  try { fs.rmdirSync(state.worktree_root); rootRemoved = true; } catch { rootRemoved = !fs.existsSync(state.worktree_root); }

  state.cleanup = { at: new Date().toISOString(), removed_worktrees: removed, deleted_branches: deleted, kept, root_removed: rootRemoved };
  saveState(file, state);
  return { run: state.run, ...state.cleanup };
}

const COMMANDS = {
  init: cmdInit, 'add-item': cmdAddItem, start: cmdStart, check: cmdCheck,
  finish: cmdFinish, resume: cmdResume, status: cmdStatus, cleanup: cmdCleanup,
};

function main(argv) {
  const a = args(argv);
  const fn = COMMANDS[a._[0]];
  if (!fn) throw new CartError(`unknown command "${a._[0] || ''}"; one of ${Object.keys(COMMANDS).join(', ')}`);
  return fn(a);
}

if (require.main === module) {
  try {
    process.stdout.write(JSON.stringify(main(process.argv.slice(2)), null, 2) + '\n');
  } catch (e) {
    process.stderr.write(`cart-run: ${e.message}\n`);
    process.exit(e.code || 1);
  }
}

module.exports = { main, slugify };
