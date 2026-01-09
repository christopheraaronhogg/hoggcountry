import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

function extractKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'do', 'does', 'will', 'would', 'could', 'should', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'what', 'which', 'who', 'how', 'when', 'where', 'why', 'i', 'my', 'me', 'we', 'you', 'your', 'it', 'they', 'them', 'and', 'or', 'but', 'if']);
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
}

function scoreChunk(chunk: string, keywords: string[]): number {
  const lower = chunk.toLowerCase();
  return keywords.reduce((s, k) => s + (lower.match(new RegExp(`\b${k}\b`, 'g'))?.length || 0), 0);
}

function chunkGuide(guide: string): string[] {
  return guide.split(/(?=^#{1,3}\s)/m).filter(s => s.trim().length > 100);
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { question, context: guideContext, history = [] } = JSON.parse(event.body || '{}');
    if (!question) return { statusCode: 400, body: JSON.stringify({ error: 'Question required' }) };

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

    const keywords = extractKeywords(question);
    const chunks = chunkGuide(guideContext || '');
    const top = chunks.map(c => ({ c, s: scoreChunk(c, keywords) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 5);
    const ragContext = top.length ? top.map(x => x.c).join('\n\n---\n\n') : 'No specific context found.';

    const systemPrompt = `You are the AT Trail AI. Answer using the context below.\n\nCONTEXT (RAG):\n${ragContext}`;

    for (let i = 1; i <= 3; i++) {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'grok-4-1-fast-non-reasoning',
          messages: [{ role: 'system', content: systemPrompt }, ...history.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })), { role: 'user', content: question }],
          stream: false, temperature: 0.3,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer: data.choices?.[0]?.message?.content || 'No response', mode: 'rag', chunksUsed: top.length, contextLength: ragContext.length, tokens: data.usage }) };
      }
      if (i < 3) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i - 1)));
    }
    return { statusCode: 502, body: JSON.stringify({ error: 'AI error' }) };
  } catch { return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) }; }
};

export { handler };
