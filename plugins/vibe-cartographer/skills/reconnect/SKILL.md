---
name: reconnect
description: "This skill should be used when the user says \"/reconnect\" or \"/vibe-cartographer:reconnect\" or wants to backfill session-log entries from a project's process-notes.md. Parses `## /<command>` headings into synthetic sentinel + terminal session-log pairs so orchestrator-context runs (multi-command-in-one-chat, sub-agent invocations) become visible to /evolve-cart and /vitals. Opt-in, idempotent, and never edits process-notes.md. Implements the backfill recipe specified in session-logger/SKILL.md."
---

# /reconnect — Backfill Session Log from Process Notes

Read `skills/guide/SKILL.md` for your overall behavior, then follow this command.

Slash command `/vibe-cartographer:reconnect`. Orchestrator-context runs — one chat driving several Cart commands, or an agent invoking Cart's SKILLs from outside Cart's own runtime — can't call `session-logger.start()` / `end()` in-process. Those runs produce a rich `process-notes.md` but **no** session-log entries, which leaves `/evolve-cart` and `/vitals` blind to arguably the richest use of the plugin. `/reconnect` closes that gap: it reads a project's `process-notes.md`, reconstructs one sentinel + one terminal entry per recorded command, and appends them to the session log — **opt-in, idempotent, and read-only against `process-notes.md`** (it never edits the notes).

This is the shipped implementation of the backfill recipe that `session-logger/SKILL.md > Reconnect procedure` specifies. The recipe there is the contract; this SKILL executes it.

## Before You Start

- **Data contract:** [`../guide/references/data-contracts.md`](../guide/references/data-contracts.md) — read the "Session log" section. The sentinel vs terminal shapes, required fields, and the `(command, project_dir, sessionUUID)` pairing contract live there. Backfilled entries are ordinary session-log entries — same schema, same file, same orphan-pairing rules.
- **Session log schema:** [`../guide/schemas/session-log.schema.json`](../guide/schemas/session-log.schema.json) — every synthetic entry validates against this before it is written. Sentinel = `outcome: "in_progress"`; terminal = `outcome` in `completed | abandoned | error | partial`.
- **Reconnect recipe (source of truth):** [`../session-logger/SKILL.md`](../session-logger/SKILL.md) — the "Reconnect procedure" section. The parse rules, deterministic-UUID derivation, and conflict behavior below mirror it exactly. If you change one, change both, or `/vitals` check #1 will surface the cross-reference and the two will drift.
- **Atomic protocol:** every write goes through `node ${CLAUDE_PLUGIN_ROOT}/scripts/atomic-append-jsonl.js <session-file>` (stdin = one JSON object), exactly like `session-logger`. `${CLAUDE_PLUGIN_ROOT}` is the plugin install root; the helper ships inside the plugin at `scripts/`. The script `mkdir -p`s the data dir on first use. If the script path can't be resolved, take the same write-anyway fallback `session-logger` uses (auto-create the dir, then append the line directly) — never silently drop a backfilled entry.
- **Friction triggers contract:** [`../guide/references/friction-triggers.md`](../guide/references/friction-triggers.md) — the `/reconnect` section is intentionally empty. `/reconnect` does **not** call `friction-logger.log()`. It is a maintenance/backfill command, not an interview; declines on the diff-preview confirmation are the expected mode of interaction, not friction. `/vitals` check #6 treats `/reconnect` as a documented-empty command alongside `/vitals` and `/friction`.

## Session Logging

`/reconnect` bookends **its own run** with a sentinel + terminal pair, like every other command — call `session-logger.start("reconnect", <project_dir>)` at command start (random UUID v4, per the normal `start()` contract) and the terminal-append procedure at command end. This is separate from, and must not collide with, the synthetic backfill entries it writes (those use deterministic UUIDs derived from the notes; see the recipe).

At command end, set:

- `outcome: "completed"` on a clean run (including the zero-headings and all-already-backfilled cases — both are normal outcomes).
- `outcome: "partial"` if the builder confirmed but only some entries wrote (e.g., an append failed partway and was surfaced).
- `outcome: "abandoned"` if the builder declined the diff preview before anything was written.
- `artifact_generated: null` — `/reconnect` writes session-log lines, not a doc.
- `complements_invoked: []` — `/reconnect` defers to no Pattern #13 complement.
- `friction_notes: []` — see "Friction Logging".
- `key_decisions`: short strings worth seeing later without re-running (e.g., `"backfilled 13 entries from ROROROblox process-notes"`, `"all 13 headings already present — no-op"`).

## Friction Logging

Reference: [`../guide/references/friction-triggers.md`](../guide/references/friction-triggers.md) — section `/reconnect` is intentionally empty. `/reconnect` does **not** call `friction-logger.log()`. Backfilling history and declining to apply it are the expected modes of interaction, not friction signal — logging them would flood `/evolve-cart` with noise.

Universal triggers (`repeat_question`, `rephrase_requested`) from the top of `friction-triggers.md` still apply in principle — if the user asks the agent to re-explain the diff preview with a quoted prior, the universal rule applies. Honor the **defensive default**: without a quoted prior turn in `symptom`, do not log.

`/vitals` check #6 explicitly audits that this SKILL declares no `friction_type` in the Friction Logging section, consistent with the documented empty `/reconnect` table.

## Persona Adaptation

`/reconnect` is a maintenance command, not a conversation. Persona applies only to the one-line opening and the framing around the diff preview. Read `shared.preferences.persona` from `~/.claude/profiles/builder.json`. Keep the opening to one sentence:

- **Professor:** "I'll reconstruct your session log from `process-notes.md` — here's what I'd backfill and why."
- **Cohort:** "Let's recover the runs that never got logged. Here's what I found in your notes."
- **Superdev:** "Backfilling session log from process-notes."
- **Architect:** "Reconnect — turning narrative process-notes into structured session-log entries `/evolve-cart` can read."
- **Coach:** "Let's get those lost runs back on the record. Here's the plan."
- **System default:** "Reconnecting session log from process-notes."

## Arguments

- `--project <path>` — the project root whose `process-notes.md` to read. Defaults to the current working directory. The basename becomes each entry's `project_dir`.
- `--dry-run` — show the diff preview and stop. Never write, never prompt for confirmation. Useful for inspecting what *would* be backfilled.

Unknown flags → print a one-line warning (`⚠ unknown flag: <flag> — ignoring`) and continue.

## Input

A project root directory containing `process-notes.md`. If `process-notes.md` is absent, say so plainly and stop — there is nothing to reconnect. Do not fabricate entries from anything other than `## /<command>` headings.

## Parse

Walk the **top-level headings of the form `## /<command>`** (e.g. `## /onboard`, `## /scope`, `## /build`). For each such heading, extract one entry's worth of fields:

- **`command`** — the heading's slash-command name (strip the leading `/`). Only the names Cart actually ships count as commands; ignore `## /` headings whose name isn't a known Cart command.
- **`timestamp`** — ISO 8601 parsed from the `**Date:**` bullet immediately under the heading. If a date is given without a clock time, default to **midday local time** (`T12:00:00` + local offset). If no date marker exists under the heading, fall back to the file's mtime date at midday.
- **`project_dir`** — basename of the project root (from `--project` or cwd).
- **`outcome`** — `"completed"` unless the heading body contains `abandoned`, `blocked`, or a `Deferred to` stanza that covers the whole output — then `"partial"` or `"abandoned"` per those signals.
- **`friction_notes`** — bullets collected under sub-headings matching `/(Friction|Pushback|Course corrections?)/i`.
- **`key_decisions`** — bullets collected under sub-headings matching `/(Load-bearing decisions?|What landed|Decisions)/i`.
- **`artifact_generated`** — if an `**Outcome:**` line names a doc path (`docs/scope.md`, etc.), use that path; otherwise `null`.
- **`sessionUUID`** — a **deterministic UUID derived from `sha1(project_dir + " " + command + " " + timestamp)`**: take the 40-hex SHA-1 digest and format its first 32 hex chars in 8-4-4-4-12 layout (UUIDv5 shape) so it satisfies the session-log schema's `sessionUUID` string while remaining reproducible. The determinism is what makes `/reconnect` idempotent — re-running against the same `process-notes.md` recomputes the same UUIDs and writes no duplicates.

## Output

For each parsed heading, build **one sentinel + one terminal entry** (same schema as native runs):

- **Sentinel:** `outcome: "in_progress"`, `timestamp` = the parsed `**Date:**`, plus `schema_version: 1`, `plugin: "vibe-cartographer"`, `plugin_version` (from `.claude-plugin/plugin.json`, else `"unknown"`), `command`, `project_dir`, `sessionUUID`. Carry `mode` / `persona` from the profile if available; omit if not.
- **Terminal:** the parsed `outcome`, `timestamp` = parsed `**Date:**` **+ 1 second** (so the pair round-trips through the standard orphan-pairing logic), the same `sessionUUID`, plus `friction_notes`, `key_decisions`, `artifact_generated`, and `user_pushback: false` (the notes rarely record this reliably; leave it false unless a Pushback section clearly indicates otherwise). `complements_invoked: []` unless the notes name complements explicitly.

Append both via `node ${CLAUDE_PLUGIN_ROOT}/scripts/atomic-append-jsonl.js ~/.claude/plugins/data/vibe-cartographer/sessions/<today>.jsonl`, where `<today>` is the current local `YYYY-MM-DD`. (Backfilled entries land in **today's** file — the file name is just the write date; the entry `timestamp` preserves the original run time.) Validate each entry against `session-log.schema.json` before appending; silent-drop a malformed synthetic entry (and note it in the run summary) rather than writing a bad line.

## Conflict behavior (idempotency)

Before writing any pair, read the last ~90 days of `~/.claude/plugins/data/vibe-cartographer/sessions/*.jsonl` and index every existing `sessionUUID`. **If a terminal entry with the computed `sessionUUID` already exists in any session file, skip that heading** — `/reconnect` has already backfilled it. Re-running is therefore safe and produces zero duplicates. Count skipped-as-existing headings for the summary.

## Opt-in + read-only

`/reconnect` **never edits `process-notes.md`** and never writes anything until the builder confirms. Show a diff preview of exactly what would be appended (see Flow), wait for a `[y/n]`, then write. `--dry-run` shows the preview and stops unconditionally.

## Flow

### 1. Open

Write the persona-adapted opening line. Resolve the project root (`--project` or cwd) and confirm `process-notes.md` exists. If absent: `No process-notes.md at <path> — nothing to reconnect.` and stop (terminal `outcome: "completed"`, `key_decisions: ["no process-notes to reconnect"]`).

### 2. Parse + dedupe

Parse all `## /<command>` headings per "Parse". Compute each entry's deterministic `sessionUUID`. Index existing session-log UUIDs (last ~90 days) and partition the parsed headings into **new** (UUID not present) and **already-backfilled** (UUID present → skip).

### 3. Diff preview

Render a banner-style preview (matching the `/vitals` aesthetic) listing the **new** pairs that would be appended — one line per heading: `<command>  <parsed-timestamp>  <outcome>  [<n> friction, <m> decisions]  → <artifact or "—">`. Below it, a one-line tally: `<N> new · <S> already present (skipped) · <T> total headings`. If `N == 0`, say `Everything in process-notes.md is already in the session log — nothing to backfill.` and go to step 5 with `outcome: "completed"`.

### 4. Confirm + write

If `--dry-run`: stop here (no prompt, no write).

Otherwise prompt once: `Backfill <N> session-log pairs from process-notes.md? [y/n]`. On `y`, append each new sentinel + terminal pair (sentinel first, then terminal) to today's session file, validating each against the schema. On `n` (or empty / anything other than `y`/`yes`): write nothing, terminal `outcome: "abandoned"`. Surface any append error per the atomic-protocol fallback and continue with the remaining pairs; tally what actually wrote.

### 5. Close + log

Print a one-line result: `Backfilled <written> entries (<pairs> command runs) into sessions/<today>.jsonl. <S> already present, skipped.` Then do the session-logger terminal append for `/reconnect`'s own run. No handoff — `/reconnect` is a standalone maintenance command.

## What NOT to do

- **Never edit `process-notes.md`.** It is read-only input. The session log is the only write target.
- **Never write without confirmation** (except the no-op path, which writes nothing anyway). `--dry-run` never writes.
- **Never mint a fresh random UUID for a backfilled entry.** The deterministic UUID is what guarantees idempotency. Random UUIDs would duplicate on every re-run.
- **Never invent runs.** Only `## /<command>` headings that map to real Cart commands become entries. Narrative prose without a command heading is not a run.
- **Never backfill into a past-dated file.** Synthetic entries go in today's session file; the original run time lives in the entry `timestamp`, not the filename.

## Why This SKILL Exists

The session log is the structured input to `/evolve-cart`. Orchestrator-context runs — the most powerful way to drive Cart — bypass `session-logger` entirely, so the richest sessions were invisible to the plugin's own reflection loop. The backfill recipe was specified in `session-logger/SKILL.md` for seven weeks before this command shipped; in that window the gap grew to its largest size ever (one project alone accumulated 13+ unlogged command runs). `/reconnect` turns the narrative record the builder already keeps (`process-notes.md`) back into the structured signal `/evolve-cart` and `/vitals` consume — without asking the builder to change how they work, and without ever touching the notes they wrote.
