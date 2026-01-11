# Audit Integration Skill

A methodology for synthesizing findings from multiple domain-specific audits into a coherent, actionable remediation roadmap.

---

## Overview

After 18 consultants have analyzed a codebase from their respective domains, this skill provides the framework for:

1. **Cross-referencing** - Identifying issues flagged by multiple consultants
2. **Pattern detection** - Finding systemic problems across domains
3. **Dependency mapping** - Understanding fix prerequisites
4. **Sequencing** - Ordering fixes for maximum impact with minimum rework

---

## Phase 1: Cross-Reference Analysis

### Finding Corroboration

Issues flagged by multiple consultants are more likely to be:
- Systemic rather than edge cases
- High impact (visible across domains)
- Worth prioritizing

**Corroboration Scoring:**
| # Consultants | Corroboration Level | Priority Boost |
|---------------|---------------------|----------------|
| 1 | None | +0 |
| 2 | Moderate | +1 level |
| 3+ | Strong | +2 levels, flag as systemic |

### Cross-Reference Categories

Look for these common overlaps:

| Category | Typical Consultants | Example |
|----------|---------------------|---------|
| **Authentication** | Security, Backend, UX | "Login flow has vulnerabilities" |
| **Data Handling** | Database, Security, Compliance, Backend | "PII not properly protected" |
| **Performance** | Performance, Database, Backend, Frontend | "Slow page loads from N+1 queries" |
| **Code Structure** | Architecture, Code Quality, Stack | "Inconsistent patterns across modules" |
| **User Experience** | UX, UI, Copy, Performance | "Confusing checkout flow" |
| **Operations** | DevOps, Observability, QA | "No monitoring for critical paths" |

### Output: Corroboration Matrix

```markdown
## Corroboration Matrix

| Issue | Consultants | Corroboration | Combined Priority |
|-------|-------------|---------------|-------------------|
| Authentication bypass risk | Security, Backend, Stack | Strong (3) | P0 (was P1) |
| N+1 queries in orders | Database, Performance, Backend | Strong (3) | P0 (was P1) |
| Missing error handling | Code Quality, Backend | Moderate (2) | P1 (was P2) |
```

---

## Phase 2: Systemic Pattern Detection

### Pattern Recognition Framework

Look for these systemic patterns:

**1. Concentrated Technical Debt**
```
Signal: Multiple issues in same area
Example: "5 of 18 findings relate to OrderService"
Action: Consider targeted refactoring of that area
```

**2. Missing Foundational Layer**
```
Signal: Same root cause across domains
Example: "No input validation → SQL injection + XSS + bad UX"
Action: Address foundation before symptoms
```

**3. Inconsistent Standards**
```
Signal: Some areas excellent, others poor
Example: "UserService has tests, OrderService has none"
Action: Standardize across codebase
```

**4. Scaling Bottlenecks**
```
Signal: Performance + Architecture + Database align
Example: "Monolithic design + no caching + no indexes"
Action: Architectural intervention needed
```

**5. Security Gaps**
```
Signal: Security + Compliance + Backend align
Example: "Auth, input validation, data protection all weak"
Action: Security-focused sprint before features
```

### Pattern Template

```markdown
## Systemic Pattern: {Pattern Name}

**Affected Domains:** {list consultants}

**Root Cause:** {underlying issue}

**Manifestations:**
- {Domain 1}: {symptom}
- {Domain 2}: {symptom}
- {Domain 3}: {symptom}

**Recommended Approach:** {how to address holistically}

**If Not Addressed:** {consequences}
```

---

## Phase 3: Dependency Mapping

### Dependency Types

**1. Technical Dependencies**
- Database schema changes before API changes
- Infrastructure before deployment automation
- Auth fixes before protected features

**2. Knowledge Dependencies**
- Documentation before onboarding improvements
- Architecture understanding before refactoring

**3. Risk Dependencies**
- Security fixes before public launch
- Compliance before handling new data types

### Dependency Graph Construction

For each finding, identify:
- **Blocks:** What other fixes depend on this?
- **Blocked by:** What must be done first?
- **Parallel-safe:** Can run alongside which other fixes?

```markdown
## Dependency Graph

### Foundation Layer (Do First)
- [ ] Input validation framework (blocks: security fixes, API consistency)
- [ ] Database indexing (blocks: performance fixes)
- [ ] Logging infrastructure (blocks: observability improvements)

### Security Layer (After Foundation)
- [ ] SQL injection fixes (blocked by: input validation)
- [ ] XSS prevention (blocked by: input validation)
- [ ] Auth hardening (parallel-safe with above)

### Feature Layer (After Security)
- [ ] API consistency (blocked by: input validation)
- [ ] Error handling (parallel-safe)
- [ ] UI polish (blocked by: API consistency)
```

---

## Phase 4: Sequenced Remediation Roadmap

### Sequencing Algorithm

**Step 1: Group by Dependency Level**
- Level 0: No dependencies (foundations)
- Level 1: Depends only on Level 0
- Level 2: Depends on Level 1
- etc.

**Step 2: Within Each Level, Order by:**
1. Security issues first (risk reduction)
2. Then corroborated issues (multiple consultants)
3. Then by impact/effort ratio
4. Then quick wins for momentum

**Step 3: Identify Parallelization Opportunities**
- Which Level N items can run concurrently?
- What team composition enables parallel work?

### Remediation Phases

#### Phase 0: Stop the Bleeding (Days 1-3)
Critical security issues only. No new features until resolved.

#### Phase 1: Foundation (Week 1)
Address root causes that enable other fixes:
- Input validation
- Error handling patterns
- Logging infrastructure
- Database foundations

#### Phase 2: Security & Compliance (Week 2)
With foundation in place, fix security:
- Authentication hardening
- Data protection
- Compliance gaps

#### Phase 3: Performance & Reliability (Week 3)
Optimize and stabilize:
- Database optimization
- Caching implementation
- Monitoring setup

#### Phase 4: Quality & Polish (Week 4+)
Improve developer and user experience:
- Code quality improvements
- Documentation
- UI/UX enhancements
- Testing coverage

### Roadmap Template

```markdown
## Remediation Roadmap

### Phase 0: Critical (Immediate)
**Goal:** Eliminate security risks
**Duration:** 1-3 days
**Team:** Senior + Security

| # | Task | From | Effort | Blocks |
|---|------|------|--------|--------|
| 1 | Fix SQL injection in search | Security | 2h | - |
| 2 | Add CSRF protection | Security | 4h | - |

### Phase 1: Foundation (Week 1)
**Goal:** Enable subsequent fixes
**Duration:** 1 week
**Team:** Full team

| # | Task | From | Effort | Blocks |
|---|------|------|--------|--------|
| 1 | Input validation framework | Backend, Security | 1d | Auth fixes, API work |
| 2 | Standardize error handling | Code Quality | 2d | UX improvements |

### Phase 2: Security (Week 2)
**Goal:** Comprehensive security hardening
**Duration:** 1 week
**Blocked by:** Phase 1 completion

| # | Task | From | Effort | Blocks |
|---|------|------|--------|--------|

### Phase 3: Performance (Week 3)
...

### Phase 4: Polish (Week 4+)
...
```

---

## Phase 5: Integrated Report Output

### Output Files

The integration phase produces three files:

**1. `00-executive-summary.md` (Enhanced)**
- Updated with cross-referenced insights
- Systemic patterns highlighted
- Dependency-aware recommendations

**2. `00-priority-matrix.md` (Enhanced)**
- Corroboration column added
- Dependencies noted
- Grouped by remediation phase

**3. `00-remediation-roadmap.md` (New)**
- Full dependency graph
- Phased remediation plan
- Parallel work opportunities
- Risk reduction timeline

### Executive Summary Additions

Add these sections to the executive summary:

```markdown
## Cross-Domain Insights

### Issues Flagged by Multiple Consultants
{Corroboration matrix - top items}

### Systemic Patterns Identified
{2-3 major patterns with brief description}

### Dependency Alert
{Critical dependencies that affect remediation order}

## Recommended Approach

Instead of tackling findings by severity alone, we recommend:

1. **Phase 0** - {critical items}
2. **Phase 1** - {foundation items}
3. **Phase 2** - {security items}
4. **Phase 3** - {performance items}
5. **Phase 4** - {polish items}

See `00-remediation-roadmap.md` for detailed sequencing.
```

---

## Integration Checklist

Before finalizing the integrated report:

- [ ] Read all 18 individual assessment files
- [ ] Extract all findings with their severity levels
- [ ] Identify findings mentioned by 2+ consultants
- [ ] Look for systemic patterns (concentrated issues, missing foundations)
- [ ] Map dependencies between fixes
- [ ] Sequence fixes respecting dependencies
- [ ] Identify parallelization opportunities
- [ ] Update executive summary with cross-domain insights
- [ ] Update priority matrix with corroboration and dependencies
- [ ] Create remediation roadmap with phased approach

---

## Key Principles

1. **Root causes over symptoms** - Find the foundation issues first
2. **Corroboration signals importance** - Multiple consultants = systemic issue
3. **Dependencies determine order** - Don't fight the dependency graph
4. **Quick wins build momentum** - Include some easy early successes
5. **Security before features** - Never ship insecure code for speed
