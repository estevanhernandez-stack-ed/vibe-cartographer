# Horizon Brief — Self-Healing Workflow Reliability Layer

> **Status:** Design brief. Not implemented. Source: Claude Code Insights findings (2026-05-01). Authored as a Cart-cycle-ready brief.
>
> **Effort estimate:** Full Cart cycle. The most ambitious of the three horizon items — could grow into its own plugin (`vibe-reliability` or similar) given the cross-plugin scope.
>
> **Related insights tier:** Tier 3 (deferred until dedicated cycle).

## What the report observed

> Your friction logs show recurring infra-class failures — output token limits hit 6+ times, wrong-directory commits, stale handoff confusion, prereq mismatches when /checklist ran before /spec, hook false-positives. An autonomous reliability agent could continuously monitor your session state, detect these patterns in real-time, and either auto-correct (re-cd to repo root, chunk long responses, refresh stale context) or pre-empt them via guardrails. Combined with a nightly /evolve agent that mines new friction from session logs and ships SKILL improvements, your toolchain becomes self-improving.

## Problem this solves

Recurring infra-class failures keep biting. Tier-1 hygiene rules (now in `~/.claude/CLAUDE.md`) and the pre-publish-gate hook catch some of them at the agent level. The reliability layer makes the catch **structural and continuous**, with auto-correction where possible.

## Proposed scope (three layers)

### Layer 1 — PreToolUse / PostToolUse hooks for invariants

Encode the Tier-1 hygiene rules as actual gates, not just agent-readable guidance:

- **`pwd-before-git` hook.** PreToolUse on Bash matching `git commit|git push|gh release|npm publish`. Verifies cwd matches an expected repo path (configurable per project). Blocks if cwd is stuck in another repo.
- **`prereq-artifact-check` hook.** PreToolUse on Bash matching Cart command invocations. Verifies prerequisite artifacts exist (`docs/spec.md` before `/checklist`, etc.). Blocks if missing — currently Cart enforces this in SKILL prose, but it's a soft gate.
- **`stale-handoff-detector` hook.** UserPromptSubmit hook. Scans the user's prompt for stale-handoff markers (referencing a prior cycle's commands, copy-paste'd brief from an older session). Warns inline.
- **`output-chunking-guidance` hook.** UserPromptSubmit hook. When the prompt is asking for long-form output (PRD / spec / reflection / blog), inject a one-line nudge: "remember the Tier-1 output rule — write to file first."

Pre-publish-gate (already shipped in v1.8.0) is the prototype. These are siblings.

### Layer 2 — Reliability monitor agent

A long-running agent that watches session state and surfaces patterns proactively. Specifically:

- Detects when output is approaching token limits and suggests file-first writing.
- Detects when the session has run for >2h without a `/clear` (in CLI mode) and suggests context refresh.
- Detects friction patterns from the corpus (the same 5 the hooks gate against) in real time and alerts before they cause damage.

Implementation likely as a project-local agent (`.claude/agents/reliability-monitor.md`) that other agents check in with at major decision points.

### Layer 3 — Nightly /evolve cron

A scheduled `/evolve` run that mines the day's session logs (and friction logs, when those start firing — see also: Cart's friction-logger gap from today's /evolve readout) and proposes SKILL improvements.

- **Nightly cron** via the existing `schedule` skill or equivalent.
- **Reads the previous 24h of activity** — session logs + friction.jsonl + process-notes new entries.
- **Proposes SKILL edits to `proposed-changes.md`** — never auto-applies, per the existing /evolve discipline.
- **Surfaces patterns the human missed** during the day.

This closes the self-improving loop the report describes.

## Friction patterns this attacks

| Pattern | Layer that catches it | How |
|---|---|---|
| Wrong-directory commit | Layer 1 (`pwd-before-git` hook) | Block at the tool call |
| Prereq mismatch (/checklist before /spec) | Layer 1 (`prereq-artifact-check` hook) | Block the command |
| Stale handoff | Layer 1 (`stale-handoff-detector` hook) | Warn inline |
| Output token limit | Layer 1 (`output-chunking-guidance` hook) | Nudge before generation |
| Recurring patterns the human misses | Layer 3 (nightly /evolve cron) | Propose SKILL edits |
| Session running too long without /clear | Layer 2 (monitor agent) | Suggest refresh |

## Composition with existing Cart

- **Cart's existing `/vitals`** is the closest analog — structural integrity check on the plugin install. The reliability layer extends `/vitals`-style discipline into runtime via hooks.
- **The friction-logger gap** (zero entries across 13 cycles) is the deeper problem. Layer 3 only works if friction signal is actually captured. The reliability layer should ALSO either fix friction-logger's orchestrator-context bug (the `/reconnect` procedure that's specced but unimplemented) OR pivot Cart to use process-notes as the canonical capture per today's /evolve readout.
- **Cross-plugin scope.** vibe-doc, vibe-test, vibe-sec, vibe-thesis would all benefit from layers 1 and 2. Worth considering as its own plugin (`vibe-reliability`) rather than Cart-only.

## Open questions for the planning cycle

1. **Plugin boundary.** Cart SKILL extension, or new plugin (`vibe-reliability`)? The cross-plugin nature argues for a new plugin.
2. **Hook discoverability.** How do hooks get installed? `update-config` SKILL handles wiring; the reliability layer would need an installer/curator.
3. **Friction-logger fix.** Whether to fix the orchestrator-context bug or accept process-notes as canonical. Cross-plugin contract decision.
4. **Cron-plumbing.** Does the existing `schedule` skill support nightly /evolve runs cleanly? Probably yes — needs verification.
5. **Test harness.** How do we test this without running it for weeks? Need fixture session logs + simulated friction events.
6. **Privacy.** Hook-based monitoring means more inspection. Make sure no PII leaks into logged events.

## Cycle hand-off

```
/onboard
  brief: "Build vibe-reliability — self-healing workflow layer with
  PreToolUse hooks, monitor agent, nightly /evolve cron. Reference:
  docs/horizon/self-healing-reliability.md"

/scope
  Plugin boundary decision: Cart extension vs new plugin.
  Cut: layers 2 and 3 if scope balloons; ship layer 1 alone first.

/prd
  Stories per layer. ACs grounded in friction taxonomy from the
  insights report.

/spec
  Hook installer/curator. Friction-logger fix decision (or pivot to
  process-notes). Cron plumbing via schedule skill. Test harness.

/checklist
  First milestone: layer 1 hooks (`pwd-before-git`, `prereq-artifact-
  check`) installed and blocking on test fixtures.
```
