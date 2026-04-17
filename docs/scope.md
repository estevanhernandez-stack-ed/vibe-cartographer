# Vibe Cartographer L3.5 — Patterns #4, #6, #8 + #13 Integration

## Idea

Bring Vibe Cartographer from Level 3 (reflective evolution via `/evolve`) to **Level 3.5** by shipping three load-bearing patterns the framework documents but the plugin doesn't yet implement: **Pattern #4 (Memory Decay & Refresh)**, **Pattern #6 (Friction Log)**, and **Pattern #8 (Plugin Self-Test, surfaced as `/vitals`)**. Every new pattern integrates with **Pattern #13 (Ecosystem-Aware Composition)** so the four work as a coherent self-improvement system rather than disconnected features.

## Who It's For

**Existing Vibe Cartographer users** — currently ~770 weekly downloads across the new (`@esthernandez/vibe-cartographer`, 201/wk) and deprecated (`@esthernandez/app-project-readiness`, 572/wk) npm packages. The audience is people running the plugin on real projects and accumulating session history. They benefit when `/evolve` produces sharper proposals, when stale profile fields stop pretending to be fresh, and when the plugin can self-diagnose silent rot before it bites.

**Specific unmet need:** L3 evolution shipped two days ago and is already starving — there's no friction log to read from, the unified profile has no decay so stale defaults persist forever, and the plugin has no way to verify its own files haven't drifted out of sync. L3.5 closes those three gaps.

## Inspiration & References

- **`docs/self-evolving-plugins-framework.md`** — canonical pattern definitions for #4, #6, #8, and #13. Architecture reference for this entire scope.
- **Pattern #13 implementation** in `plugins/vibe-cartographer/skills/guide/SKILL.md` — the curated complement table, live discovery heuristics, and "when NOT to defer" rules. Sets the template for how the new patterns integrate with composition.
- **`/evolve` SKILL** at `plugins/vibe-cartographer/skills/evolve/SKILL.md` — the consumer of friction-log data. Pattern #6 must produce entries `/evolve` can act on.
- **Vibe Doc 0.4.0 CLI banner aesthetic** (chalk + ora + cli-table3) — the visual reference for `/vitals` output. In a slash-command markdown context, this means boxed sections, color-coded status indicators, table format for findings, light banner header. Not a literal terminal-styled binary.
- **Friction archaeology research (2026-04-16)** — surfaced the gap that motivated this scope. Specifically: `/evolve`'s self-imposed ban on `process-notes.md` (now lifted in 1.4.1), unimplemented decay leading to drifted profile values like `build_mode_preference: "iterative-prototype"` (not in any defined enum), and silent SKILL-reference rot.
- **Real friction examples from this conversation** that should land in the friction log on day one:
  - Builder asked agent to "dumb down" the architecture-docs question during onboarding (`rephrase_requested`)
  - Builder pushed back hard on the reflexive cut list during scope (`default_overridden` — the agent's reflex was the default, builder's pushback was the override)
  - Sentinel pattern for `command_abandoned` was discovered necessary mid-scope (gap surfacing into the design itself)

## Goals

- **Ship Pattern #4** so the unified profile can age gracefully — fields decay on TTL, get marked `stale: true`, and prompt low-friction confirmation at natural moments. Identity fields never decay.
- **Ship Pattern #6** so `/evolve` has structured friction signal beyond what session-logger captures. Append-only, schema-versioned, defensive-default (don't log when uncertain), self-calibrating via confidence field and `/reflect` calibration loop.
- **Ship Pattern #8 as `/vitals`** so structural rot doesn't accumulate silently. Read-only diagnostic by default, with explicit user-confirmed auto-fix for obvious deterministic cases (e.g., legacy namespace migration). Output mimics Vibe Doc's CLI banner aesthetic.
- **Integrate all three with Pattern #13** so the L3.5 release tells one coherent story: the plugin learns the user's environment (composition), notices what doesn't land (friction), forgets stale assumptions (decay), and sanity-checks itself (vitals).
- **Reframe "spec-driven development" → "vibe direction" language** across SKILLs and READMEs as a content-only pass alongside the pattern work. Sitting in the unified profile untouched since Sanduhr — handle it while we're already touching SKILLs.
- **Builder outcome:** ship a 1.5.0 release that materially sharpens `/evolve` for current users, gives them a self-diagnostic command, and continues the L3 → L4 maturity-ladder progression on the framework's own published path.

## What "Done" Looks Like

A user on Vibe Cartographer 1.5.0 experiences:

- **Decay in action.** After ~6 months of using the plugin, the agent quietly asks at the start of `/scope`: "Last time I had your persona as superdev — still right, or shifted?" One question, low friction. Builder answers, profile updates, `last_confirmed` re-stamped.
- **Friction log in action.** Builder rejects a Pattern #13 complement deferral. Agent silently appends `{friction_type: "complement_rejected", complement: "superpowers:tdd", confidence: "high"}` to `~/.claude/plugins/data/vibe-cartographer/friction.jsonl`. Three weeks later, the next `/evolve` run surfaces: "You've rejected superpowers:tdd 4/5 times during /build. Want me to drop it from the anchored complement table for your sessions specifically?"
- **`/vitals` in action.** Builder runs `/vibe-cartographer:vitals`. Output (Vibe-Doc-banner-style) shows:
  - ✓ All 11 SKILL files reachable
  - ✓ All 6 templates resolve
  - ✓ Unified profile parses against schema
  - ⚠ `plugins.app-project-readiness` block still present from pre-1.0 days. Migrate to `plugins.vibe-cartographer`? [y/n]
  - ✓ All 8 anchored Pattern #13 complements detected as available skills
  - ✓ Friction log volume normal (avg 1.2 entries/session over last 10 sessions)

Concretely shippable by the end of `/build`:

- New `skills/decay/SKILL.md` — runtime decay logic (read-merge-write per field with `last_confirmed` stamps)
- New `skills/friction-logger/SKILL.md` — append rules, schema, confidence-tagging discipline
- New `skills/vitals/SKILL.md` + `commands/vitals.md` — the `/vitals` command and its checks
- New `skills/friction-log/SKILL.md` + `commands/friction-log.md` — read-only inspection command for the friction.jsonl
- Updates to `skills/onboard/SKILL.md` (consume decay, write `last_confirmed` stamps)
- Updates to `skills/reflect/SKILL.md` (calibration loop question for friction log)
- Updates to `skills/evolve/SKILL.md` (read friction.jsonl, weight by confidence)
- Updates to every command SKILL (call friction-logger at appropriate trigger points)
- Updates to `skills/session-logger/SKILL.md` (sentinel-pattern entry-on-start, terminal entry on completion)
- Updates to `skills/guide/SKILL.md` (Pattern #4 / #6 / #8 sections, integration callouts to Pattern #13)
- Content sweep: `/spec/-driven development/vibe direction/` across SKILLs and READMEs (separate but bundled)
- CHANGELOG and version bump to 1.5.0
- Framework doc updates if any pattern definitions get clarified during /build

## What's Explicitly Cut

Cuts grounded in real engineering or scope-ownership reasons (not "MVP for the sake of MVP"):

- **Auto-rewrite of stale fields (#4).** Violates the framework invariant that the user is the final arbiter of self-evolution. Decay marks `stale: true` and prompts; never silently rewrites.
- **Auto-categorization of friction beyond the 7 types (#6).** LLM clustering is non-deterministic and unauditable. Friction log loses its debug value if entries can't be inspected with `cat | jq` and understood at a glance.
- **Sending friction data to 626Labs Dashboard (#6).** Privacy invariant (local-first). Plus this would cross into Pattern #15 (Cross-Plugin Task Handoff) which we explicitly deferred.
- **Cross-plugin checks in `/vitals` (#8).** Plugin sovereignty — Vibe Cartographer shouldn't reach into Vibe Doc's filesystem to verify its files. Vibe Doc gets its own `/vitals` equivalent in a future scope.
- **Performance/timing analysis in `/vitals` (#8).** Different tool category (profiler ≠ structural integrity checker). Out of scope.
- **Per-project state decay (#4).** Cart doesn't yet have a per-project state file (`Pattern #2`). Decay applies only to the unified profile here.
- **Auto-fix beyond the deterministic, single-shot cases.** `/vitals` can offer user-confirmed migration of legacy namespaces and similar obvious wins, but anything requiring judgment (which complement to add to the table, which SKILL section to rewrite) stays a manual edit.
- **Migration tooling for users on Cart 1.4.x → 1.5.0.** The 1.5.0 schema is forward-compatible — new optional fields (`last_confirmed` per profile field, `confidence` on friction entries) don't break old reads.
- **Pattern #14 (Background Monitor Lifecycle), #15 (Cross-Plugin Task Handoff), #16 (Session-Scoped Feature Flags).** Each is a separate scope. #14 needs Anthropic's manifest `monitors:[]` primitive — focused future cycle. #15 waits on Cowork mailbox docs. #16 is a nice-to-have L3.1 follow-up.
- **`@626labs/plugin-core` extraction.** Phase 2 of the monorepo migration — separate work that begins after L3.5 stabilizes.
- **Vibe Doc / Vibe Sec / Vibe Test pattern adoptions.** Each plugin gets its own `/scope` run when its time comes. This scope is Cart-only.

## Loose Implementation Notes

Non-binding early thinking — `/spec` will refine.

### Pattern #4 — Memory Decay & Refresh

- New per-field metadata in `~/.claude/profiles/builder.json`. Probably parallel-structured: a `_meta.<field-path>.last_confirmed` map alongside the actual values, so existing readers don't see schema additions in the data they read.
- Decay TTLs by field type (proposed defaults, refine in `/spec`):
  - `preferences.persona`: 180 days
  - `preferences.tone`, `preferences.pacing`, `preferences.communication_style`: 180 days
  - `technical_experience.level`: 365 days
  - `technical_experience.languages` / `frameworks`: 90 days
  - `creative_sensibility`: never decays
  - `name`, `identity`: never decays
- Decay check runs on read, not on a schedule. Makes it stateless and deterministic.
- One decay prompt per session maximum. Cap to prevent confirmation fatigue.

### Pattern #6 — Friction Log

- File: `~/.claude/plugins/data/vibe-cartographer/friction.jsonl`. Strict append-only.
- Schema: `{schema_version: 1, timestamp, plugin_version, command, friction_type, symptom, agent_guess_at_cause, complement_involved, confidence}`.
- 7 friction types: `command_abandoned`, `default_overridden`, `complement_rejected`, `repeat_question`, `artifact_rewritten`, `sequence_revised`, `rephrase_requested`.
- Sentinel pattern for `command_abandoned`: every command appends `{outcome: "in_progress"}` at start. On natural completion, appends a terminal entry. On next session start, the session-logger SKILL scans for orphaned `in_progress` entries older than 24h with no terminal entry — for each orphan, appends `{friction_type: "command_abandoned"}` to friction.jsonl.
- Confidence field tagging:
  - Explicit events (`complement_rejected`, `sequence_revised`, `rephrase_requested`): `confidence: "high"`
  - Measured events (`artifact_rewritten` ≥50% diff): `confidence: "high"`
  - Inferred events (`default_overridden`): `confidence: "medium"`
  - Subjective events (`repeat_question`): `confidence: "low"` and only logs if agent can quote the prior message it thinks was the answer
- Calibration: `friction.calibration.jsonl` sibling file. `/reflect` ends with one question: "I captured N friction notes — anything I logged wrong, or missed?" Builder marks false positives / false negatives. `/evolve` weights entries against calibration data.

### Pattern #8 — `/vitals`

- New SKILL at `skills/vitals/SKILL.md` plus `commands/vitals.md`.
- Five checks:
  1. Every SKILL file referenced by another SKILL exists at the expected path
  2. Every template file referenced by a SKILL exists
  3. Unified profile parses against schema; no fields outside documented set
  4. Every complement in the anchored Pattern #13 table appears in the agent's available skills list (warns on miss)
  5. Friction log volume sanity (warn if >5/session avg over last 10 sessions, or 0/session over last 10 sessions)
- Output style: chalk-style coloring, boxed sections, table for findings, banner header. Achieved through markdown output (the slash command produces formatted markdown that evokes the binary aesthetic).
- Auto-fix actions: explicit user confirmation per fix, single-shot deterministic only. Initial fixes: legacy `plugins.app-project-readiness` namespace migration; orphaned `in_progress` session-log entries; missing `last_confirmed` stamps after a 1.4.x → 1.5.0 upgrade.

### Pattern #13 integrations

- **#6 ↔ #13:** Friction log captures complement rejections and complement failures (when agent invokes a complement and it errors). New friction subtypes don't get added — `complement_rejected` and `complement_involved` field cover both.
- **#8 ↔ #13:** `/vitals` check #4 explicitly verifies the anchored complement table is still real. Catches when Anthropic renames or deprecates a complement skill.
- **#4 ↔ #13:** Unified profile gains a `_meta.last_seen_complements` field — recorded each session, decayed on the same TTL as preferences. When the field shows materially different complements vs the previous run, `/evolve` gets a "your environment has shifted" hint.

### Content reframe

- Find/replace all "spec-driven development" instances to "vibe direction" or "vibe coding course correction" depending on context. Audit list to compile during `/checklist`. Touch SKILLs, READMEs, CHANGELOG titles for new entries, npm package descriptions.
- Keep "spec-driven development" in historical contexts (e.g., the "Based on the Learning Hackathon" credit, framework doc references to the philosophy) — only rename when the phrase appears as the plugin's self-description.

### Open questions for `/spec`

- Decay metadata storage: parallel `_meta` map vs inline-per-field structure? Tradeoff: readability vs writer complexity.
- `/vitals` location: standalone command vs sub-command of `/evolve`? Standalone seems cleaner — different mental model (evolve = propose changes, vitals = check current state).
- Friction-log inspection command name: `/vibe-cartographer:friction-log` or `/vibe-cartographer:friction`? Bias toward shorter.
