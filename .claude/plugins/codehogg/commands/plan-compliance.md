---
description: ⚖️ ULTRATHINK Compliance Design - Privacy, consent, data handling
---

# Compliance Design

Invoke the **compliance-consultant** in Design Mode for privacy and regulatory requirements planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/08-compliance-requirements.md`

## Design Considerations

### GDPR Requirements (if EU users)
- Lawful basis for data processing
- Consent mechanism design
- Data minimization approach
- Purpose limitation
- Storage limitation policies
- Data subject rights implementation

### CCPA Requirements (if California users)
- Right to Know mechanisms
- Right to Delete implementation
- Right to Opt-Out ("Do Not Sell")
- Non-discrimination policies
- Privacy notice requirements

### Cookie/Tracking Consent
- Cookie categorization (necessary, functional, analytics, marketing)
- Consent before tracking
- Granular consent options
- Easy withdrawal mechanism
- Cookie banner requirements

### Privacy by Design
- Data collection minimization
- Purpose limitation enforcement
- Access control requirements
- Encryption requirements
- Anonymization/pseudonymization approach

### Data Handling Requirements
- PII identification and handling
- Sensitive data in logs (prevention)
- Sensitive data in URLs (prevention)
- Data retention policies
- Third-party data sharing disclosures

### User Rights Implementation
- Access request mechanisms
- Deletion workflows
- Data portability (export)
- Rectification capabilities
- Consent withdrawal process

### Consent Management
- Consent collection points
- Consent audit trail
- Granular consent options
- Age verification (if applicable)
- Pre-checked boxes (prohibition)

## Design Deliverables

1. **Data Classification** - What data will be collected, its sensitivity level
2. **Consent Requirements** - What consents are needed, when to collect
3. **Privacy Design** - Privacy by design principles to follow
4. **Data Retention** - How long to keep data, deletion requirements
5. **User Rights** - Access, export, deletion mechanisms needed
6. **Third-Party Sharing** - Any data sharing requirements

## Output Format

Deliver compliance design document with:
- **Data Inventory** (data type, purpose, retention, legal basis)
- **Consent Flow Diagrams**
- **Privacy Impact Assessment**
- **User Rights Implementation Plan**
- **Compliance Checklist** (GDPR, CCPA, etc.)
- **Risk Assessment** (legal/financial exposure)

**Be thorough about compliance requirements. Note: This is technical guidance, not legal advice.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
