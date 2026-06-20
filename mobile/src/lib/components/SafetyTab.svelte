<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import SourceChip from './SourceChip.svelte';
	import { toUiSourceReceipt } from './source-receipts';

	function send(status: 'safe' | 'delayed') {
		const notes = {
			safe: 'Safe and still inside the current plan.',
			delayed: 'Delaying pace and protecting recovery.'
		};

		trailAssistant.performCheckIn(status, notes[status]);
	}

	// "Need help": ALWAYS log locally, then — if a reachable contact exists — open
	// the phone's Messages app pre-filled to the circle. This only sends when there
	// is signal; it is NOT a 911/PLB/SOS service. When no contact has a number we
	// say so instead of pretending help is wired.
	let helpNote = $state('');
	function needHelp() {
		trailAssistant.performCheckIn('need-help', 'Need help — flagged from Safety.');
		const sms = trailAssistant.buildHelpSms();
		if (!sms) {
			helpNote = 'Logged on this phone. Add a contact with a phone number below so this can text someone.';
			return;
		}
		const names = sms.recipients.map((c) => c.name).join(', ');
		helpNote = trailAssistant.onlineStatus
			? `Opening a text to ${names}…`
			: `No signal detected — opening a text draft to ${names}. It will not send until your phone has service and you send it.`;
		window.location.href = sms.href;
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

	const riskLabel = $derived(
		trailAssistant.missedCheckInRisk === 'high'
			? 'High'
			: trailAssistant.missedCheckInRisk === 'medium'
				? 'Medium'
				: 'Low'
	);

	const lastCheckInAge = $derived(
		(() => {
			const minutes = Math.floor((Date.now() - new Date(trailAssistant.lastCheckIn.timestamp).getTime()) / 60000);
			if (minutes < 60) return `${minutes}m ago`;
			const hours = Math.floor(minutes / 60);
			return `${hours}h ago`;
		})()
	);

	const dueIn = $derived(
		(() => {
			const minutes = Math.floor(
				(new Date(trailAssistant.nextCheckInDueAt).getTime() - Date.now()) / 60000
			);
			if (minutes <= 0) return 'overdue';
			if (minutes < 60) return `in ${minutes}m`;
			return `in ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
		})()
	);

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
	<section class="card safety-hero" data-risk={trailAssistant.missedCheckInRisk}>
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
			<div class="risk-dial" data-risk={trailAssistant.missedCheckInRisk}>
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
			<button class="cta-button" onclick={() => send('safe')}>I am safe ✓</button>
			<button class="outline-button" onclick={() => send('delayed')}>Running late</button>
			<button class="danger-button" onclick={needHelp}>
				{trailAssistant.reachableSupportContacts.length ? 'Need help — text my circle' : 'Need help'}
			</button>
		</div>
		<p class="help-fineprint">
			“Need help” logs to this phone and {trailAssistant.reachableSupportContacts.length
				? 'opens a text to your circle'
				: 'prompts you to add a contact'} — it sends only when you have signal. This is not a 911 or
			satellite SOS. For a true emergency use your PLB / inReach.
		</p>
		{#if helpNote}<p class="help-note">{helpNote}</p>{/if}
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
			Offline check-ins stay on this phone. No contact receives them until a text, call, or later upload
			actually sends.
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
				<span>Let on-device Scout factor route position into recommendations.</span>
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
			<p>Add the people “Need help” should text. A contact needs a phone number to be reachable.</p>
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
		<p class="eyebrow">Bailout options</p>
		<h3>If today goes sideways</h3>
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
	.safety-hero {
		padding: 14px;
		display: grid;
		gap: 12px;
		background:
			radial-gradient(circle at top right, rgba(154, 59, 47, 0.1), transparent 38%),
			linear-gradient(180deg, rgba(255, 251, 248, 0.98), rgba(247, 239, 235, 0.96));
	}

	.safety-hero[data-risk='medium'] {
		background:
			radial-gradient(circle at top right, rgba(200, 167, 122, 0.22), transparent 38%),
			linear-gradient(180deg, rgba(255, 251, 248, 0.98), rgba(247, 239, 226, 0.96));
	}

	.safety-hero[data-risk='high'] {
		background:
			radial-gradient(circle at top right, rgba(154, 59, 47, 0.18), transparent 38%),
			linear-gradient(180deg, rgba(247, 230, 224, 0.6), rgba(255, 251, 248, 1));
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
		background: rgba(47, 106, 71, 0.14);
		text-align: center;
	}

	.risk-dial[data-risk='medium'] {
		background: rgba(200, 167, 122, 0.28);
	}

	.risk-dial[data-risk='high'] {
		background: rgba(154, 59, 47, 0.18);
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

	.risk-dial span {
		font-size: 0.72rem;
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
		background: rgba(47, 75, 53, 0.06);
		text-align: center;
	}

	.strip-eyebrow {
		font-size: 0.72rem;
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
		grid-template-columns: 1.2fr 1fr 1fr;
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
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: rgba(47, 75, 53, 0.1);
		color: var(--forest);
	}

	.status-pill[data-online='false'] {
		background: rgba(170, 104, 67, 0.14);
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
		background: rgba(47, 75, 53, 0.05);
		font-size: 0.84rem;
	}

	.signal-list strong {
		font-size: 0.74rem;
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
		border-top: 1px solid rgba(95, 101, 88, 0.12);
	}

	.support-row div {
		display: grid;
		gap: 2px;
	}

	.support-row div span {
		font-size: 0.78rem;
		color: var(--muted);
	}

	.method-pill {
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--sky);
		padding: 5px 10px;
		border-radius: 999px;
		background: rgba(95, 128, 144, 0.16);
	}
	.method-pill.link {
		color: #2f6a47;
		background: rgba(47, 106, 71, 0.16);
		text-decoration: none;
	}
	.method-pill.muted-pill {
		color: var(--muted);
		background: rgba(95, 101, 88, 0.12);
	}
	.support-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.remove-btn {
		width: 30px;
		height: 30px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		font-size: 1.1rem;
		line-height: 1;
		color: var(--danger);
		background: rgba(154, 59, 47, 0.1);
	}
	.add-contact {
		display: grid;
		gap: 8px;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid rgba(95, 101, 88, 0.12);
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
	.help-fineprint {
		font-size: 0.82rem;
		line-height: 1.4;
		color: var(--muted);
		margin-top: 8px;
	}
	.help-note {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--forest);
		margin-top: 6px;
	}

	.bailout-card {
		padding: 14px;
		display: grid;
		gap: 8px;
	}

	.bailout-card h3 {
		font-family: var(--font-display);
		font-size: 1.08rem;
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
		background: rgba(170, 104, 67, 0.08);
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
