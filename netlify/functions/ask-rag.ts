import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Trail-specific vocabulary expansions
const TRAIL_SYNONYMS: Record<string, string[]> = {
  'permit': ['permits', 'reservation', 'reservations', 'registration', 'backcountry'],
  'water': ['stream', 'spring', 'creek', 'river', 'filter', 'treatment', 'hydration'],
  'shelter': ['shelters', 'lean-to', 'hut', 'hostel', 'camping', 'tent', 'campsite'],
  'gear': ['equipment', 'pack', 'backpack', 'tent', 'sleeping', 'bag', 'clothing'],
  'food': ['resupply', 'nutrition', 'calories', 'meals', 'snacks', 'cooking', 'stove'],
  'emergency': ['rescue', '911', 'ranger', 'help', 'injury', 'evacuation', 'safety'],
  'weather': ['rain', 'snow', 'cold', 'heat', 'storm', 'lightning', 'temperature'],
  'smokies': ['smoky', 'gsmnp', 'great smoky', 'clingmans'],
  'baxter': ['katahdin', 'maine', 'finish', 'terminus'],
  'springer': ['georgia', 'start', 'amicalola', 'approach'],
};

// Extract keywords with synonym expansion
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  const expanded = new Set(words);
  for (const word of words) {
    // Add synonyms
    for (const [key, syns] of Object.entries(TRAIL_SYNONYMS)) {
      if (word.includes(key) || syns.some(s => word.includes(s))) {
        expanded.add(key);
        syns.forEach(s => expanded.add(s));
      }
    }
  }
  return Array.from(expanded);
}

// Chunk by sections (--- separators or double newlines with headers)
function chunkGuide(guide: string): Array<{text: string, title: string}> {
  if (!guide || guide.length < 100) return [];
  
  // Split by --- separators (our guide format)
  const sections = guide.split(/\n---\n/).filter(s => s.trim().length > 50);
  
  return sections.map(section => {
    // Extract title from first line if it's a header
    const lines = section.trim().split('\n');
    const firstLine = lines[0] || '';
    const title = firstLine.startsWith('#') 
      ? firstLine.replace(/^#+\s*/, '').trim()
      : 'Section';
    return { text: section.trim(), title };
  });
}

// Score chunk with TF-IDF-like weighting
function scoreChunk(chunk: {text: string, title: string}, keywords: string[]): number {
  const text = chunk.text.toLowerCase();
  const title = chunk.title.toLowerCase();
  let score = 0;
  
  for (const kw of keywords) {
    // Title matches worth 5x
    if (title.includes(kw)) score += 5;
    
    // Count body matches with diminishing returns
    const regex = new RegExp(`\b${kw}`, 'gi');
    const matches = text.match(regex)?.length || 0;
    score += Math.min(matches, 5); // Cap at 5 matches per keyword
  }
  
  // Boost shorter, focused sections slightly
  const lengthPenalty = Math.max(0, (chunk.text.length - 2000) / 10000);
  return score - lengthPenalty;
}

// Always-include sections for certain topics
const CRITICAL_SECTIONS = [
  { keywords: ['emergency', '911', 'rescue', 'help'], section: 'emergency' },
  { keywords: ['permit', 'reservation'], section: 'permit' },
];

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { question, context: guideContext, history = [] } = JSON.parse(event.body || '{}');
    if (!question) return { statusCode: 400, body: JSON.stringify({ error: 'Question required' }) };

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

    // RAG: Extract keywords, chunk, score, select
    const keywords = extractKeywords(question);
    const chunks = chunkGuide(guideContext || '');
    
    console.log(`RAG: ${keywords.length} keywords, ${chunks.length} chunks from ${guideContext?.length || 0} chars`);
    
    // Score and sort chunks
    const scored = chunks
      .map(chunk => ({ ...chunk, score: scoreChunk(chunk, keywords) }))
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score);
    
    // Take top 8 chunks (more than before)
    const selected = scored.slice(0, 8);
    
    // Build context
    let ragContext: string;
    if (selected.length > 0) {
      ragContext = selected.map(c => `## ${c.title}\n${c.text}`).join('\n\n---\n\n');
    } else if (chunks.length > 0) {
      // Fallback: include first 3 chunks (intro content)
      ragContext = chunks.slice(0, 3).map(c => `## ${c.title}\n${c.text}`).join('\n\n---\n\n');
    } else {
      ragContext = 'No guide content available.';
    }

    const systemPrompt = `You are the AT Trail AI, expert on Appalachian Trail thru-hiking.

RULES:
- Answer directly from the context below
- Cite specific details (numbers, names, distances)
- If info isn't in context, say so

CONTEXT (${selected.length} relevant sections):
${ragContext}`;

    for (let i = 1; i <= 3; i++) {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'grok-4-1-fast-non-reasoning',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
            { role: 'user', content: question }
          ],
          stream: false,
          temperature: 0.3,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answer: data.choices?.[0]?.message?.content || 'No response',
            mode: 'rag',
            chunksUsed: selected.length,
            chunksTotal: chunks.length,
            contextLength: ragContext.length,
            keywords: keywords.slice(0, 10),
            tokens: data.usage,
          }),
        };
      }
      if (i < 3) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i - 1)));
    }
    
    return { statusCode: 502, body: JSON.stringify({ error: 'AI error' }) };
  } catch (e) {
    console.error('RAG error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};

export { handler };
