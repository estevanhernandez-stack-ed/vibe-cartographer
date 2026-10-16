# Run Report: harvest-overnight

5 merged, 0 held, 0 parked, 0 stopped.

**Read this first:** the first real unattended run found a bug in the spec it was running under. `unattended-run.md` § Local branch layout names item branches `cart/<slug>/<NN>-<item>` under an integration branch `cart/<slug>`. Git refuses that (`cannot lock ref ... 'refs/heads/cart/harvest-overnight' exists`). This run used `cart/harvest-overnight--<NN>-<item>` (D8). The fix belongs in `unattended-run.md`, `run-report-template.md` and `/build` Unattended Mode before 1.13.0 ships. It was not added to tonight's list, because scope was set at the harvest trim.

## Ready to push
- **Integration branch:** `cart/harvest-overnight` (base `7007f04`, the tip of `feat/take-over`)
- **Commits:** 6 work commits plus 5 local merge commits:
  - `5f2b732` feat(build): run executable Verify fields before asking the builder
  - `d297469` refactor(guide): absorb plugin-root CLAUDE.md, which Claude Code never loads
  - `f735efd` ci: static plugin check for frontmatter, parity, and version pair
  - `6637a44` feat(what-do-you-know): read-only transparency command for everything Cart stores
  - `f9078ea` fix(what-do-you-know): CLAUDE_CONFIG_DIR swaps the profile path only
  - `39967b6` feat(next): /next reads docs/ and names the next chain step
- **Checks:**
  - Every item passed on its first attempt with `claude plugin validate plugins/vibe-cartographer`. Items 3 to 5 also passed `node scripts/check-plugin.js`.
  - Close-out on the integration branch: both pass, and the validator reports zero warnings (it reported one warning before item 2). Summary line: "OK: 21 skills, 17 commands, version 1.13.0."
  - The vibe-test and vibe-sec gates were replaced by the repo's own checks (D10).
  - Proof for item 3: run against `main`'s tree, `check-plugin.js` flags all 5 frontmatter defects that `18946dc` fixed (issue #1).

`feat/take-over` has never been pushed, and the integration branch is its tip plus this run. The recommended path (D11):
```bash
git -C C:/Users/estev/Projects/vibe-cartographer merge --ff-only cart/harvest-overnight   # on feat/take-over; your dirty CLAUDE.md/AGENTS.md are untouched by the run
git -C C:/Users/estev/Projects/vibe-cartographer push -u origin feat/take-over
gh pr create --base main --head feat/take-over --title "feat: /take, harvest step, and first overnight run" --body "..."
```
Pushing waits for your say-so. Tell Cart "push it", or name a subset. After the merge to main: close issue #1, and update the dashboard tasks `9skdcqn1a` (cold-start, done as static checks), `xiv0k1rdm` (what-do-you-know, read-only half done) and `i8ap9towo` (/next).

## Waiting on you
None.

## Parked
None.

## Stopped
None. The deletion half of `/what-do-you-know` was scoped out at planning as a stop-class surface (D3). The steps for it are a per-file confirm flow in an attended run.

## Decisions to skim
Full ledger: `decisions.md` (D1 to D11). Highest stakes:
- D8: branch naming deviates from the spec because the spec's layout is impossible in git.
- D9: in `/what-do-you-know`, `CLAUDE_CONFIG_DIR` swaps only the profile path. On Dunder, `~/.claude-personal/plugins/data/vibe-cartographer/sessions/` holds 2 stale files (2026-09-12, 2026-10-02). The live logs are in `~/.claude/plugins/data/`. Spec 2 should settle where data lives.
- D2: the cold-start smoke test became a static check. The line-based parser is not a full YAML parser.
- D1: the run is based on `feat/take-over`, not `main`.

## Hand edits for you (files the run would not touch)
Your uncommitted `CLAUDE.md` and `AGENTS.md` still describe the deleted `plugins/vibe-cartographer/CLAUDE.md`:
- `CLAUDE.md`, Gotchas: the "two `CLAUDE.md` files" bullet should say the runtime spec is `plugins/vibe-cartographer/skills/guide/SKILL.md`, since Claude Code never loads a plugin-root CLAUDE.md.
- `CLAUDE.md`, Pointers: change "Runtime agent spec" to point at the guide SKILL.
- `AGENTS.md`: update lines 35 and 95 the same way, and drop the "two CLAUDE.md files" bullet on line 89.

## Follow-ups noticed, not built
- The `/build` Autonomous Mode verification checkpoint could run Verify commands first too. Item 1 covered step-by-step only.
- The guide's frontmatter and its Tier-1 list still say "nine commands". The real count is 17 commands.
- The CHANGELOG has no entry for these 6 commits yet. That is left for the release decision.
- Sibling vibe-* plugins may ship the same dead plugin-root CLAUDE.md.
- No Cart SKILL handles `CLAUDE_CONFIG_DIR` for the profile path. They rely on the seat mapping.

## Left untouched
Uncommitted files in your tree at run start. The run cut from the last commit and did not stash, reset or check out over them.
- `AGENTS.md`
- `CLAUDE.md`

Also untracked: this run folder, `docs/cart-runs/2026-10-16-harvest-overnight/`. Item worktrees were removed, and all six branches remain.
