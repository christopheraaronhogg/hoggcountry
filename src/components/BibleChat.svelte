<script lang="ts">
  import { onMount, tick } from 'svelte';

  interface Message { role: 'user' | 'assistant'; content: string; books?: string[] }
  interface Conversation { id: string; createdAt: string; title: string; messages: Message[] }

  const STORAGE_KEY = 'kjv-ai-conversations';
  const SHOW_RECENT_COUNT = 5;

  // Convert markdown-style response to HTML
  function formatResponse(text: string): string {
    return text
      // Bold references like **Psalm 4:8**
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Paragraph breaks
      .replace(/\n\n/g, '</p><p>')
      // Single line breaks
      .replace(/\n/g, '<br>')
      // Wrap in paragraph
      .replace(/^(.*)$/, '<p>$1</p>');
  }

  let question = $state('');
  let messages = $state<Message[]>([]);
  let isLoading = $state(false);
  let error = $state('');
  let currentConvoId = $state<string | null>(null);
  let savedConversations = $state<Conversation[]>([]);
  let showAllConversations = $state(false);

  let inputRef: HTMLInputElement;

  const visibleConversations = $derived(
    showAllConversations ? savedConversations : savedConversations.slice(0, SHOW_RECENT_COUNT)
  );
  const hasMoreConversations = $derived(savedConversations.length > SHOW_RECENT_COUNT);

  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) savedConversations = JSON.parse(saved);
    } catch (e) { /* ignore */ }
    inputRef?.focus();
  });

  async function scrollToBottom() {
    await tick();
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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
    showAllConversations = false;
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
      const res = await fetch('/.netlify/functions/ask-kjv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');

      // Store response with optional books info
      messages = [...messages, { role: 'assistant', content: data.answer || 'No response', books: data.books }];
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
    "I can't sleep and I'm worried",
    "Help me with grief and loss",
    "What does the Bible say about fear?"
  ];
</script>

<div class="chat" role="main" aria-label="Bible Chat">
  <header class="header">
    {#if messages.length > 0}
      <button class="back-btn" onclick={newChat} aria-label="Start new conversation">
        ← New Search
      </button>
    {/if}
    <h1>Scripture Guide</h1>
    <p>King James Version · Wisdom from across the Bible</p>
  </header>

  {#if messages.length === 0}
    {#if savedConversations.length > 0}
      <section class="recent" aria-label="Recent searches">
        <h2>Recent Searches</h2>
        <p class="offline-hint">Saved locally for offline study</p>
        <ul class="recent-list">
          {#each visibleConversations as convo}
            <li>
              <button class="recent-card" onclick={() => loadConversation(convo)} aria-label="Continue: {convo.title}">
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
                  aria-label="Delete"
                >×</span>
              </button>
            </li>
          {/each}
        </ul>
        {#if hasMoreConversations}
          <button class="show-more" onclick={() => showAllConversations = !showAllConversations}>
            {showAllConversations ? 'Show less' : `Show all ${savedConversations.length} searches`}
          </button>
        {/if}
      </section>
    {/if}

    <section class="examples" aria-label="Example questions">
      <p>{savedConversations.length > 0 ? 'Or search something new:' : 'Try asking:'}</p>
      <div>
        {#each examples as q}
          <button onclick={() => { question = q; askQuestion(); }}>{q}</button>
        {/each}
      </div>
    </section>
  {/if}

  {#if messages.length > 0}
    <div class="messages" role="log" aria-label="Scripture search" aria-live="polite">
      {#each messages as m}
        {#if m.role === 'user'}
          <div class="msg user">{m.content}</div>
        {:else}
          <div class="msg assistant">
            {#if m.books && m.books.length > 0}
              <div class="books-used">
                <span class="books-label">Drawing from:</span>
                {#each m.books as book, i}
                  <span class="book-tag">{book}</span>
                {/each}
              </div>
            {/if}
            <div class="response-content">{@html formatResponse(m.content)}</div>
          </div>
        {/if}
      {/each}
      {#if isLoading}
        <div class="msg assistant loading" role="status">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          <span class="sr-only">Searching Scripture...</span>
        </div>
      {/if}
    </div>
  {/if}

  {#if error}
    <div class="error" role="alert">
      <span>{error}</span>
      <button class="dismiss-btn" onclick={() => { error = ''; inputRef?.focus(); }}>Dismiss</button>
    </div>
  {/if}

  <form onsubmit={(e: Event) => { e.preventDefault(); askQuestion(); }}>
    <input
      bind:this={inputRef}
      bind:value={question}
      placeholder="Ask for scripture guidance..."
      disabled={isLoading}
      aria-label="Your question"
    />
    <button type="submit" disabled={isLoading || !question.trim()}>
      {isLoading ? '...' : 'Search'}
    </button>
  </form>
</div>

<style>
  .chat { max-width: 700px; margin: 0 auto; padding: 1.5rem; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

  .header { text-align: center; margin-bottom: 1.5rem; position: relative; }
  .header h1 { margin: 0; color: #4a3728; font-size: 1.5rem; }
  .header p { color: #7a6a5a; font-size: 0.9rem; margin: 0.25rem 0 0; }

  .back-btn {
    position: absolute; left: 0; top: 0;
    background: none; border: 1px solid #ccc; border-radius: 20px;
    padding: 0.4rem 0.9rem; font-size: 0.85rem;
    cursor: pointer; color: #4a3728;
    transition: all 0.15s ease;
  }
  .back-btn:hover { background: #4a3728; color: white; border-color: #4a3728; }
  .back-btn:focus-visible { outline: 2px solid #4a3728; outline-offset: 2px; }

  .recent { margin-bottom: 1.5rem; }
  .recent h2 { font-size: 1rem; color: #4a3728; margin: 0 0 0.25rem; font-weight: 600; }
  .offline-hint { font-size: 0.8rem; color: #7a6a5a; margin: 0 0 0.75rem; font-style: italic; }
  .recent-list { display: flex; flex-direction: column; gap: 0.5rem; list-style: none; padding: 0; margin: 0; }
  .recent-list li { margin: 0; }

  .recent-card {
    display: flex; align-items: center; gap: 0.75rem; width: 100%;
    padding: 0.75rem 1rem; background: #faf8f5;
    border: 1px solid #e8e2d8; border-radius: 10px;
    cursor: pointer; text-align: left;
    transition: all 0.15s ease;
  }
  .recent-card:hover { border-color: #4a3728; background: #f5f2ed; }
  .recent-card:focus-visible { outline: 2px solid #4a3728; outline-offset: 2px; }

  .recent-content { flex: 1; min-width: 0; }
  .recent-title { display: block; font-size: 0.9rem; color: #4a3728; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
  .recent-meta { font-size: 0.75rem; color: #7a6a5a; }

  .recent-delete {
    color: #bbb; font-size: 1.2rem; cursor: pointer;
    padding: 0.25rem 0.5rem; border-radius: 4px;
    transition: all 0.15s ease;
  }
  .recent-delete:hover { color: #c33; background: rgba(200,50,50,0.1); }
  .recent-delete:focus-visible { outline: 2px solid #c33; outline-offset: 2px; }

  .show-more {
    background: none; border: none; color: #4a3728;
    font-size: 0.85rem; cursor: pointer; padding: 0.5rem 0;
    margin-top: 0.5rem; text-decoration: underline;
    transition: color 0.15s ease;
  }
  .show-more:hover { color: #2d221a; }

  .examples { background: #faf8f5; border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; }
  .examples p { font-size: 0.85rem; color: #7a6a5a; margin: 0 0 0.5rem; }
  .examples div { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .examples button {
    background: white; border: 1px solid #e8e2d8; border-radius: 20px;
    padding: 0.5rem 1rem; cursor: pointer; font-size: 0.85rem;
    transition: all 0.15s ease;
  }
  .examples button:hover { background: #4a3728; color: white; border-color: #4a3728; }
  .examples button:focus-visible { outline: 2px solid #4a3728; outline-offset: 2px; }

  .messages { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
  .msg {
    padding: 0.875rem 1rem; border-radius: 12px; max-width: 85%;
    white-space: pre-wrap; animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  .msg.user { background: #4a3728; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
  .msg.assistant { background: #faf8f5; border: 1px solid #e8e2d8; align-self: flex-start; border-bottom-left-radius: 4px; }

  /* Books used indicator */
  .books-used {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e8e2d8;
  }
  .books-label {
    font-size: 0.75rem;
    color: #7a6a5a;
  }
  .book-tag {
    font-size: 0.7rem;
    background: #e8e2d8;
    color: #4a3728;
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
    font-weight: 500;
  }

  /* Response content styling */
  .response-content {
    font-size: 0.95rem;
    line-height: 1.7;
    color: #3a2a1a;
  }
  .response-content p {
    margin: 0 0 0.75rem;
  }
  .response-content p:last-child {
    margin-bottom: 0;
  }
  .response-content strong {
    color: #4a3728;
    font-weight: 700;
  }

  .error {
    background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;
    padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  }
  .dismiss-btn {
    background: none; border: 1px solid #991b1b; color: #991b1b;
    padding: 0.25rem 0.5rem; border-radius: 6px; cursor: pointer;
    font-size: 0.75rem; transition: all 0.15s ease;
  }
  .dismiss-btn:hover { background: #991b1b; color: white; }

  .loading { display: flex; gap: 0.3rem; align-items: center; padding: 0.875rem 1rem; }
  .dot { width: 8px; height: 8px; background: #8a7a6a; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  @keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

  form { display: flex; gap: 0.5rem; }
  form input {
    flex: 1; padding: 0.75rem 1rem;
    border: 2px solid #e8e2d8; border-radius: 24px;
    font-size: 0.95rem;
    transition: border-color 0.15s ease;
  }
  form input:focus { border-color: #4a3728; outline: none; }
  form input:disabled { background: #f5f5f5; }

  form button {
    background: #4a3728; color: white; border: none;
    padding: 0.75rem 1.5rem; border-radius: 24px;
    cursor: pointer; font-size: 0.95rem;
    transition: all 0.15s ease;
  }
  form button:hover:not(:disabled) { background: #2d221a; }
  form button:focus-visible { outline: 2px solid #4a3728; outline-offset: 2px; }
  form button:disabled { opacity: 0.5; cursor: not-allowed; }

  @media (max-width: 480px) {
    .chat { padding: 1rem; }
    .header h1 { font-size: 1.25rem; }
    .back-btn { position: static; margin-bottom: 0.75rem; }
    .header { display: flex; flex-direction: column; align-items: center; }
    .msg { max-width: 92%; }
    .examples button { width: 100%; text-align: left; }
  }
</style>
