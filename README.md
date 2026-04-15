# 626Labs App Project Readiness Tool

A spec-driven development plugin for [Claude Code](https://claude.ai/code). Takes you from idea spark to working app through eight structured commands — with documentation and security verification baked into the process.

> **Based on the [Learning Hackathon spec-driven dev plugin](https://claude.ai/code).** This plugin extends and productionizes the spec-driven development approach introduced in the Learning Hackathon, rebuilt from the ground up as a builder-focused tool with persistent memory, cross-plugin profiles, and a reflective retro in place of the original classroom quiz. Credit to the Hackathon authors for the foundational workflow pattern.

## What It Does

The plugin delivers a guided spec-driven development workflow as eight slash commands. Each command produces artifacts (scope doc, PRD, technical spec, build checklist, reflection) that downstream commands consume. The agent acts as a sharp, encouraging coach — interviewing you through each phase rather than waiting for prompts.

**Command chain:** `/onboard` → `/scope` → `/prd` → `/spec` → `/checklist` → `/build` → `/iterate` → `/reflect`

| Command      | What It Does                                                     |
| ------------ | ---------------------------------------------------------------- |
| `/onboard`   | Welcome, builder profiling, and architecture docs setup          |
| `/scope`     | Brainstorm and refine your idea into a focused project scope     |
| `/prd`       | Turn scope into detailed product requirements                    |
| `/spec`      | Translate PRD into a technical blueprint using your architecture |
| `/checklist` | Break the spec into a sequenced, dependency-aware build plan     |
| `/build`     | Build the app — autonomous or step-by-step mode                  |
| `/iterate`   | Optional polish pass after the core build                        |
| `/reflect`   | Retro, peer-style feedback, and qualitative review               |

The final checklist step is always **Documentation & Security Verification** — README, docs cleanup, secrets scan, dependency audit, and deployment security posture.

## Architecture Docs

The plugin supports custom architecture docs so technical decisions are guided by your preferred stack, patterns, and conventions. During `/onboard`, the builder points to their architecture docs (or skips to use sensible defaults).

See [`plugins/app-project-readiness/architecture/`](plugins/app-project-readiness/architecture/) for the included defaults and an example.

## Install

Requires [Claude Code](https://claude.ai/code) or Claude Desktop with plugin support.

### Option 1: npm (recommended)

```bash
npm install -g @esthernandez/app-project-readiness
```

Then in Claude Code / Claude Desktop, add the plugin directory to your marketplace and install from there.

### Option 2: Claude Desktop personal plugin

1. Open Claude Desktop's **Personal plugins** panel.
2. Click **+ Create a plugin**.
3. Point it to the `plugins/app-project-readiness` folder from this repo (cloned or downloaded).
4. The slash commands (`/onboard`, `/scope`, `/prd`, etc.) become available.

### Option 3: Clone and reference locally

```bash
git clone https://github.com/estevanhernandez-stack-ed/app-readinessplugin ~/app-readinessplugin
```

Then point your Claude Code / Claude Desktop at `~/app-readinessplugin/plugins/app-project-readiness`.

### Start the workflow

Navigate to a **fresh, empty folder** for your project and run:

```text
/onboard
```

The plugin lives separately from your project — install once and the slash commands become available. All project artifacts get created in your project folder under `docs/`.

## Project Structure

```text
plugins/app-project-readiness/
├── .claude-plugin/plugin.json    # Plugin metadata
├── CLAUDE.md                     # Root agent behavior config
├── architecture/                 # Architecture docs (customizable)
│   ├── README.md
│   ├── default-patterns.md       # Fallback stack patterns
│   └── example-architecture.md   # Example: React + Supabase
└── skills/                       # One folder per slash command
    ├── onboard/SKILL.md
    ├── scope/SKILL.md
    ├── prd/SKILL.md
    ├── spec/SKILL.md
    ├── checklist/SKILL.md
    ├── build/SKILL.md
    ├── iterate/SKILL.md
    ├── reflect/SKILL.md
    └── guide/                    # Shared references and templates
        ├── SKILL.md              # Core agent behavior (loaded by all commands)
        ├── references/           # eval-rubric, prd-guide, spec-patterns
        └── templates/            # Output templates for each artifact
```

## Works Independently or Together

This plugin is part of the **626Labs plugin ecosystem**. It runs standalone or alongside other 626Labs plugins like [`@esthernandez/vibe-doc`](https://www.npmjs.com/package/@esthernandez/vibe-doc) — when both are installed, they share a **unified builder profile** at `~/.claude/profiles/builder.json` so you only onboard once across all 626Labs plugins.

The unified profile is part of the [Self-Evolving Plugin Framework](docs/self-evolving-plugins-framework.md) — see that doc for the thesis, 12-pattern catalog, and the maturity ladder this plugin is working through. App-readiness is currently at **Level 2** (session memory + passive feedback capture).

## Documentation

- [INSTALL.md](INSTALL.md) — detailed install, verification, configuration, troubleshooting, and uninstall steps
- [CHANGELOG.md](CHANGELOG.md) — release history and contributing guide
- [docs/self-evolving-plugins-framework.md](docs/self-evolving-plugins-framework.md) — thesis and pattern catalog driving the plugin's architecture

## Credits

- **Based on the Learning Hackathon spec-driven development plugin.** The 8-command workflow (onboard → scope → PRD → spec → checklist → build → iterate → reflect) is adapted from the hackathon's original spec-driven dev pattern. This plugin productionizes that workflow with builder-focused language, persistent memory, and a reflective retro.
- Built by [626Labs LLC](https://626labs.dev) — Fort Worth, TX.

## License

MIT
