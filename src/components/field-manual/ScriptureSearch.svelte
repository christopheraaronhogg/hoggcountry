<script lang="ts">
  import { onMount } from 'svelte';
  import SaveButton from './SaveButton.svelte';
  import {
    buildScriptureManualEntry,
    listScriptureTopics,
    searchScripture,
    type ScriptureSearchResult,
  } from '../../lib/field-manual/scripture';

  let { initialQuery = '' }: { initialQuery?: string } = $props();

  const topics = listScriptureTopics();
  const exampleTopics = topics.slice(0, 6);

  let query = $state(initialQuery);

  const normalizedQuery = $derived(query.trim());
  const results = $derived(normalizedQuery ? searchScripture(normalizedQuery, 14) : []);

  function useTopic(topicTitle: string) {
    query = topicTitle;
  }

  function resultKey(result: ScriptureSearchResult): string {
    return `${result.topic.id}:${result.verse.reference}`;
  }

  onMount(() => {
    if (query.trim()) {
      return;
    }

    const urlQuery = new URLSearchParams(window.location.search).get('q')?.trim() ?? '';
    if (urlQuery) {
      query = urlQuery;
    }
  });
</script>

<section class="scripture-shell">
  <header class="scripture-hero card">
    <div>
      <p class="scripture-eyebrow">Scripture</p>
      <h2>Wisdom on demand, inside the Field Manual.</h2>
      <p class="scripture-copy">
        Search by topic first. This is built for moments like fear, endurance, discouragement,
        gratitude, guidance, and rest, not a concordance rabbit hole.
      </p>
    </div>
    <div class="scripture-status-row">
      <span class="badge"><strong>Corpus</strong> KJV topical index</span>
      <span class="badge"><strong>Save</strong> Verse-by-verse into Mine</span>
      <span class="badge"><strong>Works offline</strong> After first load</span>
    </div>
  </header>

  <div class="scripture-search card">
    <label class="scripture-label" for="scripture-search-input">Search scripture topics</label>
    <input
      id="scripture-search-input"
      class="scripture-input"
      type="search"
      bind:value={query}
      placeholder="Search fear, endurance, gratitude, guidance, rest..."
      autocomplete="off"
    />
    <div class="scripture-examples">
      {#each exampleTopics as topic}
        <button
          type="button"
          class="scripture-chip"
          onclick={() => useTopic(topic.title)}
        >
          {topic.title}
        </button>
      {/each}
    </div>
  </div>

  {#if !normalizedQuery}
    <div class="scripture-topic-grid">
      {#each topics as topic}
        <article class="scripture-topic card" id={`scripture-topic-${topic.id}`}>
          <div class="scripture-topic-head">
            <div>
              <h3>{topic.title}</h3>
              <p>{topic.summary}</p>
            </div>
            <button type="button" class="scripture-topic-action" onclick={() => useTopic(topic.title)}>
              Search topic
            </button>
          </div>

          <ul class="scripture-topic-list">
            {#each topic.verses.slice(0, 2) as verse}
              <li>
                <strong>{verse.reference}</strong>
                <span>{verse.text}</span>
              </li>
            {/each}
          </ul>
        </article>
      {/each}
    </div>
  {:else if results.length === 0}
    <div class="scripture-empty card">
      <h3>No scripture matches for “{normalizedQuery}”.</h3>
      <p>Try a topic word like fear, peace, rest, wisdom, or gratitude.</p>
    </div>
  {:else}
    <div class="scripture-results">
      {#each results as result (resultKey(result))}
        <article
          class="scripture-result card"
          data-scripture-result={result.verse.reference}
          id={`scripture-result-${result.topic.id}-${result.verse.reference.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
        >
          <div class="scripture-result-head">
            <div>
              <p class="scripture-topic-label">{result.topic.title}</p>
              <h3>{result.verse.reference}</h3>
              <p class="scripture-topic-summary">{result.topic.summary}</p>
            </div>
            <SaveButton
              entry={buildScriptureManualEntry(result.topic, result.verse)}
              compact={true}
              variant="subtle"
              label="Save verse"
            />
          </div>
          <blockquote>{result.verse.text}</blockquote>
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .scripture-shell {
    display: grid;
    gap: 1rem;
  }

  .scripture-hero,
  .scripture-search,
  .scripture-topic,
  .scripture-result,
  .scripture-empty {
    padding: 1.5rem;
  }

  .scripture-eyebrow {
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--terra, #d97706);
  }

  .scripture-hero h2,
  .scripture-search h3,
  .scripture-empty h3,
  .scripture-topic h3,
  .scripture-result h3 {
    margin-top: 0;
  }

  .scripture-copy,
  .scripture-topic p,
  .scripture-topic-summary,
  .scripture-empty p {
    color: var(--muted, #5c665a);
  }

  .scripture-status-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 1rem;
  }

  .scripture-label {
    display: block;
    margin-bottom: 0.55rem;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--pine, #4d594a);
  }

  .scripture-input {
    width: 100%;
    min-height: 48px;
    padding: 0.85rem 1rem;
    border: 1px solid var(--border, #d8d0bf);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.92);
    color: var(--ink, #2d3028);
    font: inherit;
  }

  .scripture-examples {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.9rem;
  }

  .scripture-chip,
  .scripture-topic-action {
    min-height: 40px;
    padding: 0.55rem 0.85rem;
    border-radius: 999px;
    border: 1px solid var(--border, #d8d0bf);
    background: #fff;
    color: var(--pine, #4d594a);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .scripture-chip:hover,
  .scripture-topic-action:hover {
    border-color: rgba(77, 89, 74, 0.32);
    background: rgba(166, 181, 137, 0.12);
  }

  .scripture-topic-grid,
  .scripture-results {
    display: grid;
    gap: 1rem;
  }

  .scripture-topic-head,
  .scripture-result-head {
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    align-items: flex-start;
  }

  .scripture-topic-list {
    margin: 1rem 0 0;
    padding-left: 1.2rem;
    color: var(--ink, #2d3028);
  }

  .scripture-topic-list li + li {
    margin-top: 0.7rem;
  }

  .scripture-topic-list span {
    display: block;
    margin-top: 0.3rem;
    color: var(--muted, #5c665a);
  }

  .scripture-topic-label {
    margin: 0 0 0.35rem;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--terra, #d97706);
  }

  .scripture-result blockquote {
    margin: 1rem 0 0;
    padding: 1rem 1.1rem;
    border-left: 4px solid var(--alpine, #a6b589);
    background: rgba(166, 181, 137, 0.12);
    color: var(--pine, #4d594a);
  }

  @media (max-width: 720px) {
    .scripture-topic-head,
    .scripture-result-head {
      flex-direction: column;
      align-items: stretch;
    }

    .scripture-topic-action {
      width: 100%;
    }
  }
</style>
