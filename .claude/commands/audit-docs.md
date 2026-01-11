---
description: 📚 ULTRATHINK Documentation Review - Docs quality and coverage analysis using docs-consultant
---

# ULTRATHINK: Documentation Assessment

ultrathink - Invoke the **docs-consultant** subagent for comprehensive documentation evaluation.

## Output Location

**Targeted Reviews:** When a specific feature/area is provided, save to:
`./audit-reports/{target-slug}/documentation-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/documentation-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `API Endpoints` → `api-endpoints`
- `User Guide` → `user-guide`
- `Developer Setup` → `developer-setup`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### Documentation Coverage
- README completeness
- API documentation
- Architecture documentation
- Setup/installation guides
- Troubleshooting guides

### Code Documentation
- Function/method documentation
- Complex logic explanations
- Type definitions
- Inline comment quality

### Organization
- Information architecture
- Navigation and discoverability
- Cross-referencing
- Search effectiveness

### Accuracy
- Outdated information
- Broken links
- Incorrect examples
- Version mismatches

### Onboarding
- Getting started guide
- Prerequisites clarity
- First-run experience
- Common pitfalls addressed

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-ops`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ Documentation Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal documentation assessment to the appropriate path with:
- **Executive Summary**
- **Documentation Coverage Score (%)**
- **Missing Documentation Inventory**
- **Outdated Content List**
- **Organization Improvements**
- **Priority Documentation Needs**
- **Quick Wins**
- **Documentation Roadmap**

**Be specific about documentation gaps. Reference exact files and missing sections.**
