---
description: 🧹 ULTRATHINK Code Standards Design - Patterns, conventions, organization
---

# Code Standards Design

Invoke the **code-quality-consultant** in Design Mode for coding standards planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/03-code-standards.md`

## Design Considerations

### Maintainability Standards
- Code readability requirements
- Function/method size limits
- Class responsibility boundaries (SRP)
- Naming convention enforcement
- Comment requirements

### Architecture Patterns
- Design patterns to use
- Service layer patterns
- Repository patterns
- Factory patterns
- Observer/event patterns

### File Organization
- Directory structure for new code
- File naming conventions
- Module boundaries
- Import organization
- Barrel files (index.ts)

### Naming Conventions
- Class naming (PascalCase)
- Function/method naming (camelCase)
- Variable naming
- Constant naming (UPPER_SNAKE)
- File naming (kebab-case, PascalCase)

### Error Handling Patterns
- Exception types to use
- Try-catch placement
- Error propagation
- Logging on errors
- User-facing error handling

### Type Safety
- TypeScript strictness level
- Type vs. interface usage
- Generic patterns
- Type guard usage
- Zod/validation schema patterns

### Code Duplication Prevention
- Abstraction guidelines
- Shared utility patterns
- Component reuse patterns
- Copy-paste prevention

### Testing Patterns
- Test file organization
- Test naming conventions
- Mock/stub patterns
- Assertion style
- Test data management

## Design Deliverables

1. **Coding Standards** - Patterns and conventions to follow
2. **Architecture Patterns** - Design patterns appropriate for feature
3. **File Organization** - Where code should live
4. **Naming Conventions** - How to name classes, methods, variables
5. **Error Handling** - Exception handling patterns
6. **Testing Patterns** - How to structure tests

## Output Format

Deliver code standards document with:
- **Pattern Catalog** (pattern, when to use, example)
- **Directory Structure** (proposed organization)
- **Naming Convention Guide**
- **Error Handling Guidelines**
- **Type Safety Requirements**
- **Testing Standards**

**Be specific about coding standards. Provide code examples for key patterns.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
