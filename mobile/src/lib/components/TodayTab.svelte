<script lang="ts">
	import {
		directedMileDelta,
		trailAhead,
		trailProgress
	} from '@hoggcountry/trail-data/trail-direction';
	import { onMount } from 'svelte';
	import {
		SAFE_CHECK_IN_DISCLOSURE,
		SAFE_CHECK_IN_RECORDED,
		buildCheckInShareText,
		helpShareOutcomeNote,
		safeShareOutcomeNote
	} from '$lib/check-in-ui';
	import { formatAge, formatTimeUntil } from '$lib/freshness';
	import { minuteClock } from '$lib/minute-clock.svelte';
	import { handoffText } from '$lib/text-handoff';
	import { trailAssistant } from '$lib/trailState.svelte';
	import { elevationWindow, climbFeet } from '$lib/trail/trail-geometry';
	import Icon, { type IconName } from './Icon.svelte';
	import PreparedHelpDraft from './PreparedHelpDraft.svelte';
	import TrailPulsePanel from './TrailPulsePanel.svelte';

	// Today is a forward look from the hiker's current position. No readiness score —
	// we have no vitals, so the HUD anchors only on REAL data: position, the day's
	// nearby landmarks, the last cached forecast, and the next honest move. The structure
	// answers "what do I do next?" at a 2-second glance.
	onMount(() => minuteClock.retain());
	const nowMs = $derived(minuteClock.nowMs);

	const TOTAL_MILES = 2197.4;
	const from = $derived(trailAssistant.currentMile);
	const direction = $derived(trailAssistant.hikeProfile.direction);
	const dayNumber = $derived(trailAssistant.dayNumber);
	const progress = $derived(trailProgress(from, TOTAL_MILES, direction));
	const pct = $derived(Math.round(progress.percent));
	const scoutOfflineTested = $derived(
		trailAssistant.scoutOfflineReadiness.stage === 'offline_ready'
	);

	// Forecast that travels with the field pack (CachedWeather | null). When the
	// server can reach NWS it is an official point forecast; otherwise the UI stays
	// honest about cache/missing state.
	const wx = $derived(trailAssistant.fieldPack.weather);
	const packStatus = $derived(trailAssistant.fieldPackStatus);
	const packRefreshNeedsAttention = $derived(
		packStatus.state === 'error' || packStatus.state === 'stale'
	);
	const wxUpdated = $derived(wx ? formatAge(wx.generatedAt, nowMs) : '');
	const wxIsNws = $derived(wx?.source === 'nws');
	const wxSourceLabel = $derived(wx ? `${wxIsNws ? 'NWS' : 'Cached'} · ${wxUpdated}` : 'No forecast');
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

	// --- upcoming landmarks -----------------------------------------------------
	// Cap the look-ahead so a pack that doesn't bracket the hiker's mile (e.g. an
	// offline self user still holding the bundled Dad-pilot NY pack) can't render
	// absurd "815 mi to water" distances. Real trail-ahead data sits within ~80 mi;
	// anything past LOOKAHEAD is stale-for-this-mile and shown as an honest empty.
	const LOOKAHEAD = 120;
	const watersAhead = $derived(
		trailAssistant.trailSettings.waterAlerts
			? trailAhead(trailAssistant.fieldPack.water, from, direction, LOOKAHEAD)
			: []
	);
	const sheltersAhead = $derived(
		trailAhead(trailAssistant.fieldPack.shelters, from, direction, LOOKAHEAD)
	);
	const nextWater = $derived(watersAhead[0] ?? null);
	// A mapped shelter is not a destination until the hiker deliberately chooses it.
	const nextShelter = $derived(sheltersAhead[0] ?? null);
	const nextWaterDistance = $derived(nextWater ? directedMileDelta(from, nextWater.mile, direction) : 0);
	const nextShelterDistance = $derived(nextShelter ? directedMileDelta(from, nextShelter.mile, direction) : 0);

	// Ascent between here and the next shelter, summed from the real USGS profile.
	const geo = $derived(trailAssistant.trailGeometry);
	const climbFt = $derived.by(() => {
		if (!nextShelter) return 0;
		return climbFeet(elevationWindow(geo, from, nextShelterDistance, direction));
	});

	type Node = { kind: 'done' | 'now' | 'water' | 'shelter' | 'evening'; title: string; detail?: string; flag?: string };
	const dayNodes = $derived.by<Node[]>(() => {
		const nodes: Node[] = [];
		// Spine starts at NOW (real position) — no fabricated "Broke camp" the app
		// can't observe. Everything below is forward-looking from the field pack.
		nodes.push({
			kind: 'now',
			title: `Now · Mile ${from.toFixed(1)}`,
			detail: direction === 'SOBO' ? 'On trail, heading south.' : 'On trail, heading north.'
		});
		const landmarks: Array<{ distance: number; node: Node }> = [];
		const dayWaters = watersAhead.slice(0, 2);
		for (const w of dayWaters.slice(0, 2)) {
			const candidate = w.reliability !== 'reliable';
			const distance = directedMileDelta(from, w.mile, direction);
			landmarks.push({
				distance,
				node: {
					kind: 'water',
					title: `Water · ${w.name}`,
					detail: `${distance.toFixed(1)} mi ahead${candidate ? '' : ' · reliable'}`,
					flag: candidate ? 'candidate — confirm flow' : undefined
				}
			});
		}
		if (nextShelter) {
			landmarks.push({
				distance: nextShelterDistance,
				node: {
					kind: 'shelter',
					title: `Next shelter · ${nextShelter.name}`,
					detail: `${nextShelterDistance.toFixed(1)} mi ahead${climbFt > 0 ? ` · +${climbFt.toLocaleString()} ft climb` : ''} · not a selected stop`
				}
			});
		}
		nodes.push(...landmarks.sort((a, b) => a.distance - b.distance).map((landmark) => landmark.node));
		nodes.push({ kind: 'evening', title: 'Tonight · verse & journal', detail: 'At your chosen stop: read and log the day.' });
		return nodes;
	});

	const nodeIcon: Record<Node['kind'], IconName> = {
		done: 'check',
		now: 'now',
		water: 'water',
		shelter: 'shelter',
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
		if (trailAssistant.scoutReplyInProgress) return;
		trailAssistant.activeTab = 'Scout';
		trailAssistant.runQuickPrompt(prompt);
	}
	const lastAnswer = $derived(trailAssistant.lastScoutAnswer);
	const checkInShare = $derived(
		buildCheckInShareText({
			currentMile: trailAssistant.currentMile,
			trailName: trailAssistant.hikeProfile.trailName
		})
	);
	let checkInNote = $state('');
	let helpNote = $state('');
	let helpPreparedText = $state('');
	let safeShareBusy = $state(false);
	let helpShareBusy = $state(false);
	function safeCheckIn() {
		trailAssistant.performCheckIn('safe', 'Quick safe check-in from Today.');
		checkInNote = SAFE_CHECK_IN_RECORDED;
	}
	async function shareSafeUpdate() {
		if (safeShareBusy) return;
		safeShareBusy = true;
		try {
			checkInNote = safeShareOutcomeNote(
				await handoffText({ title: 'Trail check-in', text: checkInShare.text })
			);
		} finally {
			safeShareBusy = false;
		}
	}
	async function needHelp() {
		if (helpShareBusy) return;
		helpShareBusy = true;
		try {
			let text = helpPreparedText;
			if (!text) {
				const request = trailAssistant.requestHelp('Today');
				text = request.text;
				helpPreparedText = text;
				helpNote = request.message;
			} else {
				helpNote = 'Reopening the existing prepared details; no new check-in was logged.';
			}
			const outcome = await handoffText({ title: 'Need help', text });
			helpNote = helpShareOutcomeNote(outcome);
		} finally {
			helpShareBusy = false;
		}
	}
	function startNewHelpRequest() {
		if (helpShareBusy) return;
		helpPreparedText = '';
		void needHelp();
	}
	function refreshTrailData() {
		void trailAssistant.refreshFieldPack();
	}

	const checkInDue = $derived(
		trailAssistant.hasCheckedIn
			? formatTimeUntil(trailAssistant.nextCheckInDueAt, nowMs)
			: 'not started'
	);
</script>

<div class="today">
	<!-- HUD hero: the day's anchor — a deep-forest panel, real data only -->
	<section class="hud">
		<div class="hud-top">
			<span class="day">Day {dayNumber}</span>
			{#if scoutOfflineTested}<span class="off">Scout offline tested</span>{/if}
		</div>
		<div class="mile tabular">{from.toFixed(1)}<span class="of"> / {TOTAL_MILES.toLocaleString()} mi</span></div>
		<div class="splits">
			<div class="s">
				<span class="k">Done</span>
				<b class="tabular">{progress.completedMiles.toFixed(0)}<span class="u"> mi</span></b>
				<span class="pct tabular">{pct}%</span>
			</div>
			<div class="s">
				<span class="k">To go</span>
				<b class="tabular">{progress.remainingMiles.toFixed(0)}<span class="u"> mi</span></b>
				<span class="pct tabular">{100 - pct}%</span>
			</div>
		</div>
		<div class="bar"><div class="fill" style="width:{pct}%"></div></div>
		<div class="checkin">
			<span class="ci-due">Check-in {checkInDue}</span>
			<div class="checkin-buttons">
				<button class="safe-btn" onclick={safeCheckIn}>
					I'm safe ✓
				</button>
				<button class="circle-btn" type="button" disabled={safeShareBusy} onclick={shareSafeUpdate}>
					{safeShareBusy ? 'Opening share…' : 'Share safe update'}
				</button>
				<button class="help-btn" type="button" disabled={helpShareBusy} onclick={needHelp}>
					{helpShareBusy ? 'Opening share…' : helpPreparedText ? 'Share help details again' : 'Need help'}
				</button>
			</div>
		</div>
		<p class="checkin-disclosure">{SAFE_CHECK_IN_DISCLOSURE}</p>
		{#if checkInNote}<p class="today-checkin-note">{checkInNote}</p>{/if}
		{#if helpNote}<p class="today-help-note">{helpNote}</p>{/if}
		{#if helpPreparedText}
			<PreparedHelpDraft
				text={helpPreparedText}
				newRequestBusy={helpShareBusy}
				onStartNew={startNewHelpRequest}
			/>
		{/if}
	</section>

	<!-- Nearby field-pack landmarks; a shelter is not a selected destination. -->
	{#if nextWater || nextShelter}
		<section class="next card">
			<div class="next-head">
				<span class="eyebrow">Ahead</span>
				{#if nextShelter}<span class="next-day">Next shelter · {nextShelterDistance.toFixed(1)} mi</span>{/if}
			</div>
			{#if nextWater}
				{@const cand = nextWater.reliability !== 'reliable'}
				<div class="next-row">
					<span class="ord ord-1">Water</span>
					<div class="next-copy">
						<p class="next-title">Top off water</p>
						<p class="next-meta" class:flag={cand}>{cand ? 'candidate — confirm flow' : 'reliable source'}</p>
					</div>
					<div class="next-num" class:cand>
						<b>{nextWaterDistance.toFixed(1)}</b><span>mi ahead</span>
					</div>
				</div>
			{/if}
			{#if nextShelter}
				<div class="next-row" class:divided={nextWater}>
					<span class="ord {nextWater ? 'ord-2' : 'ord-1'}">Shelter</span>
					<div class="next-copy">
						<p class="next-title">{nextShelter.name}</p>
						<p class="next-meta">Mapped candidate · choose your own stop{climbFt > 0 ? ` · +${climbFt.toLocaleString()} ft climb` : ''}</p>
					</div>
					<div class="next-num"><b>{nextShelterDistance.toFixed(1)}</b><span>mi ahead</span></div>
				</div>
			{/if}
		</section>
	{/if}

	<!-- Weather: first-class, with what-it-means + daylight -->
	<section class="wx card">
		<div class="wx-head">
			<div>
				<span class="eyebrow">Weather</span>
				<span class="wx-src">{wxSourceLabel}</span>
			</div>
			<button
				class="wx-refresh"
				type="button"
				onclick={refreshTrailData}
				disabled={!trailAssistant.onlineStatus || packStatus.state === 'refreshing'}
			>
				{packStatus.state === 'refreshing'
					? 'Refreshing…'
					: trailAssistant.onlineStatus
						? 'Refresh trail data'
						: 'Offline'}
			</button>
		</div>
		{#if packRefreshNeedsAttention}
			<p class="wx-refresh-status" role="status">{packStatus.detail}</p>
		{/if}
		{#if wx}
			<div class="wx-now">
				<div class="temp tabular">{wx.highF}°</div>
				<div class="wx-meta">
					<p class="sum">{wx.summary}</p>
					<p class="hilo"><span class="lo">▼ {wx.lowF}° low</span> · wind {wx.windMph} mph</p>
				</div>
			</div>
			<p class="means" data-caveat={wxIsNws ? null : 'cached'}>
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

	<!-- Forward-looking landmarks; the hiker still chooses the day's stop. -->
	<section class="spine card">
		<span class="eyebrow">Ahead from here · no stop selected</span>
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
		<p class="greet">Cited answers — for the trail or the Word.</p>
		{#each prompts as prompt (prompt)}
			<button class="prompt-row" disabled={trailAssistant.scoutReplyInProgress} onclick={() => ask(prompt)}>
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

	/* .card is the global design-system primitive (app.css). Today only needs the
	   in-card eyebrow spacing on top of the shared .eyebrow token. */
	.eyebrow {
		margin-bottom: 10px;
		display: block;
	}

	/* HUD hero — the day's anchor. A deep-forest panel that reads as system chrome
	   (not a content card), consistent in light and dark, with cream type and a
	   sage progress bar. This is the M1-reference look the rest of Today keys off. */
	.hud {
		position: relative;
		overflow: hidden;
		padding: 17px 19px 16px;
		border-radius: var(--radius-md);
		background: linear-gradient(150deg, #2f4b35 0%, #284230 56%, #1e3725 100%);
		border: 1px solid rgba(148, 168, 134, 0.16);
		box-shadow: var(--shadow-ridge), 0 1px 0 rgba(255, 255, 255, 0.05) inset;
		/* Cream-on-forest accents, fixed in both themes. */
		--hud-label: rgba(225, 234, 210, 0.82);
		--hud-faint: rgba(225, 234, 210, 0.62);
		--hud-cream: #f1ede2;
	}
	/* Soft sage glow, top-right — the reference's quiet depth cue. */
	.hud::after {
		content: '';
		position: absolute;
		right: -34px;
		top: -34px;
		width: 150px;
		height: 150px;
		border-radius: 50%;
		background: radial-gradient(circle at 40% 40%, rgba(148, 168, 134, 0.22), transparent 70%);
		pointer-events: none;
	}
	.hud-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: relative;
	}
	.hud-top .day {
		font-size: var(--text-floor);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--hud-label);
		font-weight: 800;
	}
	.hud-top .off {
		font-size: var(--text-floor);
		letter-spacing: 0.05em;
		font-weight: 800;
		text-transform: uppercase;
		color: var(--hud-cream);
		background: rgba(255, 255, 255, 0.12);
		border-radius: 999px;
		padding: 3px 10px;
	}
	.mile {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: var(--display-lg);
		line-height: 1;
		letter-spacing: 0;
		color: var(--hud-cream);
		margin: 8px 0 0;
		position: relative;
	}
	.mile .of {
		font-family: var(--font-sans);
		font-size: 1.02rem;
		font-weight: 700;
		color: var(--hud-faint);
	}
	.splits {
		display: flex;
		gap: 22px;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid rgba(185, 202, 169, 0.26);
		position: relative;
	}
	.splits .s {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.splits .k {
		font-size: var(--text-floor);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--hud-label);
		font-weight: 800;
	}
	.splits b {
		font-family: var(--font-display);
		font-size: 1.18rem;
		color: var(--hud-cream);
		font-weight: 800;
	}
	.splits b .u {
		font-family: var(--font-sans);
		font-size: var(--text-floor);
		font-weight: 700;
		color: var(--hud-faint);
	}
	.splits .pct {
		font-size: var(--text-floor);
		font-weight: 800;
		letter-spacing: 0.02em;
		color: var(--hud-faint);
	}
	.bar {
		height: 7px;
		border-radius: 999px;
		background: rgba(185, 202, 169, 0.22);
		overflow: hidden;
		margin-top: 13px;
	}
	.fill {
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, #8fae7f, #cdd9bf);
	}
	.checkin {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 14px;
		padding-top: 13px;
		border-top: 1px solid rgba(185, 202, 169, 0.2);
		position: relative;
	}
	.ci-due {
		font-size: var(--text-floor);
		color: var(--hud-faint);
		font-weight: 700;
	}
	.checkin-buttons {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 8px;
		flex-wrap: wrap;
	}
	/* Compact pills on the hero — present and tappable (44px hit area) without the
	   bulk of the old full-width light-card buttons. */
	.safe-btn,
	.circle-btn,
	.help-btn {
		min-height: 44px;
		padding: 7px 14px;
		border-radius: 999px;
		font-weight: 800;
		font-size: 0.82rem;
		white-space: nowrap;
		transition:
			background var(--dur-fast, 0.12s) var(--ease-out, ease),
			transform var(--dur-fast, 0.12s) var(--ease-out, ease);
	}
	/* The two emergency interactions must confirm the press landed — tapped at
	   night or under stress, silence reads as "did it register?". */
	.safe-btn:active,
	.circle-btn:active,
	.help-btn:active {
		transform: scale(0.96);
	}
	.safe-btn {
		background: rgba(255, 255, 255, 0.14);
		color: var(--hud-cream);
	}
	.circle-btn {
		border: 1px solid rgba(255, 255, 255, 0.32);
		color: var(--hud-cream);
		background: transparent;
	}
	.help-btn {
		background: rgba(240, 154, 136, 0.95);
		color: #2c100a;
		font-weight: 900;
	}
	.checkin-disclosure {
		position: relative;
		margin-top: 10px;
		color: var(--hud-faint);
		font-size: var(--text-floor);
		line-height: 1.45;
		font-weight: 700;
	}
	.today-checkin-note {
		position: relative;
		margin-top: 10px;
		padding: 9px 11px;
		border-radius: 10px;
		background: rgba(185, 202, 169, 0.16);
		color: var(--hud-cream);
		font-size: 0.88rem;
		line-height: 1.4;
		font-weight: 700;
	}
	.today-help-note {
		position: relative;
		margin-top: 12px;
		padding: 9px 11px;
		border-radius: 10px;
		background: rgba(240, 154, 136, 0.16);
		color: #ffe3da;
		font-size: 0.88rem;
		line-height: 1.4;
		font-weight: 700;
	}

	/* NEXT line */
	.next {
		padding: 15px 18px;
		border-left: 3px solid var(--clay);
	}
	.next-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 4px;
	}
	.next-head .eyebrow {
		margin-bottom: 0;
	}
	.next-day {
		font-size: var(--text-floor);
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.next-row {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 12px;
		padding: 9px 0;
	}
	.next-row.divided {
		border-top: 1px solid var(--divider-soft);
	}
	/* Ordinal chip — filled clay for the nearest action, outline for the next. */
	.ord {
		display: inline-grid;
		place-items: center;
		min-width: 40px;
		min-height: 26px;
		padding: 0 9px;
		border-radius: 999px;
		font-size: var(--text-2xs);
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.ord-1 {
		background: var(--clay);
		color: var(--on-accent);
	}
	.ord-2 {
		background: transparent;
		border: 1px solid var(--line);
		color: var(--muted);
	}
	.next-copy {
		min-width: 0;
	}
	.next-title {
		font-family: var(--font-display);
		font-size: 1.08rem;
		font-weight: 700;
		color: var(--ink);
		line-height: 1.16;
	}
	.next-meta {
		font-size: var(--text-floor);
		color: var(--muted);
		margin-top: 2px;
	}
	.next-meta.flag {
		color: var(--clay);
		font-weight: 800;
	}
	.next-num {
		text-align: right;
		line-height: 1;
	}
	.next-num b {
		display: block;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--forest);
	}
	.next-num.cand b {
		color: var(--clay);
	}
	.next-num span {
		font-size: var(--text-2xs);
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muted);
	}

	/* Weather — sky accent rail on the LEFT, matching the NEXT card's clay rail
	   (consistent accent placement across the day's cards). */
	.wx {
		padding: 15px 18px;
		border-left: 3px solid var(--sky);
	}
	.wx-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}
	.wx-head .eyebrow {
		margin-bottom: 0;
	}
	.wx-src {
		display: block;
		font-size: var(--text-floor);
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muted);
		margin-top: 4px;
	}
	.wx-refresh {
		min-height: 40px;
		padding: 0 11px;
		border: 1px solid var(--sky);
		border-radius: var(--radius-control);
		background: var(--sky-soft);
		color: var(--sky);
		font-size: var(--text-floor);
		font-weight: 900;
		line-height: 1.2;
		text-align: center;
	}
	.wx-refresh:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.wx-refresh-status {
		margin: 9px 0 0;
		padding: 8px 10px;
		border-radius: 9px;
		background: var(--warn-soft);
		color: var(--warn);
		font-size: var(--text-floor);
		font-weight: 800;
		line-height: 1.4;
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
		font-size: var(--display-md);
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
	.wx-meta .hilo .lo {
		color: var(--sky);
		font-weight: 800;
	}
	.means {
		font-size: 0.86rem;
		line-height: 1.5;
		color: var(--ink);
		background: var(--sky-soft);
		border-radius: 10px;
		padding: 10px 12px;
		margin: 10px 0;
	}
	/* A stale (cached, non-live) forecast above exposed terrain is the one weather
	   state with real safety stakes — make it read categorically different from an
	   official NWS forecast instead of the same benign sky wash. */
	.means[data-caveat='cached'] {
		background: var(--warn-soft);
	}
	.means[data-caveat='cached'] .meanslab {
		color: var(--warn);
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
		background: var(--forest-soft);
		color: var(--moss);
		z-index: 1;
	}
	.node.now .dot {
		background: var(--forest);
		color: var(--on-accent);
	}
	.node.shelter .dot {
		background: var(--clay-soft);
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
	.prompt-row:disabled {
		opacity: 0.48;
		cursor: not-allowed;
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
		background: var(--bg);
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
		background: var(--bg);
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
		/* Matches the borderless .pill-warn treatment: dark amber ink on light,
		   bright warn on dark. */
		color: #8c5d1f;
		background: var(--warn-soft);
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

	/* Every accent surface above now rides a mode-aware --*-soft token, so the
	   dark theme adapts on its own. The one exception: #8c5d1f confidence ink
	   vanishes on a dark amber chip, so flip it to the bright warn ink (the same
	   move .pill-warn makes). */
	@media (prefers-color-scheme: dark) {
		.badge {
			color: var(--warn);
		}
	}
</style>
