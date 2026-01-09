import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Cache Proverbs database in memory
let cachedVerses: Record<string, string> | null = null;

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

// Look up verse text from database
function getVerseText(db: Record<string, string>, chapter: number, verse: number): string | null {
  const key = `${chapter}:${verse}`;
  return db[key] || null;
}

// Format a single verse reference with text
function formatVerse(db: Record<string, string>, chapter: number, verse: number): string | null {
  const text = getVerseText(db, chapter, verse);
  if (!text) return null;
  return `**Proverbs ${chapter}:${verse}** ${text}`;
}

// Format a range of verses
function formatVerseRange(db: Record<string, string>, chapter: number, startVerse: number, endVerse: number): string | null {
  const verses: string[] = [];
  for (let v = startVerse; v <= endVerse; v++) {
    const text = getVerseText(db, chapter, v);
    if (text) {
      verses.push(`**Proverbs ${chapter}:${v}** ${text}`);
    }
  }
  return verses.length > 0 ? verses.join('\n\n') : null;
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

    // Load Proverbs database
    const db = await getProverbsDB();

    const systemPrompt = `You are a Proverbs reference assistant. Given a question, return ONLY the relevant verse references from the Book of Proverbs (KJV).

IMPORTANT: Return ONLY a JSON object with verse references. Do NOT quote the scripture text - just the references.

JSON FORMAT:
{
  "verses": [
    { "chapter": 3, "startVerse": 5, "endVerse": 6 },
    { "chapter": 16, "verse": 3 }
  ],
  "note": "Optional 1-sentence context about why these verses are relevant"
}

RULES:
1. Only reference verses from Proverbs chapters 1-31
2. Use "verse" for single verses, "startVerse"/"endVerse" for ranges
3. Return 1-10 most relevant verses/passages
4. If the topic isn't covered in Proverbs, return: { "verses": [], "note": "This topic is not directly addressed in Proverbs" }
5. Return ONLY valid JSON, no other text

PROVERBS TOPICS REFERENCE:
- Wisdom & Understanding: ch 1-9, 16:16, 24:3-4
- The Tongue/Speech: 10:19-21, 12:18, 15:1-4, 18:21, 21:23
- Money/Wealth: 3:9-10, 10:4, 11:4, 13:11, 22:1-7, 23:4-5, 28:6
- Anger: 14:29, 15:1, 16:32, 19:11, 22:24-25, 29:11
- Pride/Humility: 11:2, 13:10, 16:5,18, 18:12, 22:4, 29:23
- Work/Laziness: 6:6-11, 10:4-5, 12:24, 13:4, 20:4, 24:30-34
- Friends: 17:17, 18:24, 27:6,9,17
- Marriage/Family: 5:18-19, 12:4, 18:22, 19:13-14, 21:9,19, 31:10-31
- Children/Parenting: 13:24, 19:18, 22:6,15, 23:13-14, 29:15,17
- Trust in God: 3:5-6, 16:3,9, 19:21, 20:24, 21:30-31`;

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
          answer: 'I had trouble finding relevant verses. Please try rephrasing your question.',
          model: 'gpt-5-nano',
        }),
      };
    }

    // Build the formatted response with actual scripture text
    const formattedVerses: string[] = [];

    if (llmResponse.verses && Array.isArray(llmResponse.verses)) {
      for (const ref of llmResponse.verses) {
        if (ref.startVerse && ref.endVerse) {
          // Range of verses
          const text = formatVerseRange(db, ref.chapter, ref.startVerse, ref.endVerse);
          if (text) formattedVerses.push(text);
        } else if (ref.verse) {
          // Single verse
          const text = formatVerse(db, ref.chapter, ref.verse);
          if (text) formattedVerses.push(text);
        }
      }
    }

    let answer: string;
    if (formattedVerses.length === 0) {
      answer = llmResponse.note || 'No relevant verses found in Proverbs for this topic.';
    } else {
      answer = formattedVerses.join('\n\n');
      if (llmResponse.note) {
        answer = `*${llmResponse.note}*\n\n${answer}`;
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer,
        model: 'gpt-5-nano',
        versesFound: formattedVerses.length,
        tokens: data.usage,
      }),
    };

  } catch (error) {
    console.error('Internal error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};

export { handler };
