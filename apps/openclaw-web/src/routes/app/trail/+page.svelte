<script lang="ts">
  import { onMount } from 'svelte';
  import { getProfile, listImportedDocuments, listWorkspaceResources } from '$lib/manual-db';
  import type { ImportedDocument, ManualProfile, WorkspaceResource } from '@hoggcountry/manual-core';

  type LoadoutPayload = { workspace?: { loadout?: unknown }; loadout?: unknown };
  type LoadoutItem = { readonly id?: string };

  let profile = $state<ManualProfile | null>(null);
  let docs = $state<ImportedDocument[]>([]);
  let resources = $state<WorkspaceResource[]>([]);
  let loadoutCount = $state(0);
  let loading = $state(true);
  let error = $state('');

  async function loadoutItemCount(): Promise<number> {
    const response = await fetch('/app-api/workspace/loadout', {
      cache: 'no-store',
      headers: { accept: 'application/json' }
    });
    if (!response.ok) return 0;
    const payload = (await response.json().catch(() => null)) as LoadoutPayload | null;
    const maybeLoadout = payload?.workspace?.loadout ?? payload?.loadout;
    return Array.isArray(maybeLoadout) ? (maybeLoadout as LoadoutItem[]).length : 0;
  }

  onMount(async () => {
    try {
      const [nextProfile, nextDocs, nextResources, nextLoadoutCount] = await Promise.all([
        getProfile().catch(() => null),
        listImportedDocuments().catch(() => []),
        listWorkspaceResources().catch(() => []),
        loadoutItemCount().catch(() => 0)
      ]);
      profile = nextProfile;
      docs = nextDocs;
      resources = nextResources;
      loadoutCount = nextLoadoutCount;
    } catch (caught) {
      console.error(caught);
      error = 'Could not load the Trail shelf.';
    } finally {
      loading = false;
    }
  });

  const activeDocs = $derived(docs.filter((doc) => doc.status !== 'archived'));
  const reviewDocs = $derived(docs.filter((doc) => doc.status === 'needs-review' || doc.status === 'draft'));
  const searchableResources = $derived(resources.filter((resource) => resource.searchable && resource.status !== 'archived'));
</script>

<section class="trail-home" aria-label="Trail shelf">
  <header class="trail-head">
    <p class="eyebrow">Trail</p>
    <h1>Your offline shelf, cloud-backed for this beta.</h1>
    <p>
      This is the same habit the native app is aiming for: keep docs, sources, gear, and profile facts reviewable,
      editable, and searchable by Scout.
    </p>
  </header>

  {#if error}
    <p class="trail-alert" role="alert">{error}</p>
  {/if}

  <div class="trail-grid" aria-busy={loading}>
    <a class="trail-card primary" href="/app/docs">
      <span class="card-kicker">Docs</span>
      <strong>{loading ? '...' : activeDocs.length}</strong>
      <p>{reviewDocs.length > 0 ? `${reviewDocs.length} need review` : 'Review, edit, version, and search Scout docs.'}</p>
    </a>

    <a class="trail-card" href="/app/resources">
      <span class="card-kicker">Sources</span>
      <strong>{loading ? '...' : searchableResources.length}</strong>
      <p>Private files, URLs, and pasted notes Scout can cite without rewriting them.</p>
    </a>

    <a class="trail-card" href="/app/loadout">
      <span class="card-kicker">Loadout</span>
      <strong>{loading ? '...' : loadoutCount}</strong>
      <p>{loadoutCount > 0 ? 'Weigh and update the pack.' : 'Add gear before trusting base weight.'}</p>
    </a>

    <a class="trail-card" href={profile ? '/app/profile' : '/app/setup'}>
      <span class="card-kicker">Profile</span>
      <strong>{profile && profile.currentMile > 0 ? profile.currentMile.toFixed(1) : '--'}</strong>
      <p>{profile ? 'Edit mile, pace, water, shelter, town, and health context.' : 'Start with a mile and let Scout ask the rest over time.'}</p>
    </a>
  </div>

  <section class="trail-actions" aria-label="Trail references">
    <a href="/guide">Field guide</a>
    <a href="/guide/manual-builder/?tab=scripture">Bible search</a>
    <a href="/app/scout">Ask Scout</a>
  </section>
</section>

<style>
  .trail-home {
    display: grid;
    gap: 0.85rem;
    width: min(100%, 760px);
    margin: 0 auto;
    padding: clamp(0.2rem, 2vw, 1rem) 0 1rem;
  }

  .trail-head,
  .trail-card,
  .trail-actions {
    border: 1px solid rgba(77, 89, 74, 0.13);
    background: rgba(255, 253, 248, 0.91);
    box-shadow: 0 14px 32px rgba(31, 41, 55, 0.07);
    color: #27332b;
  }

  .trail-head {
    display: grid;
    gap: 0.45rem;
    border-radius: 24px;
    padding: 1rem;
  }

  .trail-head h1 {
    max-width: 14ch;
    margin: 0;
    font-size: clamp(2.15rem, 11vw, 4rem);
    line-height: 0.95;
  }

  .trail-head p:not(.eyebrow) {
    margin: 0;
    color: var(--muted);
    font-weight: 720;
    line-height: 1.45;
  }

  .trail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.62rem;
  }

  .trail-card {
    display: grid;
    gap: 0.32rem;
    min-height: 9.25rem;
    border-radius: 20px;
    padding: 0.85rem;
    text-decoration: none;
  }

  .trail-card.primary {
    background: linear-gradient(180deg, rgba(237, 243, 229, 0.96), rgba(255, 253, 248, 0.93));
  }

  .card-kicker {
    color: var(--pine);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .trail-card strong {
    color: #27332b;
    font-family: Oswald, Impact, sans-serif;
    font-size: 2rem;
    line-height: 1;
  }

  .trail-card p {
    margin: 0;
    color: var(--muted);
    font-size: 0.82rem;
    font-weight: 740;
    line-height: 1.32;
  }

  .trail-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.48rem;
    border-radius: 18px;
    padding: 0.55rem;
  }

  .trail-actions a {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 2.85rem;
    border-radius: 14px;
    background: #eef1e8;
    color: #27332b;
    font-weight: 900;
    text-align: center;
    text-decoration: none;
  }

  .trail-alert {
    margin: 0;
    border-radius: 16px;
    background: rgba(127, 29, 29, 0.08);
    color: #7f1d1d;
    font-weight: 820;
    padding: 0.7rem 0.82rem;
  }

  @media (max-width: 620px) {
    .trail-home {
      padding-top: max(0.2rem, env(safe-area-inset-top));
      padding-bottom: calc(6.7rem + env(safe-area-inset-bottom));
    }

    .trail-head p:not(.eyebrow) {
      font-size: 0.86rem;
    }

    .trail-card {
      min-height: 8.35rem;
      border-radius: 17px;
      padding: 0.72rem;
    }

    .trail-card strong {
      font-size: 1.7rem;
    }

    .trail-card p {
      font-size: 0.76rem;
    }

    .trail-actions {
      grid-template-columns: 1fr;
    }
  }
</style>
