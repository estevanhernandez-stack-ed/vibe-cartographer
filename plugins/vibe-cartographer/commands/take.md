---
description: "Use when you have any list, plan, backlog, task set, or remediation output to work through, or a step of any process to hand off: vibe-sec/vibe-test/vibe-prompt findings, dashboard tasks, a plan file, a one-line ask. Plans it if it needs planning, then executes it the way this builder would, autonomously or step by step."
argument-hint: "[list path | report | plan | ask] (optional: no argument harvests this repo's work)"
---

Use the **take** skill to take over a list or a step of a process. It reads whatever you hand it, turns it into a runnable list in a run folder (`docs/cart-runs/<date>-<slug>/`), and works through it with the autonomous build engine. Say "overnight" and the run goes unattended: local branches only, parked items instead of stops, a decision ledger and a morning report, nothing pushed until you say so.

With no argument, it harvests the repo's own work sources (evolve proposals, open issues, dashboard tasks, plugin validator output, sibling vibe-* findings), verifies them against the code, and shows you the list to trim before anything runs.

**Prerequisites:** none. Works outside the 8-step chain, with or without `docs/spec.md` or a builder profile.
