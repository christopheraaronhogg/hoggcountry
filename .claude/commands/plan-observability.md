---
description: 📊 ULTRATHINK Observability Design - Logging, metrics, alerts, SLOs
---

# Observability Design

Invoke the **observability-consultant** in Design Mode for monitoring and logging planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/13-observability-plan.md`

## Design Considerations

### Logging Strategy
- Log level requirements (debug/info/warn/error)
- Structured logging format (JSON fields)
- Context to include (request ID, user ID, correlation ID)
- PII sanitization requirements
- Log retention policies
- Searchability/indexing needs

### Log Coverage
- Authentication events to log
- Authorization failures
- Business transaction events
- Error conditions
- External API calls
- Background job execution
- Security events

### Metrics & KPIs
- Request latency targets (p50, p95, p99)
- Error rate thresholds
- Throughput metrics
- Database query times
- External service latency
- Queue depths
- Business metrics

### Error Tracking
- Error capture requirements
- Stack trace preservation
- Error grouping strategy
- Alert triggering rules
- Context attachment
- Source map requirements (frontend)

### Alerting Strategy
- Alert severity levels
- Alert routing (who gets notified)
- Escalation paths
- On-call considerations
- Alert fatigue prevention

### Distributed Tracing
- Trace ID propagation approach
- Span coverage requirements
- Cross-service correlation
- Sampling strategy
- Performance overhead budget

### Dashboard Requirements
- System health overview
- Error rate visualization
- Performance metrics display
- Business metrics tracking
- Infrastructure health
- Security event monitoring

## Design Deliverables

1. **Logging Requirements** - What to log, at what level
2. **Metrics to Track** - Key performance indicators
3. **Alerting Rules** - When to alert, who to notify
4. **Dashboard Needs** - What visibility to provide
5. **Tracing Points** - Where to add distributed tracing
6. **SLI/SLO Definitions** - Service level indicators and objectives

## Output Format

Deliver observability design document with:
- **Logging Schema** (event types, fields, levels)
- **Metrics Inventory** (name, type, labels, threshold)
- **Alert Definition Matrix** (condition, severity, routing)
- **Dashboard Mockups** (ASCII or description)
- **SLI/SLO Table** (indicator, objective, measurement)
- **Tracing Implementation Plan**

**Be specific about observability requirements. Reference exact events and thresholds.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
