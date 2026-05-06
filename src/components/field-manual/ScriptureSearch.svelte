<script lang="ts">
  import { onMount } from 'svelte';
  import SaveButton from './SaveButton.svelte';
  import {
    buildScriptureManualEntry,
    listScriptureTopics,
    searchScripture,
    type ScriptureSearchResult,
    type ScriptureTopic,
    type ScriptureVerse,
  } from '../../lib/field-manual/scripture';

  interface KjvPceVerse {
    book: string;
    bookNumber: number;
    chapter: number;
    verse: number;
    reference: string;
    referenceKey: string;
    text: string;
    testament: string;
  }

  let {
    initialQuery = '',
    sourceBasePath = '/guide/',
  }: {
    initialQuery?: string;
    sourceBasePath?: string;
  } = $props();

  const topics = listScriptureTopics();
  const exampleTopics = topics.slice(0, 6);
  const kjvSearchTopic: ScriptureTopic = {
    id: 'kjv-pce-search',
    title: 'KJV PCE Search',
    summary: 'Direct search result from the bundled King James Version Pure Cambridge Edition corpus.',
    aliases: ['scripture', 'bible', 'kjv', 'pce'],
    verses: [],
  };

  function getInitialQuery(): string {
    return initialQuery;
  }

  let query = $state(getInitialQuery());
  let corpus = $state<KjvPceVerse[] | null>(null);
  let corpusLoading = $state(false);
  let corpusError = $state('');
  let corpusResults = $state<ScriptureSearchResult[]>([]);
  let searchSerial = 0;
  const normalizedQuery = $derived(query.trim());
  const topicResults = $derived(normalizedQuery ? searchScripture(normalizedQuery, 8) : []);
  const results = $derived(mergeScriptureResults(corpusResults, topicResults).slice(0, 14));

  $effect(() => {
    if (!normalizedQuery) {
      corpusResults = [];
      corpusError = '';
      return;
    }

    const serial = ++searchSerial;
    searchKjvCorpus(normalizedQuery)
      .then((hits) => {
        if (serial === searchSerial) corpusResults = hits;
      })
      .catch((caught) => {
        console.error(caught);
        if (serial === searchSerial) {
          corpusResults = [];
          corpusError = 'KJV PCE search is unavailable right now.';
        }
      });
  });

  function useTopic(topicTitle: string) {
    query = topicTitle;
  }

  function resultKey(result: ScriptureSearchResult): string {
    return `${result.topic.id}:${result.verse.reference}:${result.matchType ?? 'topic'}`;
  }

  async function loadKjvCorpus(): Promise<KjvPceVerse[]> {
    if (corpus) return corpus;
    if (corpusLoading) {
      while (corpusLoading) await new Promise((resolve) => setTimeout(resolve, 25));
      if (corpus) return corpus;
    }

    corpusLoading = true;
    try {
      const response = await fetch('/kjv-pce.jsonl');
      if (!response.ok) throw new Error(`KJV PCE corpus request failed: ${response.status}`);
      const text = await response.text();
      corpus = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as KjvPceVerse);
      return corpus;
    } finally {
      corpusLoading = false;
    }
  }

  async function searchKjvCorpus(searchQuery: string): Promise<ScriptureSearchResult[]> {
    const verses = await loadKjvCorpus();
    const referenceMatches = lookupReference(verses, searchQuery);
    if (referenceMatches.length > 0) {
      return referenceMatches.map((verse, index) => buildCorpusResult(verse, 1000 - index, 'reference'));
    }

    const normalized = normalizeSearchText(searchQuery);
    const terms = normalized.split(' ').filter((term) => term.length > 2);
    return verses
      .map((verse) => {
        const haystack = normalizeSearchText(`${verse.reference} ${verse.text}`);
        let score = 0;
        if (haystack.includes(normalized)) score += 500;
        for (const term of terms) {
          if (haystack.includes(term)) score += 12;
        }
        return score > 0 ? buildCorpusResult(verse, score, 'phrase') : null;
      })
      .filter((result): result is ScriptureSearchResult => result !== null)
      .sort((left, right) => right.score - left.score)
      .slice(0, 14);
  }

  function lookupReference(verses: KjvPceVerse[], searchQuery: string): KjvPceVerse[] {
    const match = searchQuery.match(/^(.+?)\s+(\d{1,3})(?::\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?$/u);
    if (!match) return [];

    const [, rawBook, rawChapter, rawStartVerse, rawEndVerse] = match;
    const book = findBookName(verses, rawBook);
    if (!book) return [];

    const chapter = Number(rawChapter);
    const startVerse = rawStartVerse ? Number(rawStartVerse) : null;
    const endVerse = rawEndVerse ? Number(rawEndVerse) : startVerse;
    return verses.filter((verse) => (
      verse.book === book
      && verse.chapter === chapter
      && (startVerse === null || (verse.verse >= startVerse && verse.verse <= (endVerse ?? startVerse)))
    ));
  }

  function findBookName(verses: KjvPceVerse[], rawBook: string): string | null {
    const normalized = normalizeBook(rawBook);
    const books = [...new Set(verses.map((verse) => verse.book))];
    return books.find((book) => normalizeBook(book) === normalized)
      ?? books.find((book) => book === 'Psalms' && normalized === 'psalm')
      ?? null;
  }

  function buildCorpusResult(
    verse: KjvPceVerse,
    score: number,
    matchType: ScriptureSearchResult['matchType'],
  ): ScriptureSearchResult {
    const scriptureVerse: ScriptureVerse = {
      reference: verse.reference,
      text: verse.text,
      citation: `KJV PCE — ${verse.reference}`,
      snippet: verse.text,
    };
    return { topic: kjvSearchTopic, verse: scriptureVerse, score, matchType };
  }

  function mergeScriptureResults(
    primary: ScriptureSearchResult[],
    secondary: ScriptureSearchResult[],
  ): ScriptureSearchResult[] {
    const merged: ScriptureSearchResult[] = [];
    for (const result of [...primary, ...secondary]) {
      const index = merged.findIndex((current) => current.verse.reference === result.verse.reference);
      if (index < 0) {
        merged.push(result);
      } else if (result.score > merged[index].score) {
        merged[index] = result;
      }
    }
    return merged.sort((left, right) => right.score - left.score);
  }

  function normalizeBook(value: string): string {
    return value
      .toLowerCase()
      .replace(/\bfirst\b/gu, '1')
      .replace(/\bsecond\b/gu, '2')
      .replace(/\bthird\b/gu, '3')
      .replace(/[^a-z0-9 ]+/gu, '')
      .replace(/\s+/gu, ' ')
      .trim();
  }

  function normalizeSearchText(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s:]+/gu, ' ')
      .replace(/\s+/gu, ' ')
      .trim();
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
        Search exact references, short ranges, phrases, or trail-minded topics like fear,
        endurance, gratitude, guidance, and rest.
      </p>
    </div>
    <div class="scripture-status-row">
      <span class="badge"><strong>Corpus</strong> KJV PCE full text</span>
      <span class="badge"><strong>Save</strong> Verse-by-verse into Mine</span>
      <span class="badge"><strong>Works offline</strong> After first load</span>
    </div>
  </header>

  <div class="scripture-search card">
    <label class="scripture-label" for="scripture-search-input">Search KJV PCE scripture</label>
    <input
      id="scripture-search-input"
      class="scripture-input"
      type="search"
      bind:value={query}
      placeholder="Proverbs 3:5-6, still waters, fear, wisdom..."
      autocomplete="off"
    />
    <div class="scripture-examples">
      {#each exampleTopics as topic (topic.id)}
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
      {#each topics as topic (topic.id)}
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
            {#each topic.verses.slice(0, 2) as verse (verse.reference)}
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
      <h3>{corpusLoading ? 'Searching KJV PCE…' : `No scripture matches for “${normalizedQuery}”.`}</h3>
      <p>{corpusError || 'Try an exact reference, a shorter phrase, or a topic word like fear, peace, rest, wisdom, or gratitude.'}</p>
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
              entry={buildScriptureManualEntry(result.topic, result.verse, {
                basePath: sourceBasePath,
                savedFrom: 'search',
              })}
              compact={true}
              variant="subtle"
              label="Save verse"
            />
          </div>
          {#if result.verse.citation}
            <p class="scripture-citation">{result.verse.citation}</p>
          {/if}
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
  .scripture-empty h3,
  .scripture-topic h3,
  .scripture-result h3 {
    margin-top: 0;
  }

  .scripture-copy,
  .scripture-topic p,
  .scripture-topic-summary,
  .scripture-citation,
  .scripture-empty p {
    color: var(--muted, #5c665a);
  }

  .scripture-citation {
    margin: 0;
    font-size: 0.86rem;
    font-weight: 800;
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
