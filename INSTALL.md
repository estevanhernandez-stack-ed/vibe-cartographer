# Installation Guide — Vibe Cartographer

## Prerequisites

- **Claude Code** — any form of it: CLI, Desktop app, VS Code extension, or JetBrains plugin. Vibe Cartographer defines slash commands that Claude Code executes. Without Claude Code, there's nothing to run.
- **Node.js 18 or later** — only required if you plan to install via npm. Installing from a local clone doesn't need Node at all.
- **A fresh, empty project folder** — the plugin creates artifacts in `docs/` of your working directory. Running `/onboard` in a directory that already has code and docs mixed together will get messy fast. Make a new folder for your project before you start.

## Install paths

Pick whichever matches how you're running Claude Code. All three lead to the same plugin working.

### Option 1: Claude Desktop — Add marketplace (recommended)

The cleanest path. Pulls from GitHub directly, supports `Sync` to update, no file downloads.

1. Open Claude Desktop → **Personal plugins** panel (left sidebar)
2. Click the **+** button → **Add marketplace**
3. Enter: `estevanhernandez-stack-ed/vibe-cartographer`
4. Click **Sync**

Claude Desktop reads `.claude-plugin/marketplace.json` at the repo root, discovers the `vibe-cartographer` plugin inside `./plugins/vibe-cartographer`, and registers its slash commands. Updates propagate by clicking **Sync** again on the marketplace entry.

### Option 2: Claude Code CLI — npm

For users running Claude Code in a terminal, VS Code, or JetBrains.

```bash
npm install -g @esthernandez/vibe-cartographer
```

This drops the plugin files at:

- **macOS/Linux:** `~/.npm-global/lib/node_modules/@esthernandez/vibe-cartographer/plugins/vibe-cartographer/`
- **Windows:** `%APPDATA%\npm\node_modules\@esthernandez\vibe-cartographer\plugins\vibe-cartographer\`

If your Claude Code CLI has a `plugin add <path>` command, point it at that path. Otherwise, use Option 1 (Add marketplace) — it works for CLI clients too because Claude Code reads marketplace entries from the global plugin config.

### Option 3: Claude Desktop — Upload plugin (for local iteration)

For testing changes locally before pushing them to GitHub.

1. Clone the repo:

   ```bash
   git clone https://github.com/estevanhernandez-stack-ed/vibe-cartographer
   cd vibe-cartographer
   ```

2. Build a `.plugin` bundle:

   ```bash
   python scripts/build-plugin.py
   ```

   This writes `bundles/vibe-cartographer-<version>.plugin` — a zip archive Cowork accepts directly. The script excludes `dist/`, `node_modules/`, `src/`, and other runtime/build artifacts per Cowork's plugin spec.

3. In Claude Desktop → **Personal plugins** → **+** → **Upload plugin**, pick the `.plugin` file.

You can also download a pre-built `.plugin` file from the [GitHub releases page](https://github.com/estevanhernandez-stack-ed/vibe-cartographer/releases) — each tagged release ships a ready-to-upload asset.

## Which option should I use?

| Situation                                            | Option                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| I use Claude Desktop and want the simplest install   | **Option 1** (Add marketplace)                                                    |
| I use Claude Code CLI / VS Code / JetBrains          | **Option 2** (npm) — then use Option 1 in Claude Desktop if you also use it there |
| I'm developing or testing plugin changes locally     | **Option 3** (Upload plugin)                                                      |
| I want to install without an internet connection     | **Option 3** — download the `.plugin` from releases ahead of time                 |

## Verifying the install

**The plugin root is the folder that contains `.claude-plugin/plugin.json`.** In this repo that's `plugins/vibe-cartographer/`, not the repo root. Most install paths handle this automatically (marketplace manifest tells Claude Desktop where to look), but if you're troubleshooting, that's the folder to point at.

## Verification

Open Claude Code in a **fresh, empty folder** for a project you want to build, then run:

```text
/onboard
```

You should see the Vibe Cartographer neural-network welcome banner and the first onboarding question. If you instead see `Unknown skill: onboard`, the plugin isn't wired in yet — double-check your Claude Code plugin list and confirm the path points at the folder containing `.claude-plugin/plugin.json`.

You can also check the installed version from a shell:

```bash
npm list -g @esthernandez/vibe-cartographer
```

## Configuration

No required configuration. On first `/onboard`, the plugin creates a **unified builder profile** at `~/.claude/profiles/builder.json` that captures your identity, experience level, and preferences (tone, pacing, persona). This profile is shared across all 626Labs plugins — install another 626Labs plugin later (like Vibe Doc) and it reads the same file, so you don't re-onboard.

You can inspect the profile any time:

```bash
cat ~/.claude/profiles/builder.json
```

It's plain JSON, lives in your home directory, and never leaves your machine.

## Migrating from `@esthernandez/app-project-readiness`

Vibe Cartographer is the rename of what used to be `@esthernandez/app-project-readiness` (v0.5.0 and earlier). v1.0.0 handles the migration automatically:

1. **Install the new package:** `npm install -g @esthernandez/vibe-cartographer`
2. **Uninstall the old one** when you're ready: `npm uninstall -g @esthernandez/app-project-readiness`
3. **Run `/onboard`** in a project. The plugin will:
   - Check `~/.claude/profiles/builder.json` for a legacy `plugins.app-project-readiness` block
   - Copy that block to `plugins.vibe-cartographer` (leaving the old key in place for one release as a safety net)
   - Note the migration in `process-notes.md`
4. **Legacy session logs** at `~/.claude/plugins/data/app-project-readiness/sessions/` are preserved untouched — append-only history isn't migrated, it just stays where it was written.
5. **Your per-project `docs/*.md` artifacts are untouched.** Nothing in your existing project folders needs to change.

## Troubleshooting

**`Unknown skill: onboard` when running `/onboard`.**
Claude Code isn't loading the plugin. Confirm the plugin folder is registered in your client's plugin list, and that you're pointing at the folder that contains `.claude-plugin/plugin.json` (the plugin root — `plugins/vibe-cartographer/` in this repo), not the repo root or a parent directory.

**The welcome banner renders as a scrambled wall of characters.**
You're on an ancient install (0.2.x or earlier) that still ships the fragile asterisk-and-dash ASCII art. Upgrade:

```bash
npm install -g @esthernandez/vibe-cartographer@latest
```

**`/reflect` feels like a classroom quiz instead of a peer retro.**
Your Claude Code is loading a 0.4.x or earlier copy. Upgrade to 1.0.0+ (Vibe Cartographer) or 0.5.0+ (final app-project-readiness).

**My builder profile still has `plugins.app-project-readiness` and not `plugins.vibe-cartographer`.**
Run `/onboard` once on v1.0.0+ and the plugin will copy the old block to the new location automatically. Both keys will exist side-by-side for one release as a safety net; the next major bump will drop the old key.

**I picked the wrong persona or mode and want to switch.**
Tell the agent directly mid-session: "switch to Superdev persona" or "switch to Builder mode". The override sticks for the rest of the session. To change it permanently for future runs, edit `~/.claude/profiles/builder.json` directly (it's plain JSON — `shared.preferences.persona` and `plugins.vibe-cartographer.mode`).

## Uninstalling

```bash
npm uninstall -g @esthernandez/vibe-cartographer
# and if you still have the old package installed:
npm uninstall -g @esthernandez/app-project-readiness
```

If you want to wipe the builder profile and session logs too:

```bash
# macOS/Linux
rm -f ~/.claude/profiles/builder.json
rm -rf ~/.claude/plugins/data/vibe-cartographer/
rm -rf ~/.claude/plugins/data/app-project-readiness/

# Windows (PowerShell)
Remove-Item -Path "$HOME\.claude\profiles\builder.json" -Force
Remove-Item -Path "$HOME\.claude\plugins\data\vibe-cartographer" -Recurse -Force
Remove-Item -Path "$HOME\.claude\plugins\data\app-project-readiness" -Recurse -Force
```

Both are safe to delete — the plugin recreates them on next use, and nothing else on your system depends on them.
