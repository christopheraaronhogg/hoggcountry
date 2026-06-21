<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import { elevationWindow, climbFeet } from '$lib/trail/trail-geometry';
	import Icon, { type IconName } from './Icon.svelte';
	import TrailPulsePanel from './TrailPulsePanel.svelte';

	// Today = the hiker's day, now → camp (M1 "Day Timeline"). No readiness score —
	// we have no vitals, so the HUD anchors only on REAL data: position, the day's
	// arc, the last cached forecast, and the next honest move. The structure
	// answers "what do I do next?" at a 2-second glance.

	const TOTAL_MILES = 2197.4;
	const from = $derived(trailAssistant.currentMile);
	const dayNumber = $derived(trailAssistant.dayNumber);
	const pct = $derived(Math.min(100, Math.round((from / TOTAL_MILES) * 100)));
	const toGo = $derived(Math.max(0, TOTAL_MILES - from));
	const scoutAiLabel = $derived(
		trailAssistant.modelStatus?.runtimeConfigured === false
			? 'Runtime missing'
			: trailAssistant.modelStatus?.state === 'ready'
				? 'On-device AI'
				: 'AI not installed'
	);

	// Forecast that travels with the field pack (CachedWeather | null). When the
	// server can reach NWS it is an official point forecast; otherwise the UI stays
	// honest about cache/missing state.
	const wx = $derived(trailAssistant.fieldPack.weather);
	const wxUpdated = $derived(
		wx ? new Date(wx.generatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''
	);
	const wxIsNws = $derived(wx?.source === 'nws');
	const wxSourceLabel = $derived(wx ? (wxIsNws ? `NWS ${wxUpdated}` : `Cached ${wxUpdated}`) : 'No forecast');
	const wxCaveat = $derived(
		wxIsNws
			? 'Official NWS point forecast · refresh before exposed terrain'
			: 'Cached forecast — not live · verify before exposed terrain'
	);

	// Gear glance — derived from the SAME live loadout the Gear screen uses, so the
	// two never disagree.
	const loadout = $derived(trailAssistant.fieldPack.loadout);
	const hasLoadout = $derived(loadout.length > 0);
	const packTotalCarriedLb = $derived(
		Math.round((loadout.filter((i) => i.carried).reduce((s, i) => s + (i.weightOz ?? 0), 0) / 16) * 10) / 10
	);
	const packMissingCount = $derived(loadout.filter((i) => !i.carried).length);

	// --- upcoming landmarks (keep mile, derive the day to camp) ----------------
	// Cap the look-ahead so a pack that doesn't bracket the hiker's mile (e.g. an
	// offline self user still holding the bundled Dad-pilot NY pack) can't render
	// absurd "815 mi to water" distances. Real trail-ahead data sits within ~80 mi;
	// anything past LOOKAHEAD is stale-for-this-mile and shown as an honest empty.
	const LOOKAHEAD = 120;
	const watersAhead = $derived(
		trailAssistant.fieldPack.water
			.filter((w) => w.mile >= from - 0.01 && w.mile <= from + LOOKAHEAD)
			.sort((a, b) => a.mile - b.mile)
	);
	const sheltersAhead = $derived(
		trailAssistant.fieldPack.shelters
			.filter((s) => s.mile >= from - 0.01 && s.mile <= from + LOOKAHEAD)
			.sort((a, b) => a.mile - b.mile)
	);
	const nextWater = $derived(watersAhead[0] ?? null);
	const camp = $derived(sheltersAhead[0] ?? null); // the day's planned end

	// Ascent between here and camp, summed from the real USGS elevation profile.
	const geo = $derived(trailAssistant.trailGeometry);
	const climbFt = $derived.by(() => {
		if (!camp) return 0;
		return climbFeet(elevationWindow(geo, from, camp.mile - from));
	});

	type Node = { kind: 'done' | 'now' | 'water' | 'camp' | 'evening'; title: string; detail?: string; flag?: string };
	const dayNodes = $derived.by<Node[]>(() => {
		const nodes: Node[] = [];
		// Spine starts at NOW (real position) — no fabricated "Broke camp" the app
		// can't observe. Everything below is forward-looking from the field pack.
		nodes.push({
			kind: 'now',
			title: `Now · Mile ${from.toFixed(1)}`,
			detail: trailAssistant.hikeProfile.direction === 'SOBO' ? 'On trail, heading south.' : 'On trail, heading north.'
		});
		const dayWaters = camp ? watersAhead.filter((w) => w.mile <= camp.mile + 0.01) : watersAhead.slice(0, 2);
		for (const w of dayWaters.slice(0, 2)) {
			const candidate = w.reliability !== 'reliable';
			nodes.push({
				kind: 'water',
				title: `Water · ${w.name}`,
				detail: `${(w.mile - from).toFixed(1)} mi ahead${candidate ? '' : ' · reliable'}`,
				flag: candidate ? 'candidate — confirm flow' : undefined
			});
		}
		if (camp) {
			nodes.push({
				kind: 'camp',
				title: `Camp · ${camp.name}`,
				detail: `${(camp.mile - from).toFixed(1)} mi to go${climbFt > 0 ? ` · +${climbFt.toLocaleString()} ft climb` : ''}`
			});
		}
		nodes.push({ kind: 'evening', title: 'Tonight · verse & journal', detail: 'When you reach camp: read and log the day.' });
		return nodes;
	});

	const nodeIcon: Record<Node['kind'], IconName> = {
		done: 'check',
		now: 'now',
		water: 'water',
		camp: 'shelter',
		evening: 'moon'
	};

	// --- ask scout (kept; reframed without readiness) --------------------------
	const prompts = [
		"What's the next reliable water?",
		'Can the shelter hold us tonight?',
		'What needs verifying before town?',
		'Give me the safest next move.'
	];
	function ask(prompt: string) {
		trailAssistant.activeTab = 'Scout';
		trailAssistant.runQuickPrompt(prompt);
	}
	const lastAnswer = $derived(trailAssistant.lastScoutAnswer);
	let helpNote = $state('');
	function needHelp() {
		const request = trailAssistant.requestHelp('Today');
		helpNote = request.message;
		if (request.href) window.location.href = request.href;
	}

	const checkInDue = $derived(
		new Date(trailAssistant.nextCheckInDueAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
	);
</script>

<div class="today">
	<!-- HUD: real data only, no readiness score -->
	<section class="hud card">
		<div class="hud-top">
			<span class="day">Day {dayNumber}</span>
			<span class="off">{scoutAiLabel}</span>
		</div>
		<div class="mile tabular">{from.toFixed(1)}<span class="of"> / {TOTAL_MILES.toLocaleString()} mi</span></div>
		<div class="bar"><div class="fill" style="width:{pct}%"></div></div>
		<div class="splits">
			<div><span class="k">Done</span><b class="tabular">{from.toFixed(0)} mi</b></div>
			<div><span class="k">To go</span><b class="tabular">{toGo.toFixed(0)} mi</b></div>
			<div><span class="k">Progress</span><b class="tabular">{pct}%</b></div>
		</div>
		<div class="checkin">
			<span class="ci-due">Check-in due {checkInDue}</span>
			<div class="checkin-buttons">
				<button class="safe-btn" onclick={() => trailAssistant.performCheckIn('safe', 'Quick safe check-in from Today.')}>
					I'm safe ✓
				</button>
				<button class="help-btn" onclick={needHelp}>Need help</button>
			</div>
		</div>
		{#if helpNote}<p class="today-help-note">{helpNote}</p>{/if}
	</section>

	<!-- NEXT: glance-first next action -->
	{#if nextWater || camp}
		<section class="next card">
			<span class="eyebrow">Now → next</span>
			{#if nextWater}
				<p class="next-main">
					Top off water · <b>{(nextWater.mile - from).toFixed(1)} mi</b>
					{#if nextWater.reliability !== 'reliable'}<span class="cand">candidate — confirm flow</span>{/if}
				</p>
			{/if}
			{#if camp}
				<p class="next-sub">
					then <b>{(camp.mile - from).toFixed(1)} mi</b> to {camp.name}{#if climbFt > 0} · +{climbFt.toLocaleString()} ft{/if}
				</p>
			{/if}
		</section>
	{/if}

	<!-- Weather: first-class, with what-it-means + daylight -->
	<section class="wx card">
		<div class="wx-head">
			<span class="eyebrow">Weather</span>
			<span class="wx-src">{wxSourceLabel}</span>
		</div>
		{#if wx}
			<div class="wx-now">
				<div class="temp tabular">{wx.highF}°</div>
				<div class="wx-meta">
					<p class="sum">{wx.summary}</p>
					<p class="hilo">High {wx.highF}° · Low {wx.lowF}° · wind {wx.windMph} mph</p>
				</div>
			</div>
			<p class="means">
				<span class="meanslab">{wxCaveat}</span>
				{wx.riskNote ?? 'This is cached field-pack weather. Refresh before relying on it.'}
			</p>
			<span class="wx-foot">
				{wx.sourceLabel ?? (wxIsNws ? 'NWS point forecast' : 'Cached field-pack weather')} · mile {wx.mile.toFixed(1)} · generated {wxUpdated}
			</span>
		{:else}
			<p class="means">
				<span class="meanslab">No forecast in this pack</span>
				Refresh the field pack or check an official weather source before relying on weather.
			</p>
		{/if}
	</section>

	<TrailPulsePanel />

	<!-- Day spine: the day, now → camp -->
	<section class="spine card">
		<span class="eyebrow">Your day · now → camp</span>
		<ol class="timeline">
			{#each dayNodes as n, i (n.kind + i)}
				<li class="node {n.kind}">
					<span class="dot"><Icon name={nodeIcon[n.kind]} size={15} stroke={1.9} /></span>
					<div class="ncontent">
						<p class="ntitle">{n.title}</p>
						{#if n.detail}<p class="ndetail">{n.detail}</p>{/if}
						{#if n.flag}<p class="nflag">{n.flag}</p>{/if}
					</div>
				</li>
			{/each}
		</ol>
	</section>

	<!-- Ask Scout — calm, opens the real chat -->
	<section class="ask card">
		<div class="eyebrow">Ask Scout</div>
		<p class="greet">Cited, on-device answers — for the trail or the Word.</p>
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

	<!-- Gear: a morning packing glance -->
	<button class="packing card" onclick={() => trailAssistant.openTrailSection('gear')}>
		<div class="pk-left">
			<div class="eyebrow">Packing up?</div>
			<p class="pk-line">
				{hasLoadout ? `${packTotalCarriedLb} lb on your back` : 'Add your gear'}
			</p>
			<p class="pk-sub">
				{!hasLoadout
					? 'No personal loadout saved yet - Scout will not guess your base weight'
					: packMissingCount > 0
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
		font-size: var(--text-floor);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--moss);
		font-weight: 800;
		margin-bottom: 10px;
		display: block;
	}

	/* HUD */
	.hud {
		padding: 16px 18px 14px;
	}
	.hud-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.hud-top .day {
		font-size: var(--text-floor);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--moss);
		font-weight: 800;
	}
	.hud-top .off {
		font-size: var(--text-floor);
		letter-spacing: 0.04em;
		font-weight: 800;
		text-transform: uppercase;
		color: var(--clay);
		background: rgba(170, 104, 67, 0.12);
		border-radius: 999px;
		padding: 3px 9px;
	}
	.mile {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 3.4rem;
		line-height: 1;
		letter-spacing: 0;
		color: var(--ink);
		margin: 6px 0 10px;
	}
	.mile .of {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--muted);
	}
	.bar {
		height: 7px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.1);
		overflow: hidden;
	}
	.fill {
		height: 100%;
		border-radius: 999px;
		background: var(--forest);
	}
	.splits {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		margin-top: 12px;
	}
	.splits div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.splits .k {
		font-size: var(--text-floor);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
		font-weight: 800;
	}
	.splits b {
		font-family: var(--font-display);
		font-size: 1.1rem;
		color: var(--ink);
		font-weight: 800;
	}
	.checkin {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 13px;
		padding-top: 12px;
		border-top: 1px solid var(--line);
	}
	.ci-due {
		font-size: var(--text-floor);
		color: var(--muted);
		font-weight: 700;
	}
	.checkin-buttons {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: 8px;
	}
	.safe-btn {
		min-height: 44px;
		padding: 9px 16px;
		border-radius: 999px;
		background: rgba(47, 75, 53, 0.1);
		color: var(--forest);
		font-weight: 800;
		font-size: 0.85rem;
	}
	.help-btn {
		min-height: 44px;
		padding: 9px 14px;
		border-radius: 999px;
		background: rgba(151, 58, 44, 0.12);
		color: var(--danger);
		font-weight: 900;
		font-size: 0.85rem;
	}
	.today-help-note {
		margin-top: 10px;
		padding: 9px 11px;
		border-radius: 10px;
		background: rgba(151, 58, 44, 0.1);
		color: var(--danger);
		font-size: 0.88rem;
		line-height: 1.4;
		font-weight: 750;
	}

	/* NEXT line */
	.next {
		padding: 14px 18px 15px;
		border-left: 3px solid var(--forest);
	}
	.next-main {
		font-family: var(--font-display);
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--ink);
		line-height: 1.3;
	}
	.next-main b {
		color: var(--forest);
	}
	.cand {
		display: inline-block;
		font-family: var(--font-sans);
		font-size: var(--text-floor);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--clay);
		background: rgba(170, 104, 67, 0.12);
		border-radius: 999px;
		padding: 2px 8px;
		margin-left: 4px;
		vertical-align: middle;
	}
	.next-sub {
		font-size: 0.86rem;
		color: var(--muted);
		margin-top: 5px;
	}
	.next-sub b {
		color: var(--ink);
		font-weight: 800;
	}

	/* Weather */
	.wx {
		padding: 15px 18px 16px;
	}
	.wx-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}
	.wx-head .eyebrow {
		margin-bottom: 0;
	}
	.wx-src {
		font-size: var(--text-floor);
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.wx-now {
		display: flex;
		align-items: center;
		gap: 14px;
		margin: 10px 0 4px;
	}
	.temp {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 3rem;
		line-height: 1;
		color: var(--sky);
	}
	.wx-meta .sum {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--ink);
	}
	.wx-meta .hilo {
		font-size: var(--text-floor);
		color: var(--muted);
		margin-top: 2px;
	}
	.means {
		font-size: 0.86rem;
		line-height: 1.5;
		color: var(--ink);
		background: rgba(95, 128, 144, 0.08);
		border-radius: 10px;
		padding: 10px 12px;
		margin: 10px 0;
	}
	.meanslab {
		display: block;
		font-size: var(--text-floor);
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--sky);
		margin-bottom: 3px;
	}
	.hourly {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 6px;
		height: 64px;
		margin: 6px 0 4px;
	}
	.hcol {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		height: 100%;
		justify-content: flex-end;
	}
	.htrack {
		width: 100%;
		max-width: 22px;
		height: 38px;
		display: flex;
		align-items: flex-end;
		background: rgba(95, 128, 144, 0.1);
		border-radius: 5px;
		overflow: hidden;
	}
	.hfill {
		width: 100%;
		background: var(--sky);
		opacity: 0.55;
		border-radius: 5px 5px 0 0;
	}
	.hfill.peak {
		background: var(--clay);
		opacity: 0.85;
	}
	.hpct {
		font-size: var(--text-floor);
		font-weight: 800;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.hpct.peak {
		color: var(--clay);
	}
	.hlab {
		font-size: var(--text-floor);
		color: var(--muted);
		font-weight: 700;
	}
	.wx-foot {
		display: block;
		font-size: var(--text-floor);
		font-weight: 700;
		color: var(--muted);
		margin-top: 4px;
		line-height: 1.35;
	}

	/* Day spine */
	.spine {
		padding: 16px 18px 14px;
	}
	.timeline {
		list-style: none;
		display: grid;
		gap: 0;
	}
	.node {
		display: grid;
		grid-template-columns: 26px 1fr;
		gap: 10px;
		padding-bottom: 16px;
		position: relative;
	}
	.node:not(:last-child)::before {
		content: '';
		position: absolute;
		left: 12px;
		top: 24px;
		bottom: 0;
		width: 2px;
		background: var(--line);
	}
	.dot {
		width: 26px;
		height: 26px;
		border-radius: 999px;
		display: grid;
		place-items: center;
		font-size: var(--text-floor);
		background: rgba(47, 75, 53, 0.08);
		color: var(--moss);
		z-index: 1;
	}
	.node.now .dot {
		background: var(--forest);
		color: #f4efe4;
	}
	.node.camp .dot {
		background: rgba(170, 104, 67, 0.14);
		color: var(--clay);
	}
	.ntitle {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		color: var(--ink);
		line-height: 1.2;
	}
	.node.now .ntitle {
		color: var(--forest);
	}
	.ndetail {
		font-size: var(--text-floor);
		color: var(--muted);
		margin-top: 2px;
		line-height: 1.4;
	}
	.nflag {
		font-size: var(--text-floor);
		font-weight: 800;
		color: var(--clay);
		margin-top: 3px;
	}

	/* Ask Scout */
	.ask {
		padding: 18px 18px 16px;
	}
	.greet {
		font-family: var(--font-display);
		font-size: 1.05rem;
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
		min-height: 44px;
		padding: 11px 2px;
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
		font-size: var(--text-floor);
		color: var(--muted);
		background: var(--bg, #fffdf8);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 3px 9px;
	}
	.badge {
		margin-left: auto;
		font-size: var(--text-floor);
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
		font-size: var(--text-floor);
		color: var(--muted);
		margin-top: 2px;
	}
	.pk-arrow {
		font-size: 1.4rem;
		color: var(--muted);
		flex: none;
	}

	/* Dark mode: several accent tints were hardcoded light-mode values, which
	   wash out on dark surfaces. Re-tint them with the dark accent values. */
	@media (prefers-color-scheme: dark) {
		.bar {
			background: rgba(242, 234, 219, 0.1);
		}
		.safe-btn {
			background: rgba(152, 196, 142, 0.16);
		}
		.help-btn {
			background: rgba(240, 154, 136, 0.16);
		}
		.today-help-note {
			background: rgba(240, 154, 136, 0.12);
		}
		.dot {
			background: rgba(152, 196, 142, 0.14);
		}
		.node.camp .dot,
		.cand {
			background: rgba(229, 161, 116, 0.16);
		}
	}
</style>
