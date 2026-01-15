# AT Concierge Service Architecture

## Business Model

### Tier 1: Custom Guide Generator ($1)
- **Purpose**: Lead magnet, low friction entry
- **Delivery**: Personalized PDF guide generated on-demand
- **Cost**: ~$0.02 per generation (Haiku)
- **Margin**: ~98%

### Tier 2: AT Concierge (Premium)
- **Purpose**: High-value ongoing relationship
- **Delivery**: Chat interface with full tool access
- **Pricing Options**:
  - Per-conversation ($2-5 per session)
  - Monthly subscription ($10-20/month during hike)
  - Lifetime trail pass ($50-100 one-time)

---

## Tier 1: Custom Guide Generator

### Flow
```
┌─────────────────────────────────────────────────────────────┐
│                    QUIZ COMPLETION                          │
│  User answers 6 questions, gets profile preview             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT GATE                             │
│  "Get your personalized guide for $1"                       │
│  Stripe Checkout / Gumroad / LemonSqueezy                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    GENERATION API                           │
│  POST /api/generate-guide                                   │
│  {                                                          │
│    answers: { goal, experience, budget, start, gear, worry }│
│    profile: { archetype, concerns, strengths }              │
│    email: "user@example.com"                                │
│    name: "Trail Name"                                       │
│  }                                                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE HAIKU                             │
│                                                             │
│  System Prompt:                                             │
│  "You are writing a personalized AT thru-hiking guide.      │
│   The hiker is {archetype}, starting {start_timing}.        │
│   Their concerns: {concerns}. Their strengths: {strengths}. │
│   Write in second person, directly to them."                │
│                                                             │
│  Context (RAG-style):                                       │
│  - Top 5 priority chapters from master guide                │
│  - Trail facts YAML data                                    │
│  - Their specific answers                                   │
│                                                             │
│  Output: ~3000-5000 words of personalized guidance          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    PDF GENERATION                           │
│  - Markdown → PDF (puppeteer, or react-pdf)                 │
│  - Branded template with Hogg Country styling               │
│  - Table of contents, their profile card                    │
│  - QR code linking to full guide / concierge                │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    DELIVERY                                 │
│  - Email with PDF attachment                                │
│  - Download link on thank-you page                          │
│  - Upsell: "Want ongoing guidance? Try the Concierge"       │
└─────────────────────────────────────────────────────────────┘
```

### Generation Template

```markdown
# Your Personal AT Field Guide
## For {name} - {archetype}

---

**Your Profile**
- Goal: {goal_description}
- Experience: {experience_description}
- Start: {start_timing}
- Budget: {budget_approach}
- Gear Philosophy: {gear_philosophy}

**What We'll Focus On**
Based on your answers, this guide emphasizes:
1. {priority_topic_1}
2. {priority_topic_2}
3. {priority_topic_3}

---

## Before You Go
{LLM-generated intro addressing their specific situation}

## Your Gear Checklist
{LLM-generated gear recommendations based on their budget + philosophy}

## Your First Week
{LLM-generated week-1 strategy based on their experience level}

## Weather & Safety for Your Start
{LLM-generated weather content for their start timing}

## Town Strategy for Your Budget
{LLM-generated town content for their budget level}

## Your Personal Concerns Addressed
{LLM-generated content addressing their specific "worry" answer}

---

## Next Steps
- Download FarOut app
- Book your permits (if Smokies timing matters)
- Join our AT Concierge for ongoing support

[QR Code to /concierge]
```

### Cost Analysis
- Haiku input: ~10K tokens (context) = $0.0025
- Haiku output: ~4K tokens (guide) = $0.005
- **Total per guide: ~$0.01**
- At $1/guide: **99% margin**

---

## Tier 2: AT Concierge Service

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CHAT INTERFACE                           │
│  /concierge - Svelte chat UI                                │
│  Features:                                                  │
│  - Message history (IndexedDB + server sync)                │
│  - Voice input option                                       │
│  - Suggested prompts based on profile                       │
│  - "Ask about..." quick actions                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                              │
│  /api/concierge/chat                                        │
│  - Auth check (session or API key)                          │
│  - Usage metering                                           │
│  - Rate limiting                                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            CLAUDE SONNET/OPUS WITH TOOLS                    │
│                                                             │
│  System Prompt:                                             │
│  "You are an AT thru-hike concierge for {name}.             │
│   Their profile: {profile}                                  │
│   Current progress: Mile {current_mile}                     │
│   You have access to tools for trail data, weather, etc.    │
│   Be helpful, practical, and encouraging."                  │
│                                                             │
│  Tools:                                                     │
│  - search_guide(query) → relevant guide sections            │
│  - get_trail_data(mile) → shelters, water, towns nearby     │
│  - get_elevation(start_mile, end_mile) → elevation profile  │
│  - get_weather(location) → current/forecast weather         │
│  - calculate_resupply(current_mile, pace) → resupply plan   │
│  - spawn_research_agent(topic) → deep dive subagent         │
│                                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Guide RAG   │   │ Trail Data  │   │ Weather API │
│ (Embeddings │   │ (YAML +     │   │ (NWS or     │
│  + Search)  │   │  TrailHogg) │   │  OpenWeather│
└─────────────┘   └─────────────┘   └─────────────┘
```

### Tools Specification

```typescript
// Tool: search_guide
interface SearchGuideParams {
  query: string;        // Natural language query
  max_results?: number; // Default 3
}
// Returns: Array of { chapter, section, content, relevance }

// Tool: get_trail_data
interface GetTrailDataParams {
  mile: number;         // Current position
  radius?: number;      // Miles to look ahead/behind (default 10)
}
// Returns: { shelters, water_sources, towns, road_crossings }

// Tool: get_elevation
interface GetElevationParams {
  start_mile: number;
  end_mile: number;
}
// Returns: { profile: [{mile, elevation}], total_gain, total_loss }

// Tool: get_weather
interface GetWeatherParams {
  location: string;     // Town name or "Mile 234"
  days?: number;        // Forecast days (default 3)
}
// Returns: { current, forecast: [{day, high, low, conditions}] }

// Tool: calculate_resupply
interface CalculateResupplyParams {
  current_mile: number;
  daily_miles: number;  // Their pace
  days_of_food: number; // How much they're carrying
}
// Returns: { next_resupply, distance, eta, options: Town[] }

// Tool: spawn_research_agent
interface SpawnResearchAgentParams {
  topic: string;        // "best hostels in Virginia", "Whites weather patterns"
  depth: 'quick' | 'thorough';
}
// Returns: Detailed research summary from subagent
```

### Example Conversations

**User**: "I'm at mile 234, should I stay at the shelter tonight or push to town?"

**Concierge** (uses tools):
1. `get_trail_data(234, radius=15)` → finds shelter at 238, town at 242
2. `get_weather("Hot Springs")` → rain expected tomorrow
3. `get_elevation(234, 242)` → 1200ft gain to town

Response: "You're 4 miles from Hot Springs, with about 1200ft of climbing. Rain is moving in tomorrow morning. I'd recommend pushing to town tonight - you'll be dry and can zero tomorrow while the weather passes. Hot Springs has great hostels, and you've earned a real bed."

---

**User**: "What gear should I ship home from Damascus?"

**Concierge** (uses tools):
1. `search_guide("gear transition Damascus")` → finds gear chapter on seasonal transitions
2. Checks their profile (started Feb, now late April)

Response: "Based on your February start and current timing, here's what most hikers ship home from Damascus:
- [ ] Puffy jacket (nights warming up)
- [ ] Base layer bottoms (unless you sleep cold)
- [ ] Heavy gloves → swap for liner gloves
- [ ] Extra socks (you can carry fewer now)

Keep your rain gear - Virginia is wet. And hold onto the fleece until after the Grayson Highlands."

---

### Anthropic Agent SDK Integration

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// Define tools
const tools = [
  {
    name: 'search_guide',
    description: 'Search the AT Field Guide for relevant information',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        max_results: { type: 'number', description: 'Max results to return' }
      },
      required: ['query']
    }
  },
  // ... other tools
];

// Main conversation handler
async function chat(userMessage: string, context: ConversationContext) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: buildSystemPrompt(context.userProfile),
    tools,
    messages: context.history.concat([
      { role: 'user', content: userMessage }
    ])
  });

  // Handle tool use
  while (response.stop_reason === 'tool_use') {
    const toolUse = response.content.find(c => c.type === 'tool_use');
    const toolResult = await executeToolCall(toolUse);

    // Continue conversation with tool result
    response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: buildSystemPrompt(context.userProfile),
      tools,
      messages: context.history.concat([
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response.content },
        { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: toolResult }] }
      ])
    });
  }

  return response;
}
```

---

## Implementation Roadmap

### Phase 1: $1 Guide Generator (MVP)
1. [ ] Add payment gate to quiz flow (Stripe or LemonSqueezy)
2. [ ] Create API route for generation
3. [ ] Build Haiku prompt template
4. [ ] PDF generation (simple: markdown → HTML → PDF)
5. [ ] Email delivery system
6. [ ] Thank-you page with upsell

### Phase 2: Concierge Beta
1. [ ] Build chat UI component
2. [ ] Create API routes with tool use
3. [ ] Implement guide search (embeddings or keyword)
4. [ ] Implement trail data tool
5. [ ] Add basic auth/payment
6. [ ] Beta test with select users

### Phase 3: Full Concierge
1. [ ] Weather API integration
2. [ ] Subagent spawning for research
3. [ ] User progress tracking
4. [ ] Push notifications (weather alerts, resupply reminders)
5. [ ] Voice input/output
6. [ ] Mobile app wrapper (PWA)

---

## Technical Notes

### Embeddings for Guide Search
- Use `text-embedding-3-small` for guide chapters
- Store in SQLite or vector DB (Pinecone, Supabase)
- Chunk by section (~500 tokens each)
- Return top 3 chunks + surrounding context

### Trail Data Integration
- Reuse TrailHogg game data (shelters, towns, terrain zones)
- Export from game shared package
- Add water source reliability data
- Add road crossing/hitch difficulty

### Weather Integration
- NWS API (free, US-only) or OpenWeather
- Cache forecast by region (trail runs N-S through many zones)
- Alert on severe weather in user's current zone

### Authentication Options
- Simple: Magic link email + session cookie
- Better: Stripe Customer Portal for payment management
- Future: Auth0 or Clerk for full auth

### Hosting Considerations
- API routes: Netlify Functions or Vercel Edge
- Database: Supabase (auth + DB + realtime)
- PDF generation: Serverless may timeout → use Cloudflare Worker
- Chat history: IndexedDB (offline) + Supabase (sync)
