<script lang="ts">
	import { onMount } from 'svelte';
	import {
		loadBibleIndex,
		type BibleIndex,
		type BibleSearchHit,
		type KjvBook,
		type KjvChapter
	} from '../bible/bible-index.ts';

	let index = $state<BibleIndex | null>(null);
	let loadError = $state<string | null>(null);

	let query = $state('');
	let results = $state<BibleSearchHit[]>([]);

	let book = $state<KjvBook | null>(null);
	let chapter = $state<KjvChapter | null>(null);

	onMount(async () => {
		try {
			index = await loadBibleIndex();
			// Open to a sensible default so the screen isn't empty on first view.
			const psalms = index.getBook('Psalms');
			if (psalms) {
				book = psalms;
				chapter = psalms.chapters.find((c) => c.number === 23) ?? psalms.chapters[0];
			}
		} catch {
			loadError = 'The offline Bible text could not be loaded.';
		}
	});

	function runSearch() {
		if (!index) return;
		results = index.search(query, 25);
	}

	function clearSearch() {
		query = '';
		results = [];
	}

	function openBook(next: KjvBook) {
		book = next;
		chapter = next.chapters[0] ?? null;
		clearSearch();
	}

	function openChapter(num: number) {
		if (!book) return;
		chapter = book.chapters.find((c) => c.number === num) ?? null;
	}

	function backToBooks() {
		book = null;
		chapter = null;
	}

	const searching = $derived(query.trim().length > 0);
</script>

<div class="bible">
	<div class="search-row">
		<input
			class="search-input"
			type="search"
			placeholder="Search the King James Bible…"
			bind:value={query}
			oninput={runSearch}
			aria-label="Search scripture"
		/>
		{#if searching}
			<button class="clear" type="button" onclick={clearSearch} aria-label="Clear search">✕</button>
		{/if}
	</div>

	{#if loadError}
		<p class="empty">{loadError}</p>
	{:else if !index}
		<p class="empty">Loading the King James Bible…</p>
	{:else if searching}
		{#if results.length}
			<p class="result-count">{results.length} verse{results.length === 1 ? '' : 's'}</p>
			<ul class="results">
				{#each results as hit (hit.reference)}
					<li class="result">
						<p class="ref">{hit.reference}</p>
						<p class="verse">{hit.text}</p>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="empty">No verses match “{query}”.</p>
		{/if}
	{:else if book && chapter}
		<div class="reader-head">
			<button class="back-link" type="button" onclick={backToBooks}>‹ Books</button>
			<strong>{book.name}</strong>
		</div>
		<div class="chapter-row" role="tablist" aria-label="Chapter">
			{#each book.chapters as c (c.number)}
				<button
					class="chip"
					class:active={chapter.number === c.number}
					type="button"
					onclick={() => openChapter(c.number)}
				>
					{c.number}
				</button>
			{/each}
		</div>
		<div class="passage">
			<h3>{book.name} {chapter.number}</h3>
			{#each chapter.verses as verse (verse.id)}
				<p class="scripture"><span class="vnum">{verse.number}</span>{verse.text}</p>
			{/each}
		</div>
	{:else}
		<div class="book-grid">
			{#each index.books as b (b.number)}
				<button class="book-btn" type="button" onclick={() => openBook(b)}>{b.name}</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.bible {
		display: grid;
		gap: 12px;
	}

	.search-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.search-input {
		flex: 1;
		min-height: 42px;
		padding: 8px 12px;
		border-radius: 12px;
		border: 1px solid rgba(95, 101, 88, 0.25);
		background: var(--bg, #fffdf8);
		font-size: 0.9rem;
		color: var(--ink);
	}

	.clear {
		width: 38px;
		height: 38px;
		border-radius: 10px;
		background: rgba(47, 75, 53, 0.08);
		color: var(--muted);
		font-size: 0.9rem;
	}

	.empty {
		color: var(--muted);
		font-size: 0.86rem;
		padding: 8px 2px;
	}

	.result-count {
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}

	.results {
		display: grid;
		gap: 10px;
	}

	.result {
		padding: 10px 12px;
		border-radius: 12px;
		background: rgba(47, 75, 53, 0.05);
		border: 1px solid rgba(95, 101, 88, 0.12);
	}

	.ref {
		font-weight: 800;
		color: var(--forest);
		font-size: 0.8rem;
		margin-bottom: 3px;
	}

	.verse {
		font-size: 0.9rem;
		line-height: 1.45;
		color: var(--ink);
	}

	.reader-head {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.reader-head strong {
		font-family: var(--font-display);
		font-size: 1.05rem;
	}

	.back-link {
		color: var(--forest);
		font-weight: 800;
		font-size: 0.82rem;
	}

	.chapter-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		max-height: 92px;
		overflow-y: auto;
		padding-bottom: 2px;
	}

	.chip {
		min-width: 34px;
		height: 34px;
		padding: 0 6px;
		border-radius: 9px;
		background: rgba(47, 75, 53, 0.07);
		color: var(--ink);
		font-weight: 700;
		font-size: 0.82rem;
		font-variant-numeric: tabular-nums;
	}

	.chip.active {
		background: var(--forest);
		color: #f7f2e8;
	}

	.passage {
		display: grid;
		gap: 8px;
	}

	.passage h3 {
		font-family: var(--font-display);
		font-size: 1.1rem;
		color: var(--forest);
	}

	.scripture {
		font-size: 0.96rem;
		line-height: 1.6;
		color: var(--ink);
	}

	.vnum {
		font-size: 0.66rem;
		font-weight: 800;
		color: var(--marker, #b06a3d);
		vertical-align: super;
		margin-right: 4px;
	}

	.book-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
	}

	.book-btn {
		text-align: left;
		padding: 10px 12px;
		border-radius: 10px;
		background: rgba(47, 75, 53, 0.05);
		border: 1px solid rgba(95, 101, 88, 0.12);
		font-size: 0.86rem;
		font-weight: 700;
		color: var(--ink);
	}
</style>
