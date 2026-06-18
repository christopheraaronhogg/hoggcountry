<script lang="ts">
	import { weatherSnapshot } from '$lib/mockTrailData';
	import { trailAssistant } from '$lib/trailState.svelte';
	import { packMissingCount, packTotalCarriedLb } from './cockpitData';

	// Calm glance dashboard (D3 "Today" — the bake-off winner). The structure does
	// the safety work: readiness owns the page by size, the candidate-grade water
	// caveat sits in clay (unmissable but not a klaxon), and Scout is a calm card
	// that opens into the real chat — glance by default, converse on demand.

	const REC: Record<string, { label: string; tone: 'go' | 'warn' }> = {
		push: { label: 'Push', tone: 'go' },
		steady: { label: 'Steady', tone: 'go' },
		hold: { label: 'Hold', tone: 'warn' },
		nero: { label: 'Nero', tone: 'warn' },
		zero: { label: 'Zero', tone: 'warn' }
	};
	const rec = $derived(REC[trailAssistant.readiness.recommendation] ?? { label: 'Steady', tone: 'go' });

	const from = $derived(trailAssistant.currentMile);
	const nextWater = $derived.by(() => {
		const w = trailAssistant.fieldPack.water
			.filter((s) => s.mile >= from - 0.01)
			.sort((a, b) => a.mile - b.mile)[0];
		return w ? { name: w.name, dist: Math.max(0, w.mile - from), candidate: w.reliability !== 'reliable' } : null;
	});
	const nextShelter = $derived.by(() => {
		const s = trailAssistant.fieldPack.shelters
			.filter((x) => x.mile >= from - 0.01)
			.sort((a, b) => a.mile - b.mile)[0];
		return s ? { name: s.name, dist: Math.max(0, s.mile - from) } : null;
	});

	const greeting = $derived.by(() => {
		const steady = rec.tone === 'go' ? 'holding steady' : 'asking for restraint';
		const water = nextWater?.candidate
			? " Keep mapped water marked low-confidence until it's confirmed."
			: '';
		return `Good morning. Trail readiness is ${steady} today.${water}`;
	});

	const prompts = [
		'Can I push mileage today?',
		"What's the next reliable water?",
		'What needs verifying before town?',
		'Give me the safest next move.'
	];

	function ask(prompt: string) {
		trailAssistant.activeTab = 'Scout';
		trailAssistant.runQuickPrompt(prompt);
	}

	const lastAnswer = $derived(trailAssistant.lastScoutAnswer);
	const checkInDue = $derived(
		new Date(trailAssistant.nextCheckInDueAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
	);
</script>

<div class="today">
	<!-- Readiness owns the page -->
	<section class="readiness card">
		<div class="rtop">
			<span class="lab">Readiness</span>
			<span class="pill" data-tone={rec.tone}>{rec.label}</span>
		</div>
		<div class="num tabular">{trailAssistant.readiness.score}</div>
		<p class="reason">
			{#each trailAssistant.readiness.reasons.slice(0, 1) as reason (reason)}{reason}{/each}
			{#if nextWater?.candidate}
				Next water is <b>candidate-grade</b> — keep miles conservative.
			{/if}
		</p>
	</section>

	<!-- Today's target + conditions glance -->
	<section class="target card">
		<div class="eyebrow">Today</div>
		<div class="big tabular">
			{trailAssistant.readiness.targetMiles.toFixed(1)}<span class="unit"> mi</span>
		</div>
		{#if nextShelter}
			<p class="dest">to {nextShelter.name} · {nextShelter.dist.toFixed(1)} mi</p>
		{/if}
		<p class="meta">
			{weatherSnapshot.summary} · {weatherSnapshot.highF}° / {weatherSnapshot.lowF}° · wind {weatherSnapshot.windMph} mph
		</p>
		<div class="checkin">
			<span class="ci-due">Check-in due {checkInDue}</span>
			<button class="safe-btn" onclick={() => trailAssistant.performCheckIn('safe', 'Quick safe check-in from Today.')}>
				I'm safe ✓
			</button>
		</div>
	</section>

	<!-- Ask Scout — calm, not chat-first -->
	<section class="ask card">
		<div class="eyebrow">Ask Scout</div>
		<p class="greet">{greeting}</p>

		{#each prompts as prompt (prompt)}
			<button class="prompt-row" onclick={() => ask(prompt)}>
				<span class="q">›</span><span class="qtext">{prompt}</span><span class="arrow">+</span>
			</button>
		{/each}

		{#if lastAnswer}
			<div class="exchange">
				<p class="ans">{lastAnswer.answer}</p>
				<div class="receipts">
					{#each lastAnswer.receipts.slice(0, 3) as r (r.id)}
						<span class="receipt">{r.title}</span>
					{/each}
					<span class="badge">{lastAnswer.confidence}</span>
				</div>
			</div>
		{/if}
	</section>

	<!-- Gear: a morning packing glance, not an all-day tab -->
	<button class="packing card" onclick={() => (trailAssistant.activeTab = 'Gear')}>
		<div class="pk-left">
			<div class="eyebrow">Packing up?</div>
			<p class="pk-line">{packTotalCarriedLb} lb on your back</p>
			<p class="pk-sub">
				{packMissingCount > 0
					? `${packMissingCount} item${packMissingCount === 1 ? '' : 's'} not packed — check before you go`
					: 'Full loadout — nothing left at camp'}
			</p>
		</div>
		<span class="pk-arrow" aria-hidden="true">›</span>
	</button>
</div>

<style>
	.today {
		display: grid;
		gap: 14px;
	}

	.card {
		background: var(--surface-strong);
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-soft);
	}

	.eyebrow {
		font-size: 0.64rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--moss);
		font-weight: 800;
		margin-bottom: 10px;
	}

	/* Readiness */
	.readiness {
		padding: 20px 20px 18px;
	}
	.rtop {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}
	.rtop .lab {
		font-size: 0.64rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--moss);
		font-weight: 800;
	}
	.pill {
		font-family: var(--font-display);
		font-size: 0.95rem;
		letter-spacing: 0.04em;
		padding: 4px 14px 5px;
		border-radius: 999px;
		line-height: 1;
	}
	.pill[data-tone='warn'] {
		color: var(--warn, #9a7320);
		border: 1px solid rgba(182, 137, 44, 0.4);
		background: rgba(182, 137, 44, 0.1);
	}
	.pill[data-tone='go'] {
		color: var(--forest);
		border: 1px solid rgba(47, 75, 53, 0.3);
		background: rgba(47, 75, 53, 0.08);
	}
	.num {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 5.4rem;
		line-height: 0.92;
		letter-spacing: -0.02em;
		color: var(--ink);
		margin: 4px 0 2px;
	}
	.reason {
		font-size: 0.86rem;
		line-height: 1.5;
		color: var(--muted);
		margin-top: 6px;
	}
	.reason b {
		color: var(--clay);
		font-weight: 800;
	}

	/* Today target */
	.target {
		padding: 16px 18px 14px;
	}
	.target .big {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 2.8rem;
		line-height: 1;
		color: var(--ink);
	}
	.target .big .unit {
		font-size: 1.2rem;
		color: var(--muted);
	}
	.target .dest {
		font-size: 0.9rem;
		color: var(--ink);
		margin-top: 8px;
		font-weight: 700;
	}
	.target .meta {
		font-size: 0.8rem;
		color: var(--muted);
		margin-top: 3px;
	}
	.checkin {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--line);
	}
	.ci-due {
		font-size: 0.78rem;
		color: var(--muted);
		font-weight: 700;
	}
	.safe-btn {
		min-height: 38px;
		padding: 7px 14px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.1);
		color: var(--forest);
		font-weight: 800;
		font-size: 0.82rem;
	}

	/* Ask Scout */
	.ask {
		padding: 18px 18px 16px;
	}
	.greet {
		font-family: var(--font-display);
		font-size: 1.12rem;
		line-height: 1.34;
		font-weight: 700;
		color: var(--ink);
		margin-bottom: 12px;
	}
	.prompt-row {
		display: flex;
		align-items: center;
		gap: 11px;
		width: 100%;
		padding: 12px 2px;
		border-top: 1px solid var(--line);
		font-size: 0.9rem;
		color: var(--ink);
		text-align: left;
	}
	.prompt-row .q {
		font-size: 0.85rem;
		color: var(--moss);
	}
	.prompt-row .qtext {
		flex: 1;
	}
	.prompt-row .arrow {
		color: var(--muted);
		font-size: 1rem;
	}
	.exchange {
		background: var(--bg, #fffdf8);
		border: 1px solid var(--line);
		border-left: 3px solid var(--forest);
		border-radius: 10px;
		padding: 14px 15px;
		margin-top: 10px;
	}
	.exchange .ans {
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--ink);
		display: -webkit-box;
		-webkit-line-clamp: 4;
		line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.receipts {
		display: flex;
		align-items: center;
		gap: 7px;
		flex-wrap: wrap;
		margin-top: 12px;
		padding-top: 11px;
		border-top: 1px solid var(--line);
	}
	.receipt {
		font-size: 0.66rem;
		color: var(--muted);
		background: var(--bg, #fffdf8);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 3px 9px;
	}
	.badge {
		margin-left: auto;
		font-size: 0.64rem;
		letter-spacing: 0.06em;
		font-weight: 800;
		text-transform: uppercase;
		color: var(--warn, #9a7320);
		background: rgba(182, 137, 44, 0.13);
		border: 1px solid rgba(182, 137, 44, 0.34);
		border-radius: 999px;
		padding: 3px 10px;
	}

	/* Packing glance */
	.packing {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 16px;
		text-align: left;
		width: 100%;
	}
	.pk-line {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.15rem;
		color: var(--forest);
	}
	.pk-sub {
		font-size: 0.78rem;
		color: var(--muted);
		margin-top: 2px;
	}
	.pk-arrow {
		font-size: 1.4rem;
		color: var(--muted);
		flex: none;
	}
</style>
