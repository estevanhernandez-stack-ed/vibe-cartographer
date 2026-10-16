# Run Brief: harvest-overnight

## Ask
"/take, find the work here, run it overnight" (confirmed with "go" after the harvest trim, 2026-10-16 15:37 CT)

## Source
- **Kind:** harvest (section 3a): evolve proposals, open GitHub issues, 626 dashboard tasks, `claude plugin validate`, sibling vibe-* findings
- **Location:** `proposed-changes.md`, `proposed-changes-harness.md`, issue #1, dashboard project `6vJ7tx2eeW5eZxN9NKrB`, validator output for `plugins/vibe-cartographer`

## Intent
Clear the still-real, one-night-sized work the repo's own sources name, each on a local branch merged into `cart/harvest-overnight`, ready for a morning review and push.

## Done when
- Every item in `list.md` is terminal (merged, held, parked or stopped) in `state.json`.
- `cart/harvest-overnight` passes `claude plugin validate plugins/vibe-cartographer` and the new static check script.
- `report.md` is written.

## Out of scope
- `CLAUDE.md` and `AGENTS.md` at the repo root: uncommitted builder edits in the tree; no item touches them.
- Version bump, CHANGELOG release entry, tags: release is a separate decision.
- Pushing, PRs, closing issue #1, dashboard task status: wait for the push step.
- The "Not this run" items in `list.md`.
- Data deletion in `/what-do-you-know`: destructive data operation, stop-class surface.

## Inferred
- Base is `feat/take-over` HEAD `7007f04`, not `main` (from: the builder's current branch; main lacks 14 commits including the frontmatter fix).
- Cold-start smoke test is cut to static checks a content-only plugin can run in CI without Claude auth (from: dashboard task `9skdcqn1a` plus the repo shipping no runtime build).
- Item checks are `claude plugin validate plugins/vibe-cartographer` plus, after item 3 lands, the new check script (from: repo has no test suite; content-only plugin).
- Run folder stays untracked in the builder's tree; worktrees live in the session scratchpad (from: unattended-run.md "builder's tree never touched" plus estate root hygiene).

## Mode
- **Mode:** Unattended
- **Triggered by:** The ask said so ("run it overnight"). Auto mode active, permission preflight passes.
