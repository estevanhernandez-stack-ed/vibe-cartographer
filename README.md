# Vibe Cartographer

**Plot your course from idea to shipped app.**

```text
   ◯───◯───◯
   │ ╲ │ ╱ │
   ◯───◯───◯       V I B E   C A R T O G R A P H E R
   │ ╱ │ ╲ │        plot your course
   ◯───◯───◯
```

A spec-driven development plugin for [Claude Code](https://claude.ai/code) and Claude Desktop. Vibe coding with purpose and direction — takes you from idea spark to shipped app through eight structured commands, with documentation and security verification baked into the process.

> **Based on the Learning Hackathon spec-driven dev plugin.** Vibe Cartographer extends and productionizes the spec-driven development approach introduced in the Learning Hackathon, rebuilt from the ground up as a builder-focused tool with persistent memory, cross-plugin profiles, selectable personas, and a reflective retro in place of the original classroom quiz. Credit to the Hackathon authors for the foundational workflow pattern.

## What It Does

Vibe Cartographer delivers a guided spec-driven development workflow as eight slash commands. Each command produces artifacts (scope doc, PRD, technical spec, build checklist, reflection) that downstream commands consume. The agent acts as a sharp, encouraging collaborator — interviewing you through each phase rather than waiting for prompts, adapting its voice to the persona you pick.

**Command chain:** `/onboard` → `/scope` → `/prd` → `/spec` → `/checklist` → `/build` → `/iterate` → `/reflect`

| Command      | What It Does                                                             |
| ------------ | ------------------------------------------------------------------------ |
| `/onboard`   | Welcome, builder profiling, persona selection, architecture docs         |
| `/scope`     | Brainstorm and refine your idea into a focused project scope             |
| `/prd`       | Turn scope into detailed product requirements                            |
| `/spec`      | Translate PRD into a technical blueprint using your architecture         |
| `/checklist` | Break the spec into a sequenced, dependency-aware build plan             |
| `/build`     | Build the app — autonomous or step-by-step mode                          |
| `/iterate`   | Optional polish pass after the core build                                |
| `/reflect`   | Retro, peer-style feedback, and qualitative review                       |
| `/evolve`    | **L3:** Plugin reads its own session logs and proposes self-improvements |

The final checklist step is always **Documentation & Security Verification** — README, docs cleanup, secrets scan, dependency audit, and deployment security posture.

## Personas

Pick a voice during `/onboard` that shapes how the agent talks to you through the whole process. Personas coexist with the Learner / Builder pacing mode — persona controls **voice**, mode controls **pacing**.

- **Professor** — *"Let me explain the why."* Patient, explanatory, frequent checkpoints.
- **Cohort** — *"Let's think through this together."* Peer, collaborative, brainstormy.
- **Superdev** — *"You know what you're doing. Let's move."* Terse, direct, minimal handholding.
- **Architect** — *"Let's design for the long game."* Strategic, tradeoff-focused.
- **Coach** — *"Keep moving. Ship it."* Momentum-focused, anti-paralysis.
- **System default** — No override. Base Claude Code behavior calibrated only by your experience level and mode.

The persona lives in `~/.claude/profiles/builder.json` under `shared.preferences.persona` and is respected cross-plugin — other 626Labs plugins (like [Vibe Doc](https://www.npmjs.com/package/@esthernandez/vibe-doc)) pick up the same voice.

## Architecture Docs

Vibe Cartographer supports custom architecture docs so technical decisions are guided by your preferred stack, patterns, and conventions. During `/onboard`, the builder points to their architecture docs (or skips to use sensible defaults).

See [`plugins/vibe-cartographer/architecture/`](plugins/vibe-cartographer/architecture/) for the included defaults and an example.

## Install

Requires [Claude Code](https://claude.ai/code) CLI or Claude Desktop with plugin support. Pick whichever path matches how you're running Claude Code — all three lead to the same plugin working inside a fresh project folder.

### Option 1: Claude Desktop — Add marketplace (recommended)

The cleanest install. Pulls straight from GitHub, no file download, supports `Sync` to update.

1. Open Claude Desktop → **Personal plugins** panel
2. Click the **+** button → **Add marketplace**
3. Enter: `estevanhernandez-stack-ed/vibe-cartographer`
4. Click **Sync**

Claude Desktop reads `.claude-plugin/marketplace.json` at the repo root, loads the `vibe-cartographer` plugin from inside `./plugins/vibe-cartographer`, and the slash commands (`/onboard`, `/scope`, `/prd`, etc.) become available.

### Option 2: Claude Code CLI — Plugin manager

Use the built-in plugin manager from any Claude Code CLI or IDE terminal session.

```text
/plugin marketplace add estevanhernandez-stack-ed/app-readinessplugin
/plugin install vibe-cartographer@app-readinessplugin
/reload-plugins
```

After reload, type `/` and you'll see the Vibe Cartographer commands in autocomplete.

### Option 3: Claude Code CLI — npm

```bash
npm install -g @esthernandez/vibe-cartographer
```

The package ships the plugin files at `<npm-global>/node_modules/@esthernandez/vibe-cartographer/plugins/vibe-cartographer/`. If your Claude Code CLI has a plugin-add command, point it at that path; otherwise use Option 1 or 2 and the marketplace manifest will do the discovery for you.

### Option 4: Claude Desktop — Upload plugin

For local iteration before you push changes to GitHub.

1. Clone the repo: `git clone https://github.com/estevanhernandez-stack-ed/vibe-cartographer`
2. Build a `.plugin` bundle:

   ```bash
   python scripts/build-plugin.py
   ```

   This writes `bundles/vibe-cartographer-<version>.plugin` — a zip archive Cowork accepts directly.
3. In Claude Desktop → **Personal plugins** → **+** → **Upload plugin**, pick the `.plugin` file.

Also available as a one-click download from the [GitHub releases page](https://github.com/estevanhernandez-stack-ed/vibe-cartographer/releases) — each release ships a pre-built `.plugin` file as a release asset.

### Migrating from `@esthernandez/app-project-readiness`

Vibe Cartographer is the rename of what was previously `@esthernandez/app-project-readiness` (v0.5.0 and earlier). Migration is automatic on first `/onboard` run:

- Your unified builder profile at `~/.claude/profiles/builder.json` gets its `plugins.app-project-readiness` block copied to `plugins.vibe-cartographer` (old key preserved for one release as a safety net).
- Deep-legacy markdown profiles at `~/.claude/plugins/data/app-project-readiness/user-profile.md` also migrate.
- The old `@esthernandez/app-project-readiness` npm package is deprecated with a pointer. Run `npm install -g @esthernandez/vibe-cartographer` and uninstall the old one when you're ready.
- Legacy session logs at `~/.claude/plugins/data/app-project-readiness/sessions/` are left in place — append-only history isn't touched.

### Start the workflow

Navigate to a **fresh, empty folder** for your project and run:

```text
/onboard
```

All project artifacts get created in your project folder under `docs/`.

## Project Structure

```text
plugins/vibe-cartographer/
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
    ├── session-logger/SKILL.md   # Append-only session memory (L2)
    └── guide/                    # Shared references and templates
        ├── SKILL.md              # Core agent behavior (loaded by all commands)
        ├── references/           # eval-rubric, prd-guide, spec-patterns
        └── templates/            # Output templates for each artifact
```

## Works Independently or Together

Vibe Cartographer is part of the **626Labs plugin ecosystem**. It runs standalone or alongside other 626Labs plugins like [`@esthernandez/vibe-doc`](https://www.npmjs.com/package/@esthernandez/vibe-doc) — when both are installed, they share a **unified builder profile** at `~/.claude/profiles/builder.json` so you only onboard once across all 626Labs plugins. Persona, tone, experience, and preferences carry across.

The unified profile is part of the [Self-Evolving Plugin Framework](docs/self-evolving-plugins-framework.md) — see that doc for the thesis, 12-pattern catalog, and the maturity ladder the plugin is working through. Vibe Cartographer is now at **Level 3** (reflective evolution via `/evolve`): the plugin reads its own session logs, surfaces patterns across your runs, and proposes concrete SKILL edits for you to approve. Nothing auto-applies — every change is one-at-a-time, with consent.

## Documentation

- [INSTALL.md](INSTALL.md) — detailed install, verification, configuration, troubleshooting, and uninstall steps
- [CHANGELOG.md](CHANGELOG.md) — release history and contributing guide
- [docs/self-evolving-plugins-framework.md](docs/self-evolving-plugins-framework.md) — thesis and pattern catalog driving the plugin's architecture

## Credits

- **Based on the Learning Hackathon spec-driven development plugin.** The 8-command workflow (onboard → scope → PRD → spec → checklist → build → iterate → reflect) is adapted from the Hackathon's original spec-driven dev pattern. Vibe Cartographer productionizes that workflow with builder-focused language, persistent cross-plugin memory, selectable personas, and a reflective retro in place of the original quiz.
- Built by [626Labs LLC](https://626labs.dev) — Fort Worth, TX.

## License

MIT
