---
description: "Step 6 of 8 · Build the app — autonomous or step-by-step mode. Reads checklist.md + all prior artifacts, writes source code."
argument-hint: "(no arguments)"
---

**Load the full instructions first:** read `${CLAUDE_PLUGIN_ROOT}/skills/build/SKILL.md` in full and follow it. This file is only the entry point; the skill is the complete instruction set, and the command shadows it, so it will not load on its own.

Use the **build** skill to actually ship the project. Walks the checklist item by item, either autonomously (the agent executes each step and reports) or step-by-step (the agent pauses for your input between items). Respects your mode preference (Learner vs Builder) and persona voice from the unified profile.

**Prerequisites:** `/checklist` must have run first (`docs/checklist.md` must exist).

**Other lists:** a list that `/checklist` didn't produce (findings, a plan file, a backlog, a run folder) goes through `/take`, which plans it and hands it to this skill. An unattended overnight run follows `skills/guide/references/unattended-run.md`.
