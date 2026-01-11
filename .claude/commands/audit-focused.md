---
description: 🎯 ULTRATHINK Focused Audit - All 15 consultants analyzing a SPECIFIC page/feature in context of the full application
---

# Focused Audit

Run all 15 consultants focusing on a SPECIFIC page, feature, or component in the context of the full application using ULTRATHINK deep reasoning.

## Objective

Deep-dive analysis of a single feature/page/component with all consultant perspectives, understanding how it fits within the broader application context.

## When to Use

- Before launching a specific feature
- After completing a major page/component
- When a specific area feels problematic
- For targeted improvement of critical user paths

## Execution

1. **Identify the focus target** using AskUserQuestion:

```
AskUserQuestion(
  questions: [{
    question: "What specific page, feature, or component should this audit focus on?",
    header: "Focus",
    options: [
      { label: "Specific Page", description: "A single page/route in the application" },
      { label: "Feature", description: "A feature spanning multiple files" },
      { label: "Component", description: "A specific UI component" }
    ]
  }]
)
```

2. **Gather focus context**:
   - Read the target file(s)
   - Identify related files (controllers, models, tests)
   - Map dependencies and integrations

3. **Launch ALL 15 consultants in parallel**, each with focus-specific prompt:

```
Task(
  description: "Focused architecture review",
  subagent_type: "architect-consultant",
  prompt: "Analyze the architectural aspects of {focus_target}.

FOCUS: {target_files}
CONTEXT: This is part of {application_description}

Analyze:
- How this component fits in the overall architecture
- Coupling with other parts of the system
- Architectural concerns specific to this feature
- Recommendations for this specific area

..."
)
// Repeat for all 15 consultants
```

4. **Compile focused report** with findings organized by the specific feature

## All 15 Consultants Applied

Each consultant analyzes the focus target from their perspective:

| Consultant | Focus Analysis |
|------------|----------------|
| Architecture | Component structure, coupling, placement |
| Backend | APIs serving this feature, data flow |
| Code Quality | Code in this specific area |
| Copy | All text/labels in this feature |
| Cost | Resource usage of this feature |
| Database | Queries and schema for this feature |
| DevOps | Deployment considerations |
| Documentation | Docs for this feature |
| Laravel | Laravel patterns in this feature |
| Performance | Performance of this specific path |
| Product | Feature completeness, requirements |
| QA | Test coverage for this feature |
| Security | Security of this specific feature |
| UI Design | Visual design of this feature |
| UX | User experience of this feature |

## Output Format

Create: `audit-reports/{timestamp}-{feature_name}/`

Generate:
- `00-focused-summary.md` - Executive summary for this feature
- Individual consultant reports focused on the feature
- `00-action-items.md` - Prioritized improvements for this feature
