# Decision Sheet — Harness Engineering Amends

> **For Este. Green-light item-by-item.** This consolidates both workstreams into one ranked
> view so you can approve in a single pass. Authored 2026-05-21 (The Architect).
>
> **Sources (full proposals, line-anchored to real files):**
> - Keystone: [`vibe-keystone/proposed-changes-harness.md`](../../../vibe-keystone/proposed-changes-harness.md)
> - Cartographer: [`vibe-cartographer/proposed-changes-harness.md`](../../proposed-changes-harness.md)
> - Findings: [`harness-engineering-comparison.md`](harness-engineering-comparison.md) · Charter: [`harness-task-force-charter.md`](harness-task-force-charter.md)

## The one strategic insight that changes the plan

**Both** Cartographer enforcer proposals (security checks, TDD gate) **defer to `vibe-sec` and
`vibe-test` — plugins that already exist.** So the "mechanical enforcer" layer for Cartographer
is mostly *wiring in enforcers we already own*, not building new ones. That reframes the single
highest-leverage finding (#1) from "build a checker" to "invoke the checker plugins at build
time." Cheaper, no duplication, and it's the ecosystem working as designed. Elevate this.

## Consolidated ranking (leverage ÷ effort)

| # | Tool | Proposal | Harness tier | Effort | Cross-plugin? | Architect rec |
|---|---|---|---|---|---|---|
| 1 | Keystone | **Map-not-encyclopedia** output mode + freshness linter | authored→enforced | 1 cycle (small do-now slice) | no | **Do first.** Highest fan-out — fixes the encyclopedia drift we see in our *own* CLAUDE.md files; improves every repo Keystone touches. |
| 2 | Cartographer | **Observability-as-context** in deploy-verify (agent runs the read-only probes it already lists, asserts them) | authored→instrumented | low | no | **Do now.** Behavioral, no SKILL edit, read-only. Lowest-risk instrumented-tier win. |
| 3 | Cartographer | **Wire in `vibe-sec`/`vibe-test`** at build time (the reframed #1) | authored→enforced | low–medium | yes (uses them, doesn't duplicate) | **Do early.** The defining harness mechanic (remediation-as-prompt) via plugins we already have. |
| 4 | Keystone | **Output validator** — compile Step-4 + "What NOT to do" into mechanical checks (path-existence is the one no LLM can fake) | authored→enforced | medium | maybe (`~/.claude/plugins/data/` if it logs) | **Approve as spec.** Hits `PRIVACY.md` — keep it agent-run, not a bundled script, to preserve the zero-script promise. |
| 5 | Cartographer | **`/tend`** — garbage-collection command for the user's *built app* (drift cleanup, propose-don't-apply) | authored→instrumented | medium | minor | **Approve, ship read-only first** (banner report, writes nothing) — same way `/vitals` shipped diagnostic-before-remedial. |
| 6 | Keystone | **Repo-as-record skeleton section** (where taste/tribal knowledge lands in-repo) | authored | low | no | **Safe green-light.** Purely additive CONDITIONAL section. Cheapest real win. |
| 7 | Cartographer | **TDD green-loop** as alternative `/build` mode | authored→enforced | full cycle | yes (`vibe-test`) | **Queue.** Strong, but depends on #3 substrate + deep vibe-test wiring. |
| 8 | Cartographer | **Parallel agent swarms** for `/build` | authored→instrumented | full cycle (~v2.0) | yes | **Queue (biggest prize, biggest lift).** Already scoped in `parallel-swarms.md`; composes on top of the TDD loop. |

## Genuine forks — these need YOUR call (not mine to default)

1. **Should Keystone grow an evolution loop at all?**
   Keystone's own honest verdict: bolting Cartographer's full self-evolution stack onto a
   once-per-repo generator would be cargo-culting. Tiered options:
   - **Tier 0** — opt-in capture on regeneration (smallest sensor). *Crosses `PRIVACY.md`'s zero-write-surface promise.*
   - **Tier 1** — `/keystone:evolve`, only once Tier 0 feeds it.
   - **Tier 2** — a "drift-doctor" — *which is really a separate product, not a Keystone feature.*
   **My read:** Tier 0 worth it (update PRIVACY.md + bump from 0.1.1), Tier 1 later, Tier 2 spun out. **Your call.**

2. **Confirm the skips** (from the comparison — flagging so they're a decision, not a drift):
   - **Throughput-first merge philosophy** (minimal gates, flakes via re-run). Skip — OpenAI says outright it's irresponsible below their throughput. Recommend: explicit no.
   - **Full CDP / per-worktree observability infra.** Adopt the *principle* (legibility), skip the *machinery*. Recommend: principle only.

## What I can ship the instant you approve (smallest reversible slices)

- **#2 (observability-as-context):** adopt agent-executed read-only assertions in `/build` deploy-verify — behavioral, immediate.
- **#3 (wire in vibe-sec/vibe-test):** a build-time invocation point — pending a quick check that those plugins expose what we need.
- **#5 (`/tend` read-only):** a drift-report command that writes nothing.
- **#6 (repo-as-record section):** additive skeleton section in Keystone.

Each of these modifies a shipped tool, so per our own propose-don't-apply discipline I held off
until your green-light. Say which numbers and I ship them in order.

## Decision log

Once you pick, the approved direction is decision-worthy for both roadmaps — logs to the 626
Dashboard (Cartographer project `6vJ7tx2eeW5eZxN9NKrB`) when the MCP surface is available.
