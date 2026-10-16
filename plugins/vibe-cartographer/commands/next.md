---
description: "Read-only: looks at your docs/ folder and tells you which chain step you are on and which command to run next. Also points at any /take run that can be resumed."
argument-hint: ""
---

Use the **next** skill (`skills/next/SKILL.md`) to find the next step in the Vibe Cartographer chain.

It checks which artifacts exist in `docs/` (builder-profile, scope, prd, spec, checklist, reflection), whether the checklist still has unchecked items, and prints the current step and the next command in the phrasing that fits your client. If a `/take` run in `docs/cart-runs/` has unfinished items, it names the run and the command to resume it. With no profile and no docs, it points at `/onboard`.

Read-only. It writes nothing beyond the standard session-log entry.
