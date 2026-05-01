# Horizon Brief — vibe-keystone Update: Bake the Hygiene Rules into Bootstrapped CLAUDE.md

> **Status:** Design brief. Not implemented in *this* cycle (vibe-keystone lives in its own solo repo at `github.com/estevanhernandez-stack-ed/vibe-Keystone`). Authored as a ready-to-execute change for the next vibe-keystone cycle.
>
> **Source:** Claude Code Insights findings (2026-05-01). The four hygiene rules added to `~/.claude/CLAUDE.md` should propagate to every CLAUDE.md keystone produces.
>
> **Effort estimate:** Small — single SKILL.md edit + a new section in the bootstrap output template. ~30 minutes once vibe-keystone is open.

## Why this matters most for keystone

Of all the plugins in the family, **vibe-keystone has the highest leverage for propagating these findings**. It's the bootstrap that produces a 626Labs-pattern (or tenant-adapted) CLAUDE.md for any new repo. A new "Hygiene rules" section added to keystone's output template means every NEW repo created via `/keystone` from this point forward inherits the four rules without manual copy-paste.

This is the cross-plugin equivalent of "ship once, applies everywhere."

## What to add to vibe-keystone's SKILL output template

The current vibe-keystone SKILL produces an ordered set of sections (per the SKILL spec):

1. Title + persona inheritance note
2. Tech Stack (& Voice if applicable)
3. Design system (conditional)
4. What's where
5. Domain-specific section (conditional)
6. Common tasks
7. Conventions
8. Decisions log (conditional)
9. What NOT to do
10. References (conditional)

**Add a new section between 7 (Conventions) and 8 (Decisions log): Hygiene rules.** Universal across all repo types (code platform, marketing/content site, long-form writing, infrastructure/mixed).

### Proposed new section template

```markdown
## Hygiene rules

Universal hygiene from observed agent friction patterns. These apply to every command, every session, every repo type.

### Output discipline (write-to-file before chat)

For deliverables longer than ~300 words (specs, PRDs, reflections, blog posts, audit reports, ADRs), write directly to a file first. Then reply in chat with: (1) the file path, (2) a 2-sentence summary, (3) the next action. Never both the full content and chat output.

**Reason:** output token limits cause API errors and lost work. File-first dodges the ceiling and makes artifacts diffable.

### Working directory discipline

Always verify `pwd` (or the equivalent) before running git, npm, gh, marketplace, or deploy commands after any `cd` in the same session. When working across multiple repos in one session, prefer absolute paths.

**Reason:** shell state can stick across tool calls; assuming it persisted correctly is a bug class that has shipped commits to the wrong repo.

### Verify before synthesizing

When a subagent's findings contradict a prior audit or earlier-in-the-session conclusion, re-verify the contradicting claim directly before incorporating it. Don't speculate about external system behavior (vendor API tiers, third-party rate limits, network state) without evidence — say "I don't know" and ask.

**Reason:** speculation framed as fact is a recurring failure mode; subagent contradictions silently incorporated cause downstream errors.

### Scope discipline at task kickoff

Match the scope of the user's ask. For ambiguous opening messages, confirm the desired depth in one short question before diving in. Don't pivot to architecture review when a quick wrapper was wanted.

**Reason:** scope/intent misreads are the dominant friction class observed in usage analytics. A single confirmation beat is cheaper than re-doing the work.
```

## What stays the same in vibe-keystone

- Tenant interview at the start (626Labs vs other tenant — defaults vs adapt).
- Persona inheritance question.
- Repo-type detection (code platform / marketing / writing / mixed).
- Section ordering (other than the new one).
- "What NOT to do" guardrails.
- Decision-log section variants.

## Tenant adaptation

The four hygiene rules are universal — they're not 626Labs-specific. They apply to any tenant. **No need to gate them behind the tenant interview.** Every CLAUDE.md keystone produces, regardless of tenant, should include them.

(Optional: tenant docs may have their own hygiene rules they want to add — keystone's tenant-doc-reading step can append tenant-specific rules to the section after the universal four.)

## Migration for existing repos

For repos that already have a keystone-produced CLAUDE.md:

- **Don't auto-rewrite.** Per vibe-keystone's existing discipline, never overwrite an existing CLAUDE.md without showing a diff and confirming.
- **Offer a `/keystone refresh` mode** (or similar) that detects an old CLAUDE.md, offers to add the new Hygiene rules section, confirms, applies.
- **Or: leave alone, surface in `/keystone audit`** — keystone could grow an audit mode that detects missing sections in existing CLAUDE.md files and proposes additions.

## How to dispatch this update

```
# In the vibe-Keystone repo:
cd ~/Projects/vibe-Keystone  # or wherever the solo repo lives

# Run /onboard with a brief
"Update vibe-keystone to bake in the four hygiene rules from the Claude
Code Insights findings. Reference:
~/Projects/vibe-cartographer/docs/horizon/keystone-hygiene-rules-update.md.
Add the new 'Hygiene rules' section between Conventions and Decisions log
in the SKILL output template. Cut any tenant-specific gating for these
rules — they're universal."

# Walk through /scope → /prd → /spec → /checklist → /build → /reflect.
# Estimated cycle length: 30-60 minutes.
```

## Why this is a separate cycle, not absorbed into today's work

- **vibe-keystone lives in its own solo repo.** Cross-repo edits in a single Cart cycle are out of scope per Cart's plugin-sovereignty discipline.
- **Cleaner change history.** A dedicated keystone cycle gets its own commits, CHANGELOG, version bump, and release tag — easier to track and roll back if needed.
- **Tenant-aware design discipline.** vibe-keystone's tenant adaptation is delicate; a focused cycle gives the right space to verify the new section works correctly across all tenant types.
