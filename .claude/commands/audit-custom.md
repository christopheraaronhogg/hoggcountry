---
description: 🎛️ ULTRATHINK Custom Audit - Pick specific consultant domains to run in parallel
---

# Custom Audit

Run a custom selection of consultant analyses in parallel using ULTRATHINK deep reasoning.

## Objective

Allow selective running of specific consultant domains based on project needs, running them in parallel for efficiency.

## Available Consultants

| Consultant | Focus Area |
|------------|------------|
| architect-consultant | System architecture, modularity, scalability |
| backend-consultant | API design, services, data access |
| code-quality-consultant | Tech debt, maintainability, refactoring |
| compliance-consultant | GDPR, CCPA, privacy, data handling |
| copy-consultant | Voice/tone, AI slop, microcopy |
| cost-consultant | Cloud costs, resource optimization |
| database-consultant | Schema design, query optimization |
| devops-consultant | CI/CD, infrastructure, deployment |
| docs-consultant | Documentation coverage and quality |
| observability-consultant | Logging, monitoring, APM, alerting |
| stack-consultant | Framework best practices (live research) |
| performance-consultant | Bottlenecks, optimization |
| product-consultant | Requirements, scope, prioritization |
| qa-consultant | Testing strategy, coverage |
| security-consultant | OWASP, vulnerabilities |
| seo-consultant | Technical SEO, meta tags, structured data |
| ui-design-consultant | Visual design, AI slop, consistency |
| ux-consultant | Usability, accessibility, user flows |

## Execution

1. **Ask user for selection** using AskUserQuestion:

```
AskUserQuestion(
  questions: [{
    question: "Which consultant domains do you want to include in this audit?",
    header: "Domains",
    multiSelect: true,
    options: [
      { label: "Architecture", description: "System structure and scalability" },
      { label: "Security", description: "OWASP, vulnerabilities, compliance" },
      { label: "Performance", description: "Bottlenecks and optimization" },
      { label: "Code Quality", description: "Tech debt and maintainability" }
    ]
  }]
)
```

2. **Launch selected consultants in parallel**:

For each selected domain, use the Task tool in a single message:

```
Task(
  description: "Architecture review",
  subagent_type: "architect-consultant",
  prompt: "...",
  run_in_background: true
)
Task(
  description: "Security review",
  subagent_type: "security-consultant",
  prompt: "...",
  run_in_background: true
)
// ... additional selected consultants
```

3. **Collect results** using TaskOutput for each background task

4. **Compile unified report** combining all consultant findings

## Output Format

Create directory: `audit-reports/{timestamp}/`

Generate:
- Individual reports for each selected domain
- `00-executive-summary.md` with combined findings
- `00-priority-matrix.md` with all recommendations ranked

## Usage Examples

```
/audit-custom
> Select: Architecture, Security, Performance
> Runs 3 consultants in parallel
> Generates combined report
```

```
/audit-custom
> Select: All frontend (UI, UX, Copy, Performance)
> Focused frontend quality audit
```
