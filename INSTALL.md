# Installation Guide

## Prerequisites

- **Claude Code** — any form of it: CLI, Desktop app, VS Code extension, or JetBrains plugin. This plugin defines slash commands that Claude Code executes. Without Claude Code, there's nothing to run.
- **Node.js 18 or later** — only required if you plan to install via npm. Installing from a local clone doesn't need Node at all.
- **A fresh, empty project folder** — the plugin creates artifacts in `docs/` of your working directory. Running `/onboard` in a directory that already has code and docs mixed together will get messy fast. Make a new folder for your project before you start.

## Install paths

You only need one of these. Pick whichever matches how you're already running Claude Code.

### Option 1: npm (recommended)

```bash
npm install -g @esthernandez/app-project-readiness
```

This drops the plugin files on your disk at your npm global root — typically `~/.npm-global/lib/node_modules/@esthernandez/app-project-readiness/` on macOS/Linux or `%APPDATA%\npm\node_modules\@esthernandez\app-project-readiness\` on Windows. You then need to tell Claude Code about them — see [Connecting to Claude Code](#connecting-to-claude-code) below.

### Option 2: Claude Desktop — Personal plugin

If you're on the Claude Desktop app and don't want an npm install:

1. Open **Personal plugins** in Claude Desktop (the panel in the left sidebar).
2. Click the **+** button → **Create plugin**.
3. Point it at a local clone of this repo (see Option 3 for the clone step).
4. The plugin's slash commands become available immediately — no restart required.

### Option 3: Clone and reference locally

```bash
git clone https://github.com/estevanhernandez-stack-ed/app-readinessplugin ~/app-readinessplugin
```

Then point Claude Code at `~/app-readinessplugin/plugins/app-project-readiness/` as the plugin root. This is the same as Option 2 minus the Claude Desktop UI step — useful if you're on the Claude Code CLI directly.

## Connecting to Claude Code

After installing, Claude Code needs to know where the plugin lives. The exact steps depend on your client:

- **Claude Desktop** — use the **Personal plugins** panel (**+** button → **Create plugin** → point at the folder). Same flow for Option 1 (point at the npm install path) and Option 3 (point at your local clone).
- **Claude Code CLI** — if your version has a plugin-add command, point it at the install path. Otherwise clone the repo and rely on Claude Code's plugin discovery for folders in its known marketplace list.
- **VS Code / JetBrains** — Claude Code in your IDE reads from the same global plugin config as Claude Desktop. Install via Option 2 on Claude Desktop first and the IDE will pick it up on next launch.

**Pointing at the right folder matters.** The plugin root is the folder that contains `.claude-plugin/plugin.json` — in this repo that's `plugins/app-project-readiness/`, not the repo root. Pointing at the repo root will not work.

## Verification

Open Claude Code in a **fresh, empty folder** for a project you want to build, then run:

```text
/onboard
```

You should see the 626Labs App Platform Readiness welcome banner and the first onboarding question. If you instead see `Unknown skill: onboard`, the plugin isn't wired in yet — double-check your Claude Code plugin list and confirm the path points at the folder containing `.claude-plugin/plugin.json`.

You can also check the installed version from a shell:

```bash
npm list -g @esthernandez/app-project-readiness
```

## Configuration

No required configuration. On first `/onboard`, the plugin creates a **unified builder profile** at `~/.claude/profiles/builder.json` that captures your identity, experience level, and preferences (tone, pacing, persona). This profile is shared across all 626Labs plugins — install another 626Labs plugin later and it reads the same file, so you don't re-onboard.

You can inspect the profile any time:

```bash
cat ~/.claude/profiles/builder.json
```

It's plain JSON, lives in your home directory, and never leaves your machine.

## Troubleshooting

**`Unknown skill: onboard` when running `/onboard`.**
Claude Code isn't loading the plugin. Confirm the plugin folder is registered in your client's plugin list, and that you're pointing at the folder that contains `.claude-plugin/plugin.json` (the plugin root — `plugins/app-project-readiness/` in this repo), not the repo root or a parent directory.

**The welcome banner renders as a scrambled wall of characters.**
You're on an ancient install (0.2.x or earlier) that still ships the fragile asterisk-and-dash ASCII art. Upgrade to 0.3.0 or later:

```bash
npm install -g @esthernandez/app-project-readiness@latest
```

**`/reflect` feels like a classroom quiz instead of a peer retro.**
Your Claude Code is loading a 0.4.x or earlier copy of the plugin. Upgrade to 0.5.0+.

**My builder profile lives at the old `~/.claude/plugins/data/app-project-readiness/user-profile.md` path.**
That's the legacy location from 0.4.x and earlier. Run `/onboard` once on 0.5.0+ and the plugin will migrate it to `~/.claude/profiles/builder.json` automatically, leaving the old file as `.bak` so you can verify the migration.

**I picked the wrong persona or mode and want to switch.**
Tell the agent directly mid-session: "switch to Superdev persona" or "switch to Builder mode". The override sticks for the rest of the session. To change it permanently for future runs, edit `~/.claude/profiles/builder.json` directly (it's plain JSON — `shared.preferences.persona` and `plugins.app-project-readiness.mode`).

## Uninstalling

```bash
npm uninstall -g @esthernandez/app-project-readiness
```

If you want to wipe the builder profile and session logs too:

```bash
# macOS/Linux
rm -f ~/.claude/profiles/builder.json
rm -rf ~/.claude/plugins/data/app-project-readiness/

# Windows (PowerShell)
Remove-Item -Path "$HOME\.claude\profiles\builder.json" -Force
Remove-Item -Path "$HOME\.claude\plugins\data\app-project-readiness" -Recurse -Force
```

Both are safe to delete — the plugin recreates them on next use, and nothing else on your system depends on them.
