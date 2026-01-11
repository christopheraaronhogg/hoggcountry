---
description: 🎨 ULTRATHINK UI Design Review - Deep visual design audit with AI slop detection using frontend-design principles
---

# ULTRATHINK: UI/Visual Design Assessment

ultrathink - Invoke the **ui-design-consultant** subagent for comprehensive visual design evaluation using the **frontend-design** skill's principles as the evaluation framework, with specific "AI slop" pattern detection.

## Output Location

**Targeted Reviews:** When a specific page/feature is provided, save to:
`./audit-reports/{target-slug}/ui-design-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/ui-design-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Art Studio page` → `art-studio`
- `Cart and Checkout` → `cart-checkout`
- `Admin Dashboard` → `admin-dashboard`
- `Welcome/Landing page` → `welcome`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### Typography
- Font choices (flags: Inter, Roboto, Open Sans, Arial, Space Grotesk)
- Font pairing quality (display + body contrast)
- Weight usage (extremes like 200/800 vs timid 400/500)
- Size scale (bold 3x jumps vs small 1.5x increments)
- Recommends: Clash Display, Satoshi, Playfair Display, IBM Plex, Bricolage Grotesque, etc.

### Color & Theme
- Flags purple gradients on white (classic AI slop)
- Evaluates dominant + sharp accent vs wishy-washy palettes
- Checks for clear aesthetic direction commitment
- Assesses mood/tone match to purpose

### Motion & Animation
- Page load orchestration (staggered reveals)
- Micro-interactions (hover, focus, transitions)
- Surprise & delight moments
- CSS-first approach, 60fps performance

### Spatial Composition
- Grid consistency (8px system)
- Negative space intentionality
- Layout interest (asymmetry, overlap, grid-breaking)
- Visual flow and responsive adaptation
- **CRITICAL: Spacing issues, cramped layouts, poor alignment**

### Visual Details
- Backgrounds with atmosphere (vs plain white)
- Shadows, textures, grain overlays
- Decorative elements, borders
- Overall polish level

### AI Slop Detection (16-point checklist)
- Generic fonts, purple gradients, generic blue
- Cookie-cutter layouts, no motion
- Plain backgrounds, generic shadows
- "Could be any app" syndrome

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-quick`, `/audit-frontend`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ UI Design Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal UI design assessment to the appropriate path with:
- **Visual Design Grade (A-F)**
- **AI Slop Score (X/16 flags)**
- Detailed category scores (Typography, Color, Motion, etc.)
- **Specific spacing/composition issues with file:line references**
- Specific CSS code recommendations
- Before/after guidance for priority fixes
- Design token audit (colors, fonts, spacing found)

**Be BRUTALLY HONEST about spacing issues. A pretty color scheme doesn't excuse poor composition.**

**Evaluate with a designer's eye. Flag every AI slop pattern. Provide specific CSS fixes.**

## ADN-Specific Guidelines

Reference DESIGN_SYSTEM.md:
- Gold accent #ffcd00
- rounded-2xl for cards
- Dark mode with useAppearance()
- Fraunces display font
- Instrument Sans body font
