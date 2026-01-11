# Planning Workflow Skill

A comprehensive feature planning methodology modeled after professional software development firms.

---

## Overview

This skill defines a **phased planning workflow** that produces high-quality, implementation-ready plans through structured collaboration between domain experts.

**Philosophy:**
- Move forward, don't block on missing information
- Make reasonable assumptions and note them
- Use codebase context to fill gaps
- Flag critical unknowns for user confirmation

---

## The Five Phases

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  INTERVIEW  │ → │  PRD DRAFT  │ → │ ROUNDTABLE  │ → │   DETAIL    │ → │  INTEGRATE  │
│             │    │             │    │             │    │             │    │             │
│ What to     │    │ Product     │    │ Sequential  │    │ Parallel    │    │ Combine &   │
│ build?      │    │ Consultant  │    │ enrichment  │    │ deep plans  │    │ sequence    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Phase 1: Interview (Discovery)

### Purpose
Understand what the user wants to build with enough detail to write a PRD.

### Input Detection

| Input Type | Behavior |
|------------|----------|
| Detailed (>100 chars, clear scope) | Skip to Phase 2 |
| Brief (10-100 chars) | Ask 2-3 clarifying questions |
| None | Full interview mode |

### Interview Questions (All Optional)

Ask these conversationally. If user says "skip", "idk", or doesn't answer, **move on**.

1. **What are you building?**
   - Feature, page, flow, or system?
   - Core functionality in one sentence?

2. **Who is it for?**
   - User type or persona?
   - What's their context/situation?

3. **What problem does it solve?**
   - Pain point being addressed?
   - What happens without this feature?

4. **Any constraints or preferences?**
   - Technical requirements?
   - Design preferences?
   - Must integrate with existing systems?

5. **What does success look like?**
   - How will you know it's working?
   - Any specific metrics?

### Handling Missing Information

```
User: "idk" or [no response]

Response: "No problem. Based on [CLAUDE.md / codebase context /
common patterns], I'll assume [assumption]. I'll note this in
the PRD for confirmation. Moving on..."
```

### Output
- Interview notes (if interview happened)
- Clear understanding to pass to PRD phase

---

## Phase 2: PRD Draft (Product Consultant)

### Purpose
Create the initial Product Requirements Document.

### PRD Template

```markdown
# {Feature Name}

## Summary
{One paragraph describing what we're building and why}

## Background
{Context, problem being solved, motivation}

## Goals
- {Primary goal}
- {Secondary goals}

## Non-Goals (Out of Scope)
- {What we're explicitly NOT doing}

## User Stories
- As a {user type}, I want {capability} so that {benefit}

## Functional Requirements
1. {Must-have functionality}
2. {Must-have functionality}

## Non-Functional Requirements
- Performance: {targets}
- Security: {requirements}
- Accessibility: {requirements}

## Success Metrics
- {How we measure success}

## Assumptions
- {Assumptions made during discovery}

## Open Questions
- {Things that need user confirmation}
```

### Output
`planning-docs/{feature-slug}/01-prd-draft.md`

---

## Phase 3: Roundtable (Sequential Enrichment)

### Purpose
Each domain expert reviews the PRD and adds their considerations, building a complete picture before detailed planning.

### Expert Order (9 Consultants)

| # | Expert | Adds to PRD |
|---|--------|-------------|
| 1 | Product | Validates requirements, adds acceptance criteria |
| 2 | Architect | System structure, component boundaries, patterns |
| 3 | Security | Threat considerations, auth requirements, data protection |
| 4 | Database | Data model, schema design, migration needs |
| 5 | Backend | API design, service layer, business logic |
| 6 | UX | User flows, states, error handling, accessibility |
| 7 | DevOps | Infrastructure needs, deployment, environments |
| 8 | Performance | Load considerations, optimization points, targets |
| 9 | QA | Test strategy, coverage requirements, acceptance criteria |

### Roundtable Prompt Template

```
You are the {Expert} consultant participating in a planning roundtable.

## Your Task
Review this PRD and add your domain's considerations. Be concise but thorough.

## Current PRD
{prd_content}

## Previous Expert Additions
{previous_additions}

## Your Section to Add

Add a section titled "## {Domain} Considerations" with:
1. Key requirements from your domain's perspective
2. Technical decisions or recommendations
3. Dependencies on other domains
4. Risks or concerns specific to your area
5. Questions that need answers before implementation

Keep it focused and actionable. 2-4 paragraphs max.
```

### Output
`planning-docs/{feature-slug}/02-prd-enriched.md`

---

## Phase 4: Detailed Planning (Parallel)

### Purpose
Now that the PRD is complete with all perspectives, each domain creates their detailed implementation plan.

### Can Run in Parallel
Because the enriched PRD contains everyone's input, detailed planning can happen simultaneously without conflict.

### Detailed Plan Template

```markdown
# {Domain} Implementation Plan

## Overview
{How this domain will implement their part}

## Scope
{Specific responsibilities for this domain}

## Technical Approach
{Detailed technical decisions and rationale}

## Implementation Steps
1. {Step with details}
2. {Step with details}

## Dependencies
- Needs from other domains: {list}
- Provides to other domains: {list}

## Files to Create/Modify
- `path/to/file.ts` - {purpose}

## Risks & Mitigations
- Risk: {description} → Mitigation: {approach}

## Testing Approach
{How this domain's work will be tested}

## Definition of Done
- [ ] {Criterion}
- [ ] {Criterion}
```

### Output
```
planning-docs/{feature-slug}/plans/
├── architecture.md
├── security.md
├── database.md
├── backend.md
├── frontend.md
├── ux.md
├── devops.md
├── performance.md
└── qa.md
```

---

## Phase 5: Integration

### Purpose
Combine all detailed plans into a sequenced implementation plan with dependencies resolved.

### Integration Process

1. **Collect all plans** - Read all detailed planning docs
2. **Extract tasks** - Pull implementation steps from each
3. **Map dependencies** - What needs what?
4. **Sequence** - Order tasks respecting dependencies
5. **Identify risks** - Aggregate risks across domains
6. **Note open questions** - Collect unresolved decisions

### Implementation Plan Template

```markdown
# Implementation Plan: {Feature Name}

## Executive Summary
{What we're building, key decisions, estimated complexity}

## Architecture Overview
{High-level system diagram or description}

## Implementation Phases

### Phase 1: Foundation
{Database, core models, basic structure}

| Task | Domain | Dependencies | Notes |
|------|--------|--------------|-------|
| {task} | {domain} | {deps} | {notes} |

### Phase 2: Core Features
{Main functionality}

| Task | Domain | Dependencies | Notes |
|------|--------|--------------|-------|

### Phase 3: Integration & Polish
{Connecting pieces, error handling, edge cases}

| Task | Domain | Dependencies | Notes |
|------|--------|--------------|-------|

### Phase 4: Quality & Deploy
{Testing, documentation, deployment}

| Task | Domain | Dependencies | Notes |
|------|--------|--------------|-------|

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| {risk} | High/Med/Low | High/Med/Low | {approach} |

## Open Questions
Items requiring user decision before or during implementation:

1. {Question} - Affects: {domains}
2. {Question} - Affects: {domains}

## Success Criteria
- [ ] {Measurable criterion}
- [ ] {Measurable criterion}

## Files Changed
Summary of all files to be created or modified.
```

### Output
`planning-docs/{feature-slug}/99-implementation-plan.md`

---

## Full Output Structure

```
planning-docs/{feature-slug}/
├── 00-interview-notes.md       # Discovery conversation (if happened)
├── 01-prd-draft.md             # Initial PRD from Product
├── 02-prd-enriched.md          # PRD after roundtable
├── plans/
│   ├── architecture.md
│   ├── security.md
│   ├── database.md
│   ├── backend.md
│   ├── frontend.md
│   ├── ux.md
│   ├── devops.md
│   ├── performance.md
│   └── qa.md
└── 99-implementation-plan.md   # Final sequenced plan
```

---

## Key Principles

### 1. Keep Moving
Never block on missing information. Make assumptions, note them, continue.

### 2. Use Context
Read CLAUDE.md, DESIGN_SYSTEM.md, and codebase to inform decisions.

### 3. Be Pragmatic
Not every feature needs every consultant. Skip irrelevant domains.

### 4. Surface Risks Early
Better to identify problems in planning than during implementation.

### 5. Respect User Time
Don't ask questions you can answer from context. Don't over-engineer simple features.

---

## Skipping Phases

For simple features, phases can be compressed:

| Feature Complexity | Phases |
|-------------------|--------|
| Trivial (button, text change) | Skip planning entirely |
| Simple (single component) | Interview → Quick PRD → Implement |
| Medium (multi-file feature) | Interview → PRD → Roundtable (3-4 experts) → Implement |
| Complex (new system) | Full 5-phase workflow |

The orchestrator determines complexity from the feature description.
