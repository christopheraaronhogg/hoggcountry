---
description: 📋 ULTRATHINK Requirements Design - Product spec, user stories, scope
---

# Requirements Design

Invoke the **product-consultant** in Design Mode for product requirements planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/01-product-spec.md`

## Design Considerations

### Feature Definition
- Clear feature description
- Problem being solved
- Target user/persona
- Business goals alignment
- Success vision

### User Story Development
- Primary user stories (As a... I want... So that...)
- Secondary user stories
- Edge case stories
- Negative stories (what it should NOT do)
- Admin/internal user stories

### Acceptance Criteria
- Functional requirements
- Non-functional requirements
- Performance requirements
- Security requirements
- Accessibility requirements

### Scope Definition
- Core functionality (must have)
- Extended functionality (nice to have)
- Out of scope (explicitly excluded)
- Future considerations (deferred)
- MVP definition

### Success Metrics
- Key performance indicators (KPIs)
- Measurable outcomes
- User engagement metrics
- Business metrics
- Technical metrics

### Dependencies & Constraints
- Technical dependencies
- Business dependencies
- Timeline constraints
- Resource constraints
- Integration requirements

### Risk Assessment
- Technical risks
- Business risks
- User adoption risks
- Mitigation strategies

### Prioritization
- MoSCoW analysis (Must, Should, Could, Won't)
- Business value ranking
- Technical complexity assessment
- Dependency ordering

## Design Deliverables

1. **Product Specification** - Feature description, goals, success metrics
2. **User Stories** - Who, what, why for each capability
3. **Acceptance Criteria** - How to verify feature is complete
4. **Scope Definition** - What's in, what's out
5. **Dependencies** - What this feature needs/enables
6. **Success Metrics** - How to measure feature success

## Output Format

Deliver product requirements document with:
- **Feature Overview** (problem, solution, value)
- **User Stories List** (prioritized)
- **Acceptance Criteria Matrix** (story × criteria)
- **Scope Table** (in scope, out of scope, deferred)
- **Dependency Map**
- **Success Metrics Dashboard Spec**

**Be specific about requirements. User stories should be testable and acceptance criteria measurable.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
