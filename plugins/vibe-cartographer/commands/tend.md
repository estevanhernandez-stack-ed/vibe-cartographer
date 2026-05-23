---
description: "Read-only drift sweep on the app you built — scans for entropy and deviation from its own spec and conventions, reports a banner, writes nothing."
argument-hint: "[--full]"
---

Use the **tend** skill (`skills/tend/SKILL.md`) to run a read-only drift sweep on the app you built with Vibe Cartographer.

Checks covered: (1) spec ↔ code drift, (2) checklist ↔ artifact drift, (3) doc drift (dangling references / stale README), (4) pattern entropy (duplication + naming inconsistency), (5) dead weight (orphan files / unused dependencies), (6) debt accumulation (TODO / FIXME / stubs / empty handlers).

Default scans the current working tree. Pass `--full` for a deeper history-aware pass (slower; warns up front).

Read-only: findings are reported as a banner-style report with ✓ / ⚠ / ✗ per check and a summary line. `/tend` never writes — not your code, not your docs, not the plugin's state. Remedial auto-PRs ship in a later release. This is the diagnostic half, shipped first (the same way `/vitals` shipped diagnostic-before-remedial).

If `vibe-sec` is installed, defer deep security scanning to it (Pattern #13) — `/tend` only surfaces config/secret hygiene as a drift signal, it doesn't replace a security scan.
