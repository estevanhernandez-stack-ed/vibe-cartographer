# Vibe Cartographer

> **Persona:** This repo inherits The Architect from `~/.claude/CLAUDE.md`. No need to re-establish — just adds project context below.

The plugin that builds the other plugins. Ships as content, not code — markdown SKILLs and commands, no runtime build. `plugins/vibe-cartographer/` is the shipped artifact; the repo root is the workspace around it.

Distributed two ways at once: its own solo marketplace (`/plugin marketplace add estevanhernandez-stack-ed/vibe-cartographer`, tracks `main`, canary) and the vibe-plugins family aggregator (pinned by `ref:`, stable). Changes hit canary consumers the moment they land on `main`.

## Gotchas

- **The runtime agent's rules live in the guide skill, not in a CLAUDE.md.** This file is for *developing* Cart. What the agent follows when a user runs a Cart command is [`plugins/vibe-cartographer/skills/guide/SKILL.md`](plugins/vibe-cartographer/skills/guide/SKILL.md). Claude Code never loads a `CLAUDE.md` inside a plugin folder (`claude plugin validate` warns about it), so the old `plugins/vibe-cartographer/CLAUDE.md` was deleted in 1.13.0. Never recreate it; put runtime guidance in a skill.
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

- Runtime agent spec: [`plugins/vibe-cartographer/skills/guide/SKILL.md`](plugins/vibe-cartographer/skills/guide/SKILL.md)
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

## GitNexus index

Indexed as **vibe-cartographer** — 738 symbols, 797 relationships, 0 execution flows. Resources are under `gitnexus://repo/vibe-cartographer/`.
How to use the tools is in the global `gitnexus` skill. If a tool reports the
index stale, run `npx gitnexus analyze`.

<!-- gitnexus:end -->
