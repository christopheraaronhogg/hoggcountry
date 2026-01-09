<script lang="ts">
  import { marked } from 'marked';
  import { onMount } from 'svelte';

  // Configure marked for safe rendering
  marked.setOptions({ breaks: true, gfm: true });

  function renderMarkdown(text: string): string {
    if (!text) return '';
    return marked.parse(text) as string;
  }

  // Types
  interface Message { role: 'user' | 'assistant'; content: string }
  interface Conversation { id: string; createdAt: string; title: string; messages: Message[] }

  const STORAGE_KEY = 'at-trail-ai-conversations';
  const MAX_CONVERSATIONS = 10;

  let question = $state('');
  let messages = $state<Message[]>([]);
  let isLoading = $state(false);
  let error = $state('');
  let currentConvoId = $state<string | null>(null);
  let savedConversations = $state<Conversation[]>([]);
  let showHistory = $state(false);

  // Load saved conversations on mount
  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) savedConversations = JSON.parse(saved);
    } catch (e) { /* ignore */ }
  });

  // Save conversations to localStorage
  function saveConversations() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConversations));
    } catch (e) { /* ignore */ }
  }

  // Save current conversation
  function saveCurrentConvo() {
    if (messages.length === 0) return;

    const title = messages[0]?.content.slice(0, 50) + (messages[0]?.content.length > 50 ? '...' : '');

    if (currentConvoId) {
      // Update existing
      const idx = savedConversations.findIndex(c => c.id === currentConvoId);
      if (idx >= 0) {
        savedConversations[idx] = { ...savedConversations[idx], messages: [...messages] };
        savedConversations = [...savedConversations];
      }
    } else {
      // Create new
      currentConvoId = crypto.randomUUID();
      const newConvo: Conversation = { id: currentConvoId, createdAt: new Date().toISOString(), title, messages: [...messages] };
      savedConversations = [newConvo, ...savedConversations].slice(0, MAX_CONVERSATIONS);
    }
    saveConversations();
  }

  // Start new conversation
  function newChat() {
    messages = [];
    currentConvoId = null;
    error = '';
    showHistory = false;
  }

  // Load a conversation
  function loadConversation(convo: Conversation) {
    messages = [...convo.messages];
    currentConvoId = convo.id;
    showHistory = false;
  }

  // Delete a conversation
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
  <div class="header">
    <div class="header-top">
      <h2>AT Trail AI</h2>
      <div class="header-actions">
        {#if savedConversations.length > 0}
          <div class="history-wrapper">
            <button class="history-btn" onclick={() => showHistory = !showHistory}>
              History ({savedConversations.length})
            </button>
            {#if showHistory}
              <div class="history-dropdown">
                {#each savedConversations as convo}
                  <div class="history-item" onclick={() => loadConversation(convo)}>
                    <span class="history-title">{convo.title}</span>
                    <span class="history-date">{formatDate(convo.createdAt)}</span>
                    <button class="history-delete" onclick={(e) => deleteConversation(convo.id, e)}>×</button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
        {#if messages.length > 0}
          <button class="new-btn" onclick={newChat}>+ New</button>
        {/if}
      </div>
    </div>
    <p>Ask anything about thru-hiking the Appalachian Trail</p>
    {#if messages.length > 0}
      <p class="offline-note">Conversations saved locally for offline access on the trail</p>
    {/if}
  </div>

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
  .header-top { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 0.25rem; }
  .header h2 { margin: 0; color: #2b3a2e; }
  .header p { color: #6b7c6e; font-size: 0.9rem; margin: 0.25rem 0; }
  .header .offline-note { font-size: 0.75rem; color: #8b9c8e; font-style: italic; }
  .header-actions { display: flex; gap: 0.5rem; }
  .history-wrapper { position: relative; }
  .history-btn, .new-btn { background: #f8f6f1; border: 1px solid #ddd; border-radius: 16px; padding: 0.35rem 0.75rem; font-size: 0.8rem; cursor: pointer; color: #2b3a2e; }
  .history-btn:hover, .new-btn:hover { background: #2b3a2e; color: white; }
  .history-dropdown { position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: white; border: 1px solid #ddd; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 280px; max-height: 300px; overflow-y: auto; z-index: 100; }
  .history-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; cursor: pointer; border-bottom: 1px solid #eee; }
  .history-item:last-child { border-bottom: none; }
  .history-item:hover { background: #f8f6f1; }
  .history-title { flex: 1; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .history-date { font-size: 0.7rem; color: #999; }
  .history-delete { background: none; border: none; color: #999; font-size: 1.1rem; cursor: pointer; padding: 0 0.25rem; line-height: 1; }
  .history-delete:hover { color: #c33; }
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
