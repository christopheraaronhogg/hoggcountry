---
description: ✍️ ULTRATHINK Copy Review - Deep content audit with AI slop detection, voice analysis, and microcopy assessment
---

# ULTRATHINK: Copy/Content Assessment

ultrathink - Invoke the **copy-consultant** subagent for comprehensive content evaluation with AI slop detection.

## Output Location

**Targeted Reviews:** When a specific page/feature is provided, save to:
`./audit-reports/{target-slug}/copy-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/copy-assessment.md`

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

### Voice & Tone Audit
- Consistency across the application
- Brand voice alignment
- Appropriate formality level
- Personality and warmth

### AI Slop Detection
- Generic, template-like copy
- Overused phrases ('streamline', 'leverage', 'robust')
- Lifeless descriptions
- Missing human touch

### Microcopy Assessment
- Button labels (clarity, action-oriented)
- Form labels and placeholders
- Error messages (helpful, not blaming)
- Empty states
- Loading states
- Success messages

### Content Clarity
- Jargon usage
- Reading level appropriateness
- Scanability
- Information hierarchy

### Accessibility
- Alt text quality
- Link text descriptiveness
- ARIA labels
- Screen reader friendliness

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-quick`, `/audit-frontend`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ Copy Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## ADN-Specific Guidelines

Reference CLAUDE.md for ADN voice guidelines:
- Helpful, warm, professional
- No crude language
- Humble, not boastful
- Customer success focused

## Output Format
Deliver formal copy assessment to the appropriate path with:
- **Voice Consistency Score (1-10)**
- **AI Slop Instances** (specific examples)
- **Microcopy Improvements** (prioritized)
- Content Rewrites (before/after examples)
- Quick Wins
- Strategic Content Roadmap

**Flag every instance of generic AI-generated copy. Provide specific rewrites.**
