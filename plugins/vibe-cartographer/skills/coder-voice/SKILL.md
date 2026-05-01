---
name: coder-voice
description: "This skill should be used when the user says \"/coder-voice\" or wants to capture, refresh, or extend their coder voice profile. Generates or updates the `## CODER VOICE SYNTHESIS` block in `~/.claude/CLAUDE.md` so the agent answers in a chosen voice during autonomous work. **Always presents the user a choice — never imposes a path.** Three options: (1) personal voice via discover-first corpus sweep or interview, (2) preset cutter — install a curated voice (Carmack, DHH, Bret Victor, Julia Evans) modeled after a known coder/writer, (3) skip — leave the default Architect persona unchanged. Idempotent — re-runnable to refresh, swap presets, extend the Cross modifier layer, or restart from scratch."
---

# /coder-voice — Capture and Apply the Coder's Actual Voice

Read `skills/guide/SKILL.md` for your overall behavior, then follow this command.

This SKILL captures **the actual coder's voice** (the user's, not a synthesis of admired voices) and writes it to `~/.claude/CLAUDE.md` so the agent answers in that voice during autonomous work. It's parallel to `vibe-thesis:voice-synthesis` but inverted — the user is the base; admired coders are optional **Cross** modifiers, never replacements.

## Why this exists

When agents work autonomously over long sessions, output drifts toward generic-AI voice — corporate-speak, hedged framing, polite ceremony. A persisted voice profile in `~/.claude/CLAUDE.md` (which loads on every Claude Code session) anchors the agent in the user's actual voice across every project, every repo, every working day.

This is **the coder's own voice**, not a stylized voice. For "pick a preset coder voice" use the `cutter` mode (Section 7) instead.

## Prerequisites

- Read access to `~/.claude/CLAUDE.md` (the global persona file).
- Read access to the user's session transcripts under `~/.claude/projects/<project>/<session-uuid>.jsonl`.

No prior Cart command needs to have run — `coder-voice` is independent of the build chain.

## Modes

| Mode | Trigger | What it does |
|---|---|---|
| **chooser** | No args, no existing block | Default. Present three paths (personal / preset / skip). Never start writing without user picking a path |
| **revise** | No args, block already exists | Show current values; ask field-by-field "keep / change / extend / drop" |
| **discover** | `discover` arg | Force discover-first corpus sweep (used inside personal path; can also be invoked directly to refresh from corpus) |
| **interview** | `interview` arg | Force the 3-question interview (skip discovery). For users with intentionally-private corpus |
| **cross** | `cross` arg | Add or update the Cross — voice modifiers section. Doesn't touch base voice. Works with any base (personal or preset) |
| **cutter** | `cutter <preset>` arg | Install a named preset cutter voice. Available presets: `carmack`, `dhh`, `bret-victor`, `julia-evans`. Listed under `cutters/` directory |
| **cutter** *(no preset arg)* | `cutter` arg with no name | Show the preset menu and let user pick |

## Self-modification protocol

This SKILL writes to `~/.claude/CLAUDE.md`, which changes how the agent behaves in **every future session, every repo**. That's load-bearing global self-modification.

- **Always show the proposed block diff before writing.**
- **Always require explicit yes from the user before the write.** Never write on first read.
- **The harness may block the write** — `~/.claude/CLAUDE.md` edits hit the same Self-Modification gate as `.claude/settings.json`. If blocked, offer the content for paste-in or suggest invoking via the `update-config` skill.

## Discovery — priority order

When in `fresh` or `discover` mode, sweep these sources in order. Stop only when the user explicitly says to stop, or when all sources have been exhausted.

1. **`~/.claude/CLAUDE.md`** — existing persona definition (The Architect, voice rules, tone, pace).
2. **`~/.claude/profiles/builder.json`** — `shared.preferences.tone`, `pacing`, `communication_style`, `creative_sensibility`, plus any plugin-namespace voice notes.
3. **Session transcripts** at `~/.claude/projects/<project>/<session-uuid>.jsonl` — **first-class source**. Sample the most recent 5-10 sessions across diverse projects. Filter each line to `type: "user"` AND `message.content` is text (not tool results). Skip lines starting with `<` (system reminders), `Caveat:`, `[Pasted` (pasted blobs), or containing `system-reminder` / `tool_use_id` in the first 200 chars. Keep messages between 30 and 800 chars for voice signal.
4. **Project memories** at `~/.claude/projects/<project>/memory/*.md` — especially `user_*.md` files (e.g., `user_voice_lizzing.md`, `user_profile_context.md`). Read MEMORY.md index first.
5. **Project-local artifacts** — `process-notes.md`, `docs/blog/*.md`, `docs/reflection.md`, recent commit messages filtered by `git log --author=<user>`.
6. **Optional builder-pointed exemplars** — if the user says "look at <path>", read those.

**Failure mode to avoid:** treating curated artifacts (memories, blog posts) as the only source and skipping the session transcript well. Session transcripts contain interaction patterns (multi-point answers, course-corrections-as-concerns, please-as-baseline, stream-of-thought) that don't show up in edited prose.

## Flow — chooser mode (default when no args, no existing block)

**This is the default entry path.** When the user runs `/coder-voice` and there's no existing `## CODER VOICE SYNTHESIS` block, do not pull them into discover-first automatically. Present a three-way choice. Voice profiles are an option, not a demand.

### 1. Show the chooser

```
Voice profile not set. Three paths — pick what fits, none are required:

  [personal]  Capture YOUR actual voice. The skill sweeps your corpus
              (~/.claude/CLAUDE.md, ~/.claude/profiles/builder.json, recent
              session transcripts under ~/.claude/projects/, memories, blog
              posts, process-notes) and synthesizes a profile, or falls back
              to a 3-question interview if corpus is thin. Profile lives at
              ~/.claude/CLAUDE.md and applies across every Claude Code session.

  [preset]    Pick a curated cutter voice — Carmack, DHH, Bret Victor, or
              Julia Evans. Stylized agent voice, NOT yours. Use this when you
              want a particular flavor (technical-precision, opinionated,
              tools-for-thought, accessible-explainer) without exposing your
              own voice in a profile file.

  [skip]      Don't set a voice profile. The default Architect persona keeps
              running. Run /coder-voice anytime later to set one up.

Which path? [personal | preset | skip]
```

### 2. Route on choice

- **`personal`** → continue to `## Flow — fresh mode (discover-first)` below.
- **`preset`** → continue to `## Flow — cutter mode` (replaces the v1 placeholder).
- **`skip`** → exit cleanly: `"Got it. /coder-voice anytime if you want to set one up later."` Don't write anything.

### 3. Always confirm before any write

Regardless of path, never write to `~/.claude/CLAUDE.md` without explicit yes. Self-modification gate applies to all paths equally.

## Flow — fresh mode (discover-first)

### 1. Announce and frame

```
Sweeping your corpus to extract a coder voice profile...

I'm reading: ~/.claude/CLAUDE.md, ~/.claude/profiles/builder.json,
recent session transcripts, project memories, and any blog posts or
process-notes I find. I'll synthesize a draft profile, show it to you,
and confirm before writing to ~/.claude/CLAUDE.md.

This profile is the actual coder's voice — yours, not a synthesis of
admired voices. Admired coders go in an optional Cross layer (run
`/coder-voice cross` after the base lands).
```

### 2. Sweep

Read each source in priority order. Don't blow context on full transcripts — sample 5-10 lines per session, capture distinctive patterns. For session transcripts specifically, run a focused extraction:

```python
# Pseudocode for the extraction step — use Bash with python -c
import json
for fp in recent_session_files[:10]:
    with open(fp, 'r', encoding='utf-8') as f:
        for line in f:
            obj = json.loads(line)
            if obj.get('type') != 'user': continue
            content = obj.get('message', {}).get('content', '')
            # Filter: real user-typed messages, not system noise
            ...
```

Capture:

- **Voice DNA** — universal patterns across all messages (punchline-first? hedging? em-dashes? specific vs generic?)
- **Interaction patterns** — how the user's messages tend to land (multi-point answers, course corrections framed as concerns, "please" baseline, etc.)
- **Register split** — does the corpus show distinct working vs essay registers?
- **Work-type split** — does vocabulary shift between technical and visual work?
- **Reference wells** — TV references, movie quotes, cultural anchors that recur

### 3. Draft and present

Compose a `## CODER VOICE SYNTHESIS` block matching the canonical structure (see Section 8 — Block schema). Show it to the user **as a proposed write**, not an applied one.

Lead with the source citation:

```markdown
> Generated <YYYY-MM-DD> from corpus extraction. Sources: <list every 
> source actually read, by name>. Re-runnable. **This is *the actual 
> coder's* voice (<user-name>), not a synthesis of admired voices** — 
> for "pick a preset coder voice" use `/coder-voice cutter <preset>`.
```

### 4. Confirm and write

Offer three explicit choices:

```
[apply]  Write this block to ~/.claude/CLAUDE.md after the existing
         persona sections (before any closing /About sections)
[edit]   Show me a section to revise before applying
[reject] Don't write — discard the draft
```

**On `[apply]`:** Use `Edit` to insert the block. If the harness blocks self-modification, fall back to printing the block for paste-in.

**On `[edit]`:** Walk the user through revising any section. Re-confirm before write.

**On `[reject]`:** Don't write. Save the draft as a comment-only stash if they want it later (offer; don't insist).

### 5. Offer Cross next

After the base lands, prompt:

```
Base voice live. The Cross layer adds admired coders as voice modifiers
(80/20 base/cross by default — base always dominates). Want to fill that
out now, or sit with the base for a few sessions first?

[now]    Run `/coder-voice cross` immediately
[defer]  Skip; run later when you know what needs lift
```

## Flow — interview mode

When the corpus is genuinely thin (new user, intentionally-private session history, no memories), fall back to a 3-question interview:

1. **What's your voice DNA?** Free-form — what rules do you want the agent to honor when answering you? (Examples: punchline-first, no corporate speak, em-dashes welcome, no emoji in code.)
2. **Working vs essay register — same voice or different?** Do you want the agent to shift sentence shape between in-session work and longer prose?
3. **Reference wells — any?** TV shows, movies, books whose quotes are fair game when personality matters.

Then write the block. Voluntarily simpler than discover-first output — the user can extend later.

## Flow — cross mode

The Cross layer captures admired coders/writers whose qualities the user wants **crossed with** their voice as modifiers, never replacements.

### 1. Detect existing Cross sub-block

Read `~/.claude/CLAUDE.md`, locate `## CODER VOICE SYNTHESIS` → `### Cross — voice modifiers`. Three states:

- **No base block** → refuse politely. Tell the user to run `/coder-voice` (no args) first.
- **Base block, no Cross** → fresh Cross interview (Section 4 below).
- **Base block, has Cross** → show current modifiers, ask field-by-field "keep / change / extend."

### 2. The Cross interview

Walk the cells in order. For each cell, ask **one question**:

```
Working/technical cell — name 1-2 coders/writers whose precision-narrating-
the-hard-part qualities you want crossed with your voice. Examples:
Carmack (precision narrating hard parts), Antirez (compressed problem-
framing), DHH (opinionated terse), Linus (refuses ceremony), 
fasterthanlime (Rust narrative debugging), Cliff Click (deep-systems 
clarity), Julia Evans (zines-style "here's how it works").

Pick from the list, name your own, or say "skip" to leave this cell empty.
```

Then visual cell, then essay cell. Same prompt shape.

For each named modifier, write a one-line **anchor** describing what to draw from. If the user explicitly named the anchor ("draw from Carmack's narration of the hard part"), use their wording verbatim. Otherwise generate a single-line anchor based on what the named voice is known for.

### 3. Synthesis ratio

Ask once:

```
Synthesis ratio — base voice always dominates, cross lifts where the
named quality applies. Default is 80/20 base/cross. Dial up cross when
the work calls for the named quality (debugging → more Carmack); dial
down when the moment is pure-you (Discord chat).

[default]  80/20 base/cross
[custom]   Specify a different ratio
```

### 4. Discipline rules (always written, never editable)

Append the canonical discipline block:

```markdown
**Discipline rules:**

- **Synthesize, don't imitate.** No named voice should be recognizable 
  as pastiche. Take precision, sentence shape, attention pattern — leave 
  signature phrases and named tics behind.
- **The cross lifts the base; it never replaces it.** A reader (you) 
  should feel the modifier as flavor, not authorship.
- **Cell-scoped.** Working/technical can have different modifiers than 
  essay or visual. The right Carmack reference doesn't help when the 
  work is a Figma → Tailwind pass.
```

These are load-bearing — they're what keeps the cross from becoming pastiche. Don't let the user opt out.

### 5. Write or refuse

Same as fresh mode — show the proposed Cross sub-block, confirm, write to `~/.claude/CLAUDE.md` via `Edit`. If self-modification gate blocks, fall back to paste-in.

## Flow — revise mode

When a block already exists and the user runs `/coder-voice` with no args, default to revise mode:

1. Read the existing block.
2. Show current values per section: Voice DNA bullets, Interaction patterns, Axis tables, Cross (if present), Reference wells, Operating instructions.
3. Ask per section: "keep / change / extend / drop."
4. Walk only the sections the user wants to touch.
5. Re-write the changed sections in-place using `Edit`. Preserve unchanged sections byte-for-byte.

## Flow — cutter mode

A **cutter** is a preset voice — a curated, ready-to-drop-in `## CODER VOICE SYNTHESIS` block modeled after a known coder/writer. Cutters REPLACE the personal voice in the block — they're an alternative to "be me," not a supplement.

### 1. Detect preset arg

- **`cutter <preset>`** with valid preset name → load directly (Section 3).
- **`cutter`** with no preset name (or unknown name) → show the menu (Section 2).

### 2. Show the preset menu

```
Available cutter presets:

  [carmack]      Precision narrating the hard part. State the actual
                 mechanism, not a polite gloss. Working/technical heavy.
                 Best for engines, allocators, performance, debugging.

  [dhh]          Opinionated, terse, picks fights with framework orthodoxy.
                 Convention over configuration energy. Best for opinionated
                 technical commentary, framework choices, "no, that's wrong"
                 moments.

  [bret-victor]  Make-the-system-thinkable. Treat code as instrument for
                 understanding, not just artifact. Visual register heavy.
                 Best for tools-for-thought, instrumented debugging,
                 interactive demos.

  [julia-evans]  Zines-style "here's how it works." Accessible without
                 dumbing down. Curious-not-arrogant. Best for explanatory
                 work, debugging walkthroughs, deep dives.

  [back]         Back to the path chooser.

Pick: [carmack | dhh | bret-victor | julia-evans | back]
```

### 3. Load the preset

Read `skills/coder-voice/cutters/<preset>.md`. The file contains:

- **Frontmatter** — `name`, `description`, `preset_class: cutter`, `modeled_after`. Used for menu metadata; strip before writing.
- **Body** — a complete `## CODER VOICE SYNTHESIS` block with all the canonical sections (Voice DNA / Interaction patterns / Axis 1 / Axis 2 / Reference wells / Discipline rules / Operating instructions). Drop-in ready.

If the preset file doesn't exist (typo, deleted), surface the error and re-show the menu.

### 4. Show the proposed block

Print the full body content as a **proposed write**, NOT applied. Let the user see exactly what will land in `~/.claude/CLAUDE.md`.

```
About to write the {preset} cutter to ~/.claude/CLAUDE.md.

This REPLACES any existing CODER VOICE SYNTHESIS block (personal voice,
prior cutter, or empty). Cutters are alternatives to personal voice, not
supplements.

[Show full body content here — quoted block]

[apply]    Write to ~/.claude/CLAUDE.md
[edit]     Show me a section to revise before applying (cutters are
           normally drop-in; edits are rare)
[back]     Back to the preset menu
[reject]   Cancel — don't write
```

### 5. Apply

On `[apply]`:

1. Read `~/.claude/CLAUDE.md`.
2. Detect any existing `## CODER VOICE SYNTHESIS` block (heading + content up to next `## ` or end of file).
3. Replace existing block in-place via `Edit`, OR append after the last `## ` section if none exists.
4. Preserve everything else byte-for-byte.

If the harness blocks self-modification, fall back to printing the block for paste-in (same as personal-mode fallback).

### 6. Confirm and offer Cross next

```
{preset} cutter written. Active on next session start.

Cross layer is still available with /coder-voice cross — you can mix
admired modifiers (default 80/20 base/cross) on top of any base voice,
including this cutter. Want to add a Cross now, or sit with the cutter
first?

[now]    Run /coder-voice cross immediately
[defer]  Skip — run later if you find lift opportunities
```

### Cutter authoring (for future cutters)

To add a new preset, drop a markdown file at `skills/coder-voice/cutters/<name>.md` with:

- Frontmatter: `name`, `description` (one-line for menu), `preset_class: cutter`, `modeled_after` (named voice + source corpus).
- Body: a complete `## CODER VOICE SYNTHESIS` block in the canonical structure (see existing cutters as references).

The SKILL auto-discovers cutters from the directory at runtime — no registration needed in the SKILL itself or in any plugin manifest. Adding a cutter = drop-in file; removing = delete file.

**Discipline applies to authored cutters too:**

- **Synthesize, don't imitate.** Don't fabricate quotes; don't write first-person-as-the-named-voice.
- **Drop-the-cutter clause.** Every cutter must include an "operating instruction" telling the agent to drop the cutter when the work is out of scope (purely visual when cutter is technical-heavy, pure casual chat, etc.) and revert to base Architect.
- **No PII in cutters.** Cutters are public artifacts; never hardcode any user's identifying info.

## Block schema (canonical structure)

Every `## CODER VOICE SYNTHESIS` block written by this SKILL follows this exact section order:

```markdown
## CODER VOICE SYNTHESIS

> Generated <date>. Sources: <list>. Re-runnable. **This is *the actual 
> coder's* voice (<name>), not a synthesis of admired voices** — for 
> "pick a preset coder voice" use `/coder-voice cutter <preset>`.

When working autonomously, your responses synthesize from <name>'s actual 
voice. The voice has two axes; pick the cell that matches what's in 
front of you.

### Voice DNA (universal across all four cells)
- ...

### Interaction patterns (extracted from session transcripts)
- ...

### Axis 1 — Register (working vs essay)
[table]

### Axis 2 — Work type (technical vs visual)
[table]

### Cross — voice modifiers
[discipline rules + per-cell modifier table + synthesis ratio]

### Reference wells
[wells + anchored examples + when-to / when-not-to]

### Operating instructions
[1-5 numbered list]
```

Sections that don't apply (e.g., empty Cross when only base ran) are written as headings with a one-line "deferred — run `/coder-voice cross` to populate" placeholder. Never silently omit sections.

## Edge cases

- **No `~/.claude/CLAUDE.md` at all.** Refuse politely. Tell the user to run `/keystone` (the global keystone bootstrap) first, or create a minimal `~/.claude/CLAUDE.md` themselves with at least a persona section.
- **Existing block was hand-edited by the user since last `/coder-voice` run.** Detect via section structure mismatch. Don't clobber — show diff, ask "merge / replace / leave alone."
- **Self-modification gate blocks the write.** Print the proposed block content for the user to paste in manually. Suggest invoking via `/update-config` if appropriate. Never bypass the gate.
- **Session transcripts contain another user's data** (shared workstation, multiple Claude Code accounts). Filter by checking the local username matches before sampling. If unclear, ask.
- **Cross mode requested but no base voice exists.** Refuse politely. Direct user to run `/coder-voice` (no args) first to lay down the base.
- **User-corpus is in another language** (transcripts in Spanish, French, etc.). Honor the corpus language when extracting interaction patterns. Voice rules transcend language; the agent's response register should match the user's corpus language by default.

## Logging

This SKILL doesn't append a session log entry — it's a meta/setup SKILL, not part of the build chain. Skip the `session-logger` start/end protocol that build-chain SKILLs use.

If the user explicitly asks to log the run, append a one-line decision via `mcp__626Labs__manage_decisions` with `category: architecture` (since voice profile changes are architectural for how the agent operates). Otherwise no logging.

## What NOT to do

- **Never auto-write to `~/.claude/CLAUDE.md` without explicit yes.** Self-modification needs per-run confirmation.
- **Never skip the session-transcript source.** It's the richest voice signal available; treating it as optional is the failure mode that birthed this SKILL (see /coder-voice's own friction history).
- **Never claim the voice is "the user's" if the corpus didn't support it.** When discover-first finds thin signal and you fall back to interview, name that explicitly in the source citation: "Sources: interview only, no corpus extraction (corpus was thin)."
- **Never let the Cross layer replace the base voice.** Synthesis ratio defaults to 80/20 base/cross; refuse to write a Cross-heavy ratio (e.g., 50/50 or worse) unless the user explicitly justifies it AND understands the discipline rule about pastiche.
- **Never propose modifiers in cells the user hasn't filled.** If the user says "I don't want a visual modifier," write that cell as `<empty — defer to base voice>` and don't sneak in a default.
- **Never hardcode the user's name, location, or identifying details into the block.** Voice rules are voice rules; PII stays in `~/.claude/profiles/builder.json` and project-local memories.
- **Never share another user's voice profile across the SKILL boundary.** This SKILL writes to ONE user's `~/.claude/CLAUDE.md`. It never reads or writes another user's profile.
- **Never bypass the harness's self-modification gate.** If blocked, surface and offer the paste-in fallback.

## Conversation style

- **Be explicit about source.** When showing the draft, name every file you read. Builder should be able to verify your read.
- **Be willing to be wrong about extracted patterns.** If the builder rejects an interaction-pattern read, treat the rejection as the truth and update the draft.
- **Keep proposals tight.** Show the proposed block once, ask for swaps, apply. Don't iterate ten times unless the builder asks.
- **Honor the discipline rules.** This SKILL exists to keep voice from drifting. Cutting corners on the discipline rules (synthesize-don't-imitate, base-dominates, cell-scoped) defeats the purpose.

## Handoff

No handoff to another command. `/coder-voice` is a standalone setup SKILL. After the block lands, the agent reads it on every future session start (since `~/.claude/CLAUDE.md` is loaded globally).

"Voice profile written. Next session you start, the agent reads this and adapts. Re-run `/coder-voice` anytime to refresh, or `/coder-voice cross` to add the modifier layer."
