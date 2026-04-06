# Marcus Corporation App Project Readiness Tool

A spec-driven development plugin for [Claude Code](https://claude.ai/code). Takes you from idea spark to working app through eight structured commands — with documentation and security verification baked into the process.

## What It Does

The plugin delivers a guided spec-driven development workflow as eight slash commands. Each command produces artifacts (scope doc, PRD, technical spec, build checklist, reflection) that downstream commands consume. The agent acts as a sharp, encouraging coach — interviewing you through each phase rather than waiting for prompts.

**Command chain:** `/onboard` → `/scope` → `/prd` → `/spec` → `/checklist` → `/build` → `/iterate` → `/reflect`

| Command | What It Does |
|---------|-------------|
| `/onboard` | Welcome, builder profiling, and architecture docs setup |
| `/scope` | Brainstorm and refine your idea into a focused project scope |
| `/prd` | Turn scope into detailed product requirements |
| `/spec` | Translate PRD into a technical blueprint using your architecture |
| `/checklist` | Break the spec into a sequenced, dependency-aware build plan |
| `/build` | Build the app — autonomous or step-by-step mode |
| `/iterate` | Optional polish pass after the core build |
| `/reflect` | Quiz, qualitative feedback, and reflection |

The final checklist step is always **Documentation & Security Verification** — README, docs cleanup, secrets scan, dependency audit, and deployment security posture.

## Architecture Docs

The plugin supports custom architecture docs so technical decisions are guided by your preferred stack, patterns, and conventions. During `/onboard`, the builder points to their architecture docs (or skips to use sensible defaults).

See [`plugins/app-project-readiness/architecture/`](plugins/app-project-readiness/architecture/) for the included defaults and an example.

## Install

Requires [Claude Code](https://claude.ai/code).

**1. Store this repo somewhere on your system** (or use a git URL):

```
# Clone it, download it, or just know where the folder is
git clone <repo-url> ~/marcus-app-readiness
```

**2. Create a fresh, empty folder for your project** — this is where you'll build:

```
mkdir ~/my-new-app
cd ~/my-new-app
```

**3. Open Claude Code in that project folder** and install the plugin:

```
claude

# Inside Claude Code:
/install-plugin ~/marcus-app-readiness/plugins/app-project-readiness
```

Or from a git URL:
```
/install-plugin https://github.com/<org>/<repo>/plugins/app-project-readiness
```

**4. Start the workflow:**

```
/onboard
```

The plugin lives separately from your project — you install it once and the slash commands (`/onboard`, `/scope`, `/prd`, etc.) become available. All project artifacts get created in your project folder under `docs/`.

## Project Structure

```
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

## License

MIT
