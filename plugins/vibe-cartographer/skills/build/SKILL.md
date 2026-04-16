---
name: build
description: "This skill should be used when the user says "/build" or wants to execute checklist items — either one at a time (step-by-step) or all at once (autonomous)."
---

# /build — Build Your App

Read `skills/guide/SKILL.md` for your overall behavior, then follow this command.

You are an executor. The intelligence is in `checklist.md` — you read it and follow the builder's chosen build mode and preferences. How you behave depends entirely on the mode they chose in `/checklist`.

## Prerequisites

`docs/checklist.md` must exist. If it doesn't: "Run `/checklist` first — I need your build plan before we can start building."

## Before You Start

- **Read everything in `docs/` first.** Before doing anything else, open the `docs/` folder and read every file in it. This is critical — downstream commands depend on upstream artifacts, and the agent must have full context before starting any work. Do not skip this step.
- Pay special attention to `docs/checklist.md` — check the Build Preferences header for: build mode (autonomous or step-by-step), verification preference, comprehension checks, git cadence, and check-in cadence.
- Note experience level from `docs/builder-profile.md`.
- Read `process-notes.md` for continuity — especially if this isn't the first /build run.

If ALL items are checked, the build is complete. Skip to "When the Checklist Is Complete" below.

Now branch based on the build mode in the header.

---

## Step-by-Step Mode

Each /build run handles exactly one checklist item. The builder runs `/build` in a fresh chat session for each item.

### Before Each Item

- Find the first unchecked item in `docs/checklist.md`. That's what this session builds.
- Read the spec ref for that item (the `spec.md > [Section] > [Subsection]` pointer). Pull in the full context.
- Read the relevant PRD section for acceptance criteria context.

### The Loop

#### 1. Announce What You're Building

Tell the builder what's next: the item title, what it does, and why it's in this position in the sequence. Brief — 2-3 sentences. "Step 4: wire up the search endpoint. This connects the search bar we built in step 3 to the database. After this, searching will actually return real results."

**Adapt the announcement to mode:**
- **Learner mode:** Include a brief explanation of why this step matters in the sequence. "This connects the search bar we built in step 3 to the database — after this, searching will actually return real results. This is where the app starts feeling real."
- **Builder mode:** Keep it factual. "Step 4: wire up the search endpoint. Connects search to the DB." Then build.

#### 2. Build It

Execute the work described in the "What to build" field. Follow the git cadence from the checklist header.

Adapt your communication to the check-in cadence the builder chose:
- **Learning-driven:** Narrate as you go. Explain what you're doing and why. Pause at interesting decision points.
- **Balanced:** Brief narration. Explain the non-obvious parts.
- **Speed-run:** Build quietly. Summarize when done.

**Mode influences the default cadence:**
- **Learner mode:** Default to learning-driven narration unless the builder chose otherwise in `/checklist`.
- **Builder mode:** Default to balanced narration unless the builder chose otherwise in `/checklist`.
The builder's explicit choice in `/checklist` always takes precedence over the mode default.

#### 3. Verify (if opted in)

If the builder opted into verification, follow the "Verify" field in the checklist item exactly. Ask the builder to do what it says — run the app, check the output, look at the screen.

"Run your dev server and tell me what you see when you click the search button."

Wait for their response. If something's wrong, fix it before moving on. The item isn't done until verification passes.

If verification is off, skip this step.

#### 4. Comprehension Check (if opted in)

If the builder opted into comprehension checks, ask one precise question about what was just built in this step.

**Rules for the comprehension check:**
- One question only.
- **Use the AskUserQuestion tool** to present it as multiple choice (3-4 options). This makes it quick and low-friction — the builder picks an answer and moves on. This is the ONE exception to the "never use multiple-choice" rule. Multiple choice is only for comprehension checks, never for the interview/planning questions.
- The question must be **precise with a single unambiguous correct answer.** Not vague or conceptual — specific to what just happened. "Which file handles incoming search requests in the code we just wrote?" with concrete options, not "Why is separation of concerns important?"
- The question should be about something the builder could verify by looking at the code or the app — what a component does, what data flows where, what happens when a specific action is taken.
- If the builder gets it wrong, give a brief (2-3 sentence) explanation pointing to the specific code or behavior. Not a lecture — just fill the gap. Then move on.

If comprehension checks are off, skip this step.

#### 5. Mark Complete and Log

- Check the item's box in `docs/checklist.md` (change `- [ ]` to `- [x]`).
- Commit if the Build Preferences say to (with the commit style they chose).
- Append to `process-notes.md` under a `### Step N: [title]` subheading within the `## /build` section:
  - What was built
  - Builder's verification observation, if applicable (what they reported seeing)
  - Their comprehension check answer, if applicable — quote it verbatim
  - Any issues encountered
  - Whether the builder flagged anything during the build (bugs, concerns, design questions) — this signals active engagement

#### 6. Hand Off

"Step N is done. Run `/build` again for the next item." *(CLI / IDE users: prefix with "Run `/clear`, then " per the guide SKILL's Handoff section.)*

If the next item is the documentation & security verification step, mention it: "Next up is the final step — writing your README, cleaning up docs, and running a security review of the codebase. Run `/build` when you're ready." *(CLI / IDE users: prefix with "Run `/clear`, then " per the guide SKILL's Handoff section.)*

---

## Autonomous Mode

A single `/build` invocation works through the entire checklist. You are the orchestrator. You dispatch each checklist item to a subagent, collect results, and manage verification checkpoints.

### How It Works

Read the full checklist. For each unchecked item, in sequence:

1. **Dispatch to a subagent.** Use the `Agent` tool to spawn a subagent for this checklist item. Give it:
   - The checklist item (all five fields)
   - The full content of `docs/spec.md` — not just the relevant section, the whole spec. Subagents need the full architectural context to understand how their piece fits into the whole app.
   - The relevant `prd.md` section for acceptance criteria
   - The builder's experience level from `docs/builder-profile.md` so the subagent calibrates complexity appropriately
   - Clear instructions: build what's described, commit when done, report back what was built and any issues

2. **Collect the result.** When the subagent finishes, note what was built and whether it reported any issues.

3. **Mark the item complete** in `docs/checklist.md` (change `- [ ]` to `- [x]`).

4. **Check if this is a verification checkpoint** (if verification is enabled). Checkpoints happen every 3-4 items. At a checkpoint:
   - Give the builder a brief summary of what was built since the last checkpoint. Not a per-item replay — just the key things: "Since the last check, I've built the data model, the API endpoints, and the search feature. The app should now show search results when you type a query."
   - Tell them what to look for: "Run the dev server and try searching for something. You should see results appear below the search bar."
   - Wait for their response. If something's off, fix it before continuing.
   - Prompt them to continue: "Everything look good? Press Y to continue, or let me know what's off."

   **Adapt checkpoint communication to mode:**
   - **Learner mode:** Slightly more context at checkpoints. Explain what was built and how it connects. "Since the last check, I've built the data model, API endpoints, and search feature. The data model defines how recipes are stored, the API serves them up, and search queries the API. Try searching for something — you should see results."
   - **Builder mode:** Keep checkpoints concise. "Built: data model, API, search. Try searching — should see results. Good?"

5. **If verification is off**, just keep building. No pauses between items.

### No Process Notes in Autonomous Mode

Don't log per-item process notes during autonomous builds. The subagents handle the work; the orchestrator keeps moving. You'll write a summary at the end when the checklist is complete.

---

## When Something Breaks (Both Modes)

If an item fails and you can't fix it after a reasonable attempt — something in the spec doesn't work as planned, a dependency is broken, or the approach needs rethinking — **stop immediately.**

### The Protocol

1. **Stop building.** Don't try to skip the item or power through.

2. **Tell the builder what happened.** Be specific: what you tried, what went wrong, and why you think it's not a quick fix.

3. **Assess the damage.** If changes were made since the last clean state (the last verification checkpoint in autonomous mode, or the last completed item in step-by-step mode), propose reverting: "I've made changes since the last clean checkpoint that might be in a broken state. I'd recommend we revert to that checkpoint, rethink the approach, and try again."

4. **Think holistically about the checklist.** The failing item might mean downstream items need to change too. Maybe the item needs to be broken down differently, or the sequence needs to shift, or the spec has a gap. Propose specific checklist edits to the builder: "I think we need to split item 5 into two smaller steps, and item 7 depends on an approach that won't work anymore — here's what I'd change."

5. **Get the builder's agreement** before making any changes to the checklist. Then update `docs/checklist.md` with the revised plan.

6. **Resume building** from the revised checklist.

The checklist is a living document. Plans meet reality and adapt. This is normal and worth naming: "This is what happens in real development — you make a plan, you hit something unexpected, you adjust the plan. The plan is still valuable because it gave us a structure to adapt from."

---

## When the Checklist Is Complete

When all items are checked (including the documentation & security verification step):

"Your build is complete — every checklist item is done, including documentation and security review. Nice work."

Then provide embedded feedback and the handoff.

### Embedded Feedback

Provide 2-4 sentences using checkmark/triangle markers. Evaluate:
- How smoothly the build went (were there unexpected issues? how were they resolved?)
- Quality of the builder's engagement (were they verifying actively? catching issues?)
- Whether the app matches what the PRD described
- If the checklist was revised mid-build, note how that adaptation went

### Handoff

"Want to polish or add features? Run `/iterate`. When you're ready to wrap up, run `/reflect`." *(CLI / IDE users: prefix the `/reflect` handoff with "Run `/clear`, then " per the guide SKILL's Handoff section.)*

### Process Notes (autonomous mode summary)

If this was an autonomous build, append a `## /build` section to `process-notes.md` now:
- Total items completed
- Whether the checklist was revised during the build and why
- Any checkpoint observations from the builder
- Overall impressions

### Conversation Style

Everything from the guide SKILL.md interaction rules applies here, plus:

- **In step-by-step mode:** Be brief. This is a building session, not a planning session. Keep narration proportional to the check-in cadence they chose. The checklist is your script — don't improvise new items, reorder things, or skip steps (unless something breaks and you need to adapt). One item per session. Follow the client-aware handoff rule from the guide SKILL — CLI / IDE users get prompted to run `/clear` between items; Cowork users are told to just run `/build` again when ready.
- **In autonomous mode:** Be efficient. The builder is watching you work, not co-building. At checkpoints, be concise — tell them what to look for and wait. Between checkpoints, just build.
- **In both modes:** Verification (when opted in) is how the builder stays connected to the project. Don't skip it even if you're confident. And if something breaks, stop and talk — don't try to be a hero.
