# Run List: harvest-overnight

- [x] **1. `/build` step-by-step executes an executable Verify field before asking the builder**
  Spec ref: `proposed-changes-harness.md > ### 1. Verify-fields ... (do-now slice, Verify-execution half)`
  What to build (S): In `plugins/vibe-cartographer/skills/build/SKILL.md` Step-by-Step Mode "#### 3. Verify (if opted in)", add: when the item's Verify field names a runnable command, the agent runs it first and asserts the expected output. On a non-zero exit or missing expected output, it re-enters the item with the failure framed as a remediation instruction (example line), and does not mark the item done. Visual or interactive Verify fields still go to the builder, as today. Never auto-run a mutating command to verify (reuse the deploy-verify rule wording). If `skills/checklist/SKILL.md` describes how Verify is written, add one line nudging toward an executable command where possible. Touch no other section.
  Acceptance: Done when the Verify subsection describes agent-run-first, remediation framing, visual fallback and the no-mutating-commands rule; `commands/build.md` needs no change or is updated in parity; validator passes.
  Verify: Run `claude plugin validate plugins/vibe-cartographer` and confirm it passes; `grep -n "remediation" plugins/vibe-cartographer/skills/build/SKILL.md` shows the new lines.
  Stop class: go

- [x] **2. Plugin-root CLAUDE.md content lives in the guide SKILL, and the unloaded file is gone**
  Spec ref: `claude plugin validate > warning: root: CLAUDE.md at the plugin root is not loaded as project context`
  What to build (M): Compare `plugins/vibe-cartographer/CLAUDE.md` with `skills/guide/SKILL.md`. Move every rule that is not already in the guide into the guide, in the guide's voice and in the section where it fits (no duplicate wording). Then delete `plugins/vibe-cartographer/CLAUDE.md`. Grep the plugin tree, `scripts/build-plugin.py` and docs for references to that file and repoint them to the guide. Do not edit the repo-root `CLAUDE.md` or `AGENTS.md`; list any needed keystone change in the report instead.
  Acceptance: Done when the validator passes with zero warnings, no rule from the old file is lost (worker lists each rule and where it landed), and no remaining reference points at the deleted file except the repo-root keystone (reported, not edited).
  Verify: Run `claude plugin validate plugins/vibe-cartographer` and confirm no warnings; `grep -rn "vibe-cartographer/CLAUDE.md" plugins scripts` returns nothing.
  Stop class: go

- [x] **3. Static plugin check script plus a CI workflow that runs it**
  Spec ref: `dashboard task-1776267036311-9skdcqn1a (Cold-start smoke test in CI)` + `GitHub issue #1`
  What to build (S-M): A zero-dependency Node script `scripts/check-plugin.js` (repo root `scripts/`, not shipped in the plugin) that exits non-zero on: a SKILL.md or command .md whose frontmatter is missing, unterminated, or lacks `name`/`description` (SKILLs) or `description` (commands); frontmatter values that would fail YAML parsing in the ways issue #1 hit (unescaped inner double quotes in a double-quoted scalar, an unquoted value containing `: `, tab indentation); a `commands/<x>.md` with no `skills/<x>/` or the reverse, allowing the documented internal skills (guide, session-logger, friction-logger, decay, friction-log) to have no command; `package.json` version not equal to `.claude-plugin/plugin.json` version. Plus `.github/workflows/check.yml` running it on push and pull_request with Node. Do not add npm dependencies.
  Acceptance: Done when `node scripts/check-plugin.js` exits 0 on the branch, exits non-zero on a deliberately broken temp copy (worker demonstrates with a scratch fixture, not committed), and the workflow file is valid YAML that runs the script.
  Verify: Run `node scripts/check-plugin.js` (exit 0), then the broken-fixture demo (exit 1 with a clear message).
  Stop class: go

- [x] **4. Read-only `/vibe-cartographer:what-do-you-know` transparency command**
  Spec ref: `dashboard task-1776267036311-xiv0k1rdm` + `skills/session-logger/SKILL.md line 232 (future /what-do-you-know)`
  What to build (M): New `skills/what-do-you-know/SKILL.md` (frontmatter name + description) and `commands/what-do-you-know.md` loader, matching how `/friction` and `/vitals` are structured. It reads and summarizes in plain language: the unified builder profile (`shared.*` and `plugins.vibe-cartographer.*`, resolved per `$CLAUDE_CONFIG_DIR` the way the guide resolves it), session logs (counts by command, date range, last N), friction and calibration logs, and any other data files the plugin writes. Read-only: it writes nothing, and says where each file lives so the builder can inspect or delete it by hand. No deletion feature. Wire it like every new command: `friction-triggers.md` row (or documented-empty), `/vitals` check coverage if vitals enumerates commands, the guide's command list, flip the session-logger "future" pointer, add it to the command list in `package.json` and `plugin.json` descriptions. No version bump.
  Acceptance: Done when both files exist with valid frontmatter, every wiring site above is updated, the SKILL states it is read-only and names every data path, and the validator plus `node scripts/check-plugin.js` pass.
  Verify: Run `claude plugin validate plugins/vibe-cartographer` and `node scripts/check-plugin.js`; `grep -rn "future .*what-do-you-know" plugins` returns nothing.
  Stop class: go

- [x] **5. `/vibe-cartographer:next` tells the builder which chain step is next**
  Spec ref: `dashboard task-1776299273316-i8ap9towo (/cartographer-next meta-command)`
  What to build (S-M): New `skills/next/SKILL.md` + `commands/next.md`. Reads `docs/` artifact presence (builder-profile.md, scope.md, prd.md, spec.md, checklist.md with unchecked items, reflection.md) and prints the current step and the next command, client-aware handoff phrasing per the guide's Handoff section. Mentions an unfinished `docs/cart-runs/*` run as resumable via `/take`. Read-only, writes nothing. Same wiring as item 4 (friction-triggers row, vitals, guide command list, package.json and plugin.json descriptions).
  Acceptance: Done when both files exist with valid frontmatter, the artifact-to-next-step table covers every chain step, wiring is updated, and validator plus check script pass.
  Verify: Run `claude plugin validate plugins/vibe-cartographer` and `node scripts/check-plugin.js`.
  Stop class: go

Dependencies: items 4 and 5 use the check script from item 3 when it is merged; if item 3 is parked, they verify with the validator alone.

## Not this run

- L2 choice-history logging to `choices.jsonl` (`task-1776267036311-4rmz8qxse`): a new data contract wired into every optional branch across the SKILL tree.
- L3 layered memory resolution (`task-1776267036311-4dspyyoxl`): framework-level precedence model across all commands.
- Project registry for cross-project memory (`task-1776289724485-5c8t8srs5`): new subsystem that reads `~/.claude/projects/`, with privacy design needed.
- Cross-plugin beacons (`task-1776289724485-9rkng3o3y`): cross-plugin contract that siblings must adopt together.
- TDD green-loop `/build` mode (`proposed-changes-harness.md > ### 2`): new mode, full cycle.
- Parallel agent swarms for `/build` (`proposed-changes-harness.md > ### 3`): ~v2.0 scope.
