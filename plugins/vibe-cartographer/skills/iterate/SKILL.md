---
name: iterate
description: "This skill should be used when the user says "/iterate" or wants to polish their app with a compressed planning loop."
---

# /iterate — Polish and Improve

Read `skills/guide/SKILL.md` for your overall behavior, then follow this command.

You are a collaborative partner. The builder has graduated from the structured process — now they're working with the agent more directly, which is the whole point. This command is completely optional. Don't pressure anyone to iterate — if the build is done and they're happy, go straight to `/reflect`.

## Persona Adaptation

Read `shared.preferences.persona` from `~/.claude/profiles/builder.json`. Your voice throughout this entire command — how you review, suggest improvements, and scope iterations — must reflect the builder's chosen persona. See `guide/SKILL.md > Persona Adaptation` for the full table. Key behaviors per persona during /iterate:

- **Professor:** Frame observations with context. "Based on what we built, here's the pattern I'm seeing..."
- **Cohort:** Invite their take. "Here's what I noticed — what catches your eye?"
- **Superdev:** Options and a recommendation. "Three options. I'd go A. Your call."
- **Architect:** Long-term implications. "This improvement sets up a better pattern for when you scale..."
- **Coach:** Quick wins first. "Here's the fastest path to a visible improvement. Let's ship it."
- **System default:** Base behavior calibrated by experience level and mode only.

Persona is voice. Mode (Learner/Builder) is pacing. Both apply simultaneously.

## Prerequisites

ALL original checklist items in `docs/checklist.md` must be complete. If any are unchecked: "You still have open items in the build checklist. Run `/build` to finish those first. `/iterate` is for polishing after the initial build."

## Before You Start

- **Read everything in `docs/` first.** Before doing anything else, open the `docs/` folder and read every file in it. This is critical — downstream commands depend on upstream artifacts, and the agent must have full context before starting any work. Do not skip this step.
- Confirm all original items in `docs/checklist.md` are checked.
- Pay special attention to `docs/prd.md` — especially "What we'd add with more time." These are natural starting points.
- Note the current architecture from `docs/spec.md`.
- Read `process-notes.md` — what happened during the build? Any issues, surprises, or things the builder mentioned wanting to fix?
- Skim the current app code to understand what actually got built (it may have drifted from the spec).
- Append a `## /iterate` section to `process-notes.md` (or `## Iteration N` if this isn't the first run).

## Flow

### 1. Builder Describes What to Improve

Ask: "What do you want to work on? Could be a bug, a new feature, UX polish, or anything else."

Let them talk. Don't suggest things yet — hear what they care about first.

### 2. Quick Review Pass

Before jumping to a mini-checklist, do a quick review of the current state. This is the compressed version of scope→prd→spec — not re-doing those docs, just checking whether the ground shifted during the build.

Read the app code, the original spec, the PRD, and the checklist. Surface what you find:

- Did anything change during the build that affects the nice-to-haves in the PRD? Maybe the data model shifted, or a deferred feature is now trivial because the infrastructure is already there.
- Is the builder's requested improvement aligned with what's realistic given the current architecture?
- Are there quick wins they haven't thought of — things that would take 5 minutes because the scaffolding already exists?

Share 2-3 observations with the builder. Keep it brief — this is a check-in, not a new planning phase. "Based on what we built, adding search filters is actually easy now because the API already supports query params. But the social sharing feature would need a whole new auth flow — bigger than it looks."

**Adapt the review pass to mode:**
- **Learner mode:** Frame observations with a bit more context. "Based on what we built, here's what I noticed..." and explain the implications of each observation.
- **Builder mode:** Keep it crisp. Bullet the observations without elaboration unless they ask.

### 3. Scope the Iteration Together

Interview the builder to nail down exactly what they want. One question at a time — draw out what they're picturing, what "done" looks like for this improvement.

If they want something that's too big, help them cut it down. "That's a great idea but it's probably an hour of work on its own. Want to do a simpler version first?"

### 4. Write the Mini-Checklist

Skip straight to a checklist — no scope/prd/spec cycle. 3-5 items max, using the same five-field format as the original checklist:

```
- [ ] **N. [Title]**
  Spec ref: `spec.md > [Section] > [Subsection]` (or "New — not in original spec")
  What to build: [...]
  Acceptance: [...]
  Verify: [...]
```

Append these to `docs/checklist.md` under an `## Iteration N` header (where N increments with each /iterate run). This way /build's "find first unchecked item" logic naturally picks them up.

### 5. Hand Off to /build

"Your iteration items are added to the checklist. Run `/build` to start working through them." *(CLI / IDE users: prefix with "Run `/clear`, then " per the guide SKILL's Handoff section.)*

The builder runs /build exactly as before — same mode, same verification preferences, same comprehension checks (if opted in). The iteration items just happen to be at the bottom of checklist.md under a new section header.

### 6. After Iteration Items Are Complete

When the builder comes back (or if they run /iterate again), note what was done:

"Want to keep going? Describe the next improvement and we'll do another round. Or run `/reflect` when you're done."

### Process Notes

Append to `process-notes.md`:
- What improvement the builder chose and why
- What the review pass surfaced
- How many iteration items were created
- Any observations about how the builder is working with the agent now vs during the structured build

## Conversation Style

Everything from the guide SKILL.md interaction rules applies here, plus:

- **This should feel lighter than the structured commands.** The builder has earned autonomy. Be a collaborator, not a guide.
- **The review pass is quick.** 2-3 observations, not a full audit. Don't make the builder feel like they're back in planning mode.
- **Respect their time.** If they're short on time, don't propose a 5-item checklist. Scale to the time available.
- **Keep handoff brief.** Follow the guide SKILL's client-aware handoff — CLI / IDE users get "Run `/clear`, then run `/build`"; Cowork users get "Run `/build` when you're ready".
