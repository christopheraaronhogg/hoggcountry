# Example: Component Design Flow

Using explore-concepts to design a reusable component with multiple aesthetic options.

## User Request

> "Create a stats card component for displaying key metrics"

## Phase 1: Context Gathering

```
Reading DESIGN_SYSTEM.md...
Finding similar components...
  - resources/js/components/admin/AdminStatusBadge.tsx
  - resources/js/components/ui/card.tsx
Reading those files for patterns...
```

**Extracted Context:**
- Components use forwardRef pattern
- Props interface with TypeScript
- cn() utility for className merging
- Consistent prop naming (isDark, variant, size)

## Phase 2: Direction Discovery

```
Task(
  model: "haiku",
  prompt: "Generate 3 directions for: 'stats card component for key metrics'..."
)
```

**3 Directions Generated:**

### 1. Industrial Gauge Display
- **Metaphor**: Mechanical pressure gauges in a factory control room
- **Key Traits**:
  - Circular progress indicator
  - Monospace readout font
  - Industrial color palette (dark steel, warning amber)
  - Subtle ticking animation on value change
- **Prioritizes**: Real-time monitoring feel, industrial aesthetic
- **Sacrifices**: Soft/friendly appearance, text-heavy labels

### 2. Editorial Metric Card
- **Metaphor**: Magazine sidebar with a featured statistic callout
- **Key Traits**:
  - Large hero number with serif accent
  - Subtle background gradient
  - Generous padding, refined typography
  - Optional trend indicator arrow
- **Prioritizes**: Elegance, presentation quality, readability
- **Sacrifices**: Density, real-time feel, compact layouts

### 3. Playful Tile Counter
- **Metaphor**: Colorful scoreboard at an arcade or game
- **Key Traits**:
  - Rounded corners, vibrant accent colors
  - Animated number counting up
  - Icon prominently displayed
  - Subtle bounce on hover
- **Prioritizes**: Engagement, delight, gamification
- **Sacrifices**: Professional seriousness, data density

## Phase 3: Parallel Implementation

```
// Launch 3 Opus agents in parallel
Task(description: "Gauge component", model: "opus", ...)
Task(description: "Editorial component", model: "opus", ...)
Task(description: "Playful component", model: "opus", ...)
```

**Each returns a complete component with:**
- TypeScript interface for props
- Component implementation
- Usage examples
- Variants (sizes, colors)

## Phase 4: Selection

```
I've generated 3 stats card component directions:

**1. Industrial Gauge Display**
```tsx
<StatsGauge
  value={847}
  max={1000}
  label="Orders"
  variant="warning"
/>
```
Circular gauge with mechanical feel.

**2. Editorial Metric Card**
```tsx
<MetricCard
  value="$24,847"
  label="Revenue"
  trend="+12%"
  trendDirection="up"
/>
```
Elegant typography, magazine-quality presentation.

**3. Playful Tile Counter**
```tsx
<StatsTile
  value={156}
  label="Happy Customers"
  icon={<SmileIcon />}
  color="emerald"
  animate
/>
```
Colorful, animated, gamified feel.

Which direction would you like?
```

## Phase 5: Implementation

User: "I want the Editorial style but with the trend animation from Playful"

```
I can combine those elements! Implementing Editorial Metric Card
with animated trend indicator...

Writing resources/js/components/ui/MetricCard.tsx...

The component now has:
- Editorial typography and layout
- Animated count-up on value changes
- Smooth trend indicator animation
- All original variants preserved
```

**Component Code (condensed):**

```tsx
interface MetricCardProps {
  value: string | number;
  label: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  animate?: boolean;
  isDark?: boolean;
}

export function MetricCard({
  value,
  label,
  trend,
  trendDirection = 'neutral',
  animate = true,
  isDark = false,
}: MetricCardProps) {
  // Animated number display
  const displayValue = useAnimatedValue(value, animate);

  return (
    <div className={cn(
      'rounded-2xl p-6',
      isDark
        ? 'bg-neutral-900 border border-neutral-800'
        : 'bg-white border border-neutral-200 shadow-sm'
    )}>
      <div className={cn(
        'text-sm font-medium',
        isDark ? 'text-neutral-400' : 'text-neutral-500'
      )}>
        {label}
      </div>
      <div className={cn(
        'mt-2 text-3xl font-bold tracking-tight',
        isDark ? 'text-white' : 'text-neutral-900'
      )}>
        {displayValue}
      </div>
      {trend && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'mt-2 text-sm font-medium flex items-center gap-1',
            trendDirection === 'up' && 'text-emerald-500',
            trendDirection === 'down' && 'text-red-500',
            trendDirection === 'neutral' && (isDark ? 'text-neutral-400' : 'text-neutral-500')
          )}
        >
          <TrendIcon direction={trendDirection} />
          {trend}
        </motion.div>
      )}
    </div>
  );
}
```

## Variations Example

User: "Show me more dramatic variations"

**Variations Generated:**

1. **Luxury Gold Accent**
   - Gold (#ffcd00) border accent
   - Premium feel with subtle gradients

2. **Data Terminal**
   - Monospace font
   - Green-on-black terminal aesthetic

3. **Glass Card**
   - Frosted glass effect with blur
   - Floating appearance with shadow

User can pick or combine elements.
