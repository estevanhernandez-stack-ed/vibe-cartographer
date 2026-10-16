---
description: "Step 4 of 8 · Translate PRD into a technical blueprint using your architecture. Reads prd.md + architecture docs, writes spec.md."
argument-hint: "(no arguments)"
---

**Load the full instructions first:** read `${CLAUDE_PLUGIN_ROOT}/skills/spec/SKILL.md` in full and follow it. This file is only the entry point; the skill is the complete instruction set, and the command shadows it, so it will not load on its own.

Use the **spec** skill to turn the PRD into a technical specification: stack choices, file structure, data flow, external dependencies, submission approach. Guided by the architecture docs you pointed at during `/onboard` (or the plugin's `architecture/default-patterns.md` fallback).

**Prerequisites:** `/prd` must have run first (`docs/prd.md` must exist).
