<script lang="ts">
	import { waterSources, weatherSnapshot } from '$lib/mockTrailData';
	import { trailAssistant } from '$lib/trailState.svelte';
	import TrailPulsePanel from './TrailPulsePanel.svelte';
	import ElevationStrip from './ElevationStrip.svelte';
	import WeatherStrip from './WeatherStrip.svelte';
	import OfflineStatus from './OfflineStatus.svelte';
	import ServiceStrip from './ServiceStrip.svelte';
	import SourceChip from './SourceChip.svelte';
	import ConfidenceBadge from './ConfidenceBadge.svelte';
	import { sourceReceipts, packMissingCount, packTotalCarriedLb } from './cockpitData';

	function recommendationLabel() {
		const labels = {
			push: 'Push window',
			steady: 'Steady day',
			hold: 'Hold discipline',
			nero: 'Nero recommended',
			zero: 'Zero recommended'
		};

		return labels[trailAssistant.readiness.recommendation];
	}

	function recommendationDetail() {
		const m = trailAssistant.readiness;
		return `Target ${m.targetMiles.toFixed(1)} mi · ${m.targetVert.toLocaleString()} ft · ${m.reasons.length} drivers`;
	}

	const remaining = $derived(trailAssistant.milesRemainingToday.toFixed(1));
	const progress = $derived(trailAssistant.progressPercent);

	const nextWater = $derived.by(() => {
		const fromMile = trailAssistant.currentMile;
		return (
			trailAssistant.fieldPack.water
				.filter((source) => source.mile >= fromMile - 0.01)
				.sort((a, b) => a.mile - b.mile)[0] ?? null
		);
	});
	const nextShelter = $derived.by(() => {
		const fromMile = trailAssistant.currentMile;
		return (
			trailAssistant.fieldPack.shelters
				.filter((shelter) => shelter.mile >= fromMile - 0.01)
				.sort((a, b) => a.mile - b.mile)[0] ?? null
		);
	});
	const nextTown = $derived.by(() => {
		const fromMile = trailAssistant.currentMile;
		return (
			trailAssistant.fieldPack.towns
				.filter((town) => town.mile >= fromMile - 0.01)
				.sort((a, b) => a.mile - b.mile)[0] ?? null
		);
	});
	const nextWaterDistance = $derived(nextWater ? Math.max(0, nextWater.mile - trailAssistant.currentMile).toFixed(1) : null);
	const nextShelterDistance = $derived(nextShelter ? Math.max(0, nextShelter.mile - trailAssistant.currentMile).toFixed(1) : null);
	const nextTownDistance = $derived(nextTown ? Math.max(0, nextTown.mile - trailAssistant.currentMile).toFixed(1) : null);

	const checkInDue = $derived(
		new Date(trailAssistant.nextCheckInDueAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
	);
</script>

<div class="section-stack">
	<!-- Cockpit hero: the single screen that answers "what now". -->
	<section class="cockpit card">
		<div class="cockpit-top">
			<div>
				<p class="eyebrow">Today · {recommendationLabel()}</p>
				<h2>
					<span class="big-number tabular">{trailAssistant.currentDayMiles.toFixed(1)}</span>
					<span class="of-target tabular">/ {trailAssistant.readiness.targetMiles.toFixed(1)} mi</span>
				</h2>
				<p class="cockpit-detail">{recommendationDetail()}</p>
			</div>

			<div class="readiness-dial" aria-label="Readiness score">
				<div class="dial-ring" style:--score={trailAssistant.readiness.score}>
					<strong>{trailAssistant.readiness.score}</strong>
					<span>READY</span>
				</div>
			</div>
		</div>

		<div class="progress-shell" aria-hidden="true">
			<div class="progress-fill" style:width={`${progress}%`}></div>
			<div class="progress-tick" style:left={`${progress}%`}>
				<span>{remaining} mi left</span>
			</div>
		</div>

		<div class="cockpit-strip">
			<button class="cockpit-cell cell-button" type="button" data-kind="water" aria-label="Next water source">
				<span class="cell-eyebrow">Next water</span>
				<strong>{nextWaterDistance ? `${nextWaterDistance} mi` : '—'}</strong>
				<span class="cell-detail">{nextWater?.name ?? waterSources[0].name}</span>
			</button>
			<button class="cockpit-cell cell-button" type="button" data-kind="shelter" aria-label="Next shelter">
				<span class="cell-eyebrow">Next shelter</span>
				<strong>{nextShelterDistance ? `${nextShelterDistance} mi` : '—'}</strong>
				<span class="cell-detail">{nextShelter?.name ?? 'No shelter on file'}</span>
			</button>
			<button
				class="cockpit-cell cell-button"
				type="button"
				data-kind="town"
				onclick={() => (trailAssistant.activeTab = 'Map')}
				aria-label="Next town"
			>
				<span class="cell-eyebrow">Next town</span>
				<strong>{nextTownDistance ? `${nextTownDistance} mi` : '—'}</strong>
				<span class="cell-detail">{nextTown?.name ?? '—'}</span>
			</button>
			<button
				class="cockpit-cell cell-button"
				type="button"
				data-kind="safety"
				onclick={() => (trailAssistant.activeTab = 'Settings')}
				aria-label="Check-in due"
			>
				<span class="cell-eyebrow">Check-in due</span>
				<strong>{checkInDue}</strong>
				<span class="cell-detail risk-{trailAssistant.missedCheckInRisk}">
					{trailAssistant.missedCheckInRisk === 'high' ? 'Send now' : trailAssistant.missedCheckInRisk === 'medium' ? 'Send soon' : 'Within window'}
				</span>
			</button>
		</div>

		<div class="cockpit-actions">
			<button class="cta-button" onclick={() => (trailAssistant.activeTab = 'Scout')}>
				Ask Scout about today
			</button>
			<button
				class="secondary-button"
				onclick={() => trailAssistant.performCheckIn('safe', 'Quick safe check-in from Today.')}
			>
				I'm safe ✓
			</button>
		</div>
	</section>

	<!-- Elevation + weather: glanceable terrain + condition picture. -->
	<section class="card terrain-card">
		<ElevationStrip currentMile={trailAssistant.currentMile} />
		<div class="terrain-meta">
			<p>{weatherSnapshot.summary}. {weatherSnapshot.riskNote}</p>
			<SourceChip source={sourceReceipts.awol2026} />
		</div>
	</section>

	<section class="card weather-card">
		<div class="card-header">
			<div>
				<p class="eyebrow">Forecast</p>
				<h3>5-day outlook</h3>
			</div>
			<SourceChip source={sourceReceipts.nws} />
		</div>
		<WeatherStrip />
	</section>

	<!-- Next-20 mile service strip. -->
	<section class="card section-card">
		<ServiceStrip />
	</section>

	<!-- Pack + offline status, side-by-side compact summary. -->
	<section class="card pack-summary">
		<div class="summary-row">
			<div>
				<p class="eyebrow">Pack</p>
				<strong>{packTotalCarriedLb} lb</strong>
				<span>{packMissingCount > 0 ? `${packMissingCount} item missing` : 'Complete loadout'}</span>
			</div>
			<button class="outline-button compact" onclick={() => (trailAssistant.activeTab = 'Trail')}>
				Review pack →
			</button>
		</div>
	</section>

	<section class="card offline-card">
		<OfflineStatus />
	</section>

	<TrailPulsePanel />

	<!-- Why this day looks the way it does. -->
	<section class="card section-card">
		<div class="card-header">
			<div>
				<p class="eyebrow">Readiness drivers</p>
				<h3>Why we're holding</h3>
			</div>
			<ConfidenceBadge confidence="medium" />
		</div>

		<ul class="reason-list">
			{#each trailAssistant.readiness.reasons as reason (reason)}
				<li>{reason}</li>
			{/each}
		</ul>

		<div class="receipts">
			<p class="receipt-label">Sources used</p>
			<div class="receipt-row">
				<SourceChip source={sourceReceipts.hikerProfile} />
				<SourceChip source={sourceReceipts.nws} />
				<SourceChip source={sourceReceipts.farout} />
			</div>
		</div>
	</section>
</div>

<style>
	.cockpit {
		padding: 14px 14px 16px;
		display: grid;
		gap: 12px;
		background:
			radial-gradient(circle at top right, rgba(95, 128, 144, 0.14), transparent 38%),
			linear-gradient(180deg, rgba(255, 253, 248, 0.98), rgba(247, 240, 228, 0.96));
	}

	.cockpit-top {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 12px;
		align-items: start;
	}

	.cockpit-top h2 {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin: 2px 0 4px;
		font-family: var(--font-display);
	}

	.big-number {
		font-size: 2.8rem;
		font-weight: 800;
		color: var(--forest);
		line-height: 0.95;
	}

	.of-target {
		font-size: 1rem;
		font-weight: 700;
		color: var(--muted);
	}

	.cockpit-detail {
		font-size: 0.84rem;
		color: var(--muted);
	}

	.readiness-dial {
		width: 76px;
		height: 76px;
		display: grid;
		place-items: center;
	}

	.dial-ring {
		--score: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		display: grid;
		place-items: center;
		text-align: center;
		background:
			conic-gradient(
				var(--forest) calc(var(--score) * 1%),
				rgba(47, 75, 53, 0.12) 0
			);
		position: relative;
	}

	.dial-ring::before {
		content: '';
		position: absolute;
		inset: 6px;
		border-radius: 50%;
		background: var(--surface-strong);
		z-index: 0;
	}

	.dial-ring strong,
	.dial-ring span {
		position: relative;
		z-index: 1;
	}

	.dial-ring strong {
		font-family: var(--font-display);
		font-size: 1.3rem;
		font-weight: 800;
		color: var(--forest);
		line-height: 1;
	}

	.dial-ring span {
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.18em;
		color: var(--muted);
		margin-top: 2px;
	}

	.progress-shell {
		position: relative;
		height: 10px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.12);
		overflow: visible;
	}

	.progress-fill {
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, var(--forest), var(--moss));
	}

	.progress-tick {
		position: absolute;
		top: 12px;
		transform: translateX(-50%);
		font-size: 0.7rem;
		font-weight: 800;
		color: var(--forest);
		white-space: nowrap;
	}

	.cockpit-strip {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 6px;
		margin-top: 6px;
	}

	.cockpit-cell {
		display: grid;
		gap: 2px;
		padding: 9px 6px 10px;
		border-radius: 12px;
		background: rgba(47, 75, 53, 0.06);
		border: 1px solid rgba(95, 101, 88, 0.1);
		text-decoration: none;
		color: var(--ink);
		text-align: left;
	}

	.cockpit-cell.cell-button {
		font: inherit;
	}

	.cockpit-cell[data-kind='water'] {
		background: rgba(95, 128, 144, 0.1);
	}
	.cockpit-cell[data-kind='shelter'] {
		background: rgba(170, 104, 67, 0.1);
	}
	.cockpit-cell[data-kind='town'] {
		background: rgba(106, 132, 95, 0.12);
	}
	.cockpit-cell[data-kind='safety'] {
		background: rgba(200, 167, 122, 0.18);
	}

	.cell-eyebrow {
		font-size: 0.58rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}

	.cockpit-cell strong {
		font-size: 1rem;
		font-weight: 800;
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}

	.cell-detail {
		font-size: 0.7rem;
		color: var(--muted);
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.cockpit-actions {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 8px;
	}

	.cockpit-actions .secondary-button {
		min-height: 44px;
	}

	.terrain-card {
		padding: 14px;
		display: grid;
		gap: 10px;
	}

	.terrain-meta {
		display: grid;
		gap: 8px;
	}

	.terrain-meta p {
		font-size: 0.84rem;
		color: var(--muted);
	}

	.weather-card,
	.section-card,
	.offline-card {
		padding: 14px;
		display: grid;
		gap: 10px;
	}

	.card-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
	}

	.card-header h3 {
		font-family: var(--font-display);
		font-size: 1.15rem;
	}

	.pack-summary {
		padding: 12px 14px;
	}

	.summary-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.summary-row div {
		display: grid;
		gap: 2px;
	}

	.summary-row strong {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 800;
		color: var(--forest);
	}

	.summary-row span {
		font-size: 0.74rem;
		color: var(--muted);
	}

	.outline-button.compact {
		width: auto;
		min-height: 38px;
		padding: 6px 12px;
		font-size: 0.82rem;
	}

	.reason-list {
		margin: 0;
		padding-left: 18px;
		display: grid;
		gap: 8px;
		color: var(--ink);
	}

	.reason-list li {
		color: var(--ink);
		font-size: 0.88rem;
	}

	.receipts {
		display: grid;
		gap: 6px;
		padding-top: 8px;
		border-top: 1px dashed rgba(95, 101, 88, 0.18);
	}

	.receipt-label {
		font-size: 0.64rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}

	.receipt-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
</style>
