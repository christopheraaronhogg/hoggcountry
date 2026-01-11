---
description: 🔐 ULTRATHINK Security Design - Threat model, auth, data protection
---

# Security Design

Invoke the **security-consultant** in Design Mode for security requirements planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/07-security-requirements.md`

## Design Considerations

### Threat Model (STRIDE)
- **Spoofing** - Identity verification requirements
- **Tampering** - Data integrity protections needed
- **Repudiation** - Audit logging requirements
- **Information Disclosure** - Sensitive data handling
- **Denial of Service** - Rate limiting, resource protection
- **Elevation of Privilege** - Permission boundaries

### Authentication Design
- Auth mechanism selection (session, JWT, OAuth)
- Password requirements (if applicable)
- MFA considerations
- Session timeout policies
- Remember me functionality
- Account recovery flow

### Authorization Design
- Role-based access control (RBAC)
- Permission model
- Resource-level permissions
- API authorization
- UI element visibility rules

### Data Protection
- Data classification (public, internal, confidential, restricted)
- Encryption at rest requirements
- Encryption in transit
- PII handling
- Data masking/redaction
- Secure deletion requirements

### Input Validation
- User input sanitization rules
- File upload security
- API input validation
- SQL injection prevention
- XSS prevention
- CSRF protection

### Audit Requirements
- Security events to log
- Audit trail structure
- Log retention period
- Compliance requirements
- Alerting triggers

## Design Deliverables

1. **Threat Model** - STRIDE analysis for the feature
2. **Authentication** - Auth requirements, session handling
3. **Authorization** - Permission model, access control
4. **Data Protection** - Encryption, sanitization needs
5. **Input Validation** - Validation rules, sanitization
6. **Audit Requirements** - What to log, compliance needs

## Output Format

Deliver security design document with:
- **Threat Model Matrix** (threat, risk, mitigation)
- **Authentication Flow Diagram**
- **Permission Matrix** (role × resource × action)
- **Data Classification Table**
- **Validation Rule Inventory**
- **Security Checklist** (implementation verification)

**Be thorough about security requirements. Reference OWASP guidelines where applicable.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
