# /take dogfood: vibe-cartographer, 2026-10-16

Ask: "/take, find the work here, run it overnight." Loaded from the branch with `claude --plugin-dir`. Run folder: `docs/cart-runs/2026-10-16-harvest-overnight/`.

| Check | Result |
|---|---|
| `/vitals` checks #1, #2, #6 | Not run as `/vitals`; covered by `claude plugin validate` (0 warnings) and `scripts/check-plugin.js` (21 skills, 17 commands, 1.13.0) |
| Harvest swept every source | Pass: 7 dashboard tasks, issue #1, both proposal files, validator, sibling findings (none on disk) |
| Harvest dropped done work with evidence | Pass: 6 drops, each with a commit or file |
| Harvest waited for trim | Pass |
| Run folder complete | Pass: brief, list, state.json, decisions (D1-D11), report |
| Local only | Pass: `git ls-remote origin "refs/heads/cart/*"` empty after the run |
| Working tree untouched | Pass: dirty `AGENTS.md` / `CLAUDE.md` left alone and listed in the report |
| Hold class | Pass (pre-tag round 5, 2 of 2 fresh repos): auth item built on `cart/<slug>--02-...`, held unmerged |
| Kill mid-item and resume | Pass (rounds 1, 4, 5): resumed at item 2, item 1 not redone |
| Permission preflight, auto mode off | Pass (round 1): asked before any work, nothing created |
| Attended daytime `/build` regression | Pass: identical to a v1.12.0 baseline on the same fixture |
| Signal check (window / 8+ items) | Not tested; the ask said "overnight" explicitly |

## What the dogfood caught

- **Item-branch layout was impossible in git.** `cart/<slug>/<NN>-<item>` cannot coexist with a `cart/<slug>` branch. The run used `cart/<slug>--<NN>-<item>`, logged it as D8, and flagged it in the report. Fixed in the reference, spec and plan (7eddea4).
- **Dogfooding inside Cart's own repo masks the plugin-root CLAUDE.md bug**, because Claude Code lazy-loads nested CLAUDE.md files from the working tree. Item 2's proof is the validator warning disappearing, not agent behavior.
- **Session logs live in two homes on Dunder** (`~/.claude/plugins/data/` live, `~/.claude-personal/plugins/data/` stale). Logged as D9; left for the data-home spec.

## Pre-tag checks (headless, throwaway repos, 2026-10-16)

Five rounds. What they caught, in order:

1. **Prose-only rules held half the time.** In a clean repo `/take` improvised: checked out over the builder's tree, no per-item branches, renamed run files, parked the auth item instead of holding it. Inlining the rules passed once, then failed on identical inputs.
2. **Windows path length** broke a worktree and the run fell back to the builder's tree. Now short roots, and park instead of fall back.
3. **Root cause: command wrappers shadow their skills.** `/vibe-cartographer:<x>` delivered only the 3-8 line `commands/<x>.md` body; `SKILL.md` never loaded. Proven by diagnostic runs for `/take` and `/build`, and by moving the wrapper aside. Every wrapper now points at `${CLAUDE_PLUGIN_ROOT}/skills/<x>/SKILL.md`; `check-plugin.js` enforces it. Dogfooding inside the Cart repo hid this, because the agent could find `SKILL.md` on disk.
4. **`cart-run.js`** now owns the mechanics (run folder, state, branches, worktrees, merges, park, resume), with 9 tests in CI. Worktree roots are keyed by repo + run so same-named runs in two repos don't collide.

Round 5, against the final tree: hold x2 and resume all pass with the exact layout.
