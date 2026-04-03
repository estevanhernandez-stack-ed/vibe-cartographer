# Learner vs Builder Mode — Design Spec

## Summary

Add a two-tier mode system to the Marcus App Readiness Plugin: **Learner** and **Builder**. Both modes follow the same eight-command curriculum and produce the same artifacts. The difference is tone, pacing, and defaults — Learner mode is a guided walkthrough with a mentor feel, Builder mode is a streamlined flow for people who are ready to move.

## Goals

- Give newcomers a supportive, explanatory experience without slowing down experienced users
- Keep the curriculum structure identical across both modes — same commands, same docs, same quality bar
- Make mode selection feel natural, not bureaucratic

## Non-Goals

- No new commands or structural changes to the plugin
- No different document templates per mode
- No skipping or merging of planning phases

---

## Design

### 1. Central Mode Definition (in `skills/guide/SKILL.md`)

A new section called **"Mode: Learner vs Builder"** added to the guide skill, which every command already reads.

#### Learner Mode

| Dimension | Behavior |
|-----------|----------|
| **Tone** | Encouraging mentor. Explain the *why* before each phase. "Here's what we're doing and why it matters." |
| **Pacing** | Unhurried. Offer deepening rounds proactively. |
| **Preamble** | Each command opens with a brief explanation of what this phase is and how it fits the bigger picture. |
| **Defaults** | Step-by-step build, comprehension checks on, verification on, learning-driven narration. |
| **Nudges** | Gently encourage engagement. "Want to do another round?" feels inviting, not pressuring. |

#### Builder Mode

| Dimension | Behavior |
|-----------|----------|
| **Tone** | Sharp collaborator. Skip the *why* — they already get it. Get to the questions. |
| **Pacing** | Brisk. Mention deepening rounds are available but don't push. |
| **Preamble** | Minimal — one sentence max before diving into the first question. |
| **Defaults** | Autonomous build, comprehension checks off, verification at checkpoints. |
| **Nudges** | Respect their time. "Another round, or ready to move on?" is efficient, not lingering. |

#### Shared Across Both Modes

- Same mandatory questions in every phase
- Same document templates and artifact quality
- Same guard rails and prerequisite checks
- Deepening rounds available in both — just framed differently

---

### 2. Mode Selection (in `/onboard` flow)

Mode is introduced during the onboarding interview, after the agent has a sense of the learner's technical experience and before wrapping up the profile.

**Presentation:** Conversational, not a formal menu. The agent recommends based on what it's learned:

- **First-timer / beginner** → Recommend Learner mode, mention Builder is there if they want it
- **Intermediate** → Present both fairly, let them choose
- **Experienced** → Recommend Builder mode, mention Learner is there if they want a more guided experience

**Key principle:** The agent recommends but does not force. Someone experienced might want Learner mode because they're new to spec-driven development. Someone newer might want Builder mode because they're confident. The recommendation is a starting point, not a gate.

**Storage:** The selection is stored as a new field in `learner-profile.md`:

```markdown
## Mode
Builder
```

Every downstream command reads this alongside the existing experience level fields.

---

### 3. Per-Command Adaptations

Light edits to each command's SKILL.md — mostly tone cues and default flips. No structural changes.

#### `/onboard`
- Introduces mode selection as described above. The rest of onboarding is unchanged.

#### `/scope`
- **Learner:** Opens with "Now we're going to shape your idea into something buildable. This is where the project starts to get real." Encourages expansive brain dumps.
- **Builder:** Opens with "Let's nail down the scope." Straight to the brain dump question.

#### `/prd`
- **Learner:** Explains what a PRD is and why acceptance criteria matter before the first question. Edge case questioning is more guided ("Let me walk you through some things to think about...").
- **Builder:** Skips the explainer. Edge case questioning is direct ("What happens when X?").

#### `/spec`
- **Learner:** More explanation around stack recommendations and architecture choices. Frames trade-offs in accessible language.
- **Builder:** Leads with the trade-offs, assumes they understand the concepts. More "here are your options" and less "here's what this means."

#### `/checklist`
- **Learner:** Recommends step-by-step build by default. Explains what comprehension checks and verification are.
- **Builder:** Recommends autonomous build by default. Mentions comprehension checks and verification as available options without selling them.

#### `/build`
- **Learner:** Default narration is learning-driven. Check-ins are warmer.
- **Builder:** Default narration is balanced-to-speed-run. Check-ins are concise.

#### `/iterate`
- Minimal difference. Builder gets a slightly crisper scoping conversation.

#### `/reflect`
- **Learner:** Quiz questions are more exploratory, feedback is encouraging and developmental.
- **Builder:** Quiz is crisper, feedback is peer-level — "here's what worked, here's what I'd push on."

---

### 4. Learner Profile Template Update

One new section added to `learner-profile-template.md`, placed after experience/background fields and before learning goals:

```markdown
## Mode
<!-- Learner | Builder -->
<!-- Learner: guided walkthrough with explanations and encouragement -->
<!-- Builder: streamlined flow for people ready to move -->
```

---

## Files Modified

| File | Change |
|------|--------|
| `skills/guide/SKILL.md` | New "Mode: Learner vs Builder" section with full behavioral definitions |
| `skills/onboard/SKILL.md` | Mode selection added to interview flow |
| `skills/scope/SKILL.md` | Mode-aware preamble and tone cues |
| `skills/prd/SKILL.md` | Mode-aware preamble and edge case framing |
| `skills/spec/SKILL.md` | Mode-aware explanation depth for stack/architecture |
| `skills/checklist/SKILL.md` | Mode-aware build mode defaults and feature framing |
| `skills/build/SKILL.md` | Mode-aware narration and check-in defaults |
| `skills/iterate/SKILL.md` | Minor tone adjustment for Builder |
| `skills/reflect/SKILL.md` | Mode-aware quiz depth and feedback tone |
| `skills/guide/templates/learner-profile-template.md` | New `## Mode` field |

## Files Not Modified

- `architecture/` — no changes
- `skills/guide/references/` — eval rubric, PRD guide, spec patterns unchanged
- Other templates — same structure, same quality bar
- `plugin.json` — no new commands or metadata
