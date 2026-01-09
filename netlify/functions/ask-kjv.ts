import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Cache Proverbs database and text in memory
let cachedVerses: Record<string, string> | null = null;
let cachedProverbsText: string | null = null;

// Simple rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60 * 1000;

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

async function getProverbsDB(): Promise<Record<string, string>> {
  if (cachedVerses) return cachedVerses;

  const siteUrl = process.env.URL || 'https://hoggcountry.com';
  const res = await fetch(`${siteUrl}/proverbs.json`);
  if (res.ok) {
    cachedVerses = await res.json();
    return cachedVerses!;
  }
  return {};
}

async function getProverbsText(): Promise<string> {
  if (cachedProverbsText) return cachedProverbsText;

  const siteUrl = process.env.URL || 'https://hoggcountry.com';
  const res = await fetch(`${siteUrl}/proverbs-context.txt`);
  if (res.ok) {
    cachedProverbsText = await res.text();
    return cachedProverbsText;
  }
  return '';
}

// Look up verse text from database
function getVerseText(db: Record<string, string>, chapter: number, verse: number): string | null {
  const key = `${chapter}:${verse}`;
  return db[key] || null;
}

interface VerseRef {
  chapter: number;
  verse?: number;
  startVerse?: number;
  endVerse?: number;
}

interface LLMResponse {
  verses: VerseRef[];
  note?: string;
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

    // Load both the database and the full text
    const [db, proverbsText] = await Promise.all([
      getProverbsDB(),
      getProverbsText(),
    ]);

    const systemPrompt = `You are a Proverbs reference assistant. Given a question, search the Book of Proverbs below and return the most relevant verse references.

IMPORTANT: Return ONLY a JSON object with verse references. Do NOT quote the scripture text - just return the chapter:verse references.

JSON FORMAT:
{
  "verses": [
    { "chapter": 3, "startVerse": 5, "endVerse": 6 },
    { "chapter": 16, "verse": 3 }
  ],
  "note": "Optional 1-sentence context about why these verses are relevant"
}

RULES:
1. Search the Proverbs text below to find relevant verses
2. Use "verse" for single verses, "startVerse"/"endVerse" for consecutive verse ranges
3. Return 1-10 most relevant verses/passages
4. If nothing is relevant, return: { "verses": [], "note": "This topic is not directly addressed in Proverbs" }
5. Return ONLY valid JSON, no other text

BOOK OF PROVERBS (KJV):
${proverbsText}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        reasoning_effort: 'medium',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-4).map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
          { role: 'user', content: question },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return { statusCode: 502, body: JSON.stringify({ error: 'AI error', details: errorText }) };
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';

    let llmResponse: LLMResponse;
    try {
      llmResponse = JSON.parse(rawContent);
    } catch {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: 'I had trouble finding relevant verses. Please try rephrasing your question.',
          verses: [],
          model: 'gpt-5-nano',
        }),
      };
    }

    // Build structured response with separate note and verified verses
    const verseObjects: { reference: string; text: string }[] = [];

    if (llmResponse.verses && Array.isArray(llmResponse.verses)) {
      for (const ref of llmResponse.verses) {
        if (ref.startVerse && ref.endVerse) {
          // Range of verses - combine into one block
          const texts: string[] = [];
          for (let v = ref.startVerse; v <= ref.endVerse; v++) {
            const text = getVerseText(db, ref.chapter, v);
            if (text) texts.push(`[${v}] ${text}`);
          }
          if (texts.length > 0) {
            verseObjects.push({
              reference: `Proverbs ${ref.chapter}:${ref.startVerse}-${ref.endVerse}`,
              text: texts.join(' '),
            });
          }
        } else if (ref.verse) {
          // Single verse
          const text = getVerseText(db, ref.chapter, ref.verse);
          if (text) {
            verseObjects.push({
              reference: `Proverbs ${ref.chapter}:${ref.verse}`,
              text,
            });
          }
        }
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note: llmResponse.note || null,
        verses: verseObjects,
        model: 'gpt-5-nano',
        tokens: data.usage,
      }),
    };

  } catch (error) {
    console.error('Internal error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};

export { handler };
