<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { ImportedDocument, ManualProfile, ManualSection, WorkspaceTool } from '@hoggcountry/manual-core';
  import type { ScoutLabVariant } from '$lib/scout-lab';
  import { SCOUT_LAB_VARIANTS } from '$lib/scout-lab';

  interface WorkspaceSnapshot {
    readonly profile: ManualProfile | null;
    readonly sections: ManualSection[];
    readonly documents: ImportedDocument[];
    readonly tools: WorkspaceTool[];
  }

  interface ProviderConnection {
    readonly providerId: 'openai-codex' | 'openai' | 'opencode-go';
    readonly label: string;
    readonly status: 'connected';
    readonly accountId: string | null;
    readonly expiresAt: string | null;
    readonly model?: string;
  }

  interface ClawMessage {
    readonly id: string;
    readonly role: 'user' | 'assistant';
    readonly text: string;
    readonly createdAt: string;
    readonly model: string | null;
    readonly error: boolean;
  }

  interface ExamplePrompt {
    readonly title: string;
    readonly text: string;
  }

  interface DadPilotSummary {
    readonly latestFixLabel: string;
    readonly latestFixAt: string | null;
    readonly latestFixIsPreview: boolean;
    readonly dispatchCount: number;
    readonly latestDispatchTitle: string | null;
    readonly latestDispatchPublished: string | null;
  }

  type DocTab = 'plans' | 'locker';

  const { variant } = $props<{ variant: ScoutLabVariant }>();

  let profile = $state<ManualProfile | null>(null);
  let connection = $state<ProviderConnection | null>(null);
  let dadPilot = $state<DadPilotSummary | null>(null);
  let documents = $state<ImportedDocument[]>([]);
  let messages = $state<ClawMessage[]>([]);
  let loading = $state(true);
  let error = $state('');
  let sendBusy = $state(false);
  let connectBusy = $state(false);
  let disconnectBusy = $state(false);
  let savingMessageId = $state<string | null>(null);
  let savedMessageIds = $state<string[]>([]);
  let saveNotice = $state('');
  let saveError = $state('');
  let savedDocumentHref = $state('');
  let replyInput = $state('');
  let authorizeUrl = $state('');
  let connectMode = $state<'cloud_callback' | 'manual_callback' | ''>('');
  let connectRedirectUri = $state('');
  let connectInstructions = $state<string[]>([]);
  let connectInput = $state('');
  let connectError = $state('');
  let connectNotice = $state('');
  let pendingPrompt = $state('');
  let selectedDocId = $state('');
  let selectedPlanId = $state('');
  let docTabOverrides = $state<Record<string, DocTab>>({});
  const defaultDocTab = $derived<DocTab>(variant.id === 'docs-radar' ? 'locker' : 'plans');
  const docTab = $derived<DocTab>(docTabOverrides[variant.id] ?? defaultDocTab);
  let threadCard: HTMLElement | null = null;
  let threadMessages: HTMLDivElement | null = null;

  function setDocTab(tab: DocTab): void {
    docTabOverrides = { ...docTabOverrides, [variant.id]: tab };
  }

  async function jsonOrThrow(response: Response) {
    if (!response.ok) {
      const message = await response.text().catch(() => 'Request failed.');
      throw new Error(message || 'Request failed.');
    }

    return response.json();
  }

  function excerpt(value: string, maxLength = 180): string {
    const normalized = value.replace(/\s+/gu, ' ').trim();
    if (!normalized) return '';
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
  }

  function savedPlans(currentDocs: ImportedDocument[]): ImportedDocument[] {
    return [...currentDocs]
      .filter((document) => document.rights === 'assistant-generated')
      .sort((a, b) => Date.parse(b.importedAt) - Date.parse(a.importedAt));
  }

  function lockerDocs(currentDocs: ImportedDocument[]): ImportedDocument[] {
    return [...currentDocs]
      .filter((document) => document.rights !== 'assistant-generated')
      .sort((a, b) => Date.parse(b.importedAt) - Date.parse(a.importedAt));
  }

  function allDocs(currentDocs: ImportedDocument[]): ImportedDocument[] {
    return [...currentDocs].sort((a, b) => Date.parse(b.importedAt) - Date.parse(a.importedAt));
  }

  function ensureSelections(currentDocs: ImportedDocument[]) {
    const docs = allDocs(currentDocs);
    const plans = savedPlans(currentDocs);

    if (!selectedDocId || !docs.some((document) => document.id === selectedDocId)) {
      selectedDocId = docs[0]?.id ?? '';
    }

    if (selectedPlanId && !plans.some((document) => document.id === selectedPlanId)) {
      selectedPlanId = '';
    }

    if (!selectedPlanId && plans.length > 0 && (variant.id === 'docs-radar' || variant.id === 'mission-control')) {
      selectedPlanId = plans[0]?.id ?? '';
    }
  }

  function selectedDoc(currentDocs: ImportedDocument[]): ImportedDocument | null {
    return allDocs(currentDocs).find((document) => document.id === selectedDocId) ?? null;
  }

  function docPreview(document: ImportedDocument | null): string {
    if (!document) return '';
    return excerpt(document.note || document.textContent || '', 220) || 'This document is stored in the workspace locker and ready to review.';
  }

  function docMeta(document: ImportedDocument | null): string {
    if (!document) return '';
    return `${document.rights === 'assistant-generated' ? 'saved plan' : document.kind} · ${(document.sizeBytes / 1024).toFixed(1)} KB · ${new Date(document.importedAt).toLocaleString()}`;
  }

  function buildExamplePrompts(currentProfile: ManualProfile | null): ExamplePrompt[] {
    const mileText = currentProfile ? `mile ${currentProfile.currentMile.toFixed(0)}` : 'my current mile';
    const paceText = currentProfile && currentProfile.targetPace > 0
      ? `${currentProfile.targetPace.toFixed(0)} miles per day`
      : 'my real pace';

    return [
      {
        title: 'Next 7 days',
        text: `Build a 7-day itinerary from ${mileText}. Use ${paceText}. I want to carry at most 4 days of food at a time. Suggest likely hostel, town, shuttle, or resupply targets, plus the assumptions that still need checking.`
      },
      {
        title: 'Next food carry',
        text: `Plan my next 4-day max food carry from ${mileText}. Keep it trail-practical. Show likely daily mileage, sleep targets, and the next realistic town or hostel options.`
      },
      {
        title: 'Weakest link',
        text: `Look at my current trail situation from ${mileText} and tell me the weakest part of my next week. Give me the smallest set of notes, docs, or checklist updates that would tighten the plan fast.`
      }
    ];
  }

  function buildDadPilotPrompts(summary: DadPilotSummary | null): ExamplePrompt[] {
    if (!summary) return [];

    const fixLine = `Latest public Garmin fix: ${summary.latestFixLabel}${summary.latestFixAt ? ` at ${new Date(summary.latestFixAt).toLocaleString()}` : ''}.`;
    const dispatchLine = summary.latestDispatchTitle
      ? `Latest public dispatch: ${summary.latestDispatchTitle}${summary.latestDispatchPublished ? ` (${new Date(summary.latestDispatchPublished).toLocaleDateString()})` : ''}.`
      : `Recent dispatch count: ${summary.dispatchCount}.`;
    const context = `${fixLine} ${dispatchLine} Treat this as public pilot context only. If the exact AT mile is unclear, say so and estimate conservatively.`;

    return [
      {
        title: 'Dad next 7 days',
        text: `${context} Draft Dad's next 7 days with conservative daily mileage, max 4-day food carries, likely town or hostel timing, and the assumptions that need checking next.`
      },
      {
        title: 'Dad next food carry',
        text: `${context} Plan Dad's next food carry. Keep it practical, show likely sleep targets, and name the next realistic town, hostel, or shuttle options instead of vague optimism.`
      }
    ];
  }

  function useExamplePrompt(example: ExamplePrompt) {
    replyInput = example.text;
    focusComposer();
  }

  function consumeConnectQueryState() {
    const url = new URL(window.location.href);
    const connected = url.searchParams.get('chatgpt_connected');
    const connectErrorMessage = url.searchParams.get('chatgpt_connect_error');

    if (!connected && !connectErrorMessage) return;

    if (connected) {
      connectNotice = 'ChatGPT connected to this workspace.';
      connectError = '';
      authorizeUrl = '';
      connectInstructions = [];
      connectInput = '';
    }

    if (connectErrorMessage) {
      connectError = connectErrorMessage;
      connectNotice = '';
    }

    url.searchParams.delete('chatgpt_connected');
    url.searchParams.delete('chatgpt_connect_error');
    window.history.replaceState({}, '', url);
  }

  async function focusCloudThread() {
    await tick();
    threadCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function scrollCloudThreadToLatest() {
    await tick();
    if (threadMessages) {
      threadMessages.scrollTop = threadMessages.scrollHeight;
    }
  }

  async function focusComposer() {
    await focusCloudThread();
  }

  async function loadState() {
    loading = true;
    error = '';

    try {
      const [workspacePayload, clawPayload, dadPayload] = await Promise.all([
        jsonOrThrow(await fetch('/app-api/workspace', { cache: 'no-store' })),
        jsonOrThrow(await fetch('/app-api/scout', { cache: 'no-store' })),
        fetch('/app-api/dad', { cache: 'no-store' })
          .then((response) => (response.ok ? response.json() : null))
          .catch(() => null)
      ]);

      const workspace = workspacePayload as WorkspaceSnapshot;
      profile = workspace.profile;
      documents = Array.isArray(workspace.documents) ? workspace.documents : [];
      ensureSelections(documents);
      connection = (clawPayload.connection ?? null) as ProviderConnection | null;
      dadPilot = dadPayload ? (dadPayload as DadPilotSummary) : null;
      messages = Array.isArray(clawPayload.messages) ? (clawPayload.messages as ClawMessage[]) : [];
      await scrollCloudThreadToLatest();
    } catch (caught) {
      console.error(caught);
      error = caught instanceof Error ? caught.message : 'Could not load the Scout control panel.';
    } finally {
      loading = false;
    }
  }

  async function startConnect() {
    connectBusy = true;
    connectError = '';
    connectNotice = '';

    try {
      const payload = await jsonOrThrow(
        await fetch('/app-api/scout/connect/openai-codex/start', {
          method: 'POST'
        })
      );

      authorizeUrl = String(payload.authorizeUrl ?? '');
      connectMode = payload.mode === 'cloud_callback' || payload.mode === 'manual_callback' ? payload.mode : '';
      connectRedirectUri = typeof payload.redirectUri === 'string' ? payload.redirectUri : '';
      connectInstructions = Array.isArray(payload.instructions) ? payload.instructions.map(String) : [];

      if (authorizeUrl) {
        window.open(authorizeUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (caught) {
      console.error(caught);
      connectError = caught instanceof Error ? caught.message : 'Could not start ChatGPT connect.';
    } finally {
      connectBusy = false;
    }
  }

  async function finishConnect() {
    connectBusy = true;
    connectError = '';
    connectNotice = '';

    try {
      await jsonOrThrow(
        await fetch('/app-api/scout/connect/openai-codex/complete', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            authorizationInput: connectInput
          })
        })
      );

      authorizeUrl = '';
      connectMode = '';
      connectRedirectUri = '';
      connectInstructions = [];
      connectInput = '';
      connectNotice = 'ChatGPT connected to this workspace.';
      await loadState();
    } catch (caught) {
      console.error(caught);
      connectError = caught instanceof Error ? caught.message : 'Could not finish ChatGPT connect.';
    } finally {
      connectBusy = false;
    }
  }

  async function disconnect() {
    disconnectBusy = true;
    connectError = '';
    connectNotice = '';

    try {
      await jsonOrThrow(
        await fetch('/app-api/scout/connect/openai-codex/disconnect', {
          method: 'POST'
        })
      );

      authorizeUrl = '';
      connectMode = '';
      connectRedirectUri = '';
      connectInstructions = [];
      connectInput = '';
      selectedPlanId = '';
      await loadState();
    } catch (caught) {
      console.error(caught);
      connectError = caught instanceof Error ? caught.message : 'Could not disconnect ChatGPT.';
    } finally {
      disconnectBusy = false;
    }
  }

  async function sendMessage() {
    const message = replyInput.trim();
    if (!message) return;

    const previousMessages = messages;
    const pendingUserMessage: ClawMessage = {
      id: `pending-user-${Date.now()}`,
      role: 'user',
      text: message,
      createdAt: new Date().toISOString(),
      model: null,
      error: false
    };

    sendBusy = true;
    pendingPrompt = message;
    error = '';
    saveNotice = '';
    saveError = '';
    replyInput = '';
    messages = [...messages, pendingUserMessage];
    await focusCloudThread();
    await scrollCloudThreadToLatest();

    try {
      const payload = await jsonOrThrow(
        await fetch('/app-api/scout/reply', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            message,
            documentId: selectedPlanId || null
          })
        })
      );

      messages = Array.isArray(payload.messages) ? (payload.messages as ClawMessage[]) : messages;
      documents = Array.isArray(payload.documents) ? (payload.documents as ImportedDocument[]) : documents;
      ensureSelections(documents);
      connection = (payload.connection ?? null) as ProviderConnection | null;
      const revisedDocument = (payload.revisedDocument ?? null) as ImportedDocument | null;
      if (revisedDocument) {
        savedDocumentHref = `/app/docs#doc-${revisedDocument.id}`;
        saveNotice = `Updated “${revisedDocument.title}” in Docs.`;
        selectedDocId = revisedDocument.id;
        selectedPlanId = revisedDocument.id;
      }
      pendingPrompt = '';
      await focusCloudThread();
      await scrollCloudThreadToLatest();
    } catch (caught) {
      console.error(caught);
      messages = previousMessages;
      replyInput = message;
      pendingPrompt = '';
      error = caught instanceof Error ? caught.message : 'Could not send the cloud prompt.';
    } finally {
      sendBusy = false;
    }
  }

  async function saveReplyAsDocument(messageId: string) {
    savingMessageId = messageId;
    saveNotice = '';
    saveError = '';

    try {
      const payload = await jsonOrThrow(
        await fetch('/app-api/scout/save-document', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({ messageId })
        })
      );

      const document = (payload.document ?? null) as ImportedDocument | null;
      documents = Array.isArray(payload.documents) ? (payload.documents as ImportedDocument[]) : documents;
      ensureSelections(documents);
      if (document) {
        savedMessageIds = savedMessageIds.includes(messageId) ? savedMessageIds : [...savedMessageIds, messageId];
        selectedDocId = document.id;
        selectedPlanId = document.id;
        savedDocumentHref = `/app/docs#doc-${document.id}`;
        saveNotice = `Saved “${document.title}” to Docs.`;
        setDocTab('plans');
      }
    } catch (caught) {
      console.error(caught);
      saveError = caught instanceof Error ? caught.message : 'Could not save that Scout reply.';
    } finally {
      savingMessageId = null;
    }
  }

  function choosePlan(documentId: string) {
    selectedPlanId = selectedPlanId === documentId ? '' : documentId;
    selectedDocId = documentId;
    setDocTab('plans');
  }

  function chooseLockerDocument(documentId: string) {
    selectedDocId = documentId;
    setDocTab('locker');
  }

  onMount(() => {
    consumeConnectQueryState();
    loadState();
  });
</script>

<section class={`card hero-panel scout-lab-hero ${variant.layoutClass}`}>
  <div>
    <p class="eyebrow">{variant.eyebrow}</p>
    <h1>{variant.title}</h1>
    <p class="lede">{variant.summary}</p>
    <div class="subtle-actions" style="margin-top:0.9rem;">
      <a class="btn btn-ghost" href="/app/scout">Back to current Scout</a>
      <a class="btn btn-secondary" href="/app/docs">Open Docs locker</a>
    </div>
  </div>

  <article class="card card-soft panel-copy">
    <p class="eyebrow">Variant switcher</p>
    <div class="variant-switcher">
      {#each SCOUT_LAB_VARIANTS as option}
        <a class:active={option.id === variant.id} href={`/app/scout-lab/${option.id}`}>{option.name}</a>
      {/each}
    </div>
  </article>
</section>

{#if loading}
  <p class="meta-line" style="margin-top:1rem;">Loading Scout workspace…</p>
{/if}

{#if error}
  <p style="color:#8a2f2f; font-weight:700; margin-top:1rem;">{error}</p>
{/if}

<div class={`scout-lab-grid ${variant.layoutClass}`}>
  <section class="stack scout-region scout-region--pulse">
    <article class="card panel-copy">
      <p class="eyebrow">Workspace pulse</p>
      {#if connection}
        <span class="status-pill live">{connection.label}</span>
        <p class="meta-line">{connection.providerId} / {connection.model ?? 'gpt-5.4'}</p>
      {:else}
        <span class="status-pill warn">Not connected</span>
        <p class="meta-line">Connect a model lane to activate Scout on this panel.</p>
      {/if}

      <div class="stats-grid compact-stats" style="margin-top:1rem;">
        <article class="card card-soft panel-copy compact-stat-card">
          <p class="eyebrow">Saved plans</p>
          <strong>{savedPlans(documents).length}</strong>
        </article>
        <article class="card card-soft panel-copy compact-stat-card">
          <p class="eyebrow">Locker docs</p>
          <strong>{lockerDocs(documents).length}</strong>
        </article>
        <article class="card card-soft panel-copy compact-stat-card">
          <p class="eyebrow">Thread turns</p>
          <strong>{messages.length}</strong>
        </article>
      </div>

      {#if profile}
        <p class="meta-line" style="margin-top:1rem;">
          {profile.trailName} · mile {profile.currentMile.toFixed(0)} · {profile.direction} · target {profile.targetPace.toFixed(0)} mpd
        </p>
      {:else}
        <p class="meta-line" style="margin-top:1rem;">Profile is still thin. Scout can still talk, but the plans will stay looser.</p>
      {/if}
    </article>

    <article class="card panel-copy">
      <p class="eyebrow">Connected brain</p>
      {#if connection}
        <h2>Scout is ready.</h2>
        <p class="muted">This workspace now has {connection.label} behind it.</p>
        {#if connection.providerId === 'openai-codex'}
          <button class="primary-button" type="button" onclick={disconnect} disabled={disconnectBusy}>
            {disconnectBusy ? 'Disconnecting…' : 'Disconnect ChatGPT'}
          </button>
        {:else}
          <p class="meta-line" style="margin-top:0.85rem;">House-funded lane. No hiker connection needed.</p>
        {/if}
      {:else}
        <h2>Connect ChatGPT</h2>
        <p class="muted">Connect once, then every lab page uses the same Scout thread and saved plans.</p>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:0.85rem;">
          <button class="primary-button" type="button" onclick={startConnect} disabled={connectBusy}>
            {connectBusy ? 'Starting…' : 'Connect ChatGPT'}
          </button>
          {#if authorizeUrl}
            <a class="secondary-button" href={authorizeUrl} rel="noreferrer" target="_blank">Open auth again</a>
          {/if}
        </div>

        {#if connectInstructions.length > 0}
          <ol class="stack" style="margin-top:1rem; padding-left:1.25rem;">
            {#each connectInstructions as instruction}
              <li class="muted">{instruction}</li>
            {/each}
          </ol>

          <label class="stack" style="margin-top:1rem;">
            <span class="eyebrow">Manual finish fallback</span>
            <textarea
              bind:value={connectInput}
              rows="4"
              placeholder={connectMode === 'cloud_callback' && connectRedirectUri ? `${connectRedirectUri}?code=...&state=...` : 'http://localhost:1455/auth/callback?code=...&state=...'}
              style="width:100%; border-radius:16px; border:1px solid rgba(94,108,84,0.28); padding:0.9rem; font:inherit; background:#fff;"
            ></textarea>
          </label>
          <button class="primary-button" type="button" onclick={finishConnect} disabled={connectBusy || !connectInput.trim()}>
            {connectBusy ? 'Finishing…' : 'Finish connect'}
          </button>
        {/if}
      {/if}

      {#if connectNotice}
        <p class="meta-line" style="margin-top:1rem;">{connectNotice}</p>
      {/if}

      {#if connectError}
        <p style="color:#8a2f2f; font-weight:700; margin-top:1rem;">{connectError}</p>
      {/if}
    </article>
  </section>

  <section class="stack scout-region scout-region--actions">
    <article class="card panel-copy">
      <p class="eyebrow">{variant.actionsTitle}</p>
      <h2>Easy starts</h2>
      <p class="muted">Keep the next question plain. Strong prompts should feel like trail decisions, not console commands.</p>
      <div class="chip-grid" style="margin-top:1rem;">
        {#each buildExamplePrompts(profile) as example}
          <button type="button" class="secondary-button chip-button" disabled={sendBusy} onclick={() => useExamplePrompt(example)}>
            {example.title}
          </button>
        {/each}
      </div>

      {#if dadPilot}
        <div style="margin-top:1rem;">
          <p class="eyebrow">Field pilot</p>
          <p class="meta-line">Latest public fix: {dadPilot.latestFixLabel}{#if dadPilot.latestDispatchTitle} · {dadPilot.latestDispatchTitle}{/if}</p>
          <div class="chip-grid" style="margin-top:0.75rem;">
            {#each buildDadPilotPrompts(dadPilot) as example}
              <button type="button" class="secondary-button chip-button" disabled={sendBusy} onclick={() => useExamplePrompt(example)}>
                {example.title}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </article>

    <article class="card panel-copy">
      <p class="eyebrow">Active plan target</p>
      {#if selectedPlanId}
        <h2>{savedPlans(documents).find((document) => document.id === selectedPlanId)?.title}</h2>
        <p class="muted">The next Scout send will revise this saved plan in place instead of starting from scratch.</p>
        <button class="secondary-button" type="button" onclick={() => selectedPlanId = ''}>Clear revision target</button>
      {:else}
        <h2>No plan selected</h2>
        <p class="muted">Pick a saved plan from the docs rail if you want Scout to update it in place.</p>
      {/if}
    </article>
  </section>

  <section class="stack scout-region scout-region--conversation" bind:this={threadCard}>
    <article class="card panel-copy">
      <p class="eyebrow">{variant.conversationTitle}</p>
      <h2>Running conversation with Scout</h2>
      <p class="muted">Your live thread should feel obvious here: you send, Scout works, the reply lands back in this same card.</p>

      {#if sendBusy}
        <article class="card card-soft panel-copy thread-status-card">
          <p class="eyebrow">Scout is working</p>
          <p class="muted">Stay on this thread. The reply will appear right below.</p>
          {#if pendingPrompt}
            <p class="meta-line" style="margin-top:0.6rem;">Current ask: “{pendingPrompt}”</p>
          {/if}
        </article>
      {/if}

      <div class="stack thread-log" bind:this={threadMessages}>
        {#if messages.length === 0}
          <article class="card card-soft panel-copy">
            <p class="muted">No thread yet. Send the first real prompt and Scout should answer here.</p>
          </article>
        {:else}
          {#each messages as message}
            <article class={`card panel-copy ${message.role === 'assistant' ? 'card-soft' : ''}`}>
              <p class="eyebrow">{message.role === 'assistant' ? 'Scout' : 'You'}</p>
              <p style="white-space:pre-wrap; margin-bottom:0;">{message.text}</p>
              <p class="meta-line" style="margin-top:0.85rem;">
                {new Date(message.createdAt).toLocaleString()}
                {#if message.model}
                  · {message.model}
                {/if}
                {#if message.error}
                  · error
                {/if}
              </p>
              {#if message.role === 'assistant' && !message.error}
                <div class="subtle-actions" style="margin-top:0.85rem;">
                  <button
                    class="secondary-button"
                    type="button"
                    onclick={() => saveReplyAsDocument(message.id)}
                    disabled={savingMessageId === message.id || savedMessageIds.includes(message.id)}
                  >
                    {#if savingMessageId === message.id}
                      Saving…
                    {:else if savedMessageIds.includes(message.id)}
                      Saved to Docs
                    {:else}
                      Save to Docs
                    {/if}
                  </button>
                </div>
              {/if}
            </article>
          {/each}

          {#if sendBusy}
            <article class="card card-soft panel-copy">
              <p class="eyebrow">Scout</p>
              <p class="muted">Drafting a reply now…</p>
            </article>
          {/if}
        {/if}
      </div>

      {#if saveNotice}
        <p class="meta-line" style="margin-top:1rem;">
          {saveNotice}
          {#if savedDocumentHref}
            <a href={savedDocumentHref}>Open doc</a>
          {/if}
        </p>
      {/if}

      {#if saveError}
        <p style="color:#8a2f2f; font-weight:700; margin-top:1rem;">{saveError}</p>
      {/if}

      <label class="stack" style="margin-top:1rem;">
        <span class="eyebrow">Prompt</span>
        <textarea
          bind:value={replyInput}
          rows="5"
          disabled={!connection || sendBusy}
          placeholder={connection ? variant.promptPlaceholder : 'Connect Scout first.'}
          style="width:100%; border-radius:16px; border:1px solid rgba(94,108,84,0.28); padding:0.9rem; font:inherit; background:#fff;"
        ></textarea>
      </label>
      {#if selectedPlanId}
        <p class="meta-line" style="margin-top:0.85rem;">
          Revising: {savedPlans(documents).find((document) => document.id === selectedPlanId)?.title}
        </p>
      {/if}
      <button class="primary-button" type="button" onclick={sendMessage} disabled={!connection || sendBusy || !replyInput.trim()}>
        {#if sendBusy}
          Sending…
        {:else if selectedPlanId}
          Revise selected plan
        {:else}
          Send to Scout
        {/if}
      </button>
      {#if sendBusy}
        <p class="meta-line" style="margin-top:0.85rem;">Scout is working. The reply will land above in this thread.</p>
      {/if}
    </article>
  </section>

  <section class="stack scout-region scout-region--docs">
    <article class="card panel-copy">
      <p class="eyebrow">{variant.docsTitle}</p>
      <div class="docs-header-row">
        <h2 style="margin:0;">Docs beside Scout</h2>
        <a class="meta-line" href="/app/docs">Open full docs page</a>
      </div>
      <p class="muted">Keep saved plans and the private locker close to the conversation instead of bouncing between pages.</p>

      <div class="docs-tabs" style="margin-top:1rem;">
        <button type="button" class:active={docTab === 'plans'} onclick={() => setDocTab('plans')}>
          Saved plans ({savedPlans(documents).length})
        </button>
        <button type="button" class:active={docTab === 'locker'} onclick={() => setDocTab('locker')}>
          Locker ({lockerDocs(documents).length})
        </button>
      </div>

      {#if docTab === 'plans'}
        <div class="docs-list">
          {#if savedPlans(documents).length === 0}
            <article class="card card-soft panel-copy">
              <p class="muted">No saved Scout plans yet. Save a strong reply and it will appear here.</p>
            </article>
          {:else}
            {#each savedPlans(documents).slice(0, 8) as document}
              <button
                type="button"
                class={`doc-card ${selectedDocId === document.id ? 'selected' : ''} ${selectedPlanId === document.id ? 'targeted' : ''}`}
                onclick={() => choosePlan(document.id)}
              >
                <span class="eyebrow">saved plan</span>
                <strong>{document.title}</strong>
                <span class="meta-line">{new Date(document.importedAt).toLocaleDateString()}</span>
              </button>
            {/each}
          {/if}
        </div>
      {:else}
        <div class="docs-list">
          {#if lockerDocs(documents).length === 0}
            <article class="card card-soft panel-copy">
              <p class="muted">No imported docs in the locker yet.</p>
            </article>
          {:else}
            {#each lockerDocs(documents).slice(0, 8) as document}
              <button
                type="button"
                class={`doc-card ${selectedDocId === document.id ? 'selected' : ''}`}
                onclick={() => chooseLockerDocument(document.id)}
              >
                <span class="eyebrow">{document.kind}</span>
                <strong>{document.title}</strong>
                <span class="meta-line">{new Date(document.importedAt).toLocaleDateString()}</span>
              </button>
            {/each}
          {/if}
        </div>
      {/if}

      {#if selectedDoc(documents)}
        <article class="card card-soft panel-copy selected-doc-preview">
          <p class="eyebrow">Selected doc</p>
          <h3>{selectedDoc(documents)?.title}</h3>
          <p class="muted">{docPreview(selectedDoc(documents))}</p>
          <p class="meta-line">{docMeta(selectedDoc(documents))}</p>
          <div class="subtle-actions" style="margin-top:0.85rem;">
            <a class="secondary-button" href={`/app/docs#doc-${selectedDoc(documents)?.id}`}>Open in Docs</a>
          </div>
        </article>
      {/if}
    </article>
  </section>
</div>

<style>
  .variant-switcher {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    margin-top: 0.75rem;
  }

  .variant-switcher a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.7rem 0.95rem;
    border-radius: 999px;
    border: 1px solid rgba(94, 108, 84, 0.2);
    color: inherit;
    text-decoration: none;
    background: rgba(255, 255, 255, 0.88);
    font-weight: 700;
  }

  .variant-switcher a.active {
    background: #21352b;
    color: #f7f3e8;
    border-color: #21352b;
  }

  .scout-lab-grid {
    display: grid;
    gap: 1rem;
    margin-top: 1rem;
  }

  .scout-region--pulse {
    grid-area: pulse;
  }

  .scout-region--actions {
    grid-area: actions;
  }

  .scout-region--conversation {
    grid-area: conversation;
  }

  .scout-region--docs {
    grid-area: docs;
  }

  .variant-mission-control.scout-lab-grid {
    grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.9fr);
    grid-template-areas:
      'pulse docs'
      'conversation docs'
      'actions docs';
    align-items: start;
  }

  .variant-trail-desk.scout-lab-grid {
    grid-template-columns: minmax(220px, 0.65fr) minmax(0, 1.2fr) minmax(280px, 0.8fr);
    grid-template-areas: 'pulse conversation docs';
    align-items: start;
  }

  .variant-docs-radar.scout-lab-grid {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.95fr);
    grid-template-areas:
      'pulse conversation'
      'docs conversation'
      'docs actions';
    align-items: start;
  }

  .variant-campfire.scout-lab-grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'pulse'
      'conversation'
      'actions'
      'docs';
  }

  .compact-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .compact-stat-card strong {
    font-size: 1.35rem;
  }

  .chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .chip-button {
    min-width: 0;
  }

  .thread-status-card {
    margin-top: 1rem;
    border-color: rgba(94, 108, 84, 0.18);
  }

  .thread-log {
    margin-top: 1rem;
    max-height: 34rem;
    overflow: auto;
    scroll-behavior: smooth;
  }

  .docs-header-row {
    display: flex;
    gap: 0.75rem;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .docs-tabs {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .docs-tabs button {
    border: 1px solid rgba(94, 108, 84, 0.2);
    background: rgba(255, 255, 255, 0.85);
    border-radius: 999px;
    padding: 0.7rem 0.95rem;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .docs-tabs button.active {
    background: #21352b;
    color: #f7f3e8;
    border-color: #21352b;
  }

  .docs-list {
    display: grid;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .doc-card {
    display: grid;
    gap: 0.3rem;
    text-align: left;
    border-radius: 18px;
    border: 1px solid rgba(94, 108, 84, 0.2);
    background: rgba(255, 255, 255, 0.92);
    padding: 0.95rem;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }

  .doc-card.selected {
    border-color: rgba(33, 53, 43, 0.45);
    box-shadow: 0 0 0 1px rgba(33, 53, 43, 0.12);
  }

  .doc-card.targeted {
    background: rgba(228, 234, 221, 0.95);
  }

  .selected-doc-preview {
    margin-top: 1rem;
  }

  .variant-campfire .docs-list {
    display: flex;
    overflow: auto;
    padding-bottom: 0.25rem;
  }

  .variant-campfire .doc-card {
    min-width: 16rem;
  }

  @media (max-width: 1100px) {
    .variant-mission-control.scout-lab-grid,
    .variant-trail-desk.scout-lab-grid,
    .variant-docs-radar.scout-lab-grid {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        'pulse'
        'actions'
        'conversation'
        'docs';
    }
  }
</style>
