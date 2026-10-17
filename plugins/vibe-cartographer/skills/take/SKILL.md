---
name: take
description: "This skill should be used when the user says \"/take\" or hands over any list, plan, backlog, task set, or remediation output to work through, or a step of any process: vibe-sec/vibe-test/vibe-prompt findings, dashboard tasks, a plan file, a one-line ask. Plans it if it needs planning, then executes it the way this builder would, autonomously or step by step. Use it instead of a generic plan executor when Cart is installed."
---

# /take — Take Over Any List

Read `skills/guide/SKILL.md` for your overall behavior, then follow this command.

`/take` runs outside the 8-step chain. It needs no scope, PRD, spec or checklist. It turns whatever the builder hands over into a runnable list, then executes it with the autonomous engine in `skills/build/SKILL.md` (Autonomous Mode). Cart is the driver. Superpowers TDD, systematic-debugging and verification-before-completion run inside the workers, as `/build` already offers them. `superpowers:executing-plans` and `superpowers:subagent-driven-development` are not the driver of a Cart run. A plan written by `superpowers:writing-plans` is valid input.

## 1. Before You Start

- Honor **Persona Adaptation** and **Autonomy Mode Adaptation** in `skills/guide/SKILL.md`. Read the unified builder profile the way the guide does (`shared.preferences.persona`, `plugins.vibe-cartographer.autonomy_level`, mode). If the profile is absent, run with defaults: Builder mode, no persona, `guided`.
- **Overnight rules:** [`../guide/references/unattended-run.md`](../guide/references/unattended-run.md). Every unattended rule below is cited by its heading there. **Before planning any unattended run, read that file in full.** Do not work from the headings alone; a run that improvises its own layout breaks resume and the morning review.
- **The run helper owns the mechanics.** Every unattended run drives its folder, `state.json`, branches, worktrees, merges and resume through `node ${CLAUDE_PLUGIN_ROOT}/scripts/cart-run.js` (commands in `unattended-run.md` § The run helper). Never create run files, branches or worktrees by hand, never run `git checkout` or `git switch` in the builder's tree, and never edit `state.json` directly. If the helper exits non-zero, read its message; exit 2 means it already parked the item.
- **Non-negotiables for every unattended run** (the helper enforces 1-3 and 5; the reference has the detail):
  1. **Never check out a branch in the builder's working tree.** All work happens in the worktree the helper's `start` returns; run every command for an item from that directory. The builder wakes up on the branch they left.
  2. **Branch layout:** integration branch `cart/<run-slug>`; one branch per item, `cart/<run-slug>--<NN>-<item-slug>`, each in its own worktree; finished items merge locally into the integration branch.
  3. **Run folder files, exactly these names:** `brief.md`, `list.md`, `state.json`, `decisions.md`, `report.md`, in `docs/cart-runs/<YYYY-MM-DD>-<slug>/`. The helper's `init` creates all five from the templates; you fill in brief, list, decisions and report.
  4. **Stop classes are assigned at planning, per item, in `list.md`.** Money, billing, usage limits, auth, access gating or permissions → `hold`. Secrets, credentials, key rotation, prod data, destructive data ops, deploys, force-pushes → `stop`. Everything else → `go`.
  5. **`hold` is not `parked`.** A `hold` item **is built and checked on its own branch**, then left unmerged for the builder's walkthrough. `parked` is only for an item whose checks failed twice. `stop` items are not built; write up what they would take.
  6. **Nothing leaves the machine.** No push, no PR, no remote merge, no deploy.
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

Detect what the argument is: a path, a URL, pasted text, a plugin report, a step reference, a plain ask, or nothing. Read it fully, then lift candidate items. With no argument, or an ask like "find the work here," go to section 3a.

| Input | Example | How it is read |
|---|---|---|
| One-line ask | "plan the UTC vs local fix tonight" | Planning path (section 5): write the brief from profile plus repo reality, no interview |
| Plugin report | vibe-sec, vibe-test or vibe-prompt output | Each finding is a candidate item, keeping its finding id |
| Plan or checklist file | `docs/superpowers/plans/*.md`, any checkbox list, Cart's `checklist.md` | Items lifted as-is, gaps filled |
| Dashboard tasks | 626 Labs open tasks, when the 626 MCP is present | Optional source, never required. Keep the task id on each item |
| A step of another process | "step 4 of the vibe-runbook remediation" | Read that process's own docs for the step, then plan |
| An existing run folder | `docs/cart-runs/<run>/` | Resume (section 5) |
| Nothing, or "find the work here" | `/take` with no argument | Harvest (section 3a) |

If the reading is ambiguous: ask once when attended at `guided`. At `fully-autonomous` or in an unattended run, pick the likeliest reading and log it as a ledger decision.

If intake yields **zero actionable items**, say so in one sentence and stop. Write no run folder, no files.

## 3a. Harvest

Runs when `/take` gets no argument, or the ask is "find the work here." Instead of reading a list the builder handed over, Cart builds the list from the repo's own work sources. The result feeds the same planning path (section 5).

**Sources.** Sweep them in one pass. Every source is optional; one that is absent, unavailable or empty is skipped silently, with no note and no question.

- Evolve output in the repo: `proposed-changes*.md`. Skip entries marked applied, rejected or resolved. Source ref is the proposal heading.
- Open GitHub issues: `gh issue list --state open`, when `gh` is installed and the repo has a GitHub remote. Source ref is the issue number.
- Open 626 dashboard tasks for the bound project, when the 626 MCP is present: `project_context` with action `listTasks`. Source ref is the task id.
- `claude plugin validate <plugin-dir>` output, when the repo is a Claude Code plugin. Each error is a candidate; warnings are candidates only when cheap to fix. Source ref is the validator message with its file.
- Findings that sibling vibe-* plugins left on disk: `.vibe-sec/`, `.vibe-test/`, `.vibe-prompt/`, `docs/vibe-*`. Source ref is the finding id.

**Verify each candidate against the repo.** Grooming, not trust: a candidate earns a place on the list by surviving a look at the code, and anything that is already done never reaches it. Sort every candidate into one of four verdicts, the same classes a backlog grooming pass uses.

- **Already done:** commits, files or a passing validator already satisfy it. Drop it and record the evidence (the commit, the file, the validator pass).
- **Duplicate:** the same work appears in more than one source. Merge into one item and keep every source ref on it.
- **Stale:** it names files, features or plans that no longer exist, or its context has died. Flag it, do not build it.
- **Still real:** current and actionable. Keep.

Every drop and every stale flag carries evidence. A verdict without evidence is not a verdict.

**Shape.** Write the survivors straight into `list.md` in the run-list shape (section 5): the five fields plus `Stop class`, with the source ref in `Spec ref` and a size guess (S, M or L) in `What to build`. A candidate too big for one run, such as a new mode or a new subsystem, does not become an item. List it under "Not this run" in `list.md` with its source ref and one line on why it is oversized.

**Always confirmed.** Show the harvested list for the builder to trim before anything runs, even in an unattended run. The builder is present at that moment, and the harvest is where scope gets set; trimming is the one decision that cannot be deferred to the morning. List the dropped and stale candidates with their evidence beside it so the builder can overrule a drop. Once the builder confirms, planning continues per section 5, and mode is decided per section 4 on the trimmed list.

If the sweep yields **zero actionable items**, say so in one sentence, name which sources were checked, and stop. Write no run folder, no files.

Harvest adds no friction triggers. Trimming the list is the harvest's normal flow, not a signal; the triggers in section 2 are unchanged.

## 4. Mode

Decide attended or unattended per `unattended-run.md` § When a run is unattended. Summary of the cases that matter here:

- **The ask says so** ("overnight," "I'm going to bed"): unattended, no confirmation needed.
- **The ask is ambiguous and either signal holds**, the late window `21:00-05:00` on the local clock or `8+` items: either signal alone makes unattended the recommendation. Ask once: "14 items, and it's late. Run this unattended? Nothing gets pushed until you review." This confirmation is required even at `fully-autonomous`, because unattended is a per-run human opt-in. If the builder declines, run attended and log the friction (section 2).
- **Neither signal:** today's behavior. Autonomous with the checkpoints `/build` Autonomous Mode describes, or step by step if the builder asked for it.
- **Permission preflight, every unattended run:** before the builder leaves, run the preflight in `unattended-run.md` § When a run is unattended. No auto mode in sight means one line asking them to switch it on, then wait for their OK.
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

- **Unattended:** all of `unattended-run.md` is in force: § Local branch layout, § Stop classes, § Park, don't stop, § Environmental blockers, § Resume and state.json, § The ledger. No builder checkpoints. The loop, exactly:
  1. `cart-run.js init --repo <repo> --slug <slug>` once (creates the folder; fill `brief.md` and `list.md`), then `add-item --slug <s> --stop-class go|hold|stop [--on <N>]` per item, in list order.
  2. Per item: `cart-run.js resume` → `start --item <N>` → dispatch the worker **inside the returned worktree** → run the item's check there and record it with `check --item <N> --command <cmd> --result pass|fail|error` → `finish --item <N> --result merged` for `go`, `held` for `hold`, `parked` if `check` already parked it. `stop` items: `finish --result stopped --reason <write-up>` without starting.
  3. Repeat until `resume` returns `done: true`, then build `report.md` from `status`.
- **Attended:** the engine runs as `/build` Autonomous Mode does today, in the working tree on the current branch, with its checkpoints and its "When Something Breaks" protocol. Check items off in `list.md`. No integration branch.

**Dispatch tier:** `bulk` for per-item workers: one item against a written list, with the worker brief from the engine. **Dispatch tier:** `judgment` for collect-and-verify, reading each report against its done-when lines. The session owns the tier-to-model mapping; this SKILL names tiers, never models.

## 7. Close

Write `report.md` from `run-report-template.md`, per `unattended-run.md` § The morning report. Attended runs get the shorter form. Run the close-out gates per `unattended-run.md` § Environmental blockers (Close-out).

End with the push step: offer it, never do it. Pushing, PRs and dashboard task status changes wait for a separate explicit instruction from the builder (`unattended-run.md` § The push step), even at `fully-autonomous`.

Give a short handoff: the tally line, the path to `report.md`, and the one next action.

Clean up only after the builder's review, and only with `cart-run.js cleanup --run <runDir>` (`unattended-run.md` § Local branch layout). Never delete the worktree root or anything under it by hand: other runs on the machine share it.

## 8. Session End

Call `session-logger.end(entry)` with the sessionUUID from section 2. `outcome: "completed"` when every item reached `merged` or `held`, `"partial"` when anything was parked or stopped, `"error"` when the run halted on a poisoned integration branch. `key_decisions` points at `docs/cart-runs/<run>/decisions.md` plus any mode choice. `artifact_generated` is `docs/cart-runs/<run>/report.md`. Include `complements_invoked` and `friction_notes` from what actually happened. One terminal entry per invocation.

## Conversation Style

Everything from the guide SKILL interaction rules applies, plus:

- Lead with the verdict. One short confirmation at the start, then work.
- State assumptions plainly and put them in the ledger. Never assume silently.
- Match the persona and mode from the profile; with no profile, Builder mode and no persona.
