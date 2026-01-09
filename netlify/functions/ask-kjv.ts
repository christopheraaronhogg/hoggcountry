import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Cache KJV parsed into books (cold start loads once)
let cachedBooks: Map<string, string> | null = null;

// Simple rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
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

// Parse KJV into individual books
async function getKJVBooks(): Promise<Map<string, string>> {
  if (cachedBooks) return cachedBooks;

  const siteUrl = process.env.URL || 'https://hoggcountry.com';
  const res = await fetch(`${siteUrl}/kjv-context.txt`);
  if (!res.ok) {
    cachedBooks = new Map();
    return cachedBooks;
  }

  const fullText = await res.text();
  cachedBooks = new Map();

  // Split by book headers (## BookName)
  const bookRegex = /^## (.+)$/gm;
  let lastBook = '';
  let lastIndex = 0;

  let match;
  while ((match = bookRegex.exec(fullText)) !== null) {
    if (lastBook) {
      const content = fullText.slice(lastIndex, match.index).trim();
      if (content) {
        cachedBooks.set(normalizeBookName(lastBook), content);
      }
    }
    lastBook = match[1].trim();
    lastIndex = match.index + match[0].length;
  }

  // Don't forget the last book
  if (lastBook) {
    const content = fullText.slice(lastIndex).trim();
    if (content) {
      cachedBooks.set(normalizeBookName(lastBook), content);
    }
  }

  return cachedBooks;
}

// Normalize book names for matching
function normalizeBookName(name: string): string {
  return name.toLowerCase()
    .replace(/^(1|2|3|i|ii|iii)\s*/i, (m) => {
      if (m.match(/^i+\s*/i)) return m.replace(/i/gi, '1').replace(/ii/gi, '2').replace(/iii/gi, '3');
      return m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

// Stage 1: Select relevant books using cheap fast model
async function selectBooks(question: string, apiKey: string): Promise<string[]> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast',
      messages: [
        {
          role: 'system',
          content: `Select exactly 4 Bible books to provide balanced scriptural guidance. Return ONLY a JSON array of book names.

BALANCE: Pick one from each section for diverse perspective:
1. WISDOM: Job, Psalms, Proverbs, Ecclesiastes, Song of Solomon
2. OLD TESTAMENT: Isaiah, Jeremiah, Daniel, or other prophets/history
3. GOSPELS: Matthew, Mark, Luke, John
4. EPISTLES: Romans, Philippians, Hebrews, James, 1 John, etc.

Return format: ["Psalms", "Isaiah", "Matthew", "Philippians"]`
        },
        { role: 'user', content: question }
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    return ['Psalms', 'Isaiah', 'Matthew', 'Philippians'];
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  try {
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const books = JSON.parse(jsonMatch[0]);
      if (Array.isArray(books) && books.length > 0) {
        return books.slice(0, 5);
      }
    }
  } catch {
    // Parse failed
  }

  return ['Psalms', 'Isaiah', 'Matthew', 'Philippians'];
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

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'xAI API key not configured' }) };
    }

    // Stage 1: Select relevant books (fast, cheap)
    const selectedBooks = await selectBooks(question, apiKey);

    // Stage 2: Get content for selected books
    const allBooks = await getKJVBooks();
    const relevantContent: string[] = [];

    for (const bookName of selectedBooks) {
      const normalized = normalizeBookName(bookName);
      let content = allBooks.get(normalized);
      if (!content) {
        for (const [key, val] of allBooks) {
          if (key.includes(normalized) || normalized.includes(key)) {
            content = val;
            break;
          }
        }
      }
      if (content) {
        relevantContent.push(`## ${bookName}\n${content}`);
      }
    }

    const booksContext = relevantContent.join('\n\n');

    // Stage 3: Generate warm pastoral response
    const systemPrompt = `You are a warm, pastoral Bible guide who helps people find comfort and wisdom in the King James Version scriptures.

YOUR ROLE:
- You are like a kind pastor or trusted friend who knows the Bible deeply
- Meet people where they are emotionally - acknowledge their struggles with warmth
- Let Scripture do the heavy lifting, but frame it with gentle encouragement

RESPONSE STRUCTURE:
1. Brief warm acknowledgment (1-2 sentences)
2. Primary scripture - the most relevant passage(s), quoted in full
3. Supporting verses - 2-4 additional relevant scriptures
4. Gentle closing (1 sentence)

SCRIPTURE RULES:
- ONLY quote exact KJV text from the context below - never paraphrase
- Always cite: **Book Chapter:Verse** (bold the reference)
- Include the FULL verse text, not just references
- Provide 4-6 relevant verses from the books provided

TONE:
- Warm and personal, not robotic or academic
- Hopeful - the scriptures are meant to encourage
- Let Scripture be the star

SCRIPTURE CONTEXT (from ${selectedBooks.join(', ')}):
${booksContext || 'No scripture context found.'}`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6).map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
          { role: 'user', content: question },
        ],
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: data.choices?.[0]?.message?.content || 'No response',
          model: 'grok-4-1-fast',
          books: selectedBooks,
          tokens: data.usage,
        }),
      };
    }

    const errorText = await response.text();
    console.error('Grok API error:', errorText);
    return { statusCode: 502, body: JSON.stringify({ error: 'AI error', details: errorText }) };

  } catch (error) {
    console.error('Internal error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};

export { handler };
