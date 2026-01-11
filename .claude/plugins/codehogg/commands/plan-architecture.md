---
description: 🏛️ ULTRATHINK Architecture Design - System structure, components, integration
---

# Architecture Design

Invoke the **architect-consultant** in Design Mode for system architecture planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/02-architecture-design.md`

## Design Considerations

### System Structure
- Overall architecture pattern (MVC, layered, hexagonal, etc.)
- Module organization and boundaries
- Component responsibilities
- Service layer design
- Where this feature fits in the existing architecture

### Component Design
- New components/classes needed
- Existing components to extend or modify
- Shared vs. feature-specific code
- Interface definitions

### Dependency Planning
- External dependencies needed
- Internal module dependencies
- Circular dependency prevention
- Dependency injection approach

### Integration Points
- How feature connects to existing system
- API boundaries
- Event/message contracts
- Database access patterns

### Scalability Considerations
- Horizontal scaling readiness
- State management approach
- Caching strategy
- Async processing needs

### Code Organization
- Directory structure for new code
- Naming conventions to follow
- File organization patterns
- Configuration approach

## Design Deliverables

1. **System Design** - Component diagram, responsibilities
2. **Integration Points** - How feature connects to existing system
3. **Data Flow** - Request/response paths
4. **Dependencies** - What this feature needs/provides
5. **Technical Constraints** - Performance, security, scalability
6. **Trade-offs** - Decisions made and alternatives considered

## Output Format

Deliver architecture design document with:
- **Architecture Diagram** (ASCII or description)
- **Component Responsibilities Matrix**
- **Integration Contract Definitions**
- **Dependency Graph**
- **Implementation Constraints**
- **Risk Assessment**

**Be specific about architectural decisions. Reference exact patterns and file locations.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
