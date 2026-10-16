<!-- The morning report. Open with the tally line, then the five sections
     below, in this order. Drop nothing: an empty section says "None." -->

# Run Report: [slug]

N merged, N held, N parked, N stopped.

## Ready to push
- **Integration branch:** `cart/[slug]` (base `[sha]`)
- **Commits:** [N commits, one per merged item, listed oneline]
- **Checks:** [Per item or overall: command, result. Close-out gates (vibe-test, vibe-sec) and their findings, or the logged fallback.]

To push and open the PR(s):
```bash
git push -u origin cart/[slug]
gh pr create --base [base-branch] --head cart/[slug] --title "[title]" --body "[body]"
```
Pushing waits for your say-so. Tell Cart "push it", or name a subset.

## Waiting on you
One block per `hold` item. Dependents built on a hold branch stack under it.

- **Item [NN]: [title]** (`cart/[slug]/[NN]-[item-slug]`)
  - Look at: [files, behavior]
  - Held because: [surface touched: money, auth, permissions, ...]
  - Stacked on this hold, also held:
    - **Item [NN]: [title]** (`cart/[slug]/[NN]-[item-slug]`, built on the branch above)
    - **Item [NN]: [title]** (`cart/[slug]/[NN]-[item-slug]`, built on the item above)

## Parked
- **Item [NN]: [title]** (`cart/[slug]/[NN]-[item-slug]`)
  - Failure: [what failed, exact error]
  - Tried: [attempts and checks]
  - Next move: [suggested fix]
  - Dependents parked with it: [items and reasons, or "none"]

## Stopped
- **Item [NN]: [title]**
  - Surface: [secrets, deploy, prod data, ...]
  - What it would take: [write-up of the steps and who does them]

## Decisions to skim
Full ledger: `decisions.md`. Highest stakes:
- D[n]: [one line]
- D[n]: [one line]

## Left untouched
Uncommitted files in your tree at run start. The run cut from the last commit and did not stash, reset or check out over them.
- [path] or "None."
