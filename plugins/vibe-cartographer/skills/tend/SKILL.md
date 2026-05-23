---
name: tend
description: "This skill should be used when the user says \"/tend\" or \"/vibe-cartographer:tend\" or wants a drift check on the app they built. Runs six read-only checks against the built app — spec drift, checklist/artifact drift, doc drift, pattern entropy, dead weight, and debt accumulation — and reports findings in a banner-style report. Read-only in this release: it never writes code, docs, or plugin state. The diagnostic half of garbage-collection / entropy management; remedial auto-PRs ship later."
---

# /tend — Tend Your Built App

Slash command `/vibe-cartographer:tend`. Runs six **read-only** checks against the app the builder built, prints a banner-style report with per-check status (✓ clean, ⚠ drift, ✗ broken) and a summary line, then stops.

This is the diagnostic half of **garbage collection** — the entropy-management practice the harness-engineering frame names (`docs/horizon/harness-engineering-comparison.md`, adoption #4; `docs/horizon/self-healing-reliability.md`). AI-built apps drift: the agent mimics the patterns already in the repo, *including the bad ones*, so duplication, dead code, and spec deviation compound across builds. `/tend` surfaces that drift before it compounds. **Remedial auto-PRs ship in a later release** — exactly how `/vitals` shipped diagnostic-before-remedial. v1 writes nothing.

## What `/tend` is NOT

- **Not `/iterate`.** `/iterate` is builder-driven polish — you decide what to improve. `/tend` is agent-driven entropy detection — it tells you what drifted from the app's *own* spec and conventions, whether or not you asked.
- **Not `/vitals`.** `/vitals` checks the *plugin install*. `/tend` checks the *built app*.
- **Not a security scanner.** If `vibe-sec` is installed, defer deep security scanning to it (Pattern #13). `/tend` surfaces config/secret hygiene only as a coarse drift signal.

## Read-only contract

`/tend` v1 reads. It never writes — not the builder's source, not the builder's docs, not the plugin's runtime state (no session log, no friction log). There is no auto-fix phase in this release. The closing advisory points the builder at `/iterate` for hands-on fixes and names the remedial release as future work. This keeps v1 safe to run at any time and sidesteps the friction-trigger contract entirely (the `/tend` section of `friction-triggers.md` is intentionally absent, like `/vitals` and `/friction`).

## Before You Start

- **Read the app's own source of truth first.** Open `docs/spec.md`, `docs/checklist.md`, `docs/prd.md`, and `README.md` if present. These define what the app is *supposed* to be — drift is measured against them. If `docs/spec.md` is missing, `/tend` can still run the pattern/dead-weight/debt checks, but spec-drift and checklist-drift checks report a special informational state (nothing to measure against).
- **Determine the project root** from the current working directory (where `docs/` lives), not the plugin root.
- **Persona:** read `shared.preferences.persona` from `~/.claude/profiles/builder.json`. Persona colors the one-line opening only; the report body is neutral.

## Persona Adaptation

One sentence before the report renders, then the report is the output:

- **Professor:** "Running a drift sweep — here's where the app has wandered from its own plan, and why each one matters."
- **Cohort:** "Let's see what's drifted. Six checks incoming."
- **Superdev:** "Running tend."
- **Architect:** "Drift sweep — six checks across spec, docs, patterns, and dead weight."
- **Coach:** "Time to tidy up. Six checks, here we go."
- **System default:** "Running tend."

## Arguments

- `--full` — checks #4 (pattern entropy) and #5 (dead weight) run a deeper, slower pass (full cross-file reference walk rather than a sampled scan). Prints a runtime warning in the opening line: *"--full mode: deeper scan, may take longer on large codebases."*

Unknown flags → print `⚠ unknown flag: <flag> — ignoring` and continue.

## Flow

1. **Open.** Persona-adapted opening line. If `--full`, append the runtime warning.
2. **Read the app's source of truth** (see Before You Start).
3. **Run the six checks in order.** Each independently reports ✓ / ⚠ / ✗. A failure in one never aborts the next — the report always includes all six.
4. **Render the report** (banner header → one boxed section per check → summary line).
5. **Close** with the advisory. No writes, no handoff into the sequential chain.

## Check Specifications

Each check is a spec the evaluator implements at runtime against the builder's app. Ground every finding in a real file path and line where possible — vague drift can't be acted on.

### Check #1 — Spec ↔ code drift

**Purpose:** the architecture described in `docs/spec.md` still matches the code on disk.

**Read.** `docs/spec.md` (especially its annotated file tree and per-epic architecture). The actual project tree.

**Evaluate.** For each major module / directory / data-flow the spec names, check it exists in the code. For each major top-level source area in the code, check the spec accounts for it. Flag both directions: spec describes something the code doesn't have (planned-but-absent), and the code has a significant area the spec never mentions (built-but-undocumented — the drift that compounds).

**Report.** ✓ clean: spec and tree correspond. ⚠ drift: list each mismatch as `spec says X → not found in code` or `code has Y → absent from spec.md`. ✗ broken: `docs/spec.md` unreadable. **Special state** (no `docs/spec.md`): `No spec.md — nothing to measure code against. Run /spec, or this app predates spec-driven setup.`

### Check #2 — Checklist ↔ artifact drift

**Purpose:** `docs/checklist.md` checkboxes reflect reality.

**Read.** `docs/checklist.md` — each item, its checkbox state, and its `What to build` / `Verify` fields.

**Evaluate.** For each `- [x]` item, confirm the artifact it claims to have produced is present (file/feature named in the item exists). For each `- [ ]` item, note whether its artifact appears to exist already (work done but unchecked). Both are drift between plan-state and code-state.

**Report.** ✓ clean: checkboxes match artifacts. ⚠ drift: `item N marked done but <artifact> not found` / `item N unchecked but <artifact> appears present`. **Special state** (no checklist): `No checklist.md — skipping plan-state drift.`

### Check #3 — Doc drift (dangling references / stale README)

**Purpose:** the app's docs don't point at things that no longer exist (the doc-gardening concern — docs rot fastest).

**Read.** `README.md`, any `docs/*.md` the builder maintains (not the Cart-generated planning docs), and `.env.example` if present.

**Evaluate.** Scan docs for references to files, scripts, commands, routes, or env vars and check they still exist. Flag `npm run <script>` not in `package.json`, referenced files that are gone, env vars in docs missing from `.env.example` (or vice versa).

**Report.** ✓ clean: all references resolve. ⚠ drift: list each dangling reference as `<doc>:<line> → <missing thing>`.

### Check #4 — Pattern entropy (duplication + naming inconsistency)

**Purpose:** the app hasn't accumulated the copy-paste and inconsistency the agent introduces by mimicking existing code.

**Read.** Source files (sampled by default; full walk with `--full`).

**Evaluate.** Heuristic, not exhaustive: near-duplicate blocks (same logic pasted in 3+ places that wants extraction), inconsistent naming for the same concept (`getUser` / `fetch_user` / `loadUserData` side by side), and mixed conventions within one layer (camelCase and snake_case files in the same directory). Report signal, not noise — only flag patterns with 3+ instances.

**Report.** ✓ clean: no significant entropy sampled. ⚠ drift: list each as `<pattern> — N instances (e.g., <file:line>, <file:line>, …)` with a one-line "what golden principle this violates."

### Check #5 — Dead weight (orphan files / unused dependencies)

**Purpose:** entropy as accumulation — code and deps nothing references.

**Read.** Source tree + import/require graph. `package.json` (or `pyproject.toml` / `Cargo.toml`) dependencies.

**Evaluate.** Files/exports not imported anywhere (orphans). Declared dependencies not imported in any source file (unused deps). Imports of packages not in the manifest (phantom deps — the inverse, and a real bug).

**Report.** ✓ clean: no orphans or unused deps found. ⚠ drift: list orphan files and unused deps. ✗ broken: phantom dependency (imported but undeclared) — that's a build risk, not just entropy. **Note:** dynamic imports and framework entry points produce false positives; phrase findings as candidates, not certainties.

### Check #6 — Debt accumulation (TODO / FIXME / stubs / empty handlers)

**Purpose:** surface the unfinished-work markers that pile up silently in AI-built code.

**Read.** Source files.

**Evaluate.** Count and locate `TODO`, `FIXME`, `XXX`, `HACK`, "not implemented" / `NotImplementedError` / `throw new Error("unimplemented")`, empty `catch {}` blocks, and placeholder returns (`return null // TODO`). Trend matters more than count — surface the total and the top locations.

**Report.** ✓ clean: no debt markers. ⚠ drift: `N debt markers across M files` + the top 10 as `<file>:<line> — <marker>`.

## Output Format

Mirror the `/vitals` banner aesthetic exactly so the two diagnostics feel like one family.

### Banner header

```
  📖  Vibe Cartographer — Tend
  <app name from package.json or dir name> · <ISO-local-timestamp>
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If `--full`, insert a dim-indent line below the rule noting the deeper scan.

### Per-check boxed section

```
  ┌──────────────────────────────────────────────────────────────────┐
  │ ⚠  Check 4 — Pattern entropy                                     │
  └──────────────────────────────────────────────────────────────────┘
     Duplicated fetch-and-parse block — 3 instances:
       src/users.ts:40, src/orders.ts:55, src/items.ts:31
     Golden principle: extract shared logic; don't let the agent re-paste it.
```

Status glyph rules: `✓` clean, `⚠` drift, `✗` broken — two spaces after the glyph before the title. Target 68-column box rules. Findings tables are GFM tables indented four spaces. Every ✓ box still carries a one-line metric (`<what was scanned>: <headline>`), never just a glyph.

### Summary line

```
  <N> ✓  ·  <N> ⚠  ·  <N> ✗
```

Indented two spaces, counts sum to 6.

### Closing advisory

```
  /tend is read-only — nothing was changed. To act on drift now, run /iterate.
  Automatic cleanup PRs (golden-principle enforcement) ship in a later release.
```

If `vibe-sec` is installed, add one line: `For a real security pass (not just hygiene drift), run vibe-sec.`

## Mental Trace — Expected Output

Against a typical Cart-built app a few iterations in:

- **Check 1** — ⚠ drift is common: a feature added via `/iterate` after `/spec` was last updated shows as `code has X → absent from spec.md`. The honest, expected finding.
- **Check 2** — ✓ if the builder ran `/build` to completion; ⚠ if items were checked manually.
- **Check 3** — ⚠ if the README still references a renamed script.
- **Check 4 / #5 / #6** — ⚠ scales with app age; a fresh build is usually ✓ across all three, an app several `/iterate` cycles deep usually shows entropy in at least one.

A clean, freshly-built app: `6 ✓  ·  0 ⚠  ·  0 ✗`. A mature app due for tending: typically `2 ✓  ·  4 ⚠  ·  0 ✗`.

## Why This SKILL Exists

OpenAI's harness-engineering writeup names entropy as a first-class problem: the agent mimics existing patterns including the bad ones, so drift compounds, and manual Friday cleanups don't scale. Their answer is scheduled garbage-collection agents that pay debt down continuously. `/tend` is the first step of that for Cart-built apps — make the drift *visible and specific* before automating its cleanup. Diagnostic before remedial: you can't safely auto-fix what you haven't first learned to detect honestly.
