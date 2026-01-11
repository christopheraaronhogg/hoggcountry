---
description: 🚀 ULTRATHINK DevOps Review - CI/CD and platform engineering analysis using devops-consultant
---

# ULTRATHINK: DevOps Assessment

ultrathink - Invoke the **devops-consultant** subagent for comprehensive DevOps evaluation.

## Output Location

**Targeted Reviews:** When a specific pipeline/system is provided, save to:
`./audit-reports/{target-slug}/devops-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/devops-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `CI Pipeline` → `ci-pipeline`
- `Deployment Process` → `deployment`
- `Monitoring Stack` → `monitoring`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### CI/CD Pipeline
- Build process efficiency
- Test automation coverage
- Deployment automation
- Pipeline reliability
- Feedback loop speed

### Infrastructure as Code
- IaC coverage
- Configuration management
- Environment parity
- Secret management

### Deployment Strategy
- Deployment frequency capability
- Rollback procedures
- Blue-green/canary readiness
- Feature flag usage

### Observability
- Logging strategy
- Metrics collection
- Tracing implementation
- Alerting setup

### Developer Experience
- Local development setup
- Documentation quality
- Onboarding friction
- Tool standardization

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-ops`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ DevOps Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal DevOps assessment to the appropriate path with:
- **Executive Summary**
- **DORA Metrics Assessment**
- **Pipeline Diagram (ASCII)**
- **Critical Gaps**
- **Security Concerns**
- **Quick Wins**
- **DevOps Maturity Score (1-5)**
- **Improvement Roadmap**

**Be specific about pipeline bottlenecks. Reference exact workflows and configurations.**
