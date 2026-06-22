<script lang="ts">
	import { onMount } from 'svelte';
	import {
		loadBibleIndex,
		type BibleIndex,
		type BibleSearchHit,
		type KjvBook,
		type KjvChapter
	} from '../bible/bible-index.ts';
	import { trailAssistant } from '$lib/trailState.svelte';
	import type { ScoutAnswer } from '$lib/scout/types';
	import Icon from './Icon.svelte';

	// Four modes — Browse (canon grid) · Read (scripture) · Search (full-text) ·
	// Ask (Scout-powered scripture Q&A). Ask always pulls cited verses from the
	// on-device index (works before the Gemma model is downloaded) and layers
	// Scout's grounded synthesis on top when the model is present.
	type Mode = 'browse' | 'read' | 'search' | 'ask';
	let mode = $state<Mode>('read');

	let index = $state<BibleIndex | null>(null);
	let loadError = $state<string | null>(null);

	// read
	let book = $state<KjvBook | null>(null);
	let chapter = $state<KjvChapter | null>(null);
	let highlightVerse = $state<number | null>(null);

	// User verse highlights — persisted locally, keyed by the global verse id.
	const HL_TINTS = [
		{ swatch: '#e0a93a', name: 'amber' },
		{ swatch: '#6a845f', name: 'green' },
		{ swatch: '#5f8090', name: 'blue' },
		{ swatch: '#b06a45', name: 'clay' }
	];
	const HL_KEY = 'hc-bible-highlights-v1';
	let highlights = $state<Record<string, number>>({});
	let selectedVerse = $state<string | null>(null);
	function persistHighlights() {
		try {
			localStorage.setItem(HL_KEY, JSON.stringify(highlights));
		} catch {
			/* storage may be unavailable; highlights stay in-session */
		}
	}
	function selectVerse(id: string) {
		selectedVerse = selectedVerse === id ? null : id;
	}
	function applyHighlight(tint: number) {
		if (!selectedVerse) return;
		highlights = { ...highlights, [selectedVerse]: tint };
		selectedVerse = null;
		persistHighlights();
	}
	function clearHighlight() {
		if (!selectedVerse) return;
		const next = { ...highlights };
		delete next[selectedVerse];
		highlights = next;
		selectedVerse = null;
		persistHighlights();
	}

	// search
	let query = $state('');
	let results = $state<BibleSearchHit[]>([]);

	// ask
	let askQuestion = $state('');
	let askState = $state<'idle' | 'asking' | 'answered'>('idle');
	let askAnswer = $state<ScoutAnswer | null>(null);
	let askVerses = $state<{ reference: string; text: string }[]>([]);
	let askGrounded = $state(false);

	// verse of the day (resolved after load)
	let votd = $state<{ reference: string; text: string } | null>(null);
	const VOTD = { book: 'Isaiah', chapter: 40, verse: 31 };

	const askPrompts = [
		'What does scripture say about fear?',
		'Where is the verse about not being anxious?',
		'Comfort when grieving',
		'A psalm for weary days'
	];

	const modes: Array<{ key: Mode; label: string }> = [
		{ key: 'browse', label: 'Browse' },
		{ key: 'read', label: 'Read' },
		{ key: 'search', label: 'Search' },
		{ key: 'ask', label: 'Ask' }
	];

	// In-text search highlight (mirrors the field guide) — escape, then mark.
	function escapeHtml(text: string): string {
		return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
	function escapeReg(text: string): string {
		return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
	const queryTerms = $derived(query.trim().split(/\s+/u).filter((t) => t.length > 1));
	function highlightBible(text: string): string {
		const safe = escapeHtml(text);
		if (!queryTerms.length) return safe;
		const re = new RegExp(`(${queryTerms.map(escapeReg).join('|')})`, 'giu');
		return safe.replace(re, '<mark>$1</mark>');
	}

	onMount(async () => {
		try {
			const rawHl = localStorage.getItem(HL_KEY);
			if (rawHl) highlights = JSON.parse(rawHl);
		} catch {
			/* ignore unreadable highlight store */
		}
		try {
			index = await loadBibleIndex();
			const psalms = index.getBook('Psalms');
			if (psalms) {
				book = psalms;
				chapter = psalms.chapters.find((c) => c.number === 23) ?? psalms.chapters[0];
			}
			const v = index.getChapter(VOTD.book, VOTD.chapter)?.verses.find((x) => x.number === VOTD.verse);
			if (v) votd = { reference: v.reference, text: v.readingText };
		} catch {
			loadError = 'The offline Bible text could not be loaded.';
		}
	});

	const otBooks = $derived(index ? index.books.filter((b) => b.number <= 39) : []);
	const ntBooks = $derived(index ? index.books.filter((b) => b.number >= 40) : []);

	function openBook(next: KjvBook) {
		book = next;
		chapter = next.chapters[0] ?? null;
		highlightVerse = null;
		mode = 'read';
	}
	function openChapter(num: number) {
		if (!book) return;
		chapter = book.chapters.find((c) => c.number === num) ?? null;
		highlightVerse = null;
	}

	function parseRef(reference: string): { book: string; chapter: number; verse?: number } | null {
		let m = reference.match(/^(.+?)\s+(\d+):(\d+)/);
		if (m) return { book: m[1], chapter: Number(m[2]), verse: Number(m[3]) };
		m = reference.match(/^(.+?)\s+(\d+)\s*$/);
		if (m) return { book: m[1], chapter: Number(m[2]) };
		return null;
	}
	function openReference(reference: string) {
		if (!index) return;
		const p = parseRef(reference);
		if (!p) return;
		const b = index.getBook(p.book);
		if (!b) return;
		book = b;
		chapter = b.chapters.find((x) => x.number === p.chapter) ?? b.chapters[0];
		highlightVerse = p.verse ?? null;
		mode = 'read';
	}
	function resolveRef(reference: string): { reference: string; text: string } | null {
		if (!index) return null;
		const p = parseRef(reference);
		if (!p || p.verse == null) return null;
		const v = index.getChapter(p.book, p.chapter)?.verses.find((x) => x.number === p.verse);
		return v ? { reference: v.reference, text: v.readingText } : null;
	}

	function runSearch() {
		if (!index) return;
		results = index.search(query, 25);
	}
	function clearSearch() {
		query = '';
		results = [];
	}

	async function runAsk(q?: string) {
		const question = (q ?? askQuestion).trim();
		if (!question || !index) return;
		askQuestion = question;
		askState = 'asking';
		askAnswer = null;
		askGrounded = false;
		// Reliable on-device verse lookup — works even before the model is downloaded.
		askVerses = index.search(question, 4).map((h) => ({ reference: h.reference, text: h.text }));
		try {
			// Prefix so Scout's scripture tool reliably triggers and stays grounded.
			const answer = await trailAssistant.askScout(`In the Bible, ${question}`);
			askAnswer = answer;
			askGrounded =
				!!answer.toolInvocations?.some((t) => t.toolId === 'bible_search') ||
				!!answer.receipts?.some((r) => r.kind === 'scripture');
			if (askGrounded) {
				const cited = answer.receipts
					.filter((r) => r.kind === 'scripture')
					.map((r) => resolveRef(r.title))
					.filter((x): x is { reference: string; text: string } => x !== null);
				if (cited.length) askVerses = cited;
			}
		} catch {
			askAnswer = null;
		}
		askState = 'answered';
	}

	const searching = $derived(query.trim().length > 0);

	// Only show Scout's prose when a real on-device/cloud model synthesized it.
	// The verse cards are always the source-backed payload.
	const synthesized = $derived(askGrounded && !!askAnswer);
	const modelHint = $derived(!!askAnswer && askAnswer.provider === 'on-device-gemma' && !askGrounded);
</script>

<div class="bible">
	<div
		class="modebar"
		role="tablist"
		aria-label="Bible modes"
		style="--seg-i:{modes.findIndex((m) => m.key === mode)}"
	>
		<span class="mode-thumb" aria-hidden="true"></span>
		{#each modes as m (m.key)}
			<button
				class="mode"
				class:active={mode === m.key}
				type="button"
				role="tab"
				aria-selected={mode === m.key}
				onclick={() => (mode = m.key)}
			>
				{m.label}
			</button>
		{/each}
	</div>

	{#if loadError}
		<p class="empty">{loadError}</p>
	{:else if !index}
		<p class="empty">Loading the King James Bible…</p>

		<!-- BROWSE -->
	{:else if mode === 'browse'}
		{#if votd}
			<button class="votd" type="button" onclick={() => votd && openReference(votd.reference)}>
				<span class="votd-lab">Verse of the day</span>
				<p class="votd-text">“{votd.text}”</p>
				<span class="votd-ref">{votd.reference} ›</span>
			</button>
		{/if}
		<p class="section-lab">Old Testament <span>· {otBooks.length} books</span></p>
		<div class="book-grid">
			{#each otBooks as b (b.number)}
				<button class="book-btn" type="button" onclick={() => openBook(b)}>{b.name}</button>
			{/each}
		</div>
		<p class="section-lab">New Testament <span>· {ntBooks.length} books</span></p>
		<div class="book-grid">
			{#each ntBooks as b (b.number)}
				<button class="book-btn" type="button" onclick={() => openBook(b)}>{b.name}</button>
			{/each}
		</div>

		<!-- READ -->
	{:else if mode === 'read'}
		{#if book && chapter}
			<div class="reader-head">
				<button class="back-link" type="button" onclick={() => (mode = 'browse')}>‹ Books</button>
				<strong>{book.name}</strong>
			</div>
			<div class="chapter-row" role="tablist" aria-label="Chapter">
				{#each book.chapters as c (c.number)}
					<button
						class="chip"
						class:active={chapter.number === c.number}
						type="button"
						role="tab"
						aria-selected={chapter.number === c.number}
						aria-label={`${book.name} chapter ${c.number}`}
						onclick={() => openChapter(c.number)}
					>
						{c.number}
					</button>
				{/each}
			</div>
			<div class="passage">
				<h3>{book.name} {chapter.number}</h3>
				{#each chapter.verses as verse (verse.id)}
					<button
						class="scripture"
						class:hl={highlightVerse === verse.number}
						class:selected={selectedVerse === verse.id}
						data-tint={highlights[verse.id] ?? ''}
						type="button"
						aria-label={`${verse.reference} — tap to highlight`}
						aria-pressed={highlights[verse.id] !== undefined}
						onclick={() => selectVerse(verse.id)}
					>
						<span class="vnum">{verse.number}</span>{verse.readingText}
					</button>
					{#if selectedVerse === verse.id}
						<div class="hl-bar" role="toolbar" aria-label="Highlight verse">
							{#each HL_TINTS as t, i (t.name)}
								<button
									class="hl-swatch"
									class:on={highlights[verse.id] === i}
									style="--sw:{t.swatch}"
									type="button"
									onclick={() => applyHighlight(i)}
									aria-label={`Highlight ${t.name}`}
								></button>
							{/each}
							<span class="hl-div" aria-hidden="true"></span>
							<button class="hl-remove" type="button" onclick={clearHighlight} aria-label="Remove highlight">✕</button>
						</div>
					{/if}
				{/each}
			</div>
		{:else}
			<p class="empty">Pick a book in Browse to start reading.</p>
		{/if}

		<!-- SEARCH -->
	{:else if mode === 'search'}
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
		{#if searching}
			{#if results.length}
				<p class="result-count">{results.length} verse{results.length === 1 ? '' : 's'} · tap to open</p>
				<ul class="results">
					{#each results as hit (hit.reference)}
						<li>
							<button class="result" type="button" onclick={() => openReference(hit.reference)}>
								<span class="ref">{hit.reference} ›</span>
								<span class="verse">{@html highlightBible(hit.text)}</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty">No verses match “{query}”.</p>
			{/if}
		{:else}
			<p class="empty">Search 31,102 verses — words or phrases like “still waters” or “lamp unto my feet”.</p>
		{/if}

		<!-- ASK -->
	{:else if mode === 'ask'}
		<div class="ask-intro">
			<span class="section-lab">Ask the Bible</span>
			<p class="ask-sub">Ask a question in plain words — Scout answers from scripture and cites the verses.</p>
		</div>

		<form
			class="ask-form"
			onsubmit={(e) => {
				e.preventDefault();
				runAsk();
			}}
		>
			<input
				class="search-input"
				type="text"
				placeholder="What does scripture say about…"
				bind:value={askQuestion}
				aria-label="Ask the Bible"
			/>
			<button class="ask-send" type="submit" disabled={askState === 'asking' || !askQuestion.trim()} aria-label="Ask">
				{#if askState === 'asking'}…{:else}<Icon name="arrowUp" size={20} stroke={2.2} />{/if}
			</button>
		</form>

		{#if askState === 'idle'}
			<div class="ask-prompts">
				{#each askPrompts as p (p)}
					<button class="ask-chip" type="button" onclick={() => runAsk(p)}>{p}</button>
				{/each}
			</div>
		{:else}
			<div class="ask-result">
				<div class="ask-q">{askQuestion}</div>
				<div class="ask-card">
					<div class="ask-head">
						<span class="ask-scout"><Icon name="scout" size={13} stroke={2} /> Scout · Scripture</span>
						<span class="ask-dev">on-device</span>
					</div>

					{#if askState === 'asking'}
						<p class="ask-working">Scout is reading scripture…</p>
					{:else if synthesized && askAnswer}
						<p class="ask-answer">{askAnswer.answer}</p>
					{:else}
						<p class="ask-answer muted">
							Scout searched scripture for your question — here are the closest verses. Tap any to read it in full.{#if modelHint}
								Install Scout's on-device model (Settings → On-device AI) for a written answer too.{/if}
						</p>
					{/if}

					{#if askState === 'answered' && askVerses.length}
						<p class="ask-verses-lab">Verses Scout found · tap to open the reader</p>
						<div class="ask-verses">
							{#each askVerses as v (v.reference)}
								<button class="ask-verse" type="button" onclick={() => openReference(v.reference)}>
									<span class="ref">{v.reference} ›</span>
									<span class="verse">“{v.text}”</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
				<p class="ask-foot">Grounded only in KJV verses Scout can cite · nothing leaves your phone</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.bible {
		display: grid;
		gap: 12px;
	}

	/* mode switcher — one sliding thumb, matching the Trail segmented control */
	/* Editorial underline tabs (display serif) — deliberately NOT a second pill
	   like the Trail section switcher above it. This reads as in-context reading
	   navigation and gives the Bible its own book-like voice. */
	.modebar {
		position: relative;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0;
		border-bottom: 1px solid var(--divider-soft);
		isolation: isolate;
	}
	.mode-thumb {
		position: absolute;
		z-index: 0;
		bottom: -1px;
		left: 0;
		height: 2.5px;
		width: 25%;
		border-radius: 2px 2px 0 0;
		background: var(--forest);
		transform: translateX(calc(var(--seg-i) * 100%));
	}
	@media (prefers-reduced-motion: no-preference) {
		.mode-thumb {
			transition: transform var(--dur-base) var(--ease-spring);
		}
	}
	.mode {
		position: relative;
		z-index: 1;
		min-height: 46px;
		font-family: var(--font-display);
		font-size: 1.02rem;
		font-weight: 700;
		letter-spacing: 0.01em;
		color: var(--muted);
		transition:
			color var(--dur-fast) var(--ease-out),
			transform var(--dur-fast) var(--ease-out);
	}
	.mode.active {
		color: var(--forest);
	}

	.empty {
		color: var(--muted);
		font-size: 0.86rem;
		padding: 8px 2px;
		line-height: 1.5;
	}

	.section-lab {
		font-size: 0.66rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--moss);
	}
	.section-lab span {
		color: var(--muted);
		font-weight: 700;
	}

	/* verse of the day */
	.votd {
		text-align: left;
		width: 100%;
		padding: 14px 16px;
		border-radius: var(--radius-md, 14px);
		background: var(--sky-soft);
		border: 1px solid var(--sky);
	}
	.votd-lab {
		font-size: 0.6rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--sky);
	}
	.votd-text {
		font-family: var(--font-display);
		font-size: 1rem;
		line-height: 1.4;
		color: var(--ink);
		margin: 6px 0;
	}
	.votd-ref {
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--forest);
	}

	/* search */
	.search-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.search-input {
		flex: 1;
		min-height: 46px;
		padding: 10px 14px;
		border-radius: var(--radius-control);
		border: 1px solid var(--line);
		background: var(--surface-strong);
		font-size: 0.92rem;
		color: var(--ink);
	}
	.clear {
		width: 44px;
		height: 44px;
		border-radius: var(--radius-control);
		background: var(--forest-soft);
		color: var(--muted);
		font-size: 0.9rem;
	}
	.result-count {
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	.results {
		display: grid;
		gap: 10px;
		list-style: none;
	}
	.result {
		display: block;
		width: 100%;
		text-align: left;
		padding: 12px 14px;
		border-radius: var(--radius-control);
		background: var(--forest-soft);
		border: 1px solid var(--contour-line);
	}
	.ref {
		display: block;
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

	/* reader */
	.reader-head {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.reader-head strong {
		font-family: var(--font-display);
		font-size: 1.1rem;
	}
	.back-link {
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		color: var(--forest);
		font-weight: 800;
		font-size: 0.84rem;
	}
	.chapter-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		max-height: 108px;
		overflow-y: auto;
		padding-bottom: 2px;
	}
	.chip {
		min-width: 44px;
		height: 44px;
		padding: 0 10px;
		border-radius: 12px;
		background: var(--surface-strong);
		border: 1px solid var(--line);
		color: var(--ink);
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1rem;
		font-variant-numeric: tabular-nums;
	}
	.chip.active {
		background: var(--forest);
		border-color: var(--forest);
		color: var(--on-accent);
		box-shadow: 0 3px 9px -3px rgba(47, 75, 53, 0.5);
	}
	.passage {
		display: grid;
		gap: 9px;
		max-width: 38rem;
	}
	.passage h3 {
		font-family: var(--font-display);
		font-size: 1.15rem;
		color: var(--forest);
	}
	.scripture {
		display: block;
		width: calc(100% + 16px);
		text-align: left;
		font-size: 1rem;
		line-height: 1.62;
		color: var(--ink);
		cursor: pointer;
		border-radius: 8px;
		padding: 3px 8px;
		margin: 0 -8px;
		transition: background var(--dur-fast) var(--ease-out);
	}
	.scripture.hl {
		background: var(--sand-soft);
	}
	/* User highlight tints — readable behind the dark scripture ink in both themes. */
	.scripture[data-tint='0'] {
		background: rgba(224, 169, 58, 0.28);
	}
	.scripture[data-tint='1'] {
		background: rgba(106, 132, 95, 0.32);
	}
	.scripture[data-tint='2'] {
		background: rgba(95, 128, 144, 0.3);
	}
	.scripture[data-tint='3'] {
		background: rgba(176, 106, 69, 0.28);
	}
	.scripture.selected {
		outline: 2px solid var(--forest);
		outline-offset: 1px;
	}
	.scripture:focus-visible {
		outline: 2px solid var(--forest);
		outline-offset: 1px;
	}

	/* Highlight toolbar — appears inline right under the tapped verse, so the
	   action is exactly where you're looking (and needs no fragile fixed/sticky
	   positioning inside the transformed tab wrapper). */
	.hl-bar {
		display: flex;
		align-items: center;
		gap: 9px;
		width: fit-content;
		margin: 8px 0 12px;
		padding: 8px 12px;
		border-radius: 999px;
		background: var(--surface-strong);
		border: 1px solid var(--line);
		box-shadow: var(--shadow);
		animation: hl-rise var(--dur-base) var(--ease-spring) both;
	}
	@keyframes hl-rise {
		from {
			opacity: 0;
			transform: translateY(-6px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.hl-swatch {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--sw);
		border: 2.5px solid transparent;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) inset;
	}
	.hl-swatch.on {
		border-color: var(--ink);
	}
	.hl-div {
		width: 1px;
		height: 22px;
		background: var(--line);
	}
	.hl-remove {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--ink-soft);
		color: var(--muted);
		font-weight: 800;
		font-size: 0.8rem;
	}
	.vnum {
		font-size: 0.66rem;
		font-weight: 800;
		color: var(--clay);
		vertical-align: super;
		margin-right: 4px;
	}

	/* book grid */
	.book-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
		margin-bottom: 4px;
	}
	.book-btn {
		text-align: left;
		min-height: 44px;
		padding: 11px 12px;
		border-radius: var(--radius-control);
		background: var(--forest-soft);
		border: 1px solid var(--contour-line);
		font-size: 0.86rem;
		font-weight: 700;
		color: var(--ink);
	}

	/* ask */
	.ask-intro {
		display: grid;
		gap: 4px;
	}
	.ask-sub {
		font-size: 0.84rem;
		color: var(--muted);
		line-height: 1.45;
	}
	.ask-form {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.ask-send {
		width: 46px;
		height: 46px;
		flex: none;
		border-radius: var(--radius-control);
		background: var(--forest);
		color: var(--on-accent);
		font-size: 1.2rem;
		font-weight: 800;
	}
	.ask-send:disabled {
		opacity: 0.5;
	}
	.ask-prompts {
		display: grid;
		gap: 7px;
	}
	.ask-chip {
		text-align: left;
		min-height: 44px;
		padding: 11px 14px;
		border-radius: var(--radius-control);
		background: var(--forest-soft);
		border: 1px solid var(--contour-line);
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--ink);
	}
	.ask-result {
		display: grid;
		gap: 8px;
	}
	.ask-q {
		justify-self: end;
		max-width: 85%;
		background: var(--forest);
		color: var(--on-accent);
		font-size: 0.9rem;
		font-weight: 700;
		padding: 9px 14px;
		border-radius: 14px 14px 4px 14px;
	}
	.ask-card {
		background: var(--surface-strong, #fffdf8);
		border: 1px solid var(--line);
		border-left: 3px solid var(--forest);
		border-radius: 12px;
		padding: 14px 15px;
	}
	.ask-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}
	.ask-scout {
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--moss);
	}
	.ask-dev {
		font-size: 0.6rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--clay);
	}
	.ask-working {
		font-size: 0.9rem;
		color: var(--muted);
		font-style: italic;
	}
	.ask-answer {
		font-size: 0.92rem;
		line-height: 1.55;
		color: var(--ink);
	}
	.ask-answer.muted {
		color: var(--muted);
	}
	.ask-verses-lab {
		font-size: 0.62rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		margin: 12px 0 8px;
		padding-top: 11px;
		border-top: 1px solid var(--line);
	}
	.ask-verses {
		display: grid;
		gap: 8px;
	}
	.ask-verse {
		display: block;
		width: 100%;
		text-align: left;
		padding: 11px 13px;
		border-radius: var(--radius-control);
		background: var(--sky-soft);
		border: 1px solid var(--contour-line);
	}

	/* <mark> is injected via {@html} in search results — target through scope. */
	.results :global(mark) {
		background: var(--sand-soft);
		color: var(--ink);
		border-radius: 3px;
		padding: 0 2px;
	}
	.ask-verse .verse {
		font-size: 0.88rem;
		line-height: 1.45;
		color: var(--ink);
	}
	.ask-foot {
		font-size: 0.68rem;
		color: var(--muted);
		text-align: center;
		line-height: 1.4;
	}
</style>
