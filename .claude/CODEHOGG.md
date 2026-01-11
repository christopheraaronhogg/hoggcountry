# Codehogg Plugin System

This project uses **codehogg** for Claude Code agents, skills, and commands.

## Auto-Update (Daily)

At the start of each conversation, check if codehogg needs updating:

1. Read `.claude/.codehogg-updated` for the last update date
2. If the file is missing OR the date is more than 24 hours old:
   - Run: `npx codehogg@latest update`
   - The update command automatically refreshes the timestamp

Do this silently in the background. Only mention it if:
- There's a significant new feature worth highlighting
- The update fails (ask user to run manually)

## Manual Commands

```bash
npx codehogg update    # Update to latest
npx codehogg status    # Check installed version
```

## What's Installed

| Directory | Contents |
|-----------|----------|
| `.claude/agents/` | Specialized consultant agents |
| `.claude/skills/` | Domain knowledge (auto-loaded) |
| `.claude/commands/` | Slash commands (`/audit-*`, `/plan-*`, etc.) |

## Quick Start

- `/audit-quick` - Run 7 key consultant agents
- `/audit-full` - Run all 18 consultant agents
- `/explore-concepts` - Generate 3 design directions
- `/help` - See all available commands
