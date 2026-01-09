import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Cache guide context in memory (cold start loads it once)
let cachedGuideContext: string | null = null;

// Simple rate limiter (resets on cold start, but catches active abuse)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap) {
      if (val.resetTime < now) rateLimitMap.delete(key);
    }
  }

  if (!record || record.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

async function getGuideContext(): Promise<string> {
  if (cachedGuideContext) return cachedGuideContext;

  // Fetch from our own site's public file
  const siteUrl = process.env.URL || 'https://hoggcountry.com';
  const res = await fetch(`${siteUrl}/guide-context.txt`);
  if (res.ok) {
    cachedGuideContext = await res.text();
    return cachedGuideContext;
  }
  return '';
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Rate limiting by IP
  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             event.headers['x-nf-client-connection-ip'] ||
             'unknown';

  if (!checkRateLimit(ip)) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Too many requests. Please wait a minute and try again.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { question, history = [] } = body;

    if (!question || typeof question !== 'string') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Question is required' }) };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'OpenAI API key not configured' }) };
    }

    // Load guide context server-side (cached after first load)
    const guideContext = await getGuideContext();

    const systemPrompt = `You are the AT Trail AI, an expert assistant for Appalachian Trail thru-hikers.

RULES:
- ONLY use information from the Field Guide context below - do not add general knowledge
- If a topic isn't covered in the guide, say "The guide doesn't cover that" and stop
- Cite specific details (miles, gear weights, town names) when available
- Answer directly and concisely

FORMATTING:
- Write like you're talking to a hiking buddy, not making study notes
- NO labeled categories (Where:/Risk:/Safety:) - just explain naturally
- Bullets ONLY for actual lists (gear, towns, steps) - not for explaining topics
- **Bold** only for critical warnings; headers only if truly needed

CONTEXT FROM AT FIELD GUIDE:
${guideContext || 'No specific context found.'}`;

    const maxRetries = 3;
    let lastError = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-5-nano',
          reasoning_effort: 'low',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.map((m: { role: string; content: string }) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            })),
            { role: 'user', content: question },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answer: data.choices?.[0]?.message?.content || 'No response',
            model: 'gpt-5-nano',
            tokens: data.usage,
          }),
        };
      }

      lastError = await response.text();
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
    }

    return { statusCode: 502, body: JSON.stringify({ error: 'AI error', details: lastError }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};

export { handler };
