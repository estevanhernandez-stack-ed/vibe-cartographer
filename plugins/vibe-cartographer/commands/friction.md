---
description: "Read-only inspection of Vibe Cartographer's friction log. Filters by project, friction type, confidence, and days; groups by friction type; renders a banner-style report."
argument-hint: "[--project <name>] [--type <friction_type>] [--confidence high|medium|low] [--days <n>]"
---

**Load the full instructions first:** read `${CLAUDE_PLUGIN_ROOT}/skills/friction-log/SKILL.md` in full and follow it. This file is only the entry point; the skill is the complete instruction set, and the command shadows it, so it will not load on its own.

Use the **friction-log** skill (`skills/friction-log/SKILL.md`) to render a read-only view of `~/.claude/plugins/data/vibe-cartographer/friction.jsonl`.

Default scans the last 30 days and groups by friction type. All flags compose as AND:

- `--project <name>` — filter by project_dir basename (exact match).
- `--type <friction_type>` — filter by one of the seven canonical friction types: `command_abandoned`, `default_overridden`, `complement_rejected`, `repeat_question`, `artifact_rewritten`, `sequence_revised`, `rephrase_requested`.
- `--confidence high|medium|low` — show entries at the given confidence or stronger (high ⊃ medium ⊃ low).
- `--days <n>` — override the default 30-day window.

Output: banner header, one boxed section per friction type with surviving entries (timestamp · command · project · symptom · confidence glyph), then a summary line. Confidence glyphs: ✓ high, ⚠ medium, · low.

Read-only. Never writes the friction log — repair and structural integrity live in `/vitals`; proposals live in `/evolve-cart`. Malformed lines are skipped silently (same convention as `/evolve-cart`); run `/vitals` for line-integrity details.
