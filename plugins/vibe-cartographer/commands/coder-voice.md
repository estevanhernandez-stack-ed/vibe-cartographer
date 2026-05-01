---
description: Capture, refresh, or extend a coder voice profile in ~/.claude/CLAUDE.md so the agent answers in a chosen voice during autonomous work. Always presents a choice — never imposes a path.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

Use the **coder-voice** skill (`skills/coder-voice/SKILL.md`) to set up or update the `## CODER VOICE SYNTHESIS` block in `~/.claude/CLAUDE.md`.

**This is an option, not a demand.** Default flow with no args presents a three-way choice:

- **Personal** — capture YOUR actual voice via discover-first corpus sweep (CLAUDE.md, builder profile, session transcripts at `~/.claude/projects/`, memories, blog posts, process-notes) or interview fallback.
- **Preset cutter** — install a curated voice modeled after a known coder/writer. Available presets: `carmack` (technical precision), `dhh` (opinionated terse), `bret-victor` (tools-for-thought / visual), `julia-evans` (accessible explainer). Stylized, not yours — the agent acts in that voice.
- **Skip** — leave the default Architect persona unchanged.

**The Cross layer.** Optional modifier section that mixes admired voices INTO any base (personal or preset) at 80/20 default. Synthesize-don't-imitate discipline; base voice always dominates. Run with `cross` arg to add or update.

**Modes (passed as args):**

- *(no args)* — chooser if no existing block; revise mode if it does
- `discover` — force discover-first corpus sweep (inside personal path)
- `interview` — force the 3-question interview (skip discovery)
- `cross` — add or update the Cross — voice modifiers section
- `cutter` — show the preset menu
- `cutter <preset>` — install a named preset directly (e.g., `cutter carmack`)

**Self-modification gate.** Writes to `~/.claude/CLAUDE.md` always require explicit yes — the SKILL shows the proposed block first, never auto-writes. If the harness blocks the write, falls back to printing the block for paste-in.

Args: `$ARGUMENTS`
