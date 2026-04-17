---
name: session-logger
description: "Append-only session log schema and append instructions for Vibe Cartographer. Referenced by the guide SKILL at the end of every command. Part of Level 2 (session memory) of the Self-Evolving Plugin Framework."
---

# session-logger — Append-Only Session Log

This skill defines how every command in Vibe Cartographer logs a one-line session entry at completion. The log is the raw feedback signal that future reflective-evolution steps will read to propose plugin improvements.

## Where the Log Lives

`~/.claude/plugins/data/vibe-cartographer/sessions/<YYYY-MM-DD>.jsonl`

- One file per day.
- Append-only. Never rewrite existing lines.
- `mkdir -p` the directory on first use.
- Cross-project: a single user's logs from all their projects land here.

**Legacy logs** from v0.5.0 and earlier live at `~/.claude/plugins/data/app-project-readiness/sessions/`. These are preserved untouched — append-only history is never migrated, it just stays where it was written. Future recall commands will read both locations.

## Log Entry Schema

Each entry is a single JSON line with this shape:

```json
{
  "schema_version": 1,
  "timestamp": "2026-04-15T10:29:00-05:00",
  "plugin": "vibe-cartographer",
  "plugin_version": "1.0.0",
  "command": "onboard",
  "project_id": "6vJ7tx2eeW5eZxN9NKrB",
  "project_dir": "my-new-app",
  "mode": "builder",
  "persona": "superdev",
  "outcome": "completed",
  "user_pushback": false,
  "friction_notes": [],
  "key_decisions": ["builder chose Builder mode", "provided architecture docs at ./architecture/"],
  "artifact_generated": "docs/builder-profile.md",
  "complements_invoked": ["superpowers:brainstorming"]
}
```

### Field definitions

- **schema_version** — always `1` for now. Bump when the schema changes. Version skew checks depend on this field.
- **timestamp** — ISO 8601 with timezone. Use the system local time.
- **plugin** — always `"vibe-cartographer"`. Makes the log self-describing if multiple 626Labs plugins ever write here.
- **plugin_version** — read from `plugins/vibe-cartographer/.claude-plugin/plugin.json`. If you can't determine it, use `"unknown"`.
- **command** — which of the 8 commands just finished: `onboard`, `scope`, `prd`, `spec`, `checklist`, `build`, `iterate`, `reflect`.
- **project_id** — the 626Labs dashboard project ID if the session is bound. Otherwise `null`. (Bind via `mcp__626Labs__manage_projects findByRepo` at session start when possible.)
- **project_dir** — basename of the current working directory. Not the full path — just the folder name.
- **mode** — `learner` or `builder` from the builder profile. `null` if not yet set (e.g., mid-onboard).
- **persona** — `professor` | `cohort` | `superdev` | `architect` | `coach` | `null` (system default). From `shared.preferences.persona` on the unified profile.
- **outcome** — one of:
  - `completed` — command ran to its natural end and produced its expected artifact
  - `abandoned` — user exited before completion (ctrl-c, switched commands, walked away)
  - `error` — command hit a blocking error it couldn't recover from
  - `partial` — completed but skipped optional sections or couldn't generate all expected output
- **user_pushback** — boolean. `true` if the user rejected, heavily edited, or overrode a suggestion the agent made during this command. Be conservative — minor tweaks don't count. Full rewrites do.
- **friction_notes** — array of short strings. Only include clear friction signals:
  - `"onboarding_abandoned"` — user cancelled during onboard
  - `"artifact_rewritten"` — user rewrote >50% of a generated doc
  - `"repeat_question"` — user asked something the agent should have inferred or remembered
  - `"stack_mismatch"` — plugin suggested something incompatible with the project's actual stack
  - `"mode_mismatch"` — selected mode (learner/builder) felt wrong for the session
  - `"persona_mismatch"` — selected persona voice felt wrong for the session
  - Or any other clear friction the agent observed. Keep each note under 5 words. Empty array is fine.
- **key_decisions** — array of short strings. High-signal decisions only. Things a future evolution step might want to see patterns in. Examples:
  - `"chose Builder mode"`
  - `"skipped deepening rounds in /prd"`
  - `"provided architecture docs at ./architecture/"`
  - `"cut feature X from scope"`
- **artifact_generated** — relative path to the doc this command produced, or `null` if no artifact. E.g., `"docs/scope.md"`, `"docs/prd.md"`, `"docs/reflection.md"`.
- **complements_invoked** — array of complement plugin/MCP/skill names that the command actually deferred to during this run. Format: `"<source>:<name>"` (e.g., `"superpowers:brainstorming"`, `"mcp:claude_ai_Figma"`). Only include complements that were *actually used* — not just present in the environment. Empty array if none were invoked. Used by `/evolve` to surface which complements get accepted vs ignored, informing Pattern #13 (Ecosystem-Aware Composition) over time.

## How to Append

At the end of every command (after embedded feedback, before the handoff to the next command), the agent should:

1. Construct the entry as described above, filling in every field. Use `null` for anything you genuinely can't determine — never fabricate.
2. Ensure the directory exists: `mkdir -p ~/.claude/plugins/data/vibe-cartographer/sessions/`.
3. Determine today's date in the local timezone (YYYY-MM-DD format).
4. Append a single line to `~/.claude/plugins/data/vibe-cartographer/sessions/<today>.jsonl`. Use `>>` redirection or an equivalent append operation — never overwrite.
5. If the append fails for any reason, do not block the handoff. Log a warning in `process-notes.md` under the current command section and move on. The session log is instrumentation, not critical path.

## What NOT to Log

- **No PII beyond the project_dir basename.** Don't log the full working directory path. Don't log the user's name (that's in the profile). Don't log file contents.
- **No secrets.** Ever.
- **No command arguments or conversational content.** The log is structured feedback signal, not a transcript.
- **Nothing sensitive from the builder profile.** The profile has its own place. Don't duplicate its contents into the session log.

## Size and Rotation

- One file per day keeps rotation natural.
- If a single day's file grows past ~1 MB (roughly 5,000 entries), something is wrong — investigate rather than rotate.
- Old files can be archived or deleted by the user at any time. The plugin never auto-deletes.

## Privacy Posture

- Local-first. The log lives in the user's home directory and never leaves their machine unless they explicitly share it.
- User-inspectable. A future `/what-do-you-know` command will dump the log contents in human-readable form.
- User-deletable. The user can `rm` the sessions directory at any time and the plugin continues working — it just loses the memory and treats subsequent runs like a fresh install for evolution purposes.

## Why This Exists

This log is raw material for **Level 3** of the Self-Evolving Plugin Framework. When the `/vibe-cartographer-evolve` command ships later, it will read these entries and propose plugin improvements based on observed patterns (e.g., "you've skipped deepening rounds in 4/5 PRDs — want to make them off by default?"). Until then, the log is passive — collecting training data for the plugin's future self.

See `docs/self-evolving-plugins-framework.md` for the full framework context.
