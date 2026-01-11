---
description: 🎨 ULTRATHINK UI Design - Visual specs, components, design system
---

# UI Design

Invoke the **ui-design-consultant** in Design Mode for visual design planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/14-ui-design-spec.md`

## Design Considerations

### Typography
- Font selections (display, body)
- Font sizes and scale
- Font weights to use
- Line heights and spacing
- Heading hierarchy

### Color Usage
- Primary/secondary colors
- Accent colors for CTAs
- Background colors
- Text colors
- State colors (error, success, warning)
- Dark mode considerations

### Spatial Composition
- Grid system usage
- Spacing scale application
- Margin/padding patterns
- Layout structure
- Responsive breakpoints

### Component Design
- Existing components to reuse
- New components needed
- Component variants required
- State variations (hover, focus, disabled)
- Loading/skeleton states

### Visual Details
- Border radius patterns
- Shadow usage
- Texture/grain application
- Decorative elements
- Icon selection

### Motion & Animation
- Page transitions
- Micro-interactions
- Loading animations
- Feedback animations
- Performance budget for motion

### Responsive Behavior
- Mobile-first approach
- Breakpoint adaptations
- Touch target sizes
- Content reflow strategy

## Design Deliverables

1. **Visual Specifications** - Colors, typography, spacing for feature
2. **Component Usage** - Which existing components to use
3. **New Components Needed** - Any new UI patterns required
4. **Design System Extensions** - Tokens or patterns to add
5. **Responsive Behavior** - How it adapts across breakpoints
6. **Animation/Interaction** - Motion design considerations

## Output Format

Deliver UI design document with:
- **Design Token Usage** (colors, fonts, spacing values)
- **Component Inventory** (existing and new)
- **Layout Wireframes** (ASCII or description)
- **Responsive Behavior Matrix** (breakpoint × changes)
- **Animation Specifications** (timing, easing, triggers)
- **Accessibility Considerations** (contrast, focus states)

**Be specific about visual design. Reference exact design tokens and component patterns.**

## ADN-Specific Guidelines

Reference DESIGN_SYSTEM.md:
- Gold accent #ffcd00
- rounded-2xl for cards
- Dark mode with useAppearance()
- Fraunces display font
- Instrument Sans body font

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
