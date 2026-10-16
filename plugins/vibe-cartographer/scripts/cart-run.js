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
 *   node cart-run.js init     --repo <dir> --slug <slug> [--date YYYY-MM-DD]
 *   node cart-run.js add-item --run <runDir> --slug <item-slug> --stop-class go|hold|stop [--title <t>] [--on <N>]
 *   node cart-run.js start    --run <runDir> --item <N>
 *   node cart-run.js check    --run <runDir> --item <N> --command <cmd> --result pass|fail|error
 *   node cart-run.js finish   --run <runDir> --item <N> --result merged|held|parked|stopped [--reason <r>]
 *   node cart-run.js resume   --run <runDir>
 *   node cart-run.js status   --run <runDir>
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
    if (a.startsWith('--')) { out[a.slice(2)] = argv[i + 1]; i++; } else out._.push(a);
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
  const base = git(repo, 'rev-parse', 'HEAD');
  const integration = `cart/${runSlug}`;
  git(repo, 'branch', integration, base);
  const root = worktreeRoot(runSlug);
  const intWt = addWorktree(repo, path.join(root, 'int'), integration, null);
  const state = {
    run: runSlug,
    repo,
    base_commit: base,
    integration_branch: integration,
    integration_worktree: intWt,
    worktree_root: root,
    builder_branch: git(repo, 'rev-parse', '--abbrev-ref', 'HEAD'),
    uncommitted_at_start: dirty,
    started_at: new Date().toISOString(),
    items: [],
  };
  saveState(path.join(runDir, 'state.json'), state);
  return { runDir, run: runSlug, integration_branch: integration, integration_worktree: intWt, uncommitted_at_start: dirty };
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
  if (item.status === 'building' && item.worktree && fs.existsSync(item.worktree)) {
    return { item, resumed: true, worktree: item.worktree };
  }
  // Dependents of a hold item build on the hold branch; everything else on the integration tip.
  let from = state.integration_branch;
  if (item.on) {
    const dep = itemOf(state, item.on);
    if (dep.status === 'held' || dep.stop_class === 'hold') from = dep.branch;
  }
  const dir = path.join(state.worktree_root, pad(item.n));
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

const COMMANDS = {
  init: cmdInit, 'add-item': cmdAddItem, start: cmdStart, check: cmdCheck,
  finish: cmdFinish, resume: cmdResume, status: cmdStatus,
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
