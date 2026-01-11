---
description: 🚀 Full Feature Planning - Interactive interview, collaborative PRD, expert roundtable, and sequenced implementation plan
---

# Full Feature Planning

Run the **planning-orchestrator** to guide your feature from idea to implementation-ready plan.

## Usage

```
/plan-full                                    # Interview mode - asks what you want to build
/plan-full "OAuth login with Google/GitHub"   # Skip interview - proceed with detailed input
```

## The Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  INTERVIEW  │ →  │  PRD DRAFT  │ →  │ ROUNDTABLE  │ →  │   DETAIL    │ →  │  INTEGRATE  │
│             │    │             │    │             │    │             │    │             │
│ What to     │    │ Product     │    │ 9 experts   │    │ Parallel    │    │ Sequence &  │
│ build?      │    │ consultant  │    │ enrich PRD  │    │ deep plans  │    │ combine     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     │                                                                              │
     │  (skipped if detailed input provided)                                        │
     └──────────────────────────────────────────────────────────────────────────────┘
```

## Phase 1: Interview (Optional)

If you run `/plan-full` without details, the orchestrator asks:

1. What are you building?
2. Who is it for?
3. What problem does it solve?
4. Any constraints or preferences?
5. What does success look like?

**All questions are optional.** Say "skip" or "idk" to move on. The orchestrator will:
- Make reasonable assumptions
- Use context from CLAUDE.md and codebase
- Note assumptions for your confirmation

## Phase 2: PRD Draft

The **product-consultant** creates an initial PRD with:
- Summary and goals
- User stories
- Functional requirements
- Success metrics

## Phase 3: Expert Roundtable

Nine consultants review the PRD **sequentially**, each adding their considerations:

| Order | Expert | Adds |
|-------|--------|------|
| 1 | Architect | System structure, component boundaries |
| 2 | Security | Threat model, auth requirements |
| 3 | Database | Data model, schema design |
| 4 | Backend | API design, service layer |
| 5 | UX | User flows, states, edge cases |
| 6 | DevOps | Infrastructure, deployment needs |
| 7 | Performance | Load targets, optimization points |
| 8 | QA | Test strategy, acceptance criteria |

The PRD grows richer with each expert's input.

## Phase 4: Detailed Planning

Now that everyone agrees on the PRD, relevant experts create **detailed implementation plans** in parallel:

- Architecture plan
- Security plan
- Database plan
- Backend/API plan
- Frontend/UX plan
- DevOps plan
- Test plan

## Phase 5: Integration

The orchestrator:
1. Combines all detailed plans
2. Sequences tasks by dependencies
3. Identifies risks across domains
4. Collects open questions
5. Creates the final implementation plan

## Output Structure

```
planning-docs/{feature-slug}/
├── 00-interview-notes.md       # What you want (if interview happened)
├── 01-prd-draft.md             # Initial PRD
├── 02-prd-enriched.md          # PRD after roundtable (the main doc)
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

## The Implementation Plan

The final `99-implementation-plan.md` includes:

- **Phased tasks** sequenced by dependencies
- **Risk register** with mitigations
- **Open questions** requiring your decision
- **Success criteria** to know when you're done
- **Files to create/modify** across all domains

## Feature Input

$ARGUMENTS

## Complexity Handling

The orchestrator adjusts based on feature complexity:

| Complexity | Approach |
|------------|----------|
| Trivial | Suggests skipping planning |
| Simple | Quick PRD → Mini roundtable (3-4 experts) |
| Medium | Full roundtable, selective detailed plans |
| Complex | Full 5-phase workflow with all experts |

## After Planning

Once you approve the plan:
- `/implement-solo` — Main agent implements from plan
- `/implement-team` — Parallel delegation for independent tasks
- Or start manually with Phase 1 tasks

## Alternative Commands

For faster planning:
- `/plan-quick` — 7 key consultants, streamlined workflow

For specific focuses:
- `/plan-architecture` — Architecture-focused planning
- `/plan-security` — Security-focused planning
- `/plan-backend` — Backend-focused planning
- `/plan-frontend` — Frontend-focused planning
