<script lang="ts">
  import { searchWorkspace } from '$lib/manual-db';
  import type { SearchHit } from '@hoggcountry/manual-core';

  let query = '';
  let results: SearchHit[] = [];
  let searched = false;

  async function handleSearch(event: SubmitEvent) {
    event.preventDefault();
    searched = true;
    results = await searchWorkspace(query);
  }
</script>

<section class="hero card">
  <p class="eyebrow">Search</p>
  <h1>Search your manual, public reference, and imported docs together.</h1>
  <p class="lede">The point is surgical answers. Search "frozen filter," "fear," or "Damascus" and get a source-labeled result instead of rummaging through whole chapters.</p>
</section>

<form class="search-bar card" onsubmit={handleSearch}>
  <input bind:value={query} placeholder="Search your manual and docs..." />
  <button type="submit">Search</button>
</form>

{#if searched}
  <section class="results">
    {#if results.length === 0}
      <article class="card result">
        <h2>No results</h2>
        <p>Try a simpler phrase, a town name, or a concrete problem.</p>
      </article>
    {:else}
      {#each results as result}
        <article class="card result">
          <p class="eyebrow">{result.sourceLabel}</p>
          <h2>{result.title}</h2>
          <p>{result.excerpt}</p>
          {#if result.href}
            <a href={result.href} target={result.sourceType === 'corpus' ? '_blank' : undefined} rel="noopener noreferrer">Open source</a>
          {/if}
        </article>
      {/each}
    {/if}
  </section>
{/if}

<style>
  .card {
    border: 1px solid rgba(48, 65, 54, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.84);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.06);
  }

  .hero,
  .search-bar,
  .result {
    padding: 1.1rem;
  }

  .hero,
  .search-bar {
    margin-bottom: 1rem;
  }

  .search-bar {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .eyebrow {
    margin: 0 0 0.35rem;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #b45309;
  }

  h1,
  h2 {
    margin: 0;
    color: #1f2937;
  }

  .lede,
  .result p {
    color: #5d675c;
    line-height: 1.7;
  }

  input,
  button {
    min-height: 46px;
    border-radius: 14px;
    font: inherit;
  }

  input {
    flex: 1 1 320px;
    border: 1px solid rgba(48, 65, 54, 0.12);
    padding: 0.8rem 0.9rem;
  }

  button {
    border: none;
    padding: 0.8rem 1rem;
    background: #304136;
    color: white;
    font-weight: 800;
    cursor: pointer;
  }

  .results {
    display: grid;
    gap: 1rem;
  }

  a {
    color: #304136;
    font-weight: 700;
  }
</style>
