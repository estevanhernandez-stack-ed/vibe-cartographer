---
description: "Read-only transparency report: everything Vibe Cartographer has stored about you, in plain language, with the path of every file so you can inspect or delete it by hand."
argument-hint: "[--last <n>]"
---

**Load the full instructions first:** read `${CLAUDE_PLUGIN_ROOT}/skills/what-do-you-know/SKILL.md` in full and follow it. This file is only the entry point; the skill is the complete instruction set, and the command shadows it, so it will not load on its own.

Use the **what-do-you-know** skill (`skills/what-do-you-know/SKILL.md`) to show what Vibe Cartographer remembers about you.

Covers the unified builder profile (`shared.*` and `plugins.vibe-cartographer.*`), session logs (counts by command, date range, last entries in one line each), the friction log, the friction calibration log, community signals, and where each file lives. Missing files print as "nothing stored", so a fresh install works.

`--last <n>` sets how many recent session entries to list (default 10).

Read-only. It writes nothing and deletes nothing. Deletion is manual: the report names each path so you can remove it yourself.
