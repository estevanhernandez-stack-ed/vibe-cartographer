# Vibe Cartographer L3.5 — Technical Spec

## Stack

- **Plugin SKILL files**: Markdown (`.md`) following the existing Vibe Cartographer SKILL conventions. Five-field format for any new commands; persona/mode adaptation tables; one-question-at-a-time interaction rule.
- **Shared utilities**: Node.js single-file scripts (no dependencies). Targets Node 18+ (already a Cart prerequisite via `engines.node` in `package.json`).
- **Schema files**: JSON Schema Draft-07 (`.schema.json`) — machine-validatable, `/vitals` consumes directly.
- **Data files at runtime**: JSON for the unified profile, JSONL for append-only logs.
- **Distribution**: unchanged — npm + GitHub marketplace via `marketplace.json` + Claude Code CLI plugin manager.

**Reference docs:**
- [Self-Evolving Plugin Framework](./self-evolving-plugins-framework.md) — Pattern definitions for #4, #6, #8, #13.
- [JSON Schema Draft-07](https://json-schema.org/draft-07/) — schema syntax.
- [Node `fs.appendFileSync`](https://nodejs.org/api/fs.html#fsappendfilesyncpath-data-options) — atomic-append documentation.
- [Node `fs.renameSync`](https://nodejs.org/api/fs.html#fsrenamesyncoldpath-newpath) — atomic-rename documentation.

## Runtime & Deployment

- **Runtime**: Plugin loads inside Claude Code CLI / IDE / Cowork. SKILL files are read by the Claude agent at command invocation. Node scripts execute via `child_process` (or Bash equivalent) when SKILLs invoke `node scripts/<script>.js`.
- **Deployment surface**: same as Cart 1.4.x — npm package `@esthernandez/vibe-cartographer`, GitHub marketplace `estevanhernandez-stack-ed/app-readinessplugin`, GitHub release with `.plugin` asset.
- **Environment requirements**: Node 18+. No new external API keys, no new dependencies.
- **Local data files**: written under `~/.claude/profiles/` and `~/.claude/plugins/data/vibe-cartographer/` per existing convention. No project-level data files added in 1.5.0.

## Architecture Overview

```text
┌────────────────────────────────────────────────────────────────┐
│ COMMAND LAYER (slash commands user invokes)                    │
│  /onboard, /scope, /prd, /spec, /checklist, /build,            │
│  /iterate, /reflect, /evolve, /vitals (NEW), /friction (NEW)   │
└─────────────────────────┬──────────────────────────────────────┘
                          │ invokes
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ INTERNAL SKILL LAYER (not user-invocable)                      │
│  decay (NEW)  ──┐                                              │
│  friction-logger (NEW)                                         │
│  session-logger (UPDATED)                                      │
│  guide (UPDATED)                                               │
└─────────────────────────┬──────────────────────────────────────┘
                          │ invokes
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ SHARED UTILITY LAYER (Node single-file scripts)                │
│  scripts/atomic-write-json.js   (NEW)                          │
│  scripts/atomic-append-jsonl.js (NEW)                          │
└─────────────────────────┬──────────────────────────────────────┘
                          │ writes/reads
                          ▼
┌────────────────────────────────────────────────────────────────┐
│ DATA LAYER (filesystem)                                        │
│  ~/.claude/profiles/builder.json                               │
│    └─ shared._meta, plugins.<name>._meta (NEW nested blocks)   │
│  ~/.claude/plugins/data/vibe-cartographer/                     │
│    ├─ sessions/<date>.jsonl  (UPDATED: sentinel entries)       │
│    ├─ friction.jsonl          (NEW)                            │
│    └─ friction.calibration.jsonl (NEW)                         │
└────────────────────────────────────────────────────────────────┘
                          ▲
                          │ reads (validates against)
                          │
┌────────────────────────────────────────────────────────────────┐
│ SCHEMA + CONTRACT LAYER (source-of-truth)                      │
│  skills/guide/schemas/builder-profile.schema.json   (NEW)      │
│  skills/guide/schemas/friction.schema.json          (NEW)      │
│  skills/guide/schemas/friction-calibration.schema.json (NEW)   │
│  skills/guide/schemas/session-log.schema.json       (NEW)      │
│  skills/guide/references/data-contracts.md          (NEW)      │
│  skills/guide/references/friction-triggers.md       (NEW)      │
└────────────────────────────────────────────────────────────────┘
```

---

## Component: Foundation (Decay + Shared Utilities)

Implements `prd.md > Epic 1 — Profile Decay & Refresh` and `prd.md > Epic 6 — Cross-Cutting Shared Utilities`.

### Subcomponent: scripts/atomic-write-json.js (NEW)

PRD ref: `prd.md > Epic 6 > Story 6.1`.

Node single-file, zero dependencies. Reads JSON object via stdin, writes atomically to `<target-path>`.

**Interface:**
```bash
node scripts/atomic-write-json.js <target-path>
# stdin: JSON object
# exit 0 on success
# exit 1 on failure (error written to stderr)
```

**Behavior:**
1. Read all of stdin.
2. Parse as JSON. Exit 1 with `"invalid JSON: <reason>"` if parse fails.
3. Ensure parent directory exists (`mkdirSync` recursive).
4. Write to `<target-path>.tmp` with `fs.writeFileSync`.
5. Call `fs.fsyncSync` on the temp file's file descriptor.
6. Atomically rename `<target-path>.tmp` → `<target-path>` via `fs.renameSync`.
7. Exit 0.

**Failure semantics:**
- If steps 4 or 5 fail, original file is unchanged, leftover `.tmp` file exists. `/vitals` check #7 detects and offers cleanup.
- If step 6 fails (rare — only if filesystem doesn't support atomic rename), original is unchanged, `.tmp` is debris.
- Script does not retry. Caller decides retry policy. Failed atomic-writes surface as failures up the SKILL chain.

**Interface signature** matches future `@626labs/plugin-core/state` TypeScript module so Phase 2 migration replaces the script with a typed function call without changing SKILL contracts.

### Subcomponent: scripts/atomic-append-jsonl.js (NEW)

PRD ref: `prd.md > Epic 6 > Story 6.1`.

Node single-file, zero dependencies. Reads one JSON line via stdin, atomically appends to `<target-path>`.

**Interface:**
```bash
node scripts/atomic-append-jsonl.js <target-path>
# stdin: one JSON object (will become one line)
# exit 0 on success
# exit 1 on failure
```

**Behavior:**
1. Read all of stdin.
2. Parse as JSON. Exit 1 if parse fails (`"invalid JSON: <reason>"` to stderr).
3. Serialize back to a single line (no embedded newlines).
4. Ensure parent directory exists.
5. Open file with `O_APPEND | O_WRONLY | O_CREAT` flags via `fs.openSync` — kernel-guaranteed atomicity for appends ≤ PIPE_BUF on POSIX.
6. Write the serialized line + `\n` via `fs.writeSync`.
7. Close, exit 0.

**Cross-platform note:**
- POSIX (Mac/Linux): O_APPEND atomicity covers our entry sizes (well under PIPE_BUF).
- Windows: O_APPEND atomicity is weaker. For 1.5.0 we accept this — friction entries are small and concurrent same-user same-machine writes are rare. If corruption is observed in the wild, post-1.5.0 patch adds a lockfile fallback (file existence check + retry with exponential backoff).

**Failure semantics:**
- If file is locked by another process, exit 1 with `"could not acquire append: <reason>"`. Caller decides retry.
- Malformed lines from concurrent-write corruption (Windows edge case) detected by `/vitals` check #8 (line integrity) with auto-fix (f) repair.

### Subcomponent: skills/decay/SKILL.md (NEW)

PRD ref: `prd.md > Epic 1`.

Internal SKILL — not a slash command. Invoked by `/onboard` only.

**Two procedures:**

**`check_decay()`**
1. If `decay_disabled: true` at top of unified profile, return `null`.
2. Walk every namespace's `_meta` block (currently `shared._meta` and `plugins.vibe-cartographer._meta`).
3. For each entry, check if `last_confirmed + (ttl_days * 86400000) < now`.
4. If stale, set `stale: true` (in-memory only — actual write happens via stamp).
5. Return the highest-priority stale field's path. Priority order: `persona > experience.level > tone > pacing > languages > frameworks`.
6. If no stale field, return `null`.

**`stamp(field_path)`**
1. Find the `_meta` entry for this field path (resolves via the namespace structure).
2. Update `last_confirmed` to today (ISO date), `stale: false`, preserve `ttl_days`.
3. Write the modified profile back via `node scripts/atomic-write-json.js ~/.claude/profiles/builder.json`.
4. On atomic-write failure, surface error to caller. Stamp does not retry.

**Default TTLs** (set on first stamp if `ttl_days` missing):
- `preferences.persona` / `preferences.tone` / `preferences.pacing` / `preferences.communication_style`: 180 days
- `technical_experience.level`: 365 days
- `technical_experience.languages` / `technical_experience.frameworks`: 90 days
- `creative_sensibility` / `name` / `identity`: never decays — these fields don't get `_meta` entries

**Wired into `/onboard`:** at command start (after sentinel entry written), call `check_decay()`. If a stale field returns, embed the gentle confirmation question in the welcome message. After user responds, call `stamp(field_path)` and update the value in the profile if user changed it.

### Subcomponent: skills/guide/references/data-contracts.md (NEW)

PRD ref: `prd.md > Epic 6 > Story 6.1`.

Single source of truth for:
- Unified profile schema overview (with reference to JSON Schema file)
- friction.jsonl schema overview
- friction.calibration.jsonl schema overview
- session-log schema overview
- Atomic-write protocol explanation (when, why, how)
- Atomic-append protocol explanation
- Strict namespace isolation rules (Pattern #11)

Every SKILL that touches these data files must include a reference to this doc in its "Before You Start" section.

### Subcomponent: skills/guide/schemas/*.schema.json (NEW)

JSON Schema Draft-07 documents. Machine-validatable. Consumed by `/vitals` check #3 directly.

**Files:**
- `builder-profile.schema.json` — describes the unified profile including the new `_meta` blocks
- `friction.schema.json` — describes friction entries (7 friction types as enum, confidence as enum, all fields)
- `friction-calibration.schema.json` — describes calibration entries
- `session-log.schema.json` — describes session entries (including `outcome: "in_progress"` sentinel)

---

## Component: Friction Capture + Pattern #13 Integration

Implements `prd.md > Epic 2 — Friction Capture & Calibration` and `prd.md > Epic 4 — Pattern #13 Integration`.

### Subcomponent: skills/friction-logger/SKILL.md (NEW)

PRD ref: `prd.md > Epic 2 > Stories 2.1, 2.2, 2.5`, `prd.md > Epic 4 > Story 4.1`.

Internal SKILL. Invoked by every command SKILL at trigger points defined in `skills/guide/references/friction-triggers.md`.

**Two procedures:**

**`log(entry)`**
1. Validate entry against `friction.schema.json`. On invalid, exit silently (defensive default — better to miss than poison).
2. Build full entry: schema_version=1, timestamp=now, plugin_version (read from .claude-plugin/plugin.json), plus caller-provided fields.
3. Append to `~/.claude/plugins/data/vibe-cartographer/friction.jsonl` via `node scripts/atomic-append-jsonl.js`.
4. On append failure, surface to caller via stderr but don't block command.

**`detect_orphans()`**
1. Scan `~/.claude/plugins/data/vibe-cartographer/sessions/*.jsonl` from last 7 days.
2. For each `outcome: "in_progress"` entry, check if a terminal entry exists with matching `(command, project_dir, sessionUUID)` triple.
3. If no match AND timestamp older than 24h, treat as orphan.
4. For each orphan, call `log({friction_type: "command_abandoned", original_command, original_timestamp, sessionUUID, project_dir})`.

**Wired into:** `/onboard` at startup (calls `detect_orphans()`); every command SKILL at trigger points.

### Subcomponent: skills/guide/references/friction-triggers.md (NEW)

PRD ref: `prd.md > Epic 2 > Story 2.1`.

Source of truth for "when does each command log which friction type." Each command SKILL references this doc in its "Before You Start" section. Format:

```markdown
## /scope

| Trigger | Friction type | Confidence | Notes |
|---------|---------------|------------|-------|
| User says "no" or "skip" to a Pattern #13 complement offer | complement_rejected | high | Set complement_involved field |
| User explicitly chooses opposite of recommended deepening default | default_overridden | medium | Quote the recommendation in symptom field |
| User asks agent to re-explain or simplify | rephrase_requested | high | Capture the topic in symptom field |
| User rewrites >50% of the generated scope.md | artifact_rewritten | high | Measured by line diff |
```

(Repeated section for every command SKILL.)

### Subcomponent: skills/session-logger/SKILL.md (UPDATED)

PRD ref: `prd.md > Epic 2 > Story 2.2`, `prd.md > Epic 4 > Story 4.2`.

**Changes from 1.4.x:**

1. **Sentinel entry on command start.** New procedure `start(command, project_dir)`:
   - Generate sessionUUID (random UUID v4).
   - Append `{schema_version, timestamp, plugin, plugin_version, command, project_id, project_dir, mode, persona, sessionUUID, outcome: "in_progress"}` to today's `sessions/<date>.jsonl` via atomic-append.
   - Return the sessionUUID for the command to track.

2. **Terminal entry on command end.** Existing append behavior wraps to use the same sessionUUID for matching with the sentinel.

3. **`_meta.last_seen_complements` update.** At terminal entry, also write `plugins.vibe-cartographer._meta.last_seen_complements` to the unified profile (atomic-write):
   - `last_seen_complements.list`: array of complement names detected at this run
   - `last_seen_complements.timestamp`: now
   - `last_seen_complements.previous_diff_count`: count of complements gained or lost vs previous session
   - `last_seen_complements.notable_change_at`: timestamp set when previous_diff_count >= 2 (the material-change threshold)

### Subcomponent: skills/friction-log/SKILL.md (NEW)

PRD ref: `prd.md > Epic 2 > Story 2.4, 2.5`.

Slash command `/vibe-cartographer:friction`. Read-only inspection of friction.jsonl.

**Default behavior:** show last 30 days of friction entries grouped by type, with confidence indicators.

**Flags:**
- `--project <name>` — filter by project_dir
- `--type <friction_type>` — filter by friction type (one of the 7)
- `--confidence <min>` — show only entries at confidence >= min (high|medium|low)
- `--days <n>` — override the 30-day default

**Output style:** banner header, table format per friction type group, color coding by confidence.

### Subcomponent: skills/reflect/SKILL.md (UPDATED)

PRD ref: `prd.md > Epic 2 > Story 2.3`.

**Changes from 1.4.x:** at end of Part B (after the project review observations, before the closing), add:

```markdown
### Calibration check-in

I captured N friction notes during this project. Want to look through them
quickly and tell me if any were false positives or if I missed any real
friction?

  [yes] — I'll show them grouped by type for marking
  [skip] — friction log stays as-is
```

If `[yes]`, list the entries from this project's session window with one-letter inline marking interface (`fp` = false positive, `fn` = false negative for missed friction the user describes). Each marked entry writes a calibration entry to `friction.calibration.jsonl` via atomic-append.

### Subcomponent: skills/evolve/SKILL.md (UPDATED)

PRD ref: implicit dependency from Epic 2 — `/evolve` must be the consumer of friction.jsonl for L3.5 to be cohesive.

**Changes from 1.4.x:**

1. **Read friction.jsonl** in addition to session logs and process-notes.
2. **Read friction.calibration.jsonl** for weighting.
3. **Weight entries:**
   - Base weight by confidence: high=1.0, medium=0.6, low=0.3
   - Multiply by 0.0 if a calibration entry marks this entry as `false_positive` (effectively removes it)
   - Multiply by 0.5 if entry references a complement no longer in the agent's available skills list
4. **Surface complement-rejection patterns specifically:** if a complement has 3+ `complement_rejected` entries with sum-weight >= 2.4, propose either dropping from anchored table (Plugin track) or flagging personal-only (Personal track).
5. **No other changes to /evolve flow** — three-track classification, proposal format, etc. all unchanged.

---

## Component: Self-Diagnostic /vitals

Implements `prd.md > Epic 3 — Self-Diagnostic /vitals`.

### Subcomponent: skills/vitals/SKILL.md (NEW)

Slash command `/vibe-cartographer:vitals`. Read-only by default; explicit per-fix opt-in for auto-fix actions.

**Eight checks:**

| # | Check | Reads | Auto-fix |
|---|-------|-------|----------|
| 1 | Every SKILL file referenced by another SKILL exists | All `skills/**/SKILL.md` files | No — manual + suggest /evolve |
| 2 | Every template file referenced by a SKILL exists | All SKILL files + `skills/guide/templates/` | No — manual + suggest /evolve |
| 3 | Unified profile parses against schema; no unknown fields | profile + `builder-profile.schema.json` | (a) namespace migration, (c) fresh-stamp |
| 4 | Every anchored Pattern #13 complement is in agent's available skills list | `guide/SKILL.md` table + agent runtime | (d) remove defunct complement |
| 5 | Friction log volume sanity (last 10 sessions, skipped first 3) | `sessions/*.jsonl`, `friction.jsonl` | No — informational |
| 6 | Friction-trigger consistency: every friction-logger.log() invocation in command SKILLs maps to a friction-triggers.md entry, and vice versa | All command SKILLs + `friction-triggers.md` | No — manual + suggest /evolve |
| 7 | No leftover `.tmp` files in `~/.claude/profiles/` or `~/.claude/plugins/data/vibe-cartographer/` | Two directory listings | (e) delete .tmp debris |
| 8 | friction.jsonl line integrity — every line parses as valid JSON matching schema | `friction.jsonl` | (f) repair (rewrite dropping malformed lines, backup to .bak) |

**Six auto-fix actions:**

- (a) Migrate `plugins.app-project-readiness` → `plugins.vibe-cartographer`
- (b) Emit `command_abandoned` friction entries for past-24h orphans
- (c) Fresh-stamp `_meta` blocks after 1.4.x → 1.5.0 upgrade
- (d) Remove defunct complement from anchored table
- (e) Delete leftover `.tmp` files
- (f) Repair malformed `friction.jsonl` (with `.bak` backup)

Each fix prompts `[y/n]` per fix.

**Runtime cost control:**
- Default scans last 30 days of sessions for check #5.
- `--full` flag for complete history scan with runtime warning ("This may take longer for users with extensive session history").

**Runtime context fail-soft:** check #4 outputs *"Could not verify N complements due to incomplete runtime context. Re-run /vitals after restarting Claude Code."* if agent context is incomplete. Auto-fix (d) doesn't fire when context is incomplete.

**Output style:** Vibe Doc CLI banner aesthetic. Boxed sections per check. Color-coded status (✓ / ⚠ / ✗). Table for findings. Light banner header with version + timestamp. Summary line at the end.

### Subcomponent: commands/vitals.md (NEW)

```markdown
---
description: Run a structural integrity check on Vibe Cartographer's installation. Reports findings, offers single-shot deterministic fixes with per-fix confirmation.
argument-hint: "[--full]"
---

Run the `vitals` skill (`skills/vitals/SKILL.md`).

Checks: SKILL references, templates, unified profile schema, Pattern #13 complement availability, friction log volume, friction-trigger consistency, leftover .tmp debris, friction.jsonl line integrity.

Default scans last 30 days of session logs. Pass `--full` for complete history (slower).
```

---

## Component: Language Reframe

Implements `prd.md > Epic 5 — Spec-Driven Development → Vibe Direction Reframe`.

No new components. Find/replace pass during /build with manual judgment per match.

**Mechanical:**
- Audit list compiled at /checklist time via `grep -rn "spec-driven" plugins/ docs/ *.md`
- /build walks the audit list, replaces matches that describe Cart's positioning, skips matches in historical credit / industry-concept references
- /reflect SKILL phrase "the full spec-driven development cycle" → "the full cycle"
- npm `keywords` field retains `"spec-driven"` for SEO continuity

---

## Data Model

### Unified Profile (`~/.claude/profiles/builder.json`)

Schema lives in `skills/guide/schemas/builder-profile.schema.json`. Shape:

```jsonc
{
  "schema_version": 1,
  "last_updated": "2026-04-17",
  "decay_disabled": false,                    // NEW — opt-out flag (Story 1.3 expansion)
  "shared": {
    "name": "...",
    "identity": "...",
    "technical_experience": { "level": "...", "languages": [...], ... },
    "preferences": { "persona": "...", "tone": "...", ... },
    "creative_sensibility": "...",
    "_meta": {                                // NEW — nested per Q2 resolution
      "preferences.persona": {
        "last_confirmed": "2026-04-17",
        "stale": false,
        "ttl_days": 180
      }
      // ... one entry per decay-eligible field
    }
  },
  "plugins": {
    "vibe-cartographer": {
      "mode": "...",
      "deepening_round_habits": "...",
      // ... existing plugin-scoped fields
      "_meta": {                              // NEW — nested
        "last_seen_complements": {
          "list": ["superpowers:brainstorming", ...],
          "timestamp": "2026-04-17T01:20:00-05:00",
          "previous_diff_count": 0,
          "notable_change_at": null
        }
      }
    }
  }
}
```

### Friction Log (`~/.claude/plugins/data/vibe-cartographer/friction.jsonl`)

Schema lives in `skills/guide/schemas/friction.schema.json`. Per-line shape:

```json
{
  "schema_version": 1,
  "timestamp": "2026-04-17T01:20:00-05:00",
  "plugin_version": "1.5.0",
  "command": "scope",
  "project_dir": "app-readinessplugin",
  "project_id": "6vJ7tx2eeW5eZxN9NKrB",
  "sessionUUID": "550e8400-e29b-41d4-a716-446655440000",
  "friction_type": "default_overridden",
  "symptom": "User chose 'skip cuts' when default was 'walk through cuts'",
  "agent_guess_at_cause": "Builder is a returning user with strong preferences",
  "complement_involved": null,
  "confidence": "medium"
}
```

**Friction types:** `command_abandoned`, `default_overridden`, `complement_rejected`, `repeat_question`, `artifact_rewritten`, `sequence_revised`, `rephrase_requested`.

**Confidence:** `high`, `medium`, `low`.

### Friction Calibration (`~/.claude/plugins/data/vibe-cartographer/friction.calibration.jsonl`)

```json
{
  "schema_version": 1,
  "timestamp": "2026-04-17T01:20:00-05:00",
  "plugin_version": "1.5.0",
  "friction_entry_ref": {
    "timestamp": "2026-04-16T22:23:00-05:00",
    "friction_type": "repeat_question",
    "sessionUUID": "550e8400-e29b-41d4-a716-446655440000"
  },
  "calibration": "false_positive",
  "builder_note": "I was asking about something else entirely"
}
```

**Calibration values:** `false_positive`, `false_negative`.

### Session Log (`~/.claude/plugins/data/vibe-cartographer/sessions/<date>.jsonl`)

**Two entry types:**

**Sentinel entry (NEW):**
```json
{
  "schema_version": 1,
  "timestamp": "2026-04-17T01:20:00-05:00",
  "plugin": "vibe-cartographer",
  "plugin_version": "1.5.0",
  "command": "scope",
  "project_id": "6vJ7tx2eeW5eZxN9NKrB",
  "project_dir": "app-readinessplugin",
  "mode": "builder",
  "persona": "superdev",
  "sessionUUID": "550e8400-e29b-41d4-a716-446655440000",
  "outcome": "in_progress"
}
```

**Terminal entry (existing schema + sessionUUID):**
```json
{
  "schema_version": 1,
  "timestamp": "2026-04-17T01:50:00-05:00",
  "plugin": "vibe-cartographer",
  "plugin_version": "1.5.0",
  "command": "scope",
  "project_id": "6vJ7tx2eeW5eZxN9NKrB",
  "project_dir": "app-readinessplugin",
  "mode": "builder",
  "persona": "superdev",
  "sessionUUID": "550e8400-e29b-41d4-a716-446655440000",
  "outcome": "completed",
  "user_pushback": false,
  "friction_notes": [...],
  "key_decisions": [...],
  "artifact_generated": "docs/scope.md",
  "complements_invoked": [...]
}
```

---

## File Structure

```text
app-readinessplugin/
├── docs/
│   ├── self-evolving-plugins-framework.md   # Updated: manual reframe pass during /build
│   ├── builder-profile.md                    # Existing
│   ├── scope.md                              # Existing
│   ├── prd.md                                # Existing
│   ├── spec.md                               # Existing (this file)
│   ├── checklist.md                          # /checklist will generate
│   └── reflection.md                         # /reflect will generate
├── scripts/
│   ├── atomic-write-json.js                  # NEW — Node, no deps
│   ├── atomic-append-jsonl.js                # NEW — Node, no deps
│   ├── build-plugin.py                       # Existing
│   ├── postinstall.js                        # Existing
│   └── stats.py                              # Existing
├── plugins/vibe-cartographer/
│   ├── .claude-plugin/plugin.json            # Updated: version 1.5.0
│   ├── CLAUDE.md                             # Updated: reframe + new SKILLs reference
│   ├── architecture/                         # Unchanged
│   ├── commands/
│   │   ├── onboard.md                        # Existing
│   │   ├── scope.md                          # Existing
│   │   ├── prd.md                            # Existing
│   │   ├── spec.md                           # Existing
│   │   ├── checklist.md                      # Existing
│   │   ├── build.md                          # Existing
│   │   ├── iterate.md                        # Existing
│   │   ├── reflect.md                        # Existing
│   │   ├── evolve.md                         # Existing
│   │   ├── vitals.md                         # NEW
│   │   └── friction.md                       # NEW
│   └── skills/
│       ├── onboard/SKILL.md                  # Updated: decay invocation, _meta migration, folder-create offer
│       ├── scope/SKILL.md                    # Updated: friction trigger calls + reframe
│       ├── prd/SKILL.md                      # Updated: friction trigger calls + reframe
│       ├── spec/SKILL.md                     # Updated: friction trigger calls + reframe
│       ├── checklist/SKILL.md                # Updated: friction trigger calls + reframe
│       ├── build/SKILL.md                    # Updated: friction trigger calls + reframe
│       ├── iterate/SKILL.md                  # Updated: friction trigger calls + reframe
│       ├── reflect/SKILL.md                  # Updated: calibration question + reframe
│       ├── evolve/SKILL.md                   # Updated: read friction.jsonl, weight by confidence/calibration
│       ├── session-logger/SKILL.md           # Updated: sentinel pattern, _meta.last_seen_complements
│       ├── decay/SKILL.md                    # NEW — internal SKILL
│       ├── friction-logger/SKILL.md          # NEW — internal SKILL
│       ├── vitals/SKILL.md                   # NEW — /vibe-cartographer:vitals
│       ├── friction-log/SKILL.md             # NEW — /vibe-cartographer:friction
│       └── guide/
│           ├── SKILL.md                      # Updated: Pattern #4/#6/#8 sections + integration callouts to #13
│           ├── references/
│           │   ├── eval-rubric.md            # Existing
│           │   ├── prd-guide.md              # Existing
│           │   ├── spec-patterns.md          # Existing
│           │   ├── data-contracts.md         # NEW
│           │   └── friction-triggers.md      # NEW
│           ├── schemas/                      # NEW directory
│           │   ├── builder-profile.schema.json
│           │   ├── friction.schema.json
│           │   ├── friction-calibration.schema.json
│           │   └── session-log.schema.json
│           └── templates/                    # Existing — no changes
├── README.md                                 # Updated: reframe
├── INSTALL.md                                # Updated: reframe + /vitals + /friction mentions
├── CHANGELOG.md                              # 1.5.0 entry
└── package.json                              # Version → 1.5.0
```

---

## Key Technical Decisions

| # | Decision | Why | Tradeoff Accepted |
|---|----------|-----|-------------------|
| 1 | Nested `_meta` blocks per namespace | Pattern #11 namespace isolation invariant. Vibe Doc/Sec/Test will adopt Pattern #4 later — top-level `_meta` would create cross-plugin write coordination problems. | More code-traversal complexity in `/vitals` check #3. Acceptable. |
| 2 | Node single-file scripts (not Bash) for atomic-write/append | Better JSON parse error handling, Windows compatibility (where ~80% of vibe coders work), aligns with future `@626labs/plugin-core` TS interface for Phase 2 extraction. | New script invocation pattern from SKILL files. Familiar to plugin author. |
| 3 | sessionUUID in sentinel + terminal entries | Concurrent commands in different projects within the same minute could timestamp-collide. UUID makes match correctness absolute. | Tiny schema addition. Negligible. |
| 4 | `/vitals` standalone command, not `/evolve` sub-command | Different mental model — `/vitals` checks current state, `/evolve` proposes future changes. Different invocation cadence. | One more command in the user's mental map. Counters with clear naming. |
| 5 | 30-day default scan window for `/vitals` check #5 | Long-horizon analysis is `/evolve`'s job; `/vitals` answers "is detection working right now?" | `--full` flag available for users who want complete-history scan, with runtime warning. |
| 6 | Defensive default for friction logging — when in doubt, don't log | Better to miss real friction than poison `/evolve` with noise. Self-calibration loop in `/reflect` recovers missed friction. | Initial signal volume may be low. Acceptable; calibration data improves over time. |

---

## Dependencies & External Services

**No new external dependencies.** All implementation uses Node stdlib (`fs`, `crypto.randomUUID`) and existing plugin infrastructure.

**Existing dependencies unchanged:**
- npm distribution (no new published packages)
- GitHub marketplace (no new repos)
- Claude Code CLI / Cowork (no new platform integrations)

**Documentation references for `/build`:**
- [JSON Schema Draft-07 spec](https://json-schema.org/draft-07/) — for writing the four schema files
- [Node `fs.appendFileSync`](https://nodejs.org/api/fs.html#fsappendfilesyncpath-data-options) — atomic-append behavior
- [Node `crypto.randomUUID`](https://nodejs.org/api/crypto.html#cryptorandomuuidoptions) — for sessionUUID generation
- [Anthropic Claude Code plugin docs](https://code.claude.com/docs/en/plugins) — for any new SKILL/command file conventions

---

## Open Issues

To resolve during `/checklist`:

- **Audit list specifics for the Epic 5 reframe pass.** The `grep -rn "spec-driven" plugins/ docs/ *.md` will return some matches in framework historical content — `/checklist` should split this into one item for SKILLs (mechanical replace) and one item for the framework doc (manual judgment per match).
- **Order dependency between Foundation Layer and Friction Layer.** Decay can be built and shipped without friction-logger existing, but friction-logger needs atomic-append-jsonl.js. `/checklist` should sequence atomic-append before friction-logger, atomic-write before decay.

To resolve during `/build`:

- **JSON Schema validation library choice.** `/vitals` check #3 needs to validate JSON against schemas. Two options: (a) write a minimal schema validator in pure JS for the subset of Draft-07 features we use; (b) accept one runtime dependency (`ajv` is the standard). Lean: (a) for zero-dep purity matching the rest of the script layer, but if it gets hairy, (b) is acceptable because `ajv` is small and well-maintained.
- **Test fixture strategy.** No formal test framework in Cart 1.4.x. Do we add one for L3.5 (Vitest is established in the broader ecosystem) or rely on /vitals as the smoke check + manual verification during /build? Lean: skip formal tests for L3.5, rely on /vitals + manual verification. Add tests in a future cycle if patterns emerge.

To resolve post-1.5.0:

- **Real-world friction-detection thresholds.** The 50% line-diff for `artifact_rewritten` and 5/session noise threshold for `/vitals` check #5 are educated guesses. /reflect calibration loop will surface tuning needs.
- **Calibration entry decay TTL.** Picked 180 days as default. Adjust based on observed builder-habit drift.
- **Windows O_APPEND atomicity.** If concurrent-write corruption is observed, post-1.5.0 patch adds lockfile fallback.
