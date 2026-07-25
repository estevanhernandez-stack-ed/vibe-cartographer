# Vibe Cartographer

> **Persona:** This repo inherits The Architect from `~/.claude/CLAUDE.md`. No need to re-establish — just adds project context below.

The plugin that builds the other plugins. Ships as content, not code — markdown SKILLs and commands, no runtime build. `plugins/vibe-cartographer/` is the shipped artifact; the repo root is the workspace around it.

Distributed two ways at once: its own solo marketplace (`/plugin marketplace add estevanhernandez-stack-ed/vibe-cartographer`, tracks `main`, canary) and the vibe-plugins family aggregator (pinned by `ref:`, stable). Changes hit canary consumers the moment they land on `main`.

## Gotchas

- **There are two `CLAUDE.md` files and they serve different audiences.** This one is for *developing* Cart. [`plugins/vibe-cartographer/CLAUDE.md`](plugins/vibe-cartographer/CLAUDE.md) is read by the runtime agent when a user invokes a Cart command in their own project. Editing the wrong one breaks the wrong audience, silently.
- **`package.json` and `plugin.json` versions must match.** npm consumers read one, the marketplace reads the other. Drift produces silent install confusion, not an error.
- **Editing a command means editing two files.** `commands/<name>.md` is the loader; `skills/<name>/SKILL.md` is the logic. Changing one alone is the most common way to ship a no-op.
- **Cross-plugin contracts ripple.** vibe-doc, vibe-test, vibe-sec, and vibe-thesis read surfaces this repo defines: the builder-profile schema (especially `shared.*`), the session-log and friction-log shapes, `shared.preferences.persona` values, the framework's pattern numbers and names, and the `@esthernandez/vibe-cartographer` package name hardcoded in `/onboard`'s version check. Log a decision before merging a change to any of them, and check whether a sibling needs a paired update.
- **SKILLs must never write to `~/.claude/plugins/data/vibe-cartographer/` directly.** Use `scripts/atomic-write-json.js` and `scripts/atomic-append-jsonl.js`. Direct writes corrupt state when sessions run concurrently, and Este runs many.
- **A SKILL with missing `name` or `description` frontmatter does not load.** No error, it is simply absent.
- **`bundles/*.plugin` are immutable.** Past releases stay reproducible. Fix forward with a new release; never edit a historical bundle.
- **Don't hand-edit between the `<!-- gitnexus:start -->` and `<!-- gitnexus:end -->` markers.** GitNexus rewrites that block on every `npx gitnexus analyze`, which a post-commit hook triggers. Keystone content goes outside the markers.
- **Cross-level edits need care.** An L1 change (command behavior) can invalidate the L2 session data that the L3 `/evolve` loop reads. Ask which level a change serves before making it.

## Non-standard conventions

- **`evolve` is a commit type here**, alongside the usual set — used when an L3 self-improvement proposal is applied.
- **Runtime data lives outside the repo**, at `~/.claude/plugins/data/vibe-cartographer/` and `~/.claude/profiles/builder.json` under `plugins.vibe-cartographer.*`. Nothing in the source tree touches them; SKILLs do, at runtime.
- **`.claude/skills/gitnexus/` is for developing this repo.** It is not shipped to plugin users.

## Rationale

`docs/` holds Cart artifacts produced by running Cart on Cart. They are a meta-dogfood record, not templates — read them as history rather than as the current spec.

## Pointers

- Runtime agent spec: [`plugins/vibe-cartographer/CLAUDE.md`](plugins/vibe-cartographer/CLAUDE.md)
- Self-Evolving Plugin Framework, the L1/L2/L3/L3.5 model: [`docs/self-evolving-plugins-framework.md`](docs/self-evolving-plugins-framework.md)
- Data contracts and JSON schemas: [`plugins/vibe-cartographer/skills/guide/references/data-contracts.md`](plugins/vibe-cartographer/skills/guide/references/data-contracts.md)
- Shared agent behavior across every command: [`plugins/vibe-cartographer/skills/guide/SKILL.md`](plugins/vibe-cartographer/skills/guide/SKILL.md)
- Architecture defaults loaded when a user supplies none: [`plugins/vibe-cartographer/architecture/`](plugins/vibe-cartographer/architecture/)
- Release procedure: bump both versions, `python scripts/build-plugin.py`, CHANGELOG, tag, push
- Brand tokens and voice: `~/.claude/skills/626labs-design/` and `~/.claude/CLAUDE.md` are canonical. Repo-specific only: no emoji in CLI output, SKILL bodies, or marketing copy.
- Family aggregator pin: [`vibe-plugins/.claude-plugin/marketplace.json`](https://github.com/estevanhernandez-stack-ed/vibe-plugins/blob/main/.claude-plugin/marketplace.json)

## Decisions log

Significant decisions log to a decision-log MCP when one is available — the 626Labs Dashboard is auto-detected, project ID `6vJ7tx2eeW5eZxN9NKrB`. Optional: fall back to a file or your tracker, or skip.

The bar: would someone asking "why this approach?" want to know in 3-6 months. Especially framework changes (patterns, friction triggers, the eval rubric), cross-plugin contract changes, distribution and version-pinning mechanics, persona-model changes, and voice corrections where a SKILL's output drifted and got pulled back.

Skip the routine: typo fixes, dep bumps, README polish, single-file refactors with no contract change.

---

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **vibe-cartographer** (738 symbols, 797 relationships, 0 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/vibe-cartographer/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/vibe-cartographer/context` | Codebase overview, check index freshness |
| `gitnexus://repo/vibe-cartographer/clusters` | All functional areas |
| `gitnexus://repo/vibe-cartographer/processes` | All execution flows |
| `gitnexus://repo/vibe-cartographer/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
