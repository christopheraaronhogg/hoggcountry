---
description: ⚡ Quick UX Test - Fast smoke test with 2 personas (first-timer + mobile) for rapid feedback
---

# Quick UX Test

Run a fast smoke test with just 2 personas for rapid feedback.

## What This Does

Instead of the full 6-persona suite, this runs:

| Persona | Why Included |
|---------|--------------|
| Sarah | First-time user experience (mobile) |
| Carlos | Mobile usability |

These two cover the most common friction sources:
- New user onboarding
- Mobile responsiveness

## Usage

```
/test-ux-quick --url http://localhost:3000
```

## Estimated Time

5-8 minutes (vs 15-25 for full suite)

## Output

```
audit-reports/ux-quick-{timestamp}/
├── 00-summary.md
├── 01-sarah-first-timer.md
├── 02-carlos-mobile.md
└── screenshots/
```

## When to Use

- **During development** - Quick check before committing
- **CI/CD integration** - Faster feedback loop
- **Initial assessment** - Before running full suite
- **Verification** - After fixing mobile/onboarding issues

## For Comprehensive Testing

Use `/test-ux-personas` to run all 6 personas including:
- Mike (comparison/quality)
- Jenny (speed/efficiency)
- David (accessibility)
- Patricia (trust/skepticism)
