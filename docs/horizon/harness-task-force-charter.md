# Task Force Charter — Harness Engineering Amends

> **This is the common piece.** Every agent in this task force reads this file before doing
> anything. It defines the shared goal, the workstreams, the proposal format, and the
> constraints — so each tool's proposed amends come back commensurable and Este can decide
> across them without translating. (Authored 2026-05-21, The Architect.)

## Why this exists

We analyzed Vibe Keystone + Vibe Cartographer against OpenAI's harness engineering
(see [`harness-engineering-comparison.md`](harness-engineering-comparison.md)). Verdict:
we already *do* harness engineering (Keystone for the ground, Cartographer for the app),
but we stop at **authored** harness. OpenAI runs **enforced** (linters/structural tests
with remediation-as-prompt) and **instrumented** (observability + autonomy ladder) harness.

Este's directive: run the findings *through* each tool, let each propose how it wants to
make amends, then he makes the final calls. This charter aligns that work.

## The shared goal

Each tool produces a **proposals doc** — what *it* would change about itself to move from
authored toward enforced/instrumented harness — grounded in its own real SKILL/command
files, ranked, and scoped so Este can approve item-by-item.

## Operating principle adopted NOW (golden principle #1)

**Repo-first.** This initiative runs as versioned markdown the tools can read, not as chat.
Findings, charter, and every proposal land in-repo. (This is the repo-as-system-of-record
lesson from the note, applied to ourselves on day one.)

## Workstreams

### Workstream A — Keystone amends
- **Owner lens:** Keystone's job is producing the load-bearing context file (the keystone).
- **Findings most relevant to it:** #2 (map-not-encyclopedia + freshness linter), #1
  (output validator turning "What NOT to do" prose into mechanical checks), #6
  (repo-as-record section in the skeleton), the evolution-loop gap (Keystone has no
  `/evolve`, no memory — should it?).
- **Output:** `proposed-changes-harness.md` in the vibe-keystone repo root.

### Workstream B — Cartographer amends
- **Owner lens:** Cartographer's job is the autonomous app lifecycle + self-evolution.
- **Findings most relevant to it:** #1 (mechanical enforcers + remediation-as-prompt in
  `/build`), #3 (parallel swarms — already scoped in `parallel-swarms.md`), #4
  (garbage-collection / a `/tend` command — see `self-healing-reliability.md`), #5
  (observability-as-context in deploy-verify), the TDD loop (`tdd-loop.md`).
- **Output:** `proposed-changes-harness.md` in the vibe-cartographer repo root.

## Proposal format (MANDATORY — both workstreams return exactly this)

```
# Proposed Harness Amends — <Tool>

## Summary
<2-3 sentences: what this tool would change about itself and why>

## Proposals (ranked by leverage ÷ effort)
For each proposal:
  ### <N>. <Short title>
  - **Maps to finding:** <which comparison-doc finding(s) / which harness tier: authored→enforced→instrumented>
  - **What changes:** <concrete: which SKILL/command file, what behavior changes>
  - **Why it pays:** <the leverage>
  - **Effort:** <one-session / medium / full cycle>
  - **Risk / blast radius:** <what it touches, what could break — cross-plugin contracts especially>
  - **Do-now slice:** <the smallest version that could ship today, or "none — needs a cycle">

## What this tool should NOT adopt (and why)
<honest list — e.g. throughput-first merge philosophy at our scale>

## Immediate actions taken this session
<anything safe + reversible the agent did right now, with file paths. If nothing was safe to do, say so.>
```

## Hard constraints

- **PROPOSE, don't apply to shipped SKILLs.** Mirror each tool's own philosophy
  (Cartographer's `/evolve` never auto-applies; Keystone proposes-don't-create). Writing
  the *proposals doc* is fine and expected. Do NOT edit `skills/*/SKILL.md`,
  `commands/*.md`, or any keystone/CLAUDE.md the tool ships.
- **Ground every proposal in a real file path.** No vague "add enforcement" — name the
  SKILL and the behavior.
- **Respect cross-plugin contracts.** Cartographer's CLAUDE.md flags shared schemas
  (builder-profile, session-log, friction-log) and sibling plugins (vibe-doc, vibe-test,
  vibe-sec, vibe-thesis). Any proposal touching those must say so under Risk.
- **Stay in your assigned repo.** Workstream A = vibe-keystone only. Workstream B =
  vibe-cartographer only.
- **Identify the do-now slice for each proposal** — the smallest reversible thing that
  could ship today. Este wants momentum, not just a roadmap.

## Final decisions

Este. This task force produces ranked, grounded proposals; he approves item-by-item.
Decision-worthy outcomes log to the 626 Dashboard (Cartographer project
`6vJ7tx2eeW5eZxN9NKrB`) once the MCP surface is available.
