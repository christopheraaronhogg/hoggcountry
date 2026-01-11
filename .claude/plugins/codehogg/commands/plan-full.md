---
description: 🚀 ULTRATHINK Full Planning - All 18 consultants in 4 waves to create comprehensive PRD
---

# Full Feature Planning (All 18 Consultants)

Run all 18 consultant subagents in **Design Mode** across 4 sequential waves to create a comprehensive Product Requirements Document (PRD) and implementation plan.

## Target Feature

$ARGUMENTS

## Why Bundle-Aligned Waves?

1. **Logical flow** - Requirements → Architecture → Backend → Frontend
2. **Dependencies** - Later consultants can build on earlier outputs
3. **Recoverable** - If a wave fails, re-run just that bundle command
4. **Balanced** - Max 5 consultants per wave

## Wave Structure

### Wave 1: Foundation (3 consultants)
*Define requirements and structure first*

| Consultant | Design Output | File |
|------------|---------------|------|
| product-consultant | Product spec, user stories, scope | `01-product-spec.md` |
| architect-consultant | System design, components | `02-architecture-design.md` |
| code-quality-consultant | Coding standards, patterns | `03-code-standards.md` |

### Wave 2: Backend (5 consultants)
*Data, services, security, compliance*

| Consultant | Design Output | File |
|------------|---------------|------|
| backend-consultant | API contracts, service design | `04-api-design.md` |
| database-consultant | Schema design, data model | `05-data-model.md` |
| stack-consultant | Technology recommendations | `06-tech-recommendations.md` |
| security-consultant | Threat model, auth design | `07-security-requirements.md` |
| compliance-consultant | Privacy requirements | `08-compliance-requirements.md` |

### Wave 3: Operations (5 consultants)
*Deployment, testing, monitoring*

| Consultant | Design Output | File |
|------------|---------------|------|
| devops-consultant | Deployment plan, infrastructure | `09-deployment-plan.md` |
| cost-consultant | Cost projections | `10-cost-projections.md` |
| docs-consultant | Documentation plan | `11-documentation-plan.md` |
| qa-consultant | Test strategy, acceptance criteria | `12-test-strategy.md` |
| observability-consultant | Logging, monitoring plan | `13-observability-plan.md` |

### Wave 4: Frontend (5 consultants)
*UI, UX, content, performance*

| Consultant | Design Output | File |
|------------|---------------|------|
| ui-design-consultant | Visual specs, components | `14-ui-design-spec.md` |
| ux-consultant | User flows, wireframes | `15-ux-flows.md` |
| copy-consultant | Content strategy, microcopy | `16-content-strategy.md` |
| performance-consultant | Performance budgets | `17-performance-budget.md` |
| seo-consultant | SEO requirements | `18-seo-requirements.md` |

## Execution Protocol

### Step 1: Create Planning Directory
```bash
# Convert feature name to slug
SLUG=$(echo "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
mkdir -p planning-docs/${SLUG}
```

### Step 2: Wave 1 - Foundation
Launch 3 consultants in parallel with `run_in_background: true`:

**Prompt each consultant:** "Design Mode: Plan the {domain} for: {feature description}"

Wait for all 3 to complete before proceeding.

### Step 3: Wave 2 - Backend
Launch 5 consultants in parallel.

Wait for all 5 to complete before proceeding.

### Step 4: Wave 3 - Operations
Launch 5 consultants in parallel.

Wait for all 5 to complete before proceeding.

### Step 5: Wave 4 - Frontend
Launch final 5 consultants in parallel.

Wait for all 5 to complete.

### Step 6: Compile PRD and Implementation Plan
Read all 18 design files and create:
- `00-prd.md` - Unified Product Requirements Document
- `00-implementation-plan.md` - Ordered task list with status markers

## Output Structure

```
planning-docs/{feature-slug}/
├── 00-prd.md                      # Compiled PRD (after all waves)
├── 00-implementation-plan.md      # Ordered task list
│
├── # Wave 1: Foundation (3)
├── 01-product-spec.md
├── 02-architecture-design.md
├── 03-code-standards.md
│
├── # Wave 2: Backend (5)
├── 04-api-design.md
├── 05-data-model.md
├── 06-tech-recommendations.md
├── 07-security-requirements.md
├── 08-compliance-requirements.md
│
├── # Wave 3: Operations (5)
├── 09-deployment-plan.md
├── 10-cost-projections.md
├── 11-documentation-plan.md
├── 12-test-strategy.md
├── 13-observability-plan.md
│
├── # Wave 4: Frontend (5)
├── 14-ui-design-spec.md
├── 15-ux-flows.md
├── 16-content-strategy.md
├── 17-performance-budget.md
└── 18-seo-requirements.md
```

## PRD Format

The compiled `00-prd.md` should include:

```markdown
# Product Requirements Document: {Feature Name}

## Executive Summary
{Synthesized from all design docs}

## Goals & Success Metrics
{From 01-product-spec.md}

## Architecture Overview
{From 02-architecture-design.md}

## Technical Specifications
### API Design
{Summary from 04-api-design.md}

### Data Model
{Summary from 05-data-model.md}

### Security & Compliance
{From 07, 08}

## User Experience
### User Flows
{From 15-ux-flows.md}

### UI Design
{From 14-ui-design-spec.md}

## Non-Functional Requirements
### Performance
{From 17-performance-budget.md}

### Observability
{From 13-observability-plan.md}

## Test Strategy
{From 12-test-strategy.md}

## Implementation Considerations
{From all relevant docs}
```

## Implementation Plan Format

The `00-implementation-plan.md` uses task markers:

```markdown
# Implementation Plan: {Feature Name}

## Phase 1: Foundation
- [ ] Set up database models (05-data-model.md)
- [ ] Create migration files
- [ ] Add model relationships

## Phase 2: Backend
- [ ] Create API endpoints (04-api-design.md)
- [ ] Implement service layer
- [ ] Add validation rules

## Phase 3: Frontend
- [ ] Build UI components (14-ui-design-spec.md)
- [ ] Implement user flows (15-ux-flows.md)
- [ ] Add loading/error states

## Phase 4: Polish
- [ ] Add tests (12-test-strategy.md)
- [ ] Implement logging (13-observability-plan.md)
- [ ] Update documentation (11-documentation-plan.md)

---
Task Status:
- [ ] = Pending
- [~] = In Progress
- [x] = Complete [commit-sha]
```

## Minimal Return Pattern

**CRITICAL:** Each consultant must:
1. Write full design doc to their designated file
2. Return ONLY a brief status:

```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```

## Recovery

If a wave fails, re-run just that bundle:
- Wave 1 failed? Run `/plan-foundation "{feature}"`
- Wave 2 failed? Run `/plan-backend "{feature}"`
- Wave 3 failed? Run `/plan-ops "{feature}"`
- Wave 4 failed? Run `/plan-frontend "{feature}"`

## After Planning

Once the PRD is approved, implement with:
- `/implement-solo` - Main agent implements sequentially (recommended)
- `/implement-team` - Selective delegation for independent tasks

## Alternative Commands

- `/plan-quick` - 7 key consultants (faster)
- `/plan-foundation` - Just Wave 1
- `/plan-backend` - Just Wave 2
- `/plan-ops` - Just Wave 3
- `/plan-frontend` - Just Wave 4
