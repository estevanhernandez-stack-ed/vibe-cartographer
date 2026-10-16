# Cart takes over: any list, any step, overnight-safe

Date: 2026-10-16. Target release: v1.13.0 (minor, additive).
Decisions logged to the 626 dashboard, project `6vJ7tx2eeW5eZxN9NKrB`: `JTiO4aXDQodwKQBamzqS` (orchestrator over Superpowers), `Jq1VoSG1UIrOor1TbeLv` (both halves this cycle), `EH9UcxX2IgyI17mO6mFj` (local-only autonomous runs).

## Intent

Este already uses Cart as his overnight executor. He hands it a long list, goes to bed, and wakes up to a completed task list plus a run of "decisions I made for you." It works because Cart has his builder profile and a proven autonomy contract: it does the work the way he would.

Two things keep that from being the default:

1. **Routing.** Agents mid-task reach for Superpowers (`executing-plans`, `subagent-driven-development`), whose descriptions say "use when executing implementation plans." Every Cart command describes itself as "Step N of 8," and `/build` says it "reads checklist.md + all prior artifacts." An agent holding a vibe-sec remediation list concludes Cart doesn't apply, and Este has to step in with "Cart will do that too."
2. **Intake.** `/build` hard-requires `docs/checklist.md` and tells workers to read the full `spec.md` and `prd.md`. Foreign lists have none of these, so they have to be hand-converted first.

And the overnight discipline lives in the wrong place. Recon of real runs (626labs-hub 2026-10-03, vscode-ext 2026-10-01..03, Celestia3 local-day-allowances 2026-10-03, WeSeeYou 2026-10-02) shows each night's checklist hand-writing the same rules: worktree per item, park after two gate failures, hard stops on secrets, write-to-disk-then-verify resume, a decision log, a morning report. Meanwhile Cart's own "When Something Breaks" protocol still stops the entire run to ask the builder, so one blocker parks a whole night.

The goal: **Cart can take over any list or any step of any process, plan it if it needs planning, run it unattended with the overnight rules built in, and hand back a reviewable morning.**

## Goals

- An agent holding any actionable list, plan, backlog, remediation output, or a step of someone else's process picks Cart without Este redirecting it.
- Cart accepts input in any shape and produces its own runnable list without requiring scope/PRD/spec first.
- Autonomous runs survive individual blockers: a failing item is parked and the run continues.
- Every autonomous run ends with two artifacts Este can review over coffee: a numbered decision ledger and a morning report.
- Nothing leaves the machine during an autonomous run. Push happens once, after Este verifies.

## Non-goals

- Replacing the 8-step pipeline. `/onboard` through `/reflect` stays the path for new apps and keeps its step labels.
- Reimplementing Superpowers, vibe-test, or vibe-sec. Cart conducts; they play underneath (Pattern #13).
- Any telemetry or phone-home (standing rule).
- An unattended "push when green" lane. Possible later; not this cycle.

## Anti-goals (would make this a failure even if it technically works)

- Silent assumptions. Every inferred decision lands in the ledger.
- One blocker stalling the whole night.
- Anything pushed, PR'd, deployed, or merged remotely before Este's review.
- A take-over that ignores the builder profile, i.e. generic execution indistinguishable from Superpowers.
- Breaking the existing `/build` flow for people using the full pipeline.

## Constraints

- **Contract surface** (root `CLAUDE.md` / `AGENTS.md`): the builder-profile schema (`shared.*` especially), persona enum, session-log shape, friction shapes, framework pattern numbering, the npm package name, the marketplace `ref`. This design adds no fields to any of them. `session-log.schema.json` types `command` as a free string, so a new `take` command needs no schema change. If the builder finds a reason to touch a contract surface, that is a stop-and-ask, not a builder call.
- **Version-pair lockstep:** `package.json` and `plugins/vibe-cartographer/.claude-plugin/plugin.json` bump together.
- **Tier annotations, not model names** in SKILLs (`vibe-plugins/docs/conventions/model-tiering-rfc.md`).
- **Windows is a first-class host.** Recon found vibe-test/vibe-sec gates exiting 2 on win32. Gate tool errors must not be treated as item failures (see Environmental blockers).
- The existing autonomy contract in `skills/guide/SKILL.md` (Autonomy Mode Adaptation) stays the authority on when to confirm vs flow through. This design extends it, it doesn't fork it.

## What Este decided

1. **Cart is the orchestrator; Superpowers and every other available skill/tool compose underneath.** Superpowers' TDD, systematic-debugging, and verification-before-completion get offered/used inside workers as `/build` already does. Superpowers' *execution drivers* (`executing-plans`, `subagent-driven-development`) are not used as the driver of a Cart run; Cart is the driver. A plan written by `superpowers:writing-plans` is a valid input.
2. **Both halves ship this cycle:** planning from anything, and take-over execution.
3. **Cart may do anything locally during an autonomous run.** Branches, commits, local merges, installs, gates, all fine. **No pushes, no PRs, no remote merges, no deploys** until Este verifies at the end. The push is one deliberate step after review.
4. **The ask turns on unattended mode, with time of day as a signal.** See "Unattended mode" below.

## Unattended mode

Every overnight rule in this doc (local branch layout, stop classes, park-don't-stop, environmental-blocker fallback, resume, ledger + morning report, push gate) applies to **unattended runs** only. Everything else, including a daytime autonomous `/build` with its 3-4 item checkpoints, behaves exactly as it does today.

What makes a run unattended:

- **The ask says so.** "Run it overnight," "build it autonomously tonight," "take this list, I'm going to bed," and similar. This switches unattended mode on for that one run, regardless of the profile's `autonomy_level`, and works for a builder with no profile (defaults: Builder mode, no persona). It is a per-run opt-in by the human, so it honors the contract's "never inferred" rule.
- **Time of day and list length are signals, not switches.** When the ask is ambiguous ("run this list"), Cart's single start-of-run confirmation recommends unattended mode as the default if either holds:
  - the builder's local time is late evening or night (default 21:00-05:00, from the session's local clock);
  - the list is long (default 8+ items after planning), the kind of run nobody wants to babysit through checkpoints.
  
  Example: "14 items, and it's late. Run this unattended? Nothing gets pushed until you review." With neither signal, the same ambiguous ask defaults to today's autonomous behavior. Cart never switches to unattended on signals alone without that one confirmation.
- In unattended mode, verification checkpoints that wait for the builder are off. Build mode is autonomous, git cadence is commit-per-item on item branches, and verification is the item's own local checks. `/take` has no Build Preferences header; these are its fixed unattended settings.

## The shape

### 1. Front door

- **New command `/take`** (name is the designer's call, see Calls made). Its description is written for routing, in the same register as the Superpowers descriptions it competes with. Working draft:
  > Use when you have any list, plan, backlog, task set, or remediation output to work through, or a step of any process to hand off: vibe-sec/vibe-test/vibe-prompt findings, dashboard tasks, a plan file, a one-line ask. Plans it if it needs planning, then executes it the way this builder would, autonomously or step by step.
- `skills/take/SKILL.md` carries the same trigger language in its frontmatter description.
- `/build`'s skill description gains a pointer: lists not produced by `/checklist` go through `/take`. Pipeline commands keep their "Step N of 8" labels; they're the right UX inside the pipeline. Routing is won by `/take`, not by rewriting the pipeline.
- The guide SKILL's Pattern #13 complement section gains one line: when Superpowers execution skills and Cart are both present and a list is in hand, Cart is the driver.

### 2. Intake: any shape in

`/take` accepts, at minimum:

| Input | Example | How it's read |
|---|---|---|
| One-line ask | "plan the UTC vs local fix tonight, build it autonomously" | Planning path (below) |
| Plugin report | vibe-sec audit/fix output, vibe-test gate findings, vibe-prompt audit/remediate output | Each finding → candidate item |
| Plan or checklist file | `docs/superpowers/plans/*.md`, any markdown checkbox list, Cart's own `checklist.md` | Items lifted as-is, gaps filled |
| Dashboard tasks | 626 Labs project open tasks, when the 626 MCP is present | Optional source; never required |
| A step of another process | "do step 4 of the vibe-runbook remediation" | Read that process's own docs for the step, then plan |

Detection is by what the argument is (path, URL, pasted text, plain ask). When ambiguous in `guided` mode, ask once; in `fully-autonomous`, pick the most likely reading and record it as a ledger decision.

### 3. Planning half

Every `/take` run gets a run folder: `docs/cart-runs/<YYYY-MM-DD>-<slug>/` (this is the convention Este's runs already grew in Celestia3). In it:

- `brief.md`: what was asked, the source, what was inferred and from where. For vague asks this is a compact scope (intent, done-when, out-of-scope), written from the builder profile plus repo reality instead of interviewing. It replaces the scope/PRD/spec stack for this run; it does not require it.
- `list.md`: the runnable list. Each item has the five fields `/checklist` already uses (title, what to build, done-when, verify, spec/source ref), plus a **stop class** (see execution half). Items lifted from a source keep a back-reference to it (finding id, task id, plan step).

In `guided` mode, Cart shows `brief.md` + `list.md` and confirms before running. In `fully-autonomous` mode it flows through per the existing autonomy contract, and every planning inference becomes a ledger entry.

If the repo already has Cart pipeline docs (`docs/spec.md` etc.), `/take` reads them as context. It never requires them.

### 4. Execution half

The autonomous engine in `skills/build/SKILL.md` (subagent per item, worker brief, collect-as-report, at most two follow-ups, enforcer gates at close) is reused, not rewritten. The builder decides whether to extract it into a shared reference both `/build` and `/take` point at, or have `/take` hand off to `/build` with the run's `list.md` (see Left to the builder). Either way, the following overnight rules become first-class for any autonomous Cart run, `/take` or `/build`:

**Local branch layout.**
- At run start, record the base commit. Create a local integration branch `cart/<run-slug>` from it.
- Each item builds on its own branch `cart/<run-slug>/<NN>-<item-slug>` in its own worktree, cut from the integration branch's current tip.
- When an item's done-when lines are met and its local checks pass, merge it locally into the integration branch. Never `git commit -a` in a shared worktree (recon: it caught a worker mid-edit on 2026-10-11).
- Nothing is pushed. No `gh pr create`. No remote anything.

**Stop classes**, assigned per item at planning time:
- `go`: build, check, merge locally.
- `hold`: build and check on its branch, but do **not** merge into the integration branch. Listed in the morning report for Este's one-at-a-time walkthrough. Default for anything touching money, billing, usage limits, auth, access gating, or permissions (Este's standing rule: money and gating code waits for his walkthrough).
- `stop`: don't build. Write up what it would take. Default for anything touching secrets, credentials, key rotation, production data, destructive data operations, deploys, or force-pushes.
Cart can upgrade a `go` item to `hold`/`stop` mid-run if it discovers the item touches those surfaces; never the reverse without Este.

**Park, don't stop.** Replace "stop the run" with "park the item" for autonomous runs:
- The same item failing its gate twice → park it: leave its branch as-is, record why, move on.
- An item whose failure invalidates downstream items → park those dependents too, with the reason. Independent items keep going.
- Only stop the whole run when the failure poisons the integration branch itself (e.g. a merged item broke the build for everything after it and can't be reverted cleanly) or a `stop`-class surface is about to be touched.
- `guided` and step-by-step runs keep today's "stop and talk" protocol unchanged.

**Environmental blockers** are not item failures:
- A gate that errors out (vibe-test/vibe-sec exit 2, tool not runnable on this OS) → fall back to the repo's own local checks for that item, record the substitution in the ledger, continue.
- Network/CI/GitHub unavailable → irrelevant during the run (nothing is remote). Recorded only if a step genuinely needed it.
- Agent death mid-item → see resume.

**Resume.** Run state lives in `docs/cart-runs/<run>/state.json`: per item status (`pending`, `building`, `merged`, `held`, `parked`, `stopped`), branch name, last check result. Workers write results to disk before verifying. A re-invoked `/take` (or `/build`) on a run folder resumes at the first item that isn't terminal. Recon: a DNS outage killed four agents mid-task on 2026-10-02.

### 5. Morning output

Two files in the run folder, both always written for autonomous runs, also written (shorter) for guided runs:

**`decisions.md`, the ledger.** Numbered `D1`, `D2`, ... Each entry: the decision, why, the alternative not taken, the item it belongs to, and how to reverse it. Every assumption the autonomy contract already requires Cart to surface ("default — confirm on next interactive run") lands here instead of only inline. If the 626 dashboard MCP is present and the repo is bound, ledger entries that meet the global decision-logging bar are also logged there; the file is the source of truth either way.

**`report.md`, the morning report.** Top: one-line tally (N merged locally, N held, N parked, N stopped). Then:
- **Ready to push:** the integration branch, its commits, which checks ran and their results, and the exact command(s) to push it and open PR(s).
- **Waiting on you:** each `hold` item with its branch, what to look at, and why it's held.
- **Parked:** each parked item with the failure, what was tried, and the suggested next move.
- **Stopped:** each `stop` item with the write-up.
- **Decisions to skim:** pointer to `decisions.md`, with the highest-stakes few called out.

### 6. The push step

After Este reviews, he tells Cart what to ship (all of it, or named items). Cart then pushes the integration branch (and any approved `hold` branches, after merging them in on his say-so) and opens the PR(s). Pushing is always an explicit, separate instruction. In `guided` mode Cart offers it; in `fully-autonomous` mode it still waits. This is the one confirmation autonomy never skips.

### 7. Composition

- Workers keep using Superpowers' TDD, systematic-debugging, and verification-before-completion where they fit, as `/build` does today.
- Close-out still defers to `/vibe-test:gate` and `/vibe-sec:gate` when installed (existing contract), with the environmental-blocker fallback above.
- Plans from `superpowers:writing-plans` are input to `/take`, not a competing executor.

### 8. Logging

- `/take` uses the session-logger like every command (`command: "take"`), and friction-logger for its own triggers. Add a `/take` section to `skills/guide/references/friction-triggers.md` so `/vitals` check #6 stays green. Suggested triggers: builder edits `list.md` heavily before the run (`artifact_rewritten`), builder upgrades/downgrades a stop class (`default_overridden`), builder rejects a ledger decision on review (`default_overridden`, high).
- Add `/take` to `/vitals`' command inventory if it enumerates commands.

## Calls made by the designer (check these)

- **The name `/take`.** Short, verb-first, matches "take over." Alternatives considered: `/run`, `/takeover`, `/do`. Rename freely before build.
- **Run folder at `docs/cart-runs/<date>-<slug>/`.** Adopted from the convention Este's Celestia3 runs already grew.
- **Stop-class defaults** (`hold` for money/billing/auth/gating; `stop` for secrets/credentials/prod data/destructive ops/deploys). Derived from his standing walkthrough rule and the 2026-10-03 hub run's stop conditions.
- **Local merges into an integration branch** rather than leaving every item on a separate unmerged branch. That way later items build on earlier ones, and the morning review is one branch, not twenty.
- **Overnight rules apply to unattended `/build` runs too**, not just `/take`. A daytime autonomous `/build` is unchanged. For an unattended `/build`, the run folder is `docs/cart-runs/<date>-build-<slug>/`, and `state.json` is authoritative, with `[x]` marks in `checklist.md` mirrored from it.
- **Pipeline commands keep "Step N of 8."** The routing fix lives in `/take`'s description.
- **Items run one at a time** in list order. Parallel execution needs dependency graphs, merge ordering and conflict policy; deferred to a later cycle.
- **"Its gate" means the item's own local checks** (tests, type-check, build for the touched area). vibe-test/vibe-sec gates run once at close-out on the integration branch. A failing close-out gate goes into the morning report as a finding; it does not stop or revert the run.
- **Dependents of a `hold` item** build on top of the hold branch and are held too. The morning report shows them as a stack.
- **Remote traffic during a run:** read-only probes (CI status, function lists) are allowed. Logging ledger decisions to the 626 dashboard is allowed mid-run (a record, not shipped work). Marking dashboard tasks done or in progress waits for the post-review push step.
- **The builder's working tree is never touched.** The run starts from the last commit (uncommitted changes are left alone and noted in the report), works only in worktrees, and the builder wakes up on the branch they left with `cart/<slug>` alongside.
- **Late-night window default 21:00-05:00** for the time-of-day signal, and **8+ items** for the list-length signal. Both are tunable defaults; a wrong nudge is logged as friction (`default_overridden`) so `/evolve-cart` can recalibrate them.

## Left to the builder

- Whether the shared execution engine is extracted into a reference file both commands cite, or `/take` hands its `list.md` to `/build`. Either works if `/build`'s existing pipeline behavior is unchanged.
- Parsers/heuristics for each intake shape, and how much of each plugin report's structure to lean on.
- Exact `state.json` shape, beyond the statuses listed.
- Wording of descriptions beyond the working draft, as long as `/take`'s description keeps the "use when you have any list…" trigger language.
- Tests and fixtures for intake parsing and resume logic.
- CHANGELOG, README, and command-table updates for v1.13.0.
