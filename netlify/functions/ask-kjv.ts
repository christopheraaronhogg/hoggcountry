import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Cache KJV verses in memory (cold start loads once)
let cachedVerses: { ref: string; text: string; searchText: string }[] | null = null;

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

// Parse KJV text into searchable verses
async function getVerses(): Promise<{ ref: string; text: string; searchText: string }[]> {
  if (cachedVerses) return cachedVerses;

  const siteUrl = process.env.URL || 'https://hoggcountry.com';
  const res = await fetch(`${siteUrl}/kjv-context.txt`);
  if (!res.ok) return [];

  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));

  cachedVerses = lines.map(line => {
    // Format: "Genesis 1:1 In the beginning..."
    const match = line.match(/^(.+?\s+\d+:\d+)\s+(.+)$/);
    if (match) {
      return {
        ref: match[1],
        text: match[2],
        searchText: match[2].toLowerCase(),
      };
    }
    return null;
  }).filter((v): v is { ref: string; text: string; searchText: string } => v !== null);

  return cachedVerses;
}

// Extract keywords from question (simple tokenization)
function extractKeywords(question: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'between',
    'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
    'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
    'this', 'that', 'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'us', 'our',
    'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their',
    'about', 'says', 'say', 'tell', 'show', 'give', 'find', 'verse', 'verses',
    'bible', 'scripture', 'scriptures', 'kjv', 'passage', 'passages',
  ]);

  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

// Topic-based keyword expansion for common Bible topics
function expandKeywords(keywords: string[]): string[] {
  const topicMap: Record<string, string[]> = {
    love: ['love', 'loved', 'loveth', 'lovest', 'charity', 'beloved'],
    faith: ['faith', 'believe', 'believed', 'believeth', 'faithful', 'trust', 'trusted'],
    hope: ['hope', 'hoped', 'hopeth', 'hoping'],
    prayer: ['pray', 'prayer', 'prayed', 'praying', 'prayeth'],
    salvation: ['salvation', 'saved', 'save', 'saveth', 'saviour', 'redeemed', 'redeem'],
    sin: ['sin', 'sins', 'sinned', 'sinner', 'sinners', 'iniquity', 'transgression'],
    forgiveness: ['forgive', 'forgiven', 'forgiveth', 'forgiveness', 'pardon'],
    grace: ['grace', 'gracious', 'mercy', 'merciful', 'mercies'],
    heaven: ['heaven', 'heavens', 'heavenly', 'paradise'],
    eternal: ['eternal', 'everlasting', 'forever', 'immortal', 'immortality'],
    jesus: ['jesus', 'christ', 'lord', 'messiah', 'son of god', 'son of man'],
    god: ['god', 'lord', 'almighty', 'father', 'creator'],
    holy: ['holy', 'spirit', 'ghost', 'sanctify', 'sanctified'],
    peace: ['peace', 'peaceable', 'peacemakers'],
    joy: ['joy', 'joyful', 'rejoice', 'rejoicing', 'glad', 'gladness'],
    wisdom: ['wisdom', 'wise', 'understanding', 'knowledge'],
    fear: ['fear', 'feared', 'feareth', 'afraid'],
    commandments: ['commandment', 'commandments', 'law', 'laws', 'statute', 'statutes'],
    death: ['death', 'dead', 'die', 'died', 'dying'],
    life: ['life', 'live', 'lived', 'living', 'alive'],
    truth: ['truth', 'true', 'verily'],
    light: ['light', 'lamp', 'candle', 'shine', 'shining'],
    darkness: ['darkness', 'dark', 'night'],
    righteousness: ['righteous', 'righteousness', 'just', 'justice'],
    evil: ['evil', 'wicked', 'wickedness'],
    good: ['good', 'goodness'],
    blessing: ['bless', 'blessed', 'blessing', 'blessings', 'blesses'],
    strength: ['strength', 'strong', 'mighty', 'power', 'powerful'],
    anger: ['anger', 'angry', 'wrath', 'wrathful'],
    patience: ['patience', 'patient', 'longsuffering', 'endure', 'endurance'],
    humility: ['humble', 'humility', 'meek', 'meekness', 'lowly'],
    pride: ['pride', 'proud', 'haughty'],
    money: ['money', 'riches', 'wealth', 'mammon', 'gold', 'silver', 'treasure'],
    marriage: ['marriage', 'marry', 'married', 'wife', 'husband', 'wedding'],
    children: ['children', 'child', 'son', 'sons', 'daughter', 'daughters'],
    family: ['family', 'father', 'mother', 'brother', 'sister', 'parents'],
    work: ['work', 'works', 'labor', 'labour', 'toil'],
    rest: ['rest', 'sabbath'],
    healing: ['heal', 'healed', 'healing', 'whole', 'health'],
    suffering: ['suffer', 'suffering', 'affliction', 'tribulation', 'trial', 'trials'],
  };

  const expanded = new Set(keywords);
  for (const keyword of keywords) {
    if (topicMap[keyword]) {
      topicMap[keyword].forEach(w => expanded.add(w));
    }
  }
  return Array.from(expanded);
}

// Search for relevant verses
function searchVerses(
  verses: { ref: string; text: string; searchText: string }[],
  keywords: string[],
  maxResults = 50
): { ref: string; text: string; score: number }[] {
  const expandedKeywords = expandKeywords(keywords);

  const scored = verses.map(verse => {
    let score = 0;
    for (const keyword of expandedKeywords) {
      if (verse.searchText.includes(keyword)) {
        score += keyword.length; // Longer matches score higher
        // Bonus for exact word match
        if (new RegExp(`\\b${keyword}\\b`).test(verse.searchText)) {
          score += 2;
        }
      }
    }
    return { ...verse, score };
  });

  return scored
    .filter(v => v.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
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

    // Load and search verses
    const verses = await getVerses();
    const keywords = extractKeywords(question);
    const relevantVerses = searchVerses(verses, keywords, 50);

    // Format relevant verses for context
    const kjvContext = relevantVerses.length > 0
      ? relevantVerses.map(v => `${v.ref} ${v.text}`).join('\n')
      : 'No specific verses found for this query. Please try different keywords.';

    const systemPrompt = `You are a Bible assistant that ONLY quotes scripture from the King James Version (KJV).

STRICT RULES:
1. ONLY use text that appears in the KJV Bible context below - never paraphrase or add your own words
2. Always cite the exact reference: Book Chapter:Verse (e.g., John 3:16)
3. When quoting, use the EXACT wording from the KJV - do not modernize or change it
4. If the relevant verses below don't address the question, say "I couldn't find specific verses on that topic. Try rephrasing your question with different keywords."
5. Do NOT provide commentary, interpretation, or personal opinions - only quote the Word
6. If multiple passages are relevant, quote them all with proper citations
7. Select the most relevant verses from those provided

FORMATTING:
- Quote scripture in a natural, readable way
- Include the full verse text, not just references
- Use line breaks between different passages
- Bold the reference (e.g., **John 3:16**)

RELEVANT KJV VERSES (${relevantVerses.length} found):
${kjvContext}`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
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
          model: 'grok-3-mini',
          versesFound: relevantVerses.length,
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
