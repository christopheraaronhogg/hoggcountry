---
description: ⚙️ ULTRATHINK Backend Planning - API, Database, Security, Compliance (5 consultants)
---

# Backend Planning (5 Consultants)

Run 5 backend-focused consultants in **Design Mode** to plan API contracts, data models, technology choices, security, and compliance.

## Target Feature

$ARGUMENTS

## When to Use

- API-first development
- Data-heavy features
- Features with security/compliance requirements
- Microservice design
- Database schema planning

## Included Consultants

| Consultant | Design Output | File |
|------------|---------------|------|
| backend-consultant | API contracts, service design | `04-api-design.md` |
| database-consultant | Schema design, data model | `05-data-model.md` |
| stack-consultant | Technology recommendations (live research) | `06-tech-recommendations.md` |
| security-consultant | Threat model, auth design | `07-security-requirements.md` |
| compliance-consultant | Privacy requirements, consent | `08-compliance-requirements.md` |

## Execution Protocol

### Step 1: Create Planning Directory
```bash
SLUG=$(echo "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
mkdir -p planning-docs/${SLUG}
```

### Step 2: Launch All 5 in Parallel
Launch with `run_in_background: true`:
- backend-consultant → `04-api-design.md`
- database-consultant → `05-data-model.md`
- stack-consultant → `06-tech-recommendations.md`
- security-consultant → `07-security-requirements.md`
- compliance-consultant → `08-compliance-requirements.md`

### Step 3: Compile Summary
After all complete, create:
- `00-backend-summary.md` - Combined backend design decisions

## Output Structure

```
planning-docs/{feature-slug}/
├── 00-backend-summary.md
├── 04-api-design.md
├── 05-data-model.md
├── 06-tech-recommendations.md
├── 07-security-requirements.md
└── 08-compliance-requirements.md
```

## Backend Summary Format

```markdown
# Backend Summary: {Feature Name}

## API Overview
{Endpoints, methods, key schemas from 04}

## Data Model
{Tables, relationships from 05}

## Technology Decisions
{Key recommendations from 06}

## Security Controls
{Auth, validation, audit from 07}

## Compliance Requirements
{Privacy, consent, data handling from 08}

## Implementation Order
1. Database migrations
2. Models and relationships
3. Service layer
4. API endpoints
5. Validation and auth
```

## Minimal Return Pattern

Each consultant returns only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```

## Related Commands

- `/plan-foundation` - Add product spec and architecture first
- `/plan-ops` - Add deployment, testing, observability
- `/plan-frontend` - Add UI, UX design
