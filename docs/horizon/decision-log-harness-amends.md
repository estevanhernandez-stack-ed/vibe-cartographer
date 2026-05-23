# Decision Log — Harness Engineering Amends (dashboard-ready)

> **Status:** Repo-first capture. The 626 Dashboard MCP was not connected in the session
> these decisions were made (2026-05-21), so they are recorded here in dashboard-ready form
> and must be **mirrored to the 626 Dashboard** (Vibe Cartographer project
> `6vJ7tx2eeW5eZxN9NKrB`) once the MCP surface is reachable. This is golden principle #1
> (repo-first) doing its job — the decision is captured durably even when the canonical
> surface is down.

---

## Decision 1 — Adopt "harness engineering" as the shared frame for Keystone + Cartographer evolution

- **Project:** vibe-cartographer (`6vJ7tx2eeW5eZxN9NKrB`); also applies to vibe-keystone.
- **Date:** 2026-05-21
- **Context:** Analyzed both tools against OpenAI's harness-engineering writeup (Lopopolo, 2026-02-11) plus Fowler's treatment. Verdict: both tools already *do* harness engineering (Keystone for the repo ground, Cartographer for the app), but stop at the **authored** tier; OpenAI runs **enforced** (linters/structural tests with remediation-as-prompt) and **instrumented** (observability + autonomy ladder) harness.
- **Decision:** Treat "authored → enforced → instrumented" as the roadmap axis for both tools. The harness *is* the "common piece" that aligns sub-agents on shared goals.
- **Consequences:** Reframes Cartographer's existing horizon briefs (parallel-swarms, tdd-loop, self-healing-reliability) under one external frame. Full analysis: `docs/horizon/harness-engineering-comparison.md`; decision sheet: `docs/horizon/harness-amends-decision-sheet.md`.

## Decision 2 — Cartographer: ship observability-as-context, enforcer wiring, and `/tend` (read-only)

- **Project:** vibe-cartographer (`6vJ7tx2eeW5eZxN9NKrB`)
- **Date:** 2026-05-21
- **Context:** Three of the do-now slices from the decision sheet, green-lit by Este.
- **Decision + what shipped (files only — no release cut):**
  - **Observability-as-context** — `skills/build/SKILL.md` deploy-verify now runs read-only probes itself and asserts them; mutating commands stay builder-confirmed.
  - **Enforcer wiring (Pattern #13)** — `skills/build/SKILL.md` defers to `/vibe-test:gate` with failures fed back as remediation prompts. vibe-sec referenced but skipped (it's v0.0.1, ships no invocable command).
  - **`/tend`** — new `commands/tend.md` + `skills/tend/SKILL.md`: read-only drift sweep on the built app (spec/checklist/doc drift, pattern entropy, dead weight, debt). Diagnostic-first like `/vitals`; remedial PRs deferred.
- **Consequences:** Adds a 12th command. On release: bump `package.json` + `plugin.json` in lockstep, CHANGELOG entry. Cross-plugin: relies on `vibe-test`'s `gate` exit-code contract (committed surface). Proposals doc: `proposed-changes-harness.md`.

## Decision 3 — Keystone: add a Tier 0 + Tier 1 evolution loop (crosses the zero-write privacy promise)

- **Project:** vibe-keystone (no dashboard project ID yet — tag by repo name `vibe-keystone`, `projectId: null`).
- **Date:** 2026-05-21
- **Context:** Keystone had no memory/evolution. Its own self-review judged the full Cartographer stack to be cargo-culting on a one-shot generator; Este chose the middle path (Tier 0 + Tier 1, not Tier 2 drift-doctor).
- **Decision + what shipped (files only — no release cut):**
  - **Tier 0** — new Step 6 in `skills/keystone/SKILL.md`: opt-in, off-by-default, anonymous structural capture to `~/.claude/plugins/data/vibe-keystone/captures.jsonl`, agent-appended (no script — preserves the zero-script property).
  - **Tier 1** — new `skills/evolve/SKILL.md` (`/vibe-keystone:evolve`): mines captures, proposes skeleton/classifier edits to `proposed-changes.md`, never auto-applies, suppressed below 5 captures.
  - **Privacy** — `PRIVACY.md` updated to disclose the opt-in capture file (zero-network/zero-telemetry unchanged); `CHANGELOG.md` entry under `[Unreleased]`.
- **Consequences:** Crosses the prior "writes only CLAUDE.md" promise — mitigated by opt-in + anonymity + local-only + disclosure. On release: bump `plugin.json` `0.1.1 → 0.2.0` (minor). **Tier 2 drift-doctor explicitly out of scope** — judged a separate product.

---

## Mirror checklist (when the MCP is back)

- [ ] Log Decision 1 via `mcp__626Labs__manage_decisions log` → project `6vJ7tx2eeW5eZxN9NKrB`.
- [ ] Log Decision 2 → project `6vJ7tx2eeW5eZxN9NKrB`.
- [ ] Log Decision 3 → tag `vibe-keystone`, `projectId: null` (or create the Keystone project first).
- [ ] Consider `bridge_context_to_architect` for Decision 1 — the authored→enforced→instrumented axis is strategy-layer, not just code-layer.
