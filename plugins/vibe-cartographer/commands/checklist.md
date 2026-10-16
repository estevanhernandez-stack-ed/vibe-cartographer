---
description: "Step 5 of 8 · Break the spec into a sequenced, dependency-aware build plan. Reads spec.md, writes checklist.md."
argument-hint: "(no arguments)"
---

**Load the full instructions first:** read `${CLAUDE_PLUGIN_ROOT}/skills/checklist/SKILL.md` in full and follow it. This file is only the entry point; the skill is the complete instruction set, and the command shadows it, so it will not load on its own.

Use the **checklist** skill to turn the technical spec into an ordered build plan — each item with its dependencies, acceptance criteria, and rough effort. The final item is always **Documentation & Security Verification** (README, docs cleanup, secrets scan, dependency audit, deployment security).

**Prerequisites:** `/spec` must have run first (`docs/spec.md` must exist).
