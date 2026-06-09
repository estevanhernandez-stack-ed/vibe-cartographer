---
description: "Run a structural integrity check on Vibe Cartographer's installation. Reports findings across ten read-only checks, then offers up to six per-fix-confirmed auto-fixes."
argument-hint: "[--full]"
---

Use the **vitals** skill (`skills/vitals/SKILL.md`) to run the ten-check self-diagnostic on this Vibe Cartographer install.

Checks covered: (1) SKILL cross-references, (2) template references, (3) unified profile schema, (4) Pattern #13 complement availability, (5) friction log volume sanity, (6) friction-trigger consistency, (7) leftover `.tmp` debris, (8) `friction.jsonl` line integrity, (9) session-log coverage (orchestrator-gap detection), (10) evolve continuity (evolve-applied work still present in the tree).

Default scans the last 30 days of session logs for check #5. Pass `--full` for a complete-history scan (slower; warns up front).

Findings are reported as a banner-style report with ✓ / ⚠ / ✗ per check and a summary line. The ten checks themselves are read-only; where a check surfaces a fixable condition, vitals offers a deterministic auto-fix with per-fix `[y/n]` confirmation — nothing writes without your explicit yes.
