#!/usr/bin/env node
// Static plugin check. Zero dependencies. Exits 1 with one message per defect.
//
// Usage: node scripts/check-plugin.js [plugin-root] [repo-root]
//   plugin-root  defaults to <repo>/plugins/vibe-cartographer
//   repo-root    defaults to two levels above plugin-root's parent (the dir holding package.json)
//
// Checks:
//   1. Frontmatter present and terminated in every skills/*/SKILL.md and commands/*.md.
//      SKILLs need name + description; commands need description (they carry no name).
//   2. Frontmatter values that would fail YAML parsing (issue #1): unescaped inner
//      double quotes in a double-quoted scalar, ": " inside an unquoted plain scalar,
//      tab indentation.
//   3. Command/skill parity: every command has a skill, every skill has a command,
//      except internal skills.
//   4. package.json version equals .claude-plugin/plugin.json version.
const fs = require('fs');
const path = require('path');

const pluginRoot = path.resolve(process.argv[2] || path.join(__dirname, '..', 'plugins', 'vibe-cartographer'));
const repoRoot = path.resolve(process.argv[3] || path.join(pluginRoot, '..', '..'));

// Commands whose skill has a different directory name.
const COMMAND_TO_SKILL = { friction: 'friction-log' };

// Skills with no command by design. A skill is also treated as internal when its
// description starts with "Internal SKILL" or its frontmatter sets user-invocable: false.
// Explicit allowlist for anything else (empty today; the tree self-describes).
const INTERNAL_ALLOWLIST = new Set([]);

const errors = [];
const fail = (file, msg) => errors.push(`${path.relative(process.cwd(), file) || file}: ${msg}`);

function parseFrontmatter(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { fail(file, `unreadable (${e.message})`); return null; }
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (lines[0].trimEnd() !== '---') { fail(file, 'frontmatter missing (file must start with ---)'); return null; }
  let end = -1;
  for (let i = 1; i < lines.length; i++) if (lines[i].trimEnd() === '---') { end = i; break; }
  if (end < 0) { fail(file, 'frontmatter unterminated (no closing ---)'); return null; }
  const fm = {};
  let key = null;
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    const ln = i + 1;
    if (/^[ ]*\t/.test(line)) fail(file, `line ${ln}: tab indentation in frontmatter`);
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const m = /^([A-Za-z0-9_-]+):(?:\s+(.*)|\s*)$/.exec(line);
    if (m && !/^\s/.test(line)) {
      key = m[1];
      const val = (m[2] || '').trim();
      fm[key] = val;
      checkScalar(file, ln, key, val);
    } else if (/^\s/.test(line) && key) {
      fm[key] += (fm[key] ? ' ' : '') + line.trim(); // block/continuation content
    } else {
      fail(file, `line ${ln}: not a "key: value" frontmatter line: ${line.slice(0, 60)}`);
    }
  }
  return fm;
}

function checkScalar(file, ln, key, val) {
  if (!val) return;
  const c = val[0];
  if (c === '"') {
    let i = 1;
    for (; i < val.length; i++) {
      if (val[i] === '\\') { i++; continue; }
      if (val[i] === '"') break;
    }
    if (i >= val.length) { fail(file, `line ${ln}: ${key}: unterminated double-quoted string`); return; }
    const rest = val.slice(i + 1).trim();
    if (rest && !rest.startsWith('#')) {
      fail(file, `line ${ln}: ${key}: unescaped inner double quote in double-quoted string (escape as \\") near: ${rest.slice(0, 40)}`);
    }
  } else if (c === "'") {
    const m = /^'(?:[^']|'')*'\s*(#.*)?$/.exec(val);
    if (!m) fail(file, `line ${ln}: ${key}: malformed single-quoted string (double inner ' as '')`);
  } else if (!'>|[{&*!%@`'.includes(c) && val !== '~') {
    if (/:(\s|$)/.test(val)) fail(file, `line ${ln}: ${key}: plain scalar contains ": " (quote the value)`);
  }
}

function listDirs(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort() : [];
}

// --- skills
const skills = {};
for (const name of listDirs(path.join(pluginRoot, 'skills'))) {
  const file = path.join(pluginRoot, 'skills', name, 'SKILL.md');
  if (!fs.existsSync(file)) { fail(path.join(pluginRoot, 'skills', name), 'skill directory has no SKILL.md'); continue; }
  const fm = parseFrontmatter(file);
  skills[name] = { file, fm };
  if (!fm) continue;
  if (!fm.name) fail(file, 'frontmatter lacks name');
  else if (fm.name.replace(/^["']|["']$/g, '') !== name) fail(file, `frontmatter name "${fm.name}" does not match directory "${name}"`);
  if (!fm.description) fail(file, 'frontmatter lacks description');
}

// --- commands
const cmdDir = path.join(pluginRoot, 'commands');
const commands = fs.existsSync(cmdDir) ? fs.readdirSync(cmdDir).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)).sort() : [];
for (const cmd of commands) {
  const file = path.join(cmdDir, cmd + '.md');
  const fm = parseFrontmatter(file);
  if (fm && !fm.description) fail(file, 'frontmatter lacks description');
}

// --- parity
const isInternal = (n) => {
  const s = skills[n];
  if (INTERNAL_ALLOWLIST.has(n)) return true;
  if (!s || !s.fm) return false;
  return /^["']?Internal SKILL/i.test(s.fm.description || '') || /^false$/i.test(s.fm['user-invocable'] || '');
};
const claimed = new Set();
for (const cmd of commands) {
  const target = COMMAND_TO_SKILL[cmd] || cmd;
  claimed.add(target);
  if (!skills[target]) fail(path.join(cmdDir, cmd + '.md'), `parity: command "${cmd}" has no matching skill "${target}"`);
  // A command shadows its same-name skill: the slash command delivers only the command body.
  // So the body must point the agent at the skill file, or the skill never loads.
  const body = fs.readFileSync(path.join(cmdDir, cmd + '.md'), 'utf8');
  if (!body.includes('${CLAUDE_PLUGIN_ROOT}/skills/' + target + '/SKILL.md')) {
    fail(path.join(cmdDir, cmd + '.md'), `shadowing: command "${cmd}" must tell the agent to read \${CLAUDE_PLUGIN_ROOT}/skills/${target}/SKILL.md`);
  }
}
for (const n of Object.keys(skills)) {
  if (!claimed.has(n) && !isInternal(n)) fail(skills[n].file, `parity: skill "${n}" has no command and is not internal`);
}

// --- version pair
const pkgFile = path.join(repoRoot, 'package.json');
const plugFile = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
const readVersion = (f) => {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')).version; } catch (e) { fail(f, `cannot read version (${e.message})`); return undefined; }
};
const pv = readVersion(pkgFile), lv = readVersion(plugFile);
if (pv !== undefined && lv !== undefined && pv !== lv) fail(plugFile, `version pair drift: package.json ${pv} vs plugin.json ${lv}`);

if (errors.length) {
  console.error(errors.map(e => 'FAIL ' + e).join('\n'));
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(`OK: ${Object.keys(skills).length} skills, ${commands.length} commands, version ${pv}.`);
