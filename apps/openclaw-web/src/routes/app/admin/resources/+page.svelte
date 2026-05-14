<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  type Panel = 'tables' | 'docs' | 'workspace';

  interface TablePage {
    readonly path: string;
    readonly offset: number;
    readonly limit: number;
    readonly total: number;
    readonly columns: readonly string[];
    readonly rows: readonly Record<string, string>[];
    readonly source: 'filesystem' | 'bundled-sample';
  }

  const { data } = $props<{ data: PageData }>();

  let panel = $state<Panel>('tables');
  let activeTablePath = $state('');
  let activeDocPath = $state('');
  let tableQuery = $state('');
  let docQuery = $state('');
  let workspaceQuery = $state('');
  let tablePage = $state<TablePage | null>(null);
  let tableLoading = $state(false);
  let tableError = $state('');

  const activeTable = $derived(data.reference.tables.find((table) => table.path === activeTablePath) ?? data.reference.tables[0]);
  const activeDoc = $derived(data.reference.docs.find((doc) => doc.path === activeDocPath) ?? data.reference.docs[0]);
  const pageRows = $derived(tablePage?.rows ?? activeTable?.sampleRows ?? []);
  const pageColumns = $derived(tablePage?.columns ?? activeTable?.columns ?? []);
  const pageOffset = $derived(tablePage?.offset ?? 0);
  const pageLimit = $derived(tablePage?.limit ?? 30);
  const pageTotal = $derived(tablePage?.total ?? activeTable?.recordCount ?? 0);

  function includesQuery(values: readonly unknown[], query: string): boolean {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return true;
    return values.some((value) => String(value ?? '').toLowerCase().includes(normalized));
  }

  function visibleTables() {
    return data.reference.tables.filter((table) =>
      includesQuery([table.label, table.path, table.category, table.sourceIds.join(' '), table.licenseStatuses.join(' ')], tableQuery)
    );
  }

  function visibleDocs() {
    return data.reference.docs.filter((doc) =>
      includesQuery([doc.title, doc.path, doc.group, doc.excerpt], docQuery)
    );
  }

  function visibleWorkspaceDocs() {
    return data.workspace.docs.filter((doc) =>
      includesQuery([doc.title, doc.kind, doc.status, doc.preview], workspaceQuery)
    );
  }

  function visibleWorkspaceResources() {
    return data.workspace.resources.filter((resource) =>
      includesQuery([resource.title, resource.kind, resource.status, resource.sourceUri, resource.preview, resource.addedBy], workspaceQuery)
    );
  }

  function formatNumber(value: number): string {
    return value.toLocaleString();
  }

  function shortPath(value: string): string {
    return value.length > 56 ? `...${value.slice(-53)}` : value;
  }

  function selectTable(path: string) {
    activeTablePath = path;
    tableError = '';
    tablePage = null;
    void loadTablePage(0);
  }

  async function loadTablePage(offset: number) {
    if (!activeTablePath) return;
    tableLoading = true;
    tableError = '';

    try {
      const url = new URL(resolve('/app-api/admin/resources/table'), window.location.origin);
      url.searchParams.set('path', activeTablePath);
      url.searchParams.set('offset', String(Math.max(0, offset)));
      url.searchParams.set('limit', '30');
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(await response.text());
      tablePage = (await response.json()) as TablePage;
    } catch (caught) {
      tableError = caught instanceof Error ? caught.message : 'Could not load table rows.';
    } finally {
      tableLoading = false;
    }
  }

  function selectDoc(path: string) {
    activeDocPath = path;
  }

  function ensureInitialSelection() {
    activeTablePath ||= data.reference.tables[0]?.path ?? '';
    activeDocPath ||= data.reference.docs[0]?.path ?? '';
  }

  function statusTone(value: string): string {
    if (/blocked|unknown|failed|gap|review|draft|sensitive/iu.test(value)) return 'warn';
    if (/public|official|searchable|active|filesystem/iu.test(value)) return 'live';
    return 'prep';
  }

  onMount(() => {
    ensureInitialSelection();
    void loadTablePage(0);
  });
</script>

<svelte:head>
  <title>Scout Resource Explorer | Hogg Country</title>
</svelte:head>

<section class="admin-hero">
  <div>
    <p class="eyebrow">Scout admin</p>
    <h1>Resource Explorer</h1>
    <p class="lede">Bundled reference tables, RAG docs, and private workspace material in one review surface.</p>
  </div>

  <div class="hero-stats" aria-label="Explorer summary">
    <span><b>{formatNumber(data.reference.summary.totalRecords)}</b> reference records</span>
    <span><b>{formatNumber(data.reference.tables.length)}</b> tables</span>
    <span><b>{formatNumber(data.reference.docs.length)}</b> docs</span>
    <span><b>{formatNumber(data.workspace.counts.resources)}</b> private resources</span>
  </div>
</section>

<section class="policy-strip" aria-label="Scout resource policy">
  <article>
    <strong>Generated miles</strong>
    <span>{data.reference.summary.generatedMileDisclosure}</span>
  </article>
  <article>
    <strong>Water</strong>
    <span>{data.reference.summary.waterDisclosure}</span>
  </article>
  <article>
    <strong>Live conditions</strong>
    <span>{data.reference.summary.liveConditionsDisclosure}</span>
  </article>
</section>

<div class="panel-tabs" aria-label="Resource explorer sections">
  <button class:active={panel === 'tables'} type="button" onclick={() => (panel = 'tables')}>Tables</button>
  <button class:active={panel === 'docs'} type="button" onclick={() => (panel = 'docs')}>Docs</button>
  <button class:active={panel === 'workspace'} type="button" onclick={() => (panel = 'workspace')}>Workspace</button>
</div>

{#if panel === 'tables'}
  <section class="explorer-shell" aria-label="Reference tables">
    <aside class="explorer-rail">
      <label class="filter-box">
        <span>Filter tables</span>
        <input bind:value={tableQuery} placeholder="water, rules, OSM, elevation..." />
      </label>

      <div class="rail-list">
        {#each visibleTables() as table (table.path)}
          <button class:active={activeTablePath === table.path} type="button" onclick={() => selectTable(table.path)}>
            <strong>{table.label}</strong>
            <span>{formatNumber(table.recordCount)} rows · {table.category}</span>
          </button>
        {/each}
      </div>
    </aside>

    <section class="table-workbench">
      {#if activeTable}
        <div class="workbench-head">
          <div>
            <p class="eyebrow">{activeTable.category}</p>
            <h2>{activeTable.label}</h2>
            <p class="muted">{activeTable.path}</p>
          </div>
          <div class="head-actions">
            <span class="status-pill {statusTone(tablePage?.source ?? 'bundled-sample')}">{tablePage?.source ?? 'bundled-sample'}</span>
            <a class="btn btn-ghost" href={resolve('/app/scout')}>Ask Scout</a>
          </div>
        </div>

        <div class="dataset-facts" aria-label="Dataset details">
          <span><b>{formatNumber(pageTotal)}</b> rows</span>
          <span>{activeTable.licenseStatuses.join(', ')}</span>
          <span>{activeTable.sourceIds.join(', ')}</span>
          <span>Checked {activeTable.lastChecked}</span>
        </div>

        {#if tableError}
          <p class="surface-alert surface-alert--error">{tableError}</p>
        {/if}

        <div class="table-pager" aria-label="Table paging">
          <button type="button" onclick={() => loadTablePage(Math.max(0, pageOffset - pageLimit))} disabled={tableLoading || pageOffset <= 0}>Previous</button>
          <span>{formatNumber(pageOffset + 1)}-{formatNumber(Math.min(pageOffset + pageLimit, pageTotal))} of {formatNumber(pageTotal)}</span>
          <button type="button" onclick={() => loadTablePage(pageOffset + pageLimit)} disabled={tableLoading || pageOffset + pageLimit >= pageTotal}>Next</button>
        </div>

        <div class="data-table-wrap">
          <table>
            <thead>
              <tr>
                {#each pageColumns as column}
                  <th>{column}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each pageRows as row}
                <tr>
                  {#each pageColumns as column}
                    <td title={row[column]}>{row[column]}</td>
                  {/each}
                </tr>
              {:else}
                <tr>
                  <td colspan={Math.max(1, pageColumns.length)}>No rows available.</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <p class="answer-rule">{activeTable.aiAnswerRule}</p>
      {/if}
    </section>
  </section>
{:else if panel === 'docs'}
  <section class="explorer-shell" aria-label="Reference docs">
    <aside class="explorer-rail">
      <label class="filter-box">
        <span>Filter docs</span>
        <input bind:value={docQuery} placeholder="state, water, current conditions..." />
      </label>

      <div class="rail-list">
        {#each visibleDocs() as doc (doc.path)}
          <button class:active={activeDocPath === doc.path} type="button" onclick={() => selectDoc(doc.path)}>
            <strong>{doc.title}</strong>
            <span>{doc.group} · {shortPath(doc.path)}</span>
          </button>
        {/each}
      </div>
    </aside>

    <section class="doc-reader">
      {#if activeDoc}
        <div class="workbench-head">
          <div>
            <p class="eyebrow">{activeDoc.group}</p>
            <h2>{activeDoc.title}</h2>
            <p class="muted">{activeDoc.path}</p>
          </div>
        </div>
        <pre>{activeDoc.markdown}</pre>
      {/if}
    </section>
  </section>
{:else}
  <section class="workspace-view" aria-label="Private workspace resources">
    <div class="workbench-head">
      <div>
        <p class="eyebrow">Private workspace</p>
        <h2>{data.workspace.title}</h2>
        <p class="muted">{data.workspace.workspaceId}</p>
      </div>
      <div class="head-actions">
        <a class="btn btn-ghost" href={resolve('/app/docs')}>Docs</a>
        <a class="btn btn-ghost" href={resolve('/app/resources')}>Resources</a>
      </div>
    </div>

    <label class="filter-box wide-filter">
      <span>Filter workspace</span>
      <input bind:value={workspaceQuery} placeholder="plan, weather, permit, uploaded file..." />
    </label>

    <div class="workspace-grid">
      <section>
        <div class="section-title-row">
          <div>
            <p class="eyebrow">Docs</p>
            <h3>{formatNumber(data.workspace.counts.docs)} maintained artifacts</h3>
          </div>
        </div>
        <div class="object-list">
          {#each visibleWorkspaceDocs() as doc (doc.id)}
            <a href={resolve('/app/docs/[documentId]', { documentId: doc.id })}>
              <strong>{doc.title}</strong>
              <span>{doc.kind} · {doc.status} · {new Date(doc.updatedAt).toLocaleString()}</span>
              <p>{doc.preview}</p>
            </a>
          {:else}
            <p class="empty-state">No matching docs.</p>
          {/each}
        </div>
      </section>

      <section>
        <div class="section-title-row">
          <div>
            <p class="eyebrow">Resources</p>
            <h3>{formatNumber(data.workspace.counts.resources)} source items</h3>
          </div>
        </div>
        <div class="object-list">
          {#each visibleWorkspaceResources() as resource (resource.id)}
            <article>
              <strong>{resource.title}</strong>
              <span>{resource.kind} · {resource.addedBy} · {resource.sensitivity} · {new Date(resource.updatedAt).toLocaleString()}</span>
              <p>{resource.preview}</p>
              {#if resource.sourceUri}
                <small>{resource.sourceUri}</small>
              {/if}
            </article>
          {:else}
            <p class="empty-state">No matching resources.</p>
          {/each}
        </div>
      </section>
    </div>
  </section>
{/if}

<style>
  :global(body) {
    background:
      linear-gradient(180deg, rgba(255, 253, 248, 0.95), rgba(239, 243, 232, 0.96)),
      url('/default-background.svg') center top / cover no-repeat;
  }

  .admin-hero,
  .policy-strip,
  .explorer-shell,
  .workspace-view {
    width: min(1380px, 100%);
    margin-inline: auto;
  }

  .admin-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 520px);
    gap: 1rem;
    align-items: end;
    padding: 1rem 0 0.7rem;
  }

  .admin-hero h1 {
    margin: 0;
    color: var(--ink);
    font-family: Oswald, Impact, sans-serif;
    font-size: clamp(2rem, 5vw, 4.3rem);
    line-height: 0.95;
  }

  .admin-hero .lede {
    max-width: 64ch;
    margin: 0.7rem 0 0;
    color: #4e5d4c;
    font-size: 1.02rem;
  }

  .hero-stats,
  .dataset-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .hero-stats span,
  .dataset-facts span,
  .policy-strip article {
    min-width: 0;
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 8px;
    background: rgba(255, 253, 248, 0.86);
    padding: 0.72rem 0.82rem;
    box-shadow: 0 8px 22px rgba(31, 41, 55, 0.04);
  }

  .hero-stats b,
  .dataset-facts b {
    display: block;
    color: var(--pine);
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.55rem;
    line-height: 1;
  }

  .policy-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin-block: 0.8rem;
  }

  .policy-strip article {
    display: grid;
    gap: 0.25rem;
  }

  .policy-strip strong,
  .object-list strong,
  .rail-list strong {
    color: var(--ink);
  }

  .policy-strip span,
  .muted,
  .rail-list span,
  .object-list span,
  .object-list small,
  .answer-rule {
    color: #5d695b;
    font-size: 0.86rem;
    line-height: 1.45;
  }

  .panel-tabs {
    display: flex;
    gap: 0.45rem;
    width: min(1380px, 100%);
    margin: 0.8rem auto;
    overflow-x: auto;
  }

  .panel-tabs button,
  .table-pager button {
    min-height: 2.45rem;
    border: 1px solid rgba(77, 89, 74, 0.18);
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.92);
    color: #394638;
    padding: 0 0.95rem;
    font-weight: 900;
    cursor: pointer;
  }

  .panel-tabs button.active,
  .table-pager button:not(:disabled):hover {
    border-color: var(--pine);
    background: var(--pine);
    color: #fff;
  }

  .explorer-shell {
    display: grid;
    grid-template-columns: 340px minmax(0, 1fr);
    gap: 0.9rem;
    align-items: start;
  }

  .explorer-rail,
  .table-workbench,
  .doc-reader,
  .workspace-view {
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 8px;
    background: rgba(255, 253, 248, 0.9);
    box-shadow: 0 10px 32px rgba(31, 41, 55, 0.05);
  }

  .explorer-rail {
    position: sticky;
    top: 0.8rem;
    max-height: calc(100vh - 1.6rem);
    overflow: auto;
    padding: 0.8rem;
  }

  .filter-box {
    display: grid;
    gap: 0.35rem;
    margin-bottom: 0.7rem;
    color: #4e5d4c;
    font-weight: 850;
  }

  .filter-box input {
    min-height: 2.55rem;
    width: 100%;
    border: 1px solid rgba(77, 89, 74, 0.2);
    border-radius: 8px;
    background: #fff;
    color: var(--ink);
    padding: 0 0.75rem;
    font: inherit;
  }

  .rail-list,
  .object-list {
    display: grid;
    gap: 0.48rem;
  }

  .rail-list button,
  .object-list a,
  .object-list article {
    display: grid;
    gap: 0.22rem;
    width: 100%;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.7);
    padding: 0.78rem;
    color: inherit;
    text-align: left;
    text-decoration: none;
  }

  .rail-list button {
    cursor: pointer;
  }

  .rail-list button.active,
  .rail-list button:hover,
  .object-list a:hover {
    border-color: rgba(77, 89, 74, 0.38);
    background: rgba(231, 237, 218, 0.72);
  }

  .table-workbench,
  .doc-reader,
  .workspace-view {
    min-width: 0;
    padding: 1rem;
  }

  .workbench-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.9rem;
  }

  .workbench-head h2,
  .workspace-view h3 {
    margin: 0.1rem 0;
    color: var(--ink);
    font-family: Oswald, Impact, sans-serif;
    font-size: clamp(1.45rem, 3vw, 2.4rem);
    line-height: 1.02;
  }

  .head-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.45rem;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    min-height: 2.15rem;
    border-radius: 999px;
    padding: 0 0.74rem;
    font-size: 0.72rem;
    font-weight: 950;
    text-transform: uppercase;
  }

  .status-pill.live {
    color: #22573e;
    background: rgba(65, 130, 87, 0.13);
  }

  .status-pill.warn {
    color: #7a4520;
    background: rgba(180, 111, 42, 0.14);
  }

  .status-pill.prep {
    color: #435068;
    background: rgba(88, 103, 128, 0.13);
  }

  .dataset-facts {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-bottom: 0.8rem;
  }

  .table-pager {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.6rem;
    margin-bottom: 0.7rem;
    color: #4e5d4c;
    font-weight: 850;
  }

  .table-pager button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .data-table-wrap {
    overflow: auto;
    max-height: 62vh;
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 8px;
    background: #fff;
  }

  table {
    width: 100%;
    min-width: 980px;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 0.82rem;
  }

  th,
  td {
    border-bottom: 1px solid rgba(77, 89, 74, 0.11);
    padding: 0.55rem 0.62rem;
    text-align: left;
    vertical-align: top;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #eef3e6;
    color: #2f382e;
    font-weight: 950;
  }

  td {
    overflow: hidden;
    color: #344034;
    text-overflow: ellipsis;
  }

  .answer-rule {
    margin: 0.8rem 0 0;
    border-left: 4px solid rgba(77, 89, 74, 0.32);
    padding-left: 0.8rem;
  }

  .doc-reader pre {
    min-height: 58vh;
    max-height: 72vh;
    margin: 0;
    overflow: auto;
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 8px;
    background: #fff;
    color: #263226;
    padding: 1rem;
    white-space: pre-wrap;
    word-break: break-word;
    font: 0.92rem/1.58 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }

  .workspace-view {
    padding: 1rem;
  }

  .wide-filter {
    max-width: 720px;
  }

  .workspace-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .object-list p {
    margin: 0;
    color: #354134;
    line-height: 1.45;
  }

  .object-list small {
    overflow-wrap: anywhere;
  }

  .empty-state {
    border: 1px dashed rgba(77, 89, 74, 0.25);
    border-radius: 8px;
    padding: 1rem;
    color: #5d695b;
  }

  @media (max-width: 980px) {
    .admin-hero,
    .policy-strip,
    .explorer-shell,
    .workspace-grid {
      grid-template-columns: 1fr;
    }

    .explorer-rail {
      position: static;
      max-height: 320px;
    }

    .dataset-facts,
    .hero-stats {
      grid-template-columns: 1fr;
    }

    .workbench-head {
      display: grid;
    }

    .head-actions {
      justify-content: flex-start;
    }
  }
</style>
