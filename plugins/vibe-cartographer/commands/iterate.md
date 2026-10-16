---
description: "Step 7 of 8 · Optional polish pass after the core build. Identifies rough edges, iterates on UX, tightens the ship."
argument-hint: "(optional focus area, e.g. 'performance' or 'ux')"
---

**Load the full instructions first:** read `${CLAUDE_PLUGIN_ROOT}/skills/iterate/SKILL.md` in full and follow it. This file is only the entry point; the skill is the complete instruction set, and the command shadows it, so it will not load on its own.

Use the **iterate** skill for a polish pass after the core build is done. Optional — skip it if you're already shipping. Useful for hackathons in the last hour before submission: the agent looks at what you built, suggests the highest-leverage improvements given remaining time, and helps you implement them.

**Prerequisites:** `/build` must have produced working code.
