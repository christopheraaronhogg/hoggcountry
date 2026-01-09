<script lang="ts">
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
    {#each messages as m}<div class="msg {m.role}">{m.content}</div>{/each}
    {#if isLoading}<div class="msg assistant loading">...</div>{/if}
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
  .error { background: #fee; border: 1px solid #fcc; color: #c33; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; }
  form { display: flex; gap: 0.5rem; }
  form input { flex: 1; padding: 0.75rem 1rem; border: 2px solid #ddd; border-radius: 24px; }
  form button { background: #2b3a2e; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 24px; cursor: pointer; }
  form button:disabled { opacity: 0.5; }
</style>
