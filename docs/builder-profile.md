# Builder Profile

## Who They Are

Estevan — builder and outsider, runs 626Labs out of Fort Worth. Ships prolifically across theatre ops tools, hackathon apps, Roblox games, Claude Code plugins, Discord bots, and creative writing.

This particular project is a **meta dogfood**: using Vibe Cartographer to plan Vibe Cartographer's own next chapter. Working out of the plugin's own repo (`app-readinessplugin/`) on a returning-builder onboarding pass — most identity/preference fields auto-loaded from `~/.claude/profiles/builder.json`.

## Technical Experience

**Level:** Experienced.

**Languages:** TypeScript, Python, JavaScript, Luau, C#, HTML/CSS.

**Frameworks:** React 19, Next.js, Vite, TailwindCSS, Firebase, FastAPI, Flask, Express, .NET 8/9, Azure, Expo, React Native, Drizzle ORM, Playwright.

**AI agent experience:** Deep. Built and shipped Claude Code plugins (Vibe Cartographer, Vibe Doc) to the marketplace. Runs Claude Code as autonomous build system with structured checklists and subagent delegation. 1,137 messages across 59 sessions. Also uses Gemini and Replit Agent.

**For this project specifically:** Plugin author writing SKILL markdown files and supporting data schemas. No new frameworks needed — just consistent SKILL conventions matching the existing Vibe Cartographer files.

## Mode

**Builder.** Brisk pacing, less explaining, more doing. Confirmed from unified profile and reaffirmed during onboard.

## Project Goals

**Ship Patterns #4, #6, and #8 from the Self-Evolving Plugin Framework to bring Vibe Cartographer to L3.5.**

The three patterns:

- **Pattern #4 — Memory Decay & Refresh.** Profile fields gain `last_confirmed` timestamps and decay TTLs. Stale fields trigger low-friction confirmation prompts at natural moments. No deletion, just `stale: true` markers.
- **Pattern #6 — Friction Log.** Separate from session log. Captures `{timestamp, plugin_version, friction_type, symptom, agent_guess_at_cause}` entries when the plugin detects clear friction (user cancels mid-flow, overrides defaults, asks clarifying questions the SKILL should have preempted). Implicit feedback, conservative thresholds.
- **Pattern #8 — Plugin Self-Test.** New `/doctor` command (or sub-command). Walks a checklist: do referenced files exist? Do commands resolve? Do data files parse against schema? Surfaces failures as a short report, not silent failure.

**Each pattern integrates with Pattern #13 (Ecosystem-Aware Composition) — confirmed during onboarding:**

- Pattern #6 records complement rejections (`{friction_type: "complement_rejected", complement: "<name>"}`) so `/evolve` can see which complements actually land vs misfire.
- Pattern #8 verifies the anchored complement table in the guide SKILL still references real Anthropic skills — catches silent rot when complements get renamed or removed.
- Pattern #4 records "last seen complements" with TTL on the unified profile, so material environment changes are detectable.

**Out of scope for this project (deferred):**

- Pattern #14 (Background Monitor Lifecycle) — requires Anthropic's manifest `monitors:[]` primitive, worth doing in a focused future cycle.
- Pattern #15 (Cross-Plugin Task Handoff) — Cowork mailbox docs not stable yet.
- Pattern #16 (Session-Scoped Feature Flags) — nice-to-have for L3.1, can ship later.
- Vibe Doc / Vibe Sec / Vibe Test work — separate scopes, separate `/scope` runs.

## Design Direction

**SKILL-design consistency.** Same five-field format for any new commands, same persona/mode adaptation tables, same one-question-at-a-time interaction rule, same brevity standards as existing Vibe Cartographer SKILLs. No visual design surface for most of this work.

**One specific wrinkle: the `/doctor` command output should mimic Vibe Doc's CLI banner aesthetic** — boxed sections, color-coded status indicators (✓ / ⚠ / ✗), tables for findings, light banner header. In a slash-command context that means the agent's markdown output should evoke the chalk/ora/cli-table3 visual style we shipped in Vibe Doc 0.4.0, not produce a literal terminal-styled binary.

## Prior SDD Experience

Built the entire Self-Evolving Plugin Framework, shipped Vibe Cartographer to L3, and used `/scope` → `/build` cycles on multiple shipped projects (Sanduhr für Claude, vibe-doc, competitive-intelligence). This isn't first-time SDD — it's the author of the SDD plugin running it on the plugin itself.

Skip explanations of what scope/PRD/spec/checklist mean. Skip "this is how the process works" framing. Go straight to substance.

## Architecture Docs

**Architecture reference:** `docs/self-evolving-plugins-framework.md` — specifically the sections describing Patterns #4, #6, #8, and #13. Those pattern definitions are the contract `/spec` will translate into specific SKILL files, data files, and command definitions.

**Default `architecture/default-patterns.md` does NOT apply** — this is plugin/SKILL work, not application stack work. No React, no Firebase, no Drizzle. Just markdown SKILL files, JSON/JSONL data files, and Bash/Node logic where it touches the local filesystem.

**Existing files relevant to the work:**

- `plugins/vibe-cartographer/skills/session-logger/SKILL.md` — friction log will be a sibling to this
- `plugins/vibe-cartographer/skills/guide/SKILL.md` — guide section for `/doctor` will live here, ecosystem composition table is here
- `plugins/vibe-cartographer/skills/evolve/SKILL.md` — `/evolve` is the consumer of friction-log data, integration matters
- `plugins/vibe-cartographer/skills/onboard/SKILL.md` — Pattern #4 memory decay touches the profile-write logic here
