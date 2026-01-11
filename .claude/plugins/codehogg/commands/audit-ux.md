---
description: 🎯 ULTRATHINK UX Review - Usability and accessibility analysis using ux-consultant
---

# ULTRATHINK: UX/Usability Assessment

ultrathink - Invoke the **ux-consultant** subagent for comprehensive usability and accessibility evaluation.

## Output Location

**Targeted Reviews:** When a specific page/feature is provided, save to:
`./audit-reports/{target-slug}/ux-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/ux-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Art Studio page` → `art-studio`
- `Cart and Checkout` → `cart-checkout`
- `Admin Dashboard` → `admin-dashboard`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### Usability Assessment
- Task completion ease
- Cognitive load
- Learnability
- Error recovery
- Feedback mechanisms

### Accessibility (WCAG)
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus management
- ARIA implementation

### User Flows
- Critical path efficiency
- Drop-off points
- Unnecessary steps
- Dead ends
- Success path clarity

### Information Architecture
- Navigation structure
- Content organization
- Search functionality
- Breadcrumb usage
- Mental model alignment

### Interaction Design
- Affordances clarity
- Feedback timing
- Animation purpose
- Touch targets
- Gesture support

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-quick`, `/audit-frontend`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ UX Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal UX assessment to the appropriate path with:
- **Usability Score (1-10)**
- **Accessibility Score (1-10)**
- **WCAG Compliance Level**
- Critical User Flow Issues with file:line references
- Accessibility Violations
- Quick UX Wins
- User Flow Optimizations
- Prioritized UX Roadmap

**Be specific about usability problems. Reference exact components and interactions.**
