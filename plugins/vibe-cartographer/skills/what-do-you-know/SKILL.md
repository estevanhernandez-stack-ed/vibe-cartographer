---
name: what-do-you-know
description: "This skill should be used when the user says \"/what-do-you-know\" or \"/vibe-cartographer:what-do-you-know\" or asks what Vibe Cartographer has stored about them, what it remembers, or where its data lives. Read-only: summarizes the unified builder profile, session logs, friction log, calibration log, and community signals in plain language and lists the path of every file. Writes and deletes nothing. Transparency is the price of memory."
---

# /what-do-you-know — Transparency Report

Slash command `/vibe-cartographer:what-do-you-know`. Shows the builder everything Vibe Cartographer has stored about them, in plain language, and where each file lives. This is the framework's answer to surveillance feel: a plugin that remembers owes you a way to see what it remembers.

**Read-only.** This command writes nothing, edits nothing, and deletes nothing. It has no delete mode. Deletion is manual: the report names each path, and removing a file is the builder's call, done by hand.

## Before You Start

- **Data contracts:** [`../guide/references/data-contracts.md`](../guide/references/data-contracts.md) — the file list and per-file shapes. This SKILL reads every file named there and no others.
- **Schemas:** [`../guide/schemas/`](../guide/schemas/) — `builder-profile`, `session-log`, `friction`, `friction-calibration`. Read-only references for field names.
- **Friction triggers contract:** [`../guide/references/friction-triggers.md`](../guide/references/friction-triggers.md) — the `/what-do-you-know` section is intentionally empty. This command does **not** call `friction-logger.log()`.
- **Output-style reference:** [`../friction-log/SKILL.md`](../friction-log/SKILL.md) and [`../vitals/SKILL.md`](../vitals/SKILL.md) — banner header and boxed sections. This report matches that look.
- **Session logger interface:** [`../session-logger/SKILL.md`](../session-logger/SKILL.md) — `start("what-do-you-know", <project_dir>)` at invocation, terminal append at the end, like every other command.

## Session Logging

At command start, call `session-logger.start("what-do-you-know", <project_dir>)` and hold the sessionUUID.

At command end, call the session-logger terminal-append procedure with:

- `outcome: "completed"` on a clean run, including cold start (nothing stored anywhere).
- `outcome: "partial"` if a file existed but could not be read (permission denied, I/O error) and its section shows the error.
- `outcome: "error"` only if the command crashed before the report rendered.
- `artifact_generated: null`, `complements_invoked: []`, `friction_notes: []`.
- `key_decisions: []` unless something notable surfaced, such as skipped malformed lines.

This is the one write the command makes, and it is the session-logging contract every command follows, through `session-logger` and its atomic-append script. The command never writes any file directly.

## Friction Logging

Reference: [`../guide/references/friction-triggers.md`](../guide/references/friction-triggers.md) — section `/what-do-you-know` is intentionally empty. Looking at your own data and doing nothing about it is the expected mode of interaction, not friction. Universal triggers (`repeat_question`, `rephrase_requested`) apply only with a quoted prior turn in `symptom`; without one, do not log.

## Persona Adaptation

Read `shared.preferences.persona` from the unified profile. Keep the opening to one sentence; the report body is neutral.

- **Professor:** "Here is everything stored about you, file by file, and what each part is for."
- **Cohort:** "Let's look at what Cart has on file."
- **Superdev:** "Dumping what's stored."
- **Architect:** "Full inventory of stored state: profile, logs, and where each lives."
- **Coach:** "Here's everything on file. Nothing hidden."
- **System default / no profile:** "Here is what Vibe Cartographer has stored."

## Arguments

- `--last <n>` — how many recent session entries to list. Positive integer, default 10. Non-numeric or non-positive: print `unknown value for --last, using 10` and continue.

Unknown flags: one-line warning and continue.

## Runtime Paths

Every path this command reads, and never writes. The same paths are printed in the report.

| What | Where |
|------|-------|
| Unified profile | `~/.claude/profiles/builder.json` |
| Plugin data directory | `~/.claude/plugins/data/vibe-cartographer/` |
| Session logs | `~/.claude/plugins/data/vibe-cartographer/sessions/<date>.jsonl` (one file per UTC date) |
| Friction log | `~/.claude/plugins/data/vibe-cartographer/friction.jsonl` |
| Friction calibration | `~/.claude/plugins/data/vibe-cartographer/friction.calibration.jsonl` |
| Community signals | `~/.claude/plugins/data/vibe-cartographer/community-signals.jsonl` (written only if the builder opted in through `/evolve-cart`; local to this machine, never transmitted) |
| Plugin manifest | `plugins/vibe-cartographer/.claude-plugin/plugin.json` (version in the banner) |

The profile path is resolved the way the guide and session-logger resolve it: `~/.claude/profiles/builder.json`. When the session runs with `CLAUDE_CONFIG_DIR` set, that folder stands in for `~/.claude` for the profile only. Plugin data stays at `~/.claude/plugins/data/vibe-cartographer/` either way, because that is where the session and friction loggers write. The report prints the resolved absolute path actually used for each file.

Project-local artifacts are separate from the above and live in the builder's own project, not in plugin data: `docs/` (scope, PRD, spec, checklist, reflection), `process-notes.md`, and `docs/cart-runs/` for `/take` runs. Mention in one line that these exist in each project and are the builder's own files. Do not scan the filesystem for them.

## Flow

### 1. Open

Write the persona-adapted opening line.

### 2. Read, in order

Read each source once. A missing file or directory is **"nothing stored"**, never an error. A file that exists but cannot be read gets one line, `could not read <path>: <error>`, and the report continues.

**Profile.** Parse `builder.json`.
- Missing: `Profile: nothing stored`.
- Present: summarize `shared.*` in plain language (name, role, experience, preferences such as persona, anything else set), then `plugins.vibe-cartographer.*` (mode, autonomy level, counters, `_meta`, skip lists, other fields present). Name fields in plain words, show values the builder entered, and say plainly which fields are empty. Show other plugins' namespaces only as a list of names, with a note that those blocks belong to those plugins. Do not dump raw JSON. Do not print values from other plugins' blocks.

**Session logs.** Read `sessions/*.jsonl`.
- No directory or no files: `Session logs: nothing stored`.
- Otherwise report: number of files, date range (earliest to latest timestamp), total entries, count by command (a sentinel plus its terminal entry is one run; count terminal entries, and count unpaired sentinels as `in progress or abandoned`), count by outcome, and the last `--last` runs, newest first, one line each: `<timestamp> · <command> · <project basename> · <outcome>`. Skip malformed lines silently and note the count.
- Say what a session entry holds: command, project folder, outcome, decisions and friction notes recorded for that run. It does not hold the conversation.

**Friction log.** Read `friction.jsonl`.
- Missing or empty: `Friction log: nothing stored`.
- Otherwise: entry count, date range, count by `friction_type`, count by confidence, and the three most recent symptoms in one line each. Point to `/friction` for the full filtered view.

**Friction calibration.** Read `friction.calibration.jsonl`.
- Missing or empty: `Calibration log: nothing stored`.
- Otherwise: entry count, split between `false_positive` and `false_negative`, date range.

**Community signals.** Read `community-signals.jsonl`.
- Missing or empty: `Community signals: nothing stored`.
- Otherwise: entry count and the note that these were written on opt-in and never transmitted.

### 3. Render

Banner header with the plugin version and local timestamp, then one boxed section per source (profile, sessions, friction, calibration, community signals), then a **Where it all lives** section listing the resolved absolute path of every file above with a status of `present` or `nothing stored`, then the closing note.

```
===============================================
 Vibe Cartographer: what I know about you
 v<version> · <local datetime>
===============================================

  Profile
  ...
  Session logs
  ...
  Friction log
  ...
  Calibration log
  ...
  Community signals
  ...
  Where it all lives
  <absolute path>   present | nothing stored
  ...
```

No emoji. Plain status words, not glyphs. Keep each section short; the report is a summary, not a dump.

### 4. Close

Print the closing note verbatim:

```
Everything above is stored locally on this machine. Nothing is sent anywhere.
This command only reads. To delete anything, remove the file at its path by hand.
Deleting the profile or logs is safe; Cart rebuilds them as you work.
```

Then do the session-logger terminal append. No handoff: this command sits outside the command chain.

## Cold start

With no profile and no plugin data directory, every section prints `nothing stored`, the path list marks each file `nothing stored`, and the outcome is `completed`. The session-logger start call for this very run may create the sessions directory and one log file. The report leaves this run's own sentinel out of every count and list.
