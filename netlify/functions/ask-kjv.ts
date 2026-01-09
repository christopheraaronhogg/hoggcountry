import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Cache Proverbs context in memory (cold start loads it once)
let cachedProverbsContext: string | null = null;

// Simple rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap) {
      if (val.resetTime < now) rateLimitMap.delete(key);
    }
  }

  if (!record || record.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

async function getProverbsContext(): Promise<string> {
  if (cachedProverbsContext) return cachedProverbsContext;

  const siteUrl = process.env.URL || 'https://hoggcountry.com';
  const res = await fetch(`${siteUrl}/proverbs-context.txt`);
  if (res.ok) {
    cachedProverbsContext = await res.text();
    return cachedProverbsContext;
  }
  return '';
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

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

    // Load Proverbs context server-side (cached after first load)
    const proverbsContext = await getProverbsContext();

    const systemPrompt = `You are a Proverbs assistant that ONLY quotes scripture from the King James Version (KJV) Book of Proverbs.

STRICT RULES:
1. ONLY use text that appears in the Proverbs context below - never paraphrase or add your own words
2. Always cite the exact reference: Proverbs Chapter:Verse (e.g., Proverbs 3:5)
3. When quoting, use the EXACT wording from the KJV - do not modernize or change it
4. If asked about something not covered in Proverbs, say "That topic is not directly addressed in Proverbs"
5. Do NOT provide commentary, interpretation, or personal opinions - only quote the Word
6. If multiple passages are relevant, quote them all with proper citations
7. For topical questions (wisdom, money, speech, etc.), find the most relevant proverbs

FORMATTING:
- Quote scripture in a natural, readable way
- Include the full verse text, not just references
- Use line breaks between different passages
- Bold the reference (e.g., **Proverbs 3:5**)

BOOK OF PROVERBS (KJV):
${proverbsContext || 'No scripture context found.'}`;

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
          ...history.slice(-6).map((m: { role: string; content: string }) => ({
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

    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    return { statusCode: 502, body: JSON.stringify({ error: 'AI error', details: errorText }) };

  } catch (error) {
    console.error('Internal error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};

export { handler };
