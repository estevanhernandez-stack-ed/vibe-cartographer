# Four Modes of Finding

Cart-the-tool ships findings across four distinct attention modes. Each catches a different kind of failure; none substitutes for the others. This reference exists to make the framework citable from any SKILL.

## The four modes

### 1. Cart attention — planning before code
**Catches:** Architectural contracts, edge cases, security boundaries, federation invariants, no-data states, authn/authz scaffolding, error-handling commitments.

**Strength:** Maximal for greenfield work. Cart was designed to bootstrap apps from scratch, where the agent's pattern-matching and the builder's vision converge to produce a complete spec before any code lands.

**Weakness:** Partial when extending an existing app/codebase. The agent doesn't have full mastery of the existing stack's idiosyncrasies — Firebase Functions memory floors, Eventarc region constraints, npm dep transitive vulns, .NET csproj cascades, etc. — and the builder may not either. Cart attention is the planner; the planner can't enumerate every config-value floor a strange runtime might enforce.

**Mitigation:** Pattern-match existing subsystem config values during /spec's Architecture Self-Review. Acknowledge upfront when the project is extension-mode rather than greenfield (see /onboard's Project Origin question).

### 2. Vibe attention — emergent in-build response
**Catches:** Emergent affordances, perf walls, second node types, in-session integrations, the "now that I see it, the code wants this" moves.

**Strength:** Real-time response to what the code is doing in your hands. Catches what should exist next.

**Weakness:** Operates within the build session — cannot pre-commit to specific lessons; relies on the builder being attentive.

**Posture:** Cart provides the bones; vibe provides the texture. Skipping vibe yields a brittle MVP; skipping Cart yields a beautiful demo with security holes.

### 3. Iteration attention — post-build polish
**Catches:** Dangling spec issues, hygiene gaps, UX rough edges, things the agent calls "Step 2 backlog" but the builder reads as closeable-now with substrate fresh.

**Strength:** Qualitatively richer than the original /spec phase because the agent has full architectural state loaded post-build. The builder's cost is near-zero in autonomous mode (no blocking responses), so the marginal cost of an iteration is low.

**Weakness:** Easy to skip when the agent recommends "skip to /reflect" reflexively.

**Posture:** In autonomous mode + parallel agents, iteration is the cheap default. Reflect is the deliberate close. See /iterate's mode-aware framing.

### 4. Deployed-state attention — post-deploy ground truth
**Catches:** Zombie shells from prior failed deploys, memory floors below practical container needs, region/database/Eventarc binding mismatches, CI/local source-of-truth desync, trigger-type immutability, runtime-only failures invisible to compile/lint/test.

**Strength:** Only mode that has access to production ground truth.

**Weakness:** Only fires AFTER a deploy. Cannot anticipate; can only verify.

**Posture:** /build's "done" criteria for runtime-infra steps must include a deploy-verification beat. `tsc clean + lint clean + tests pass` ≠ deploy-clean. See /build's Pre-handoff: Deploy verification subsection.

## Verification across modes

The four modes verify each other. Trust in one without verification through the others leaves real failures uncaught.

| Mode | Catches what could go wrong | When |
|---|---|---|
| Cart | Pre-code contracts, edge cases | /scope → /checklist |
| Vibe | Emergent in-build needs | /build (in-session) |
| Iteration | Deferred-but-closeable today | /iterate (post-build polish) |
| Deployed-state | Production-only failures | post-/build, pre-/reflect |

The discipline: verify each layer before declaring "done." Cart-clean does not imply vibe-clean does not imply iteration-clean does not imply deploy-clean. Each is necessary; none is sufficient alone.

## When the project is extending an existing app

Cart attention's strength is greenfield. When the project extends an existing app/codebase, the burden shifts:

- **Cart attention is partial:** the agent's planning rounds cannot enumerate every existing-stack idiosyncrasy. Compensate by treating "match existing subsystem config-value patterns" as default discipline (see /spec's Subsystem config pattern-match).
- **Vibe attention becomes more load-bearing:** the in-build observations of "this doesn't fit how the existing code works" carry more weight than they would in a greenfield run.
- **Iteration attention covers gaps Cart missed:** items deferred-as-Step-2 in greenfield mode often prove closeable today in extension mode because the substrate is the existing app.
- **Deployed-state attention is essential:** existing apps have deployed-state ground truth that any new-code addition must integrate with. Skipping the deploy-verification beat is structurally riskier in extension mode than in greenfield work.

When /onboard's Project Origin question reveals "extending existing repo" rather than "blank folder" or "no-code escape," downstream commands should weight the four modes accordingly.

## Why this exists as a reference rather than inline guidance

The framework spans every SKILL — /scope through /reflect, including /iterate's mode-aware default and /build's deploy-verification beat. Inlining it in guide SKILL would duplicate the four-mode language across multiple commands and bloat the guide. The references pattern (matching `friction-triggers.md`, `data-contracts.md`, `eval-rubric.md`) keeps the canonical statement single-source and lets every SKILL cite specific modes when needed.

## Citing this doc from a SKILL

When proposing or applying changes, refer to this doc as: `references/four-modes.md`. Specific modes can be cited as "Cart attention," "vibe attention," "iteration attention," "deployed-state attention" — those terms are stable.
