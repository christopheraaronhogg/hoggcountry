---
description: 🧹 ULTRATHINK Code Quality Review - Tech debt and maintainability analysis using code-quality-consultant
---

# ULTRATHINK: Code Quality Assessment

ultrathink - Invoke the **code-quality-consultant** subagent for comprehensive code quality evaluation.

## Output Location

**Targeted Reviews:** When a specific area is provided, save to:
`./audit-reports/{target-slug}/code-quality-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/code-quality-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Art Studio components` → `art-studio`
- `API Controllers` → `api-controllers`
- `Utility functions` → `utilities`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### Maintainability Assessment
- Code readability
- Function/method length
- Class responsibilities (SRP adherence)
- Naming conventions

### Technical Debt Inventory
- TODO/FIXME/HACK comments
- Deprecated patterns
- Legacy code sections
- Quick fixes that need proper solutions

### Code Duplication
- Repeated code patterns
- Copy-paste anti-patterns
- Opportunities for abstraction

### Complexity Analysis
- Cyclomatic complexity hotspots
- Deeply nested code
- Long parameter lists
- God classes/functions

### Best Practices
- SOLID principles adherence
- DRY principle compliance
- Error handling patterns
- Type safety usage

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-quick`, `/audit-quality`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ Code Quality Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal code quality assessment to the appropriate path with:
- **Maintainability Index (1-10)**
- **Technical Debt Score** (estimated hours)
- **Top 10 Refactoring Priorities**
- **Code Smell Inventory**
- **Quick Wins**
- **Strategic Refactoring Roadmap**

**Be specific about problematic code. Reference exact files and line numbers.**
