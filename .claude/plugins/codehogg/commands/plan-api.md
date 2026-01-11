---
description: ⚙️ ULTRATHINK API Design - Endpoints, contracts, service layer
---

# API Design

Invoke the **backend-consultant** in Design Mode for API and service layer planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/04-api-design.md`

## Design Considerations

### API Design Principles
- RESTful conventions to follow
- Endpoint naming patterns
- Resource hierarchy
- Versioning strategy (if applicable)
- Authentication requirements

### Endpoint Specification
- HTTP methods (GET, POST, PUT, DELETE)
- URL structure and parameters
- Request body schemas
- Response body schemas
- Status codes and meanings

### Service Architecture
- Controller responsibilities
- Service layer design
- Repository patterns
- Business logic location
- Middleware requirements

### Data Access Patterns
- Query optimization approach
- Eager loading strategy
- Pagination design
- Filtering/sorting capabilities
- Bulk operation handling

### Error Handling Strategy
- Exception types to define
- Error response format
- User-facing vs. internal errors
- Logging requirements
- Recovery patterns

### Security Implementation
- Authentication flow
- Authorization checks
- Input validation rules
- Rate limiting needs
- CSRF/XSS protection

## Design Deliverables

1. **API Contract** - Endpoints, methods, request/response schemas
2. **Service Design** - Service classes, responsibilities, dependencies
3. **Data Flow** - How data moves through the system
4. **Validation Rules** - Input validation, business rules
5. **Error Handling** - Error responses, status codes
6. **Integration Points** - External services, queues, events

## Output Format

Deliver API design document with:
- **Endpoint Inventory** (method, URL, description)
- **Request/Response Schemas** (JSON examples)
- **Service Class Diagram**
- **Validation Rule Matrix**
- **Error Code Reference**
- **Integration Sequence Diagrams**

**Be specific about API contracts. Provide example payloads for each endpoint.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
