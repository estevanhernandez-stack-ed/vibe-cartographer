---
name: vitals
description: "This skill should be used when the user says \"/vitals\" or \"/vibe-cartographer:vitals\" or wants a structural integrity check on the Vibe Cartographer install. Runs eight read-only checks and reports findings in a banner-style report. Implements Pattern #8 (Plugin Self-Test) from the Self-Evolving Plugin Framework."
---

# /vitals — Self-Diagnostic

Slash command `/vibe-cartographer:vitals`. **Read-only** in this release — runs eight checks against the installed plugin files, the unified profile, the session log, and the friction log, then prints a banner-style report with per-check status (✓ pass, ⚠ warn, ✗ fail) and a summary line.

This is the diagnostic half of Pattern #8 (Plugin Self-Test) from `docs/self-evolving-plugins-framework.md`. The remedial half — per-fix interactive auto-fix prompts — layers on in a subsequent release. For 1.5.0 step 10, `/vitals` reports what's wrong and suggests where to look, but never writes.

## Before You Start

- **Data contracts:** [`../guide/references/data-contracts.md`](../guide/references/data-contracts.md) — file locations, schemas, and atomic-write/append protocols. Vitals reads every file named in that doc. Do not write any of them from this command.
- **Friction triggers contract:** [`../guide/references/friction-triggers.md`](../guide/references/friction-triggers.md) — the `/vitals` section is deliberately empty. `/vitals` does **not** call `friction-logger.log()` in 1.5.0. Declines on future auto-fix prompts are the expected mode of interaction, not friction signal. Check #6 below audits the absence.
- **Schemas:**
  - [`../guide/schemas/builder-profile.schema.json`](../guide/schemas/builder-profile.schema.json) — check #3 validates the unified profile against this.
  - [`../guide/schemas/friction.schema.json`](../guide/schemas/friction.schema.json) — check #8 validates each `friction.jsonl` line against this.
  - [`../guide/schemas/session-log.schema.json`](../guide/schemas/session-log.schema.json) — referenced by checks #5 and #8 when reading session lines.
- **Framework reference:** `docs/self-evolving-plugins-framework.md` Pattern #8 — Plugin Self-Test. The pillar is **structural integrity on demand**: surface drift between files, schemas, runtime context, and append-only logs before that drift silently breaks a command mid-flow.
- **Session logger interface:** [`../session-logger/SKILL.md`](../session-logger/SKILL.md) — `start(command, project_dir)` returns the sessionUUID for this run; terminal `end(entry)` takes it back in at command completion. Vitals itself doesn't emit friction, but it still bookends with session-logger sentinel + terminal entries like every other command.

## Session Logging

At command start, call `session-logger.start("vitals", <project_dir>)` to get the sessionUUID. Hold it in memory for the duration of the command.

At command end (after the report prints), call the session-logger terminal-append procedure with:

- `outcome: "completed"` on a clean run.
- `outcome: "partial"` if any check aborted due to an unreadable file or missing dependency that prevented the check from producing a verdict.
- `outcome: "error"` only if the command itself crashed before the summary line rendered.
- `artifact_generated: null` — vitals produces inline output, not a persisted doc.
- `complements_invoked: []` — vitals does not defer to Pattern #13 complements.
- `friction_notes: []` — see "Friction Logging" below.
- `key_decisions`: short strings for notable findings (e.g., `"3 leftover .tmp files in profiles dir"`, `"friction.jsonl has 2 malformed lines"`) that a future reader of the session log would want to see without re-running vitals.

## Friction Logging

Reference: [`../guide/references/friction-triggers.md`](../guide/references/friction-triggers.md) — section `/vitals` is intentionally empty. Vitals does **not** call `friction-logger.log()` in 1.5.0. User declines on future auto-fix prompts are the **expected** mode of interaction, not friction. Logging them would flood `/evolve` with noise about a user simply choosing not to apply a fix.

Universal triggers (`repeat_question`, `rephrase_requested`) from the top of `friction-triggers.md` still apply in principle — if the user asks the agent to re-explain a check finding with a quoted prior, the universal rule applies. Honor the **defensive default**: without a quoted prior turn in `symptom`, do not log.

Check #6 below explicitly audits that the `/vitals` section of `friction-triggers.md` remains empty and that no `friction-logger.log()` invocation exists in this SKILL. If either changes, check #6 will (correctly) fire.

## Persona Adaptation

Vitals is a diagnostic, not a conversation. Persona still applies to the one interactive moment — the opening line before the report renders — but the report body itself is neutral (the boxed checks don't carry tone). Read `shared.preferences.persona` from `~/.claude/profiles/builder.json`. Keep the opening to one sentence:

- **Professor:** "Running a structural integrity sweep — here's what each check looks at and what it found."
- **Cohort:** "Let's see what shook loose. Eight checks incoming."
- **Superdev:** "Running vitals."
- **Architect:** "Structural sweep — eight checks across SKILLs, schemas, logs, and runtime context."
- **Coach:** "Time to look under the hood. Eight checks, here we go."
- **System default:** "Running vitals."

Then render the report. No intermediate narration between checks — the report is the output.

## Arguments

- `--full` — check #5 scans the complete session-log history instead of the default 30-day window. Prints a runtime warning in the opening line: *"--full mode: this may take longer for users with extensive session history."* No other check is affected by `--full`.

Unknown flags → print a one-line warning (`⚠ unknown flag: <flag> — ignoring`) and continue.

## Runtime Paths

All paths vitals reads (never writes):

| What | Where |
|------|-------|
| Plugin root | `<repo>/plugins/vibe-cartographer/` — the currently-running plugin install. Determine from the SKILL file's own location, walk up to the plugin root. |
| SKILL files | `plugins/vibe-cartographer/skills/**/SKILL.md` |
| Command files | `plugins/vibe-cartographer/commands/*.md` |
| Templates directory | `plugins/vibe-cartographer/skills/guide/templates/` |
| Schemas directory | `plugins/vibe-cartographer/skills/guide/schemas/` |
| Guide SKILL | `plugins/vibe-cartographer/skills/guide/SKILL.md` (for the anchored complements table used by check #4) |
| Friction triggers doc | `plugins/vibe-cartographer/skills/guide/references/friction-triggers.md` (check #6) |
| Unified profile | `~/.claude/profiles/builder.json` |
| Profiles directory | `~/.claude/profiles/` (check #7) |
| Plugin data directory | `~/.claude/plugins/data/vibe-cartographer/` (check #7) |
| Sessions directory | `~/.claude/plugins/data/vibe-cartographer/sessions/` |
| Friction log | `~/.claude/plugins/data/vibe-cartographer/friction.jsonl` |
| Plugin manifest | `plugins/vibe-cartographer/.claude-plugin/plugin.json` (for version in banner) |

If any path is unreadable for reasons other than "does not exist" (permission denied, I/O error), the affected check reports `✗ fail` with the underlying error surfaced verbatim. Missing-file semantics are per-check and spelled out below.

## Flow

### 1. Open

Write the persona-adapted opening line. If `--full`, append the runtime warning.

### 2. Read plugin version and timestamp

Read `plugin.json`'s `"version"` field. Fall back to `"unknown"` on parse failure. Capture the current local ISO datetime for the banner.

### 3. Run the eight checks

Run checks #1 through #8 **in order**. Each check independently succeeds, warns, or fails. A failure in one check never aborts the next check — the report always includes all eight sections.

The full specification of each check is in **"Check Specifications"** below. The evaluator must implement each check per that spec.

### 4. Render the report

Output the banner header, then one boxed section per check, then the summary line. Full output format is spelled out in **"Output Format"** below.

### 5. Close

After the summary line, print one blank line and a closing advisory:

```
Findings above are read-only in this release. Auto-fix actions ship in the
next step of the 1.5.0 build — for now, address findings manually or file
observations via /evolve.
```

Then do the session-logger terminal append (see "Session Logging" above). No handoff — vitals is terminal, not a step in the sequential chain.

## Check Specifications

Each check below is a spec the evaluator implements at runtime. For every check, the spec names: (a) what files/state to read, (b) how to evaluate, (c) what to report on ✓ pass / ⚠ warn / ✗ fail, (d) environment-specific fail-soft behavior.

### Check #1 — SKILL cross-references

**Purpose:** every SKILL file referenced by another SKILL must exist.

**(a) Read.** Enumerate every `plugins/vibe-cartographer/skills/**/SKILL.md`. For each file, scan the body for markdown links and bare path references that point to other SKILL files — both relative paths (`../session-logger/SKILL.md`) and plugin-rooted paths (`skills/session-logger/SKILL.md`). Also include paths inside backtick code spans (e.g., `` `skills/guide/SKILL.md` ``) and the `Run the \`X\` skill (\`skills/.../SKILL.md\`)` pattern used by command files — extend the scan to `plugins/vibe-cartographer/commands/*.md` for that one pattern.

**(b) Evaluate.** For each extracted reference, resolve it to an absolute path (using the referencing file's directory for relative links, and the plugin root for plugin-rooted paths). Check whether the target file exists.

**(c) Report.**
- ✓ pass: every referenced SKILL file exists.
- ✗ fail: one or more references point to missing files. List each broken reference as `<source_file>:<line_no> → <referenced_path>`. Suggest: *"Check whether the referenced SKILL was renamed or removed. If renamed, update the reference. If intentionally removed, remove the reference."*

There is no "warn" state for this check.

**(d) Fail-soft.** If a SKILL file is itself unreadable, emit one line — `⚠ could not scan <path>: <error>` — inside the check's box and continue. The check's overall verdict becomes ⚠ warn if any file was unreadable but no outright broken references were found; ✗ fail if at least one broken reference was found (regardless of unreadable files).

### Check #2 — Template references

**Purpose:** every template file referenced by a SKILL must exist.

**(a) Read.** Same SKILL-and-command enumeration as check #1. Scan for references of the form `templates/<filename>` or `../guide/templates/<filename>` or any path that resolves under `plugins/vibe-cartographer/skills/guide/templates/`. Also enumerate the templates directory so the check can report templates that exist-but-aren't-referenced (warn only; not a failure).

**(b) Evaluate.** For each template reference, resolve to an absolute path and check existence. Separately: for each file present in `templates/`, record whether any SKILL references it.

**(c) Report.**
- ✓ pass: every referenced template exists.
- ⚠ warn: a template exists on disk but no SKILL references it. List each as `<template_path>` under the "unreferenced templates" label. (This is a soft signal for `/evolve` to consider pruning; not a structural failure.)
- ✗ fail: a SKILL references a template that does not exist. List each broken reference as `<source_file>:<line_no> → <referenced_path>`.

Fail takes precedence over warn — if there are both broken references and unreferenced templates, the check reports ✗ fail and still lists the warn-tier findings underneath the fail findings.

**(d) Fail-soft.** Templates directory missing entirely → skip the unreferenced-templates pass and report only on broken references. Note in the box: *"Templates directory not found at `<path>` — checked broken-reference side only."*

### Check #3 — Unified profile schema

**Purpose:** the unified profile at `~/.claude/profiles/builder.json` parses as JSON and validates against `builder-profile.schema.json`, with no unknown top-level or namespace-level fields.

**(a) Read.** Open `~/.claude/profiles/builder.json`. Open `plugins/vibe-cartographer/skills/guide/schemas/builder-profile.schema.json`.

**(b) Evaluate.**
1. Profile missing entirely → ⚠ warn with message *"No unified profile yet — run `/onboard` to create one. Subsequent vitals runs will validate it."* (Not a failure: first-time or un-onboarded users legitimately have no profile.)
2. Profile present but not parseable JSON → ✗ fail with the parse error.
3. Profile present and parseable → validate against the schema. Collect violations:
   - Required top-level fields missing (`schema_version`, `shared`, `plugins`).
   - Unknown top-level fields (the schema uses `additionalProperties: false` at relevant levels — per `data-contracts.md` the namespace isolation rules define exactly what's allowed where).
   - Namespace violations per Pattern #11: e.g., a `plugins.<name>._meta` block containing fields not in the schema, or a legacy `plugins.app-project-readiness` block still present after 1.5.0 migration.
   - `_meta` entries missing `last_confirmed` or `ttl_days`.

**(c) Report.**
- ✓ pass: profile parses and validates with zero violations.
- ⚠ warn: profile parses but has one or more non-fatal shape issues (unknown optional fields, missing `_meta` entries where decay expects them, legacy namespace present). List each as `<path_in_profile>: <issue>`.
- ✗ fail: profile fails to parse, OR has a required-field violation, OR contains keys the schema explicitly forbids. List each as `<path_in_profile>: <violation>`.

**(d) Fail-soft.** No runtime JSON Schema validator is mandated for 1.5.0 — the check is structural and can be run with a minimal Draft-07 validator (or a hand-rolled walk of the schema against the profile). If the validator itself cannot load the schema file (missing or malformed), report ✗ fail: *"Could not load builder-profile.schema.json at `<path>`: `<error>`. This is itself a check #1-style integrity failure — the plugin install is incomplete."*

### Check #4 — Pattern #13 complement availability

**Purpose:** every anchored Pattern #13 complement listed in `guide/SKILL.md`'s anchored-complements table is present in the agent's current available skills/tools list.

**(a) Read.** Parse the "Anchored complements table" section of `plugins/vibe-cartographer/skills/guide/SKILL.md` — the markdown table whose first column is `Complement`. Extract the complement identifier from each row's first cell (strip backticks; normalize MCP wildcards like `mcp__plugin_playwright_playwright__*` to a prefix-match intent). Cross-reference against the agent's runtime available-skills list (the same list the agent uses to satisfy the Skill tool and the MCP tool surfaces).

**(b) Evaluate.**
- **Runtime context complete:** for each anchored complement, check whether it appears in the available skills/tools list. A match means the exact identifier is present, or for wildcard entries, at least one entry with the declared prefix is present.
- **Runtime context incomplete:** the agent cannot reliably enumerate its full available-skills list (e.g., a subagent context that receives a trimmed surface, a restarted Claude Code session that hasn't re-indexed, an MCP surface still loading). Detect this by signals like: the available-skills enumeration returns a clearly smaller set than expected for this plugin's own siblings (Cart's own skills missing from the list), or the Skill tool's listing API declines. When detected, **fail soft** — do not flag missing complements.

**(c) Report.**
- ✓ pass: every anchored complement is present in the available-skills list.
- ⚠ warn: one or more anchored complements are not present in the available-skills list (and runtime context is complete). List each as `<complement_identifier> — not found in available skills`. Suggest: *"Either the builder removed that plugin, or the anchored table is stale. `/evolve` can propose removing a defunct complement from the table; auto-fix (d) in a later vitals release will offer it inline."*
- **Fail-soft branch (runtime context incomplete):** box header still reads `Check #4 — Pattern #13 complement availability`, status is ⚠ warn, and the body is exactly: *"Could not verify N complements due to incomplete runtime context. Re-run /vitals after restarting Claude Code."* where N is the count of anchored complements that could not be verified. Do not list individual complements in this branch — the signal is not reliable and listing them would create false evidence for `/evolve` later.

There is no ✗ fail state for this check in 1.5.0. Anchored-table drift is a warn, not a structural failure — the plugin still runs.

**(d) Fail-soft.** See the branch in (b) and (c). Also: if the guide SKILL itself cannot be read, report ⚠ warn with *"Could not load guide SKILL at `<path>` — check #1 should also fire. Re-run vitals after that's resolved."*

### Check #5 — Friction log volume sanity

**Purpose:** friction entries are being produced at a plausible rate. Too few → detection is broken; too many → detection is over-firing. Both are warnings, not failures.

**(a) Read.**
- Session log window: by default, the last 30 days of `~/.claude/plugins/data/vibe-cartographer/sessions/*.jsonl`. With `--full`, the complete history.
- Friction log: `~/.claude/plugins/data/vibe-cartographer/friction.jsonl`.

Parse each session-log line as JSON; silently skip malformed lines (check #8 owns repair, not this check). Count terminal entries only (outcome in `completed | abandoned | error | partial`) — sentinels without a terminal are counted by `friction-logger.detect_orphans()`, not here.

**(b) Evaluate.**
1. **First-3-sessions suppression.** If the total terminal-entry count (in the scan window) is less than 3, skip the volume evaluation and report a special informational state. The per-session friction signal is too noisy at small N to make a useful claim.
2. **No friction log yet.** If `friction.jsonl` does not exist, report a special informational state (distinct from suppression).
3. **Otherwise** compute: `friction_per_session = friction_entries_in_window / terminal_entries_in_window`. Then evaluate against the thresholds:
   - `0 < friction_per_session < 0.05` → **under-firing**: detection may be broken. Warn.
   - `0.05 ≤ friction_per_session ≤ 5.0` → **healthy**: pass.
   - `friction_per_session > 5.0` → **over-firing**: detection may be poisoning `/evolve`. Warn.
   - `friction_per_session == 0` AND `terminal_entries_in_window ≥ 10` → **silent**: no friction across 10+ sessions is suspicious. Warn.
   - `friction_per_session == 0` AND `terminal_entries_in_window < 10` → **too early**: pass, with informational note that "volume trend will calibrate after more sessions."

The 5.0 upper bound and 0.05 lower bound are educated guesses per the spec's "Real-world friction-detection thresholds" open issue; `/reflect` calibration will tune these in a later release.

**(c) Report.**
- ✓ pass: healthy OR too-early-to-tell. Include a one-line metric: `<friction_count> friction entries across <terminal_count> terminal sessions in the last <window>.`
- ⚠ warn: under-firing, over-firing, or silent. Include the same one-line metric plus a diagnosis: *"Likely under-firing: expected ≥ 0.05/session, observed <X>. Check friction-triggers.md for missing triggers."* or *"Likely over-firing: …"* or *"Silent across 10+ sessions: …"*
- ⚠ warn (special — first-3-sessions): box body reads exactly: *"Feature available after 3 sessions (currently N logged). Skipping volume evaluation."*
- ⚠ warn (special — no friction log): box body reads exactly: *"No friction log yet — feature available after first friction event."*

Neither of the special cases is a failure; they're informational warnings so the user sees the check ran and why it held off.

**(d) Fail-soft.** Sessions directory missing entirely → treat as "0 sessions" and fall through to the first-3-sessions suppression. With `--full` flag, prepend an inline note inside the box: *"Full-history scan: evaluated N session files spanning <first_date> → <last_date>."*

### Check #6 — Friction-trigger consistency

**Purpose:** every `friction-logger.log()` invocation in command SKILLs maps to a `friction-triggers.md` entry, and every `friction-triggers.md` entry has at least one corresponding invocation (or a documented exception).

**(a) Read.**
- `plugins/vibe-cartographer/skills/guide/references/friction-triggers.md` — parse out each per-command section and its table rows. For each row, extract the `friction_type` column value and the command name from the section heading (e.g., `## /scope` → `scope`).
- Every command SKILL at `plugins/vibe-cartographer/skills/*/SKILL.md` — extract friction invocations declared by the SKILL's **"Friction Logging"** section (the canonical list of triggers and friction types each SKILL pledges to emit). This section is consistently structured across all command SKILLs per the 1.5.0 wiring. For each bullet/row, extract the `friction_type: "<value>"` literal. Record `(skill_dir_name, friction_type_string)`. **Do not** match `friction-logger.log(` substrings outside the Friction Logging section — those appear in narrative prose ("this SKILL does not call `friction-logger.log()` …") and match spuriously.

**(b) Evaluate.** Build two sets:
- **Trigger map:** `{ (command, friction_type) | declared in friction-triggers.md }`.
- **Invocation map:** `{ (command, friction_type) | appears in the matching skill's SKILL.md }`. The command name is the SKILL's directory name (e.g., `skills/scope/SKILL.md` → `scope`). Universal triggers from the "Universal triggers" section of `friction-triggers.md` are tagged to every command except the two documented exceptions — `/vitals` and `/friction` — whose per-command tables are explicitly empty by design.

Compute:
- **Orphan invocations:** `(command, friction_type)` invoked in a SKILL but not declared in the trigger map.
- **Orphan triggers:** `(command, friction_type)` declared in the trigger map but with no matching invocation in the SKILL. Exclude two categories:
  - `command_abandoned` universally — emitted only by `friction-logger.detect_orphans()`, not directly by command SKILLs.
  - Anything under the `/vitals` or `/friction` headings (both documented as empty tables).

**(c) Report.**
- ✓ pass: both orphan sets are empty.
- ⚠ warn: orphan triggers only — the trigger map documents a row the SKILL doesn't implement. List each as `<command>: <friction_type> declared but not invoked`. Suggest: *"Either the SKILL lost the trigger point (add the invocation) or the trigger is no longer relevant (remove the row)."*
- ✗ fail: orphan invocations only OR both orphan sets non-empty — the SKILL logs a friction type that isn't in the map. List each as `<command>: invokes <friction_type> without a matching row in friction-triggers.md`. Suggest: *"Add the row to friction-triggers.md (with confidence and notes) or remove the invocation."*

**Vitals-specific assertion:** also verify that this file (`vitals/SKILL.md`)'s "Friction Logging" section declares **no** `friction_type` (it explicitly documents the absence). If a future edit adds one — despite the documented empty `/vitals` table — surface it under orphan invocations as `vitals: declares <friction_type> in Friction Logging but /vitals table is documented empty`. Same applies to `friction-log/SKILL.md` (the `/friction` command) for the same reason.

**(d) Fail-soft.** `friction-triggers.md` unreadable → report ✗ fail with *"Could not load friction-triggers.md at `<path>`: `<error>`. Check #1 should have caught the underlying file issue — fix that first."* Command SKILLs directory missing → report ✗ fail with the missing-directory path (same plugin-integrity-failure class).

### Check #7 — Leftover `.tmp` debris

**Purpose:** `scripts/atomic-write-json.js` writes to `<path>.tmp` then renames. A crash or filesystem failure between the write and the rename leaves a `.tmp` file as debris. Vitals surfaces the debris so the user (or a future auto-fix release) can sweep it.

**(a) Read.** Enumerate non-recursively (or shallowly recursively for `plugin-data-dir`, depth 2 — sessions/ subdirectory is included):
- `~/.claude/profiles/` — list top-level entries.
- `~/.claude/plugins/data/vibe-cartographer/` — list top-level entries plus the contents of `sessions/`.

**(b) Evaluate.** Filter to files whose name ends in `.tmp`. For each, record the full path and its modification timestamp.

**(c) Report.**
- ✓ pass: no `.tmp` files found in either directory.
- ⚠ warn: one or more `.tmp` files found. List each as `<path> (modified <timestamp>)`. Suggest: *"These are leftover debris from an interrupted atomic write. A future `/vitals` release will offer auto-fix (e) to delete them with confirmation. For now, inspect and `rm` manually if stale."*

There is no ✗ fail state for this check — `.tmp` files are debris, not corruption.

**(d) Fail-soft.** Either directory missing entirely → skip that side's scan with an inline note: *"`<path>` not found — nothing to scan on that side."*. Both directories missing → ✓ pass (nothing exists to have debris).

### Check #8 — friction.jsonl line integrity

**Purpose:** every line in `friction.jsonl` is valid JSON and validates against `friction.schema.json`. Malformed lines can be introduced by concurrent-write corruption on Windows (O_APPEND atomicity is weaker there per spec Key Technical Decision #2).

**(a) Read.** Open `~/.claude/plugins/data/vibe-cartographer/friction.jsonl`. Open `plugins/vibe-cartographer/skills/guide/schemas/friction.schema.json`.

**(b) Evaluate.**
1. Friction log does not exist → report special informational state (see (c)). Not a failure.
2. Friction log exists. For each line (1-indexed):
   - Attempt JSON parse. Record `(line_no, "parse_error", error_message)` on failure.
   - On parse success, validate against `friction.schema.json`. Record `(line_no, "schema_violation", reason)` on failure.
3. Also verify `schema_version` is `1` on every parsed line.

**(c) Report.**
- ✓ pass: every line parses and validates.
- ⚠ warn (special — no friction log): box body reads exactly: *"No friction log yet — feature available after first friction event."*
- ✗ fail: one or more lines failed. List each as `<line_no>: <failure_kind> — <detail>`. Suggest: *"A future `/vitals` release will offer auto-fix (f) to rewrite the file dropping only malformed lines, with a `.bak` backup of the current file. For now, inspect the file manually — malformed lines near the end usually indicate a write that was interrupted mid-append."*

**(d) Fail-soft.** Schema file unreadable → report ✗ fail with the same install-integrity message as check #3's (d). File present but zero bytes → ✓ pass (valid empty log).

## Output Format

The report is rendered as markdown. Color is conveyed via emoji (✓ / ⚠ / ✗); box drawing uses Unicode characters evoking the Vibe Doc CLI banner aesthetic. Everything below is agent output — the evaluator emits it verbatim (with computed values substituted) after the checks run.

### Banner header

Two-line banner, indented two spaces, with a separator rule:

```
  📖  Vibe Cartographer — Vitals
  <version> · <ISO-local-timestamp>
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Where `<version>` is the `version` field from `plugin.json` (or `"unknown"` if the manifest could not be read), and `<ISO-local-timestamp>` is the local-time ISO datetime captured at vitals start.

If `--full` was passed, insert a dim-indent line below the rule:

```
  --full mode: complete history scanned. This may take longer for users
  with extensive session history.
```

Then one blank line before the first check.

### Per-check boxed section

Each of the eight checks renders as its own box. Use Unicode box-drawing characters. Inside the box, the first line is the check status + title, and subsequent lines are findings.

```
  ┌──────────────────────────────────────────────────────────────────┐
  │ ✓  Check 1 — SKILL cross-references                              │
  └──────────────────────────────────────────────────────────────────┘
     All references resolved. Scanned N SKILL files, M command files.
```

```
  ┌──────────────────────────────────────────────────────────────────┐
  │ ⚠  Check 4 — Pattern #13 complement availability                 │
  └──────────────────────────────────────────────────────────────────┘
     Could not verify 10 complements due to incomplete runtime context.
     Re-run /vitals after restarting Claude Code.
```

```
  ┌──────────────────────────────────────────────────────────────────┐
  │ ✗  Check 6 — Friction-trigger consistency                        │
  └──────────────────────────────────────────────────────────────────┘
     Orphan invocations (SKILL logs a type not in the trigger map):

     | Command  | Friction type        | SKILL path                      |
     |----------|----------------------|---------------------------------|
     | iterate  | rephrase_requested   | skills/iterate/SKILL.md         |

     Suggested next step: add the row to friction-triggers.md or remove
     the invocation from skills/iterate/SKILL.md.
```

**Status glyph rules:**
- `✓` for pass.
- `⚠` for warn.
- `✗` for fail.
- Each glyph is followed by **two** spaces before the check title to give the box a visual breathing rhythm matching Vibe Doc's `success()/warn()/fail()` helpers in `packages/vibe-doc/src/utils/ui.ts`.

**Box width:** target 68 columns for the top/bottom rules so the boxes render identically across checks.

**Tables inside boxes** (for findings lists) render as standard GitHub-flavored markdown tables, indented four spaces so they visually nest inside the check's box. Column widths are not fixed — let the markdown renderer size them.

**Empty findings** for a ✓ pass: one single summary line of the form `<what was scanned>: <headline metric>` so the ✓ box has content, not just a status. Examples:

- Check 1: `All references resolved. Scanned <N> SKILL files, <M> command files.`
- Check 2: `All template references resolved. <N> templates, <M> referenced.`
- Check 3: `Unified profile validates against builder-profile.schema.json.`
- Check 4: `All <N> anchored complements present in available-skills list.`
- Check 5: `<N> friction entries across <M> terminal sessions in the last <window>.`
- Check 6: `<N> trigger rows, <M> matching invocations — map is consistent.`
- Check 7: `No leftover .tmp files in profiles or plugin-data directories.`
- Check 8: `<N> lines in friction.jsonl, all valid.`

### Summary line

After the last check box, one blank line, then a summary line of the form:

```
  <N> ✓  ·  <N> ⚠  ·  <N> ✗
```

Indented two spaces, glyphs separated by middle dot and two spaces on each side. The three counts sum to 8.

Below the summary line, one blank line, then the closing advisory from step 5 of the flow.

## Mental Trace — Expected Output Under Current Cart 1.5.0 Install

This is the deterministic output the evaluator should produce when invoked against a clean 1.5.0 install with no user friction yet.

- **Check 1** — ✓ pass. All internal SKILL cross-references resolve (the 1.5.0 step-by-step build wires them intentionally).
- **Check 2** — ✓ pass if every template referenced by SKILLs exists. Warn if a template file is present but unreferenced; typical first-run state is ✓ pass.
- **Check 3** — ⚠ warn with "No unified profile yet — run `/onboard` to create one" if the builder hasn't run `/onboard`; ✓ pass post-onboard.
- **Check 4** — ⚠ warn in the fail-soft branch ("Could not verify … incomplete runtime context") in agents that receive a trimmed Skill surface; ✓ pass in a fresh Claude Code CLI session with the full plugin loaded.
- **Check 5** — ⚠ warn with "Feature available after 3 sessions (currently 0 logged)" on a first run.
- **Check 6** — ✓ pass. The step-10 install wires friction-triggers.md and the command SKILLs consistently; the one intentional empty row (`/vitals`) and one (`/friction`) are documented and excluded from the orphan-trigger set.
- **Check 7** — ✓ pass in a healthy install; ⚠ warn if the user has recently experienced a crashed atomic-write.
- **Check 8** — ⚠ warn with "No friction log yet — feature available after first friction event" on a first run; ✓ pass after the log exists and is clean.

A typical first-run summary line is `3 ✓  ·  5 ⚠  ·  0 ✗` (the warns being checks #3, #4, #5, #8, and possibly #2 for unreferenced templates).

A typical steady-state summary line after `/onboard` and several sessions is `8 ✓  ·  0 ⚠  ·  0 ✗`.

## Why This SKILL Exists

Pattern #8 from the Self-Evolving Plugin Framework is the "you touch it, you break it" hedge — every plugin with multiple SKILLs, schemas, and append-only logs eventually develops cross-file drift. Without an on-demand diagnostic, that drift surfaces as a command failing mid-flow, at the worst possible moment for the builder.

`/vitals` is the structural half of the pair. It surfaces eight known drift axes cheaply, reproducibly, and without writing anything. The remedial half — per-fix interactive auto-fix prompts — layers on in the next step of the 1.5.0 build and reads the same eight axes. Keeping them in two steps lets the diagnostic itself ship standalone, gives `/evolve` a stable target to propose improvements against, and keeps the read-only contract crisp: running `/vitals` is always safe.

The one PRD Story this SKILL directly doesn't implement is the **interactive fix-offer layer** (auto-fixes a through f). That's intentional — those ship next.
