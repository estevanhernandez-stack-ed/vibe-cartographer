# Horizon Brief — TDD Autonomous Iteration Loop

> **Status:** Design brief. Not implemented. Source: Claude Code Insights findings (2026-05-01). Authored as a Cart-cycle-ready brief.
>
> **Effort estimate:** Full Cart cycle. Could ship as a Cart SKILL (`/tdd-loop`) or as a vibe-test extension. Multi-week.
>
> **Related insights tier:** Tier 3 (deferred until dedicated cycle).

## What the report observed

> Your Modal primitive redesign nailed the pattern: spec → 10 TDD tasks via subagents → PR #21 → prod. Generalize this into a standing loop where Claude writes failing tests from a spec, then iterates implementation against the test suite without human intervention until green — including auto-rolling back when a change regresses prior tests. This turns your 1306-test .NET migration class of work into a 'set it and check in the morning' workflow, and would have caught the AdminApp duplicate-toast bug because production smoke tests would have failed before merge.

## Problem this solves

Long-running build cycles where the work shape is well-understood (migrations, refactors, large feature builds with clear acceptance criteria) but the per-item implementation is mechanical. Currently:

1. Cart `/build` requires the human to be available for course corrections. Long sessions = long human attention.
2. Test-failure recovery is ad-hoc. The agent might patch a test instead of the bug; might not roll back a regression cleanly.
3. The "set it and check in the morning" workflow shape doesn't have a primitive in the Cart toolkit.

## Proposed scope

- **`/tdd-loop` SKILL.** New command that takes a feature spec (or a slice of `docs/spec.md`) as input.
- **Test plan generation.** Generate a comprehensive test plan covering happy path + the friction patterns from the corpus (wrong approach, misunderstood request, buggy code). All failing tests committed first.
- **Inner loop.** Autonomous: write minimal code to pass one test → run FULL suite → commit on green → next test.
- **Auto-rollback on regression.** If a previously-passing test breaks, revert the change cleanly (not a partial undo) and try a different approach.
- **Watchdog.** Hard-cap iterations (configurable, default 3 attempts per failing test). On budget exhaustion, exit with a clear failure report rather than spinning.
- **PR opener.** When all tests green, open PR with the spec, the test plan, the iteration log (every attempt, every result), and a one-line summary.

## Bug classes this catches

- **Duplicate identifiers (the `toast` bug)** — would surface at parse time before any test can run; loop exits cleanly with a clear failure.
- **Misunderstood request** — drift from spec is caught by the test plan failing; the loop iterates to fix or surfaces honestly.
- **Wrong approach** — the test plan is the contract; the loop can't drift away from it without flipping tests, which the watchdog catches.
- **Excessive changes** — auto-rollback contains blast radius.

## Composition with existing Cart

- **Replaces nothing.** `/tdd-loop` is an alternative `/build` mode for items that fit (mechanical, well-tested). Existing `/build` modes (sequential, autonomous) stay.
- **Reads the same artifacts.** `docs/spec.md` is the source of truth; the loop just adds the test-plan + green-loop machinery.
- **Pairs with the parallel-swarm brief.** A swarm coordinator could dispatch tdd-loop sub-runs for each independent checklist item; combined, you get parallel TDD swarms.

## Open questions for the planning cycle

1. **Test framework detection.** vitest / jest / pytest / go test / dotnet test / etc. — how does the loop pick the right runner? Probably reuses vibe-test's classifier.
2. **Watchdog signals.** What counts as "stuck"? N iterations? Time-bounded? Test-flapping?
3. **Coverage sufficiency.** Does the test plan need to hit a coverage threshold before iteration starts? (Probably yes — otherwise you green-loop a partial test plan.)
4. **Rollback mechanism.** `git reset --hard HEAD` is dangerous (loses uncommitted work); per-attempt branch is safer but slower. Pick the model.
5. **vibe-test integration.** Should this BE a vibe-test extension (`/vibe-test:tdd-loop`)? Or a Cart SKILL that defers to vibe-test for measurement? Pattern #13 (Ecosystem-Aware Composition) likely says: defer to vibe-test for runner detection and coverage; Cart owns the loop control.
6. **Output discipline.** Per Tier-1 hygiene: long iteration logs land in a file (`docs/tdd-loop-<sessionId>.log`), chat gets summary.

## Cycle hand-off

```
/onboard
  brief: "Build /tdd-loop primitive — spec → failing tests → green-loop
  iteration → PR. Reference: docs/horizon/tdd-loop.md"

/scope
  Read docs/horizon/tdd-loop.md. Decide: Cart SKILL vs vibe-test
  extension. Cut: anything past first-green-PR demo.

/prd
  Stories: test plan generation, inner loop, auto-rollback, watchdog,
  PR opener. ACs grounded in bug classes (toast / drift / wrong-approach).

/spec
  Test framework detection (defer to vibe-test). Watchdog signals.
  Rollback mechanism. Pattern #13 contract with vibe-test.

/checklist
  First milestone: tdd-loop on a synthetic 5-test spec passes end-to-end
  on the minimal-spa fixture.
```
