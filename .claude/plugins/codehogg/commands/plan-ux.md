---
description: 🎯 ULTRATHINK UX Design - User flows, wireframes, accessibility
---

# UX Design

Invoke the **ux-consultant** in Design Mode for user experience planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/15-ux-flows.md`

## Design Considerations

### Usability Planning
- Task completion paths
- Cognitive load assessment
- Learnability approach
- Error recovery design
- Feedback mechanisms

### Accessibility Requirements (WCAG)
- Keyboard navigation design
- Screen reader support
- Color contrast requirements
- Focus management
- ARIA implementation needs
- Skip links and landmarks

### User Flow Design
- Primary user journey
- Alternative paths
- Entry and exit points
- Decision points
- Success/failure branches

### Information Architecture
- Navigation structure
- Content organization
- Breadcrumb requirements
- Search functionality
- Mental model alignment

### Interaction Design
- Click/tap affordances
- Hover/focus states
- Animation purpose
- Touch targets (minimum 44px)
- Gesture support

### Error Handling UX
- Error prevention strategies
- Error message placement
- Recovery guidance
- Inline vs. summary errors
- Retry mechanisms

### Success States
- Confirmation patterns
- Progress indication
- Completion feedback
- Next action suggestions
- Celebration moments (if appropriate)

## Design Deliverables

1. **User Flows** - Step-by-step task completion paths
2. **Wireframes** - Low-fidelity layout sketches (ASCII)
3. **Interaction Patterns** - How users interact with components
4. **Accessibility Requirements** - WCAG compliance needs
5. **Error Handling UX** - How errors are communicated
6. **Success States** - Confirmation and feedback patterns

## Output Format

Deliver UX design document with:
- **User Flow Diagrams** (ASCII or description)
- **Wireframe Sketches** (key screens)
- **Interaction Specification** (component × action × response)
- **Accessibility Checklist** (WCAG requirements)
- **Error State Inventory** (error × message × recovery)
- **Success State Inventory** (action × feedback)

**Be specific about user experience. Map every user path and edge case.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
