# Learner vs Builder Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-tier mode system (Learner / Builder) that changes tone, pacing, and defaults across all eight commands while keeping the curriculum structure identical.

**Architecture:** Centralized mode definition in `skills/guide/SKILL.md` (the shared behavior contract), mode selection during `/onboard`, one new field in the learner profile template, and light per-command edits for tone/pacing/default adaptations. All changes are to markdown prompt files — no code, no tests.

**Tech Stack:** Markdown (SKILL.md prompt engineering files)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `plugins/app-project-readiness/skills/guide/SKILL.md` | Modify | Central mode definition — tone, pacing, defaults, nudges for each mode |
| `plugins/app-project-readiness/skills/guide/templates/learner-profile-template.md` | Modify | Add `## Mode` field |
| `plugins/app-project-readiness/skills/onboard/SKILL.md` | Modify | Add mode selection step to interview flow |
| `plugins/app-project-readiness/skills/scope/SKILL.md` | Modify | Mode-aware opening and deepening round framing |
| `plugins/app-project-readiness/skills/prd/SKILL.md` | Modify | Mode-aware preamble and edge case framing |
| `plugins/app-project-readiness/skills/spec/SKILL.md` | Modify | Mode-aware explanation depth |
| `plugins/app-project-readiness/skills/checklist/SKILL.md` | Modify | Mode-aware build mode defaults and preference framing |
| `plugins/app-project-readiness/skills/build/SKILL.md` | Modify | Mode-aware narration and check-in defaults |
| `plugins/app-project-readiness/skills/iterate/SKILL.md` | Modify | Minor Builder tone adjustment |
| `plugins/app-project-readiness/skills/reflect/SKILL.md` | Modify | Mode-aware quiz depth and feedback tone |

---

### Task 1: Central Mode Definition in Guide Skill

**Files:**
- Modify: `plugins/app-project-readiness/skills/guide/SKILL.md` (after the "Adapting to Experience Level" section, around line 50)

This is the foundation — every other task references what we define here.

- [ ] **Step 1: Add the Mode section to guide/SKILL.md**

Insert the following new section after the existing "Adapting to Experience Level" section (which ends around line 50) and before "Command Chain":

```markdown
## Mode: Learner vs Builder

Read the learner's mode from `docs/learner-profile.md` (once it exists). Mode is selected during `/onboard` and shapes tone, pacing, and defaults across every command. Mode is separate from experience level — an experienced developer might choose Learner mode if they're new to spec-driven development, and a confident newcomer might choose Builder mode.

### Learner Mode

| Dimension | Behavior |
|-----------|----------|
| **Tone** | Encouraging mentor. Explain the *why* before each phase. "Here's what we're doing and why it matters." |
| **Pacing** | Unhurried. Offer deepening rounds proactively — "Want to do another round? There's usually good stuff in the second pass." |
| **Preamble** | Each command opens with a brief explanation of what this phase is and how it fits the bigger picture. |
| **Defaults** | Recommend step-by-step build, comprehension checks on, verification on, learning-driven narration. |
| **Nudges** | Gently encourage engagement. "Want to do another round?" feels inviting, not pressuring. |

### Builder Mode

| Dimension | Behavior |
|-----------|----------|
| **Tone** | Sharp collaborator. Skip the *why* — they already get it. Get to the questions. |
| **Pacing** | Brisk. Mention deepening rounds are available but don't push — "Another round, or ready to move on?" |
| **Preamble** | Minimal — one sentence max before diving into the first question. |
| **Defaults** | Recommend autonomous build, comprehension checks off, verification at checkpoints. |
| **Nudges** | Respect their time. Efficient, not lingering. |

### Shared Across Both Modes

- Same mandatory questions in every phase
- Same document templates and artifact quality bar
- Same guard rails and prerequisite checks
- Deepening rounds available in both — just framed differently
- Same process notes logging
```

- [ ] **Step 2: Verify the edit**

Open `plugins/app-project-readiness/skills/guide/SKILL.md` and confirm the new "Mode: Learner vs Builder" section appears between "Adapting to Experience Level" and "Command Chain", with both mode tables and the shared section intact.

- [ ] **Step 3: Commit**

```bash
git add plugins/app-project-readiness/skills/guide/SKILL.md
git commit -m "feat: add central Learner vs Builder mode definition to guide skill"
```

---

### Task 2: Update Learner Profile Template

**Files:**
- Modify: `plugins/app-project-readiness/skills/guide/templates/learner-profile-template.md`

- [ ] **Step 1: Add the Mode field to the template**

Insert the following new section after `## Technical Experience` and before `## Learning Goals`:

```markdown
## Mode
<!-- Learner | Builder -->
<!-- Learner: guided walkthrough with explanations and encouragement -->
<!-- Builder: streamlined flow for people ready to move -->
```

- [ ] **Step 2: Verify the edit**

Open `plugins/app-project-readiness/skills/guide/templates/learner-profile-template.md` and confirm `## Mode` appears between `## Technical Experience` and `## Learning Goals`.

- [ ] **Step 3: Commit**

```bash
git add plugins/app-project-readiness/skills/guide/templates/learner-profile-template.md
git commit -m "feat: add Mode field to learner profile template"
```

---

### Task 3: Add Mode Selection to Onboard Skill

**Files:**
- Modify: `plugins/app-project-readiness/skills/onboard/SKILL.md`

- [ ] **Step 1: Add mode selection step after step 7 (Prior SDD Knowledge)**

Insert a new `### 8. Mode Selection` section after the existing `### 7. Gauge Prior SDD Knowledge` section and before the current `### 8. Architecture Docs` section. Renumber `### 8. Architecture Docs` to `### 9. Architecture Docs` and `### 9. Generate docs/learner-profile.md` to `### 10. Generate docs/learner-profile.md`.

The new section:

```markdown
### 8. Mode Selection

Now that you have a sense of their experience and what brings them here, introduce the two modes. Do this conversationally — not as a formal menu.

"There are two ways we can run through this process together:"

- **Learner mode** — "I'll walk you through each step, explain why things matter, and take a little more time. Good if you want to understand the process deeply."
- **Builder mode** — "Same steps, same documents, but I keep things moving. Less explaining, more doing. Good if you're ready to just flow through it."

**Frame your recommendation based on their profile:**
- **First-timers and beginners:** Recommend Learner mode. "Since this is new territory, I'd suggest Learner mode — I'll make sure everything makes sense as we go. You can always tell me to speed up."
- **Intermediate:** Present both fairly. "Either works. Learner if you want the full walkthrough, Builder if you're feeling confident."
- **Experienced developers:** Recommend Builder mode. "Given your background, Builder mode will feel more natural — we'll move at a good clip. If you want the guided version for any reason, that's totally fine too."

**Key principle:** Recommend, don't force. Someone experienced might want Learner mode because spec-driven development is new to them. Someone newer might want Builder mode because they're confident and impatient. Respect their choice.

Store the selection in the learner profile under `## Mode`.
```

- [ ] **Step 2: Renumber sections 8 and 9**

Change `### 8. Architecture Docs` to `### 9. Architecture Docs`.
Change `### 9. Generate docs/learner-profile.md` to `### 10. Generate docs/learner-profile.md`.

- [ ] **Step 3: Verify the edit**

Open `plugins/app-project-readiness/skills/onboard/SKILL.md` and confirm:
- Section 7 is "Gauge Prior SDD Knowledge"
- Section 8 is "Mode Selection" (new)
- Section 9 is "Architecture Docs" (renumbered)
- Section 10 is "Generate docs/learner-profile.md" (renumbered)

- [ ] **Step 4: Commit**

```bash
git add plugins/app-project-readiness/skills/onboard/SKILL.md
git commit -m "feat: add mode selection step to onboard interview flow"
```

---

### Task 4: Mode-Aware Scope Skill

**Files:**
- Modify: `plugins/app-project-readiness/skills/scope/SKILL.md`

- [ ] **Step 1: Add mode adaptation to the Opening section**

In the `### Opening` section (around line 27), add the following paragraph after "Keep the opening brief. Then start the mandatory questions.":

```markdown
**Adapt the opening to mode:**
- **Learner mode:** Open with context about what this phase is and why it matters. "Now we're going to shape your idea into something buildable. This is where the project starts to get real — everything downstream depends on what we figure out here."
- **Builder mode:** Keep it to one sentence. "Let's nail down the scope." Then straight into the first question.
```

- [ ] **Step 2: Add mode adaptation to Phase 2 — Deepening Rounds**

In the `### Phase 2 — Deepening Rounds` section (around line 63), add the following after "After the mandatory questions, offer the choice":

```markdown
**Frame deepening rounds by mode:**
- **Learner mode:** Proactively encourage another round. "There's usually really good stuff in the second pass — want to do one more round before I write this up?"
- **Builder mode:** Offer without pushing. "Another round, or ready for the doc?"
```

- [ ] **Step 3: Verify the edit**

Open `plugins/app-project-readiness/skills/scope/SKILL.md` and confirm both mode adaptation blocks are present — one in the Opening, one in Deepening Rounds.

- [ ] **Step 4: Commit**

```bash
git add plugins/app-project-readiness/skills/scope/SKILL.md
git commit -m "feat: add mode-aware tone and pacing to scope skill"
```

---

### Task 5: Mode-Aware PRD Skill

**Files:**
- Modify: `plugins/app-project-readiness/skills/prd/SKILL.md`

- [ ] **Step 1: Add mode adaptation to the Flow section opening**

In the `## Flow` section (around line 31), after the existing "Frame this for the learner early" paragraph, add:

```markdown
**Adapt the framing to mode:**
- **Learner mode:** Explain what a PRD is and why acceptance criteria matter before the first question. "A PRD — product requirements document — is where we get really specific about what your app does. The scope was the big picture; this is the blueprint. We're going to write acceptance criteria for every feature — that means 'how do I know this is working?' — so there's no ambiguity when we build."
- **Builder mode:** Skip the explainer. Go straight to the first mandatory question with a brief transition: "Time to get specific. Let's walk through the scope and tighten everything up."
```

- [ ] **Step 2: Add mode adaptation to edge case questioning**

In mandatory question 4 (edge cases, around line 44), add after "The goal is 2-3 genuine 'oh, I hadn't thought of that' moments":

```markdown
**Adapt edge case framing to mode:**
- **Learner mode:** Guide them through it. "Let me walk you through some things to think about — these are the kinds of questions that save you headaches during the build."
- **Builder mode:** Be direct. "What happens when X? What about Y?" No preamble.
```

- [ ] **Step 3: Add mode adaptation to deepening rounds**

In the `### Phase 2 — Deepening Rounds` section (around line 48), add after "offer the choice":

```markdown
**Frame deepening rounds by mode:**
- **Learner mode:** Encourage investment. "The PRD is where depth really pays off — learners who do an extra round here usually have smoother builds. Want to go deeper?"
- **Builder mode:** Offer efficiently. "Another round, or ready to generate?"
```

- [ ] **Step 4: Verify the edit**

Open `plugins/app-project-readiness/skills/prd/SKILL.md` and confirm all three mode adaptation blocks are present.

- [ ] **Step 5: Commit**

```bash
git add plugins/app-project-readiness/skills/prd/SKILL.md
git commit -m "feat: add mode-aware framing and pacing to prd skill"
```

---

### Task 6: Mode-Aware Spec Skill

**Files:**
- Modify: `plugins/app-project-readiness/skills/spec/SKILL.md`

- [ ] **Step 1: Add mode adaptation to the Core Lesson section**

After the existing "The Core Lesson" section (around line 32), add:

```markdown
**Adapt the framing to mode:**
- **Learner mode:** Take a moment to explain why this matters. "This is the heart of spec-driven development — we're writing a document detailed enough that any engineer or AI could build from it. This is what separates great AI-assisted projects from mediocre ones."
- **Builder mode:** One sentence transition: "Let's design the architecture." Then straight to questions.
```

- [ ] **Step 2: Add mode adaptation to the tech preferences interview**

In mandatory question 1 (tech preferences, around line 39), add after the existing experience-level adaptations:

```markdown
**Adapt explanation depth to mode (in addition to experience level):**
- **Learner mode:** More explanation around recommendations. Frame trade-offs in accessible language. "I'm recommending React here because it has the biggest ecosystem for what you're building — lots of examples to learn from and components you can reuse."
- **Builder mode:** Lead with the trade-offs, assume they understand the concepts. "Options: React (biggest ecosystem, most examples), Svelte (lighter, faster dev), Vue (middle ground). I'd go React for this scope. Thoughts?"
```

- [ ] **Step 3: Add mode adaptation to deepening rounds**

In the `### Phase 2 — Deepening Rounds` section (around line 55), add after "offer the choice":

```markdown
**Frame deepening rounds by mode:**
- **Learner mode:** Encourage going deeper. "The spec is the most technical doc — extra rounds here tend to catch architecture issues before they become build problems. Worth it?"
- **Builder mode:** Offer concisely. "Deeper, or ready to generate?"
```

- [ ] **Step 4: Verify the edit**

Open `plugins/app-project-readiness/skills/spec/SKILL.md` and confirm all three mode adaptation blocks are present.

- [ ] **Step 5: Commit**

```bash
git add plugins/app-project-readiness/skills/spec/SKILL.md
git commit -m "feat: add mode-aware explanation depth to spec skill"
```

---

### Task 7: Mode-Aware Checklist Skill

**Files:**
- Modify: `plugins/app-project-readiness/skills/checklist/SKILL.md`

- [ ] **Step 1: Add mode adaptation to the Core Lesson section**

After the existing "The Core Lesson" section (around line 29), add:

```markdown
**Adapt the framing to mode:**
- **Learner mode:** Explain what build sequencing is and why it matters. "We're breaking the spec into small, ordered steps where each one can be verified before moving on. The order matters — building auth before the dashboard prevents rework because the dashboard needs user state."
- **Builder mode:** Brief transition: "Let's sequence the build." Straight to the first question.
```

- [ ] **Step 2: Add mode-aware build mode recommendation framing**

In the "Build mode" section under "Build Mode Details" (around line 68), add mode-aware framing alongside the existing experience-level recommendations. After the existing "Frame your recommendation based on their profile" block (which has first-timers/intermediate/experienced), add:

```markdown
**Frame your recommendation based on mode AND profile:**
- **Learner mode (any experience level):** Lean toward step-by-step. "I'd recommend step-by-step — you'll learn more along the way, and we can talk through what's happening as we go." If they're experienced, add: "You can always breeze through it quickly."
- **Builder mode (any experience level):** Lean toward autonomous. "Autonomous will get you to a working app faster — I'll pause at checkpoints so you can verify things look right." If they're newer, add: "Step-by-step is there if you'd rather go one at a time."

The existing experience-level recommendations still apply as a secondary signal. Mode is the primary driver for the default recommendation, experience level is the tiebreaker.
```

- [ ] **Step 3: Add mode adaptation to comprehension checks and verification framing**

In the comprehension checks section (around line 81), add:

```markdown
**Frame by mode:**
- **Learner mode:** Present comprehension checks warmly. "After each step, I can ask you a quick question about what was just built — it helps make sure the pieces make sense as we go. I'd recommend it. Want that?"
- **Builder mode:** Mention but don't sell. "Comprehension checks are available if you want them — quick multiple choice after each step. On or off?"
```

In the verification section (around line 85), add:

```markdown
**Frame by mode:**
- **Learner mode:** Recommend verification enthusiastically. "I'd really recommend verifying as we go — it's how you catch problems early and stay connected to what's being built."
- **Builder mode:** Present as a practical choice. "Verification: on (checkpoints every 3-4 items) or off (summary at the end). On is safer."
```

- [ ] **Step 4: Verify the edit**

Open `plugins/app-project-readiness/skills/checklist/SKILL.md` and confirm mode adaptation blocks are present in: Core Lesson, build mode recommendation, comprehension checks, and verification.

- [ ] **Step 5: Commit**

```bash
git add plugins/app-project-readiness/skills/checklist/SKILL.md
git commit -m "feat: add mode-aware defaults and framing to checklist skill"
```

---

### Task 8: Mode-Aware Build Skill

**Files:**
- Modify: `plugins/app-project-readiness/skills/build/SKILL.md`

- [ ] **Step 1: Add mode adaptation to step-by-step announcement**

In the step-by-step mode section, under "1. Announce What You're Building" (around line 43), add after the existing description:

```markdown
**Adapt the announcement to mode:**
- **Learner mode:** Include a brief explanation of why this step matters in the sequence. "This connects the search bar we built in step 3 to the database — after this, searching will actually return real results. This is where the app starts feeling real."
- **Builder mode:** Keep it factual. "Step 4: wire up the search endpoint. Connects search to the DB." Then build.
```

- [ ] **Step 2: Add mode-aware default narration**

In the step-by-step mode section, under "2. Build It" (around line 47), add after the check-in cadence descriptions:

```markdown
**Mode influences the default cadence:**
- **Learner mode:** Default to learning-driven narration unless the learner chose otherwise in `/checklist`.
- **Builder mode:** Default to balanced or speed-run narration unless the learner chose otherwise in `/checklist`.
The learner's explicit choice in `/checklist` always takes precedence over the mode default.
```

- [ ] **Step 3: Add mode adaptation to autonomous mode checkpoints**

In the autonomous mode section, under step 4 (verification checkpoints, around line 115), add:

```markdown
**Adapt checkpoint communication to mode:**
- **Learner mode:** Slightly more context at checkpoints. Explain what was built and how it connects. "Since the last check, I've built the data model, API endpoints, and search feature. The data model defines how recipes are stored, the API serves them up, and search queries the API. Try searching for something — you should see results."
- **Builder mode:** Keep checkpoints concise. "Built: data model, API, search. Try searching — should see results. Good?"
```

- [ ] **Step 4: Verify the edit**

Open `plugins/app-project-readiness/skills/build/SKILL.md` and confirm mode adaptation blocks are present in: announcement, narration defaults, and checkpoint communication.

- [ ] **Step 5: Commit**

```bash
git add plugins/app-project-readiness/skills/build/SKILL.md
git commit -m "feat: add mode-aware narration and checkpoints to build skill"
```

---

### Task 9: Mode-Aware Iterate Skill

**Files:**
- Modify: `plugins/app-project-readiness/skills/iterate/SKILL.md`

- [ ] **Step 1: Add mode adaptation to the review pass**

In section "2. Quick Review Pass" (around line 36), add after "Share 2-3 observations with the learner":

```markdown
**Adapt the review pass to mode:**
- **Learner mode:** Frame observations with a bit more context. "Based on what we built, here's what I noticed..." and explain the implications of each observation.
- **Builder mode:** Keep it crisp. Bullet the observations without elaboration unless they ask.
```

- [ ] **Step 2: Verify the edit**

Open `plugins/app-project-readiness/skills/iterate/SKILL.md` and confirm the mode adaptation block is present in the review pass section.

- [ ] **Step 3: Commit**

```bash
git add plugins/app-project-readiness/skills/iterate/SKILL.md
git commit -m "feat: add mode-aware tone to iterate skill"
```

---

### Task 10: Mode-Aware Reflect Skill

**Files:**
- Modify: `plugins/app-project-readiness/skills/reflect/SKILL.md`

- [ ] **Step 1: Add mode adaptation to the quiz**

In "Part A — Conversational Quiz" (around line 38), add after "Frame it casually":

```markdown
**Adapt quiz depth to mode:**
- **Learner mode:** Take more time with each question. If their answer is incomplete, gently probe: "That's a great start — can you say more about how that showed up in what we did?" The quiz is a learning moment.
- **Builder mode:** Keep the quiz brisk. Ask the question, take their answer, move on. If they nail it, a quick "exactly" is enough. Only probe if something is significantly off.
```

- [ ] **Step 2: Add mode adaptation to feedback tone**

In "Part B — Qualitative Project Review" (around line 67), after "The Framing" section, add:

```markdown
**Adapt feedback tone to mode:**
- **Learner mode:** Feedback is encouraging and developmental. Frame growth areas as learning opportunities. "Next time, try pushing back more when I suggest something — your instincts are good and the project benefits when you drive." More warmth, more encouragement of the journey.
- **Builder mode:** Feedback is peer-level. Direct observations, less hand-holding. "Your spec was tight but the PRD had gaps in edge cases — that showed up as ambiguity during the build. Worth the extra round next time." Respect their ability to take direct feedback.
```

- [ ] **Step 3: Add mode adaptation to the closing**

In the `## Closing` section (around line 140), add:

```markdown
**Adapt the closing to mode:**
- **Learner mode:** A warmer send-off that acknowledges the journey. "You went from an idea to a working app — and more importantly, you learned a process you can repeat. That's the real takeaway."
- **Builder mode:** Keep it concise. "Full cycle complete. The process works on any project. Ship it."
```

- [ ] **Step 4: Verify the edit**

Open `plugins/app-project-readiness/skills/reflect/SKILL.md` and confirm mode adaptation blocks are present in: quiz depth, feedback tone, and closing.

- [ ] **Step 5: Commit**

```bash
git add plugins/app-project-readiness/skills/reflect/SKILL.md
git commit -m "feat: add mode-aware quiz depth and feedback tone to reflect skill"
```

---

### Task 11: Final Review Pass

**Files:**
- Read all modified files

- [ ] **Step 1: Verify consistency across all files**

Read every modified file and check:
- Does every per-command mode adaptation reference "Learner mode" and "Builder mode" consistently (not "learner" vs "Learner" inconsistency)?
- Does the guide skill's central definition match what each command implements?
- Does the onboard skill's mode selection match the two modes defined in the guide?
- Does the learner profile template's Mode field match what onboard stores?

- [ ] **Step 2: Verify no existing behavior was broken**

Confirm that:
- All existing experience-level adaptations are still intact (mode is additive, not replacement)
- The deepening rounds pattern still works the same way in both modes
- Guard rails and prerequisites are unchanged
- The command chain flow is unchanged
- Process notes logging is unchanged

- [ ] **Step 3: Commit any fixes**

If any inconsistencies were found, fix them and commit:

```bash
git add -A
git commit -m "fix: resolve consistency issues in mode adaptations"
```

If no fixes needed, skip this step.
