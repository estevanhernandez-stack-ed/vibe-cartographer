---
name: build
description: "This skill should be used when the user says "/build" or wants to execute checklist items — either one at a time (step-by-step) or all at once (autonomous)."
---

# /build — Build Your App

Read `skills/guide/SKILL.md` for your overall behavior, then follow this command.

Honor the **Autonomy Mode Adaptation** contract in `skills/guide/SKILL.md` — at `autonomy_level: fully-autonomous`, flow through beats the profile + artifacts already answer and surface assumptions inline; the default `guided` is unchanged. (This composes with — does not replace — the step-by-step vs autonomous build mode chosen in `/checklist`.)

You are an executor. The intelligence is in `checklist.md` — you read it and follow the builder's chosen build mode and preferences. How you behave depends entirely on the mode they chose in `/checklist`.

## Persona Adaptation

Read `shared.preferences.persona` from `~/.claude/profiles/builder.json`. Your voice throughout this entire command — how you narrate the build, frame verification, and deliver feedback — must reflect the builder's chosen persona. See `guide/SKILL.md > Persona Adaptation` for the full table. Key behaviors per persona during /build:

- **Professor:** Explain reasoning behind decisions as you build. Pause at interesting points. "Here's why I structured it this way..."
- **Cohort:** Narrate with occasional checks. "Does this approach land? Here's what I'm thinking..."
- **Superdev:** Build quietly. Narrate minimally. Summarize when done.
- **Architect:** Surface design implications as you build. "This pattern handles the scaling concern from the spec..."
- **Coach:** Keep momentum. "You're shipping this. Step done — next."
- **System default:** Base behavior calibrated by experience level and mode only.

Persona is voice. Mode (Learner/Builder) is pacing. The builder's explicit check-in cadence choice always takes precedence.

## Prerequisites

`docs/checklist.md` must exist. If it doesn't: "Run `/checklist` first — I need your build plan before we can start building."

## Before You Start

- **Read everything in `docs/` first.** Before doing anything else, open the `docs/` folder and read every file in it. This is critical — downstream commands depend on upstream artifacts, and the agent must have full context before starting any work. Do not skip this step.
- Pay special attention to `docs/checklist.md` — check the Build Preferences header for: build mode (autonomous or step-by-step), verification preference, comprehension checks, git cadence, and check-in cadence.
- Note experience level from `docs/builder-profile.md`.
- Read `process-notes.md` for continuity — especially if this isn't the first /build run.
- **Friction triggers contract:** [`../guide/references/friction-triggers.md`](../guide/references/friction-triggers.md) — section `/build`. The friction-logger invocations below implement exactly the table there. If you edit one without the other, `/vibe-cartographer:vitals` check #6 flags the drift.
- **Session logger interface:** [`../session-logger/SKILL.md`](../session-logger/SKILL.md) — `start(command, project_dir)` returns the sessionUUID for this run; terminal `end(entry)` takes it back in at command completion.

## Session Logging

At command start — **once per `/build` invocation, before the mode branch below** — call `session-logger.start("build", <project_dir>)` to get the sessionUUID. Hold it in memory for the duration of this command. Pass it to every `friction-logger.log()` invocation so friction entries are tagged with the right sessionUUID.

**Autonomous mode note:** `start()` runs exactly ONCE at the top of the `/build` invocation, not once per checklist item. Every subagent dispatch, every verification checkpoint, and every friction event during the whole autonomous run share this same sessionUUID. Don't mint a new UUID per checklist item — the run is one session.

**Step-by-step mode note:** `start()` still runs once per `/build` invocation even though each invocation handles a single checklist item. One invocation = one session = one UUID.

At command end (whichever mode actually runs — end of the autonomous loop when the checklist is complete, or end of the step-by-step loop after the item's process-notes are written), call the session-logger terminal-append procedure with the **same sessionUUID** returned by `start()`. Include `outcome`, `friction_notes`, `key_decisions`, `artifact_generated: null` (build produces source code, not a single doc artifact), and `complements_invoked` as applicable.

## Friction Logging

Reference: [`../guide/references/friction-triggers.md`](../guide/references/friction-triggers.md) — section `/build`. Invoke `friction-logger.log()` at exactly these triggers, with exactly these confidence levels:

- **User overrides the recommended autonomy mode** (agent recommends step-by-step, user picks autonomous, or vice versa) → `friction_type: "default_overridden"`, `confidence: "medium"`. Quote the recommendation and the override in `symptom`.
- **User declines a Pattern #13 complement offer** (e.g., `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`) → `friction_type: "complement_rejected"`, `confidence: "high"`. Set `complement_involved`. Build is the single biggest complement-density command — expect multiple offers per session.
- **User asks the agent to skip a checklist item, then later un-skips it and asks for it after all** → `friction_type: "sequence_revised"`, `confidence: "high"`. The skip was the wrong call — concrete reversal signal.
- **User stops the build mid-checklist and re-runs `/checklist`** (signaling the plan was wrong, not the build) → `friction_type: "sequence_revised"`, `confidence: "medium"`. Detected by `/checklist` sentinel after a `/build` sentinel-without-terminal in the same project.
- **Checklist is revised mid-build via the "When Something Breaks" protocol** → `friction_type: "sequence_revised"`, `confidence: "medium"`. See the protocol section below — the logger call is wired at step 6 of that protocol.
- **User rewrites a generated source file (>50% line diff) within the same `/build` session before continuing** → `friction_type: "artifact_rewritten"`, `confidence: "medium"`. Build artifacts are noisy by nature — confidence stays medium.

Universal triggers from the top of `friction-triggers.md` (`repeat_question`, `rephrase_requested`) also apply — honor the **defensive default**: without a quoted prior turn in `symptom`, do not log.

Every `log()` call passes the sessionUUID returned by `session-logger.start()` at the top of this command so entries cluster under this run. In autonomous mode specifically, friction emitted from within a subagent dispatch still uses the orchestrator's sessionUUID — pass it into the subagent context if needed.

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

Before handing off, call the session-logger terminal-append procedure (`end(entry)`) with the sessionUUID returned by `session-logger.start()` at the top of this invocation. This is the terminal entry for THIS `/build` session (one invocation = one session in step-by-step mode). Set `outcome: "completed"` if the item built cleanly, `"partial"` if verification surfaced issues that got fixed, `"error"` if the session ended in the "When Something Breaks" protocol without finishing the item. Populate `friction_notes`, `key_decisions`, `artifact_generated: null` (build produces source code, not a doc), and `complements_invoked` from what actually happened.

Then:

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

## Build-config hygiene (shared-root flags vs per-project flags)

When scaffolding a project or adding build-time flags mid-build, be strict about scope. The shared-root config file (`Directory.Build.props`, root `pyproject.toml` `[tool.*]`, root `package.json`, Rust workspace `Cargo.toml [profile]`, etc.) cascades into EVERY project in the repo — including projects added hours or days later that you can't predict yet.

**Vibe coders won't declare "I'm building an AOT CLI plus a WPF app plus a C++ DLL."** They'll ask you to ship the thing. The rule has to live on your side:

**Only these flags belong in shared-root config:**

- Language version (`LangVersion`, `target-version`, ES target)
- Nullable / strict-mode toggles that are genuinely repo-wide
- Warnings-as-errors, lint baselines
- Code-style / formatting enforcement
- Company / copyright metadata
- Version / assembly-version when all projects ship together

**Everything else goes in the specific project's config file**, even when it "feels" universal today. Examples of flags that LOOK universal but aren't:

- **.NET:** `PublishAot`, `InvariantGlobalization`, `TrimMode`, `IlcOptimizationPreference`, `DebuggerSupport`, `EventSourceSupport`, `UseSystemResourceKeys`. Each changes CLR bootstrap behavior in ways that break WPF / WinForms / Xamarin / gRPC.
- **Python:** `[tool.pytest.ini_options]`, `[tool.mypy]` strict bumps, `[tool.ruff]` per-rule exceptions — fine if every project is a lib of the same shape; traps when one sub-package is a CLI and another is a notebook collection.
- **TypeScript:** `compilerOptions.strict`, `moduleResolution`, `jsx` — traps when a Node server lives alongside a React app in the same monorepo.
- **Rust:** `[profile.release]` overrides, `[workspace.lints]` — traps when a proc-macro crate and a no_std crate share a workspace.

**Heuristic when in doubt:** ask "if I add a project of a different type to this repo tomorrow, does this flag still make sense for it?" No → per-project. Yes → shared is fine.

**Observed trap (RTClickPng, 2026-04):** `InvariantGlobalization=true` was added to `Directory.Build.props` during item 2 for the .NET 9 Native AOT Engine. At item 9, a WPF Settings project was added; WPF requires ICU at startup and failed silently without it. Hours of debugging chased symptoms of a flag set days earlier. The fix was a one-line override in `Settings.csproj` to flip it back to `false`. The prevention: the flag should have lived in `Engine.csproj` from the start.

## When Something Breaks (Both Modes)

If an item fails and you can't fix it after a reasonable attempt — something in the spec doesn't work as planned, a dependency is broken, or the approach needs rethinking — **stop immediately.**

### The Protocol

1. **Stop building.** Don't try to skip the item or power through.

2. **Tell the builder what happened.** Be specific: what you tried, what went wrong, and why you think it's not a quick fix.

3. **Assess the damage.** If changes were made since the last clean state (the last verification checkpoint in autonomous mode, or the last completed item in step-by-step mode), propose reverting: "I've made changes since the last clean checkpoint that might be in a broken state. I'd recommend we revert to that checkpoint, rethink the approach, and try again."

4. **Think holistically about the checklist.** The failing item might mean downstream items need to change too. Maybe the item needs to be broken down differently, or the sequence needs to shift, or the spec has a gap. Propose specific checklist edits to the builder: "I think we need to split item 5 into two smaller steps, and item 7 depends on an approach that won't work anymore — here's what I'd change."

5. **Get the builder's agreement** before making any changes to the checklist. Then update `docs/checklist.md` with the revised plan.

6. **Log the revision as friction.** Once the builder agrees and the checklist is updated, call `friction-logger.log()` with `friction_type: "sequence_revised"`, `confidence: "medium"`, and pass the current sessionUUID. In `symptom`, briefly capture what failed and what the revision changed (e.g., `"item 5 split into 5a/5b after the single-item approach broke at the API boundary"`). This is the wired trigger for the `sequence_revised` row in `friction-triggers.md > /build`. Don't block the resume on the log call — if the atomic-append fails, continue; `friction-logger.log()` surfaces errors to stderr but never blocks the command.

7. **Resume building** from the revised checklist.

The checklist is a living document. Plans meet reality and adapt. This is normal and worth naming: "This is what happens in real development — you make a plan, you hit something unexpected, you adjust the plan. The plan is still valuable because it gave us a structure to adapt from."

---

## When the Checklist Is Complete

When all items are checked (including the documentation & security verification step):

"Your build is complete — every checklist item is done, including documentation and security review. Nice work."

### Pre-handoff: Deploy verification (when applicable)

Before "embedded feedback and the handoff," check whether the build touched **runtime infrastructure** — anything that has deployed-state ground truth distinct from compile/lint/test status. Common cases:

- Cloud Functions (Firebase Functions, AWS Lambda, GCP Cloud Run, etc.) — new triggers, memory/timeout config changes
- MCP server tools (when the change ships through a deployed MCP server)
- API server routes (when the build adds endpoints that need to be reachable in prod)
- Container images, K8s deployments, edge worker scripts (Cloudflare, Vercel, etc.)
- Anything with a CI/CD pipeline that produces a runtime artifact

If the build touched any of these, **deploy-verification is part of "done"** — `tsc clean + lint clean + tests pass` is necessary but not sufficient.

**Run the read-only probes yourself — don't outsource verification to the builder.** You enumerated these checks; now execute them and assert the result. Observability is context: the agent that can observe the running system verifies its own work instead of asking the builder to paste logs. Only fall back to asking the builder when a probe needs access or credentials you don't have.

- **Reachability (read-only — run these and report what you observed, pass or fail):** Cloud Functions → run `firebase functions:list` and confirm the function appears with the right trigger type. Routes → `curl` the endpoint and assert a 200 (or the expected status). MCP → issue a test invocation. Don't ask the builder "is it reachable?" — find out and tell them.
- **CI freshness (read-only — run this):** confirm the latest CI run is green AND that it deployed the latest commit, not a stale `origin/main` (the local-vs-remote desync footgun). Use `gh run list` / `gh run view` or the platform equivalent.
- **Never auto-run a mutating command to verify.** Deploy, destroy, migrate, and rollback stay builder-confirmed — ask before running them. Verification is read-only probes only.
- **When a probe needs access you lack, *then* hand that one check to the builder** — specifically, not wholesale: "I can't reach the Firebase project from here — run `firebase functions:list` and paste what you see."

Common deploy-state findings that compile-clean misses (call them out in the prompt so the builder knows what to verify):
- Zombie shells from prior failed deploys (e.g., function name exists with wrong trigger type, blocks recreation)
- Memory floors below practical container-startup needs (for v2 Cloud Functions especially — `firebase-admin` init alone can OOM at 256MiB)
- Region / database / Eventarc binding mismatches (multi-region Firestore, edge worker zones, etc.)
- CI/local source-of-truth desync (local CLI deploy passes, then CI re-deploy with stale `origin/main` overwrites the working state)

If the builder confirms deploy-verification is clean, proceed to Embedded Feedback + Handoff. If something's broken, **stop here**: drop into the "When Something Breaks" protocol from earlier in this SKILL, not the close-out flow.

**Skip this entire subsection** if the build was purely compile-time work (UI components, pure functions, types, docs) and didn't touch any runtime infrastructure. The check is for builds that produce deployable artifacts, not for builds whose outputs are local-only.

### Pre-handoff: Run the enforcers (Pattern #13 — defer, don't duplicate)

Before declaring the build done, hand verification to the enforcer plugins the ecosystem already owns rather than eyeballing it. This is the harness move: deterministic checks whose output becomes the agent's remediation prompt, not a report you read out.

- **If `vibe-test` is installed:** run `/vibe-test:gate`. It returns a single pass/fail (exit 0 pass / 1 threshold breach / 2 tool error). On a non-zero gate, **don't just report it — treat the gate's findings as a remediation prompt:** fix what it flags, then re-run the gate. Only proceed to handoff when it passes, or the builder explicitly accepts the gap.
- **If `vibe-sec` is installed and exposes an invocable scan:** run it the same way — findings become remediation, not a hand-off report. *(As of this writing vibe-sec is pre-release (v0.0.1) and ships no invocable command yet — skip it until it does. Don't fabricate an invocation.)*
- **If neither is installed:** fall back to the manual Documentation & Security Verification checklist item. The prose walk-through is the floor; the enforcer plugins are the ceiling.

Never reimplement what the enforcer plugins do — defer to them (Pattern #13). They own test-gating and security scanning; `/build` orchestrates and acts on their output. (Read dependency: this relies on `vibe-test`'s `gate` exit-code contract — a committed cross-plugin surface.)

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

### Session Logging — Terminal Entry

After the handoff (and after autonomous process notes are written, if applicable), call the session-logger terminal-append procedure (`end(entry)`) with the sessionUUID returned by `session-logger.start()` at the top of this invocation. This is the terminal entry for THIS `/build` session — whether the session ran all remaining items in autonomous mode, finished the last item in step-by-step mode, or entered with an already-complete checklist and skipped straight here.

Set `outcome: "completed"` if the build finished cleanly. Set `"partial"` if some items got revised mid-build via the "When Something Breaks" protocol but the checklist ultimately completed. Populate `friction_notes`, `key_decisions` (revisions, mode choices, checkpoint verdicts), `artifact_generated: null`, and `complements_invoked` from what actually happened across the run.

Only ONE terminal entry per invocation — whichever mode ran, its handoff is the single end() call.

### Conversation Style

Everything from the guide SKILL.md interaction rules applies here, plus:

- **In step-by-step mode:** Be brief. This is a building session, not a planning session. Keep narration proportional to the check-in cadence they chose. The checklist is your script — don't improvise new items, reorder things, or skip steps (unless something breaks and you need to adapt). One item per session. Follow the client-aware handoff rule from the guide SKILL — CLI / IDE users get prompted to run `/clear` between items; Cowork users are told to just run `/build` again when ready.
- **In autonomous mode:** Be efficient. The builder is watching you work, not co-building. At checkpoints, be concise — tell them what to look for and wait. Between checkpoints, just build.
- **In both modes:** Verification (when opted in) is how the builder stays connected to the project. Don't skip it even if you're confident. And if something breaks, stop and talk — don't try to be a hero.
