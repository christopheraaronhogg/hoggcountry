---
description: 🚀 ULTRATHINK DevOps Design - Deployment, infrastructure, CI/CD
---

# DevOps Design

Invoke the **devops-consultant** in Design Mode for deployment and infrastructure planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/09-deployment-plan.md`

## Design Considerations

### CI/CD Pipeline Changes
- Build process modifications
- Test automation additions
- Deployment automation updates
- Pipeline stage requirements
- Artifact management

### Infrastructure Requirements
- New infrastructure components
- Resource sizing (compute, memory)
- Network configuration
- Storage requirements
- Service dependencies

### Environment Configuration
- Environment variables needed
- Configuration files
- Secrets management
- Environment parity (dev/staging/prod)

### Deployment Strategy
- Deployment approach (blue-green, canary, rolling)
- Rollback procedures
- Feature flag integration
- Database migration timing
- Zero-downtime requirements

### Observability Setup
- Logging integration
- Metrics collection
- Health check endpoints
- Alert configuration
- Dashboard updates

### Developer Experience
- Local development setup
- Documentation updates
- Onboarding changes
- Tool requirements

## Design Deliverables

1. **Deployment Requirements** - How this feature should be deployed
2. **Environment Needs** - Environment variables, configs needed
3. **CI/CD Changes** - Pipeline modifications required
4. **Infrastructure** - Any new infrastructure components
5. **Rollback Strategy** - How to safely roll back
6. **Feature Flags** - If gradual rollout is needed

## Output Format

Deliver deployment design document with:
- **Infrastructure Diagram** (ASCII or description)
- **Environment Configuration Matrix**
- **CI/CD Pipeline Changes** (with workflow snippets)
- **Deployment Runbook** (step-by-step)
- **Rollback Procedure**
- **Monitoring/Alerting Setup**

**Be specific about deployment requirements. Reference exact configs and pipeline changes.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
