---
description: 📊 ULTRATHINK Observability Review - Logging, monitoring, and APM using observability-consultant
---

# ULTRATHINK: Observability Assessment

ultrathink - Invoke the **observability-consultant** subagent for comprehensive logging, monitoring, and tracing evaluation.

## Output Location

**Targeted Reviews:** When a specific page/feature is provided, save to:
`./audit-reports/{target-slug}/observability-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/observability-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Payment processing` → `payment`
- `Authentication flow` → `authentication`
- `Background jobs` → `background-jobs`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### Logging Strategy
- Structured logging (JSON vs plain text)
- Log levels (debug/info/warn/error)
- Context (request ID, user ID, correlation ID)
- PII sanitization
- Retention policies
- Searchability/indexing

### Log Coverage
- Authentication events
- Authorization failures
- Payment/transaction events
- Error conditions
- External API calls
- Background job execution
- Security events

### Error Tracking
- Error capture completeness
- Stack trace preservation
- Error grouping
- Alert triggering
- Context attachment
- Source map coverage (frontend)

### Metrics & APM
- Request latency (p50, p95, p99)
- Error rates
- Throughput (requests/sec)
- Database query times
- External service latency
- Queue depths
- Resource utilization

### Alerting Strategy
- Actionable alerts
- Severity prioritization
- Alert fatigue assessment
- Escalation paths
- On-call rotation

### Distributed Tracing
- Trace ID propagation
- Span coverage
- Cross-service correlation
- Performance bottleneck visibility
- Sampling strategy

### Dashboard Coverage
- System health overview
- Error rates and trends
- Performance metrics
- Business metrics
- Infrastructure health
- Security events

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-quick`, `/audit-ops`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ Observability Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal observability assessment to the appropriate path with:
- **Observability Score (1-10)**
- **Observability Maturity Level (1-5)**
- **Logging Strategy Review**
- **Error Tracking Assessment**
- **Metrics & APM Review**
- **Alerting Strategy Evaluation**
- **Blind Spots Identified**
- **Tool Recommendations**
- **Prioritized Improvements**

**Be thorough about visibility gaps. Reference exact files, missing coverage, and MTTR implications.**
