---
description: 🎨 ULTRATHINK Frontend Audit - UI, UX, Copy, Performance, SEO (5 consultants in parallel)
---

# Frontend Audit Bundle

Run 5 frontend-focused consultants in parallel for comprehensive user-facing quality assessment.

## Included Consultants

| Consultant | Focus |
|------------|-------|
| **ui-design-consultant** | Visual design, AI slop detection, design system |
| **ux-consultant** | Usability, accessibility, user flows |
| **copy-consultant** | Voice, content quality, microcopy |
| **performance-consultant** | Frontend bottlenecks, Core Web Vitals |
| **seo-consultant** | Technical SEO, meta tags, structured data |

## When to Use

- Pre-launch frontend polish check
- After major UI/UX changes
- Evaluating user-facing quality
- Design system compliance audit
- Accessibility review

## Output Location

**Targeted Reviews:** When a specific page/feature is provided, save to:
`./audit-reports/{target-slug}/`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/frontend-audit-{timestamp}/`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Art Studio page` → `art-studio`
- `Cart and Checkout` → `cart-checkout`
- `Welcome page` → `welcome`

## Target
$ARGUMENTS

## Execution Protocol

### Step 1: Create Report Directory
```bash
# For targeted:
mkdir -p audit-reports/{target-slug}

# For full:
mkdir -p audit-reports/frontend-audit-$(date +%Y%m%d-%H%M%S)
```

### Step 2: Launch All 5 in Parallel
Launch with `run_in_background: true`:
```
ui-design-consultant → writes to {dir}/ui-design-assessment.md
ux-consultant → writes to {dir}/ux-assessment.md
copy-consultant → writes to {dir}/copy-assessment.md
performance-consultant → writes to {dir}/performance-assessment.md
seo-consultant → writes to {dir}/seo-assessment.md
```

### Step 3: Wait and Compile
After all 5 complete, create:
- `00-frontend-summary.md` - Combined frontend findings

## Minimal Return Pattern

**CRITICAL:** Each consultant must:
1. Write full report directly to their designated file
2. Return ONLY a brief status:

```
✓ Complete. Saved to {filepath}
  Critical: X | High: Y | Medium: Z
  Key: {one-line summary}
```

## Output Structure

```
audit-reports/{dir}/
├── 00-frontend-summary.md       # Combined findings
├── ui-design-assessment.md
├── ux-assessment.md
├── copy-assessment.md
├── performance-assessment.md
└── seo-assessment.md
```

## Frontend Summary Format

The `00-frontend-summary.md` should include:

1. **Frontend Quality Score** (1-10)
2. **Visual Design Grade** (A-F)
3. **Accessibility Score** (1-10)
4. **AI Slop Flags** (count)
5. **Critical UX Issues**
6. **Performance Bottlenecks**
7. **SEO Health Score** (1-10)
8. **Top 5 Frontend Actions**

## Related Commands

- `/audit-ui` - Visual design only
- `/audit-ux` - Usability only
- `/audit-copy` - Content only
- `/audit-performance` - Full performance (includes backend)
- `/audit-seo` - Technical SEO only
- `/audit-quick` - Adds architecture, security, code quality
