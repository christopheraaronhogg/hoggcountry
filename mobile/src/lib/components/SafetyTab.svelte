<script lang="ts">
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
	import { buildEmergencyShareText, type EmergencyShareFix } from '$lib/safety';
	import { copyHandoffText, handoffText } from '$lib/text-handoff';
	import { trailAssistant } from '$lib/trailState.svelte';
	import PreparedHelpDraft from './PreparedHelpDraft.svelte';
	import SourceChip from './SourceChip.svelte';
	import { toUiSourceReceipt } from './source-receipts';

	onMount(() => minuteClock.retain());
	const nowMs = $derived(minuteClock.nowMs);
	const checkInShare = $derived(
		buildCheckInShareText({
			currentMile: trailAssistant.currentMile,
			trailName: trailAssistant.hikeProfile.trailName
		})
	);
	let checkInNote = $state('');
	let safeShareBusy = $state(false);

	function send(status: 'safe' | 'delayed') {
		const notes = {
			safe: 'Safe and still inside the current plan.',
			delayed: 'Delaying pace and protecting recovery.'
		};

		trailAssistant.performCheckIn(status, notes[status]);
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

	// "Need help" always logs locally, then prepares an explicit platform share or
	// clipboard handoff. It never claims delivery and is not a 911/PLB/SOS service.
	let helpNote = $state('');
	let helpPreparedText = $state('');
	let helpShareBusy = $state(false);
	let emergencyPrepareBusy = $state(false);
	let emergencyHandoffAction = $state<'share' | 'copy' | null>(null);
	let emergencyCheckInLogged = $state(false);
	let emergencyPreparedText = $state('');
	let emergencyShareNote = $state('');
	async function needHelp() {
		if (helpShareBusy) return;
		helpShareBusy = true;
		try {
			let text = helpPreparedText;
			if (!text) {
				const request = trailAssistant.requestHelp('Safety');
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

	async function prepareEmergencyLocation() {
		if (emergencyPrepareBusy || emergencyHandoffAction) return;
		emergencyPrepareBusy = true;
		emergencyShareNote = 'Getting one GPS fix (up to 9 seconds)…';

		try {
			if (!emergencyCheckInLogged) {
				trailAssistant.performCheckIn(
					'need-help',
					'Emergency share prepared from Safety; Scout cannot confirm delivery.'
				);
				emergencyCheckInLogged = true;
			}
			let fix: EmergencyShareFix | null = null;
			try {
				fix = await trailAssistant.getEmergencyShareFix();
			} catch {
				// A useful draft still includes its preparation time and last saved mile.
			}
			if (!fix && emergencyPreparedText) {
				emergencyShareNote =
					'No new GPS fix was available. Your previous time-stamped draft remains below.';
				return;
			}
			const share = buildEmergencyShareText({
				currentMile: trailAssistant.currentMile,
				trailName: trailAssistant.hikeProfile.trailName,
				preparedAt: new Date(),
				fix
			});
			emergencyPreparedText = share.text;
			emergencyShareNote = share.usedCoordinates
				? 'Emergency details are ready with a GPS fix. Review them, then choose Share or Copy.'
				: 'Emergency details are ready without a GPS fix. They still include the last saved trail mile; review them before sharing.';
		} catch {
			emergencyShareNote = emergencyPreparedText
				? 'The GPS refresh failed. Your previous prepared draft remains below.'
				: emergencyCheckInLogged
					? 'The need-help check-in was logged, but emergency details could not be prepared. Use text, call, 911, or your emergency device directly.'
					: 'The need-help check-in and location draft could not be prepared. Nothing was sent. Use text, call, 911, or your emergency device directly.';
		} finally {
			emergencyPrepareBusy = false;
		}
	}

	async function sharePreparedEmergency() {
		if (!emergencyPreparedText || emergencyHandoffAction) return;
		emergencyHandoffAction = 'share';
		try {
			const outcome = await handoffText({
				title: 'Emergency location',
				text: emergencyPreparedText
			});
			if (outcome === 'share-handoff-complete') {
				emergencyShareNote =
					'Returned from the share chooser. Scout cannot confirm anything was sent; verify with the person or emergency service.';
			} else if (outcome === 'copied') {
				emergencyShareNote =
					'Emergency details copied. Paste them into a message and send it yourself; Scout cannot confirm delivery.';
			} else if (outcome === 'cancelled-or-no-target') {
				emergencyShareNote =
					'Share did not complete or no target was available. The need-help check-in remains logged, and the draft remains below.';
			} else {
				emergencyShareNote =
					'Sharing and automatic copy are unavailable. The prepared draft remains below for manual selection.';
			}
		} finally {
			emergencyHandoffAction = null;
		}
	}

	async function copyPreparedEmergency() {
		if (!emergencyPreparedText || emergencyHandoffAction) return;
		emergencyHandoffAction = 'copy';
		try {
			const outcome = await copyHandoffText({
				title: 'Emergency location',
				text: emergencyPreparedText
			});
			emergencyShareNote =
				outcome === 'copied'
					? 'Emergency details copied. Paste them into a message and send it yourself.'
					: 'Copy is unavailable. The prepared draft remains below for manual selection.';
		} finally {
			emergencyHandoffAction = null;
		}
	}

	// Add-contact form (the missing editor — Support Circle was read-only and empty).
	let newName = $state('');
	let newPhone = $state('');
	let newRole = $state('');
	function addContact() {
		if (!newName.trim()) return;
		trailAssistant.addSupportContact({
			name: newName,
			role: newRole,
			method: newPhone.trim() ? 'Text / call' : 'Reference',
			phone: newPhone
		});
		newName = '';
		newPhone = '';
		newRole = '';
	}

	const currentRisk = $derived.by(() => {
		void nowMs;
		return trailAssistant.missedCheckInRisk;
	});
	const riskLabel = $derived(
		currentRisk === 'high'
			? 'High'
			: currentRisk === 'medium'
				? 'Medium'
				: 'Low'
	);

	const lastCheckInAge = $derived(formatAge(trailAssistant.lastCheckIn.timestamp, nowMs));
	const dueIn = $derived(formatTimeUntil(trailAssistant.nextCheckInDueAt, nowMs));

	// Bailout options derived from the loaded field pack (nearest town + shelter
	// ahead) — not a hardcoded list. Empty when the pack window has none.
	const bailouts = $derived.by(() => {
		const from = trailAssistant.currentMile;
		const pack = trailAssistant.fieldPack;
		const ahead = <T extends { mile: number; name: string }>(items: T[]) =>
			items.filter((i) => i.mile >= from - 0.01).sort((a, b) => a.mile - b.mile)[0];
		const out: Array<{ name: string; detail: string }> = [];
		const town = ahead(pack.towns);
		if (town) out.push({ name: town.name, detail: `town candidate, ${(town.mile - from).toFixed(1)} mi ahead — verify services before relying on them` });
		const shelter = ahead(pack.shelters);
		if (shelter) out.push({ name: shelter.name, detail: `shelter candidate, ${(shelter.mile - from).toFixed(1)} mi ahead` });
		return out;
	});
	const bailoutSourceChips = $derived.by(() =>
		(trailAssistant.fieldPack.sourceReceipts ?? [])
			.filter((receipt) => receipt.kind === 'trail-pack' || receipt.kind === 'derived' || receipt.kind === 'official')
			.slice(0, 2)
			.map((receipt) => toUiSourceReceipt(receipt))
	);
</script>

<div class="section-stack">
	<section class="card safety-hero" data-risk={currentRisk}>
		<div class="hero-head">
			<div>
				<p class="eyebrow">Safety · Check-in window</p>
				<h2>Logged on this phone</h2>
				<p class="hero-detail">
					{#if trailAssistant.hasCheckedIn}
						Last check-in {lastCheckInAge} at {trailAssistant.lastCheckIn.location}
					{:else}
						No check-in logged yet — tap "I am safe" to start your log
					{/if}
				</p>
			</div>
			<div class="risk-dial" data-risk={currentRisk}>
				<strong>{riskLabel}</strong>
				<span>risk</span>
			</div>
		</div>

		<div class="safety-strip">
			<div>
				<span class="strip-eyebrow">Next check-in</span>
				<strong>{dueIn}</strong>
			</div>
			<div>
				<span class="strip-eyebrow">Connection</span>
				<strong>{trailAssistant.onlineStatus ? 'Cell/Wi-Fi usable' : 'Offline · local only'}</strong>
			</div>
			<div>
				<span class="strip-eyebrow">Mile</span>
				<strong class="tabular">{trailAssistant.currentMile.toFixed(1)}</strong>
			</div>
		</div>

		<div class="checkin-actions">
			<button class="cta-button" onclick={() => send('safe')}>I’m safe ✓</button>
			<button class="outline-button" onclick={() => send('delayed')}>Running late</button>
			<button class="outline-button" type="button" disabled={safeShareBusy} onclick={shareSafeUpdate}>
				{safeShareBusy ? 'Opening share…' : 'Share safe update'}
			</button>
			<button class="danger-button" type="button" disabled={helpShareBusy} onclick={needHelp}>
				{helpShareBusy
					? 'Opening share…'
					: helpPreparedText
						? 'Share help details again'
						: 'Need help — share details'}
			</button>
		</div>
		<p class="checkin-fineprint">{SAFE_CHECK_IN_DISCLOSURE}</p>
		{#if checkInNote}<p class="checkin-note">{checkInNote}</p>{/if}
		<p class="help-fineprint">
			“Need help” logs to this phone and prepares details for an explicit share. Scout cannot send or
			confirm delivery. This is not a 911 or
			satellite SOS. For a true emergency use your PLB / inReach.
		</p>
		{#if helpNote}<p class="help-note">{helpNote}</p>{/if}
		{#if helpPreparedText}
			<PreparedHelpDraft
				text={helpPreparedText}
				newRequestBusy={helpShareBusy}
				onStartNew={startNewHelpRequest}
			/>
		{/if}
		<div class="emergency-share">
			{#if !emergencyPreparedText}
				<button
					class="outline-button emergency-share-button"
					type="button"
					disabled={emergencyPrepareBusy}
					aria-describedby="emergency-share-copy"
					onclick={() => void prepareEmergencyLocation()}
				>
					{emergencyPrepareBusy ? 'Getting GPS…' : 'Prepare emergency share'}
				</button>
			{/if}
			<p id="emergency-share-copy" class="emergency-share-copy">
				First logs a need-help check-in and requests one foreground GPS fix without enabling tracking.
				Review the resulting draft, then explicitly Share or Copy it. Scout cannot confirm anything was
				sent and is not 911, inReach, or PLB.
			</p>
			{#if emergencyPreparedText}
				<div class="emergency-share-draft">
					<strong>Prepared details — review before sharing</strong>
					<pre>{emergencyPreparedText}</pre>
				</div>
				<div class="emergency-share-actions">
					<button
						class="outline-button emergency-share-button"
						type="button"
						disabled={emergencyHandoffAction !== null}
						onclick={() => void sharePreparedEmergency()}
					>
						{emergencyHandoffAction === 'share' ? 'Opening share…' : 'Share prepared details'}
					</button>
					<button
						class="outline-button"
						type="button"
						disabled={emergencyHandoffAction !== null}
						onclick={() => void copyPreparedEmergency()}
					>
						{emergencyHandoffAction === 'copy' ? 'Copying…' : 'Copy prepared details'}
					</button>
				</div>
				<button
					class="outline-button"
					type="button"
					disabled={emergencyPrepareBusy || emergencyHandoffAction !== null}
					onclick={() => void prepareEmergencyLocation()}
				>
					{emergencyPrepareBusy ? 'Refreshing GPS…' : 'Refresh GPS & draft'}
				</button>
			{/if}
			{#if emergencyShareNote}
				<p class="emergency-share-note" role="status">{emergencyShareNote}</p>
			{/if}
		</div>
	</section>

	<section class="card low-signal-card">
		<div class="card-head">
			<div>
				<p class="eyebrow">Low-signal mode</p>
				<h3>What still works without bars</h3>
			</div>
			<span class="status-pill" data-online={trailAssistant.onlineStatus}>
				{trailAssistant.onlineStatus ? 'Standby' : 'Active'}
			</span>
		</div>
		<ul class="signal-list">
			<li><span>Local Scout answers</span><strong>{trailAssistant.modelStatus?.state === 'ready' ? 'Available' : 'Needs model download'}</strong></li>
			<li><span>Field guide + mileposts</span><strong>Available</strong></li>
			<li><span>Check-in log</span><strong>Stored locally</strong></li>
			<li><span>Weather context</span><strong>{trailAssistant.fieldPack.weather ? 'Cached field pack' : 'Needs refresh'}</strong></li>
		</ul>
		<p class="offline-note">
			Offline check-ins stay on this phone and queue for account backup. Family receives nothing unless
			you separately send a text or make a call.
		</p>
	</section>

	<section class="card">
		<div class="section-heading">
			<p class="eyebrow">Privacy</p>
			<h2>On-device controls</h2>
			<p>Nothing here publishes a live location or sends a check-in automatically.</p>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Stealth mode</strong>
				<span>Hide exact movement from public views.</span>
			</div>
			<button
				class:on={trailAssistant.privacySettings.stealthMode}
				class="toggle"
				role="switch"
				aria-checked={trailAssistant.privacySettings.stealthMode}
				aria-label="Stealth mode"
				onclick={() => trailAssistant.updatePrivacy({ stealthMode: !trailAssistant.privacySettings.stealthMode })}
			></button>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Trail-mile reports</strong>
				<span>
					Use GPS to attach an approximate trail mile to condition reports; if Auto-log mileage is on,
					the same permission can update your mile.
				</span>
			</div>
			<button
				class:on={trailAssistant.privacySettings.sharePreciseLocation}
				class="toggle"
				role="switch"
				aria-checked={trailAssistant.privacySettings.sharePreciseLocation}
				aria-label="Trail-mile reports"
				onclick={() =>
					trailAssistant.updatePrivacy({
						sharePreciseLocation: !trailAssistant.privacySettings.sharePreciseLocation
					})}
			></button>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Scout route context</strong>
				<span>Let Scout factor route position into recommendations.</span>
			</div>
			<button
				class:on={trailAssistant.privacySettings.allowCoachInsights}
				class="toggle"
				role="switch"
				aria-checked={trailAssistant.privacySettings.allowCoachInsights}
				aria-label="Scout route context"
				onclick={() =>
					trailAssistant.updatePrivacy({
						allowCoachInsights: !trailAssistant.privacySettings.allowCoachInsights
					})}
			></button>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Support notes</strong>
				<span>Keep support contacts in the app as a local reference.</span>
			</div>
			<button
				class:on={trailAssistant.privacySettings.visibleToSupportCircle}
				class="toggle"
				role="switch"
				aria-checked={trailAssistant.privacySettings.visibleToSupportCircle}
				aria-label="Support notes"
				onclick={() =>
					trailAssistant.updatePrivacy({
						visibleToSupportCircle: !trailAssistant.privacySettings.visibleToSupportCircle
					})}
			></button>
		</div>
	</section>

	<section class="card">
		<div class="section-heading">
			<p class="eyebrow">Support circle</p>
			<h2>Who to contact</h2>
			<p>Add the people you may contact for help. A usable phone number makes a contact reachable.</p>
		</div>

		<div class="stack-tight">
			{#each trailAssistant.supportCircle as contact (contact.name)}
				<div class="support-row">
					<div>
						<strong>{contact.name}</strong>
						<span>{contact.role}{contact.phone ? ` · ${contact.phone}` : ' · no number'}</span>
					</div>
					<div class="support-actions">
						{#if contact.phone}
							<a class="method-pill link" href={`sms:${contact.phone.replace(/[^+\d]/g, '')}`}>Text</a>
						{:else}
							<span class="method-pill muted-pill">Reference</span>
						{/if}
						<button
							class="remove-btn"
							type="button"
							aria-label={`Remove ${contact.name}`}
							onclick={() => trailAssistant.removeSupportContact(contact.name)}>×</button
						>
					</div>
				</div>
			{:else}
				<p class="support-empty">No contacts yet. Add the people who should be alerted if you miss a check-in window.</p>
			{/each}
		</div>

		<div class="add-contact">
			<input type="text" bind:value={newName} placeholder="Name" autocomplete="off" aria-label="Contact name" />
			<input type="tel" bind:value={newPhone} placeholder="Phone (for texting)" autocomplete="off" aria-label="Contact phone" />
			<input type="text" bind:value={newRole} placeholder="Role (e.g. Wife, Brother)" autocomplete="off" aria-label="Contact role" />
			<button class="secondary-button" type="button" onclick={addContact} disabled={!newName.trim()}>Add contact</button>
		</div>
	</section>

	<section class="card bailout-card">
		<div class="section-heading">
			<p class="eyebrow">Bailout options</p>
			<h2>If today goes sideways</h2>
		</div>
		<ul>
			{#each bailouts as b (b.name)}
				<li><strong>{b.name}</strong> · {b.detail}</li>
			{:else}
				<li>No mapped bailout options in the loaded pack window — confirm options from your guide.</li>
			{/each}
		</ul>
		<div class="bailout-sources">
			{#each bailoutSourceChips as receipt (receipt.id)}
				<SourceChip source={receipt} />
			{/each}
		</div>
	</section>
</div>

<style>
	/* Every section card gets consistent inner padding — the bare Privacy and
	   Support-circle cards were rendering their text flush to the edge. */
	.section-stack .card {
		padding: 14px;
	}

	/* Risk drives the hero tint on tokens, so every state stays legible in dark.
	   (The old high-risk skin was a near-white block at night — the exact opposite
	   of the alarm a hiker reading "HIGH risk" needs.) */
	.safety-hero {
		padding: 14px;
		display: grid;
		gap: 12px;
		background:
			radial-gradient(circle at top right, var(--forest-soft), transparent 40%),
			var(--surface-strong);
	}

	.safety-hero[data-risk='medium'] {
		background:
			radial-gradient(circle at top right, var(--warn-soft), transparent 40%),
			var(--surface-strong);
	}

	.safety-hero[data-risk='high'] {
		background:
			radial-gradient(circle at top right, var(--danger-soft), transparent 38%),
			var(--surface-strong);
		border-color: var(--danger);
	}

	.hero-head {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		align-items: flex-start;
	}

	.hero-head h2 {
		font-family: var(--font-display);
		font-size: 1.32rem;
		margin: 2px 0;
	}

	.hero-detail {
		font-size: 0.82rem;
		color: var(--muted);
	}

	.risk-dial {
		display: grid;
		justify-items: center;
		gap: 0;
		padding: 8px 14px;
		border-radius: 12px;
		background: var(--forest-soft);
		text-align: center;
	}

	.risk-dial[data-risk='medium'] {
		background: var(--warn-soft);
	}

	.risk-dial[data-risk='high'] {
		background: var(--danger-soft);
	}

	.risk-dial strong {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 800;
		color: var(--success);
		line-height: 1;
	}

	.risk-dial[data-risk='medium'] strong {
		color: #8c5d1f;
	}
	.risk-dial[data-risk='high'] strong {
		color: var(--danger);
	}

	@media (prefers-color-scheme: dark) {
		/* #8c5d1f vanishes on a dark dial — flip the medium label to the bright warn ink. */
		.risk-dial[data-risk='medium'] strong {
			color: var(--warn);
		}
	}

	.risk-dial span {
		font-size: var(--text-floor);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--muted);
		margin-top: 2px;
	}

	.safety-strip {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}

	.safety-strip div {
		display: grid;
		gap: 2px;
		padding: 10px 8px;
		border-radius: 12px;
		background: var(--forest-soft);
		text-align: center;
	}

	.strip-eyebrow {
		font-size: var(--text-floor);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}

	.safety-strip strong {
		font-size: 0.92rem;
		font-weight: 800;
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}

	.checkin-actions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
	}

	.low-signal-card {
		padding: 14px;
		display: grid;
		gap: 10px;
	}

	.card-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 12px;
	}

	.card-head h3 {
		font-family: var(--font-display);
		font-size: 1.08rem;
	}

	.status-pill {
		padding: 5px 10px;
		border-radius: 999px;
		font-size: var(--text-floor);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: var(--forest-soft);
		color: var(--forest);
	}

	.status-pill[data-online='false'] {
		background: var(--clay-soft);
		color: var(--clay);
	}

	.signal-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 6px;
	}

	.signal-list li {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		padding: 8px 10px;
		border-radius: 10px;
		background: var(--forest-soft);
		font-size: 0.84rem;
	}

	.signal-list strong {
		font-size: var(--text-floor);
		font-weight: 800;
		color: var(--forest);
	}

	.offline-note {
		margin: 8px 2px 0;
		font-size: 0.82rem;
		line-height: 1.4;
		color: var(--muted);
		font-weight: 700;
	}

	.support-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 0;
	}

	.support-row + .support-row {
		border-top: 1px solid var(--divider-soft);
	}

	.support-row div {
		display: grid;
		gap: 2px;
	}

	.support-row div span {
		font-size: var(--text-floor);
		color: var(--muted);
	}

	.method-pill {
		font-size: var(--text-floor);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--sky);
		padding: 5px 10px;
		border-radius: 999px;
		background: var(--sky-soft);
	}
	.method-pill.link {
		color: var(--success);
		background: var(--success-soft);
		text-decoration: none;
	}
	.method-pill.muted-pill {
		color: var(--muted);
		background: var(--ink-soft);
	}
	.support-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.remove-btn {
		width: 44px;
		height: 44px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		font-size: 1.1rem;
		line-height: 1;
		color: var(--danger);
		background: var(--danger-soft);
	}
	.add-contact {
		display: grid;
		gap: 8px;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--divider-soft);
	}
	.add-contact input {
		width: 100%;
		min-height: 44px;
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--line);
		background: var(--surface-strong);
		color: var(--ink);
		font-size: 0.95rem;
	}
	.checkin-fineprint,
	.help-fineprint {
		font-size: 0.82rem;
		line-height: 1.4;
		color: var(--muted);
		margin-top: 8px;
	}
	.checkin-fineprint {
		font-weight: 700;
		color: var(--ink);
	}
	.checkin-note {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--success);
		margin-top: 6px;
	}
	.help-note {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--forest);
		margin-top: 6px;
	}
	.emergency-share {
		display: grid;
		gap: 6px;
		padding-top: 12px;
		border-top: 1px solid var(--divider-soft);
	}
	.emergency-share-button {
		width: 100%;
		border-color: var(--danger);
		color: var(--danger);
	}
	.emergency-share-copy,
	.emergency-share-note {
		font-size: 0.82rem;
		line-height: 1.4;
		margin: 0;
	}
	.emergency-share-copy {
		color: var(--muted);
	}
	.emergency-share-draft {
		display: grid;
		gap: 6px;
		min-width: 0;
		padding: 10px;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--surface);
	}
	.emergency-share-draft strong {
		font-size: var(--text-floor);
		color: var(--forest);
	}
	.emergency-share-draft pre {
		max-width: 100%;
		margin: 0;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		font: inherit;
		font-size: var(--text-floor);
		line-height: 1.45;
		color: var(--text);
		user-select: text;
	}
	.emergency-share-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.emergency-share-note {
		font-weight: 700;
		color: var(--forest);
	}

	.bailout-card {
		padding: 14px;
		display: grid;
		gap: 8px;
	}

	.bailout-card ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 6px;
		font-size: 0.86rem;
	}

	.bailout-card li {
		padding: 8px 10px;
		border-radius: 10px;
		background: var(--clay-soft);
		color: var(--ink);
	}

	.bailout-card li strong {
		color: var(--clay);
		margin-right: 6px;
	}

	.bailout-sources {
		padding-top: 4px;
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
</style>
