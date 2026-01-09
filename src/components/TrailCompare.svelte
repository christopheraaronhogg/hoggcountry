<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';

  let question = $state('');
  let guideContext = $state('');
  let isLoading = $state(false);
  let ragResult = $state<any>(null);
  let fullResult = $state<any>(null);

  // Configure marked for safe rendering
  marked.setOptions({ breaks: true, gfm: true });

  function renderMarkdown(text: string): string {
    if (!text) return '';
    return marked.parse(text) as string;
  }

  onMount(async () => { const r = await fetch('/guide-context.txt'); if (r.ok) guideContext = await r.text(); });

  async function compare() {
    if (!question.trim() || isLoading) return;
    isLoading = true; ragResult = null; fullResult = null;
    const q = question.trim();
    const [rag, full] = await Promise.all([
      (async () => { const s = Date.now(); const r = await fetch('/.netlify/functions/ask-rag', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, context: guideContext }) }); return { ...(await r.json()), time: Date.now() - s }; })(),
      (async () => { const s = Date.now(); const r = await fetch('/.netlify/functions/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, context: guideContext }) }); return { ...(await r.json()), time: Date.now() - s, contextLength: guideContext.length }; })(),
    ]);
    ragResult = rag; fullResult = full; isLoading = false;
  }
</script>

<div class="compare">
  <h2>RAG vs Full Context</h2>
  <div class="input"><input bind:value={question} placeholder="Ask..." disabled={isLoading} /><button onclick={compare} disabled={isLoading || !question.trim()}>{isLoading ? '...' : 'Compare'}</button></div>
  <div class="results">
    <div class="panel rag"><h3>RAG (Top 5 chunks)</h3>{#if ragResult}<div class="meta">{ragResult.time}ms | {ragResult.chunksUsed} chunks | {(ragResult.contextLength/1000).toFixed(1)}K</div><div class="answer markdown">{@html renderMarkdown(ragResult.answer)}</div>{:else if isLoading}<div>Loading...</div>{:else}<div>Ask to compare</div>{/if}</div>
    <div class="panel full"><h3>Full Context (150K)</h3>{#if fullResult}<div class="meta">{fullResult.time}ms | {(fullResult.contextLength/1000).toFixed(1)}K</div><div class="answer markdown">{@html renderMarkdown(fullResult.answer)}</div>{:else if isLoading}<div>Loading...</div>{:else}<div>Ask to compare</div>{/if}</div>
  </div>
</div>

<style>
  .compare { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
  h2 { text-align: center; }
  .input { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
  .input input { flex: 1; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; }
  .input button { padding: 0.75rem 1.5rem; background: #2b3a2e; color: white; border: none; border-radius: 8px; cursor: pointer; }
  .results { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .panel { background: #f8f6f1; border-radius: 12px; padding: 1rem; min-height: 200px; overflow: auto; }
  .panel.rag { border-left: 4px solid #f59e0b; }
  .panel.full { border-left: 4px solid #3b82f6; }
  h3 { margin: 0 0 0.5rem; }
  .meta { font-size: 0.8rem; color: #666; margin-bottom: 0.5rem; }
  .answer { line-height: 1.6; }

  /* Markdown styles */
  .markdown :global(h1), .markdown :global(h2), .markdown :global(h3) { margin: 0.75rem 0 0.5rem; font-weight: 600; }
  .markdown :global(h1) { font-size: 1.25rem; }
  .markdown :global(h2) { font-size: 1.1rem; }
  .markdown :global(h3) { font-size: 1rem; }
  .markdown :global(p) { margin: 0.5rem 0; }
  .markdown :global(ul), .markdown :global(ol) { margin: 0.5rem 0; padding-left: 1.5rem; }
  .markdown :global(li) { margin: 0.25rem 0; }
  .markdown :global(code) { background: #e5e5e5; padding: 0.15rem 0.3rem; border-radius: 3px; font-size: 0.9em; }
  .markdown :global(pre) { background: #2b3a2e; color: #fff; padding: 0.75rem; border-radius: 6px; overflow-x: auto; margin: 0.5rem 0; }
  .markdown :global(pre code) { background: none; padding: 0; }
  .markdown :global(table) { border-collapse: collapse; width: 100%; margin: 0.5rem 0; font-size: 0.85em; }
  .markdown :global(th), .markdown :global(td) { border: 1px solid #ddd; padding: 0.4rem 0.6rem; text-align: left; }
  .markdown :global(th) { background: #e5e5e5; font-weight: 600; }
  .markdown :global(strong) { font-weight: 600; }
  .markdown :global(hr) { border: none; border-top: 1px solid #ddd; margin: 0.75rem 0; }
  .markdown :global(blockquote) { border-left: 3px solid #ddd; margin: 0.5rem 0; padding-left: 0.75rem; color: #666; }

  @media (max-width: 768px) { .results { grid-template-columns: 1fr; } }
</style>
