---
description: ⚡ ULTRATHINK Performance Design - Budgets, targets, optimization strategy
---

# Performance Design

Invoke the **performance-consultant** in Design Mode for performance budget planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/17-performance-budget.md`

## Design Considerations

### Frontend Performance
- Bundle size budget
- Code splitting approach
- Image optimization strategy
- Lazy loading requirements
- Core Web Vitals targets (LCP, INP, CLS)

### Backend Performance
- Response time targets (p50, p95, p99)
- Memory usage limits
- CPU-intensive operation handling
- Async processing approach
- Connection pooling

### Database Performance
- Query time targets
- Index planning
- N+1 prevention strategy
- Query caching approach
- Connection management

### Caching Strategy
- Cache layer selection (CDN, application, database)
- Cache-aside vs. read-through patterns
- Cache invalidation approach
- TTL strategy
- Cache warming needs

### Load Expectations
- Expected concurrent users
- Peak traffic patterns
- Data volume projections
- Growth trajectory
- Burst handling

### Resource Loading
- Critical rendering path optimization
- Above-the-fold prioritization
- Third-party script management
- Font loading strategy
- Preloading/prefetching approach

### Monitoring Setup
- Performance metrics to track
- Alerting thresholds
- Baseline establishment
- Regression detection

## Design Deliverables

1. **Performance Budget** - Target metrics for feature
2. **Load Requirements** - Expected traffic and concurrency
3. **Caching Strategy** - What to cache, TTLs, invalidation
4. **Optimization Approach** - Key techniques to employ
5. **Monitoring Points** - Performance metrics to track
6. **Scaling Considerations** - How feature scales under load

## Output Format

Deliver performance design document with:
- **Performance Budget Table** (metric, target, measurement)
- **Caching Architecture** (layer, content, TTL, invalidation)
- **Load Model** (users, requests/sec, data volume)
- **Optimization Checklist** (technique, impact, priority)
- **Monitoring Dashboard Spec**
- **Scaling Strategy** (triggers, actions)

**Be specific about performance targets. Provide concrete numbers where possible.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
