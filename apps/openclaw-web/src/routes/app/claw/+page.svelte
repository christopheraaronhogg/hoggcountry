<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { buildClawLanes } from '$lib/claw';
  import type { ImportedDocument, ManualProfile, ManualSection, WorkspaceTool } from '@hoggcountry/manual-core';
  import type { ClawLane } from '$lib/claw';

  interface WorkspaceSnapshot {
    readonly profile: ManualProfile | null;
    readonly sections: ManualSection[];
    readonly documents: ImportedDocument[];
    readonly tools: WorkspaceTool[];
  }

  interface ProviderConnection {
    readonly providerId: 'openai-codex';
    readonly label: string;
    readonly status: 'connected';
    readonly accountId: string | null;
    readonly expiresAt: string | null;
  }

  interface ClawMessage {
    readonly id: string;
    readonly role: 'user' | 'assistant';
    readonly text: string;
    readonly createdAt: string;
    readonly model: string | null;
    readonly error: boolean;
  }

  interface FactCandidate {
    readonly id: string;
    readonly kind: 'hostel' | 'resupply' | 'shuttle' | 'water' | 'closure' | 'weather_pattern' | 'gear' | 'medical' | 'other';
    readonly claimText: string;
    readonly regionSlug: string | null;
    readonly mileRangeStart: number | null;
    readonly mileRangeEnd: number | null;
    readonly confidence: number;
    readonly status: 'pending' | 'needs_review' | 'approved' | 'rejected' | 'stale';
    readonly createdAt: string;
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

  let profile = $state<ManualProfile | null>(null);
  let lanes = $state<ClawLane[]>([]);
  let connection = $state<ProviderConnection | null>(null);
  let dadPilot = $state<DadPilotSummary | null>(null);
  let documents = $state<ImportedDocument[]>([]);
  let selectedDocumentId = $state<string>('');
  let messages = $state<ClawMessage[]>([]);
  let factCandidates = $state<FactCandidate[]>([]);
  let loading = $state(true);
  let error = $state('');
  let sendBusy = $state(false);
  let connectBusy = $state(false);
  let disconnectBusy = $state(false);
  let seedBusy = $state(false);
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
  let threadCard: HTMLElement | null = null;
  let threadMessages: HTMLDivElement | null = null;

  async function jsonOrThrow(response: Response) {
    if (!response.ok) {
      const message = await response.text().catch(() => 'Request failed.');
      throw new Error(message || 'Request failed.');
    }

    return response.json();
  }

  function consumeConnectQueryState() {
    const url = new URL(window.location.href);
    const connected = url.searchParams.get('chatgpt_connected');
    const connectErrorMessage = url.searchParams.get('chatgpt_connect_error');

    if (!connected && !connectErrorMessage) {
      return;
    }

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

  function buildExamplePrompts(currentProfile: ManualProfile | null): ExamplePrompt[] {
    const mileText = currentProfile ? `mile ${currentProfile.currentMile.toFixed(0)}` : 'my current mile';
    const paceText = currentProfile && currentProfile.averageMilesPerDay > 0
      ? `${currentProfile.averageMilesPerDay.toFixed(0)} miles per day`
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

  function useExamplePrompt(example: ExamplePrompt) {
    replyInput = example.text;
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
      },
      {
        title: 'Dad weakest link',
        text: `${context} Tell me the weakest link in Dad's next week and what note, checklist, or plan revision would tighten it fastest.`
      }
    ];
  }

  function savedPlans(currentDocs: ImportedDocument[]): ImportedDocument[] {
    return [...currentDocs]
      .filter((document) => document.rights === 'assistant-generated')
      .sort((a, b) => Date.parse(b.importedAt) - Date.parse(a.importedAt));
  }

  function buildDocumentUpdatePrompt(document: ImportedDocument): string {
    return `Update my ${document.title}. Ask me only for the missing facts you need first, then keep this document current as we talk. If you already have enough context, rewrite it into a practical current version with a current snapshot, known facts, open questions, next actions, and change history.`;
  }

  function focusDocument(document: ImportedDocument) {
    selectedDocumentId = document.id;
    replyInput = buildDocumentUpdatePrompt(document);
    focusCloudThread();
  }

  function ensureSelectedDocument(currentDocs: ImportedDocument[]) {
    const plans = savedPlans(currentDocs);
    if (plans.length === 0) {
      selectedDocumentId = '';
      return;
    }

    if (selectedDocumentId && !plans.some((document) => document.id === selectedDocumentId)) {
      selectedDocumentId = '';
    }
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

  async function loadState() {
    loading = true;
    error = '';

    try {
      const [workspacePayload, clawPayload, dadPayload] = await Promise.all([
        jsonOrThrow(await fetch('/app-api/workspace', { cache: 'no-store' })),
        jsonOrThrow(await fetch('/app-api/claw', { cache: 'no-store' })),
        fetch('/app-api/dad', { cache: 'no-store' })
          .then((response) => (response.ok ? response.json() : null))
          .catch(() => null)
      ]);

      const workspace = workspacePayload as WorkspaceSnapshot;
      profile = workspace.profile;
      documents = Array.isArray(workspace.documents) ? workspace.documents : [];
      ensureSelectedDocument(documents);
      lanes = workspace.profile ? buildClawLanes(workspace.profile, workspace.sections, workspace.documents, workspace.tools) : [];
      connection = (clawPayload.connection ?? null) as ProviderConnection | null;
      dadPilot = dadPayload ? (dadPayload as DadPilotSummary) : null;
      messages = Array.isArray(clawPayload.messages) ? (clawPayload.messages as ClawMessage[]) : [];
      factCandidates = Array.isArray(clawPayload.factCandidates) ? (clawPayload.factCandidates as FactCandidate[]) : [];
    } catch (caught) {
      console.error(caught);
      error = caught instanceof Error ? caught.message : 'Could not load the Scout console.';
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
        await fetch('/app-api/claw/connect/openai-codex/start', {
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
        await fetch('/app-api/claw/connect/openai-codex/complete', {
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
        await fetch('/app-api/claw/connect/openai-codex/disconnect', {
          method: 'POST'
        })
      );

      authorizeUrl = '';
      connectMode = '';
      connectRedirectUri = '';
      connectInstructions = [];
      connectInput = '';
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
        await fetch('/app-api/claw/reply', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            message,
            documentId: selectedDocumentId || null
          })
        })
      );

      messages = Array.isArray(payload.messages) ? (payload.messages as ClawMessage[]) : messages;
      documents = Array.isArray(payload.documents) ? (payload.documents as ImportedDocument[]) : documents;
      ensureSelectedDocument(documents);
      factCandidates = Array.isArray(payload.factCandidates) ? (payload.factCandidates as FactCandidate[]) : factCandidates;
      connection = (payload.connection ?? null) as ProviderConnection | null;
      const revisedDocument = (payload.revisedDocument ?? null) as ImportedDocument | null;
      if (revisedDocument) {
        savedDocumentHref = `/app/docs#doc-${revisedDocument.id}`;
        saveNotice = `Updated "${revisedDocument.title}" in Docs.`;
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

  async function seedScoutDocuments() {
    seedBusy = true;
    saveNotice = '';
    saveError = '';

    try {
      const workspace = await jsonOrThrow(
        await fetch('/app-api/workspace/scout-docs/seed', {
          method: 'POST'
        })
      ) as WorkspaceSnapshot;

      documents = Array.isArray(workspace.documents) ? workspace.documents : documents;
      ensureSelectedDocument(documents);
      saveNotice = 'Starter Scout documents are ready. Pick one and talk to Scout to fill it in.';
    } catch (caught) {
      console.error(caught);
      saveError = caught instanceof Error ? caught.message : 'Could not create starter Scout documents.';
    } finally {
      seedBusy = false;
    }
  }

  async function saveReplyAsDocument(messageId: string) {
    savingMessageId = messageId;
    saveNotice = '';
    saveError = '';

    try {
      const payload = await jsonOrThrow(
        await fetch('/app-api/claw/save-document', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({ messageId })
        })
      );

      const document = (payload.document ?? null) as ImportedDocument | null;
      documents = Array.isArray(payload.documents) ? (payload.documents as ImportedDocument[]) : documents;
      ensureSelectedDocument(documents);
      if (document) {
        savedMessageIds = savedMessageIds.includes(messageId) ? savedMessageIds : [...savedMessageIds, messageId];
        selectedDocumentId = document.id;
        savedDocumentHref = `/app/docs#doc-${document.id}`;
        saveNotice = `Saved "${document.title}" to Docs.`;
      }
    } catch (caught) {
      console.error(caught);
      saveError = caught instanceof Error ? caught.message : 'Could not save that Scout reply.';
    } finally {
      savingMessageId = null;
    }
  }

  onMount(() => {
    consumeConnectQueryState();
    loadState();
  });
</script>

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Scout</p>
    <h1>Scout is your personal trail assistant.</h1>
    <p class="lede">
      Talk to Scout before and during the hike. Scout turns the conversation into living trail plans: loadout,
      food, budget, health, training, town strategy, safety, and the next 7 days.
    </p>
  </div>

  <article class="card card-soft panel-copy">
    <p class="eyebrow">Brain</p>
    {#if connection}
      <span class="status-pill live">{connection.label}</span>
      <p class="meta-line">Model lane: openai-codex / gpt-5.4</p>
      {#if connection.expiresAt}
        <p class="meta-line">Refresh window tracked server-side until {new Date(connection.expiresAt).toLocaleString()}</p>
      {/if}
    {:else}
      <span class="status-pill warn">Not connected</span>
      <p class="meta-line">Connect ChatGPT once, then all prompts run from the cloud workspace.</p>
    {/if}
  </article>
</section>

{#if loading}
  <p class="meta-line" style="margin-top: 1rem;">Loading Scout…</p>
{/if}

{#if error}
  <p style="color:#8a2f2f; font-weight:700; margin-top: 1rem;">{error}</p>
{/if}

<div class="grid-two" style="margin-top:1rem; align-items:start;">
  <section class="stack">
    <article class="card panel-copy">
      <p class="eyebrow">Connected brain</p>
      {#if connection}
        <h2>ChatGPT is wired to this workspace.</h2>
        <p class="muted">
          Prompts go through the server-side Pi runtime and the reply is written back into this workspace thread.
        </p>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:0.85rem;">
          <button class="primary-button" type="button" onclick={disconnect} disabled={disconnectBusy}>
            {disconnectBusy ? 'Disconnecting…' : 'Disconnect ChatGPT'}
          </button>
        </div>
      {:else}
        <h2>Connect ChatGPT to unlock the cloud delegate.</h2>
        <p class="muted">
          The connect flow is server-side and the workspace stores the credential set encrypted. On the Forge domain,
          Scout now tries to return straight back into the app after ChatGPT approval. If that handoff misses, the
          manual finish field below still works.
        </p>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:0.85rem;">
          <button class="primary-button" type="button" onclick={startConnect} disabled={connectBusy}>
            {connectBusy ? 'Starting…' : 'Connect ChatGPT'}
          </button>
          {#if authorizeUrl}
            <a class="secondary-button" href={authorizeUrl} rel="noreferrer" target="_blank">Open auth page again</a>
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

    <article class="card panel-copy">
      <p class="eyebrow">Living Scout documents</p>
      {#if savedPlans(documents).length === 0}
        <h2>Create the starter trail brain.</h2>
        <p class="muted">Scout works best when it has living documents to maintain instead of one-off replies.</p>
        <button class="primary-button" type="button" onclick={seedScoutDocuments} disabled={seedBusy}>
          {seedBusy ? 'Creating…' : 'Create starter Scout docs'}
        </button>
      {:else}
        <h2>Pick what Scout should keep current.</h2>
        <p class="muted">Each send can revise one living document in place, so the hiker talks naturally while Scout keeps the plans organized.</p>
        <div class="stack" style="margin-top:1rem;">
          {#each savedPlans(documents).slice(0, 8) as document}
            <div class="doc-target-row">
              <button
                type="button"
                class={selectedDocumentId === document.id ? 'primary-button' : 'secondary-button'}
                onclick={() => selectedDocumentId = document.id}
              >
                {document.title}
              </button>
              <button type="button" class="secondary-button" onclick={() => focusDocument(document)} disabled={sendBusy}>
                Focus Scout
              </button>
            </div>
          {/each}
          <button type="button" class="secondary-button" onclick={() => selectedDocumentId = ''}>
            No revision target
          </button>
        </div>
        <p class="meta-line" style="margin-top:0.85rem;">
          Revising updates the selected doc in place and keeps it searchable in Docs.
        </p>
      {/if}
    </article>

    <article class="card panel-copy">
      <p class="eyebrow">Field pilot</p>
      <h2>Pressure-test Scout on Dad's real public trail context.</h2>
      {#if dadPilot}
        <p class="muted">
          Latest public fix: {dadPilot.latestFixLabel}
          {#if dadPilot.latestFixAt}
            at {new Date(dadPilot.latestFixAt).toLocaleString()}
          {/if}.
          {#if dadPilot.latestDispatchTitle}
            Latest dispatch: {dadPilot.latestDispatchTitle}.
          {:else}
            Recent dispatches loaded: {dadPilot.dispatchCount}.
          {/if}
        </p>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:0.85rem;">
          {#each buildDadPilotPrompts(dadPilot) as example}
            <button
              type="button"
              class="secondary-button"
              disabled={sendBusy}
              onclick={() => useExamplePrompt(example)}
            >
              {example.title}
            </button>
          {/each}
        </div>
        <p class="meta-line" style="margin-top:0.85rem;">
          These prompts paste the current public Dad context into Scout so we can check whether the plan quality is good enough for a real trail week.
        </p>
      {:else}
        <p class="muted">Dad pilot context is unavailable right now. The core Scout workspace still works without it.</p>
      {/if}
    </article>

    <article class="card panel-copy" bind:this={threadCard}>
      <p class="eyebrow">Cloud thread</p>
      <h2>Ask the delegate what needs tightening next.</h2>
      <p class="muted">
        This thread lives with the workspace. Use it to turn rough trail questions into concrete next steps, itinerary drafts, and manual updates, then save the strong replies into Docs.
      </p>

      {#if sendBusy}
        <article class="card card-soft panel-copy" style="margin-top:1rem; border-color:rgba(94,108,84,0.18);">
          <p class="eyebrow">Scout is working</p>
          <p class="muted">Your prompt is in flight now. The reply will appear in the thread just below.</p>
          {#if pendingPrompt}
            <p class="meta-line" style="margin-top:0.6rem;">Current ask: “{pendingPrompt}”</p>
          {/if}
        </article>
      {/if}

      <div class="stack" style="margin-top:1rem;">
        <p class="eyebrow">Starter asks</p>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          {#each buildExamplePrompts(profile) as example}
            <button
              type="button"
              class="secondary-button"
              disabled={sendBusy}
              onclick={() => useExamplePrompt(example)}
            >
              {example.title}
            </button>
          {/each}
        </div>
      </div>

      <div class="stack" bind:this={threadMessages} style="margin-top:1rem; max-height:28rem; overflow:auto; scroll-behavior:smooth;">
        {#if messages.length === 0}
          <article class="card card-soft panel-copy">
            <p class="muted">No cloud thread yet. Connect ChatGPT, then send the first real prompt.</p>
          </article>
        {:else}
          {#each messages as message}
            <article class={`card ${message.role === 'assistant' ? 'card-soft' : ''} panel-copy`}>
              <p class="eyebrow">{message.role === 'assistant' ? 'Delegate' : 'You'}</p>
              <p style="white-space:pre-wrap;">{message.text}</p>
              <p class="meta-line">
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
              <p class="eyebrow">Delegate</p>
              <p class="muted">Scout is drafting the reply now…</p>
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
          placeholder={connection ? 'Plan the next 7 days from my current mile with max 4-day food carries and realistic hostel or town options.' : 'Connect ChatGPT first.'}
          style="width:100%; border-radius:16px; border:1px solid rgba(94,108,84,0.28); padding:0.9rem; font:inherit; background:#fff;"
        ></textarea>
      </label>
      {#if selectedDocumentId && savedPlans(documents).some((document) => document.id === selectedDocumentId)}
        <p class="meta-line" style="margin-top:0.85rem;">
          Revision target: {savedPlans(documents).find((document) => document.id === selectedDocumentId)?.title}
        </p>
      {/if}
      <button class="primary-button" type="button" onclick={sendMessage} disabled={!connection || sendBusy || !replyInput.trim()}>
        {#if sendBusy}
          Sending…
        {:else if selectedDocumentId}
          Revise selected plan
        {:else}
          Send to cloud delegate
        {/if}
      </button>
      {#if sendBusy}
        <p class="meta-line" style="margin-top:0.85rem;">Scout is working. Stay on this Cloud thread card — the reply will land above.</p>
      {/if}
    </article>
  </section>

  <section class="stack">
    <article class="card panel-copy">
      <p class="eyebrow">Trail intelligence</p>
      <h2>Shared-doc candidates pulled from real trail work</h2>
      <p class="muted">
        Scout now harvests reusable fact candidates from trail-planning turns. They stay pending until they are checked,
        deduped, and promoted into stronger shared docs.
      </p>
      {#if factCandidates.length === 0}
        <p class="meta-line" style="margin-top:0.85rem;">No shared-intel candidates yet. A good itinerary or town-planning turn should start producing them.</p>
      {:else}
        <div class="stack" style="margin-top:1rem;">
          {#each factCandidates.slice(0, 5) as candidate}
            <article class="card card-soft panel-copy">
              <p class="eyebrow">{candidate.kind} · {candidate.status}</p>
              <p>{candidate.claimText}</p>
              <p class="meta-line">
                {#if candidate.regionSlug}
                  {candidate.regionSlug}
                {/if}
                {#if candidate.mileRangeStart !== null || candidate.mileRangeEnd !== null}
                  {candidate.regionSlug ? ' · ' : ''}miles {candidate.mileRangeStart ?? '?'} to {candidate.mileRangeEnd ?? '?'}
                {/if}
                {' · '}confidence {(candidate.confidence * 100).toFixed(0)}%
              </p>
            </article>
          {/each}
        </div>
      {/if}
    </article>

    <article class="card panel-copy">
      <p class="eyebrow">Operator lanes</p>
      <h2>What the delegate should keep tightening</h2>
      <p class="muted">These lanes stay manual-first. The cloud brain should improve the artifacts, not replace them.</p>
    </article>

    {#if lanes.length === 0}
      <article class="card panel-copy">
        <p class="eyebrow">Setup</p>
        <h3>Finish the workspace profile first.</h3>
        <p class="muted">Once the setup data exists, Scout can point at real gaps in the manual, docs, and checklist set.</p>
      </article>
    {:else}
      {#each lanes as lane}
        <article class="card panel-copy">
          <p class="eyebrow">{lane.title}</p>
          <h3>{lane.prompt}</h3>
          <p class="muted">{lane.action}</p>
          <p class="meta-line">{lane.source}</p>
        </article>
      {/each}
    {/if}
  </section>
</div>


<style>
  .doc-target-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.6rem;
    align-items: stretch;
  }

  .doc-target-row button:first-child {
    justify-content: flex-start;
    text-align: left;
  }

  @media (max-width: 680px) {
    .doc-target-row {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
