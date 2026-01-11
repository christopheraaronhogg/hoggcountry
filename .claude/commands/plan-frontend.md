---
description: 🎨 ULTRATHINK Frontend Planning - UI, UX, Copy, Performance, SEO (5 consultants)
---

# Frontend Planning (5 Consultants)

Run 5 frontend-focused consultants in **Design Mode** to plan visual design, user flows, content, performance, and SEO requirements.

## Target Feature

$ARGUMENTS

## When to Use

- User-facing features
- Design system extensions
- Content-heavy pages
- Public-facing pages (SEO important)
- Performance-critical interfaces

## Included Consultants

| Consultant | Design Output | File |
|------------|---------------|------|
| ui-design-consultant | Visual specs, components | `14-ui-design-spec.md` |
| ux-consultant | User flows, wireframes | `15-ux-flows.md` |
| copy-consultant | Content strategy, microcopy | `16-content-strategy.md` |
| performance-consultant | Performance budgets | `17-performance-budget.md` |
| seo-consultant | SEO requirements, meta tags | `18-seo-requirements.md` |

## Execution Protocol

### Step 1: Create Planning Directory
```bash
SLUG=$(echo "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
mkdir -p planning-docs/${SLUG}
```

### Step 2: Launch All 5 in Parallel
Launch with `run_in_background: true`:
- ui-design-consultant → `14-ui-design-spec.md`
- ux-consultant → `15-ux-flows.md`
- copy-consultant → `16-content-strategy.md`
- performance-consultant → `17-performance-budget.md`
- seo-consultant → `18-seo-requirements.md`

### Step 3: Compile Summary
After all complete, create:
- `00-frontend-summary.md` - Combined frontend design decisions

## Output Structure

```
planning-docs/{feature-slug}/
├── 00-frontend-summary.md
├── 14-ui-design-spec.md
├── 15-ux-flows.md
├── 16-content-strategy.md
├── 17-performance-budget.md
└── 18-seo-requirements.md
```

## Frontend Summary Format

```markdown
# Frontend Summary: {Feature Name}

## Visual Design
{Components, colors, typography from 14}

## User Experience
{Flows, wireframes, accessibility from 15}

## Content Strategy
{Messaging, microcopy, voice from 16}

## Performance Budget
{Targets, constraints from 17}

## SEO Requirements
{Meta tags, structured data from 18}

## Frontend Implementation Order
1. Create/extend UI components
2. Build page layout and routing
3. Implement user flows
4. Add content and microcopy
5. Optimize performance
6. Add SEO elements
```

## Minimal Return Pattern

Each consultant returns only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```

## Related Commands

- `/plan-foundation` - Add product spec and architecture
- `/plan-backend` - Add API, database design
- `/plan-ops` - Add deployment, testing
