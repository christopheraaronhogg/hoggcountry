# Direction Generation Guidelines

How to generate evocative, distinct conceptual directions that lead to meaningfully different implementations.

## The Formula

Each direction = **Physical Metaphor** + **Visual Execution** + **Interaction Philosophy**

### 1. Physical Metaphor (What it FEELS like)

The metaphor drives all decisions. Examples:

| Request | Metaphor Options |
|---------|------------------|
| Dashboard | Control room, Magazine spread, Children's playroom |
| Data table | Accounting ledger, Filing cabinet, Spreadsheet grid |
| Settings page | Workshop toolbox, Control panel, Preferences drawer |
| Form | Paper application, Wizard conversation, Quick command |

### 2. Visual Execution (How it LOOKS)

Derived from the metaphor:

| Metaphor | Visual Execution |
|----------|------------------|
| Control room | Dark mode, dense information, status indicators, monospace fonts |
| Magazine spread | Generous whitespace, serif headlines, hero images, card layouts |
| Playroom | Bright colors, rounded corners, playful icons, animated transitions |

### 3. Interaction Philosophy (How it BEHAVES)

| Metaphor | Interaction |
|----------|-------------|
| Control room | Keyboard shortcuts, real-time updates, no unnecessary animations |
| Magazine spread | Scroll-driven, immersive reading, subtle transitions |
| Playroom | Delightful micro-interactions, celebratory feedback, forgiving errors |

## Direction Template

```json
{
  "name": "2-4 word evocative title",
  "metaphor": "Physical object or material this feels like",
  "keyTraits": [
    "Specific implementation decision 1",
    "Specific implementation decision 2",
    "Specific implementation decision 3"
  ],
  "tradeoffs": {
    "prioritizes": "What this direction does well",
    "sacrifices": "What this direction deprioritizes"
  }
}
```

## Example: Order Analytics Dashboard

### Direction 1: Industrial Command Center
```json
{
  "name": "Industrial Command Center",
  "metaphor": "Air traffic control room with radar displays and status boards",
  "keyTraits": [
    "Dark background with high-contrast data",
    "Monospace fonts for numbers, dense grid layout",
    "Real-time status indicators with color coding",
    "Keyboard navigation, no decorative elements"
  ],
  "tradeoffs": {
    "prioritizes": "Information density, quick scanning, professional feel",
    "sacrifices": "Approachability, visual delight, onboarding friendliness"
  }
}
```

### Direction 2: Editorial Data Story
```json
{
  "name": "Editorial Data Story",
  "metaphor": "Business magazine feature spread with infographics",
  "keyTraits": [
    "Generous whitespace, clear visual hierarchy",
    "Serif headlines, elegant chart styling",
    "Card-based metrics with narrative flow",
    "Scroll-driven storytelling structure"
  ],
  "tradeoffs": {
    "prioritizes": "Clarity, aesthetics, stakeholder presentation",
    "sacrifices": "Data density, power-user efficiency"
  }
}
```

### Direction 3: Playful Dashboard Tiles
```json
{
  "name": "Playful Dashboard Tiles",
  "metaphor": "Colorful children's building blocks arranged on a play mat",
  "keyTraits": [
    "Rounded corners, vibrant accent colors",
    "Large friendly icons, animated number counting",
    "Gamified progress indicators",
    "Celebratory micro-interactions on achievements"
  ],
  "tradeoffs": {
    "prioritizes": "Engagement, approachability, positive reinforcement",
    "sacrifices": "Professional gravitas, information density"
  }
}
```

## Ensuring Distinctness

The 3 directions should differ across multiple dimensions:

| Dimension | Direction 1 | Direction 2 | Direction 3 |
|-----------|-------------|-------------|-------------|
| Density | High | Medium | Low |
| Mood | Serious | Elegant | Playful |
| Color | Dark/Muted | Neutral | Bright |
| Motion | Minimal | Subtle | Animated |
| Layout | Grid | Cards | Free-form |

## Anti-Patterns

**Don't generate directions that only differ in color:**
- ❌ "Blue Dashboard" / "Green Dashboard" / "Purple Dashboard"

**Don't use vague adjectives:**
- ❌ "Modern Dashboard" / "Clean Dashboard" / "Nice Dashboard"

**Don't describe features instead of aesthetics:**
- ❌ "Dashboard with Charts" / "Dashboard with Tables" / "Dashboard with Cards"

**Do use physical metaphors:**
- ✅ "Steel Control Panel" / "Paper Notebook" / "Glass Display Case"

## Request-Specific Guidance

### For Data-Heavy Pages
Focus on information architecture:
- Dense terminal vs sparse editorial vs visual infographic

### For Form-Heavy Pages
Focus on interaction flow:
- Linear wizard vs inline editing vs conversational

### For List/Table Pages
Focus on data presentation:
- Strict ledger vs card gallery vs compact rows

### For Settings/Config Pages
Focus on organization:
- Categorized panels vs single scroll vs tabbed sections

## Generating Good Names

### Pattern: [Material/Physical] + [Arrangement/State]

Examples:
- "Industrial Steel Grid"
- "Soft Paper Stack"
- "Glass Caustic Flow"
- "Concrete Block Array"
- "Silk Ribbon Cascade"
- "Carbon Fiber Matrix"
- "Weathered Leather Fold"
- "Prismatic Glass Tiles"

### Pattern: [Physical Space] + [Characteristic]

Examples:
- "Gallery White Space"
- "Workshop Dense Tools"
- "Library Quiet Order"
- "Terminal Green Glow"
- "Studio Bright Canvas"
