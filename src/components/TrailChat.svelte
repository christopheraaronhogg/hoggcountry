<script lang="ts">
  import { marked } from 'marked';
  import { onMount, tick } from 'svelte';

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

  // Refs for auto-scroll and auto-focus
  let messagesContainer: HTMLDivElement;
  let inputRef: HTMLInputElement;

  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) savedConversations = JSON.parse(saved);
    } catch (e) { /* ignore */ }
    // Auto-focus input on mount
    inputRef?.focus();
  });

  // Auto-scroll to bottom when messages change
  async function scrollToBottom() {
    await tick();
    messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
  }

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
    // Focus input after view change
    setTimeout(() => inputRef?.focus(), 100);
  }

  function loadConversation(convo: Conversation) {
    messages = [...convo.messages];
    currentConvoId = convo.id;
    scrollToBottom();
    setTimeout(() => inputRef?.focus(), 100);
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
    scrollToBottom();

    try {
      const res = await fetch('/.netlify/functions/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      messages = [...messages, { role: 'assistant', content: data.answer }];
      saveCurrentConvo();
      scrollToBottom();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
    } finally {
      isLoading = false;
      inputRef?.focus();
    }
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  const examples = [
    "What's the emergency number for the Smokies?",
    "What permits do I need for a NOBO thru-hike?",
    "What should I pack for a February start?"
  ];
</script>

<div class="chat" role="main" aria-label="AT Trail AI Chat">
  <!-- Header -->
  <header class="header">
    {#if messages.length > 0}
      <button
        class="back-btn"
        onclick={newChat}
        aria-label="Start new conversation"
      >
        <span aria-hidden="true">←</span> New Chat
      </button>
    {/if}
    <h1>AT Trail AI</h1>
    <p>Ask anything about thru-hiking the Appalachian Trail</p>
  </header>

  <!-- Welcome view (no active conversation) -->
  {#if messages.length === 0}
    <!-- Recent conversations -->
    {#if savedConversations.length > 0}
      <section class="recent" aria-label="Recent conversations">
        <h2>Recent Conversations</h2>
        <p class="offline-hint">Saved locally for offline access on the trail</p>
        <ul class="recent-list" role="list">
          {#each savedConversations as convo}
            <li>
              <button
                class="recent-card"
                onclick={() => loadConversation(convo)}
                aria-label="Continue conversation: {convo.title}"
              >
                <div class="recent-content">
                  <span class="recent-title">{convo.title}</span>
                  <span class="recent-meta">{formatDate(convo.createdAt)} · {convo.messages.length} messages</span>
                </div>
                <span
                  class="recent-delete"
                  role="button"
                  tabindex="0"
                  onclick={(e: Event) => deleteConversation(convo.id, e)}
                  onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') deleteConversation(convo.id, e); }}
                  aria-label="Delete conversation"
                >×</span>
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <!-- Example questions -->
    <section class="examples" aria-label="Example questions">
      <p id="examples-label">{savedConversations.length > 0 ? 'Or ask something new:' : 'Try asking:'}</p>
      <div role="group" aria-labelledby="examples-label">
        {#each examples as q}
          <button onclick={() => { question = q; askQuestion(); }}>{q}</button>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Active conversation -->
  {#if messages.length > 0}
    <div
      class="messages"
      bind:this={messagesContainer}
      role="log"
      aria-label="Conversation messages"
      aria-live="polite"
    >
      {#each messages as m, i}
        <div
          class="msg {m.role}"
          class:markdown={m.role === 'assistant'}
          role="article"
          aria-label="{m.role === 'user' ? 'Your question' : 'AI response'}"
        >
          {#if m.role === 'assistant'}{@html renderMarkdown(m.content)}{:else}{m.content}{/if}
        </div>
      {/each}
      {#if isLoading}
        <div class="msg assistant loading" role="status" aria-label="AI is thinking...">
          <span class="dot" aria-hidden="true"></span>
          <span class="dot" aria-hidden="true"></span>
          <span class="dot" aria-hidden="true"></span>
          <span class="sr-only">Loading response...</span>
        </div>
      {/if}
    </div>
  {/if}

  {#if error}
    <div class="error" role="alert">
      <span>{error}</span>
      <button class="retry-btn" onclick={() => { error = ''; inputRef?.focus(); }}>Dismiss</button>
    </div>
  {/if}

  <form onsubmit={(e: Event) => { e.preventDefault(); askQuestion(); }} aria-label="Ask a question">
    <input
      bind:this={inputRef}
      bind:value={question}
      placeholder="Ask about the AT..."
      disabled={isLoading}
      aria-label="Your question"
    />
    <button type="submit" disabled={isLoading || !question.trim()} aria-label="Send question">
      {isLoading ? '...' : 'Ask'}
    </button>
  </form>
</div>

<style>
  .chat { max-width: 700px; margin: 0 auto; padding: 1.5rem; }

  /* Screen reader only */
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

  /* Header */
  .header { text-align: center; margin-bottom: 1.5rem; position: relative; }
  .header h1 { margin: 0; color: #2b3a2e; font-size: 1.5rem; }
  .header p { color: #5a6b5e; font-size: 0.9rem; margin: 0.25rem 0 0; }

  .back-btn {
    position: absolute; left: 0; top: 0;
    background: none; border: 1px solid #ccc; border-radius: 20px;
    padding: 0.5rem 1rem; font-size: 0.85rem;
    cursor: pointer; color: #2b3a2e;
    min-height: 44px; /* Touch target */
    transition: all 0.15s ease;
  }
  .back-btn:hover { background: #2b3a2e; color: white; border-color: #2b3a2e; }
  .back-btn:focus-visible { outline: 2px solid #2b3a2e; outline-offset: 2px; }

  /* Recent conversations */
  .recent { margin-bottom: 1.5rem; }
  .recent h2 { font-size: 1rem; color: #2b3a2e; margin: 0 0 0.25rem; font-weight: 600; }
  .offline-hint { font-size: 0.8rem; color: #5a6b5e; margin: 0 0 0.75rem; font-style: italic; }
  .recent-list { display: flex; flex-direction: column; gap: 0.5rem; list-style: none; padding: 0; margin: 0; }
  .recent-list li { margin: 0; }

  .recent-card {
    display: flex; align-items: center; gap: 0.75rem; width: 100%;
    padding: 0.875rem 1rem; background: #f8f6f1;
    border: 1px solid #e0e0e0; border-radius: 12px;
    cursor: pointer; text-align: left;
    min-height: 56px; /* Touch target */
    transition: all 0.15s ease;
  }
  .recent-card:hover { border-color: #2b3a2e; background: #f0ede6; }
  .recent-card:focus-visible { outline: 2px solid #2b3a2e; outline-offset: 2px; }

  .recent-content { flex: 1; min-width: 0; }
  .recent-title { display: block; font-size: 0.9rem; color: #2b3a2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
  .recent-meta { font-size: 0.8rem; color: #5a6b5e; } /* Fixed contrast */

  .recent-delete {
    background: none; border: none; color: transparent;
    font-size: 1.4rem; cursor: pointer; padding: 0.5rem;
    min-width: 44px; min-height: 44px; /* Touch target */
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px; transition: all 0.15s ease;
  }
  .recent-card:hover .recent-delete { color: #999; }
  .recent-delete:hover { color: #c33 !important; background: rgba(200,50,50,0.1); }
  .recent-delete:focus-visible { outline: 2px solid #c33; outline-offset: 2px; color: #c33; }
  /* Always show on touch devices */
  @media (hover: none) { .recent-delete { color: #999; } }

  /* Examples */
  .examples { background: #f8f6f1; border-radius: 16px; padding: 1.25rem; margin-bottom: 1.5rem; }
  .examples p { font-size: 0.9rem; color: #5a6b5e; margin: 0 0 0.75rem; }
  .examples div { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .examples button {
    background: white; border: 1px solid #ddd; border-radius: 24px;
    padding: 0.625rem 1.25rem; cursor: pointer; font-size: 0.875rem;
    min-height: 44px; /* Touch target */
    transition: all 0.15s ease;
  }
  .examples button:hover { background: #2b3a2e; color: white; border-color: #2b3a2e; }
  .examples button:focus-visible { outline: 2px solid #2b3a2e; outline-offset: 2px; }

  /* Messages */
  .messages {
    display: flex; flex-direction: column; gap: 1rem;
    margin-bottom: 1rem; max-height: 60vh; overflow-y: auto;
    scroll-behavior: smooth;
  }
  .msg {
    padding: 1rem 1.25rem; border-radius: 16px; max-width: 88%;
    white-space: pre-wrap; animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .msg.user { background: #2b3a2e; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
  .msg.assistant { background: #f8f6f1; border: 1px solid #e0e0e0; align-self: flex-start; border-bottom-left-radius: 4px; }

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
  .markdown :global(code) { background: #e5e5e5; padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.85em; }
  .markdown :global(pre) { background: #2b3a2e; color: #fff; padding: 0.75rem; border-radius: 8px; overflow-x: auto; margin: 0.5rem 0; font-size: 0.85em; }
  .markdown :global(pre code) { background: none; padding: 0; }
  .markdown :global(strong) { font-weight: 600; }
  .markdown :global(hr) { border: none; border-top: 1px solid #ddd; margin: 0.5rem 0; }
  .markdown :global(blockquote) { border-left: 3px solid #ccc; margin: 0.4rem 0; padding-left: 0.75rem; color: #555; }

  /* Loading & error */
  .error {
    background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;
    padding: 0.875rem 1rem; border-radius: 12px; margin-bottom: 1rem;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  }
  .retry-btn {
    background: none; border: 1px solid #991b1b; color: #991b1b;
    padding: 0.375rem 0.75rem; border-radius: 8px; cursor: pointer;
    font-size: 0.8rem; white-space: nowrap; transition: all 0.15s ease;
  }
  .retry-btn:hover { background: #991b1b; color: white; }

  .loading { display: flex; gap: 0.4rem; align-items: center; padding: 1rem 1.25rem; }
  .dot { width: 10px; height: 10px; background: #6b7c6e; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  @keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

  /* Form */
  form { display: flex; gap: 0.5rem; }
  form input {
    flex: 1; padding: 0.875rem 1.25rem;
    border: 2px solid #ddd; border-radius: 28px;
    font-size: 1rem; min-height: 52px;
    transition: border-color 0.15s ease;
  }
  form input:focus { border-color: #2b3a2e; outline: none; }
  form input:disabled { background: #f5f5f5; }

  form button {
    background: #2b3a2e; color: white; border: none;
    padding: 0.875rem 1.75rem; border-radius: 28px;
    cursor: pointer; font-size: 1rem; font-weight: 500;
    min-height: 52px; min-width: 80px;
    transition: all 0.15s ease;
  }
  form button:hover:not(:disabled) { background: #1a2920; }
  form button:focus-visible { outline: 2px solid #2b3a2e; outline-offset: 2px; }
  form button:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Mobile adjustments */
  @media (max-width: 480px) {
    .chat { padding: 1rem; }
    .header h1 { font-size: 1.25rem; }
    .back-btn { position: static; margin-bottom: 0.75rem; }
    .header { display: flex; flex-direction: column; align-items: center; }
    .msg { max-width: 92%; }
    .examples button { width: 100%; text-align: left; }
  }
</style>
