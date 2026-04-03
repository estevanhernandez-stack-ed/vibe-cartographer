# Evaluation Dimensions — Agent Reference

This document is for the agent only. It defines how you reason about the learner's work in /reflect. Use these dimensions to structure your thinking, but your output is qualitative observations — strengths and growth areas — not scores.

## How to Use This

For each dimension:
1. **Read the relevant artifacts.** Know what you're looking at before forming opinions.
2. **Reason step-by-step** through the criteria. Think about what's present and what's missing.
3. **Cite specific evidence.** Quote or reference exact passages from the artifacts. Don't make vague claims.
4. **Calibrate to the learner.** The same artifact quality means different things for a first-timer vs a senior dev. Read their technical background and adjust what "good" looks like.
5. **Output one strength and one growth area per dimension.** Keep each to 2-3 sentences with evidence.

## Guards

Apply these throughout every review:

- **Calibrate to project context.** Don't expect production-quality code or professional-grade documents from a rapid build.
- **Penalize verbosity, not brevity.** A concise scope doc that nails the idea is better than a long one full of filler. Judge substance, not length.
- **Evaluate against the PRD, not your own taste.** The PRD's acceptance criteria are the external anchor. Did the app do what the learner said it should do? Not what you think it should do.
- **If evidence is insufficient, say so.** Don't fill gaps with charitable assumptions or harsh ones. Just note what's missing.
- **Active engagement matters.** A beautiful app built by a passive learner is less impressive than a rougher app built by someone who actively shaped every decision.

## Dimensions

### 1. Scope & Idea Clarity

How well-defined is the idea? Does `scope.md` give a clear picture of what's being built and why?

**What to look for:**
- Is the idea stated clearly enough that someone could picture the app?
- Is a specific user and problem identified (not "everyone" or "people")?
- Does "What's Explicitly Cut" name real features with rationale?
- Is "What Done Looks Like" concrete enough to verify?
- Is the scope realistic given the learner's experience?

**What "strong" looks like:** The idea is sharp — one sentence and you get it. The user, problem, and constraints are specific and grounded. Scope cuts show genuine prioritization thinking.

**What "needs work" looks like:** The idea is vague, no specific user, nothing explicitly cut, "done" is described in generalities.

### 2. Requirements Thinking

Does `prd.md` define complete, testable requirements? Were edge cases surfaced? Did the learner invest in specification depth?

**What to look for:**
- Do user stories cover the core user journey?
- Are acceptance criteria specific and testable (not vague like "works well")?
- Are edge cases and error states addressed (empty states, bad input, no results)?
- Does "What we're building" vs "What we'd add" show genuine prioritization?
- Is the PRD substantially more detailed than the scope doc?
- How many deepening rounds did the learner choose? (Check process notes.) Did extra rounds produce materially better requirements, or did the learner stop at the minimum?

**What "strong" looks like:** Stories are comprehensive and grouped meaningfully. Every acceptance criterion is specific enough to verify by looking at the screen. Multiple edge cases addressed. The learner deeply understood what they were building. Extra deepening rounds (if taken) produced tangible improvements.

**What "needs work" looks like:** PRD is a reformatted copy of the scope doc. Acceptance criteria say "it should work." No edge cases mentioned. The learner skipped deepening rounds and the gaps show in the build.

### 3. Technical Decisions

Does `spec.md` show intentional architecture choices? Does the checklist sequence make sense? Did specification depth prevent build problems?

**What to look for:**
- Are stack choices explained with rationale tied to the learner's experience?
- Are file structure and data flow documented clearly enough for building?
- Do architecture decisions reference PRD epics — is there traceability?
- Is the checklist sequenced logically (dependencies respected)?
- Does the spec address how the submission will work?
- Did deepening rounds in /spec catch issues that would have caused problems during /build? Or did skipping them leave gaps the build had to work around?
**What "strong" looks like:** Every decision has clear rationale. File structure is annotated. Data flow is diagrammed. PRD cross-references are thorough. The learner actively shaped the architecture. If they invested in deepening rounds, the payoff is visible in build smoothness.

**What "needs work" looks like:** Stack listed without rationale. No file structure. No PRD connection. Checklist is a flat list with no dependency logic. Shallow specification led to build problems that deeper planning would have caught.

### 4. Plan vs. Reality

Does the finished app do what the PRD said it should do?

**What to look for:**
- Does the app run without crashing on the core flow?
- How many "What we're building" acceptance criteria are met?
- Is the core user journey functional end-to-end?
- Where did the build drift from the plan, and did the learner adapt?

**What "strong" looks like:** The app does what the PRD said. Most acceptance criteria are met. The gap between plan and execution is small, or the learner noticed drift and adjusted thoughtfully.

**What "needs work" looks like:** Major gap between plan and build. Core features missing or broken. The learner didn't notice or address the drift.

### 5. How You Worked

From `process-notes.md` and comprehension check answers: did the learner actively shape the project?

**What to look for:**
- Did the learner make real decisions (not just agree to everything)?
- Did they push back on or modify agent suggestions?
- Were comprehension check answers engaged and accurate (if they opted in)?
- Did the learner contribute ideas the agent hadn't suggested?
- Did the learner's thinking evolve across the phases?
- How did they approach deepening rounds? Did they invest in specification depth or rush to the next command?

**What "strong" looks like:** Process notes show full engagement at every step. Multiple instances of pushing back, redirecting, adding ideas. Comprehension checks are concise and accurate. Deepening rounds were used strategically. The project distinctly reflects the learner's vision.

**What "needs work" looks like:** The learner accepted most suggestions without pushback. Comprehension checks are vague or confused. Skipped all deepening rounds and the documents are thin. The project feels like the agent built what the agent wanted to build.

**If the learner was mostly passive,** address it directly but constructively. This is the most important feedback the review can deliver: "Working with a coding agent, it's easy to let it drive. That's understandable, but on longer projects, passive acceptance means you can't debug, extend, or explain your own code. Try pushing back more and making each decision feel like yours."
