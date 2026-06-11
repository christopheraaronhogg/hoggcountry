<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';

  const API_BASE = (env.PUBLIC_API_BASE_URL || 'https://hoggcountry.on-forge.com/api/v1').replace(/\/+$/, '');

  // Form state
  let selectedProvider = $state('');
  let apiKey = $state('');
  let submitDisabled = $state(false);

  // Status state
  let statusMsg = $state('');
  let statusColor = $state('#94a3b8');

  // Result panel state
  let resultVisible = $state(false);
  let resultBadgeClass = $state('badge');
  let resultBadgeText = $state('No check yet');
  let resultSummary = $state('');
  let resultJson = $state('');

  // Decision panel state
  let decisionSummary = $state('Loading architecture decision snapshot…');
  let decisionStatusValue = $state('unknown');
  let decisionReviewedOn = $state('n/a');
  let decisionStatusMsg = $state('');
  let decisionStatusColor = $state('#94a3b8');

  interface ProviderOption {
    id: string;
    label: string;
    enabled: boolean;
  }
  let providers: ProviderOption[] = $state([]);

  interface DecisionItem {
    label?: string;
    id?: string;
    notes?: string;
    reason?: string;
  }
  let decisionSupported: DecisionItem[] = $state([]);
  let decisionUnsupported: DecisionItem[] = $state([]);

  interface SourceItem {
    label?: string;
    url?: string;
  }
  let decisionSources: SourceItem[] = $state([]);
  let decisionSupportedEmpty = $state(true);
  let decisionUnsupportedEmpty = $state(true);
  let decisionSourcesEmpty = $state(true);

  // URL params for prefill / autocheck
  let prefillProvider = '';
  let prefillApiKey = '';
  let autoCheck = false;

  function setStatus(message: string, tone: 'muted' | 'error' | 'success' = 'muted') {
    statusMsg = message;
    statusColor = tone === 'error' ? '#fca5a5' : tone === 'success' ? '#86efac' : '#94a3b8';
  }

  function setDecisionStatus(message: string, tone: 'muted' | 'error' | 'success' = 'muted') {
    decisionStatusMsg = message;
    decisionStatusColor = tone === 'error' ? '#fca5a5' : tone === 'success' ? '#86efac' : '#94a3b8';
  }

  function toneForEntitlement(status: string): string {
    if (status === 'active') return 'ok';
    if (status === 'needs_credentials' || status === 'pending_provider_integration') return 'warn';
    return 'bad';
  }

  function summaryForEntitlement(entitlement: Record<string, unknown>): string {
    const provider = String(entitlement?.provider || 'unknown');
    const status = String(entitlement?.status || 'unknown');
    const reason = String(entitlement?.reason || 'unknown_reason');
    return `Provider: ${provider} · Status: ${status} · Reason: ${reason}`;
  }

  function renderResult(payload: unknown) {
    const p = payload as { data?: { entitlement?: Record<string, unknown> } } | null;
    const entitlement = p?.data?.entitlement || {};
    const status = String(entitlement.status || 'unknown');
    const tone = toneForEntitlement(status);

    resultBadgeClass = `badge ${tone}`;
    resultBadgeText = status;
    resultSummary = summaryForEntitlement(entitlement);
    resultJson = JSON.stringify(p?.data || payload || {}, null, 2);
    resultVisible = true;
  }

  async function loadProviders() {
    const response = await fetch(`${API_BASE}/trail-assistant/byos/providers`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Provider list failed (${response.status}).`);
    }

    const payload = await response.json() as {
      data?: {
        providers?: Array<{ id?: string; label?: string; enabled?: boolean }>;
        default_provider?: string;
      };
    };
    const rawProviders = Array.isArray(payload?.data?.providers) ? payload.data!.providers! : [];
    const defaultProvider = String(payload?.data?.default_provider || '');

    providers = rawProviders
      .filter((p) => p && typeof p === 'object' && String(p.id || '').trim())
      .map((p) => ({
        id: String(p.id || '').trim(),
        label: String(p.label || p.id || '').trim(),
        enabled: Boolean(p.enabled),
      }));

    if (prefillProvider) {
      selectedProvider = prefillProvider;
    } else if (defaultProvider) {
      selectedProvider = defaultProvider;
    }

    if (prefillApiKey) {
      apiKey = prefillApiKey;
    }

    return providers;
  }

  async function loadDecision() {
    setDecisionStatus('Loading BYOS decision snapshot…');

    const response = await fetch(`${API_BASE}/trail-assistant/byos/decision`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Decision snapshot failed (${response.status}).`);
    }

    const payload = await response.json() as {
      data?: {
        summary?: string;
        status?: string;
        last_reviewed_on?: string;
        supported_now?: DecisionItem[];
        unsupported_now?: DecisionItem[];
        sources?: SourceItem[];
      };
    };
    const data = payload?.data || {};

    decisionSummary = String(data.summary || 'No summary available.');
    decisionStatusValue = String(data.status || 'unknown');
    decisionReviewedOn = String(data.last_reviewed_on || 'n/a');

    const supported = Array.isArray(data.supported_now) ? data.supported_now : [];
    const unsupported = Array.isArray(data.unsupported_now) ? data.unsupported_now : [];
    const sources = Array.isArray(data.sources) ? data.sources : [];

    decisionSupported = supported;
    decisionUnsupported = unsupported;
    decisionSources = sources;
    decisionSupportedEmpty = supported.length === 0;
    decisionUnsupportedEmpty = unsupported.length === 0;
    decisionSourcesEmpty = sources.length === 0;

    setDecisionStatus('Decision snapshot loaded.', 'success');

    return data;
  }

  async function runPreview() {
    submitDisabled = true;
    setStatus('Running entitlement preview…');

    try {
      const response = await fetch(`${API_BASE}/trail-assistant/byos/entitlement-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider.trim(),
          credentials: {
            api_key: apiKey.trim() || null,
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const p = payload as { error?: { message?: string } };
        const message = p?.error?.message || `Preview failed (${response.status}).`;
        throw new Error(message);
      }

      renderResult(payload);
      setStatus('Preview complete. Keys were not persisted by this endpoint.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Preview request failed.';
      setStatus(message, 'error');
    } finally {
      submitDisabled = false;
    }
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    await runPreview();
  }

  onMount(async () => {
    const url = new URL(window.location.href);
    prefillProvider = (url.searchParams.get('provider') || '').trim();
    prefillApiKey = (url.searchParams.get('api_key') || '').trim();
    autoCheck = url.searchParams.get('autocheck') === '1';

    try {
      await loadProviders();
      setStatus('Providers loaded.');

      if (autoCheck && apiKey.trim()) {
        await runPreview();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load providers.';
      setStatus(message, 'error');
    }

    try {
      await loadDecision();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load decision snapshot.';
      setDecisionStatus(message, 'error');
      decisionSummary = 'Unable to load architecture decision from API.';
    }
  });
</script>

<svelte:head>
  <title>Trail Assistant BYOS Readiness Check</title>
  <meta name="description" content="Preview BYOS provider eligibility without persisting credentials." />
</svelte:head>

<div class="trail-assistant-byos-page">
  <section class="card">
    <span class="pill">Trail Assistant</span>
    <h1>BYOS readiness check (demo)</h1>
    <p class="muted">
      Verify provider eligibility and API-key shape without storing secrets.
      This is a preview-only check for demo and architecture proof.
    </p>
  </section>

  <section class="card">
    <span class="pill">Preview check</span>
    <h2>Run entitlement preview</h2>
    <p class="muted">
      This call validates provider + credential shape only. Keys are not persisted by this endpoint.
    </p>

    <form id="byos-form" onsubmit={handleSubmit}>
      <div class="grid">
        <div>
          <label for="provider">Provider</label>
          <select id="provider" name="provider" bind:value={selectedProvider}>
            {#each providers as p}
              <option value={p.id}>{p.label} ({p.enabled ? 'enabled' : 'disabled'})</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="api_key">API key (demo value allowed)</label>
          <input id="api_key" name="api_key" type="password" autocomplete="off" placeholder="sk-..." bind:value={apiKey} />
        </div>
      </div>

      <div style="margin-top: 12px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <button id="submit" type="submit" disabled={submitDisabled}>Run BYOS entitlement check</button>
        <a href="/trail-assistant" class="small">Back to intake demo →</a>
      </div>
    </form>

    <p id="status" class="status" aria-live="polite" style="color: {statusColor};">{statusMsg}</p>

    {#if resultVisible}
      <div id="result" class="result">
        <span id="result-badge" class={resultBadgeClass}>{resultBadgeText}</span>
        <p id="result-summary" class="small" style="margin:8px 0 0;">{resultSummary}</p>
        <pre id="result-json">{resultJson}</pre>
      </div>
    {/if}
  </section>

  <section class="card" id="byos-decision">
    <span class="pill">Architecture clarity</span>
    <h2>Current BYOS decision snapshot</h2>
    <p id="decision-summary" class="muted">{decisionSummary}</p>
    <p class="small" style="margin-top: 8px;">
      Decision status: <strong id="decision-status-value">{decisionStatusValue}</strong> · Last reviewed: <span id="decision-reviewed-on">{decisionReviewedOn}</span>
    </p>

    <div class="grid" style="margin-top: 12px;">
      <div>
        <h3>Supported now</h3>
        <ul id="decision-supported" class="decision-list">
          {#if decisionSupportedEmpty}
            <li>No data available.</li>
          {:else}
            {#each decisionSupported as item}
              <li>
                <strong>{item?.label || item?.id || 'Unknown lane'}</strong>
                {#if item?.notes || item?.reason}
                  <br /><span class="small">Notes: {item?.notes || item?.reason}</span>
                {/if}
              </li>
            {/each}
          {/if}
        </ul>
      </div>
      <div>
        <h3>Unsupported now</h3>
        <ul id="decision-unsupported" class="decision-list">
          {#if decisionUnsupportedEmpty}
            <li>No data available.</li>
          {:else}
            {#each decisionUnsupported as item}
              <li>
                <strong>{item?.label || item?.id || 'Unknown lane'}</strong>
                {#if item?.notes || item?.reason}
                  <br /><span class="small">Reason: {item?.notes || item?.reason}</span>
                {/if}
              </li>
            {/each}
          {/if}
        </ul>
      </div>
    </div>

    <h3>Evidence links</h3>
    <ul id="decision-sources" class="sources-list decision-list">
      {#if decisionSourcesEmpty}
        <li>No source links configured.</li>
      {:else}
        {#each decisionSources as source}
          <li>
            {#if source?.url}
              <a href={source.url} target="_blank" rel="noreferrer">{source?.label || source?.url || 'Source'}</a>
            {:else}
              {source?.label || 'Source'}
            {/if}
          </li>
        {/each}
      {/if}
    </ul>

    <p id="decision-status" class="status" aria-live="polite" style="color: {decisionStatusColor};">{decisionStatusMsg}</p>
  </section>

  <section class="card">
    <span class="pill">Guardrails</span>
    <ul>
      <li>Never share real production keys in screenshots or public chats.</li>
      <li>For production, store BYOS keys encrypted server-side with rotation + revocation controls.</li>
      <li>ChatGPT subscription passthrough remains unsupported; API-key BYOS is the feasible path today.</li>
    </ul>
  </section>
</div>

<style>
  .trail-assistant-byos-page {
    --ta-bg: #0f172a;
    --ta-card: #111827;
    --ta-text: #e5e7eb;
    --ta-muted: #9ca3af;
    --ta-line: #334155;
    --ta-accent: #22d3ee;
    --ta-ok: #10b981;
    --ta-warn: #f59e0b;
    --ta-bad: #ef4444;

    max-width: 920px;
    margin: 0 auto;
    padding: 32px 20px 72px;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    background: radial-gradient(circle at top, #1e293b 0%, var(--ta-bg) 54%);
    color: var(--ta-text);
    border-radius: 16px;
  }

  .trail-assistant-byos-page .card {
    border: 1px solid var(--ta-line);
    border-radius: 16px;
    background: linear-gradient(180deg, #0b1220, var(--ta-card));
    padding: 20px;
    margin-top: 16px;
  }

  .trail-assistant-byos-page .pill {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(34, 211, 238, 0.45);
    color: var(--ta-accent);
    font-size: 0.78rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .trail-assistant-byos-page h1 {
    margin: 10px 0;
    font-size: clamp(1.4rem, 2.8vw, 2.1rem);
    color: var(--ta-text);
  }

  .trail-assistant-byos-page h2 {
    margin: 12px 0;
    font-size: 1.15rem;
    color: var(--ta-text);
  }

  .trail-assistant-byos-page h3 {
    margin: 8px 0;
    font-size: 0.98rem;
    color: #e2e8f0;
  }

  .trail-assistant-byos-page .muted {
    color: var(--ta-muted);
    line-height: 1.5;
  }

  .trail-assistant-byos-page .grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .trail-assistant-byos-page label {
    display: block;
    margin-bottom: 6px;
    color: #d1d5db;
    font-size: 0.92rem;
  }

  .trail-assistant-byos-page input,
  .trail-assistant-byos-page select {
    width: 100%;
    border: 1px solid #475569;
    border-radius: 10px;
    padding: 11px 12px;
    background: #0b1220;
    color: #f8fafc;
    box-sizing: border-box;
  }

  .trail-assistant-byos-page button {
    appearance: none;
    border-radius: 10px;
    border: 1px solid transparent;
    background: var(--ta-ok);
    color: #052e16;
    padding: 12px 16px;
    font-weight: 700;
    cursor: pointer;
  }

  .trail-assistant-byos-page button:disabled {
    cursor: not-allowed;
    opacity: 0.72;
  }

  .trail-assistant-byos-page .status {
    margin-top: 10px;
    font-size: 0.9rem;
    color: #94a3b8;
  }

  .trail-assistant-byos-page .result {
    margin-top: 12px;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 12px;
    background: rgba(15, 23, 42, 0.74);
  }

  .trail-assistant-byos-page .result pre {
    margin: 10px 0 0;
    overflow-x: auto;
    background: rgba(2, 6, 23, 0.85);
    border: 1px solid #1e293b;
    border-radius: 10px;
    padding: 10px;
    color: #cbd5e1;
    font-size: 0.82rem;
  }

  .trail-assistant-byos-page .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    border: 1px solid #334155;
    padding: 4px 10px;
    font-size: 0.82rem;
  }

  .trail-assistant-byos-page :global(.badge.ok) {
    border-color: rgba(16, 185, 129, 0.45);
    color: #86efac;
  }

  .trail-assistant-byos-page :global(.badge.warn) {
    border-color: rgba(245, 158, 11, 0.5);
    color: #fcd34d;
  }

  .trail-assistant-byos-page :global(.badge.bad) {
    border-color: rgba(239, 68, 68, 0.5);
    color: #fca5a5;
  }

  .trail-assistant-byos-page ul {
    margin: 0;
    padding-left: 18px;
    line-height: 1.6;
    color: #d1d5db;
  }

  .trail-assistant-byos-page .decision-list li {
    margin-bottom: 6px;
  }

  .trail-assistant-byos-page .decision-list strong {
    color: #e2e8f0;
  }

  .trail-assistant-byos-page .sources-list a {
    word-break: break-word;
  }

  .trail-assistant-byos-page a {
    color: #67e8f9;
  }

  .trail-assistant-byos-page .small {
    font-size: 0.84rem;
    color: #94a3b8;
  }
</style>
