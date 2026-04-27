# Privacy Policy — Vibe Cartographer

**Effective:** 2026-04-27
**Plugin:** vibe-cartographer (npm: `@esthernandez/vibe-cartographer`)
**Author:** 626Labs LLC

## Summary

Vibe Cartographer collects no telemetry, runs no analytics, and transmits no
personal data. Everything the plugin produces lives on your local machine.

## What the plugin reads and writes

All on your local filesystem:

- `~/.claude/profiles/builder.json` — your unified builder profile (identity,
  preferences, persona, project counts). Cross-plugin within 626Labs but never
  leaves your machine.
- `docs/*.md` in your project folder — scope, PRD, spec, checklist, reflection.
  Created by the eight-command flow.
- `process-notes.md` in your project folder — session-by-session notes.
- `~/.claude/plugins/data/vibe-cartographer/` — append-only session logs and
  friction log used by `/evolve` and `/vitals`. Local only.

## What the plugin transmits

One outbound network call: a version-check `curl` to
`https://registry.npmjs.org/@esthernandez/vibe-cartographer/latest` at the top
of `/onboard`. This is your machine asking the public npm registry whether a
newer version exists — the same kind of call `npm outdated` makes. 626Labs
does not operate the npm registry and does not receive any data from this
call.

## What the plugin does NOT do

- No telemetry, no usage analytics, no install counters, no first-run pings.
- No personal data collection of any kind.
- No third-party sharing, advertising, or tracking.
- No remote configuration — the plugin's behavior is fully determined by
  the SKILL files shipped in the release you installed.

## Contact

Questions or concerns: open an issue at
[github.com/estevanhernandez-stack-ed/vibe-cartographer/issues](https://github.com/estevanhernandez-stack-ed/vibe-cartographer/issues).

## Changes

If we ever change what the plugin reads, writes, or transmits, this file
will be updated and a corresponding CHANGELOG entry will reference the
change. Versioned by the same release tag as the plugin.
