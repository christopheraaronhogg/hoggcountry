---
description: ♿ Accessibility UX Test - Deep keyboard and screen reader testing with David, the accessibility persona
---

# Accessibility UX Test

Run comprehensive accessibility testing with **David**, the keyboard-only user.

## What This Does

David navigates your entire application using only:
- Tab / Shift+Tab
- Enter / Space
- Arrow keys
- Escape

**No mouse allowed.**

## What Gets Tested

| Test | What David Checks |
|------|-------------------|
| Focus visibility | Can you see where focus is? |
| Tab order | Does focus flow logically? |
| Skip links | Can you skip to main content? |
| Form labels | Are fields properly labeled? |
| Modal traps | Can you Escape out of modals? |
| Button names | Do buttons have accessible labels? |
| Heading structure | Is there logical hierarchy? |

## Usage

```
/test-ux-a11y --url http://localhost:3000
/test-ux-a11y --url http://localhost:3000 --task "complete checkout using only keyboard"
```

## Output

```
audit-reports/ux-a11y-{timestamp}.md
screenshots/david-*.png
```

## Report Includes

- **Accessibility score** - Usable / Partially Usable / Unusable
- **WCAG violations** - Specific guideline failures
- **Issue severity** - Critical / High / Medium / Low
- **Keyboard journey** - Step-by-step with key presses
- **Screenshots** - Focus traps, missing states

## Severity Ratings

| Severity | Example |
|----------|---------|
| Critical | Focus trap - can't Tab out of modal |
| High | Invisible focus states |
| Medium | Illogical tab order |
| Low | Skip link targets wrong element |

## Why This Matters

- **15% of users** have some form of disability
- **Many users** prefer keyboard navigation
- **SEO benefits** from proper semantics
- **Legal requirements** in many jurisdictions

## After Testing

1. Fix **Critical** issues first (they block usage)
2. Address **High** issues (major friction)
3. Run `/audit-ux` for code-level analysis
4. Re-run `/test-ux-a11y` to verify fixes
