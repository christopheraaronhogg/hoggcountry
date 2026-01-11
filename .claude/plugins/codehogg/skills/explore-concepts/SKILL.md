---
name: explore-concepts
description: Generate 3 distinct conceptual directions for any implementation request using parallel Opus subagents. Use when creating new pages, components, features, or making significant code changes. Presents multiple options before implementing.
---

# Explore Concepts

A generative exploration skill that creates 3 distinct implementations in parallel, letting users choose the direction that resonates before committing to code.

## Core Philosophy

**Never generate just one solution.** Always explore the solution space first:

1. Gather codebase context
2. Generate 3 conceptual directions with evocative names
3. Spawn 3 Opus subagents to implement each direction in parallel
4. Present all 3 for selection
5. Write the chosen implementation
6. Optionally explore variations

## When This Skill Activates

Use this skill when the user asks to:
- Create a new page, dashboard, or screen
- Build a new component or feature
- Design a significant UI element
- Refactor or redesign existing code

Keywords: "create", "build", "design", "implement", "make", "add"

## Phase 1: Context Gathering

Before generating anything, gather codebase context:

```
1. Read DESIGN_SYSTEM.md for tokens, colors, patterns
2. Read CLAUDE.md for voice/tone guidelines
3. Find 2-3 similar existing files using Glob
4. Read those files to understand patterns
5. Identify key components and utilities used
```

Store this context - it will be passed to all subagents.

## Phase 2: Direction Discovery

Use the Task tool with `model: "haiku"` to quickly generate 3 direction names:

```
Task(
  subagent_type: "general-purpose",
  model: "haiku",
  prompt: "Generate 3 conceptual directions for: {request}

  Each direction needs:
  - Name: 2-4 word evocative title using physical/material metaphor
  - Metaphor: What physical object/material this feels like
  - Key Traits: 3-4 specific implementation decisions
  - Tradeoffs: What this prioritizes vs sacrifices

  Use physical language - see METAPHORS.md for vocabulary.
  Return as structured JSON array."
)
```

### Direction Naming Rules

Names should evoke **physicality and material**:

| Category | Good Examples |
|----------|---------------|
| Layout | "Asymmetric Grid Tension", "Breathing White Space", "Dense Mosaic Array" |
| Surface | "Industrial Steel Plate", "Soft Paper Stock", "Glass Caustic Refraction" |
| Motion | "Kinetic Card Shuffle", "Fluid State Morphing", "Mechanical Snap Precision" |
| Data | "Terminal Data Stream", "Editorial Infographic", "Playful Stat Bubbles" |

See [METAPHORS.md](METAPHORS.md) for complete vocabulary.

## Phase 3: Parallel Implementation

**This is the key innovation.** Spawn 3 Opus subagents simultaneously using the Task tool:

```javascript
// Launch all 3 in a SINGLE message with multiple Task tool calls
Task(
  description: "Implement Direction 1",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: buildSubagentPrompt(request, direction1, context)
)
Task(
  description: "Implement Direction 2",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: buildSubagentPrompt(request, direction2, context)
)
Task(
  description: "Implement Direction 3",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: buildSubagentPrompt(request, direction3, context)
)
```

### Subagent Prompt Template

Each subagent receives (see [SUBAGENT_PROMPT.md](SUBAGENT_PROMPT.md)):

```
You are implementing ONE conceptual direction for: "{original_request}"

## Your Direction: {direction_name}
{direction_description}

## Codebase Context
{design_system_excerpt}
{similar_file_patterns}
{component_library_info}

## Implementation Requirements
- Create a complete, working implementation
- Follow the project's design system tokens and patterns
- Use existing components from the project's UI library
- Support dark mode if the project uses it
- Use brand accent colors for CTAs
- Match the coding style of similar files in the project

## Output Format
Return ONLY the code. No explanations. Structure as:

### FILE: {filepath}
```tsx
{code}
```

### ROUTE: {route_to_add} (if applicable)
```

## Phase 4: Selection

Once all 3 subagents complete, present results using AskUserQuestion:

```
I've generated 3 distinct implementations. Here's a summary:

**1. {Direction 1 Name}**
{Brief description of what makes this unique}
Files: {list of files that would be created}

**2. {Direction 2 Name}**
{Brief description of what makes this unique}
Files: {list of files that would be created}

**3. {Direction 3 Name}**
{Brief description of what makes this unique}
Files: {list of files that would be created}

AskUserQuestion(
  questions: [{
    question: "Which direction would you like to implement?",
    header: "Direction",
    options: [
      { label: direction1.name, description: "..." },
      { label: direction2.name, description: "..." },
      { label: direction3.name, description: "..." },
      { label: "Show all code", description: "See full implementation for all 3" }
    ]
  }]
)
```

## Phase 5: Implementation

Based on selection:

### If user picks one direction:
1. Write all files from that direction
2. Add route to routes/web.php if needed
3. Run `npm run types` to verify TypeScript
4. Run `npm run build` to verify build
5. Commit with descriptive message

### If user wants to see all code:
1. Display all 3 implementations in a comparison view
2. Allow user to pick specific elements from different directions
3. Combine as requested

## Phase 6: Variation Exploration (Optional)

If user says "show me variations" or "explore more options" after selection:

Spawn 3 more Opus subagents, each creating a **radical variation** of the selected implementation:

```
You are creating a RADICAL VARIATION of an existing implementation.

## Original Implementation:
{selected_implementation_code}

## Your Variation Direction: {variation_name}
Push this implementation in a dramatically different direction while
keeping the core functionality. Be bold and experimental.

## Output Format
Return the complete modified implementation.
```

Variation directions should be more extreme:
- "Maximalist Density" - Pack in more information
- "Brutalist Reduction" - Strip to bare essentials
- "Kinetic Animation" - Add motion and transitions
- "Retro Terminal" - Nostalgic computing aesthetic

## Project-Specific Guidelines

Adapt to your project's structure by reading its configuration files:

### File Locations

Check your project for common patterns:
- **React/Next.js**: `src/pages/`, `src/components/`, `app/`
- **Laravel/Inertia**: `resources/js/pages/`, `resources/js/components/`
- **Vue**: `src/views/`, `src/components/`
- **Generic**: `src/`, `lib/`, `components/`

### Required Context

Before generating, always read:
1. `DESIGN_SYSTEM.md` or equivalent design documentation
2. `CLAUDE.md` or project-specific guidelines
3. Existing similar files to match patterns

### Design Tokens

Reference your project's design system for:
- Brand colors and accent colors
- Border radius conventions
- Shadow usage patterns
- Typography scale
- Spacing tokens

## Error Handling

If a subagent fails:
- Continue with the other 2 directions
- Note the failure to the user
- Offer to retry the failed direction

If all 3 fail:
- Fall back to single-direction generation
- Explain the issue to the user

## Example Flows

See the `examples/` directory for complete flows:
- [Page Generation](examples/page-generation.md)
- [Component Design](examples/component-design.md)
- [Feature Implementation](examples/feature-implementation.md)
