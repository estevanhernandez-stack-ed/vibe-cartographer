---
description: "Step 3 of 8 · Turn scope into detailed product requirements with testable acceptance criteria. Reads scope.md, writes prd.md."
argument-hint: "(no arguments)"
---

**Load the full instructions first:** read `${CLAUDE_PLUGIN_ROOT}/skills/prd/SKILL.md` in full and follow it. This file is only the entry point; the skill is the complete instruction set, and the command shadows it, so it will not load on its own.

Use the **prd** skill to expand the scope doc into a real Product Requirements Document: user stories, acceptance criteria, edge cases, prioritization (must-have vs later). Supports optional deepening rounds for richer requirements — accept them if the project is complex.

**Prerequisites:** `/scope` must have run first (`docs/scope.md` must exist).
