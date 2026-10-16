---
name: next
description: "This skill should be used when the user says \"/next\" or \"/vibe-cartographer:next\" or asks what to run next, which Vibe Cartographer step they are on, or where they left off. Read-only: reads which artifacts exist in docs/, whether the checklist has unchecked items, and any resumable /take run, then prints the current step and the next command. Writes nothing beyond the session-log entry."
---

# /next: Which Step Is Next

Slash command `/vibe-cartographer:next`. Looks at the project's `docs/` folder and says where the builder is in the chain and what to run next. One short answer, no interview.

**Read-only.** This command writes and deletes nothing in the project. It decides from the files already there and does not change them.

## Before You Start

- **Chain and handoff phrasing:** [`../guide/SKILL.md`](../guide/SKILL.md), sections Command Chain, Guard Rails, and Handoff. The next-command line uses the client-aware form from Handoff.
- **Run state:** [`../guide/references/unattended-run.md`](../guide/references/unattended-run.md), section Resume and state.json, for which item statuses are terminal.
- **Friction triggers contract:** [`../guide/references/friction-triggers.md`](../guide/references/friction-triggers.md). The `/next` section is intentionally empty. This command does **not** call `friction-logger.log()`.
- **Session logger interface:** [`../session-logger/SKILL.md`](../session-logger/SKILL.md).

## Session Logging

At command start, call `session-logger.start("next", <project_dir>)` and hold the sessionUUID.

At command end, call the session-logger terminal-append procedure with:

- `outcome: "completed"` on a clean run, including cold start.
- `outcome: "partial"` if an artifact or `state.json` existed but could not be read and the answer says so.
- `outcome: "error"` only if the command crashed before printing.
- `artifact_generated: null`, `complements_invoked: []`, `friction_notes: []`, `key_decisions: []`.

This is the one write the command makes, through `session-logger` and its atomic-append script. The command never writes any file directly.

## Friction Logging

Reference: [`../guide/references/friction-triggers.md`](../guide/references/friction-triggers.md), section `/next`, which is intentionally empty. Asking where you are is the expected mode, not friction. Universal triggers apply only with a quoted prior turn in `symptom`; without one, do not log.

## Flow

### 1. Read the project

From the current project directory only. Do not scan elsewhere.

- Does each of these exist in `docs/`: `builder-profile.md`, `scope.md`, `prd.md`, `spec.md`, `checklist.md`, `reflection.md`?
- If `docs/checklist.md` exists: count lines matching `- [ ]` (open) and `- [x]` (done). `/iterate` appends `## Iteration N` sections to this same file, so its items are counted in the same totals.
- If `docs/cart-runs/` exists: for each `docs/cart-runs/*/state.json`, read `items[].status`. `pending` and `building` are non-terminal. `merged`, `held`, `parked`, `stopped` are terminal. For a run folder with no `state.json` but a `list.md`, an unchecked item in `list.md` counts as non-terminal.

A missing file is a normal answer, not an error. A file that exists but cannot be read gets one line, `could not read <path>: <error>`, and the answer continues without it.

### 2. Pick the step

Take the first row that matches, top to bottom. The prerequisites come from each command's own Guard Rails.

| State of `docs/` | You are at | Next command | Source of the rule |
|------------------|-----------|--------------|--------------------|
| No `docs/` folder, or no `builder-profile.md` | Not started | `/onboard` | `/onboard` has no prerequisites and writes `builder-profile.md`; `/scope` requires it |
| `builder-profile.md`, no `scope.md` | Onboarded | `/scope` | `/scope` requires `builder-profile.md`, writes `scope.md` |
| `scope.md`, no `prd.md` | Scoped | `/prd` | `/prd` requires `scope.md`, writes `prd.md` |
| `prd.md`, no `spec.md` | Requirements written | `/spec` | `/spec` requires `scope.md` and `prd.md`, writes `spec.md` |
| `spec.md`, no `checklist.md` | Spec written | `/checklist` | `/checklist` requires `spec.md` and `prd.md`, writes `checklist.md` |
| `checklist.md` with any `- [ ]` | Building | `/build` | `/build` picks up the first unchecked item; `/iterate` items land in the same file |
| `checklist.md` with every box checked, no `reflection.md` | Build complete | `/reflect`, or `/iterate` first for an optional polish pass | `/iterate` requires all items checked and is optional; `/reflect` writes `reflection.md` |
| `reflection.md` present, checklist fully checked | Chain complete | Nothing in the chain | See "Chain complete" below |

Edge cases:

- **Artifact out of order** (for example `spec.md` exists but `prd.md` does not): name the first missing prerequisite, not the furthest artifact. The command that regenerates it is the next step.
- **`checklist.md` with no checkbox lines at all:** treat as unreadable, say so, and name `/checklist` to regenerate it.
- **`reflection.md` present but the checklist has new unchecked items** (an `/iterate` round added after the retro): you are at Building. Next is `/build`, then `/reflect` again.
- **Built with `/take` instead of the checklist:** if there is no `checklist.md` but a resumable run exists, the run mention below is the answer.

### 3. Chain complete

When `reflection.md` exists and nothing is open, say the chain is done and offer the commands that sit outside it, one line each: `/tend` for a drift sweep on the built app, `/iterate` for another polish round, `/evolve-cart` to let Cart read its own logs, `/take` for any new list. Do not push any of them.

### 4. Mention a resumable run

If any run has a non-terminal item, add one line after the chain answer:

`A /take run is unfinished: docs/cart-runs/<run>/ (<n> of <total> items left). Resume with /take docs/cart-runs/<run>/.`

Name every such run, newest first. Terminal-only runs are not mentioned. If a run is the only open work (no chain step applies), lead with it.

### 5. Print

Use the client-aware handoff phrasing from the guide's Handoff section.

- **Claude Code CLI / IDE / terminal-style agent:** "Run `/clear`, then run `/<next>`."
- **Claude Desktop (Cowork) or unsure:** "When you're ready, run `/<next>`."

Shape of the answer, kept to a few lines:

```
You are here: <step name> (<one-clause evidence, e.g. spec.md written, no checklist.md>).
Next: <handoff line>
<resumable run line, if any>
```

For Building, add the count: `Checklist: <done> of <total> items checked.` For the Build complete row, say `/iterate` is optional and `/reflect` is the chain's last step.

Persona adaptation: keep it to one tone line at most, using `shared.preferences.persona` when a profile exists. No profile means the plain answer above.

Then do the session-logger terminal append. No further handoff; the answer is the handoff.

## Cold start

No profile, no `docs/`, no `docs/cart-runs/`: the answer is "You are here: not started. Next: run `/onboard`." in the client-aware phrasing. Nothing else is printed, and the outcome is `completed`. The session-logger start call for this run may create the sessions directory and one log file.
