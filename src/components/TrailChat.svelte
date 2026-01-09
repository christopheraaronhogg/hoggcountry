<script lang="ts">
  import { marked } from 'marked';
  import { onMount } from 'svelte';

  marked.setOptions({ breaks: true, gfm: true });

  function renderMarkdown(text: string): string {
    if (!text) return '';
    return marked.parse(text) as string;
  }

  interface Message { role: 'user' | 'assistant'; content: string }
  interface Conversation { id: string; createdAt: string; title: string; messages: Message[] }

  const STORAGE_KEY = 'at-trail-ai-conversations';

  let question = $state('');
  let messages = $state<Message[]>([]);
  let isLoading = $state(false);
  let error = $state('');
  let currentConvoId = $state<string | null>(null);
  let savedConversations = $state<Conversation[]>([]);

  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) savedConversations = JSON.parse(saved);
    } catch (e) { /* ignore */ }
  });

  function saveConversations() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConversations));
    } catch (e) { /* ignore */ }
  }

  function saveCurrentConvo() {
    if (messages.length === 0) return;
    const title = messages[0]?.content.slice(0, 60) + (messages[0]?.content.length > 60 ? '...' : '');

    if (currentConvoId) {
      const idx = savedConversations.findIndex(c => c.id === currentConvoId);
      if (idx >= 0) {
        savedConversations[idx] = { ...savedConversations[idx], messages: [...messages] };
        savedConversations = [...savedConversations];
      }
    } else {
      currentConvoId = crypto.randomUUID();
      const newConvo: Conversation = { id: currentConvoId, createdAt: new Date().toISOString(), title, messages: [...messages] };
      savedConversations = [newConvo, ...savedConversations];
    }
    saveConversations();
  }

  function newChat() {
    messages = [];
    currentConvoId = null;
    error = '';
  }

  function loadConversation(convo: Conversation) {
    messages = [...convo.messages];
    currentConvoId = convo.id;
  }

  function deleteConversation(id: string, e: Event) {
    e.stopPropagation();
    savedConversations = savedConversations.filter(c => c.id !== id);
    saveConversations();
    if (currentConvoId === id) newChat();
  }

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
      saveCurrentConvo();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error';
    } finally {
      isLoading = false;
    }
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  const examples = ["What's the emergency number for the Smokies?", "What permits do I need for a NOBO thru-hike?", "What should I pack for a February start?"];
</script>

<div class="chat">
  <!-- Header -->
  <div class="header">
    {#if messages.length > 0}
      <button class="back-btn" onclick={newChat}>← New Chat</button>
    {/if}
    <h2>AT Trail AI</h2>
    <p>Ask anything about thru-hiking the Appalachian Trail</p>
  </div>

  <!-- Welcome view (no active conversation) -->
  {#if messages.length === 0}
    <!-- Recent conversations -->
    {#if savedConversations.length > 0}
      <div class="recent">
        <h3>Recent Conversations</h3>
        <p class="offline-hint">Saved locally for offline access on the trail</p>
        <div class="recent-list">
          {#each savedConversations as convo}
            <div class="recent-card" onclick={() => loadConversation(convo)}>
              <div class="recent-content">
                <span class="recent-title">{convo.title}</span>
                <span class="recent-meta">{formatDate(convo.createdAt)} · {convo.messages.length} messages</span>
              </div>
              <button class="recent-delete" onclick={(e) => deleteConversation(convo.id, e)}>×</button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Example questions -->
    <div class="examples">
      <p>{savedConversations.length > 0 ? 'Or ask something new:' : 'Try asking:'}</p>
      {#each examples as q}<button onclick={() => { question = q; askQuestion(); }}>{q}</button>{/each}
    </div>
  {/if}

  <!-- Active conversation -->
  {#if messages.length > 0}
    <div class="messages">
      {#each messages as m}
        <div class="msg {m.role}" class:markdown={m.role === 'assistant'}>
          {#if m.role === 'assistant'}{@html renderMarkdown(m.content)}{:else}{m.content}{/if}
        </div>
      {/each}
      {#if isLoading}
        <div class="msg assistant loading">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      {/if}
    </div>
  {/if}

  {#if error}<div class="error">{error}</div>{/if}

  <form onsubmit={(e) => { e.preventDefault(); askQuestion(); }}>
    <input bind:value={question} placeholder="Ask about the AT..." disabled={isLoading} />
    <button type="submit" disabled={isLoading || !question.trim()}>Ask</button>
  </form>
</div>

<style>
  .chat { max-width: 700px; margin: 0 auto; padding: 1.5rem; }

  /* Header */
  .header { text-align: center; margin-bottom: 1.5rem; position: relative; }
  .header h2 { margin: 0; color: #2b3a2e; }
  .header p { color: #6b7c6e; font-size: 0.9rem; margin: 0.25rem 0 0; }
  .back-btn { position: absolute; left: 0; top: 0; background: none; border: 1px solid #ddd; border-radius: 16px; padding: 0.35rem 0.75rem; font-size: 0.8rem; cursor: pointer; color: #2b3a2e; }
  .back-btn:hover { background: #2b3a2e; color: white; }

  /* Recent conversations */
  .recent { margin-bottom: 1.5rem; }
  .recent h3 { font-size: 0.95rem; color: #2b3a2e; margin: 0 0 0.25rem; }
  .offline-hint { font-size: 0.75rem; color: #8b9c8e; margin: 0 0 0.75rem; font-style: italic; }
  .recent-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .recent-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: #f8f6f1; border: 1px solid #e5e5e5; border-radius: 12px; cursor: pointer; transition: border-color 0.15s; }
  .recent-card:hover { border-color: #2b3a2e; }
  .recent-content { flex: 1; min-width: 0; }
  .recent-title { display: block; font-size: 0.9rem; color: #2b3a2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .recent-meta { font-size: 0.75rem; color: #999; }
  .recent-delete { background: none; border: none; color: #bbb; font-size: 1.2rem; cursor: pointer; padding: 0.25rem; line-height: 1; border-radius: 4px; }
  .recent-delete:hover { color: #c33; background: rgba(200,50,50,0.1); }

  /* Examples */
  .examples { background: #f8f6f1; border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; }
  .examples p { font-size: 0.85rem; color: #6b7c6e; margin: 0 0 0.5rem; }
  .examples button { background: white; border: 1px solid #ddd; border-radius: 20px; padding: 0.5rem 1rem; margin: 0.25rem; cursor: pointer; font-size: 0.85rem; }
  .examples button:hover { background: #2b3a2e; color: white; }

  /* Messages */
  .messages { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
  .msg { padding: 1rem; border-radius: 12px; max-width: 85%; white-space: pre-wrap; }
  .msg.user { background: #2b3a2e; color: white; align-self: flex-end; }
  .msg.assistant { background: #f8f6f1; border: 1px solid #ddd; align-self: flex-start; }

  /* Markdown */
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

  /* Loading & error */
  .error { background: #fee; border: 1px solid #fcc; color: #c33; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; }
  .loading { display: flex; gap: 0.3rem; align-items: center; padding: 1rem 1.2rem; }
  .dot { width: 8px; height: 8px; background: #6b7c6e; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  @keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

  /* Form */
  form { display: flex; gap: 0.5rem; }
  form input { flex: 1; padding: 0.75rem 1rem; border: 2px solid #ddd; border-radius: 24px; font-size: 0.95rem; }
  form button { background: #2b3a2e; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 24px; cursor: pointer; font-size: 0.95rem; }
  form button:disabled { opacity: 0.5; }
</style>
