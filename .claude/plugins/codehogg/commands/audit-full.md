---
description: 🚀 ULTRATHINK Enterprise Audit - All 18 consultants in 4 bundle-aligned waves for comprehensive codebase analysis
---

# Full Enterprise Audit (Batched by Bundle)

Run all 18 consultant subagents in **4 sequential waves aligned with our domain bundles** to avoid context overflow while maintaining parallel efficiency within each wave.

## Why Bundle-Aligned Waves?

1. **Self-documenting** - Each wave IS a bundle (`/audit-quality`, `/audit-backend`, etc.)
2. **Recoverable** - If a wave fails, re-run just that bundle command
3. **Logical flow** - Architecture → Implementation → Operations → User Experience
4. **Smaller waves** - Max 5 consultants per wave (balanced parallelism)

## Wave Structure

### Wave 1: Quality Bundle (3 consultants)
*Understand the structure first*

| Consultant | Focus | Command |
|------------|-------|---------|
| architect-consultant | System structure, modularity | `/audit-architecture` |
| code-quality-consultant | Tech debt, maintainability | `/audit-code` |
| product-consultant | Requirements, scope | `/audit-requirements` |

### Wave 2: Backend Bundle (5 consultants)
*Core application, data layer, security, compliance*

| Consultant | Focus | Command |
|------------|-------|---------|
| backend-consultant | API, services, data access | `/audit-api` |
| database-consultant | Schema, queries, indexes | `/audit-database` |
| stack-consultant | Framework best practices (live research) | `/audit-stack` |
| security-consultant | OWASP, vulnerabilities | `/audit-security` |
| compliance-consultant | GDPR, CCPA, privacy | `/audit-compliance` |

### Wave 3: Ops Bundle (5 consultants)
*Deployment, testing, costs, observability*

| Consultant | Focus | Command |
|------------|-------|---------|
| devops-consultant | CI/CD, infrastructure | `/audit-devops` |
| cost-consultant | Cloud costs, FinOps | `/audit-cost` |
| docs-consultant | Documentation coverage | `/audit-docs` |
| qa-consultant | Testing strategy, coverage | `/audit-qa` |
| observability-consultant | Logging, monitoring, APM | `/audit-observability` |

### Wave 4: Frontend Bundle (5 consultants)
*User-facing polish, SEO*

| Consultant | Focus | Command |
|------------|-------|---------|
| ui-design-consultant | Visual design, AI slop | `/audit-ui` |
| ux-consultant | Usability, accessibility | `/audit-ux` |
| copy-consultant | Voice, content, microcopy | `/audit-copy` |
| performance-consultant | Bottlenecks, Core Web Vitals | `/audit-performance` |
| seo-consultant | Technical SEO, meta tags | `/audit-seo` |

## Execution Protocol

### Step 1: Create Report Directory
```bash
mkdir -p audit-reports/$(date +%Y%m%d-%H%M%S)
```

### Step 2: Wave 1 - Quality Bundle
Launch 3 consultants in parallel with `run_in_background: true`:
```
architect-consultant → writes to {dir}/01-architecture-assessment.md
code-quality-consultant → writes to {dir}/02-code-quality-assessment.md
product-consultant → writes to {dir}/03-requirements-assessment.md
```

**Wait for all 3 to complete before proceeding.**

### Step 3: Wave 2 - Backend Bundle
Launch 5 consultants:
```
backend-consultant → writes to {dir}/04-backend-assessment.md
database-consultant → writes to {dir}/05-database-assessment.md
stack-consultant → writes to {dir}/06-stack-assessment.md
security-consultant → writes to {dir}/07-security-assessment.md
compliance-consultant → writes to {dir}/08-compliance-assessment.md
```

**Wait for all 5 to complete before proceeding.**

### Step 4: Wave 3 - Ops Bundle
Launch 5 consultants:
```
devops-consultant → writes to {dir}/09-devops-assessment.md
cost-consultant → writes to {dir}/10-cost-assessment.md
docs-consultant → writes to {dir}/11-documentation-assessment.md
qa-consultant → writes to {dir}/12-qa-assessment.md
observability-consultant → writes to {dir}/13-observability-assessment.md
```

**Wait for all 5 to complete before proceeding.**

### Step 5: Wave 4 - Frontend Bundle
Launch final 5 consultants:
```
ui-design-consultant → writes to {dir}/14-ui-design-assessment.md
ux-consultant → writes to {dir}/15-ux-assessment.md
copy-consultant → writes to {dir}/16-copy-assessment.md
performance-consultant → writes to {dir}/17-performance-assessment.md
seo-consultant → writes to {dir}/18-seo-assessment.md
```

**Wait for all 5 to complete.**

### Step 6: Compile Executive Summary
Read all 18 report files and create:
- `00-executive-summary.md` - Combined findings
- `00-priority-matrix.md` - All recommendations ranked

## Minimal Return Pattern

**CRITICAL:** Each consultant must:
1. Write full report directly to their designated file
2. Return ONLY a brief status (not the full report):

```
✓ Complete. Saved to {filepath}
  Critical: X | High: Y | Medium: Z
  Key: {one-line summary of top finding}
```

This prevents context overflow between waves.

## Output Structure

```
audit-reports/{timestamp}/
├── 00-executive-summary.md       # Compiled after all waves
├── 00-priority-matrix.md         # All findings ranked
│
├── # Wave 1: Quality Bundle (3)
├── 01-architecture-assessment.md
├── 02-code-quality-assessment.md
├── 03-requirements-assessment.md
│
├── # Wave 2: Backend Bundle (5)
├── 04-backend-assessment.md
├── 05-database-assessment.md
├── 06-stack-assessment.md
├── 07-security-assessment.md
├── 08-compliance-assessment.md
│
├── # Wave 3: Ops Bundle (5)
├── 09-devops-assessment.md
├── 10-cost-assessment.md
├── 11-documentation-assessment.md
├── 12-qa-assessment.md
├── 13-observability-assessment.md
│
├── # Wave 4: Frontend Bundle (5)
├── 14-ui-design-assessment.md
├── 15-ux-assessment.md
├── 16-copy-assessment.md
├── 17-performance-assessment.md
└── 18-seo-assessment.md
```

## Recovery

If a wave fails, you can re-run just that bundle:
- Wave 1 failed? Run `/audit-quality`
- Wave 2 failed? Run `/audit-backend`
- Wave 3 failed? Run `/audit-ops`
- Wave 4 failed? Run `/audit-frontend`

## Executive Summary Format

After all waves complete, compile `00-executive-summary.md`:

1. **Overall Health Score** (1-10)
2. **Critical Issues** (must fix immediately)
3. **High Priority** (fix soon)
4. **Key Strengths** (what's working well)
5. **Top 10 Recommendations** (across all domains)
6. **Quick Wins** (easy improvements)
7. **Strategic Initiatives** (longer-term)

## Priority Matrix Format

The `00-priority-matrix.md` ranks ALL findings:

| Priority | Domain | Issue | Effort | Impact |
|----------|--------|-------|--------|--------|
| P0 | Security | SQL injection in... | Low | Critical |
| P0 | Performance | N+1 query in... | Medium | High |
| P1 | Architecture | Circular dependency... | High | High |

## Alternative Commands

- `/audit-quick` - 7 consultants in 2 waves (faster)
- `/audit-full-sequential` - One at a time (safest)
- `/audit-frontend` - UI, UX, Copy, Performance only
- `/audit-backend` - Backend, Database, Stack, Security only
- `/audit-ops` - DevOps, Cost, Docs, QA only
- `/audit-quality` - Architecture, Code Quality, Requirements only
