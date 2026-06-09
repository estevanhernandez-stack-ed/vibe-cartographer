---
description: "Backfill the session log from a project's process-notes.md. Reconstructs sentinel + terminal entries for command runs that happened in orchestrator context (no session-logger). Opt-in, idempotent, never edits process-notes.md."
argument-hint: "[--project <path>] [--dry-run]"
---

Use the **reconnect** skill (`skills/reconnect/SKILL.md`) to backfill `~/.claude/plugins/data/vibe-cartographer/sessions/` from a project's `process-notes.md`.

It parses every `## /<command>` heading into a sentinel + terminal session-log pair (deterministic UUID per run, so re-running is idempotent), shows a diff preview of what it would append, and writes only after you confirm. It never edits `process-notes.md`. This recovers runs that happened in orchestrator context — multi-command-in-one-chat or sub-agent invocations — so `/evolve-cart` and `/vitals` can see them.

- `--project <path>` — project root to read (default: current directory).
- `--dry-run` — show the preview and stop; never writes.

Read-only against your notes. The session log is the only write target, and only after a `[y/n]` confirmation.
