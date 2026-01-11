---
description: 🧪 ULTRATHINK QA Review - Testing strategy and coverage analysis using qa-consultant
---

# ULTRATHINK: QA Assessment

ultrathink - Invoke the **qa-consultant** subagent for comprehensive testing evaluation.

## Output Location

**Targeted Reviews:** When a specific feature/area is provided, save to:
`./audit-reports/{target-slug}/qa-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/qa-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Checkout Flow` → `checkout`
- `API Layer` → `api`
- `Authentication` → `authentication`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### Test Coverage
- Unit test coverage
- Integration test coverage
- E2E test coverage
- Critical path coverage
- Edge case coverage

### Test Quality
- Test reliability (flaky tests)
- Test isolation
- Test readability
- Assertion quality
- Mock/stub appropriateness

### Testing Strategy
- Test pyramid balance
- Testing patterns used
- Test data management
- Environment handling

### CI Integration
- Test automation in pipeline
- Test parallelization
- Failure reporting
- Coverage tracking

### Quality Process
- Code review practices
- QA sign-off process
- Bug tracking
- Regression testing

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-ops`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ QA Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal QA assessment to the appropriate path with:
- **Executive Summary**
- **Coverage Metrics**
- **Test Quality Score (1-10)**
- **Flaky Test Inventory**
- **Coverage Gaps**
- **Missing Test Types**
- **Process Improvements**
- **Testing Roadmap**

**Be specific about testing gaps. Reference exact files and missing test scenarios.**
