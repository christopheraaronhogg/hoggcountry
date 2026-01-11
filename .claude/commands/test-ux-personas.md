---
description: 🧪 UX Personas Test - Run simulated user research with 6 diverse personas attempting real tasks in your running application
---

# UX Personas Testing

Run the **ux-personas-orchestrator** agent to conduct simulated user research with 6 diverse personas.

## What This Does

Spawns 6 browser-based agents, each embodying a different user type:

| Persona | Archetype | Device | Focus |
|---------|-----------|--------|-------|
| Sarah | Small business owner | Mobile | Discovery, pricing |
| Mike | Experienced decorator | Desktop | Comparison, quality |
| Jenny | Rush order handler | Desktop | Speed, efficiency |
| Carlos | Mobile-first user | Mobile | Status checks |
| David | Accessibility user | Keyboard | A11y compliance |
| Patricia | Skeptical shopper | Desktop | Trust, verification |

Each persona:
1. Opens a real browser
2. Attempts their assigned task
3. Documents friction and issues
4. Reports success/failure with screenshots

## Usage

```
/test-ux-personas --url http://localhost:3000
```

## Prerequisites

- Application must be running at the provided URL
- Chrome browser available for computer use

## Output

```
audit-reports/ux-personas-{timestamp}/
├── 00-executive-summary.md
├── 01-sarah-small-business-owner.md
├── 02-mike-experienced-decorator.md
├── 03-jenny-rush-order-handler.md
├── 04-carlos-mobile-user.md
├── 05-david-accessibility-user.md
├── 06-patricia-skeptical-shopper.md
├── screenshots/
└── 99-prioritized-recommendations.md
```

## Arguments

- `--url` - Required. The URL of your running application
- `--tasks` - Optional. Custom tasks for personas (JSON format)

## Estimated Time

15-25 minutes for full suite (6 personas x ~3-5 min each)

## What You'll Learn

- **Conversion blockers** - What prevents users from completing tasks
- **Friction points** - Where users struggle or hesitate
- **Accessibility gaps** - Keyboard navigation and screen reader issues
- **Mobile problems** - Touch targets, viewport issues
- **Trust factors** - What builds or breaks confidence

## Next Steps

After running persona tests:

1. **Review screenshots** - Visual evidence of issues
2. **Run `/audit-ux`** - Analyze code causing friction
3. **Prioritize fixes** - Based on how many personas affected
4. **Re-test** - Verify fixes with `/test-ux-quick`
