# Run Report: cleanup-run (attended)

**4 merged, 0 held, 0 parked, 0 stopped.** Branch `fix/cart-run-cleanup` in vibe-cartographer, one local commit. Nothing pushed.

## Ready to push

- `cart-run.js cleanup --run <runDir> [--include-held]`, the `start` guard on occupied paths, and `start` recovery of a deleted worktree (`git worktree prune` first).
- Checks: `node --test scripts/test-cart-run.js` 14/14 (9 before, 5 new); `node scripts/check-plugin.js` OK at 1.13.1.
- Real-root smoke test against `~/.cwt` with no override, using two scratch clones and RBX15's leftover folder as a live neighbor. Cleanup of finished run A removed only A. Live run B kept its uncommitted file and was refused cleanup while building. RBX15's folder was untouched. A dirty worktree was kept and reported, then removed once clean. A second cleanup run was idempotent.
- To ship: `git -C <cart> push -u origin fix/cart-run-cleanup`, `gh pr create`, then after merge tag `v1.13.1` with /cut-release and bump the marketplace ref.

## Decisions to skim

Brief inferences 1-5: cleanup refuses any non-terminal item; the integration branch is deleted only when another ref holds its tip; no forced worktree removal; `--include-held` also covers parked branches; prune in `start` (dashboard decision l0JinA0r0aFiu9B9EgtH).

## Not this run

The no-git item kind for non-code runs.
