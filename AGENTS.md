# Vibe Cartographer

> **Persona:** This repo inherits The Architect from `~/.claude/CLAUDE.md`. No need to re-establish — just adds project context below.

## Tech Stack & Voice

- **Stack:** Node.js (no runtime build — plugin ships as content: markdown SKILLs + commands). Python helpers in `scripts/` for plugin packaging and npm stats. Published as npm package `@esthernandez/vibe-cartographer` (currently v1.7.3) and as a Claude Code plugin via marketplace.
- **Distribution:** Self-marketplace via `.claude-plugin/marketplace.json` (`/plugin marketplace add estevanhernandez-stack-ed/vibe-cartographer`) AND aggregated via the [vibe-plugins](https://github.com/estevanhernandez-stack-ed/vibe-plugins) family marketplace. Version pin lives in vibe-plugins' `marketplace.json` `ref:` field.
- **Brand:** Cyan `#17d4fa` + magenta `#f22f89`, always paired. Navy `#0f1f31` field. Space Grotesk display, Inter body, JetBrains Mono code/meta (uppercase + 0.12em tracking on small labels).
- **Voice:** Builder-to-builder, second person, sentence case. No "empower / leverage / seamlessly / unlock / unleash." Em-dashes welcome. No emoji in CLI output, SKILL bodies, or marketing copy. Tagline: *Imagine Something Else.*

## Design system

Canonical brand spec lives at `~/.claude/skills/626labs-design/` (globally available — same skill across every 626 Labs repo). Use `colors_and_type.css` as the token source and `ui_kits/` as the pattern reference.

## What's where

| Path | What it is |
|---|---|
| [plugins/vibe-cartographer/](plugins/vibe-cartographer/) | The plugin itself — commands, skills, architecture defaults, `plugin.json`. **This is the shipped artifact.** |
| [plugins/vibe-cartographer/commands/](plugins/vibe-cartographer/commands/) | The 11 slash commands users invoke (`onboard`, `scope`, `prd`, `spec`, `checklist`, `build`, `iterate`, `reflect`, `evolve`, `vitals`, `friction`). |
| [plugins/vibe-cartographer/skills/](plugins/vibe-cartographer/skills/) | SKILL.md files backing each command — plus shared helpers: `guide`, `friction-logger`, `session-logger`, `decay`. |
| [plugins/vibe-cartographer/architecture/](plugins/vibe-cartographer/architecture/) | Default architecture patterns the agent loads when the user provides no custom architecture docs. |
| [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) | Solo-repo marketplace manifest. Allows `/plugin marketplace add estevanhernandez-stack-ed/vibe-cartographer`. |
| [docs/](docs/) | Internal Cart artifacts produced by *running Cart on Cart* (meta dogfood): `scope.md`, `prd.md`, `spec.md`, `checklist.md`, `builder-profile.md`, `self-evolving-plugins-framework.md`. |
| [scripts/](scripts/) | `postinstall.js` (npm hook), `atomic-write-json.js` / `atomic-append-jsonl.js` (used by SKILLs for safe state writes), `build-plugin.py` (zip into `.plugin`), `stats.py` (npm download tracking). |
| [bundles/](bundles/) | Historical `.plugin` release bundles (1.0.0 → 1.5.0). **Append-only** — old bundles stay for reproducibility. |
| [.claude/skills/gitnexus/](.claude/skills/gitnexus/) | Bundled GitNexus skill set — code intelligence reference for THIS repo's development. Not shipped to plugin users. |
| [process-notes.md](process-notes.md) | Append-only log of meta-dogfood sessions. |

## Plugin shape: three audiences, one place for runtime rules

1. **End users** install Cart and invoke its slash commands in their own projects. They never see this repo.
2. **Cart developers** (you, here) modify the plugin's commands and SKILLs. The repo root is your workspace; `plugins/vibe-cartographer/` is the artifact.
3. **The plugin's runtime agent** follows [`plugins/vibe-cartographer/skills/guide/SKILL.md`](plugins/vibe-cartographer/skills/guide/SKILL.md), loaded by every command. That is where runtime rules go. Claude Code never loads a `CLAUDE.md` inside a plugin folder, so the old `plugins/vibe-cartographer/CLAUDE.md` was deleted in 1.13.0. This CLAUDE.md (repo root) is for *developing* Cart.

Cart's runtime data lives outside the repo at `~/.claude/plugins/data/vibe-cartographer/` (session logs, friction logs, calibration). The unified builder profile is at `~/.claude/profiles/builder.json` under `plugins.vibe-cartographer.*`. SKILLs read/write these at runtime; nothing in this repo's source tree touches them directly.

## Self-Evolving Plugin Framework

Cart implements the four-level framework documented at [`docs/self-evolving-plugins-framework.md`](docs/self-evolving-plugins-framework.md):

- **L1** — slash commands (the eight workflow commands)
- **L2** — session memory (`session-logger` SKILL appends to `~/.claude/plugins/data/vibe-cartographer/sessions/<date>.jsonl`)
- **L3** — reflective evolution (`/evolve` reads last 30 days of logs and proposes SKILL edits)
- **L3.5** — friction signal + structural self-test (`friction-logger`, `/friction`, `/vitals`)

When editing a SKILL, ask: *which level does this serve?* Cross-level changes need extra care — a tweak at L1 (command behavior) can invalidate L2 data the L3 loop reads.

## Common tasks

| You want to… | Path / command |
|---|---|
| Edit a command's behavior | [`plugins/vibe-cartographer/commands/<name>.md`](plugins/vibe-cartographer/commands/) (loader) AND [`plugins/vibe-cartographer/skills/<name>/SKILL.md`](plugins/vibe-cartographer/skills/) (logic) |
| Edit shared agent behavior across all commands | [`plugins/vibe-cartographer/skills/guide/SKILL.md`](plugins/vibe-cartographer/skills/guide/SKILL.md) |
| Add an architecture default | [`plugins/vibe-cartographer/architecture/default-patterns.md`](plugins/vibe-cartographer/architecture/default-patterns.md) |
| Cut a release | Bump [`package.json`](package.json) + [`plugins/vibe-cartographer/.claude-plugin/plugin.json`](plugins/vibe-cartographer/.claude-plugin/plugin.json) versions (must match), `python scripts/build-plugin.py`, write CHANGELOG entry, tag, push |
| Inspect runtime data | `cat ~/.claude/plugins/data/vibe-cartographer/sessions/$(date +%Y-%m-%d).jsonl` |
| Re-index code intelligence | `npx gitnexus analyze` (auto-runs post-commit/merge via hook) |
| See data contracts | [`plugins/vibe-cartographer/skills/guide/references/data-contracts.md`](plugins/vibe-cartographer/skills/guide/references/data-contracts.md) + sibling JSON schemas |

## Conventions

- **Commits:** Conventional commits — `feat`, `fix`, `chore`, `docs`, `evolve` (for L3 self-improvement applies). Release commits: `chore(release): bump to <version> — <summary>`.
- **Versioning:** [`package.json`](package.json) and [`plugins/vibe-cartographer/.claude-plugin/plugin.json`](plugins/vibe-cartographer/.claude-plugin/plugin.json) versions MUST match. Lockstep — drift confuses the marketplace consumer.
- **SKILL writing:** Each `SKILL.md` is markdown with YAML frontmatter (`name`, `description`; `model` where applicable). Body in second person, builder-to-builder voice.
- **Atomic writes:** SKILLs that touch shared state (profile, session logs, friction logs) MUST use `scripts/atomic-write-json.js` / `scripts/atomic-append-jsonl.js`. Direct `Write` risks corruption on concurrent sessions.
- **Bundles:** Past `.plugin` bundles in [`bundles/`](bundles/) are immutable. Never edit a historical bundle — cut a new release.

## Decisions log

Significant decisions log to the **626Labs Dashboard** via MCP (`mcp__626Labs__manage_decisions log`). Tag with project ID `6vJ7tx2eeW5eZxN9NKrB` (linked repo: `vibe-cartographer`). The bar: *would future-you (or someone asking "why this approach?") want to know this in 3–6 months?*

Especially:
- **Framework changes** — adding/removing patterns, recalibrating friction triggers, evolving the eval rubric
- **Cross-plugin contracts** — anything touching the unified builder profile schema or `~/.claude/plugins/data/` layout
- **Distribution mechanics** — solo-repo vs vibe-plugins aggregator routing, version pinning strategy
- **Persona model** — adding/removing/renaming personas or changing how persona shapes agent behavior
- **Voice corrections** — when a SKILL's output drifted from builder-to-builder voice and we corrected it

Skip the routine: typo fixes, dep bumps, README polish, single-file refactors with no contract change.

## What NOT to do

- **Don't drift the version pair.** [`package.json`](package.json) and [`plugins/vibe-cartographer/.claude-plugin/plugin.json`](plugins/vibe-cartographer/.claude-plugin/plugin.json) versions MUST match. npm consumer reads one; marketplace reads the other. Drift = silent install confusion.
- **Don't change cross-plugin contracts without coordination.** Sibling plugins (vibe-doc, vibe-test, vibe-sec, vibe-thesis) read the shared environment Cart helps define. Coordinated surfaces include: the unified builder profile schema at [`plugins/vibe-cartographer/skills/guide/schemas/builder-profile.schema.json`](plugins/vibe-cartographer/skills/guide/schemas/builder-profile.schema.json) (especially `shared.*`), the session-log + friction-log shapes ([`session-log.schema.json`](plugins/vibe-cartographer/skills/guide/schemas/session-log.schema.json), [`friction.schema.json`](plugins/vibe-cartographer/skills/guide/schemas/friction.schema.json), [`friction-calibration.schema.json`](plugins/vibe-cartographer/skills/guide/schemas/friction-calibration.schema.json)), `shared.preferences.persona` values, Self-Evolving Plugin Framework pattern numbers + names ([`docs/self-evolving-plugins-framework.md`](docs/self-evolving-plugins-framework.md)), and the `@esthernandez/vibe-cartographer` npm package name (hardcoded in `/onboard`'s soft version check). Changes ripple to canary consumers immediately on `main` (solo-repo marketplace) and to stable consumers when the [vibe-plugins aggregator's `ref:` field](https://github.com/estevanhernandez-stack-ed/vibe-plugins/blob/main/.claude-plugin/marketplace.json) bumps. Surface any coordinated change via a dashboard decision before merging — and check whether sibling plugins need a paired update.
- **Don't hand-edit `bundles/*.plugin`.** Past releases are immutable. Fix forward with a new release.
- **Don't write directly to `~/.claude/plugins/data/vibe-cartographer/` from a SKILL.** Use the atomic helpers in [`scripts/`](scripts/). Direct writes risk concurrent-session corruption.
- **Don't modify the `<!-- gitnexus:start -->` … `<!-- gitnexus:end -->` block by hand.** GitNexus owns it and rewrites it on every `npx gitnexus analyze`. Hand edits get clobbered. Keystone content goes outside the markers.
- **Don't skip SKILL frontmatter.** Missing `name` or `description` = the SKILL doesn't load.

## References

- Plugin runtime spec: [`plugins/vibe-cartographer/skills/guide/SKILL.md`](plugins/vibe-cartographer/skills/guide/SKILL.md)
- Self-Evolving Plugin Framework: [`docs/self-evolving-plugins-framework.md`](docs/self-evolving-plugins-framework.md)
- Data contracts: [`plugins/vibe-cartographer/skills/guide/references/data-contracts.md`](plugins/vibe-cartographer/skills/guide/references/data-contracts.md)
- Architecture defaults: [`plugins/vibe-cartographer/architecture/`](plugins/vibe-cartographer/architecture/)
- Aggregated marketplace: [`vibe-plugins/.claude-plugin/marketplace.json`](https://github.com/estevanhernandez-stack-ed/vibe-plugins/blob/main/.claude-plugin/marketplace.json)
- GitNexus tooling reference: see the `<!-- gitnexus:start -->` block below

---

<!-- gitnexus:start -->

## GitNexus index

Indexed as **vibe-cartographer** — 738 symbols, 797 relationships, 0 execution flows. Resources are under `gitnexus://repo/vibe-cartographer/`.
How to use the tools is in the global `gitnexus` skill. If a tool reports the
index stale, run `npx gitnexus analyze`.

<!-- gitnexus:end -->
