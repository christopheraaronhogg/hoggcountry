import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Cache KJV parsed into verses database
let cachedVerses: Map<string, string> | null = null;
let cachedBooksList: string[] | null = null;

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

// Parse KJV into verse database: "Book Chapter:Verse" -> "text"
async function getKJVVerses(): Promise<{ verses: Map<string, string>; books: string[] }> {
  if (cachedVerses && cachedBooksList) {
    return { verses: cachedVerses, books: cachedBooksList };
  }

  const siteUrl = process.env.URL || 'https://hoggcountry.com';
  const res = await fetch(`${siteUrl}/kjv-context.txt`);
  if (!res.ok) {
    cachedVerses = new Map();
    cachedBooksList = [];
    return { verses: cachedVerses, books: cachedBooksList };
  }

  const fullText = await res.text();
  cachedVerses = new Map();
  const booksSet = new Set<string>();

  // Parse verses like "Genesis 1:1 In the beginning..."
  // Match: BookName Chapter:Verse Text
  const verseRegex = /^([1-3]?\s?[A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)\s+(\d+):(\d+)\s+(.+)$/gm;

  let match;
  while ((match = verseRegex.exec(fullText)) !== null) {
    const book = match[1].trim();
    const chapter = match[2];
    const verse = match[3];
    const text = match[4].trim();

    const key = `${book} ${chapter}:${verse}`;
    cachedVerses.set(key.toLowerCase(), text);
    booksSet.add(book);
  }

  cachedBooksList = Array.from(booksSet);
  return { verses: cachedVerses, books: cachedBooksList };
}

// Look up verse from database
function getVerseText(verses: Map<string, string>, reference: string): string | null {
  // Normalize the reference for lookup
  const normalized = reference.toLowerCase().trim();
  return verses.get(normalized) || null;
}

// Parse a reference like "Psalms 4:8" or "Philippians 4:6-7"
interface ParsedRef {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
}

function parseReference(ref: string): ParsedRef | null {
  // Match "Book Chapter:Verse" or "Book Chapter:StartVerse-EndVerse"
  const match = ref.match(/^([1-3]?\s?[A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;

  return {
    book: match[1].trim(),
    chapter: parseInt(match[2], 10),
    startVerse: parseInt(match[3], 10),
    endVerse: match[4] ? parseInt(match[4], 10) : parseInt(match[3], 10),
  };
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

    // Load verse database
    const { verses, books } = await getKJVVerses();

    // Ask LLM to select verse REFERENCES only (not quote them)
    const systemPrompt = `You are a Bible reference assistant. Given a question, select the most relevant KJV verse references.

IMPORTANT: Return ONLY a JSON object. Do NOT quote scripture text - just return references.

JSON FORMAT:
{
  "intro": "1-2 sentence warm acknowledgment of their situation",
  "verses": ["Psalms 4:8", "Psalms 127:2", "Isaiah 26:3", "Matthew 11:28", "Philippians 4:6-7"],
  "closing": "1 sentence of gentle encouragement"
}

RULES:
1. Select 4-8 most relevant verses from across the Bible
2. Use exact reference format: "Book Chapter:Verse" or "Book Chapter:Start-End" for ranges
3. Balance selections: include Psalms/Proverbs (wisdom), Old Testament prophets, Gospels, and Epistles
4. The intro should be warm and pastoral, acknowledging their emotional state
5. Return ONLY valid JSON, no other text

AVAILABLE BOOKS: ${books.slice(0, 30).join(', ')}... and more`;

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
          ...history.slice(-4).map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
          { role: 'user', content: question },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Grok API error:', errorText);
      return { statusCode: 502, body: JSON.stringify({ error: 'AI error', details: errorText }) };
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';

    // Parse JSON response
    let llmResponse: { intro?: string; verses?: string[]; closing?: string };
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      llmResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intro: 'I had trouble finding relevant verses. Please try rephrasing your question.',
          verses: [],
          closing: null,
        }),
      };
    }

    // Look up actual verse text from database
    const verifiedVerses: { reference: string; text: string }[] = [];

    if (llmResponse.verses && Array.isArray(llmResponse.verses)) {
      for (const ref of llmResponse.verses) {
        const parsed = parseReference(ref);
        if (!parsed) continue;

        if (parsed.startVerse === parsed.endVerse) {
          // Single verse
          const text = getVerseText(verses, ref);
          if (text) {
            verifiedVerses.push({ reference: ref, text });
          }
        } else {
          // Verse range - collect all verses
          const texts: string[] = [];
          for (let v = parsed.startVerse; v <= parsed.endVerse; v++) {
            const singleRef = `${parsed.book} ${parsed.chapter}:${v}`;
            const text = getVerseText(verses, singleRef);
            if (text) texts.push(`[${v}] ${text}`);
          }
          if (texts.length > 0) {
            verifiedVerses.push({
              reference: `${parsed.book} ${parsed.chapter}:${parsed.startVerse}-${parsed.endVerse}`,
              text: texts.join(' '),
            });
          }
        }
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intro: llmResponse.intro || null,
        verses: verifiedVerses,
        closing: llmResponse.closing || null,
        model: 'grok-4-1-fast',
        tokens: data.usage,
      }),
    };

  } catch (error) {
    console.error('Internal error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};

export { handler };
