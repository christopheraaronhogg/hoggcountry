---
description: 🧪 ULTRATHINK QA Design - Test strategy, acceptance criteria, quality gates
---

# QA Design

Invoke the **qa-consultant** in Design Mode for test strategy planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/12-test-strategy.md`

## Design Considerations

### Test Coverage Strategy
- Unit test requirements
- Integration test requirements
- E2E test requirements
- Critical path coverage
- Edge case coverage

### Test Quality Standards
- Test isolation approach
- Test readability standards
- Assertion best practices
- Mock/stub guidelines
- Test data management

### Testing Pyramid
- Unit test proportion
- Integration test proportion
- E2E test proportion
- Manual test needs
- Performance test needs

### Test Automation
- Automated test scope
- CI integration requirements
- Test parallelization
- Failure reporting
- Coverage tracking

### Acceptance Criteria
- Feature verification criteria
- Performance criteria
- Security criteria
- Accessibility criteria
- User acceptance criteria

### Quality Process
- Code review requirements
- QA sign-off process
- Bug triage process
- Regression testing approach
- Release criteria

## Design Deliverables

1. **Test Strategy** - Testing approach (unit, integration, E2E mix)
2. **Acceptance Criteria** - How to verify feature is complete
3. **Test Cases** - Key scenarios to test
4. **Edge Cases** - Boundary conditions and error scenarios
5. **Test Data Requirements** - Fixtures, factories, seeds needed
6. **Quality Gates** - Coverage and pass rate requirements

## Output Format

Deliver test strategy document with:
- **Test Plan Matrix** (scenario, type, priority, automation)
- **Acceptance Criteria Checklist**
- **Test Case Inventory** (happy paths, edge cases, error cases)
- **Test Data Specification**
- **Coverage Targets** (by component/layer)
- **Quality Gates Definition**

**Be specific about test coverage. Identify all critical paths and edge cases.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
