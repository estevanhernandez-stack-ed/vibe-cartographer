# Decisions: harvest-overnight

## D1
- **Decision:** Base the run on `feat/take-over` HEAD `7007f04`, not `main`.
- **Why:** The builder is on `feat/take-over`; main is 14 commits behind and lacks the frontmatter fix (`18946dc`) every item depends on for a passing validator.
- **Alternative not taken:** Cutting from `main`, which would reintroduce issue #1 into every item branch.
- **Item:** run
- **How to reverse:** Rebase `cart/harvest-overnight` onto main after `feat/take-over` merges.

## D2
- **Decision:** Cold-start smoke test (dashboard `9skdcqn1a`) is cut to a static check script plus CI workflow, merged with issue #1 prevention.
- **Why:** The plugin ships as content; a true fresh-install run needs Claude Code with auth in CI, which is unverified here. The static check catches the class that actually broke users (issue #1).
- **Alternative not taken:** A headless Claude Code fresh-install run in CI.
- **Item:** 3
- **How to reverse:** Extend `scripts/check-plugin.js` or add a second workflow job later.

## D3
- **Decision:** `/what-do-you-know` ships read-only; the "users can delete" half of the task is left out.
- **Why:** Deleting user data is a destructive data operation, a stop-class surface in an unattended run.
- **Alternative not taken:** Building deletion behind a confirm prompt tonight.
- **Item:** 4
- **How to reverse:** Follow-up item, attended, with a confirm-per-file flow.

## D4
- **Decision:** Item checks are `claude plugin validate plugins/vibe-cartographer` plus, once item 3 merges, `node scripts/check-plugin.js`. Close-out vibe-test/vibe-sec gates run only if invocable.
- **Why:** The repo has no test suite; it is markdown SKILLs plus small Node helpers.
- **Alternative not taken:** None available locally.
- **Item:** run
- **How to reverse:** n/a.

## D5
- **Decision:** No item edits repo-root `CLAUDE.md` or `AGENTS.md`.
- **Why:** Both carry uncommitted builder edits; touching them on a branch guarantees a morning merge conflict over the builder's own work.
- **Alternative not taken:** Updating the keystone's "two CLAUDE.md files" gotcha inside item 2.
- **Item:** 2
- **How to reverse:** Apply the keystone note listed in the report by hand after committing the tree edits.

## D6
- **Decision:** Run folder stays untracked in the builder's tree; item worktrees live in the session scratchpad.
- **Why:** Workers and resume need a stable path; the estate root stays repos-only.
- **Alternative not taken:** Committing the run folder onto the integration branch mid-run.
- **Item:** run
- **How to reverse:** Commit `docs/cart-runs/2026-10-16-harvest-overnight/` wherever it belongs after review.

## D7
- **Decision:** Per-item workers dispatch on the `bulk` tier (sonnet per the seat's era map); collect-and-verify stays on the session model.
- **Why:** `/take` section 6 dispatch tiers; seat CLAUDE.md maps tiers to models.
- **Alternative not taken:** Running every item on the session model.
- **Item:** run
- **How to reverse:** n/a.

## D8
- **Decision:** Item branches are named `cart/harvest-overnight--<NN>-<item-slug>` instead of `cart/harvest-overnight/<NN>-<item-slug>`.
- **Why:** Git cannot hold both `refs/heads/cart/harvest-overnight` and `refs/heads/cart/harvest-overnight/<x>`: "cannot lock ref ... 'refs/heads/cart/harvest-overnight' exists". The layout in `unattended-run.md` § Local branch layout is unbuildable as written.
- **Alternative not taken:** Renaming the integration branch (e.g. `cart/harvest-overnight/integration`), which would break the report template's push commands.
- **Item:** run (spec bug in `unattended-run.md`, `run-report-template.md`, `/build` Unattended Mode)
- **How to reverse:** Fix the spec's naming, then rename branches with `git branch -m`.

## D9
- **Decision:** In `/what-do-you-know`, `CLAUDE_CONFIG_DIR` replaces `~/.claude` for the profile path only; plugin data is always read from `~/.claude/plugins/data/vibe-cartographer/`.
- **Why:** The worker's draft let the config dir stand in for every path. On this machine `~/.claude-personal/plugins/data/vibe-cartographer/sessions/` holds 2 stale files (2026-09-12, 2026-10-02) while the live logger writes to `~/.claude/plugins/data/` (6 files, including tonight's sentinel). Seat rule: plugin data logs stay under `~/.claude/plugins/data/` until the plugins learn `CLAUDE_CONFIG_DIR`.
- **Alternative not taken:** Swapping every path, which would report stale logs as current.
- **Item:** 4 (fix commit on top of the worker's 6637a44)
- **How to reverse:** Revert the `fix(what-do-you-know)` commit.

## D10
- **Decision:** Close-out gates ran as the repo's own checks (`node scripts/check-plugin.js` and `claude plugin validate`, zero warnings) on the integration branch, in place of the vibe-test and vibe-sec gates.
- **Why:** The repo is a markdown-and-small-Node-helpers plugin with no test suite or runtime code for vibe-test to gate, and both gates have exited 2 on win32 before (`unattended-run.md` § Environmental blockers).
- **Alternative not taken:** Invoking the gates for an expected exit 2.
- **Item:** run (close-out)
- **How to reverse:** Run `/vibe-test:gate` and `/vibe-sec:gate` on `cart/harvest-overnight` if either gains coverage for content-only plugins.

## D11
- **Decision:** The push path is to fast-forward `feat/take-over` to `cart/harvest-overnight`, then push `feat/take-over`. Opening a PR from `cart/harvest-overnight` is not recommended.
- **Why:** `feat/take-over` has never been pushed, and the integration branch is its 7007f04 tip plus 11 commits. A PR from `cart/harvest-overnight` to main would mix the /take feature work into a run PR.
- **Alternative not taken:** Pushing `cart/harvest-overnight` as its own PR against main.
- **Item:** run (push step)
- **How to reverse:** Push the integration branch on its own instead.
