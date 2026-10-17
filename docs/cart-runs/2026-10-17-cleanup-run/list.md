# Run List: cleanup-run

- [x] **1. `start` refuses an occupied path and recovers a deleted worktree**
  Spec ref: `task-1792212812589-y34mesuva > 2`, plus decision l0JinA0r0aFiu9B9EgtH
  What to build: (S) In `cmdStart`, run `git worktree prune` first. Then, if the target dir exists and is not a registered worktree on the item's branch, throw CartError exit 1 naming the path, and don't park. If it is registered on the item's branch, re-enter it.
  Acceptance: Done when start on a pre-filled dir exits 1 with a clear message, the item stays pending and the stray file is untouched; and when a building item whose worktree folder was deleted re-starts on the same branch with its commits.
  Verify: Run `node --test scripts/test-cart-run.js` and confirm the two new tests pass.
  Stop class: go

- [x] **2. `cleanup --run` removes only this run's worktrees and branches**
  Spec ref: `task-1792212812589-y34mesuva > 1`
  What to build: (M) A `cmdCleanup` command. Refuse while any item is non-terminal. Remove, without --force, the registered worktrees on this run's branches (integration exactly, or `<integration>--*`), keeping and reporting any that git refuses. Delete merged item branches. Delete held and parked branches only with `--include-held`. Delete the integration branch only when it's reachable from a ref outside the run. Prune, remove the run's worktree root only if empty (rmdir, never recursive), and record the result in state.json.
  Acceptance: Done when cleanup of run A leaves run B (another repo, same worktree root) intact; it refuses while building; a held branch survives a default cleanup and goes with --include-held; and an unpushed integration branch is kept with a reason.
  Verify: Run `node --test scripts/test-cart-run.js`.
  Stop class: go

- [x] **3. Docs: cleanup in unattended-run.md and /take § 7**
  Spec ref: `task-1792212812589-y34mesuva > 3`
  What to build: (S) Add a `cleanup` row to the helper table, a note under § Run folder or § Local branch layout saying never to delete the shared worktree root, and a line in /take § 7 Close. Update the usage block in cart-run.js.
  Acceptance: Done when both docs name `cleanup --run` and the shared-root rule, and check-plugin passes.
  Verify: Run `node scripts/check-plugin.js`.
  Stop class: go

- [x] **4. Release prep for v1.13.1**
  Spec ref: `task-1792212812589-y34mesuva > ship bar`
  What to build: (S) Bump plugin.json and package.json to 1.13.1, and add a CHANGELOG entry.
  Acceptance: Done when the versions agree and check-plugin passes. No tag, no push.
  Verify: Run `node scripts/check-plugin.js`.
  Stop class: go

## Not this run

- No-git item kind for non-code runs (from the task-meditation run): a new mode of the helper, not a patch.
