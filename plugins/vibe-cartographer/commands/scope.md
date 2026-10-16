---
description: "Step 2 of 8 · Brainstorm and refine your idea into a focused project scope. Reads builder-profile.md, writes scope.md."
argument-hint: "(no arguments)"
---

**Load the full instructions first:** read `${CLAUDE_PLUGIN_ROOT}/skills/scope/SKILL.md` in full and follow it. This file is only the entry point; the skill is the complete instruction set, and the command shadows it, so it will not load on its own.

Use the **scope** skill to turn a vague idea into a buildable project scope. The agent interviews you through the idea, user, problem, constraints, and explicit cuts. Output is `docs/scope.md` — the input to every downstream command.

**Prerequisites:** `/onboard` must have run first (`docs/builder-profile.md` must exist).
