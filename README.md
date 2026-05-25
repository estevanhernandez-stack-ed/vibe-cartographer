<p align="center">
  <img alt="Vibe Cartographer — plot your course from idea to shipped app" src="https://626labs.dev/assets/brand/plugins/vibe-cartographer-banner-1500x500.png" />
</p>

# Vibe Cartographer

**Plot your course from idea to shipped app — vibe coding with purpose and direction.**

[![stable](https://img.shields.io/github/v/tag/estevanhernandez-stack-ed/vibe-cartographer?label=stable&color=17d4fa)](https://github.com/estevanhernandez-stack-ed/vibe-cartographer/tags)

## What it does

Vibe Cartographer takes you from idea spark to shipped app through a structured chain of slash commands, with documentation and security verification baked into the process. Each command produces an artifact — scope doc, PRD, technical spec, build checklist, reflection — that the next command consumes. The agent acts as a sharp, encouraging collaborator: it interviews you through each phase instead of waiting for prompts, and adapts its voice to the persona you pick.

> **Based on the Learning Hackathon spec-driven dev plugin.** Vibe Cartographer extends and productionizes the spec-driven development approach introduced in the Learning Hackathon — rebuilt from the ground up as a builder-focused tool with persistent memory, cross-plugin profiles, selectable personas, and a reflective retro in place of the original classroom quiz. Credit to the Hackathon authors for the foundational workflow pattern.

## How it works

**The eight-command chain** runs idea → ship in order. Each step reads the prior artifacts and writes its own:

`/onboard` → `/scope` → `/prd` → `/spec` → `/checklist` → `/build` → `/iterate` → `/reflect`

| Command      | What it does                                                          |
| ------------ | -------------------------------------------------------------------- |
| `/onboard`   | Welcome, builder profiling, persona selection, architecture docs     |
| `/scope`     | Brainstorm and refine your idea into a focused project scope          |
| `/prd`       | Turn scope into detailed product requirements                        |
| `/spec`      | Translate the PRD into a technical blueprint using your architecture  |
| `/checklist` | Break the spec into a sequenced, dependency-aware build plan          |
| `/build`     | Build the app — autonomous or step-by-step mode                      |
| `/iterate`   | Optional polish pass after the core build                             |
| `/reflect`   | Retro, peer-style feedback, and qualitative review                   |

The final checklist step is always **Documentation & Security Verification** — README, docs cleanup, secrets scan, dependency audit, and deployment security posture.

**The self-evolution commands** sit on top of the chain. They're how the plugin reads its own runs and keeps itself honest:

| Command        | What it does                                                                   |
| -------------- | ----------------------------------------------------------------------------- |
| `/evolve-cart` | **L3** — the plugin reads its own session logs and proposes self-improvements  |
| `/vitals`      | **L3.5** — self-diagnostic health check across profile, logs, and complements  |
| `/friction`    | **L3.5** — capture real-time friction signal with calibration for future evolve |
| `/tend`        | Read-only drift sweep on the app you built — entropy and spec deviation, writes nothing |

Nothing auto-applies. Every proposed change from `/evolve-cart` is one-at-a-time, with your consent.

### Personas

Pick a voice during `/onboard` that shapes how the agent talks to you through the whole process. Personas coexist with the Learner / Builder pacing mode — persona controls **voice**, mode controls **pacing**.

- **Professor** — *"Let me explain the why."* Patient, explanatory, frequent checkpoints.
- **Cohort** — *"Let's think through this together."* Peer, collaborative, brainstormy.
- **Superdev** — *"You know what you're doing. Let's move."* Terse, direct, minimal handholding.
- **Architect** — *"Let's design for the long game."* Strategic, tradeoff-focused.
- **Coach** — *"Keep moving. Ship it."* Momentum-focused, anti-paralysis.
- **System default** — No override. Base Claude Code behavior calibrated only by your experience level and mode.

The persona lives in `~/.claude/profiles/builder.json` under `shared.preferences.persona` and is respected cross-plugin — other Vibe plugins (like Vibe Doc) pick up the same voice, so you only onboard once.

### Architecture docs

Vibe Cartographer guides technical decisions by your preferred stack, patterns, and conventions. During `/onboard`, you point it at your architecture docs — or skip to use sensible defaults. See [`plugins/vibe-cartographer/architecture/`](plugins/vibe-cartographer/architecture/) for the included defaults and an example (React + Supabase).

The unified profile and self-evolution loop are part of the [Self-Evolving Plugin Framework](docs/self-evolving-plugins-framework.md) — see that doc for the thesis, the 12-pattern catalog, and the maturity ladder the plugin is working through.

## Validated on

Dogfooded across build cycles — Vibe Cartographer builds the other Vibe plugins. The eight-command chain is proven by the work it ships, run after run, on real apps.

## Install

**Stable (recommended) — as a Claude Code plugin via the marketplace:**

```text
/plugin marketplace add estevanhernandez-stack-ed/vibe-plugins
/plugin install vibe-cartographer@vibe-plugins
```

**Canary — track this repo's `main`:**

```text
/plugin install vibe-cartographer@estevanhernandez-stack-ed/vibe-cartographer
```

Then navigate to a **fresh, empty folder** for your project and run `/onboard`. All project artifacts get created in your project folder under `docs/`.

## Part of the Vibe ecosystem

One of 11 plugins in the **[Vibe Plugins](https://github.com/estevanhernandez-stack-ed/vibe-plugins)** marketplace from [626 Labs](https://626labs.dev) — foundations (Thesis Engine, Keystone) and process pillars (Cartographer, Doc, Sec, Test, Thesis, Iterate, Taker, Walk, Insights) for AI-assisted creation.

```text
/plugin marketplace add estevanhernandez-stack-ed/vibe-plugins
```

## License

MIT — *Imagine Something Else.*
