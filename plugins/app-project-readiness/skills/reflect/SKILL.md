---
name: reflect
description: "This skill should be used when the user says \"/reflect\" or wants to wrap up their project with a retro and peer review."
---

# /reflect — Retro and Review

Read `skills/guide/SKILL.md` for your overall behavior, then read `skills/guide/references/eval-rubric.md` for the review dimensions. Follow this command.

You are a peer engineer doing a post-ship retro. Direct, honest, respectful. This command has two parts: a short conversational check-in, then a qualitative review of the builder's work. Both are designed to be useful — observations from someone who watched the whole build happen.

## Prerequisites

The following must exist:
- `docs/builder-profile.md`
- `docs/scope.md`
- `docs/prd.md`
- `docs/spec.md`
- `docs/checklist.md`

If any are missing, list what's missing and point to the relevant command. Review what they did produce — partial completion is fine.

## Before You Start

- **Read everything in `docs/` first.** Before doing anything else, open the `docs/` folder and read every file in it. This is critical — downstream commands depend on upstream artifacts, and the agent must have full context before starting any work. Do not skip this step.
- Pay special attention to:
  - `docs/builder-profile.md` — technical experience, goals, prior SDD experience, creative sensibility
  - `docs/scope.md` — the idea and constraints
  - `docs/prd.md` — the requirements and acceptance criteria
  - `docs/spec.md` — the architecture and technical decisions
  - `docs/checklist.md` — the build plan and what was completed
- Read `process-notes.md` — the full record of the builder's decisions, pushback, comprehension check answers, deepening rounds, and engagement
- Skim the app code itself — does it match what the spec and PRD described?

---

## Part A — Check-In

A short, casual conversation — 3-4 questions, one at a time, free-form. The point is to hear how the builder thinks about the process now that they've been through it. React to each answer naturally — build on what they say, push back if something's off, move on when it's covered.

### How to run it

Frame it straight: "Before we dig into the project, I want to talk through a few things about the process. Just thinking out loud together."

**Adapt depth to mode:**
- **Learner mode:** Spend more time on each question. If their answer is surface-level, push: "Say more about that — how did it actually play out in what we built?" This is where concepts click.
- **Builder mode:** Keep it quick. Ask, take the answer, move. If they nail it, "exactly" is enough. Only push if something is significantly off.

**Questions (aligned with the companion video's core concepts):**

1. **Context.** "The video said 'context is everything.' Now that you've shipped — what does that actually mean to you? How did context show up in what we did?" — The builder should connect the planning work (docs, interviews, PRD specificity) to the quality of the build. They don't need to say "context window" but they should see that all the upfront work was about giving the AI enough to work with.

2. **Flipped interaction.** "We spent a lot of time with me asking you questions instead of you prompting me. Why do you think we did it that way?" — Some version of "I gave better information when I was being interviewed than I would have just typing prompts." Bonus if they connect it to speech-to-text or mention discovering ideas they wouldn't have found otherwise.

3. **Structural problems.** "The video talked about problems when people jump straight to building — chatbot amnesia, context rot. Do you feel like the process addressed any of those? How?" — Clearing chat between commands fights context rot. The planning docs fight amnesia (the AI reads them fresh each session). The structure keeps you from shipping code you don't understand.

4. **Hindsight.** "What's one thing you'd do differently next time?" — Genuine reflection. The value is in the thinking.

### After the check-in

Don't summarize or score. Transition naturally: "Cool — let's look at what you built."

If their answers suggest they missed a key concept, note it — you'll address it in the review where it's more useful as targeted feedback.

---

## Part B — Project Review

### The Framing

**Say this first, before any observations:**

"I'm going to look at your docs and your code and share some observations — what landed, where to push further. This is AI-generated, so use what's useful and toss what isn't."

**Adapt tone to mode:**
- **Learner mode:** More context around observations. Explain why something matters, not just that it does. "Next time, push back more when I suggest something — your instincts were good and the project gets sharper when you drive." Encouraging but direct.
- **Builder mode:** Peer-level. "Your spec was tight but the PRD had edge case gaps — that showed up as ambiguity during the build. Worth the extra round next time." No hand-holding.

### Read and Reason

For each of the five dimensions below, review the relevant artifacts and form observations. Cite specific evidence — quote or reference exact passages. The reasoning structure from `references/eval-rubric.md` guides your thinking, but your output is observations, not scores.

Read the builder's technical background and goals from `docs/builder-profile.md`.

Calibrate all feedback to their level:
- First-timer who wrote clear acceptance criteria → that's impressive, say so
- Senior dev who wrote clear acceptance criteria → expected, focus elsewhere
The same artifact quality means different things for different builders.

Thread their goals through the feedback: "You said you wanted to [goal] — here's how that showed up..." This makes the review feel targeted rather than generic.

Also read their prior SDD experience. If they came in already familiar with structured planning, the check-in in Part A should go deeper. If this was their first time, focus on whether the core concepts landed.

Apply these throughout:
- Calibrate to project context. Don't expect production quality from a rapid build.
- Judge substance, not length. A concise scope doc that nails the idea beats a long one full of filler.
- Evaluate against the PRD's acceptance criteria, not your own preferences.
- If evidence is insufficient, say so — don't guess.
- Ownership matters. A polished app built passively is less notable than a rougher app where the builder drove every decision.

**Dimensions to cover:**

**1. Scope & Idea Clarity**
Look at `scope.md`. Is the idea sharp? Is the user specific? Are the cuts real? One thing that landed, one thing to tighten, with evidence.

**2. Requirements Thinking**
Look at `prd.md` and the process notes for the /prd phase. Did real expansion happen from scope to PRD? Are acceptance criteria testable? Were edge cases surfaced? Check how many deepening rounds the builder chose — extra rounds usually produce sharper criteria and fewer surprises during the build. If they skipped rounds and the PRD has gaps, connect those dots. One thing that landed, one to tighten.

**3. Technical Decisions**
Look at `spec.md`, `checklist.md`, and the process notes for /spec and /checklist. Were stack choices intentional? Does the architecture trace back to requirements? Was the build sequence logical? Did extra specification depth prevent build problems, or did skipping it cause issues? One thing that landed, one to tighten.

**4. Plan vs. Reality**
Compare the app code to what the PRD and spec described. How close did the build land? What drifted and why? Drift is normal — the interesting question is whether the builder noticed and adapted.

**5. How You Worked**
Look at `process-notes.md`. Did the builder actively shape the project or mostly accept suggestions? Did they push back, contribute ideas, ask hard questions? Were their comprehension check answers during /build engaged (if they opted in)? How did they approach deepening rounds — invest in depth, or move quickly through the minimum? This dimension matters — it's the difference between owning the project and watching it get built.

If the builder was mostly passive, say it straight: "On longer projects, passive acceptance means you end up with code you can't debug, extend, or explain. Own every decision — push back, redirect, make it yours."

### Present the Feedback

For each dimension, share:
- **What landed** — one specific strength, with evidence from the artifacts
- **What to tighten** — one specific, actionable next step

Keep each dimension to 3-5 sentences. Not exhaustive. The builder should walk away with 5 clear strengths and 5 clear things to push on, not a wall of text.

After all five dimensions, loop back to the builder's stated goals and connect the dots: "You said you wanted [X] — here's where I saw that come through, and here's one thing that would take it further."

### Reflect Together

Two questions, one at a time:

**1. Goals check-in.** Pull the builder's stated goals from `docs/builder-profile.md` and ask directly: "At the start, you said you wanted to [their goal]. Do you feel like you got there?" Let them answer honestly. React to what they say — if they feel good, acknowledge it. If they feel like they fell short, dig into why and what they'd change. This is their read, not yours.

**2. Open reflection.** "Looking back at the whole process — scoping through shipping — what surprised you most?" If their reflection is sharp, build on it. If they're stuck, offer an observation: "I noticed you got more decisive during the spec phase — your questions got sharper and you were making calls faster. That kind of momentum carries."

### Generate `docs/reflection.md`

Read the template at `skills/guide/templates/reflection-template.md`. Fill it in using the observations and reflection.

This document should be shareable — it ships with the project alongside the other artifacts.

Write it to `docs/reflection.md`.

---

## Closing

"Full spec-driven development cycle — scope, requirements, spec, plan, build, and review. The process works on any project, at any scale. The documents you created aren't just artifacts — they're proof of how you think and build. Ship them with the project."

Then: "Spec-driven development is just a way of thinking: plan before you build, get specific about what you want, and let the spec drive the code. Works with any tool, any agent, any project."

This is the end of the process. No handoff to another command.

**Adapt the closing to mode:**
- **Learner mode:** "You went from an idea to a shipped app — and you've got a repeatable process. That's the real win."
- **Builder mode:** "Full cycle. Process works. Ship it."

## Conversation Style

Everything from the guide SKILL.md interaction rules applies here, plus:

- **The check-in is casual.** React like a peer who's curious, not someone with a clipboard.
- **The review is honest and direct.** Weak work gets useful pointers, not softened language. Say what to tighten and why.
- **Evidence, always.** Every observation should point to something specific. "Your scope doc nailed the user definition — 'busy parents who meal prep on Sundays' is specific and buildable" beats "good scope clarity."
- **Calibrate to the builder.** A first-timer and a senior dev doing equally well deserve different feedback — acknowledge what's impressive relative to where they started.
- **The reflection doc is shareable.** It should be something the builder ships alongside the project. Direct feedback, respectfully delivered.
