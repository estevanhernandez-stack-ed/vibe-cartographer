# Horizon Brief — Keystone + Cartographer vs. OpenAI's Harness Engineering

> **Status:** Analysis brief. Not a build cycle yet. Authored 2026-05-21 (The Architect, autonomous research run).
> **Source material:** OpenAI, ["Harness engineering: leveraging Codex in an agent-first world"](https://openai.com/index/harness-engineering/) (Ryan Lopopolo, 2026-02-11); Martin Fowler / Birgitta Böckeler, ["Harness engineering for coding agent users"](https://martinfowler.com/articles/harness-engineering.html); InfoQ coverage. Cross-read against in-repo research of Vibe Keystone and Vibe Cartographer (findings archived at `C:\tmp\architect-research\`).
> **Effort to act on:** Recommendations range from one-session (AGENTS.md-as-map refactor) to full Cart cycle (parallel swarms, mechanical enforcers). Tiered at the end.
> **Related horizon docs:** [`parallel-swarms.md`](parallel-swarms.md), [`tdd-loop.md`](tdd-loop.md), [`self-healing-reliability.md`](self-healing-reliability.md) — this brief unifies all three under one external frame.

## The one-line reframe

**Harness engineering is the umbrella name for what Keystone and Cartographer already do piecemeal.** OpenAI's framing — `Agent = Model + Harness`, where the harness is *everything except the model* — means every artifact our tools produce (Keystone's `CLAUDE.md`, Cartographer's `docs/` chain) **is** harness. We've been harness engineers without the word.

The gap is not conceptual. It's maturity along one axis: **authored → enforced → instrumented.**

- **Authored harness** — docs a human (or agent) writes and the agent reads. This is where both our tools live today.
- **Enforced harness** — deterministic checks (linters, structural tests) that *mechanically* hold the line, and whose error messages are written as remediation prompts fed back into the agent. OpenAI lives here.
- **Instrumented harness** — the agent can observe the running system (logs, metrics, screenshots) and verify its own work; an autonomy ladder escalates to humans only at judgment points. OpenAI lives here too.

The whole comparison below is really one finding: **we author a great harness and stop. They enforce and instrument theirs.**

## What OpenAI actually did (the third column, grounded)

- A team of 3 (now 7) shipped a production beta — **~1M lines of code, ~1,500 merged PRs, ~3.5 PRs/engineer/day, zero hand-written code.** Codex wrote app logic, tests, CI, docs, observability, internal tooling.
- **Repo is the system of record.** If the agent can't see it in-repo, it doesn't exist — Slack decisions, taste, tribal knowledge all get pushed into versioned markdown.
- **`AGENTS.md` is a map, not an encyclopedia.** The "one giant instruction file" approach *failed* — it crowded out real context, rotted fast, couldn't be mechanically verified. The fix: a ~100-line `AGENTS.md` pointing into a structured `docs/` tree (maps, execution plans, design specs, references, quality scores), with **linters + CI that verify the knowledge base stays fresh**, and a **doc-gardening agent** that opens fix-up PRs when docs drift from code.
- **Mechanical Enforcers.** Strict layered architecture (Types → Config → Repo → Service → Runtime → UI; cross-cutting concerns only via a Providers interface) held by **custom linters + structural tests**. The lint error messages are written **as remediation prompts for the agent**. Principle: enforce invariants centrally, let the agent be creative locally.
- **Application legibility.** Chrome DevTools Protocol wired into the agent runtime — Codex drives the UI, screenshots, reproduces bugs, verifies fixes. Each git worktree gets its own bootable app + ephemeral observability stack; the agent queries logs (LogQL) and metrics (PromQL). Prompts like "make sure no span in these journeys exceeds 2s" work. Single runs go 6+ hours unattended.
- **Throughput changes merge philosophy.** Short-lived PRs, minimal blocking gates, flakes resolved by re-run not indefinite blocking. They explicitly call this *irresponsible at low throughput* — only correct at agent throughput.
- **Entropy is first-class ("garbage collection").** Codex mimics existing patterns including bad ones, so drift compounds. Manual Friday cleanups didn't scale. Now: encoded "golden principles" + scheduled cleanup agents that scan for deviation and open small, <1-min-reviewable, auto-mergeable refactor PRs. Pay debt down continuously; never let it compound.
- **The autonomy ladder.** One prompt → validate repo state → reproduce bug → record video of it → fix → record video of fix → open PR → respond to feedback → recover from build failures → escalate only on judgment → merge.
- **The punchline:** *"Discipline didn't go away, it moved up a layer."* Disciplined scaffolding instead of disciplined code.

Conceptual scaffolding (Fowler) worth keeping in our vocabulary: **guides** (feedforward — steer before the agent acts) vs **sensors** (feedback — observe after); **computational** (deterministic, cheap) vs **inferential** (LLM-based, semantic, expensive) controls; three harness tiers — **maintainability** (easy), **architecture fitness** (medium), **behaviour** (hard, still unsolved); "**keep quality left**" (push checks as early as possible); Ashby's Law (a regulator needs as much variety as the system it governs → committing to fixed topologies makes the harness tractable).

## Three-column comparison (8 axes)

| Axis | Vibe Keystone | Vibe Cartographer | OpenAI Harness Engineering | How close did we get? |
|---|---|---|---|---|
| **1. Intake / orientation** | Inventories repo (git, layout, stack, existing docs) + one-round tenant interview → classifies repo type | 100% interview (`/onboard`); **no repo scan**; "extend existing repo" by convention | Repo *is* the record; `AGENTS.md` map + structured `docs/`; intake = reading versioned markdown, kept fresh by a doc-gardening agent | **Mixed.** We're *ahead* on capturing human intent (rich interviews). Behind on machine-legible, self-maintaining intake. |
| **2. Planning / decomposition** | Fixed 10-section doc skeleton; no task graph | Linear artifact chain (scope→prd→spec→checklist), conversational; no DAG analyzer | Maps + execution plans + design specs in `docs/`; architecture decomposed into enforced layers | **Close on artifacts, behind on enforcement.** Our architecture is prose; theirs is a structural test. |
| **3. Execution model** | None (one-shot doc generator) | Autonomous `/build` dispatches subagents **sequentially**, one per checklist item; parallel swarms specced, unbuilt | Massive parallelism; per-worktree bootable instances; 6+ hr unattended runs; autonomy ladder | **Biggest gap.** They are years of throughput ahead. Our [`parallel-swarms.md`](parallel-swarms.md) is the right target; theirs is the existence proof. |
| **4. Shared context / source of truth** | **Produces** the load-bearing `CLAUDE.md` — the source-of-truth axis incarnate | "Documents *are* the context" — layered `docs/` chain + cross-plugin profile, re-read fresh each command | Repo-as-record; `AGENTS.md` map → `docs/` tree; **mechanically verified freshness** | **Closest to parity — our strongest axis.** We think exactly like them here. Two deltas: (a) map-not-encyclopedia discipline, (b) mechanical freshness. |
| **5. Guardrails / verification** | Step-4 self-check checklist — LLM self-attestation, unenforced | Acceptance/Verify fields + mandatory final security item — human-eyeball + agent judgment; no test gate | **Mechanical Enforcers** — custom linters + structural tests, **lint errors written as remediation prompts injected back into context** | **Big gap, highest-leverage borrow.** We describe rules in prose; they compile rules into deterministic feedback loops. |
| **6. Memory / evolution / learning** | None | 4-level self-evolution stack (friction / sessions / `/evolve` / decay) — sophisticated but under-fed (capture hole) | "Garbage collection" — scheduled drift-cleanup agents open auto-mergeable refactor PRs; golden principles | **Different targets.** *Our* loop improves the tool; *their* loop improves the codebase. We're ahead on meta-learning, behind on operational entropy management. |
| **7. Human-in-the-loop** | Conservative: refuse-blind, interview, propose-don't-create, diff-before-overwrite | Human-in-loop is the *default posture*; autonomy opt-in; comprehension checks; Learner mode | Human *out* of the code loop; in only at high-stakes decisions, PR review, environment design | **Philosophical inversion, not a deficiency.** We optimize human *learning*; they optimize human *leverage*. Direction of travel is theirs — but our Learner mode is a real feature for our audience. |
| **8. Production-readiness** | Strong as a *plugin* (license/privacy/changelog); out of scope for apps | Mandatory final security/docs item + deploy-signing matrix + runtime deploy-verify — prose the agent performs by hand | CI, observability, dashboards all agent-written; per-worktree observability; deploy verified via metric queries | **Gap.** Ours is a checklist; theirs is queryable instrumentation. |

## What to adopt, ranked

Ranked by **leverage ÷ effort** — what moves us furthest toward "enforced/instrumented" for the least build.

1. **Mechanical Enforcers with remediation-as-prompt.** *(highest leverage)* Turn our prose rules — Keystone's "What NOT to do," Cartographer's security checklist, the CLAUDE.md don'ts — into actual linters / structural tests **whose error messages are written as agent remediation instructions.** This is the single most distinctive OpenAI mechanic and the exact feedback loop both our tools lack. Plugs into Cartographer `/build` verification and a future Keystone output validator. Pairs with [`tdd-loop.md`](tdd-loop.md). *Effort: medium, incremental — start with 2–3 high-value invariants.*

2. **`AGENTS.md`/`CLAUDE.md` as MAP, not encyclopedia.** OpenAI explicitly tried the giant instruction file and it failed. **Our keystones are drifting into exactly that** — the Cartographer root `CLAUDE.md` is enormous and half of it is an auto-generated GitNexus block; the global `~/.claude/CLAUDE.md` is a multi-thousand-word document. Refactor the Keystone *pattern* to emit a ~100-line pointer file into a structured `docs/` tree, plus a freshness linter. Highest strategic value because it improves *every repo Keystone touches.* Plugs into Vibe Keystone directly. *Effort: one focused cycle on Keystone.*

3. **Parallel execution for `/build`.** Build [`parallel-swarms.md`](parallel-swarms.md) for real — coordinator + per-worktree implementer subagents + adversarial reviewer + merge protocol. OpenAI's ~3.5 PRs/eng/day is the proof the architecture pays off. *Effort: full Cart cycle (~v2.0, already scoped).*

4. **Garbage-collection / drift agents.** Scheduled cleanup agents that scan the *built app* for deviation from "golden principles" and open small, auto-mergeable refactor PRs. This is the operational-entropy loop our self-evolution stack doesn't cover (ours improves the *tool*, not the *user's codebase*). Natural home: Cartographer `/iterate`, or a new `/tend` command. Connects to [`self-healing-reliability.md`](self-healing-reliability.md). *Effort: medium.*

5. **Observability-as-context (instrumented verification).** Let `/build`'s deploy-verify query logs/metrics to confirm its own work, instead of eyeballing. Adopt the *principle* (the agent should be able to observe the running system) without the full CDP/per-worktree-observability machinery. Start small: structured log assertions. *Effort: medium; scope carefully — see "what to skip."*

6. **Repo-as-system-of-record discipline.** Formalize "if it's not in the repo, the agent can't see it." We half-live this (Cartographer's `docs/` chain). Make it explicit in the Keystone pattern: a place for taste, decisions, and tribal knowledge as versioned markdown. *Effort: low — mostly a convention + a section in the keystone skeleton.*

## What to skip (and why)

- **Full CDP + per-worktree observability stack.** OpenAI-scale infrastructure investment. For solo/small builds the ROI isn't there. **Adopt the principle (legibility), not the machinery.**
- **Throughput-first merge philosophy** (minimal gates, flakes via re-run). OpenAI says outright this is *only* responsible at agent throughput. At our scale, gates still pay for themselves. **Explicitly do not copy this** — it's the one place where blindly following the blueprint would hurt.
- **Zero-human-in-the-code-loop as a universal goal.** Cartographer's Learner mode and comprehension checks are *features* for people learning to build — that's the audience. Don't sacrifice human-in-loop wholesale; **offer "leverage mode" vs "learning mode"** rather than replacing one with the other.

## The meta-insight

The thing this whole analysis started from — the "common piece in between that gives sub-agents common goals," the piece we couldn't name — **is the harness.** It's the shared context that aligns every agent on where they're going. 626 has been building harness tools (Keystone for the ground, Cartographer for the app) since before the discipline had a name. The OpenAI article isn't a correction; it's permission and a blueprint to push our existing instincts from *authored* to *enforced* to *instrumented*.

Next move when this becomes a cycle: start with **#1 (mechanical enforcers)** and **#2 (map-not-encyclopedia)** — they're the highest-leverage, lowest-effort, and they reinforce each other (a map-shaped keystone is exactly what a freshness linter can mechanically verify).
