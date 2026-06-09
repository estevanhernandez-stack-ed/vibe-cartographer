# Proposed Changes — /evolve-cart run 2026-06-09

> **L3 reflective-evolution output. PROPOSE only — nothing here has been applied to any SKILL file.**
> Authored 2026-06-09 by The Architect (autonomous orchestrator-context run; session-logger not wired in this environment, this file is the durable record per `skills/guide/SKILL.md > Session Logging`).
> Review queue: each proposal takes `[apply]` / `[modify]` / `[reject]` / `[skip]`. Plugin-track edits land only on explicit yes, and even then stay uncommitted until a deliberate commit session.

## Corpus analyzed

- **Session logs:** 8 files at `~/.claude/plugins/data/vibe-cartographer/sessions/` — 17 entries, 2026-04-15 → 2026-06-06, plugin versions 1.0.0 → 1.9.1.
- **Friction logs:** `friction.jsonl` and `friction.calibration.jsonl` **do not exist** in either config home (`~/.claude`, `~/.claude-personal`). The §2b weighting algorithm had zero rows of input; rankings below use evidence-count + concreteness as the documented fallback (see Proposal 5).
- **Process-notes (5 most recent by last-modified):** Sanduhr (2026-06-06), ROROROblox (2026-06-06), koii-tracker (2026-05-24), Project-626Labs-gnx (excluded — byte-identical copy of Project-626Labs-1's April notes, double-counting), vibe-sec (2026-05-23).
- **Profile:** `~/.claude/profiles/builder.json` `plugins.vibe-cartographer` block.
- **Ground truth:** v1.9.1 SKILL tree, solo-repo git history, installed caches in both homes, sibling-plugin caches.

**The headline pattern:** a six-week telemetry blackout (2026-04-26 → 2026-06-06) during the plugin's most active period — Cart cycles #12–16 plus 13+ ROROROblox command runs produced rich process-notes and **zero** session-log or friction entries. Proposals 1, 2, and 5 are three cuts at that one wound; 3 and 4 are a lost-work event the blackout hid.

---

## Proposal 1 — Ship the atomic scripts inside the plugin; auto-create the data dir; fail loud instead of skipping silently

**Track: Plugin** · **Confidence: high** · **Weighted evidence: ~10 builder-authored flags across 6+ command runs and 3 cycles, plus a mechanically verified root cause — the strongest signal in the corpus**

> **Disposition: [applied] 2026-06-09** — committed locally (not pushed; version unbumped). Copied `atomic-append-jsonl.js` + `atomic-write-json.js` into `plugins/vibe-cartographer/scripts/`; rewrote every `node scripts/…` invocation across `session-logger`, `friction-logger`, `decay`, `reflect`, `vitals`, and `data-contracts.md` to `node ${CLAUDE_PLUGIN_ROOT}/scripts/…` (18 invocation sites, 6 files); added auto-create + write-anyway fail-loud fallback to both logger SKILLs (silent-skip removed).

### Observation

The session/friction loggers cannot run in the contexts where Cart actually gets used, and they degrade by *silently skipping* rather than writing.

From `C:/Users/estev/Projects/ROROROblox/process-notes.md` (builder-authored, repeated across cycles):

> "Cart's plugin data dir at `~/.claude/plugins/data/vibe-cartographer/` still does not exist on this machine. Third cycle confirming the gap (cycle #1 + cycle #2 onboard already flagged). **Strong /evolve signal — the loggers should auto-create their data dir or fail loud.**" (line 23; same flag recurs at lines 48, 73, 141, 172, 215, 278, 304, 327, 347 — through "Sixth cycle confirming the gap")

> "Skipped `session-logger.start` + `friction-logger.log` calls; no jsonl entries written." (line 172; koii-tracker's 2026-05-09 /onboard notes show the same skip)

**Root cause, verified:** `skills/session-logger/SKILL.md` and `skills/friction-logger/SKILL.md` both hardcode `node scripts/atomic-append-jsonl.js` — but `scripts/` lives at the **solo-repo root**, outside the packaged `plugins/vibe-cartographer/` subtree. The installed caches (1.8.0 and 1.9.1, checked in both homes) contain `.claude-plugin/ architecture/ commands/ skills/` and **no `scripts/` directory**. The dependency is dead on every installed copy; agents treat it as "runtime not wired" and skip. Sibling proof it's fixable: **vibe-doc ships the identical scripts in-tree** (`cache/vibe-doc/vibe-doc/0.8.0/scripts/atomic-append-jsonl.js` present in both homes), and correspondingly `~/.claude-personal/plugins/data/` has dirs for vibe-iterate, vibe-prompt, and vibe-wrap — but not vibe-cartographer.

### Proposed change

1. **Move (or copy) `atomic-append-jsonl.js` and `atomic-write-json.js` into `plugins/vibe-cartographer/scripts/`** so they ship with the plugin (the vibe-doc layout).
2. **Update every invocation** in `skills/session-logger/SKILL.md` (steps 5 of `start()` and step 4 of `end()`, plus the "Atomic protocol" bullet) and `skills/friction-logger/SKILL.md` ("Atomic appends only" bullet) to resolve the script relative to the **plugin install root**, not the cwd — e.g. "`node <plugin-root>/scripts/atomic-append-jsonl.js …` where `<plugin-root>` is the directory containing this SKILL's `.claude-plugin/plugin.json`".
3. **Add a write-anyway fallback** to both logger SKILLs, replacing the current silent-skip behavior:

   Current (`session-logger/SKILL.md`, Where the Log Lives):
   > `mkdir -p` the directory on first use (the atomic-append script handles this).

   Proposed addition:
   > **If the script path cannot be resolved** (installed context without `scripts/`, orchestrator run, unexpected layout): do NOT skip. Fall back to a direct append — create `~/.claude/plugins/data/vibe-cartographer/sessions/` (and parents) if absent, then append the JSON line with any available file-write tool. Atomicity is preferred, but a plain append beats a missing entry. **Only if both paths fail**, surface the one-time heads-up banner (guide SKILL > Session Logging) — fail loud, never silent.

**Acceptance criteria:** a fresh config home gets `~/.claude/plugins/data/vibe-cartographer/` auto-created on the first command of the first session; a run where logging is impossible says so once, visibly.

---

## Proposal 2 — Implement `/vibe-cartographer:reconnect` (promote the backfill spec from documented to shipped)

**Track: Plugin** · **Confidence: high** · **Weighted evidence: 3 session-log mentions + a measurable 6-week data hole spanning ~7 cycles**

### Observation

The reconnect backfill — process-notes → session-log entries — has been specced-but-not-implemented for seven weeks while exactly the gap it exists to repair grew to its largest size ever.

- 2026-04-22 session log: "Reconnect procedure spec appended" (`skills/session-logger/SKILL.md > Reconnect procedure`).
- 2026-04-25 session log: "/reconnect procedure not yet implemented; manual write is the documented fallback."
- 2026-04-26 session log: "/reconnect remains specced-but-not-implemented; documented … as eligible for a future plugin-side cycle."
- The spec's own gate: "**When demand warrants**, a `skills/reconnect/SKILL.md` companion lands and implements exactly this recipe." Demand is now demonstrated: ROROROblox alone has 13+ `## /<command> — autonomous run` headings with zero corresponding session entries, and this very `/evolve-cart` run had to mine process-notes by hand because the structured corpus is blind to May.

### Proposed change

Add `skills/reconnect/SKILL.md` + `commands/reconnect.md` implementing the existing recipe **verbatim** (it's already contract-stable): parse `## /<command>` headings from a project's `process-notes.md`; deterministic `sha1(project_dir + command + timestamp)` sessionUUID for idempotency; sentinel + terminal pair per heading (terminal = parsed timestamp + 1s); opt-in with diff preview; skip headings whose computed UUID already exists; never edits `process-notes.md`. Per the new-SKILL obligations: add the `/reconnect` row set to `guide/references/friction-triggers.md` (read-only command — likely a `(none)` section like `/vitals`) and let `/vitals` checks #1/#6 cover it.

Also update the two pointers that currently promise it ("a future `/vibe-cartographer:reconnect` command will implement it" in `guide/SKILL.md`; "Not yet implemented as a slash command" in `session-logger/SKILL.md`) to reference the shipped command.

**Acceptance criteria:** running `/reconnect` against ROROROblox backfills its 13+ runs; re-running produces zero duplicates; this fall's `/evolve-cart` sees May.

---

## Proposal 3 — Re-land the autonomy-mode adaptation that was applied 2026-04-26 and lost

**Track: Plugin** (activation stays Personal — gated on the builder's profile field) · **Confidence: high on the loss, medium-high on the reconstruction** · **Weighted evidence: 1 session-log record of 13 applied files + zero survival verified across 4 locations + 2 post-loss runs improvising the behavior**

### Observation

The 2026-04-26 `/evolve` run applied "Autonomy Mode Adaptation" across the guide + 9 command SKILLs, an `/evolve` auto-apply invariant flip with a Plugin-track safety guard, `cart-cycle-brief-template.md`, and `three-modes.md` (superseding `four-modes.md`). **None of it exists today**: `grep` for "Autonomy Mode Adaptation" / `autonomy_level` / `cycle_builder_identity` across the v1.9.1 tree returns nothing; `git log --all -S` shows the content never entered this repo's history; the old v1.7.3 folder and both installed caches lack it; `four-modes.md` is still present and `three-modes.md` / the brief template are absent. The run's own log says "cache mirrored; **no commit**" — the edits lived only in a working tree that the v1.7+ rebuild replaced.

Meanwhile the same run's **Personal-track writes survived** and are load-bearing: `builder.json` still carries `autonomy_level: "fully-autonomous"` and `cycle_builder_identity: "self"`, with a note promising "Future Cart commands will respect this field per the autonomy-mode-aware behavior added to skills/guide/SKILL.md" — a dead pointer. Real runs have been improvising the missing contract from profile prose: koii-tracker's 2026-05-09 /onboard ("**Per the autonomous-run contract:** opt in once, flow through, surface every assumption, defer stale decay-stamps to the next interactive run") and Sanduhr's 2026-06-06 /checklist (header encodes `autonomy_level: fully-autonomous`; milestone-gate checkpoints chosen). The behavior exists in practice but is defined nowhere the plugin ships — new users get none of it, and even this builder gets whatever version the session's agent infers.

### Proposed change

Re-land as a **single section + pointers**, smaller than the original 13-file application:

1. **`skills/guide/SKILL.md` — new section "Autonomy Mode Adaptation"** (after Mode: Learner vs Builder): read `plugins.vibe-cartographer.autonomy_level` (`"guided"` default | `"fully-autonomous"`) and `cycle_builder_identity` (`"self"` | `"agent-persona"`) from the unified profile at command start. Guided = current behavior, unchanged. Fully-autonomous = the documented contract: opt in once at /onboard, flow through interview beats answerable from profile + project artifacts, surface every assumption inline (marked `(default — confirm on next interactive run)`), defer stale decay-stamps, never pause for confirmations the profile already answers. Promotion criteria note (N+ completed projects, rich brief, opt-in).
2. **One pointer line per command SKILL** ("Honor the Autonomy Mode Adaptation contract in `guide/SKILL.md`") rather than per-command tables.
3. **`skills/evolve-cart/SKILL.md` — the safety guard from the original run's key_decisions:** at `autonomy_level: fully-autonomous`, Personal- and Community-track actions may auto-apply, but **Plugin-track SKILL edits ALWAYS queue for explicit review** — autonomy never extends to the plugin editing itself unsupervised.

Respect the existing constraints: no changes to the persona table or Learner/Builder mode tables (autonomy is a third axis, as the original run framed it).

**Acceptance criteria:** the profile note's pointer resolves to real shipped text; a fresh agent reading only the installed plugin can reproduce koii-tracker's "autonomous-run contract" behavior without improvising.

---

## Proposal 4 — Evolve-run continuity: durable proposal artifact + a `/vitals` survival check

**Track: Plugin** · **Confidence: medium-high** · **Weighted evidence: one verified total-loss event (13 files, undetected for 6 weeks) + 3 runs logging "no commit" + a duplicate terminal entry showing write-discipline wobble**

### Observation

Proposal 3's loss event is a mechanism problem, not a one-off: `/evolve-cart` step 5 applies Plugin-track edits directly to SKILL files and instructs "Do NOT commit or push. Show the diff that was applied and move on." Nothing downstream verifies those edits ever reached a commit. The 2026-04-25 and 2026-04-26 runs both logged "cache mirrored; **no commit**"; the 2026-04-26 batch evaporated in a tree rebuild and **no check noticed** — the loss surfaced only because this run grepped for content the session log claimed was applied. (Minor same-family signal: the 2026-04-17 evolve terminal entry was double-appended verbatim.)

### Proposed change

Two small additions, no behavior removed:

1. **`skills/evolve-cart/SKILL.md` step 6:** every run writes/updates **`proposed-changes.md` at the solo-repo root** as the durable record — observations, per-proposal disposition (applied / rejected / deferred), and for applied Plugin-track edits the exact diff text. This matches the convention `guide/references/friction-triggers.md` already names ("User rejects a proposal in `proposed-changes.md`") and the existing `proposed-changes-harness.md` sibling. A working-tree wipe then costs the edits but not the record — the next run re-proposes from the file instead of rediscovering from absence. Append to the step-6 summary template: "Plugin-track edits applied this run are UNCOMMITTED until you commit them. Durable record: proposed-changes.md."
2. **`skills/vitals/SKILL.md` — new Check #10 "Evolve continuity":** for each `command: "evolve*"` session entry with non-empty `applied_files`, verify the named file still exists in the canonical tree and (when the entry names a specific section/heading) that the content survives; flag misses as "evolve-applied work missing from tree — re-land or mark superseded." Read-only, like every other check.

**Acceptance criteria:** re-running `/vitals` against today's state flags the 2026-04-26 batch instead of staying green.

---

## Proposal 5 — Cold-start honesty in the Analyze phase when `friction.jsonl` is empty

**Track: Plugin** · **Confidence: medium** · **Weighted evidence: 7 weeks × 2 config homes × zero friction rows ever, against ~80 lines of weighting machinery; partially derivative of Proposal 1 but a distinct surface**

### Observation

`/evolve-cart` §2a–2e (base weights, calibration multipliers, 180-day TTL, complement-rejection thresholds) has never processed a single row — `friction.jsonl` has never existed anywhere. The SKILL's only instruction for that file is "read line-by-line, silent-drop malformed lines"; it says nothing about the file being absent, so every run to date has silently analyzed an empty primary input while the actual signal sat in process-notes — where the builder literally writes "**Strong /evolve signal**" sentences by hand (ROROROblox, 6+ occurrences) — and in session-log `friction_notes` arrays.

### Proposed change

Add a short **cold-start branch** at the top of §2a in `skills/evolve-cart/SKILL.md`:

> **If `friction.jsonl` is missing or empty:** say so explicitly in the step-1 framing ("no structured friction captured yet — ranking from session-log friction_notes and process-notes flags"). Treat explicit builder-authored evolve flags in process-notes (phrases like "/evolve signal", "evolve should pick this up", "CRITICAL:") as synthetic entries with `confidence: "high"` (weight 1.0, same standing as `false_negative` calibrations — the builder explicitly flagged them); treat other narrative friction as `medium`. Surface the capture gap itself as a standing observation until structured entries begin to exist. Skip §2b–2e mechanics that have no input; do not fabricate weights for them.

This keeps the full weighting machinery intact for when Proposal 1 turns the data on, and makes first-month behavior honest for **every** new user — everyone's friction.jsonl starts empty.

**Acceptance criteria:** an /evolve-cart run on a fresh install names its actual evidence base instead of implying weighted-friction analysis happened.

---

## Intake notes — signals reviewed and not proposed

| Signal | Disposition |
|---|---|
| **Bring-your-own decision-log MCP** (seeded 2026-05-23 in `proposed-changes-harness.md`, "status: deferred, evolve-input only") | **Resolved before this run** — commit `db3989a` + `skills/coder-voice/SKILL.md` line 427 already carry the MCP-agnostic framing ("your decision-log MCP if present… auto-detects the 626Labs dashboard… never required"). No further edit proposed; recommend marking the seed resolved. |
| Sanduhr 2026-06-06: builder overrode every-3-4-items verification cadence for milestone-gate checkpoints "at real seams" | 2 conflicting data points total (April 16 accepted the mechanical cadence). Below the 3-entry minimum. Watch next cycles; if it recurs, propose offering milestone-gates as a named /checklist option. |
| Historical entries log `command: "evolve"` vs the renamed `evolve-cart`; 2026-04-17 entry double-appended | Cosmetic — the schema doesn't enum-constrain `command`; rename commit `374cf3a` explains the drift. The duplicate is one occurrence, folded into Proposal 4's evidence. |
| `complements_invoked: []` in every terminal entry that has the field | Cannot distinguish "never offered" from "never logged" while logging itself is broken — blocked on Proposal 1. Re-examine when data flows. |
| Persona drift `superdev` (April) → `architect` (later runs) | The decay system's job; no friction evidence it misfired. |

## Run log note

This run executed in orchestrator context (sub-agent, non-interactive): `session-logger.start()`/`end()` and the step-7 legacy entry were **not** written, and no friction entries were logged, per the run's write-scope constraint (this file is the only artifact). The interactive review queue above replaces the in-session stop-and-confirm rhythm — process each proposal with `[apply]` / `[modify]` / `[reject]` / `[skip]` in a Cart-wired session, which will also log the deferred session entry.
