<!-- markdownlint-disable MD024 -->
<!-- Keep-a-Changelog uses duplicate "Added / Changed / Fixed" headings per version by design. -->

# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Backlog

- **Quick Build pacing mode.** A third build mode alongside step-by-step and autonomous. After the interview phase (`/onboard` → `/checklist`), Quick Build skips all checkpoints, verification pauses, and git pushes — just executes checklist items sequentially with auto-commits. At the start of a Quick Build run, the agent checks whether Claude's **auto mode** is active. If it is, proceed. If not, remind the builder: "Quick Build works best with auto mode enabled — press `Shift+Tab` to cycle to it. Auto mode lets Claude handle tool permissions automatically so the build can run uninterrupted." Wait for confirmation before starting. No `git push` until the builder explicitly triggers one post-build. Designed for experienced builders who trust the plan and want maximum velocity from spec to working code.

## [1.8.0] — 2026-05-01 — Coder-voice SKILL + cutter library + Tier-1 hygiene from Claude Insights

Minor release. Pure additive — no breaking changes, no contract surface changes. Three feature pillars landed in a single afternoon session, all derived from observed friction patterns.

### Added

- **`/coder-voice` SKILL.** Captures, refreshes, or extends the user's coder voice profile in `~/.claude/CLAUDE.md` so the agent answers in a chosen voice during autonomous work. **Always presents a choice — never imposes a path.** Three top-level paths: (1) personal voice via discover-first corpus sweep (CLAUDE.md, builder profile, session transcripts under `~/.claude/projects/<project>/<session-uuid>.jsonl`, project memories, blog posts, process-notes) or 3-question interview fallback; (2) preset cutter modeled after a known coder/writer; (3) skip and leave the default Architect persona. Optional Cross layer mixes admired voices INTO any base at default 80/20 base/cross ratio. Synthesize-don't-imitate discipline — base voice always dominates. Idempotent — re-runnable to refresh, swap presets, extend Cross, or restart from scratch. Self-modification protocol: never auto-writes to `~/.claude/CLAUDE.md` without explicit yes; falls back to printing the block for paste-in if the harness blocks the write.
- **Four preset cutters** under [`plugins/vibe-cartographer/skills/coder-voice/cutters/`](plugins/vibe-cartographer/skills/coder-voice/cutters/) — drop-in stylized voice profiles auto-discovered at runtime. `carmack` (precision narrating the hard part — working/technical heavy), `dhh` (opinionated terse — convention over configuration), `bret-victor` (make-the-system-thinkable — visual register heavy), `julia-evans` (zines-style "here's how it works" — accessible explainer). Each cutter is a complete `## CODER VOICE SYNTHESIS` block with Voice DNA, register/work-type axes, reference wells, and discipline rules. Adding a new preset = drop a markdown file in `cutters/` with the canonical structure; no plugin manifest registration needed.
- **Tier-1 Hygiene Rules section** in the [`guide` SKILL](plugins/vibe-cartographer/skills/guide/SKILL.md). Four universal rules inherited by every Cart command (`/onboard`, `/scope`, `/prd`, `/spec`, `/checklist`, `/build`, `/iterate`, `/reflect`, `/evolve`, `/vitals`, `/friction`, `/coder-voice`) without per-SKILL repetition: (1) **Scope Discipline at Command Kickoff** — match the scope of the user's ask; confirm desired depth in one short question for ambiguous opens. (2) **Output Discipline** — long deliverables (>~300 words) write directly to a file first; chat gets path + 2-sentence summary. (3) **Verify Before Synthesizing** — re-verify subagent contradictions; no speculation about external system behavior without evidence. (4) **Creative Framing Anchor** — ask the user for a one-line angle anchor before generating long-form artifacts; default-on but skippable. Sourced from observed friction patterns across 120 sessions / 32 days (Claude Code Insights report, 2026-05-01) — wrong-approach + misunderstood-request friction accounts for 61% of all friction events.
- **Three Tier-3 horizon design briefs** under [`docs/horizon/`](docs/horizon/) — Cart-cycle-ready briefs for future work the Insights report identified, deferred until dedicated cycles rather than absorbed shallowly into v1.8.0: `parallel-swarms.md` (git-worktree-isolated agent swarms for `/build` with adversarial review), `tdd-loop.md` (autonomous spec-to-green TDD iteration primitive), `self-healing-reliability.md` (PreToolUse hooks + monitor agent + nightly `/evolve` cron). Each is dispatchable as a `/onboard` brief when its time comes.
- **Keystone propagation brief** at [`docs/horizon/keystone-hygiene-rules-update.md`](docs/horizon/keystone-hygiene-rules-update.md) — ready-to-execute brief for the next vibe-keystone cycle to bake the four hygiene rules into bootstrapped CLAUDE.md output for any new repo. Highest-leverage propagation move from the Insights findings — every CLAUDE.md keystone produces from then on inherits the rules by default, regardless of tenant.

### Changed

- **Cross-plugin contracts guardrail** added to root [`CLAUDE.md`](CLAUDE.md) and [`AGENTS.md`](AGENTS.md) under "What NOT to do." Names the seven contract surfaces — unified builder profile schema (especially the `shared.*` block), `shared.preferences.persona` enumeration, session-log shape, friction-log + calibration shapes, Self-Evolving Plugin Framework pattern numbers + names, the `@esthernandez/vibe-cartographer` npm package name (hardcoded in `/onboard`'s soft version check), and the [vibe-plugins aggregator's `ref:` field](https://github.com/estevanhernandez-stack-ed/vibe-plugins/blob/main/.claude-plugin/marketplace.json). Sibling plugins read these — vibe-doc, vibe-test, vibe-sec, vibe-thesis. Changes ripple to canary consumers immediately on `main` (solo-repo marketplace) and to stable consumers when the aggregator's `ref:` bumps. Surface coordinated changes via a dashboard decision before merging.
- **Runtime `plugins/vibe-cartographer/CLAUDE.md`** picked up a "contracts are read-only mid-session" bullet under Core behaviors. Catches the most likely drift point — SKILLs improvising schema changes mid-session. Schema changes belong in `/evolve` proposals, not in-session.

### Notes

- Same-day execution. Triggered by a folder rename (`app-readinessplugin/` → `vibe-cartographer/`) that surfaced a long-standing keystone gap, then turned into a full v1.8.0 feature cycle when the Claude Code Insights report landed mid-session and validated most of what was already shipped.
- The `/coder-voice` discover-first sweep has a SKILL-encoded "Failure mode to avoid" instruction telling future runs to **always include session transcripts under `~/.claude/projects/`** as a first-class source — captured because the first pass on Este's own profile missed them and Este flagged the gap.
- Session memory: every change in this release is sourced from real friction signal (Claude Insights report at `~/.claude/usage-data/report.html`, distilled to `~/.claude/usage-data/findings-summary.md` for re-runnable cross-plugin analysis when future Insights reports drop).

### Security

- No new dependencies. Two new local hook scripts in `.claude/hooks/` (gitignored — Cart dogfood, not shipped with the plugin): `version-pair-check.js` guards against `package.json` ↔ `plugin.json` version drift; `pre-publish-gate.js` extends the pattern into a generic pre-publish gate (typecheck → lint → tests on `npm publish` / `gh release` / `firebase deploy` / `vercel` / `netlify` / `az` / `gcloud` commands). Both use `execFileSync` (no shell, hardcoded commands, no user input) per security-review hygiene.

## [1.7.3] — 2026-04-26 — Submission-readiness polish

Patch release. Metadata-only. No behavioral change.

### Added

- **Root `LICENSE` file** with the MIT text (©2026 626Labs LLC). `package.json` already declared MIT; this ships the actual license file alongside.
- **`plugin.json` metadata fields** required for marketplace discovery: `homepage`, `repository`, `license`, `keywords`, and `author.url`. Brings the manifest in line with the [official Claude Code plugin schema](https://code.claude.com/docs/en/plugins-reference#plugin-manifest-schema) so the plugin shows up cleanly in marketplace searches and discovery views.

### Fixed

- **README install instructions** — the Claude Code CLI option referenced the old `app-readinessplugin` repo name (left over from the rename to `vibe-cartographer` in v1.0.0). Now correctly points at the current repo.

### Notes

- Submission-readiness pass for the official Claude Code marketplace at [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit). v1.7.3 is the tag the submission will reference.

## [1.7.2] — 2026-04-26 — Autonomous /onboard flows end-to-end

Patch release. Sharpens the autonomous branch added in 1.7.1.

### Fixed

- **`/onboard` autonomous mode now flows end-to-end without further pauses once opted in.** 1.7.1 added the pacing-confirmation question as the first beat, but the autonomous branch was under-specified — it didn't explicitly say "skip the interview, no per-step confirmations, defer the decay check, just generate artifacts." 1.7.2 makes the contract explicit: opt in once at the pacing question, then Cart gets out of the way. New-builder defaults table baked into the SKILL so the artifact-fill strategy is unambiguous. Visibility is still the contract — every defaulted value is marked `(default — confirm on next run)` in `process-notes.md` — but not pausing is also the contract. Builders re-run `/onboard` interactive when they want to refine.

### Notes

- Decay check behavior in autonomous mode: any `_meta` field that comes back stale is deferred (no confirmation question, no stamp). The field stays past-TTL and surfaces again on the next interactive run.

### Security

- No new dependencies. Single SKILL.md edit (`plugins/vibe-cartographer/skills/onboard/SKILL.md`).

## [1.7.1] — 2026-04-26 — Autonomous-mode confirmation in /onboard

Patch release. Single SKILL fix.

### Fixed

- **`/onboard` no longer plows through onboarding when the harness is in auto mode.** Adds a pacing-confirmation question as the first behavioral beat of `/onboard` — right after the welcome banner, before any other content or branching. Default is conversational. The builder must explicitly opt in to a defaults-only run by answering "(b)" / "autonomous" / "just go," and even then every assumption made gets surfaced in `docs/builder-profile.md` and a `## /onboard — autonomous run` section of `process-notes.md` for spot-check. Reported gap: a fresh `/onboard` started with auto mode active ran through the full interview without pausing for builder answers, defeating the flipped-interaction premise.

### Notes

- The same gap likely exists in `/scope`, `/prd`, `/spec`, `/checklist`, `/iterate`, `/reflect` — each is conversational and lacks an auto-mode guard. Out of scope for this patch; candidate for a future minor release that hoists a shared "pacing confirmation" beat into the guide SKILL so every Cart command inherits it. Tracked informally; will resurface in `/evolve` when warranted.

### Security

- No new dependencies. Single SKILL.md edit (`plugins/vibe-cartographer/skills/onboard/SKILL.md`).

## [1.7.0] — 2026-04-26 — Cross-machine portability hint + four-modes framework + invite-reframing

Additive rule-layer release. Five SKILL edits sourced from `/evolve` (626Labs Lab Backbone Step 1 retrospective, 2026-04-25) plus a new `/onboard` UX hint sourced from a real cross-machine install incident. No schema changes, no breaking changes — existing profiles and session logs continue to work unchanged.

### Added

- **`/onboard` Welcome — builder-profile portability hint (new-builder branch only).** When the unified profile at `~/.claude/profiles/builder.json` is missing, the welcome now surfaces a single casual sentence pointing at the profile path and the copy-and-rerun flow. The "new builder" branch fires on first install of any machine — including a returning builder's second / third workstation — and silently re-running the full interview lost cross-session continuity (project counts, persona, mode, accumulated notes). Information-only — no pause, no fork, no yes/no question.
- **`/build` — pre-handoff deploy-verification beat.** Between checklist completion and embedded feedback, a new verification step. `tsc`-clean + lint-clean + tests-pass ≠ deploy-clean for runtime infrastructure — the prompt now lists common deploy-state findings (zombie shells, memory floors, region / Eventarc binding, CI / local desync) so builders know what to verify before shipping. Skippable for compile-time-only builds.
- **`/spec` — subsystem config pattern-match check** added to the Architecture Self-Review section. When extending existing infrastructure (Cloud Functions, MCP tools, Firestore writers, csproj chains, etc.), grep sibling files' config values and treat established floors as default. Generalizes the build-config hygiene lesson upstream of `/build`.
- **NEW reference: `guide/references/four-modes.md`.** The Cart / vibe / iteration / deployed-state framework. Acknowledges Cart attention's greenfield bias and shifts burden to vibe / iteration / deployed-state when extending existing apps. Citable from any SKILL; matches the existing `references/` pattern.

### Changed

- **`/iterate` — mode-aware framing default.** Learner / step-by-step continues to show "skip if shipping." Builder / autonomous flips to "iterate is cheap, what's the next adjacent thing the substrate makes cheap?" Autonomous-mode + parallel agents ≈ near-zero builder cost, a qualitatively richer post-build review pass, and iteration stress that feeds `/evolve` better.
- **`/evolve` — invite-reframing prompts replace binary read / track confirmation.** Builders consistently refine first-pass observations rather than accept-or-reject. The agent now leads with "what would you reframe?", supports "split across two tracks," and adds a "resist defending the first-pass framing" load-bearing line.

### Fixed

- Nothing yet — this is a rule-layer release.

### Security

- **No new runtime dependencies.** `package.json` `dependencies` and `devDependencies` are unchanged vs `1.6.0`. No new scripts, no new schemas. All edits are SKILL prose + the new `four-modes.md` reference doc.

## [1.6.0] — 2026-04-22 — Orchestrator heads-up + deployment target + build-config hygiene

Additive rule-layer release. Five new SKILL edits sourced from `/evolve 2026-04-22` (the Right Click PNG retrospective), plus a carryover `/vitals` check from `/evolve 2026-04-18` (Vibe Test retrospective). No schema changes, no breaking changes — existing profiles and session logs continue to work unchanged.

### Added

- **`/onboard` step 11b — Deployment Target.** One free-form question captured on the unified profile as `plugins.vibe-cartographer.deployment_target`. Common answers: GitHub release, Microsoft Store, Cloudflare Pages, Vercel, npm, PyPI, Docker Hub, internal only, or "not sure yet". Lets `/spec` drill into target-specific identity/signing contracts instead of surfacing them as ship-time surprises. Null for "not sure yet" / "internal only" skips the drill-down.
- **`/spec` Phase 1 question 2 — Deployment Identity & Signing lookup.** Upgraded from the single "local or deployed URL?" question to a per-target field lookup table (Microsoft Store → Publisher CN + PFN + cert chain; GitHub release → repo slug + tag scheme + `GITHUB_TOKEN` scope; npm → scope + `NPM_TOKEN`; PyPI → trusted-publisher config; Docker Hub → repo + token; Cloudflare Pages / Vercel → project ID + deploy hook). Only the one matching row gets expanded — `/spec` stays lean. **Pattern #13 handoff** baked in: when target is GitHub releases AND `superpowers:vibe-launch` is installed, Cart offers to yield the section to vibe-launch instead of capturing the fields itself.
- **`/build` — Build-config hygiene section.** Rule: project-type-specific flags (`PublishAot`, `InvariantGlobalization`, `TrimMode`, `compilerOptions.strict`, `[tool.mypy]` strict bumps, `[profile.release]` overrides, etc.) live in the specific project's config file, never in shared-root config (`Directory.Build.props`, root `pyproject.toml`, root `package.json`, Rust workspace root). Per-ecosystem trap examples included for .NET, Python, TypeScript, Rust. Anchored to a real incident: `InvariantGlobalization=true` set in a `Directory.Build.props` for an AOT CLI cascaded into a later-added WPF project and caused hours of silent-startup-exit debugging. Vibe coders won't declare their project-type mix; the rule lives on the agent's side.
- **`/guide` Session Logging — orchestrator-runtime heads-up.** When `session-logger.start()` returns null / unresolvable (the runtime isn't wired — typical for multi-command-in-one-chat orchestrator runs), a one-time heads-up banner fires to tell the builder their `process-notes.md` is the durable record for this session and point at the Reconnect procedure spec. Detection is binary (`start()` return), not timestamp math.
- **`session-logger` — Reconnect procedure spec.** New section specifies the `process-notes.md` → `sessions/<date>.jsonl` backfill recipe a future `/vibe-cartographer:reconnect` slash command will implement. Deterministic `sessionUUID` from `sha1(project_dir + command + timestamp)` makes reconnect idempotent. Opt-in and read-only against `process-notes.md`. Contract-stable before implementation lands — when demand warrants, a `skills/reconnect/SKILL.md` companion implements exactly this recipe.
- **`/vitals` Check #9 — Session-log coverage.** Detects orchestrator-level Cart runs where commands were executed via narrative orchestration and the session-logger SKILL never fired. Builds an index of recent session-log entries and compares against `process-notes.md` across the five most recent projects. Warns when a project has ≥3 unmatched command invocations within a 14-day window. Signals when `/evolve` is reading incomplete data — known limitation until `/reconnect` ships. (Carryover from `/evolve 2026-04-18`.)

### Changed

- **`/onboard` step 2 — context-management copy sharpened.** The /clear rationale now explicitly names the auto-compaction trade-off: "even with Claude Code's auto-compaction, dense planning sessions accumulate tokens and slow each command down — compaction handles overflow but doesn't replace a clean reset." No behavioral change; copy clarity only.
- `/evolve` continues to read session logs + friction log as first-class inputs; it now also reads `process-notes.md` (per the 1.5.0 spec) which surfaces richer qualitative signal than session-log entries alone when the runtime-gap check #9 fires.

### Fixed

- Nothing yet — this is a rule-layer release, not a bugfix release.

### Security

- **No new runtime dependencies.** `package.json` `dependencies` and `devDependencies` are unchanged vs `1.5.0`. No new scripts, no new schemas. All edits are SKILL prose + one CHANGELOG entry.

## [1.5.0] — 2026-04-17 — L3.5: Patterns #4, #6, #8 + #13 integrations

Vibe Cartographer advances to **Level 3.5** of the Self-Evolving Plugin Framework — faster feedback loops, calibrated signal, and self-diagnostic health checks layered on top of the existing L3 reflective evolution. Three new framework patterns (#4, #6, #8) ship in this release, with Pattern #13 (Ecosystem-Aware Composition) gaining first-class integrations across all of them.

### Added

- **Pattern #4 — Memory Decay.** The unified profile and session state now track `_meta.last_seen_complements` so the plugin can tell when the ecosystem around it has changed (new / removed MCPs, skills, plugins). Stale environment fingerprints are flagged during `/vitals` check #4 so the complements table doesn't rot silently between sessions.
- **Pattern #6 — Friction Log + calibration.** New `/friction` command captures real-time friction signal with a lightweight calibration pass — severity, phase, trigger, and suggested category are recorded to a structured log and used to calibrate future proposals in `/evolve`. Friction complements rejections without replacing them: rejections record a no, friction records a "this was rough even though we pushed through" (Pattern #13 integration — the two signals are additive, not redundant).
- **Pattern #8 — `/vitals` self-diagnostic.** New `/vitals` command runs a one-shot health check across the plugin's own runtime state: (1) unified profile schema validity, (2) session log append integrity, (3) friction log structure, (4) complements-table staleness vs `_meta.last_seen_complements`, (5) script presence and permissions. Reports pass/warn/fail per check with fix guidance.
- **New commands:** `/vitals` and `/friction` join the command chain. Both are additive — the original 8-command flow (`/onboard` → `/reflect`) is unchanged; `/vitals` and `/friction` are callable anytime a signal arises.
- **Two new Node scripts** in `scripts/`: `atomic-write-json.js` (lock-and-swap JSON writes for the unified profile and schema-governed files) and `atomic-append-jsonl.js` (crash-safe append for session logs and the new friction log). Both operate without any new runtime dependencies — Node's built-in `fs` primitives only.
- **Four new JSON schemas** under `plugins/vibe-cartographer/skills/guide/schemas/`: `builder-profile.schema.json`, `friction.schema.json`, `friction-calibration.schema.json`, and `session-log.schema.json`. `/vitals` check #1 and check #3 consume these.
- **Two new reference docs** under `plugins/vibe-cartographer/skills/guide/references/`: `data-contracts.md` (authoritative contract for every file the plugin reads or writes — paths, ownership, atomicity guarantees, schema ref) and `friction-triggers.md` (the trigger taxonomy `/friction` uses to suggest a category).

### Changed

- **Language reframe: "course correction matches what we actually do."** The plugin's surface copy now consistently describes what it does as *vibe coding course correction* — a sharper framing than earlier generations of "spec-driven development" or "app readiness." The old descriptors still map cleanly (the 8-command flow is unchanged), but the framing now matches the builder's lived experience. Touched both root and plugin manifests, the onboard banner, the README opener, and internal SKILL prose.
- **Pattern #13 (Ecosystem-Aware Composition) gains concrete integrations with the new patterns.** `/vitals` check #4 uses the complements table and `_meta.last_seen_complements` to detect table rot (a Pattern #13 + Pattern #4 combo). `/friction` complements rejection logging in `/evolve` rather than duplicating it (Pattern #13: defer to and compose with adjacent signal rather than absorbing it).
- `/evolve` now reads the friction log in addition to session logs when surfacing patterns across runs — friction is a stronger signal than inference-from-session-outcome.

### Fixed

- Nothing yet — this is a capability release, not a bugfix release.

### Security

- **No new runtime dependencies.** `package.json` `dependencies` and `devDependencies` are unchanged vs `1.4.1`. The two new Node scripts rely on Node built-ins (`fs`, `path`) only. Secrets scan run pre-release came back clean (matches present only as framework doc prose describing credential-handling patterns — no literal secret values).

## [1.4.1] — 2026-04-16 — Sharpening from research swarm

Two surgical fixes surfaced by a 4-agent research swarm conducted before a fresh `/scope` run.

### Changed

- **`/evolve` now reads `process-notes.md`** from recent projects when present, instead of treating them as out-of-bounds. The original ban kept evolve cheap and bounded, but it also starved the command of the richest friction signal — the user's plain-English "CRITICAL:", "builder refused all cuts twice", and "this was rough" notes that never get reduced to a 5-word `friction_notes` entry. Bounded to the most recent 5 projects' notes, with explicit source-quoting required in any derived observation.
- **`/checklist` Builder-mode deepening rounds now default to "move on"** rather than "another round?". Adoption signal across multiple projects shows Builder-mode users invest in deepening on `/prd` and `/spec` but consistently skip it on `/checklist`. The framing now leads with the natural choice instead of asking the question that always gets the same answer.

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
