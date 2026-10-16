---
name: take
description: "This skill should be used when the user says "/take" or hands over any list, plan, backlog, task set, or remediation output to work through, or a step of any process: vibe-sec/vibe-test/vibe-prompt findings, dashboard tasks, a plan file, a one-line ask. Plans it if it needs planning, then executes it the way this builder would, autonomously or step by step. Use it instead of a generic plan executor when Cart is installed."
---

# /take — Take Over Any List

Read `skills/guide/SKILL.md` for your overall behavior, then follow this command.

`/take` runs outside the 8-step chain. It needs no scope, PRD, spec or checklist. It turns whatever the builder hands over into a runnable list, then executes it with the autonomous engine in `skills/build/SKILL.md` (Autonomous Mode). Cart is the driver. Superpowers TDD, systematic-debugging and verification-before-completion run inside the workers, as `/build` already offers them. `superpowers:executing-plans` and `superpowers:subagent-driven-development` are not the driver of a Cart run. A plan written by `superpowers:writing-plans` is valid input.

## 1. Before You Start

- Honor **Persona Adaptation** and **Autonomy Mode Adaptation** in `skills/guide/SKILL.md`. Read the unified builder profile the way the guide does (`shared.preferences.persona`, `plugins.vibe-cartographer.autonomy_level`, mode). If the profile is absent, run with defaults: Builder mode, no persona, `guided`.
- **Overnight rules:** [`../guide/references/unattended-run.md`](../guide/references/unattended-run.md). Every unattended rule below is cited by its heading there, not restated.
- **Templates:** [`../guide/templates/run-brief-template.md`](../guide/templates/run-brief-template.md), [`../guide/templates/run-list-template.md`](../guide/templates/run-list-template.md), [`../guide/templates/run-decisions-template.md`](../guide/templates/run-decisions-template.md), [`../guide/templates/run-report-template.md`](../guide/templates/run-report-template.md).
- **Engine:** `skills/build/SKILL.md` § Autonomous Mode. `/take` hands off to it; it does not copy it.
- **Friction contract:** [`../guide/references/friction-triggers.md`](../guide/references/friction-triggers.md), section `/take`.

## 2. Session Logging and Friction Logging

Call `session-logger.start("take", <project_dir>)` once per `/take` invocation, before intake, and hold the sessionUUID for the whole run. See [`../session-logger/SKILL.md`](../session-logger/SKILL.md). Subagent dispatches and friction events share that UUID. At close, call `end(entry)` once with the same UUID (section 8).

## Friction Logging

Invoke `friction-logger.log()` at exactly these triggers, with exactly these confidence levels:

- **Builder heavily edits `list.md` before the run starts** → `friction_type: "artifact_rewritten"`, `confidence: "medium"`. Quote what changed in `symptom`.
- **Builder changes an item's stop class** (go, hold, stop, either direction) → `friction_type: "default_overridden"`, `confidence: "medium"`. Name the item and both classes in `symptom`.
- **Builder rejects a ledger decision at review** → `friction_type: "default_overridden"`, `confidence: "high"`. Quote the `D<n>` entry and the rejection in `symptom`.
- **Builder declines a recommended unattended mode** → `friction_type: "default_overridden"`, `confidence: "medium"`. Quote the recommendation and the signal that triggered it (late window or list length) so `/evolve-cart` can recalibrate.

Universal triggers (`repeat_question`, `rephrase_requested`) also apply; honor the defensive default and do not log without a quoted prior turn. Every `log()` call passes the sessionUUID from `start()`.

## 3. Intake

Detect what the argument is: a path, a URL, pasted text, a plugin report, a step reference, or a plain ask. Read it fully, then lift candidate items.

| Input | Example | How it is read |
|---|---|---|
| One-line ask | "plan the UTC vs local fix tonight" | Planning path (section 5): write the brief from profile plus repo reality, no interview |
| Plugin report | vibe-sec, vibe-test or vibe-prompt output | Each finding is a candidate item, keeping its finding id |
| Plan or checklist file | `docs/superpowers/plans/*.md`, any checkbox list, Cart's `checklist.md` | Items lifted as-is, gaps filled |
| Dashboard tasks | 626 Labs open tasks, when the 626 MCP is present | Optional source, never required. Keep the task id on each item |
| A step of another process | "step 4 of the vibe-runbook remediation" | Read that process's own docs for the step, then plan |
| An existing run folder | `docs/cart-runs/<run>/` | Resume (section 5) |

If the reading is ambiguous: ask once when attended at `guided`. At `fully-autonomous` or in an unattended run, pick the likeliest reading and log it as a ledger decision.

If intake yields **zero actionable items**, say so in one sentence and stop. Write no run folder, no files.

## 4. Mode

Decide attended or unattended per `unattended-run.md` § When a run is unattended. Summary of the cases that matter here:

- **The ask says so** ("overnight," "I'm going to bed"): unattended, no confirmation needed.
- **The ask is ambiguous and either signal holds**, the late window `21:00-05:00` on the local clock or `8+` items: either signal alone makes unattended the recommendation. Ask once: "14 items, and it's late. Run this unattended? Nothing gets pushed until you review." This confirmation is required even at `fully-autonomous`, because unattended is a per-run human opt-in. If the builder declines, run attended and log the friction (section 2).
- **Neither signal:** today's behavior. Autonomous with the checkpoints `/build` Autonomous Mode describes, or step by step if the builder asked for it.
- **Not a git repo, or a repo with no commits** (not a git repo means no `.git`; no commits means `git rev-parse HEAD` fails): unattended is unavailable. Say why in one sentence and offer an attended run. Do not recommend unattended on signals in this state.

The item count is only known after drafting, so evaluate the length signal on the drafted list and fold the mode question into the one confirmation that shows the brief and list.

## 5. Planning

Draft in memory first. Create the folder only once there is at least one item and the mode is settled.

- **Run folder:** `docs/cart-runs/<YYYY-MM-DD>-<slug>/`, slug from the ask in kebab-case. A colliding folder name gets `-2`, then `-3` (`unattended-run.md` § Run folder).
- **Resume:** if the argument names an existing run folder whose `state.json` has a non-terminal item (or, for an attended folder with no `state.json`, an unchecked item in `list.md`), resume instead of planning. Pick up at the first non-terminal item per `unattended-run.md` § Resume and state.json. A fully terminal folder: report that and stop.
- **`brief.md`** from `run-brief-template.md`: verbatim ask, source, intent, done when, out of scope, every inference with where it came from, and the mode with its trigger.
- **`list.md`** from `run-list-template.md`: the five checklist fields per item plus `Stop class`. Items lifted from a source keep a back-reference in `Spec ref`. Assign stop classes with the defaults in `unattended-run.md` § Stop classes.
- Read `docs/spec.md`, `docs/prd.md` and the other pipeline docs as context if they exist. Never require them.
- **Attended:** show `brief.md` and `list.md` and confirm before running. **Unattended:** flow through, and put every planning inference in `decisions.md` (`run-decisions-template.md`, fields per `unattended-run.md` § The ledger).

**Dispatch tier:** `judgment`. Intake and planning decide what the work is and where the stop classes fall; that stays on the session model.

## 6. Execute

Hand off to `/build`: execute `docs/cart-runs/<run>/list.md` under the Autonomous Mode engine in `skills/build/SKILL.md` with `list.md` in place of `checklist.md`, applying `unattended-run.md` when the run is unattended. Under that handoff, a worker's context is its list item, `brief.md`, and `docs/spec.md` when it exists, in place of the full spec and PRD section.

- **Unattended:** all of `unattended-run.md` is in force: § Local branch layout, § Stop classes, § Park, don't stop, § Environmental blockers, § Resume and state.json, § The ledger. No builder checkpoints.
- **Attended:** the engine runs as `/build` Autonomous Mode does today, in the working tree on the current branch, with its checkpoints and its "When Something Breaks" protocol. Check items off in `list.md`. No integration branch.

**Dispatch tier:** `bulk` for per-item workers: one item against a written list, with the worker brief from the engine. **Dispatch tier:** `judgment` for collect-and-verify, reading each report against its done-when lines. The session owns the tier-to-model mapping; this SKILL names tiers, never models.

## 7. Close

Write `report.md` from `run-report-template.md`, per `unattended-run.md` § The morning report. Attended runs get the shorter form. Run the close-out gates per `unattended-run.md` § Environmental blockers (Close-out).

End with the push step: offer it, never do it. Pushing, PRs and dashboard task status changes wait for a separate explicit instruction from the builder (`unattended-run.md` § The push step), even at `fully-autonomous`.

Give a short handoff: the tally line, the path to `report.md`, and the one next action.

## 8. Session End

Call `session-logger.end(entry)` with the sessionUUID from section 2. `outcome: "completed"` when every item reached `merged` or `held`, `"partial"` when anything was parked or stopped, `"error"` when the run halted on a poisoned integration branch. `key_decisions` points at `docs/cart-runs/<run>/decisions.md` plus any mode choice. `artifact_generated` is `docs/cart-runs/<run>/report.md`. Include `complements_invoked` and `friction_notes` from what actually happened. One terminal entry per invocation.

## Conversation Style

Everything from the guide SKILL interaction rules applies, plus:

- Lead with the verdict. One short confirmation at the start, then work.
- State assumptions plainly and put them in the ledger. Never assume silently.
- Match the persona and mode from the profile; with no profile, Builder mode and no persona.
