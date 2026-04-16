#!/usr/bin/env node

const name = "Vibe Cartographer";
const repo = "estevanhernandez-stack-ed/app-readinessplugin";
const plugin = "vibe-cartographer";

const lines = [
  "",
  "  ◯───◯───◯",
  "  │ ╲ │ ╱ │",
  `  ◯───◯───◯   ${name} installed!`,
  "  │ ╱ │ ╲ │",
  "  ◯───◯───◯",
  "",
  "  ┌─ Next: activate slash commands in Claude Code ──────────┐",
  "  │                                                         │",
  "  │  In your Claude Code CLI or IDE terminal, run:          │",
  "  │                                                         │",
  `  │  /plugin marketplace add ${repo}  │`,
  `  │  /plugin install ${plugin}@${repo.split("/")[0]}  │`,
  "  │  /reload-plugins                                        │",
  "  │                                                         │",
  "  │  Then open a fresh project folder and run:              │",
  "  │                                                         │",
  "  │  /onboard                                               │",
  "  │                                                         │",
  "  └─────────────────────────────────────────────────────────┘",
  "",
  "  Or in Claude Desktop: Personal plugins → + → Add marketplace",
  `  Enter: ${repo}`,
  "",
];

console.log(lines.join("\n"));
