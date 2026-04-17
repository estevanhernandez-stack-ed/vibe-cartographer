# Vibe Cartographer L3.5 — Product Requirements

## Problem Statement

Vibe Cartographer shipped Level 3 (reflective evolution via `/evolve`) two days ago, and the L3 mechanism is already starving. There's no friction log to read from, the unified profile has no decay so stale defaults persist forever, and the plugin has no way to verify its own files haven't drifted out of sync. ~770 weekly downloads (combined new + deprecated package) means real users are accumulating session history that L3 should be acting on, but isn't because the upstream patterns (#4, #6, #8) don't exist yet. L3.5 closes the three gaps, integrates them with Pattern #13 (Ecosystem-Aware Composition) so the four work as a coherent self-improvement system, and reframes the plugin's "spec-driven development" language to "vibe direction" while we're already touching SKILLs.

## User Stories

### Epic 1 — Profile Decay & Refresh (Pattern #4)

- As a returning user with stable preferences, I want fields I haven't confirmed in a while to gently re-validate, so my profile stays accurate without re-onboarding.
  - [ ] After 180+ days since `last_confirmed` on `preferences.persona`, the next `/onboard` start asks one casual confirmation question (e.g., "Last time persona was superdev — still right?")
  - [ ] If user confirms, `last_confirmed` re-stamps to today
  - [ ] If user updates, value changes AND `last_confirmed` re-stamps
  - [ ] Decay TTLs by field type — persona / tone / pacing / communication_style: 180 days; experience.level: 365 days; languages / frameworks: 90 days; creative_sensibility / name / identity: never decay
  - [ ] Decay check runs on read at `/onboard` start, not on a schedule (stateless and deterministic)

- As a user, I want stale fields marked but never silently rewritten, so I keep control of my profile.
  - [ ] Past-TTL fields gain `stale: true` in their `_meta` block
  - [ ] SKILLs reading them surface a confirmation moment but never modify the value without explicit input
  - [ ] No timer or auto-refresh — confirmation only happens at `/onboard` start

- As a user, I want a way to opt out of decay entirely if I never want re-prompting.
  - [ ] Add `decay_disabled: true` flag at the top level of the unified profile
  - [ ] When set, no decay check runs and no field gets a `stale: true` marker
  - [ ] User can flip the flag manually by editing the profile; no SKILL exposes this directly (intentional friction — rarely needed)

### Epic 2 — Friction Capture & Calibration (Pattern #6)

- As a Vibe Cart user, I want the plugin to silently capture friction signals as I work, so `/evolve` can propose meaningful improvements over time.
  - [ ] After running multiple commands, `~/.claude/plugins/data/vibe-cartographer/friction.jsonl` contains structured entries
  - [ ] No agent narration about logging — capture happens silently
  - [ ] 7 friction types: `command_abandoned`, `default_overridden`, `complement_rejected`, `repeat_question`, `artifact_rewritten`, `sequence_revised`, `rephrase_requested`
  - [ ] Schema: `{schema_version, timestamp, plugin_version, command, project_dir, project_id, friction_type, symptom, agent_guess_at_cause, complement_involved, confidence}`
  - [ ] Confidence tagging: explicit events (`complement_rejected`, `sequence_revised`, `rephrase_requested`) → `high`; measured events (`artifact_rewritten` with ≥50% diff) → `high`; inferred events (`default_overridden`) → `medium`; subjective events (`repeat_question`) → `low` and only logs if agent can quote the prior message it thinks was the answer
  - [ ] Defensive default: when in doubt, don't log. Better to miss real friction than poison `/evolve` with noise.

- As a user who exits Cart mid-command, I want that abandonment captured automatically without losing data.
  - [ ] Sentinel pattern: every command appends `{outcome: "in_progress"}` to session log at start
  - [ ] Natural completion appends a terminal entry with real outcome (`completed` / `partial` / `error`)
  - [ ] Next session start scans for orphaned `in_progress` entries older than 24h with no terminal entry, matched by `(command, project_dir, timestamp)` triple
  - [ ] For each orphan, append `{friction_type: "command_abandoned", original_command, original_timestamp}` to friction.jsonl
  - [ ] Version mismatch survives — sentinel detection matches by command + timestamp regardless of `plugin_version` change between sentinel and termination

- As a user, I want to confirm or correct friction the plugin captured, so the system learns my actual signals over time.
  - [ ] End of `/reflect` Part B includes one calibration question: "I captured N friction notes this session — anything I logged wrong, or missed?"
  - [ ] Builder marks false positives / false negatives. Writes to `friction.calibration.jsonl` sibling file
  - [ ] Schema: `{schema_version, timestamp, plugin_version, friction_entry_ref, calibration: "false_positive" | "false_negative", builder_note}`
  - [ ] `/evolve` weights friction entries against calibration data — reduces weight of friction patterns flagged as false positives
  - [ ] Calibration entries themselves decay (Pattern #4 applied recursively) — old calibrations age out so habit shifts get respected

- As a user, I want to read my friction log without parsing JSONL by hand.
  - [ ] New command `/vibe-cartographer:friction-log` (also accepts `:friction` as shorthand)
  - [ ] Renders entries grouped by type with confidence indicators
  - [ ] Defaults to last 30 days
  - [ ] Optional flags: `--project <name>` (filter by project_dir), `--type <friction_type>`, `--confidence <min>`, `--days <n>`
  - [ ] Output style consistent with `/vitals` aesthetic (boxed sections, color-coded confidence, table format)

- As a user, I want my friction tracked per-project so `/evolve` can distinguish project-specific friction from builder-wide patterns.
  - [ ] Every friction entry carries `project_dir` (always) and `project_id` (when bound to a 626Labs Dashboard project)
  - [ ] `/friction-log --project <name>` filters to one project's friction
  - [ ] `/evolve` surfaces "this friction is project-specific" vs "this friction recurs across projects" in its proposals

### Epic 3 — Self-Diagnostic `/vitals` (Pattern #8)

- As a Vibe Cart user, I want a single command to verify my plugin's structural integrity.
  - [ ] New command `/vibe-cartographer:vitals` (renamed from `/doctor` to avoid collision with Claude CLI builtin)
  - [ ] Runs 5 checks in sequence
  - [ ] Output mimics Vibe Doc CLI banner aesthetic: boxed sections, color-coded status indicators (✓ / ⚠ / ✗), tables for findings, light banner header
  - [ ] Read-only by default — auto-fixes are explicit per-fix opt-in (Story 3.2)
  - [ ] Five checks: (1) every SKILL file referenced by another SKILL exists, (2) every template file referenced by a SKILL exists, (3) unified profile parses against schema and has no fields outside the documented set, (4) every complement in the anchored Pattern #13 table appears in the agent's available skills list, (5) friction log volume sanity over last 10 sessions

- As a user, I want `/vitals` to offer single-shot fixes for obvious problems with my explicit per-fix confirmation.
  - [ ] Auto-fix actions: (a) legacy `plugins.app-project-readiness` namespace migration to `plugins.vibe-cartographer`; (b) orphaned `in_progress` session-log entries cleaned up by emitting their `command_abandoned` friction entries; (c) missing `last_confirmed` stamps after 1.4.x → 1.5.0 upgrade get fresh-stamped to upgrade date
  - [ ] Each fix prompts `[y/n]` individually — no batch "fix all"
  - [ ] Fix output shows the diff before applying (e.g., "I'll move `plugins.app-project-readiness.persona = superdev` to `plugins.vibe-cartographer.persona = superdev`. Apply? [y/n]")
  - [ ] Non-deterministic problems (e.g., SKILL references a renamed template) report manually AND suggest running `/evolve` to surface the rename pattern

- As a user, I want `/vitals` to flag when my anchored Pattern #13 complements no longer exist.
  - [ ] Check #4 verifies every complement in the guide SKILL's anchored table appears in the agent's available skills/tools list at /vitals runtime
  - [ ] Warns on miss with the specific complement name and the original deferral phase (e.g., "⚠ `superpowers:brainstorming` not detected — listed for `/scope` brain dump phase")
  - [ ] Doesn't fail or block the run — just surfaces the rot

- As a user, I want `/vitals` to flag friction-log volume problems.
  - [ ] Check #5 reports avg friction entries per command session over last 10 sessions
  - [ ] Warns if >5/session avg ("possibly too noisy — consider tightening detection thresholds")
  - [ ] Warns if 0 across all 10 sessions ("possibly too silent — detection may be broken or you're a low-friction user")
  - [ ] **Skipped for the first 3 sessions** with a note: "Friction-log volume sanity available after 3 sessions of data."

- As a user, I want `/vitals` to handle currently-running commands gracefully so it doesn't false-positive on active sessions.
  - [ ] 24-hour age threshold on orphan detection — `in_progress` entries less than 24h old aren't flagged as abandoned
  - [ ] Auto-fix for orphans only proposed for entries past the 24h threshold

### Epic 4 — Pattern #13 Integration (cross-cutting)

- As a user, I want my complement rejections recorded so `/evolve` can adapt my anchored complement table.
  - [ ] When agent offers a Pattern #13 complement deferral and user says "no" or "skip," friction.jsonl gains `{friction_type: "complement_rejected", complement_involved: "<name>", confidence: "high"}`
  - [ ] Across 3+ rejections of the same complement, `/evolve` proposes either dropping it from the anchored table (Plugin track) or flagging it personal-only (Personal track)
  - [ ] Complement *failures* (agent invoked a complement and got bad result) are NOT a new friction type — captured organically via the next-time `complement_rejected` if the user declines the next offer

- As a user, I want material changes in my agent environment detected so the plugin adapts automatically.
  - [ ] Unified profile gains `_meta.last_seen_complements` — a list refreshed at every command's session-logger entry
  - [ ] Material change threshold: gain or loss of **2+ complements** between consecutive sessions
  - [ ] When threshold crossed, `/evolve` surfaces it as: "Your environment changed since last session — want to update which complements I lean on?"
  - [ ] `_meta.last_seen_complements` stays local-only — never synced, never included in any export

### Epic 5 — "Spec-Driven Development" → "Vibe Direction" Reframe

- As a Vibe Cart user, I want the plugin's self-description to match its actual energy — guiding course correction, not enforcing classroom-style spec discipline.
  - [ ] All "spec-driven development" instances replaced with "vibe direction" or "vibe coding course correction" depending on context
  - [ ] Touches: SKILL files (interview language, embedded feedback, framing copy), repo README, INSTALL doc, CHANGELOG titles for new entries (1.5.0+), npm package description, repo description on GitHub
  - [ ] Preserved unchanged: Hackathon attribution credit ("Based on the Learning Hackathon spec-driven dev plugin"), framework doc passages that talk about "spec-driven development" as an industry concept (manual pass during /build)
  - [ ] `/reflect` SKILL phrases like "the full spec-driven development cycle" become "the full cycle" — clean removal of modifier rather than verbose rephrase
  - [ ] npm `keywords` field retains `"spec-driven"` for SEO continuity even though the description changes

- As an existing user on 1.4.x who already knows the plugin as "spec-driven development," I want the rebrand to feel like sharpening, not rebranding into something I don't recognize.
  - [ ] CHANGELOG entry for 1.5.0 explicitly notes the language shift with one sentence on why ("course correction matches what we actually do")
  - [ ] Old terminology continues to work conversationally in `/onboard` — agent doesn't correct a returning user who says "spec-driven"

### Epic 6 — Cross-Cutting Shared Utilities

- As a developer of this plugin, I want a single source of truth for data contracts so SKILLs don't drift into subtly-different write implementations.
  - [ ] New reference doc `skills/guide/references/data-contracts.md` defines:
    - The unified profile JSON Schema (every documented field, type, `_meta` shape)
    - The friction.jsonl schema (per the 7 friction types, confidence enum, all fields)
    - The friction.calibration.jsonl schema
    - The sessions/*.jsonl schema (including the new sentinel-pattern `outcome: "in_progress"` entries)
    - Atomic-write protocol for JSON (write to `<file>.tmp`, fsync, rename — required by all profile writers)
    - Atomic-append protocol for JSONL (single `appendFileSync` call per entry)
    - Strict namespace isolation rule for unified profile (Pattern #11 invariant: plugins.&lt;name&gt; only)
  - [ ] All SKILLs that touch these files reference this doc and follow the protocols
  - [ ] `/vitals` check #3 reads the profile schema from this doc as its source of truth
  - [ ] Schema source format: JSON Schema files in `skills/guide/schemas/` (machine-validatable, `/vitals` consumes directly) AND markdown explanations in the data-contracts doc (human-readable, SKILL-writer-readable)

- As a developer, I want shared utility scripts so atomic-write and atomic-append logic isn't duplicated across SKILLs.
  - [ ] New `scripts/atomic-write-json.sh` — takes target path + JSON content, writes to temp, fsyncs, renames atomically
  - [ ] New `scripts/atomic-append-jsonl.sh` — takes target path + JSON line, ensures directory exists, single-atomic-append
  - [ ] All SKILLs that previously inlined atomic-write Bash now invoke these scripts
  - [ ] Script interface signatures match the future TypeScript signatures planned for `@626labs/plugin-core` Phase 2 extraction (so SKILL contracts don't change between L3.5 Bash and L4+ TypeScript versions)

## What We're Building

Concretely shippable in 1.5.0:

- **New SKILL files:**
  - `plugins/vibe-cartographer/skills/decay/SKILL.md` — runtime decay logic (read-merge-write per field with `last_confirmed` stamps)
  - `plugins/vibe-cartographer/skills/friction-logger/SKILL.md` — append rules, schema, confidence-tagging discipline
  - `plugins/vibe-cartographer/skills/vitals/SKILL.md` — the 5 checks, banner-style output, single-shot auto-fixes
  - `plugins/vibe-cartographer/skills/friction-log/SKILL.md` — `/friction-log` inspection command behavior

- **New command files:**
  - `plugins/vibe-cartographer/commands/vitals.md`
  - `plugins/vibe-cartographer/commands/friction-log.md`

- **Updated SKILL files:**
  - `plugins/vibe-cartographer/skills/onboard/SKILL.md` — calls decay logic at start, writes `last_confirmed` stamps
  - `plugins/vibe-cartographer/skills/reflect/SKILL.md` — adds calibration question at end of Part B
  - `plugins/vibe-cartographer/skills/evolve/SKILL.md` — reads friction.jsonl, weights by confidence and calibration
  - `plugins/vibe-cartographer/skills/session-logger/SKILL.md` — implements sentinel pattern (entry-on-start, terminal-on-end), updates `_meta.last_seen_complements`
  - **All command SKILLs** (`scope`, `prd`, `spec`, `checklist`, `build`, `iterate`, `reflect`, `onboard`, `evolve`, `vitals`, `friction-log`) — call friction-logger at appropriate trigger points
  - `plugins/vibe-cartographer/skills/guide/SKILL.md` — Pattern #4 / #6 / #8 sections, integration callouts to Pattern #13

- **New reference + schema files:**
  - `plugins/vibe-cartographer/skills/guide/references/data-contracts.md` — single source of truth doc
  - `plugins/vibe-cartographer/skills/guide/schemas/builder-profile.schema.json`
  - `plugins/vibe-cartographer/skills/guide/schemas/friction.schema.json`
  - `plugins/vibe-cartographer/skills/guide/schemas/friction-calibration.schema.json`
  - `plugins/vibe-cartographer/skills/guide/schemas/session-log.schema.json`

- **New scripts:**
  - `scripts/atomic-write-json.sh`
  - `scripts/atomic-append-jsonl.sh`

- **Content sweep:**
  - "spec-driven development" → "vibe direction" / "vibe coding course correction" across SKILLs, README, INSTALL, package descriptions
  - Manual pass on framework doc to preserve historical/conceptual references
  - npm package description updated, `keywords` retains `"spec-driven"` for SEO continuity

- **Release artifacts:**
  - CHANGELOG entry for 1.5.0 with all changes including the language reframe note
  - `plugins/vibe-cartographer/.claude-plugin/plugin.json` version → 1.5.0
  - `package.json` version → 1.5.0
  - GitHub release with `.plugin` asset
  - npm publish

## What We'd Add With More Time

- **Decay sensitivity tuning** — let users override TTLs per field type via the unified profile (not just on/off via `decay_disabled`)
- **Friction-log export** — `/friction-log --export` to produce an anonymized JSONL the user could optionally share in a GitHub issue or with the plugin author
- **`/vitals` HTML report** — for users who want to share a structural-health snapshot externally
- **Auto-fix beyond single-shot deterministic** — friction-log-driven proposals that suggest specific SKILL edits (overlaps with `/evolve` — should probably stay there)
- **Schema versioning migration tools** — when 1.5.x → 1.6.x changes the unified profile schema, build a `/vitals --migrate` flow
- **Cross-plugin `/vitals` orchestration** — Cart's `/vitals` could optionally invoke other 626Labs plugins' health checks (Vibe Doc, Vibe Sec, Vibe Test) — but only after Pattern #15 (Cross-Plugin Task Handoff) ships and after each plugin has its own self-test

## Non-Goals

- **Auto-rewrite of stale fields.** Violates the framework invariant that the user is the final arbiter of self-evolution. Decay marks `stale: true` and prompts; never silently rewrites.
- **Auto-categorization of friction beyond the 7 types.** LLM clustering is non-deterministic and unauditable — friction log loses its debug value.
- **Sending friction data to 626Labs Dashboard or any external endpoint.** Local-first invariant. Plus this would cross into Pattern #15 territory which we explicitly deferred.
- **Cross-plugin checks in `/vitals`.** Plugin sovereignty. Vibe Cartographer doesn't reach into Vibe Doc's filesystem to verify its files.
- **Performance/timing analysis in `/vitals`.** Different tool category — a profiler is not a structural integrity checker.
- **Per-project state decay.** Cart doesn't yet have a per-project state file (Pattern #2). Decay applies only to the unified profile here.
- **Migration tooling for 1.4.x → 1.5.0.** The 1.5.0 schema is forward-compatible — new optional fields don't break old reads.
- **Patterns #14, #15, #16.** Each is a separate scope. #14 needs Anthropic's manifest `monitors:[]` primitive. #15 waits on Cowork mailbox docs. #16 is a nice-to-have L3.1 follow-up.
- **`@626labs/plugin-core` extraction.** Phase 2 of the monorepo migration — separate work after L3.5 stabilizes. Shared utility scripts in `scripts/` are designed to be lifted into Phase 2 with minimal change.
- **Vibe Doc / Vibe Sec / Vibe Test pattern adoptions.** Each plugin gets its own `/scope` run.

## Open Questions

To resolve in `/spec`:

- **Decay metadata storage shape.** Parallel `_meta.<field-path>.last_confirmed` map alongside the actual values, or inline `_meta` objects on each field? Trade-off is reader complexity vs writer complexity. Needs answering before /spec writes the schema.
- **`/vitals` location in the SKILL hierarchy.** Standalone command SKILL vs sub-command of `/evolve`? Standalone is cleaner mental model (evolve = propose changes, vitals = check current state). Confirmed this lean during /prd; /spec finalizes the directory layout.
- **`/friction-log` command name.** `/vibe-cartographer:friction-log` (descriptive) vs `/vibe-cartographer:friction` (shorter). User leans shorter. /spec confirms.
- **Atomic-write script implementation language.** Plain Bash, or Node.js single-file scripts? Bash is more portable and matches existing scripts; Node.js gives better JSON parsing safety. /spec decides based on existing plugin conventions.

To resolve during `/build`:

- **Real-world friction-detection thresholds.** The 50% line-diff threshold for `artifact_rewritten` and the 5/session noise threshold for `/vitals` check #5 are educated guesses. /build implements them, /reflect or `/evolve` may surface tuning needs after real usage.
- **Calibration decay TTL.** Should `friction.calibration.jsonl` entries decay on the same 180-day TTL as preferences, or longer/shorter? Not load-bearing for v1.5.0 — pick a reasonable default and adjust later.
