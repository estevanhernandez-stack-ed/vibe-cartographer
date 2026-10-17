# Run Brief: cleanup-run

**Ask (verbatim):** "let's take on the next work", meaning dashboard task `task-1792212812589-y34mesuva`: v1.13.1, cart-run.js cleanup --run, plus a start guard on occupied paths.

**Source:** the 626 dashboard task (project 6vJ7tx2eeW5eZxN9NKrB), filed 2026-10-16 after an incident: closing the task-meditation run with `rm -rf ~/.cwt` deleted the worktrees of a live RBX15 run (decision VCeV0XJOD8hQOi9EVS4L).

**Intent:** make it impossible for one run's cleanup to touch another run's work, and make `start` survive the two path failures seen on 2026-10-16.

**Done when:**
- `cart-run.js cleanup --run <runDir>` removes only that run's worktrees and branches, through git, and never deletes uncommitted work or unpushed commits on its own.
- `start` fails cleanly on an occupied, unregistered path, and recovers a building item whose worktree folder was deleted.
- The docs point at `cleanup --run` and say never to delete the shared root.
- `node --test scripts/test-cart-run.js` and `node scripts/check-plugin.js` pass.
- Version 1.13.1 and the CHANGELOG are ready. Tagging and pushing wait for the push step.

**Out of scope:** the no-git item kind for non-code runs (a separate idea from the same run); tagging, pushing and promotion.

**Inferences:**
1. Cleanup refuses while **any** item is non-terminal (pending as well as building), not only while one is building. A pending item still needs the integration worktree for `finish merged`, so cleaning up a run in progress breaks resume. Source: `cmdFinish` merges in `state.integration_worktree`.
2. The integration branch is deleted only when its tip is reachable from a ref outside the run (merged into another branch, or pushed). Otherwise it's kept and reported. It is the "Ready to push" artifact; deleting it unpushed would lose the night's work. Source: unattended-run.md § The morning report.
3. Worktrees are removed with `git worktree remove` **without** `--force`. A dirty or busy worktree is kept and reported, not forced. Uncommitted work is what the incident destroyed.
4. `--include-held` covers parked branches as well as held ones. Both are unmerged work the builder reviews; one flag keeps it simple.
5. `start` runs `git worktree prune` before creating a worktree. That's a scope add from a repro this morning (decision l0JinA0r0aFiu9B9EgtH).

**Mode:** attended. It's 07:42, one task, and no overnight signal. Fully-autonomous profile, so items run back to back without checkpoints.
