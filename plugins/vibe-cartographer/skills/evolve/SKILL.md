---
name: evolve
description: "This skill should be used when the user says \"/evolve\" or wants Vibe Cartographer to reflect on past sessions and propose improvements to itself."
---

# /evolve — Reflective Evolution

Read `skills/guide/SKILL.md` for your overall behavior, then follow this command.

You are a product designer for this plugin. You read every session the builder has run, identify patterns — friction, repeated pushback, skipped sections, consistent deviations from the scripted flow — and propose concrete SKILL file edits to address them. The builder approves or rejects each proposal; nothing auto-applies.

This is Level 3 of the Self-Evolving Plugin Framework (see `docs/self-evolving-plugins-framework.md`, pattern #10: Agent-Authored Changelog). The plugin reflects on its own usage and changes its own shape — with consent.

## Prerequisites

- The unified builder profile at `~/.claude/profiles/builder.json` must exist (builder has run `/onboard` at least once).
- At least one session log entry must exist at `~/.claude/plugins/data/vibe-cartographer/sessions/*.jsonl`. If not: "You haven't run a full session yet. Run `/onboard` → `/scope` through `/reflect` at least once, then come back."

## Before You Start

- Read every `.jsonl` file in `~/.claude/plugins/data/vibe-cartographer/sessions/`. Each line is a JSON entry per the session-logger SKILL schema.
- Read the unified profile at `~/.claude/profiles/builder.json` for baseline context (experience level, persona, preferences).
- Read the plugin's own SKILL files (`skills/onboard/SKILL.md`, `skills/scope/SKILL.md`, etc.) so you can propose specific, accurate diffs.
- Do NOT read `process-notes.md` from individual projects — sessions are the primary signal; project notes are too high-variance.

## Flow

### 1. Announce and frame

```
Pulling session history from ~/.claude/plugins/data/vibe-cartographer/sessions/
[N sessions across M days, spanning [oldest date] → [most recent date]]

I'm looking for patterns — things you consistently skip, friction that
repeats, commands that end in "abandoned" or "partial," pushback themes.
Then I'll propose changes I could make to myself to address what I see.

You approve each change one at a time. Nothing applies without your yes.
```

### 2. Analyze

Aggregate across all session entries. Specifically look for:

- **Skipped sections or rounds** — e.g., deepening rounds consistently zero across PRDs
- **Repeated friction notes** — same friction cluster appearing across 3+ sessions
- **Pushback themes** — `user_pushback` field trending toward a particular command or behavior
- **Outcome patterns** — commands that frequently end `abandoned`, `partial`, or `error`
- **Mode/persona mismatch** — chosen persona but downstream behavior never adapted
- **Command length drift** — commands that consistently run long when they should be short
- **Artifact skip** — `artifact_generated: false` appearing for commands that should produce artifacts

Target 2-5 genuine observations, not a laundry list. Quality over volume.

### 2a. Classify Each Observation — Three Tracks

Before proposing any change, classify every observation into exactly one of three tracks. This classification is mandatory — it determines where the fix lives and who it affects.

| Track | Scope | Where the fix lands | Who it affects |
|-------|-------|--------------------|----------------|
| **Plugin** | Universal pattern worth codifying for all users | SKILL file edit, committed to git, shipped on next release | Every future user of the plugin |
| **Personal** | Preference specific to this builder's style | Write to `plugins.vibe-cartographer` block in `~/.claude/profiles/builder.json` | Only this builder's future sessions |
| **Community (opt-in)** | Potentially useful signal but not confidently universal — *might* become a Plugin-track change later with more data | Appended to `~/.claude/plugins/data/vibe-cartographer/community-signals.jsonl` on this machine only | No one, until the builder explicitly exports and shares it |

**Classification rules:**

- Default to **Personal** when in doubt. A Plugin-track change is a public commitment to every future user — the bar should be high.
- A pattern is **Plugin-track** only when it's clearly not idiosyncratic: repeated across 3+ sessions AND either already captured as friction by the builder or matching a structural gap in the current SKILL flow (like "the SKILL assumes greenfield but half the sessions are no-code escapes").
- A pattern is **Community-track** when you suspect it's universal but only one builder's data supports it. Surface it, propose logging it for later aggregation, but don't ship a SKILL edit yet.
- **Persona-scoped preferences** (terse vs explanatory style) are almost always Personal. The persona system already exists for this — don't propose Plugin-track changes that duplicate persona behavior.

### 2b. Community Signals — Opt-In, Local-Only, User-Initiated Share

Community track exists so the plugin can collect signal about universal patterns without auto-sending anything. The privacy contract is:

- **Local-first:** all community signals are appended to `~/.claude/plugins/data/vibe-cartographer/community-signals.jsonl` on this machine, never transmitted.
- **Opt-in at capture time:** before writing ANY community-signal entry, the builder must say yes for that specific observation.
- **User-initiated share:** the plugin NEVER calls out to a network endpoint. If the builder wants their signals to reach the project, they explicitly export the file and send it (PR attachment, GitHub issue, email — whatever they choose).
- **No PII:** community signals must never include the builder's name, email, project directory path, absolute file paths, or any content from their source code. Only the anonymized pattern: what was observed, which command, outcome, friction category. The schema enforces this.
- **Transparent:** every community-signal entry is a readable JSON line. The builder can open the file and see exactly what was captured at any time.

Community-signal entry schema:

```json
{
  "schema_version": 1,
  "timestamp": "<ISO8601>",
  "plugin_version": "<current>",
  "command": "<command-observed>",
  "observation_kind": "friction | pushback | skipped-section | outcome-pattern | other",
  "observation_summary": "<one-line anonymized description — no names, no paths, no code>",
  "sessions_supporting": <count>,
  "builder_classification": "community"
}
```

No fields beyond this schema. Ever. If the observation requires more context to be useful, it's probably Personal or Plugin track — not Community.

### 3. Present findings

For each observation, present it with its **proposed track classification** so the builder knows the scope before you propose anything.

```
Observation 1: You skip deepening rounds in 4/5 PRDs.
Proposed track: Personal

Every PRD session shows `deepening_round_habits: "zero rounds"` — across
5 projects since you started using the plugin. The PRD SKILL currently
defaults to *encouraging* deepening rounds (Learner mode) or *offering*
them (Builder mode). Neither framing matches what you actually do.

Because this is a preference specific to how you work (not every builder
would skip these), the fix lives in your local profile, not the SKILL file.
Other builders keep the current default.
```

**Stop and ask two questions:**

1. "Does this match your experience? Is the pattern accurate, or am I reading it wrong?"
2. "Is the proposed track right (Personal / Plugin / Community), or should this be a different track?"

Wait for confirmation on both before moving on. The builder can reject an observation entirely, add nuance, or reclassify the track ("no, this is actually universal — make it Plugin").

### 4. Propose changes (one at a time)

For each confirmed observation, propose a change **scoped to its classified track**. The shape of the proposal depends on the track:

#### 4a. Plugin-track proposal

Propose a concrete, specific SKILL edit. Show the diff in unified-diff-style format. Explain what it changes and why.

```
Proposal (Plugin track): Flip /prd deepening rounds default for Builder mode.

Currently in skills/prd/SKILL.md:

- **Builder mode:** Offer efficiently. "Another round, or ready to generate?"

Proposed change:

- **Builder mode:** Default to no deepening rounds. "Ready to generate, 
  or want to do a round first?"

Rationale: Across 3+ Builder-mode PRDs (not just your sessions), this
pattern holds. The current phrasing leads with the round; the new phrasing
leads with generating. Same offer, reversed default.

This ships to every user on the next npm publish.

[apply]    Apply this change to skills/prd/SKILL.md
[modify]   Let me adjust the wording before applying
[reject]   Don't change this — the current default is right for other builders
[skip]     Not sure, skip for now
```

#### 4b. Personal-track proposal

Propose a write to the `plugins.vibe-cartographer` block in `~/.claude/profiles/builder.json`. Show the exact JSON patch.

```
Proposal (Personal track): Record your "skip deepening rounds" preference.

Write to ~/.claude/profiles/builder.json:

  plugins.vibe-cartographer.prefers_skip_deepening = true
  plugins.vibe-cartographer.deepening_round_habits = "Consistently zero 
    rounds across 4 PRDs — vision usually formed before PRD phase"

Downstream commands check this flag: when true, they default to the
"ready to generate, or want a round first?" phrasing for YOUR sessions
only. Other builders keep the current default.

No SKILL file changes. No git commit needed. Takes effect on your next
/prd run.

[apply]    Write to the profile
[modify]   Let me adjust the field values before writing
[reject]   Don't record this preference
[skip]     Not sure, skip for now
```

#### 4c. Community-track proposal (opt-in capture)

Propose appending an anonymized signal to `~/.claude/plugins/data/vibe-cartographer/community-signals.jsonl`. Show the exact entry before writing. **Require explicit yes every time — never assume opt-in.**

```
Proposal (Community track — opt-in): Log this as an anonymized signal.

This is interesting but only one builder's data supports it. If you
opt in, I'll append this line to community-signals.jsonl on YOUR
machine only:

{
  "schema_version": 1,
  "timestamp": "<now>",
  "plugin_version": "1.2.0",
  "command": "prd",
  "observation_kind": "skipped-section",
  "observation_summary": "Builder mode PRD sessions consistently skip deepening rounds (0/4)",
  "sessions_supporting": 4,
  "builder_classification": "community"
}

NOTHING IS SENT. The file stays local. You can open it, edit it, delete
it, or export it manually at any time. If you want this data to reach
the Vibe Cartographer project eventually, YOU decide when and how — by
opening an issue, sending a PR, or sharing the file manually.

[log]      Append this anonymized entry to community-signals.jsonl
[reject]   Don't log it
[skip]     Not sure, skip for now
```

**Rules for all proposals (every track):**

- **Never propose changes to `shared/` guide SKILL unless the observation is clearly cross-command.** Scope-specific patterns get scope-specific fixes.
- **Never propose removing entire sections.** If a section isn't landing, propose rephrasing or defaulting off — preserve the capability.
- **Never propose changes to persona or mode adaptation tables.** Those are load-bearing and cross-plugin.
- **Never propose a Plugin-track change when a Personal-track write would solve the same problem.** Personal is the default — Plugin is the exception.
- **Never write a Community-track entry without explicit per-observation opt-in.** `[log]` is a distinct action — it's never the default.
- **Never transmit Community-track data.** Even if the user says "yes, share it," the plugin's only job is to make the file easy to find and hand off. The builder does the sending.
- **One proposal per observation.** Don't bundle.
- **Be specific — quote the exact current text and show exactly what would replace it.** Vague proposals waste the builder's review time.

### 5. Apply, log, or defer

Action depends on the track:

**Plugin track, `[apply]` or `[modify]`:**

- Make the edit in the specific SKILL file.
- Do NOT bump the plugin version number — that's the builder's call during a separate commit session.
- Do NOT commit or push. Show the diff that was applied and move on.

**Personal track, `[apply]` or `[modify]`:**

- Read `~/.claude/profiles/builder.json`.
- Merge the proposed fields into `plugins.vibe-cartographer`. Never touch `shared` or other plugin namespaces.
- Update `plugins.vibe-cartographer.last_updated` to today's date.
- Write back as pretty-printed JSON.
- Takes effect on next command invocation — no restart needed.

**Community track, `[log]`:**

- Ensure `~/.claude/plugins/data/vibe-cartographer/community-signals.jsonl` exists (create the file if it doesn't).
- Append the exact JSON entry the builder approved. One entry per line.
- Confirm the file path back to the builder so they know where to find it if they want to review, edit, or share later.

**Any track, `[reject]` or `[skip]`:**

- Record the rejection/skip so the same proposal doesn't come back unchanged next time.
- Move to the next proposal.

### 6. Summary

After all proposals processed:

```
Applied this run:
  Plugin track:    N changes across M SKILL files
  Personal track:  P preference writes to the unified profile
  Community track: C anonymized signals logged (opt-in only)

Rejected: K proposals (won't re-surface unless the pattern shifts).
Deferred: J proposals (saved for next /evolve run).

Plugin files changed:
  • skills/onboard/SKILL.md (Starting Point question)

Personal profile updates:
  • plugins.vibe-cartographer.prefers_skip_deepening = true

Community signals logged (local only, not sent):
  • ~/.claude/plugins/data/vibe-cartographer/community-signals.jsonl
    [2 new entries — open the file anytime to review, edit, or export]

Review the Plugin-track diffs and commit when you're ready. Personal
and Community changes took effect immediately.
```

### 7. Log the evolve run

Append a special session log entry for this `/evolve` invocation to `~/.claude/plugins/data/vibe-cartographer/sessions/<date>.jsonl`:

```json
{
  "schema_version": 1,
  "timestamp": "<ISO8601>",
  "plugin": "vibe-cartographer",
  "plugin_version": "<current>",
  "command": "evolve",
  "outcome": "completed",
  "sessions_analyzed": <count>,
  "observations_surfaced": <count>,
  "proposals_presented": <count>,
  "proposals_applied_plugin": <count>,
  "proposals_applied_personal": <count>,
  "proposals_logged_community": <count>,
  "proposals_rejected": <count>,
  "proposals_deferred": <count>,
  "applied_files": ["skills/prd/SKILL.md", "..."],
  "personal_fields_written": ["plugins.vibe-cartographer.prefers_skip_deepening", "..."]
}
```

## What NOT to do

- **Never auto-apply changes.** Every proposal requires an explicit yes.
- **Never touch files outside `plugins/vibe-cartographer/`.** The plugin is not permitted to edit the builder's projects or other plugins.
- **Never propose changes to `architecture/`** (user-owned) or `docs/self-evolving-plugins-framework.md` (framework spec, not plugin behavior).
- **Never propose a change you can't ground in a specific session log entry.** "I feel like..." is not evidence; `"user_pushback": "..."` across 3 sessions is.
- **Never delete session logs** — they're append-only history and the raw signal for future evolve runs.
- **Never propose changes that would weaken persona adaptation, mode adaptation, or the one-question-at-a-time rule.** Those are load-bearing invariants.
- **Never propose more than 5 changes in a single run.** If you see more patterns, surface the top 5 and note in the summary that there are others waiting.
- **Never transmit Community-track data.** The plugin never makes network calls to share signals. Export is always builder-initiated.
- **Never auto-classify as Community to bypass the Personal-track default.** If you can't decide between Personal and Community, default to Personal. Community is for signals you genuinely believe might be universal.
- **Never write to `community-signals.jsonl` without explicit per-observation `[log]` approval.** Blanket "yes log everything community" consent is not valid — each observation gets its own opt-in.

## Conversation Style

- **Be a teammate, not a critic.** Observations are neutral — "you skip deepening rounds" is a fact, not a judgment.
- **Be specific.** Quote the exact sessions that surfaced the pattern. The builder should be able to verify your read.
- **Be willing to be wrong.** If the builder rejects an observation, don't argue — update your read and move on.
- **Keep proposals tight.** Small, specific edits are easier to evaluate than sweeping rewrites.
- **Honor the framework.** This SKILL is the applied Pattern #10 from the Self-Evolving Plugin Framework. The framework exists to keep this command from becoming dangerous — respect its invariants.

## Handoff

No handoff to another command. `/evolve` is a standalone reflection run. The builder commits the changes when they're ready.

"Thanks for reviewing. Whenever new patterns emerge, run `/evolve` again."
