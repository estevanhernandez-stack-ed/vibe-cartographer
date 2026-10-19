# Unattended Run

Source of truth for overnight rules. `/take` and `/build` both cite this file instead of restating it. An unattended run is an autonomous Cart run where the builder is not watching: no checkpoints wait for them, nothing leaves the machine, and the builder reviews the result in the morning.

These rules apply to unattended runs only. A daytime autonomous `/build` with its 3-4 item checkpoints, and every guided or step-by-step run, behave exactly as their own SKILLs say.

## When a run is unattended

A run is unattended when either of these holds:

- **The ask says so.** "Run it overnight," "build it autonomously tonight," "take this list, I'm going to bed." This turns unattended mode on for that one run, regardless of the profile's `autonomy_level`, and works for a builder with no profile (defaults: Builder mode, no persona). It is a per-run human opt-in, so it honors the autonomy contract's "never inferred" rule.
- **The builder confirms a recommendation.** When the ask is ambiguous ("run this list"), the single start-of-run confirmation recommends unattended mode if either signal is present:
  - Late window: the builder's local clock reads `21:00-05:00`.
  - List length: `8+` items after planning.

Either signal alone is enough to make the recommendation. Neither signal: behave as today (autonomous, with checkpoints). Never switch to unattended on signals alone without the one confirmation. Copy: "14 items, and it's late. Run this unattended? Nothing gets pushed until you review."

Fixed settings once a run is unattended: build mode is autonomous, no builder checkpoints, git cadence is commit-per-item on item branches, verification is the item's own local checks. A wrong recommendation that the builder declines is `default_overridden` friction, so `/evolve-cart` can recalibrate the window and the length.

Unattended needs a git repo with at least one commit. If there is no repo or no commit, say so in one sentence and offer an attended run.

**Permission preflight.** An unattended run that hits a tool-permission prompt stalls until morning. Before the builder leaves, check that the session will not ask: if the session context shows auto mode (or an equivalent bypass-prompts permission mode) is active, proceed. Otherwise say one line and wait for the builder's OK: "Overnight runs stall on permission prompts. Switch to auto mode (Shift+Tab cycles to it) before you go." This applies even when the ask itself said "overnight," because the builder is still present at that moment and won't be later. If the builder says go anyway, record it as a ledger decision.

## Run folder

Every unattended run owns `docs/cart-runs/<YYYY-MM-DD>-<slug>/`:

| File | Purpose |
|---|---|
| `brief.md` | What was asked, the source, what was inferred and from where |
| `list.md` | The runnable list: five checklist fields per item plus `Stop class` |
| `state.json` | Authoritative run state (shape below) |
| `decisions.md` | The ledger |
| `report.md` | The morning report |

For an unattended `/build` on `docs/checklist.md`, the folder is `docs/cart-runs/<date>-build-<slug>/`. `state.json` is authoritative and the `[x]` marks in `checklist.md` mirror it.

A new run whose slug collides with an existing folder gets `-2`, `-3`. A named run folder that isn't terminal is a resume, not a new run.

## Local branch layout

- At run start, record the base commit. Cut the integration branch `cart/<run-slug>` from it.
- **The base is current, not just whatever is checked out.** A checkout behind the remote default branch builds and verifies against stale code; on 2026-10-17 a run cut from a branch 424 commits behind `main` produced a PR that conflicted and could not be tested. The helper's `init` fetches and refuses that case, and its message says which way out fits. Pick the base with the builder at the start-of-run confirmation:
  - The branch has nothing the remote default lacks (0 ahead): `--base origin/main`. Nothing is lost.
  - The branch has its own commits (feature work): `--merge origin/main`. The run is cut from the branch with `main` merged in, inside the integration worktree; the builder's checkout is untouched. `--base origin/main` here would leave the feature's code out. A merge that would conflict is refused before anything is created; the builder resolves it on the branch.
  - The run is meant for the checkout exactly as it stands: `--base HEAD`.
- Each item builds on `cart/<run-slug>--<NN>-<item-slug>` in its own worktree, cut from the integration branch's current tip.
- When an item's done-when lines are met and its local checks pass, merge it locally into the integration branch.
- Never `git commit -a` in a shared worktree. Stage explicit paths.
- **All of the above is mechanical, so the run helper does it** (§ The run helper). Do not reproduce it by hand.
- **Worktree paths stay short.** Put worktrees outside the repo under a short root (on Windows, `%TEMP%\cwt-<run-slug>\<NN>`), because deep paths hit Windows path-length limits.
- **If a worktree can't be created, never fall back to the builder's tree.** Treat it as an environmental blocker: retry once with a shorter path, then park the item with the error. Every git and file command for an item runs with that item's worktree as its working directory.
- At close, remove item worktrees whose branches merged; keep the integration and `hold` worktrees listed in the report for the builder.
- **After the builder's review, clean up with `cart-run.js cleanup --run <runDir>`, never by hand.** The worktree root (`~/.cwt`) is shared by every concurrent run on the machine, so never delete it or anything under it directly. On 2026-10-16 an `rm -rf ~/.cwt` at one run's close deleted a live run's worktrees in another repo.
- Items run one at a time, in list order.
- The builder's working tree is never touched. The run cuts from the last commit. Never stash, reset, or check out over the builder's tree. Uncommitted files stay exactly as they were and are listed in the morning report. The builder wakes up on the branch they started on, with `cart/<run-slug>` alongside.
- A dependent of a `hold` item builds on top of the hold branch and is held too.
- No pushes. No `gh pr create`. No remote merges. No deploys. Anything remote waits for the push step.

Local means anything on the machine is fine: branches, commits, local merges, installs, local gates.

## Stop classes

Assigned per item at planning time:

| Class | Behavior | Default for |
|---|---|---|
| `go` | Build, check, merge locally. | Everything else |
| `hold` | Build and check on its branch. Do not merge into the integration branch. Listed for the builder's one-at-a-time walkthrough. | Money, billing, usage limits, auth, access gating, permissions |
| `stop` | Do not build. Write up what it would take. | Secrets, credentials, key rotation, production data, destructive data operations, deploys, force-pushes |

Mid-run upgrade: if a `go` item turns out to touch a `hold` surface, upgrade it to `hold`. If it touches a `stop` surface, upgrade it to `stop` and halt that item before the touch. Record every upgrade as a ledger decision. Cart can upgrade at any time and will never downgrade a class without the builder.

## Park, don't stop

An unattended run does not stop to talk. It parks the item and keeps going.

- The same item's check fails twice: park it. Leave its branch as-is, record why, move on.
- An item whose failure invalidates downstream items: park those dependents too, each with the reason. Independent items keep going.
- Stop the whole run only when the failure poisons the integration branch (a merged item broke the build for everything after it and cannot be reverted cleanly), or when a `stop`-class surface is about to be touched.
- "Its check" means the item's own local checks: tests, type-check and build for the touched area.
- `When Something Breaks` in `/build` applies to attended runs. Unattended runs follow this section instead.

## Environmental blockers

Environment problems are not item failures and do not count toward the two-failure park.

- Gate exit `2`, or a gate not runnable on this OS (vibe-test and vibe-sec gates have exited 2 on win32): fall back to the repo's own local checks for that item, log the substitution in the ledger, continue.
- Network, CI or GitHub unavailable: irrelevant during the run, since nothing is remote. Record it only if a step genuinely needed it.
- Agent death mid-item: see Resume.
- Remote traffic during a run: read-only probes (CI status, function lists) are allowed. Logging ledger decisions to the 626 dashboard is allowed. Dashboard task status changes (done, in progress) wait for the push step.

Close-out: run the vibe-test and vibe-sec gates once, on the integration branch, when installed. A failing gate is a finding in the morning report. It never stops the run and never reverts a merge. Gate exit `2` or not runnable: same fallback, logged.

## Resume and state.json

Workers write results to disk before verifying. A re-invocation on a run folder resumes at the first item that isn't terminal. Terminal statuses: `merged`, `held`, `parked`, `stopped`. Non-terminal: `pending`, `building`. A `building` item resumes from its branch as it stands; do not recut it.

State shape:

```json
{
  "run": "<slug>",
  "base_commit": "<sha>",
  "integration_branch": "cart/<slug>",
  "started_at": "<ISO>",
  "items": [
    {
      "n": 1,
      "slug": "...",
      "stop_class": "go|hold|stop",
      "status": "pending|building|merged|held|parked|stopped",
      "branch": "...",
      "checks": [{ "attempt": 1, "command": "...", "result": "pass|fail|error" }],
      "reason": "..."
    }
  ]
}
```

Update `state.json` at every status change and every check. `result: "error"` is an environmental blocker, not a failure. `reason` is filled for `held`, `parked` and `stopped`.

## The ledger

`decisions.md`, numbered `D1`, `D2`, and so on. Every inference, default, substitution and upgrade lands here, including each assumption the autonomy contract says to surface. Fields per entry:

- `D<n>`
- Decision
- Why
- Alternative not taken
- Item it belongs to
- How to reverse

The file is the source of truth. If the 626 dashboard MCP is present and the repo is bound, entries that meet the global decision-logging bar are also logged there.

## The morning report

`report.md`, written at close for every unattended run (shorter for attended runs). Open with one tally line: N merged, N held, N parked, N stopped. Then these sections, in this order:

1. **Ready to push.** The integration branch, its commits, which checks ran and their results, and the exact commands to push it and open the PR(s).
2. **Waiting on you.** Each `hold` item: branch, what to look at, why it's held. Dependents built on a hold branch appear as a stack under it.
3. **Parked.** Each parked item: the failure, what was tried, the suggested next move.
4. **Stopped.** Each `stop` item with its write-up.
5. **Decisions to skim.** Pointer to `decisions.md`, with the highest-stakes few called out.

Also note any uncommitted files that were in the builder's tree at run start, and any close-out gate findings.

## The push step

Pushing is always a separate, explicit instruction from the builder, after they review. This holds even at `fully-autonomous`. Cart offers it in the report; it never does it on its own.

When told, push the integration branch (plus any approved `hold` branches, merged in on the builder's say-so), open the PR(s), and only then update dashboard task status. If the builder names a subset, push only that.

## The run helper

`node ${CLAUDE_PLUGIN_ROOT}/scripts/cart-run.js <command>` owns every mechanical step of an unattended run. Each command prints one JSON object. Exit 1 is a usage or state error; exit 2 is a git or environment error, and the item is already parked when one was in play.

| Command | Does |
|---|---|
| `init --repo <dir> --slug <slug> [--date YYYY-MM-DD] [--base <ref>] [--merge <ref>]` | Fetches `origin` (a failed fetch is a warning), then refuses (exit 1, nothing created) when the checkout is behind the remote default branch unless `--base` or `--merge` names the base; the message says which fits. `--merge <ref>` cuts from the base and merges `<ref>` in the integration worktree, after `git merge-tree` proves it clean (a conflict is refused before anything is created). Creates the run folder (colliding slug gets `-2`) with all five files from the templates, the integration branch at the base and its worktree under `~/.cwt/<run-slug>/int`. Records `base_ref`, `behind_at_start`, the builder's branch and uncommitted files. Refuses a repo with no commits. |
| `add-item --run <runDir> --slug <s> --stop-class go\|hold\|stop [--title <t>] [--on <N>]` | Appends an item. `--on` marks a dependency; a dependent of a `hold` item builds on the hold branch. |
| `start --run <runDir> --item <N>` | Creates the item branch and its worktree (short path, one retry, never the builder's tree) and returns the worktree path. Re-entering a `building` item returns its existing worktree, or re-creates it on its branch if the folder was deleted. Refuses `stop` items, and refuses (exit 1, nothing parked) a path that exists but is not the item's worktree. |
| `check --run <runDir> --item <N> --command <cmd> --result pass\|fail\|error` | Records a check. Two `fail` results park the item; `error` is environmental and doesn't count. |
| `finish --run <runDir> --item <N> --result merged\|held\|parked\|stopped [--reason <r>]` | `merged` merges locally into the integration branch and removes the item worktree; it refuses `hold`/`stop` items and dependents of a held item. |
| `resume --run <runDir>` | Returns the first non-terminal item, or `done: true`. |
| `status --run <runDir>` | Tally and per-item summary for `report.md`. |
| `cleanup --run <runDir> [--include-held]` | After review. Refuses while any item is `pending` or `building`. Removes this run's worktrees through git without forcing (a dirty or busy one is kept and reported), deletes merged item branches, deletes the integration branch only once another branch or a remote holds its tip, and keeps `held` and `parked` branches unless `--include-held`. Removes the run's own worktree root only when empty. Records the result in `state.json`. |

`CART_WORKTREE_ROOT` overrides the worktree root (tests use it).
