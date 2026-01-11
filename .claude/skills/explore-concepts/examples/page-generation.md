# Example: Page Generation Flow

A complete walkthrough of using the explore-concepts skill to create a new page.

## User Request

> "Create a customer invoice management page"

## Phase 1: Context Gathering

The main agent reads relevant files:

```
Reading DESIGN_SYSTEM.md... (design tokens, patterns)
Reading CLAUDE.md... (voice/tone guidelines)
Finding similar pages...
  - resources/js/pages/admin/orders.tsx (order management patterns)
  - resources/js/pages/admin/payments.tsx (financial data patterns)
Reading those files for patterns...
```

**Extracted Context Summary:**
- Uses AppHeaderLayout with breadcrumbs
- Dark mode via useAppearance() hook
- Gold accent #ffcd00 for CTAs
- Table patterns from orders.tsx
- Financial formatting from payments.tsx

## Phase 2: Direction Discovery

Main agent spawns a Haiku task:

```
Task(
  description: "Generate invoice page directions",
  subagent_type: "general-purpose",
  model: "haiku",
  prompt: "Generate 3 conceptual directions for: 'customer invoice management page'..."
)
```

**Result: 3 Directions**

### 1. Accounting Ledger Precision
- **Metaphor**: Traditional accountant's ledger book with ruled lines and precise columns
- **Key Traits**:
  - Strict tabular layout with alternating row tints
  - Monospace numbers, right-aligned currency
  - Ruled horizontal lines between rows
  - Status stamps (PAID, PENDING, OVERDUE) like rubber stamps
- **Prioritizes**: Accuracy, scanability, professional finance aesthetic
- **Sacrifices**: Modern feel, visual delight, mobile optimization

### 2. Document Stack Overview
- **Metaphor**: Stack of physical invoices on a desk, each visible as a card
- **Key Traits**:
  - Cards that look like paper documents with subtle shadows
  - Visible invoice header info (number, date, amount)
  - Expandable cards to show line items
  - Drag-to-organize capability
- **Prioritizes**: Visual clarity, document feel, quick overview
- **Sacrifices**: Data density, bulk operations

### 3. Financial Dashboard Flow
- **Metaphor**: Modern fintech app dashboard with real-time metrics
- **Key Traits**:
  - Summary cards at top (total outstanding, paid this month)
  - Status-based filtering with colored badges
  - Progress bars for partial payments
  - Quick action buttons inline
- **Prioritizes**: Actionable insights, modern feel, workflow efficiency
- **Sacrifices**: Traditional finance aesthetic, detailed line items

## Phase 3: Parallel Implementation

Main agent spawns 3 Opus subagents **simultaneously** (single message, 3 Task calls):

```
// All 3 launched in parallel
Task(
  description: "Implement Ledger direction",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: buildSubagentPrompt(request, direction1, context)
)

Task(
  description: "Implement Document direction",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: buildSubagentPrompt(request, direction2, context)
)

Task(
  description: "Implement Dashboard direction",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: buildSubagentPrompt(request, direction3, context)
)
```

Each subagent returns complete implementation code.

## Phase 4: Selection

Main agent presents all 3:

```
I've generated 3 distinct invoice management page implementations:

**1. Accounting Ledger Precision**
Traditional ledger-style table with ruled lines, monospace numbers,
and status stamps. Professional finance aesthetic.
→ Files: invoices.tsx (single page with table component)

**2. Document Stack Overview**
Paper document cards with shadows and expandable details.
Visual, tactile feel like handling real invoices.
→ Files: invoices.tsx + InvoiceCard.tsx component

**3. Financial Dashboard Flow**
Modern fintech dashboard with summary metrics, status filters,
and inline actions. Data-forward with quick workflows.
→ Files: invoices.tsx + InvoiceSummaryCards.tsx

Which direction would you like to implement?
```

```
AskUserQuestion(
  questions: [{
    question: "Which invoice page direction would you like?",
    header: "Direction",
    options: [
      { label: "Accounting Ledger Precision", description: "Traditional table, professional" },
      { label: "Document Stack Overview", description: "Card-based, visual" },
      { label: "Financial Dashboard Flow", description: "Modern, metrics-focused" },
      { label: "Show all code", description: "Compare all 3 implementations" }
    ]
  }]
)
```

## Phase 5: Implementation

User selects "Financial Dashboard Flow":

```
Implementing Financial Dashboard Flow direction...

Writing resources/js/pages/admin/invoices.tsx...
Writing resources/js/components/admin/InvoiceSummaryCards.tsx...
Adding route to routes/web.php...

Running npm run types... ✓
Running npm run build... ✓

Done! The invoice management page is ready at /admin/invoices
```

## Phase 6: Variation (Optional)

User: "I like it but can you show me some variations?"

```
Generating 3 variations of the Financial Dashboard Flow...

Task(description: "Variation: Maximum Metrics", model: "opus", ...)
Task(description: "Variation: Minimalist Focus", model: "opus", ...)
Task(description: "Variation: Action-Heavy", model: "opus", ...)
```

**Variations Generated:**

1. **Maximum Metrics Density**
   - More summary cards, sparkline charts, comparative data

2. **Minimalist Focus**
   - Fewer elements, more whitespace, essential info only

3. **Action-Heavy Workflow**
   - Bulk selection, quick payment recording, batch operations

User can select a variation or mix elements from different versions.

## Final Commit

```
git commit -m "feat(admin): add invoice management page

Implements the Financial Dashboard Flow direction with:
- Summary metric cards (outstanding, paid, overdue)
- Status-filtered invoice table
- Inline quick actions
- Dark mode support

Generated using explore-concepts skill with 3 parallel Opus agents.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```
