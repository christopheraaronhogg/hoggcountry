# Subagent Prompt Template

This template is used to construct prompts for the parallel Opus subagents that generate each direction.

## Template Structure

```
You are implementing ONE conceptual direction for a user request.

## Original Request
"{original_request}"

## Your Assigned Direction: {direction_name}

### Metaphor
{direction_metaphor}

### Key Traits to Embody
{direction_traits}

### This Direction Prioritizes
{prioritizes}

### This Direction Sacrifices
{sacrifices}

---

## Codebase Context

### Design System (from DESIGN_SYSTEM.md)
{design_system_excerpt}

### Similar Existing Files
{similar_files_content}

### Available Components
{component_list}

---

## Implementation Requirements

1. **Follow the direction metaphor** - Every design decision should reflect the physical metaphor
2. **Use existing patterns** - Match the coding style of similar files in this codebase
3. **Apply design tokens** - Use the color system, spacing, and typography from the project's design system
4. **Support dark mode** - If the project uses dark mode, follow its patterns
5. **Use brand accent colors** - Apply the project's primary accent color for CTAs
6. **Keep it production-ready** - This code should work when copied into the codebase

### Dark Mode Pattern (if applicable)
Follow whatever dark mode pattern the project uses. Common patterns include:
- CSS custom properties with `prefers-color-scheme`
- React context with `useTheme()` or similar hooks
- Tailwind `dark:` variant classes
- Class toggle on `<html>` or `<body>`

### Page Structure
Follow the project's existing page structure patterns. Check:
- Existing pages for layout wrappers
- Routing conventions (Next.js app router, pages router, React Router, etc.)
- Head/meta management approach

---

## Output Format

Return ONLY code blocks. No explanations or commentary.

Structure your response following the project's file conventions:

### FILE: {appropriate path based on project structure}
```tsx
// Complete implementation
```

### FILE: {component path if needed}
```tsx
// Component implementation
```

### ROUTE (if manual route configuration needed)
```
// Route configuration in project's routing system
```

---

## Quality Checklist

Before outputting, verify:
- [ ] Metaphor is consistently applied throughout
- [ ] Dark mode works with conditional classes
- [ ] Uses existing UI components where appropriate
- [ ] Follows TypeScript patterns from similar files
- [ ] No placeholder content - real, usable UI
- [ ] Responsive considerations included
```

## Variable Substitution

When constructing the prompt, substitute these variables:

| Variable | Source |
|----------|--------|
| `{original_request}` | User's original request verbatim |
| `{direction_name}` | The 2-4 word direction name |
| `{direction_metaphor}` | Physical metaphor description |
| `{direction_traits}` | Bulleted list of key traits |
| `{prioritizes}` | What this direction does well |
| `{sacrifices}` | What this direction deprioritizes |
| `{design_system_excerpt}` | Relevant sections from DESIGN_SYSTEM.md |
| `{similar_files_content}` | Code from 2-3 similar existing files |
| `{component_list}` | Available UI components with brief descriptions |

## Context Gathering

Before spawning subagents, the main agent should gather:

### 1. Design System Context
Read `DESIGN_SYSTEM.md` (or equivalent) and extract:
- Color tokens (brand colors, accent colors, neutral scale)
- Typography patterns
- Spacing/sizing conventions
- Component patterns

### 2. Similar Files
Use Glob to find similar pages in the project:
```
Glob("src/pages/**/*.tsx")           // React/Next.js
Glob("app/**/*.tsx")                 // Next.js app router
Glob("resources/js/pages/**/*.tsx")  // Laravel/Inertia
Glob("src/views/**/*.vue")           // Vue
```

Read 2-3 of the most relevant and extract patterns.

### 3. Component Library
Identify available components in the project. Common locations:
```
src/components/ui/
components/
lib/components/
```

## Example Constructed Prompt

```
You are implementing ONE conceptual direction for a user request.

## Original Request
"Create an order analytics dashboard"

## Your Assigned Direction: Industrial Command Center

### Metaphor
Air traffic control room with radar displays and status boards. Dense information,
real-time indicators, utilitarian design with no decorative elements.

### Key Traits to Embody
- Dark background with high-contrast data visualization
- Monospace fonts for numbers, dense grid layout
- Real-time status indicators with color coding (green/yellow/red)
- Keyboard navigation support, minimal mouse requirements
- No rounded corners - sharp, industrial edges

### This Direction Prioritizes
Information density, quick scanning, professional/serious tone, power-user efficiency

### This Direction Sacrifices
Visual delight, approachability, onboarding friendliness, mobile optimization

---

## Codebase Context

### Design System
[Extracted from project's DESIGN_SYSTEM.md or equivalent]
- Dark mode patterns
- Brand accent color for CTAs
- Typography scale
- Spacing conventions

### Similar Existing Files
[Contents of similar pages showing patterns]

### Available Components
[List of components from the project's UI library]

---

## Implementation Requirements
[... rest of template ...]
```

## Variation Prompt Template

For Phase 6 (generating variations of a selected implementation):

```
You are creating a RADICAL VARIATION of an existing implementation.

## Original Request
"{original_request}"

## Selected Implementation
```tsx
{selected_code}
```

## Your Variation Direction: {variation_name}

### Variation Guidance
{variation_description}

Push this implementation in a dramatically different direction while keeping
the core functionality intact. Be bold and experimental with:
- Layout and spatial organization
- Visual density and whitespace
- Motion and interaction patterns
- Typography and color intensity

## Output Format
Return the complete modified implementation using the same file structure.
```

## Variation Direction Ideas

When generating variation directions, use more extreme metaphors:

| Base Direction | Variation Options |
|----------------|-------------------|
| Industrial Command | "Maximum Density Terminal", "Soft Industrial", "Retro CRT" |
| Editorial Spread | "Luxury Magazine", "Newspaper Urgent", "Minimalist Gallery" |
| Playful Tiles | "Arcade Celebration", "Soft Toy", "Bold Primary" |
