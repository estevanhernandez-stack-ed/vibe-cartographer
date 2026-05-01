# Horizon Brief — Parallel Agent Swarms for /build

> **Status:** Design brief. Not implemented. Source: Claude Code Insights findings (2,891 messages / 120 sessions / 32 days, generated 2026-05-01). Authored as a Cart-cycle-ready brief so a future `/onboard` → `/scope` cycle inherits the right scope rather than re-discovering it.
>
> **Effort estimate:** Full Cart cycle. ~v2.0 feature. Multi-week.
>
> **Related insights tier:** Tier 3 (deferred until dedicated cycle).

## What the report observed

Existing pattern: Architect Galaxy phase build (Project-626Labs-1 cycle, 2026-04-23 → 2026-04-25) **dispatched implementer/reviewer subagents across phases A-D, autonomously landing 15+ commits**. That worked. The report frames this as the springboard:

> Imagine running 4-6 parallel subagents that each own a checklist item, coordinated by an orchestrator that handles conflicts, runs verification, and only escalates when human judgment is required. With proper isolation (git worktrees per agent) you could compress your typical 13-17 item checklist cycles from a full session into a fraction of the time, with built-in adversarial review catching the 'duplicate toast declaration' class of bugs before they ship.

## Problem this solves

Cart `/build` runs sequentially. 13-17 items per checklist × Este's typical autonomous mode = one long session. Parallelism + adversarial review would:

1. **Compress wall-clock time.** Independent items run concurrently.
2. **Catch shipped bugs before merge.** Adversarial reviewers explicitly look for the bug classes the report identified — duplicate identifiers, scope drift, wrong-directory commits, stale context.
3. **Leverage the existing subagent infrastructure.** Cart already uses Task agents heavily (630 invocations across the corpus); this is a structural extension, not a new primitive.

## Proposed scope (when this becomes a cycle)

- **Partition rule.** A Cart-time analyzer that walks `docs/checklist.md` and identifies items that are **independent** (no shared file, no shared schema, no dependency on a prior item's runtime state). Outputs an execution DAG.
- **Coordinator agent prompt.** Owns the DAG. Dispatches implementer subagents via the Task tool. Runs verification after each merge. Escalates to human only on conflict / ambiguity / failed CI.
- **Implementer subagent contract.** Each owns one DAG node. Operates in its **own git worktree** (full isolation; see `superpowers:using-git-worktrees`). Commits to a per-agent branch. Reports diff + verification status to coordinator on completion.
- **Reviewer subagent contract.** Reads each implementer's diff. Specifically audits for the Insights-flagged bug classes:
  1. Duplicate identifiers / parse errors (the `toast` example)
  2. Scope drift (changes outside the item's stated boundary)
  3. Wrong-directory commits (file paths inconsistent with worktree)
  4. Stale context (assumptions from prior cycles that no longer hold)
- **Merge protocol.** Sequential merges to `main` after reviewer sign-off. Conflicts trigger coordinator-led resolution (escalate if model can't disambiguate).
- **Failure escalation.** When the swarm can't ship cleanly (conflicting changes, persistent test failures), coordinator pauses and surfaces a clear handoff to the human.

## Open questions for the planning cycle

1. **Worktree storage.** Where do per-agent worktrees live? Tmpdir? `.cart/swarms/<sessionId>/`? Repo-relative `worktrees/`?
2. **Coordinator scheduling model.** Single-step dispatch + wait-for-all, or rolling dispatch as items become available? The latter is faster but more complex.
3. **Budget caps.** How many concurrent agents? 4-6 per the report; does that hold up for 17-item checklists, or do we need batching?
4. **Reviewer authority.** Can the reviewer reject without coordinator override? (Yes, default; with explicit human override only.)
5. **Cart compatibility.** Does this become a new `/swarm-build` command, or an autonomous-mode flag on the existing `/build`? Backwards compat matters for users still running sequential Cart.
6. **Tier-1 hygiene inheritance.** Reviewer subagent must enforce the Tier-1 hygiene rules (scope, output, verify-before-synthesizing) on every implementer's diff — that's part of "adversarial review" not a separate gate.

## Why this is a cycle, not a sprint

- **New primitives.** Coordinator/implementer/reviewer agent definitions, worktree management, DAG analyzer, merge protocol — each is a SKILL or hook on its own.
- **New SKILL surface.** Either a new `/swarm-build` command (= new SKILL.md + command loader + tests) or a fundamental refactor of `/build` to support both modes.
- **Cross-plugin contract surface.** Adversarial review patterns might extend to `vibe-test` (tests as gate), `vibe-doc` (docs as gate), `vibe-sec` (security review as gate). Coordination at the framework level.
- **Risk of shallow implementation.** Faking this in a single conversation produces fragile code. The bug classes it's meant to catch are exactly the ones a hasty implementation would introduce.

## Cycle hand-off

When ready to scope this:

```
/onboard
  brief: "Build /swarm-build for Cart — parallel agent swarms with
  git-worktree isolation and adversarial review. Reference:
  docs/horizon/parallel-swarms.md"

/scope
  Read docs/horizon/parallel-swarms.md as the starting brief.
  Confirm partition rule, coordinator/implementer/reviewer contracts,
  merge protocol. Cut: features that aren't on the path to first
  swarm-built /build cycle.

/prd
  Stories per agent role. Reviewer-bug-class audit checklist.

/spec
  Worktree storage decision. DAG schema. Coordinator-agent prompt.

/checklist
  Sequenced. First milestone: 3-agent swarm passes 3 trivially-
  independent checklist items end-to-end.
```
