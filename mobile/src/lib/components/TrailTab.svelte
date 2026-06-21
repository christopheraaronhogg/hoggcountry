<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import BibleReader from './BibleReader.svelte';
	import type { TrailDocument } from '$lib/types';
	import type { FieldGuideExcerpt } from '$lib/scout/types';

	type Section = 'guide' | 'bible' | 'docs' | 'gear';
	// Section is shared in trailState so deep links (e.g. Today's "packing up?"
	// glance → Gear) can open Trail straight to the right tab.
	const section = $derived(trailAssistant.trailSection);

	const sections: Array<{ key: Section; label: string }> = [
		{ key: 'guide', label: 'Guide' },
		{ key: 'bible', label: 'Bible' },
		{ key: 'docs', label: 'Docs' },
		{ key: 'gear', label: 'Gear' }
	];

	const guide = $derived(trailAssistant.fieldPack.guideExcerpts);
	const documents = $derived(trailAssistant.documents);
	const checkIns = $derived(trailAssistant.checkInHistory);
	const loadout = $derived(trailAssistant.fieldPack.loadout);
	const carried = $derived(loadout.filter((item) => item.carried));
	const totalLb = $derived(
		(carried.reduce((sum, item) => sum + (item.weightOz ?? 0), 0) / 16).toFixed(1)
	);
	let editingId = $state<string | null>(null);
	let draftTitle = $state('');
	let draftBody = $state('');
	let scoutDraftTopic = $state('');
	let docsNotice = $state('');
	let sourceDocQuery = $state('');

	function fmtTime(iso: string): string {
		const d = new Date(iso);
		return Number.isNaN(d.getTime())
			? iso
			: d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
	}

	function newDocument() {
		editingId = null;
		draftTitle = '';
		draftBody = '';
		docsNotice = '';
	}

	function editDocument(document: TrailDocument) {
		editingId = document.id;
		draftTitle = document.title;
		draftBody = document.body;
		docsNotice = '';
	}

	function cancelEdit() {
		editingId = null;
		draftTitle = '';
		draftBody = '';
	}

	function saveDocument() {
		if (!draftBody.trim()) return;
		if (editingId) {
			trailAssistant.updateDocument(editingId, { title: draftTitle, body: draftBody });
			docsNotice = 'Saved offline.';
		} else {
			const document = trailAssistant.createDocument({ title: draftTitle, body: draftBody });
			if (!document) return;
			editingId = document.id;
			docsNotice = 'Saved offline.';
		}
	}

	function removeDocument(id: string) {
		trailAssistant.deleteDocument(id);
		if (editingId === id) cancelEdit();
		docsNotice = 'Deleted from this phone.';
	}

	function saveScoutAnswer() {
		const document = trailAssistant.saveLastScoutAnswerAsDocument(draftTitle.trim() || 'Scout field draft');
		if (!document) {
			docsNotice = 'Ask Scout for a draft first, then save the answer here.';
			return;
		}
		editDocument(document);
		docsNotice = 'Saved Scout answer as an offline doc.';
	}

	function askScoutToDraft() {
		const topic = scoutDraftTopic.trim();
		if (!topic) return;
		trailAssistant.draftDocumentWithScout(topic);
	}

	function docExcerpt(text: string, max = 260): string {
		const normalized = text.replace(/\s+/g, ' ').trim();
		return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
	}

	function scoreSourceDoc(document: FieldGuideExcerpt, queryText: string): number {
		const tokens = queryText
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, ' ')
			.split(/\s+/)
			.filter((token) => token.length > 2);
		if (!tokens.length) return 0;
		const haystack = `${document.title} ${document.body} ${document.tags.join(' ')}`.toLowerCase();
		return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
	}

	const sourceDocs = $derived(guide);
	const visibleSourceDocs = $derived.by(() => {
		const queryText = sourceDocQuery.trim();
		if (!queryText) return sourceDocs.slice(0, 8);
		return sourceDocs
			.map((document) => ({ document, score: scoreSourceDoc(document, queryText) }))
			.filter((result) => result.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 12)
			.map((result) => result.document);
	});

	function copySourceToDoc(document: FieldGuideExcerpt) {
		const created = trailAssistant.createDocument({
			title: document.title.replace(/^(Field Guide|AT Source):\s*/i, ''),
			body: [`Source: ${document.citation ?? 'Bundled offline source library'}`, '', document.body].join('\n')
		});
		if (!created) return;
		editDocument(created);
		docsNotice = 'Copied source into an editable offline doc.';
	}
</script>

<div class="trail">
	<header class="trail-head">
		<h1>Trail</h1>
		<p>Your offline library: field guide, scripture, docs, and your pack.</p>
	</header>

	<div class="segmented" role="tablist" aria-label="Trail sections">
		{#each sections as s (s.key)}
			<button
				class="seg"
				class:active={section === s.key}
				type="button"
				role="tab"
				aria-selected={section === s.key}
				onclick={() => (trailAssistant.trailSection = s.key)}
			>
				{s.label}
			</button>
		{/each}
	</div>

	{#if section === 'guide'}
		<div class="stack">
			{#if guide.length}
				{#each guide as excerpt (excerpt.id)}
					<article class="card entry">
						<h3>{excerpt.title}</h3>
						<p class="body">{excerpt.body}</p>
						{#if excerpt.tags.length}
							<div class="tags">
								{#each excerpt.tags as tag (tag)}<span class="tag">{tag}</span>{/each}
							</div>
						{/if}
						{#if excerpt.citation}<p class="cite">{excerpt.citation}</p>{/if}
					</article>
				{/each}
			{:else}
				<p class="empty">No field guide entries in the loaded pack yet.</p>
			{/if}
		</div>
	{:else if section === 'bible'}
		<BibleReader />
	{:else if section === 'docs'}
		<div class="stack">
			<section class="card docs-editor" aria-label="Offline document editor">
				<div class="doc-editor-head">
					<div>
						<p class="section-kicker">Offline docs</p>
						<h2>{editingId ? 'Edit field doc' : 'New field doc'}</h2>
					</div>
					<button class="small-action" type="button" onclick={newDocument}>New</button>
				</div>

				<label class="doc-label" for="trail-doc-title">Title</label>
				<input
					id="trail-doc-title"
					class="doc-title-input"
					bind:value={draftTitle}
					placeholder="Foot care, resupply plan, sermon notes..."
				/>

				<label class="doc-label" for="trail-doc-body">Body</label>
				<textarea
					id="trail-doc-body"
					class="doc-body-input"
					bind:value={draftBody}
					rows="8"
					placeholder="Write anything you want Scout to remember and search offline."
				></textarea>

				<div class="doc-actions">
					<button class="doc-button primary" type="button" onclick={saveDocument} disabled={!draftBody.trim()}>
						Save offline
					</button>
					<button class="doc-button" type="button" onclick={cancelEdit}>Clear</button>
					<button class="doc-button" type="button" onclick={saveScoutAnswer}>Save last Scout answer</button>
				</div>

				<div class="scout-draft-row">
					<input
						class="doc-title-input"
						bind:value={scoutDraftTopic}
						placeholder="Ask Scout to draft a doc about..."
						aria-label="Scout draft topic"
					/>
					<button class="doc-button" type="button" onclick={askScoutToDraft} disabled={!scoutDraftTopic.trim()}>
						Ask Scout
					</button>
				</div>

				<p class="doc-hint">
					Local field notes. Scout drafts are saved only when you choose.
				</p>
				{#if docsNotice}<p class="doc-notice" role="status">{docsNotice}</p>{/if}
			</section>

			{#if documents.length}
				{#each documents as document (document.id)}
					<article class="card entry doc-card">
						<div class="entry-top">
							<strong>{document.title}</strong>
							<span class="status">{document.source === 'scout-draft' ? 'Scout draft' : 'Manual'}</span>
						</div>
						<p class="entry-meta">Updated {fmtTime(document.updatedAt)}</p>
						<p class="body">{document.body}</p>
						<div class="doc-row-actions">
							<button type="button" onclick={() => editDocument(document)}>Edit</button>
							<button type="button" onclick={() => removeDocument(document.id)}>Delete</button>
						</div>
					</article>
				{/each}
			{:else}
				<p class="empty">No personal docs yet. The bundled source library below is still searchable offline by Scout.</p>
			{/if}

			<section class="card source-library" aria-label="Bundled offline source library">
				<div class="doc-editor-head">
					<div>
						<p class="section-kicker">Bundled source library</p>
						<h2>{sourceDocs.length} offline source docs</h2>
					</div>
				</div>
				<input
					class="doc-title-input"
					bind:value={sourceDocQuery}
					placeholder="Search trail sources, weather policy, shelters, water..."
					aria-label="Search bundled source docs"
				/>
				<div class="source-results">
					{#each visibleSourceDocs as sourceDoc (sourceDoc.id)}
						<article class="source-doc">
							<div>
								<strong>{sourceDoc.title}</strong>
								<p>{docExcerpt(sourceDoc.body)}</p>
								{#if sourceDoc.citation}<span>{sourceDoc.citation}</span>{/if}
							</div>
							<button type="button" onclick={() => copySourceToDoc(sourceDoc)}>Copy to edit</button>
						</article>
					{:else}
						<p class="empty">No bundled source docs match “{sourceDocQuery}”.</p>
					{/each}
				</div>
			</section>

			{#if checkIns.length}
				<div class="section-divider">
					<p class="section-kicker">Recent check-ins</p>
				</div>
				{#each checkIns as entry (entry.id)}
					<article class="card entry">
						<div class="entry-top">
							<strong>{entry.location || `Mile ${entry.mile.toFixed(1)}`}</strong>
							<span class="status">{entry.status}</span>
						</div>
						<p class="entry-meta">{fmtTime(entry.timestamp)} · Mile {entry.mile.toFixed(1)}</p>
						{#if entry.note}<p class="body">{entry.note}</p>{/if}
					</article>
				{/each}
			{/if}
		</div>
	{:else}
		<div class="stack">
			<p class="gear-intro">What's on your back — glance before you pack up so nothing's left at camp.</p>
			<div class="gear-summary card">
				<div>
					<p class="gs-lab">Carried</p>
					<strong>{totalLb} lb</strong>
				</div>
				<span class="gear-count">{carried.length} of {loadout.length} items</span>
			</div>
			{#if loadout.length}
				<div class="gear-list">
					{#each loadout as item (item.name)}
						<div class="gear-row" class:dropped={!item.carried}>
							<div class="gear-name">
								<strong>{item.name}</strong>
								<span class="gear-cat">{item.category}</span>
								{#if item.note}<span class="gear-note">{item.note}</span>{/if}
							</div>
							<span class="gear-weight tabular">
								{item.weightOz ? `${(item.weightOz / 16).toFixed(1)} lb` : '—'}
							</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty">No loadout in the loaded pack yet.</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.trail {
		display: grid;
		gap: 14px;
		min-width: 0;
		max-width: 100%;
		overflow: hidden;
	}

	.trail-head h1 {
		font-family: var(--font-display);
		font-size: 1.5rem;
	}

	.trail-head p {
		font-size: 0.84rem;
		color: var(--muted);
		margin-top: 2px;
		overflow-wrap: break-word;
	}

	.segmented {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
		padding: 4px;
		border-radius: 12px;
		background: rgba(47, 75, 53, 0.07);
		min-width: 0;
	}

	.seg {
		min-height: 36px;
		border-radius: 9px;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--muted);
	}

	.seg.active {
		background: var(--bg, #fffdf8);
		color: var(--forest);
		box-shadow: var(--shadow-soft);
	}

	.stack {
		display: grid;
		gap: 10px;
		min-width: 0;
		max-width: 100%;
	}

	.entry {
		padding: 12px 14px;
		display: grid;
		gap: 6px;
		min-width: 0;
		max-width: 100%;
		overflow: hidden;
	}

	.entry h3 {
		font-family: var(--font-display);
		font-size: 1rem;
		overflow-wrap: break-word;
	}

	.body {
		font-size: 0.88rem;
		line-height: 1.5;
		color: var(--ink);
		overflow-wrap: break-word;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}

	.tag {
		font-size: 0.66rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.08);
		color: var(--forest);
	}

	.cite {
		font-size: 0.72rem;
		color: var(--muted);
		overflow-wrap: anywhere;
	}

	.empty {
		color: var(--muted);
		font-size: 0.86rem;
		padding: 6px 2px;
	}

	.entry-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		min-width: 0;
	}

	.entry-top strong {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.entry-meta {
		font-size: 0.82rem;
		color: var(--muted);
	}

	.status {
		font-size: 0.78rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 2px 8px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.1);
		color: var(--forest);
	}

	/* Docs section */
	.docs-editor {
		display: grid;
		gap: 8px;
		padding: 12px 14px;
		min-width: 0;
		max-width: 100%;
		overflow: hidden;
	}

	.doc-editor-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		min-width: 0;
	}

	.section-kicker {
		font-size: 0.82rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		overflow-wrap: anywhere;
	}

	.section-divider {
		padding: 8px 2px 0;
	}

	.doc-editor-head h2 {
		font-family: var(--font-display);
		font-size: 1.05rem;
		color: var(--ink);
	}

	.small-action,
	.doc-button,
	.doc-row-actions button {
		min-height: 44px;
		border-radius: 10px;
		padding: 8px 12px;
		font-size: 0.82rem;
		font-weight: 800;
		background: rgba(47, 75, 53, 0.08);
		color: var(--forest);
	}

	.doc-button.primary {
		background: var(--forest);
		color: var(--bg, #fffdf8);
	}

	.doc-button:disabled {
		opacity: 0.45;
	}

	.doc-label {
		font-size: 0.82rem;
		font-weight: 800;
		color: var(--muted);
	}

	.doc-title-input,
	.doc-body-input {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--surface-strong, #fffdf8);
		color: var(--ink);
		font: inherit;
		font-size: 0.9rem;
		padding: 10px 12px;
	}

	.doc-body-input {
		resize: vertical;
		min-height: 150px;
		line-height: 1.45;
	}

	.doc-actions,
	.scout-draft-row,
	.doc-row-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.scout-draft-row {
		padding-top: 4px;
	}

	.scout-draft-row .doc-title-input {
		flex: 1 1 180px;
	}

	.doc-hint,
	.doc-notice {
		font-size: 0.86rem;
		line-height: 1.45;
		color: var(--muted);
	}

	.doc-notice {
		color: var(--forest);
		font-weight: 800;
	}

	.doc-card .body {
		white-space: pre-wrap;
	}

	.source-library {
		display: grid;
		gap: 10px;
		padding: 12px 14px;
		min-width: 0;
		max-width: 100%;
		overflow: hidden;
	}

	.source-results {
		display: grid;
		gap: 8px;
	}

	.source-doc {
		display: grid;
		gap: 10px;
		padding: 10px 0;
		border-top: 1px solid rgba(95, 101, 88, 0.12);
		min-width: 0;
	}

	.source-doc:first-child {
		border-top: 0;
		padding-top: 0;
	}

	.source-doc strong {
		display: block;
		font-size: 0.9rem;
		line-height: 1.25;
		color: var(--ink);
	}

	.source-doc p {
		margin-top: 4px;
		font-size: 0.84rem;
		line-height: 1.45;
		color: var(--muted);
		overflow-wrap: break-word;
	}

	.source-doc span {
		display: block;
		margin-top: 5px;
		font-size: 0.72rem;
		line-height: 1.35;
		color: var(--moss);
		overflow-wrap: anywhere;
	}

	.source-doc button {
		justify-self: start;
		min-height: 44px;
		border-radius: 10px;
		padding: 8px 12px;
		font-size: 0.82rem;
		font-weight: 800;
		background: rgba(47, 75, 53, 0.08);
		color: var(--forest);
	}

	/* Gear section */
	.gear-intro {
		font-size: 0.82rem;
		color: var(--muted);
		line-height: 1.45;
	}
	.gear-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 14px;
		gap: 12px;
		min-width: 0;
	}
	.gs-lab {
		font-size: 0.66rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	.gear-summary strong {
		font-family: var(--font-display);
		font-size: 1.4rem;
		color: var(--forest);
	}
	.gear-count {
		font-size: 0.78rem;
		color: var(--muted);
		font-weight: 700;
	}
	.gear-list {
		display: grid;
		gap: 1px;
		border-radius: 12px;
		overflow: hidden;
		background: rgba(95, 101, 88, 0.12);
	}
	.gear-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 10px 14px;
		background: var(--surface-strong, #fffdf8);
		min-width: 0;
	}
	.gear-row.dropped {
		opacity: 0.5;
	}
	.gear-name {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.gear-name strong {
		font-size: 0.88rem;
		overflow-wrap: anywhere;
	}
	.gear-cat {
		font-size: 0.68rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: 700;
	}
	.gear-note {
		font-size: 0.74rem;
		color: var(--muted);
		overflow-wrap: break-word;
	}
	.gear-weight {
		font-size: 0.84rem;
		font-weight: 700;
		color: var(--ink);
	}
</style>
