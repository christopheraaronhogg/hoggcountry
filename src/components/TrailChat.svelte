<script lang="ts">
  import { marked } from 'marked';

  // Configure marked for safe rendering
  marked.setOptions({ breaks: true, gfm: true });

  function renderMarkdown(text: string): string {
    if (!text) return '';
    return marked.parse(text) as string;
  }

  let question = $state('');
  let messages = $state<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  let isLoading = $state(false);
  let error = $state('');

  async function askQuestion() {
    if (!question.trim() || isLoading) return;
    const q = question.trim();
    question = '';
    error = '';
    messages = [...messages, { role: 'user', content: q }];
    isLoading = true;

    try {
      const res = await fetch('/.netlify/functions/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      messages = [...messages, { role: 'assistant', content: data.answer }];
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error';
    } finally {
      isLoading = false;
    }
  }

  const examples = ["What's the emergency number for the Smokies?", "What permits do I need for a NOBO thru-hike?", "What should I pack for a February start?"];
</script>

<div class="chat">
  <div class="header"><h2>AT Trail AI</h2><p>Ask anything about thru-hiking the Appalachian Trail</p></div>
  
  {#if messages.length === 0}
    <div class="examples">
      <p>Try asking:</p>
      {#each examples as q}<button onclick={() => { question = q; askQuestion(); }}>{q}</button>{/each}
    </div>
  {/if}

  <div class="messages">
    {#each messages as m}<div class="msg {m.role}" class:markdown={m.role === 'assistant'}>{#if m.role === 'assistant'}{@html renderMarkdown(m.content)}{:else}{m.content}{/if}</div>{/each}
    {#if isLoading}<div class="msg assistant loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>{/if}
  </div>

  {#if error}<div class="error">{error}</div>{/if}

  <form onsubmit={(e) => { e.preventDefault(); askQuestion(); }}>
    <input bind:value={question} placeholder="Ask about the AT..." disabled={isLoading} />
    <button type="submit" disabled={isLoading || !question.trim()}>Ask</button>
  </form>
</div>

<style>
  .chat { max-width: 700px; margin: 0 auto; padding: 1.5rem; }
  .header { text-align: center; margin-bottom: 1.5rem; }
  .header h2 { margin: 0; color: #2b3a2e; }
  .header p { color: #6b7c6e; font-size: 0.9rem; }
  .examples { background: #f8f6f1; border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; }
  .examples p { font-size: 0.85rem; color: #6b7c6e; margin-bottom: 0.5rem; }
  .examples button { background: white; border: 1px solid #ddd; border-radius: 20px; padding: 0.5rem 1rem; margin: 0.25rem; cursor: pointer; }
  .examples button:hover { background: #2b3a2e; color: white; }
  .messages { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; min-height: 100px; }
  .msg { padding: 1rem; border-radius: 12px; max-width: 85%; white-space: pre-wrap; }
  .msg.user { background: #2b3a2e; color: white; align-self: flex-end; }
  .msg.assistant { background: #f8f6f1; border: 1px solid #ddd; align-self: flex-start; }

  /* Markdown styles for assistant messages */
  .markdown { white-space: normal; }
  .markdown :global(h1), .markdown :global(h2), .markdown :global(h3) { margin: 0.5rem 0 0.25rem; font-weight: 600; }
  .markdown :global(h1) { font-size: 1.1rem; }
  .markdown :global(h2) { font-size: 1rem; }
  .markdown :global(h3) { font-size: 0.95rem; }
  .markdown :global(p) { margin: 0.4rem 0; }
  .markdown :global(p:first-child) { margin-top: 0; }
  .markdown :global(p:last-child) { margin-bottom: 0; }
  .markdown :global(ul), .markdown :global(ol) { margin: 0.4rem 0; padding-left: 1.25rem; }
  .markdown :global(li) { margin: 0.2rem 0; }
  .markdown :global(code) { background: #e5e5e5; padding: 0.1rem 0.25rem; border-radius: 3px; font-size: 0.85em; }
  .markdown :global(pre) { background: #2b3a2e; color: #fff; padding: 0.5rem; border-radius: 6px; overflow-x: auto; margin: 0.4rem 0; font-size: 0.85em; }
  .markdown :global(pre code) { background: none; padding: 0; }
  .markdown :global(strong) { font-weight: 600; }
  .markdown :global(hr) { border: none; border-top: 1px solid #ddd; margin: 0.5rem 0; }
  .markdown :global(blockquote) { border-left: 3px solid #ccc; margin: 0.4rem 0; padding-left: 0.6rem; color: #555; }
  .error { background: #fee; border: 1px solid #fcc; color: #c33; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; }
  .loading { display: flex; gap: 0.3rem; align-items: center; padding: 1rem 1.2rem; }
  .dot { width: 8px; height: 8px; background: #6b7c6e; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  @keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
  form { display: flex; gap: 0.5rem; }
  form input { flex: 1; padding: 0.75rem 1rem; border: 2px solid #ddd; border-radius: 24px; }
  form button { background: #2b3a2e; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 24px; cursor: pointer; }
  form button:disabled { opacity: 0.5; }
</style>
