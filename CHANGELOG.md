<!-- markdownlint-disable MD024 -->
<!-- Keep-a-Changelog uses duplicate "Added / Changed / Fixed" headings per version by design. -->

# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Nothing yet.

## [1.4.0] — 2026-04-16 — Ecosystem-Aware Composition (Pattern #13)

### Added

- **Pattern #13 in the Self-Evolving Plugin Framework: Ecosystem-Aware Composition.** Plugins should detect and defer to complementary capabilities the user has installed (other plugins, MCPs, skills) rather than reinventing them. Two layers: anchored (curated complement table) plus dynamic (live discovery via heuristics). The plugin defers — it doesn't absorb the complement's behavior.
- **`Ecosystem-Aware Composition` section** in the guide SKILL with a curated complements table mapping known specialists to specific Vibe Cartographer phases. Includes `superpowers:brainstorming` for `/scope`, `superpowers:writing-plans` for `/spec` and `/checklist`, `superpowers:test-driven-development` for `/build`, `superpowers:systematic-debugging` for build failures, `superpowers:dispatching-parallel-agents` for autonomous builds, `superpowers:verification-before-completion` for build verification, `superpowers:requesting-code-review` for `/reflect`, the `claude_ai_Figma` MCP for `/spec` design phase, Playwright MCP for E2E spec'ing, and the `gh` CLI for issue/release publishing.
- **Live-discovery heuristics** for unknown-but-useful complements (test/doc/review/planning/design/browser-automation skills) with a conservative default: when in doubt, don't announce.
- **`complements_invoked` field** added to the session-logger schema so `/evolve` can see which complements actually get accepted vs ignored over time.
- **Composition rules and "when NOT to defer" guardrails** to protect persona, mode, document-format contracts, session-logging contracts, and the one-question-at-a-time rule.

### Changed

- The framework doc's pre-existing markdownlint warnings (emphasis-as-heading, fenced-code-language, blanks-around-fences, blanks-around-lists) cleaned up while the section was added.

## [1.3.0] — 2026-04-15 — `/onboard` project origin + three-track `/evolve`

First live `/evolve` run surfaced two applied changes, dogfooded and shipped the same night.

### Added

- **`/onboard` Step 6: Starting Point.** A new free-form question captures where the project is starting from — blank folder, existing repo being extended, no-code prototype (Bolt, Lovable, v0, Replit Agent) being escaped, or something else. Saved to `docs/builder-profile.md` under `## Project Origin`. Downstream commands adapt: greenfield gets the full scripted flow, no-code escape compresses `/scope` and `/prd` and focuses `/spec`/`/build` on translating the prototype into maintainable code, existing-repo pulls architecture from the codebase.
- **`/evolve` three-track classification.** Every observation surfaced by `/evolve` is now classified up front into exactly one of three tracks before any proposal lands:
  - **Plugin track** — universal patterns get SKILL file edits, shipped on next release to every user.
  - **Personal track** — idiosyncratic preferences get written to `plugins.vibe-cartographer` in the unified profile, affecting only this builder's future sessions.
  - **Community track (opt-in)** — signals the builder suspects might be universal get appended to `~/.claude/plugins/data/vibe-cartographer/community-signals.jsonl` on the local machine only. **Nothing is ever transmitted** — export is always builder-initiated.
- **Community signals privacy contract** baked into the SKILL: local-only, opt-in per observation, no PII (no names, paths, or code content), transparent schema the builder can audit anytime.

### Changed

- `/evolve` now defaults to Personal-track classification when in doubt. Plugin-track is the exception, not the default — every Plugin edit is a public commitment to every future user.

## [1.2.0] — 2026-04-15 — `/evolve` + Level 3

Vibe Cartographer hits **Level 3 of the Self-Evolving Plugin Framework** — the plugin now reflects on its own session history and proposes SKILL edits.

### Added

- **`/evolve` command.** New standalone reflection command that reads every `.jsonl` session log at `~/.claude/plugins/data/vibe-cartographer/sessions/`, surfaces patterns across your runs (skipped deepening rounds, repeated friction notes, pushback themes, abandoned commands), and proposes specific SKILL file edits. Nothing auto-applies — each proposal is presented one at a time with apply / modify / reject / skip options. Rejected proposals are recorded so they don't resurface unchanged.
- Applied invariants in the `/evolve` SKILL: never auto-apply, never propose more than 5 changes per run, never touch files outside the plugin directory, never weaken persona / mode / one-question-at-a-time rules, always ground proposals in specific session log entries.

### Changed

- Vibe Cartographer is now classified as **L3 (Reflective Evolution)** in the Self-Evolving Plugin Framework. Previously L2 (session memory). L4 (autonomous adaptation within guardrails) remains on the roadmap.

## [1.1.0] — 2026-04-15 — Persona adaptation across all commands

### Added

- **Persona Adaptation sections** in every downstream command (`/scope`, `/prd`, `/spec`, `/checklist`, `/build`, `/iterate`, `/reflect`). Persona selection in `/onboard` now visibly shapes voice across the entire workflow — Professor (patient / explanatory), Cohort (peer / collaborative), Superdev (terse / direct), Architect (strategic / tradeoff-focused), Coach (momentum-focused), or system default.
- Each command now includes concrete persona behavior examples keyed to its phase (interviewing in `/scope`, narrating builds in `/build`, delivering review feedback in `/reflect`, etc.) so the agent has specific anchors, not just the reference table.

### Changed

- Persona is now axiomatically separated from mode: persona = voice, mode = pacing. Both axes apply simultaneously.

## [1.0.1] — 2026-04-15 — Install docs

### Changed

- **README and INSTALL rewritten** to document all three Claude Desktop install paths: **Add marketplace** (recommended — pulls from GitHub via `.claude-plugin/marketplace.json`), **npm install -g** (for Claude Code CLI / VS Code / JetBrains), and **Upload plugin** (for local iteration via `python scripts/build-plugin.py`).
- Added a **"Which option should I use?"** decision table mapping situation → recommended install path.
- Added a reproducible `scripts/build-plugin.py` build script that produces a `.plugin` bundle in `bundles/` for the upload-plugin path. Excludes `dist/`, `node_modules/`, `src/`, and other runtime/build artifacts per Cowork's plugin spec.
- GitHub releases now ship a pre-built `.plugin` file as a release asset for one-click downloads.

No behavior changes — this release exists so the npm-published README on `npmjs.com/package/@esthernandez/vibe-cartographer` reflects the marketplace install path.

## [1.0.0] — 2026-04-15 — Rebrand to Vibe Cartographer

The plugin formerly known as `@esthernandez/app-project-readiness` is now **Vibe Cartographer**. Same 8-command spec-driven workflow, same personas, same session memory — new name that actually says what the plugin does: *plot your course from idea to shipped app*.

### Changed

- **Package rename.** `@esthernandez/app-project-readiness` → `@esthernandez/vibe-cartographer`. The old package is deprecated on npm with a pointer to the new one; existing installs keep working but get a deprecation warning on next install.
- **Plugin directory rename.** `plugins/app-project-readiness/` → `plugins/vibe-cartographer/`. Update any local pointers in Claude Desktop's Personal Plugins panel after upgrading.
- **Unified profile namespace.** `plugins.app-project-readiness` → `plugins.vibe-cartographer` in `~/.claude/profiles/builder.json`. `/onboard` auto-migrates on first v1.0.0+ run; the old key is kept side-by-side for one release as a safety net.
- **Session log path.** `~/.claude/plugins/data/app-project-readiness/sessions/` → `~/.claude/plugins/data/vibe-cartographer/sessions/`. Legacy logs are preserved untouched (append-only history doesn't migrate).
- **ASCII banner.** Replaced the 626Labs FIGlet banner with a cleaner 5-line neural-network mesh + side-by-side text — cleaner alignment, more reproducible under the LLM's rendering.
- **GitHub repository renamed.** `estevanhernandez-stack-ed/app-readinessplugin` → `estevanhernandez-stack-ed/vibe-cartographer`. GitHub auto-redirects the old URL, so existing clones keep working until you update the remote.

### Migration

On first `/onboard` with v1.0.0+, the plugin:

1. Checks `~/.claude/profiles/builder.json` for a legacy `plugins.app-project-readiness` block
2. Copies it to `plugins.vibe-cartographer`, leaving the old key in place for one release as a safety net
3. Logs the migration in `process-notes.md`

The deep-legacy markdown profile at `~/.claude/plugins/data/app-project-readiness/user-profile.md` (v0.4.x and earlier) still migrates the way it did in v0.5.0, just now into `plugins.vibe-cartographer` instead.

### Why the rename

"App Project Readiness" described what the plugin *technically* was but said nothing about the vibe. "Vibe Cartographer" captures the whole point: vibe coding with purpose and direction. Cartographers produce maps before expeditions — this plugin produces scope, PRD, spec, and checklist docs before you write any code. Pairs with [Vibe Doc](https://www.npmjs.com/package/@esthernandez/vibe-doc) in the 626Labs ecosystem: Doc writes the documentation you need, Cartographer plots the route you'll take.

This is the "plugin has graduated from beta" moment. No new features — just the rename, the migration machinery, and a new banner.

## [0.5.0] — 2026-04-15

### Added

- **Persona selection** during `/onboard` (new step 9). Five named personas — **Professor**, **Cohort**, **Superdev**, **Architect**, **Coach** — plus a **System default** that preserves base behavior. Persona controls voice (relational stance, explanation depth, checkpoint style) and coexists with the Learner / Builder mode which controls pacing. Stored in `shared.preferences.persona` on the unified profile so all 626Labs plugins respect it.
- **Session-logger skill** (`skills/session-logger/SKILL.md`). Every command appends a one-line JSON entry to `~/.claude/plugins/data/app-project-readiness/sessions/<date>.jsonl` at completion — command name, outcome, user pushback flag, friction notes, key decisions. Local-first, append-only, no PII. This is the Level 2 increment of the Self-Evolving Plugin Framework: passive memory that a future `/app-readiness-evolve` step will read to propose plugin improvements.
- **Self-Evolving Plugin Framework doc** at [docs/self-evolving-plugins-framework.md](docs/self-evolving-plugins-framework.md). Thesis, 12-pattern catalog, and applied playbook (maturity ladder, retrofit/scaffold playbooks, anti-patterns, shipping cadence). The architectural north star for this plugin and all future 626Labs plugins.
- **Persona Adaptation reference table** in the guide SKILL, mapping each persona to voice / explanations / checkpoints / feedback style so every command renders a consistent voice from start to handoff.
- **Learning Hackathon credit** in the README — this plugin extends the foundational spec-driven-dev workflow from the Hackathon, rebuilt as a builder-focused tool with persistent memory and a reflective retro.

### Changed

- **Unified builder profile** moved from plugin-scoped markdown (`~/.claude/plugins/data/app-project-readiness/user-profile.md`) to a cross-plugin JSON file at `~/.claude/profiles/builder.json`. Schema has a top-level `shared` block (identity, experience, preferences, creative sensibility) and `plugins.<plugin-name>` blocks (plugin-scoped state). Strict ownership: each plugin writes its own `plugins.<name>` block and never stomps other plugins' namespaces. `/onboard` auto-migrates the legacy file to the new location on first run; old file preserved as `.bak`.
- **README install instructions** rewritten. Removed the stale `/install-plugin` references (that command doesn't exist in current Claude Code versions) and documented three real install paths: npm, Claude Desktop Personal Plugins UI, and local clone.
- **README table formatting and code block language hints** cleaned up (markdown lint fixes).

### Fixed

- **`/reflect` no longer feels like a classroom wrap-up.** Rewrote the reflect SKILL, the reflection template, and the eval-rubric to read like a peer retro. "What landed / What to tighten" replaces "strength / growth area", "quiz" becomes "check-in", and the defensive disclaimers ("not to grade you", "no wrong answers") are gone. The final artifact reads like feedback from a senior engineer doing a post-ship retro, not a teacher wrapping up a student project.

## [0.4.0] — 2026-04-15

### Added

- **Persistent global builder profile.** `/onboard` now detects returning builders, skips the background interview if a profile exists, and jumps straight to project-specific questions. The profile is written during `/onboard` and updated at the end of each full run during `/reflect`. Per-project `docs/builder-profile.md` is still created — the global profile captures the *person*, the per-project profile captures the *project*.

## [0.3.0] — 2026-04-15

### Changed

- **Rebranded from Marcus Corporation to 626Labs LLC** across the plugin manifest, marketplace entry, README, plugin CLAUDE.md, and the onboard welcome banner.
- **Welcome banner** replaced with a clean FIGlet-style `626Labs` ASCII logo. The previous asterisk-and-dash art rendered as a scrambled wall of characters because it was too fragile for the LLM to reproduce character-perfect.

## [0.2.0] and earlier

Foundational work, pre-dating the first npm publish:

- Initial plugin structure with the 8-command workflow: `/onboard` → `/scope` → `/prd` → `/spec` → `/checklist` → `/build` → `/iterate` → `/reflect`.
- Learner / Builder mode split for pacing.
- Architecture docs support — the builder can point at their own stack preferences during `/onboard` and downstream commands calibrate against them.
- Per-project `docs/builder-profile.md` artifact that every command reads.
- Extensive builder-focused language cleanup after a LADDER stress-test surfaced too much "learner" framing in early drafts.

---

## Contributing

This plugin is maintained by [626Labs LLC](https://626labs.dev) (solo maintainer at the moment — expect slower turnaround than a team-backed project).

### How to contribute

1. **Fork** the repo on GitHub: [estevanhernandez-stack-ed/vibe-cartographer](https://github.com/estevanhernandez-stack-ed/vibe-cartographer).
2. **Branch** from `main` with a short, focused name (`fix/reflect-wording`, `feat/new-persona`, etc.).
3. **Make the change** — most of this plugin is markdown (SKILL files and templates). No build step.
4. **Test it locally** by installing from your fork (`git clone && point Claude Code at it`) or by pointing the plugin directory in your Claude Desktop Personal Plugins panel at your working copy.
5. **Open a PR** against `main` with a clear description of what's changing and why.

### Development setup

There's no build, no package manager install, no test suite yet — just markdown:

```bash
git clone https://github.com/estevanhernandez-stack-ed/vibe-cartographer
cd vibe-cartographer
# edit plugins/vibe-cartographer/skills/**/SKILL.md directly
```

Point Claude Desktop's Personal plugins at `plugins/vibe-cartographer/` and iterate. Every change takes effect the next time you run a slash command.

### Proposing a change

- **Small fixes and language tweaks** — open a PR directly, reference the specific SKILL file and section you're changing.
- **New personas, new commands, structural changes** — open an issue first to discuss scope. The plugin has a specific tone (builder-focused, peer-to-peer) and structural changes to the 8-command flow deserve a conversation.
- **Bug fixes** — include a short "before / after" in the PR description showing what was wrong and how the fix changes the behavior.

### Review process

Reviews are handled by the maintainer (Estevan). Expect feedback within a few days. There's no formal approval process — if the change is sound and fits the plugin's voice, it merges.

### Code of conduct

Be direct, be kind, don't waste each other's time. Disagreements about technical direction are welcome; personal attacks, gatekeeping, and "this is bad because I say so" are not.
