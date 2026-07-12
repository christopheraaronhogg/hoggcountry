<script lang="ts">
	import { onMount } from 'svelte';
	import { minuteClock } from '$lib/minute-clock.svelte';
	import {
		buildSavedTrailFacts,
		shouldShowSavedTrailFacts,
		type SavedWaterFact
	} from '$lib/scout/saved-trail-facts';
	import { trailAssistant } from '$lib/trailState.svelte';

	onMount(() => minuteClock.retain());
	const nowMs = $derived(minuteClock.nowMs);
	const readiness = $derived(trailAssistant.scoutOfflineReadiness);
	const modelProbeKnown = $derived(
		readiness.stage !== 'needs_model' || trailAssistant.modelStatus !== null
	);
	const visible = $derived(shouldShowSavedTrailFacts(readiness.stage) && modelProbeKnown);
	const packStatus = $derived(trailAssistant.fieldPackStatusAt(nowMs));
	const packPersistence = $derived(trailAssistant.fieldPackPersistence);
	const facts = $derived.by(() =>
		buildSavedTrailFacts({
			pack: trailAssistant.fieldPack,
			currentMile: trailAssistant.currentMile,
			direction: trailAssistant.hikeProfile.direction,
			status: packStatus,
			persistence: packPersistence
		})
	);
	const distinctReliableWater = $derived(
		facts?.nextReliableWater &&
			(facts.nextReliableWater.mile !== facts.nextWater?.mile ||
				facts.nextReliableWater.name !== facts.nextWater?.name)
			? facts.nextReliableWater
			: null
	);

	function distanceLabel(miles: number): string {
		return miles <= 0.01 ? 'here' : `${miles.toFixed(1)} mi ahead`;
	}

	function waterReliability(water: SavedWaterFact): string {
		if (water.reliability === 'reliable') return 'Labeled reliable in the loaded field pack';
		if (water.reliability === 'seasonal') return 'Seasonal in the loaded field pack';
		return 'Thin or unconfirmed in the loaded field pack';
	}
</script>

{#if visible && facts}
	<section
		class="saved-facts-shell"
		aria-labelledby="saved-facts-title"
		aria-describedby="saved-facts-boundary"
		data-saved-trail-facts
	>
		<h2 id="saved-facts-title" class="visually-hidden">{facts.heading}</h2>
		<details class="saved-facts card" class:cached-only={facts.cachedOnly}>
			<summary>
				<span class="summary-row">
					<span class="summary-copy">
						<strong>{facts.heading}</strong>
						<span>
							Mile {facts.currentMile.toFixed(1)} · {facts.direction === 'SOBO' ? 'heading south' : 'heading north'}
						</span>
					</span>
					<span id="saved-facts-boundary" class="truth-chip">Not an AI answer</span>
				</span>
			</summary>

			<div class="saved-facts-body">
				<p class="ai-state" role="status">
					<strong>{readiness.label}.</strong> {readiness.detail} Showing deterministic facts from the field pack loaded in this app.
				</p>

				<dl>
				<div>
					<dt>Next loaded water</dt>
					<dd>
						{#if facts.nextWater}
							<strong>{facts.nextWater.name}</strong>
							<span>Mile {facts.nextWater.mile.toFixed(1)} · {distanceLabel(facts.nextWater.milesAhead)}</span>
							<small>
								{waterReliability(facts.nextWater)} · confirm current flow and treat/filter
								{facts.nextWater.note ? ` · ${facts.nextWater.note}` : ''}
							</small>
						{:else}
							<span>No water entry is loaded within {facts.maxMiles} mi.</span>
						{/if}
					</dd>
				</div>

				{#if distinctReliableWater}
					<div>
						<dt>Next reliable-labeled water</dt>
						<dd>
							<strong>{distinctReliableWater.name}</strong>
							<span>Mile {distinctReliableWater.mile.toFixed(1)} · {distanceLabel(distinctReliableWater.milesAhead)}</span>
							<small>
								Loaded classification only · confirm current flow and treat/filter
								{distinctReliableWater.note ? ` · ${distinctReliableWater.note}` : ''}
							</small>
						</dd>
					</div>
				{:else if !facts.nextWater || facts.nextWater.reliability !== 'reliable'}
					<div>
						<dt>Reliable-labeled water</dt>
						<dd><span>No reliable-labeled water is loaded within {facts.maxMiles} mi.</span></dd>
					</div>
				{/if}

				<div>
					<dt>Next loaded shelter</dt>
					<dd>
						{#if facts.nextShelter}
							<strong>{facts.nextShelter.name}</strong>
							<span>Mile {facts.nextShelter.mile.toFixed(1)} · {distanceLabel(facts.nextShelter.milesAhead)}</span>
							<small>Candidate only · verify status, rules, water, capacity, and crowding</small>
						{:else}
							<span>No shelter entry is loaded within {facts.maxMiles} mi.</span>
						{/if}
					</dd>
				</div>

				<div>
					<dt>Next loaded town / access</dt>
					<dd>
						{#if facts.nextTown}
							<strong>{facts.nextTown.name}</strong>
							<span>Mile {facts.nextTown.mile.toFixed(1)} · {distanceLabel(facts.nextTown.milesAhead)}</span>
							<small>
								{facts.nextTown.access ? `Loaded access: ${facts.nextTown.access} · ` : ''}verify access, shuttle, services, and hours
							</small>
						{:else}
							<span>No town or access entry is loaded within {facts.maxMiles} mi.</span>
						{/if}
					</dd>
				</div>
				</dl>

				<p class="pack-notice">{facts.notice}</p>
			</div>
		</details>
	</section>
{/if}

<style>
	.saved-facts-shell {
		flex: 0 1 auto;
		min-height: 0;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.saved-facts {
		min-height: 0;
		padding: 0;
		overflow: hidden;
		border-color: color-mix(in srgb, var(--moss) 38%, var(--line));
		background: color-mix(in srgb, var(--moss) 5%, var(--surface));
	}

	.saved-facts[open] {
		display: flex;
		flex-direction: column;
		max-height: min(46vh, 360px);
		max-height: min(46dvh, 360px);
	}

	.saved-facts.cached-only {
		border-color: color-mix(in srgb, var(--warn) 55%, var(--line));
		background: color-mix(in srgb, var(--warn) 8%, var(--surface));
	}

	summary {
		flex: 0 0 auto;
		padding: 12px 13px;
		cursor: pointer;
		color: var(--ink);
	}

	summary::marker {
		color: var(--moss);
	}

	.summary-row {
		width: calc(100% - 20px);
		display: inline-flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
		vertical-align: middle;
	}

	.summary-copy {
		min-width: 0;
		display: grid;
		gap: 2px;
		font-size: var(--text-sm);
		color: var(--muted);
	}

	.summary-copy strong {
		font-size: var(--text-base);
		color: var(--ink);
	}

	.truth-chip {
		flex: 0 0 auto;
		padding: 4px 7px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink) 8%, transparent);
		font-size: var(--text-sm);
		font-weight: 900;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.saved-facts-body {
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		display: grid;
		gap: 10px;
		padding: 0 13px 13px;
	}

	.ai-state,
	.pack-notice {
		font-size: var(--text-sm);
		line-height: 1.45;
		color: var(--muted);
	}

	.ai-state strong {
		color: var(--ink);
	}

	dl {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	dl > div {
		min-width: 0;
		padding: 9px;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: color-mix(in srgb, var(--surface) 88%, transparent);
	}

	dt {
		margin-bottom: 4px;
		font-size: var(--text-sm);
		font-weight: 850;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--muted);
	}

	dd {
		margin: 0;
		display: grid;
		gap: 2px;
		font-size: var(--text-sm);
		line-height: 1.38;
		color: var(--ink);
	}

	dd strong {
		font-size: var(--text-base);
	}

	dd small {
		font-size: var(--text-sm);
		line-height: 1.4;
		color: var(--muted);
	}

	.pack-notice {
		padding-top: 8px;
		border-top: 1px solid var(--line);
	}

	.cached-only .pack-notice {
		font-weight: 750;
		color: var(--ink);
	}

	@media (max-width: 390px) {
		dl {
			grid-template-columns: 1fr;
		}
	}
</style>
