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
| Hold class | Not exercised: no auth or money item in this backlog |
| Kill mid-item and resume | Not tested |
| Permission preflight, auto mode off | Not tested (only the auto-mode-on path ran) |
| Attended daytime `/build` regression | Not tested this run |
| Signal check (window / 8+ items) | Not tested; the ask said "overnight" explicitly |

## What the dogfood caught

- **Item-branch layout was impossible in git.** `cart/<slug>/<NN>-<item>` cannot coexist with a `cart/<slug>` branch. The run used `cart/<slug>--<NN>-<item>`, logged it as D8, and flagged it in the report. Fixed in the reference, spec and plan (7eddea4).
- **Dogfooding inside Cart's own repo masks the plugin-root CLAUDE.md bug**, because Claude Code lazy-loads nested CLAUDE.md files from the working tree. Item 2's proof is the validator warning disappearing, not agent behavior.
- **Session logs live in two homes on Dunder** (`~/.claude/plugins/data/` live, `~/.claude-personal/plugins/data/` stale). Logged as D9; left for the data-home spec.

## Before release

Run the three untested paths once (resume, preflight with auto mode off, attended `/build` regression), or ship with them named as known-untested in the PR.
