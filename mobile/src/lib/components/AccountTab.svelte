<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import { isSelfTracked, TOTAL_AT_MILES } from '$lib/scout/hike-profile';
	import type { MileSource } from '$lib/scout/hike-profile';
	import PackStatus from './PackStatus.svelte';
	import OfflineStatus from './OfflineStatus.svelte';
	import SourceChip from './SourceChip.svelte';
	import { sourceReceipts } from './fieldData';

	function fmtBytes(n: number | undefined): string {
		if (!n || n < 0) return '—';
		const gb = n / 1e9;
		return gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.round(n / 1e6)} MB`;
	}

	// --- "My hike" identity + position --------------------------------------
	// Once the user calibrates, the profile is the source of truth — never Dad's
	// pilot pack. Following Dad is its own honest mode, labeled as such.
	const profile = $derived(trailAssistant.hikeProfile);
	const selfTracked = $derived(isSelfTracked(profile));
	const displayName = $derived(
		selfTracked ? profile.trailName?.trim() || 'My hike' : trailAssistant.fieldPack.hiker.trailName ?? 'Hogg'
	);
	const avatarInitials = $derived(
		displayName
			.split(/\s+/)
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase() || 'HC'
	);
	const startYear = $derived(profile.startDate ? profile.startDate.slice(0, 4) : '2026');
	const profileEyebrow = $derived(
		selfTracked ? `Hiker · ${profile.direction} ${startYear}` : `Following Dad · ${trailAssistant.fieldPack.hiker.direction} 2026`
	);
	const mileSourceLabel: Record<MileSource, string> = {
		onboarding: 'set when you started',
		'check-in': 'from your last check-in',
		gps: 'snapped from GPS',
		pilot: "following Dad's pilot pack"
	};

	let gpsBusy = $state(false);
	let gpsMessage = $state<string | null>(null);
	let gpsOk = $state(false);
	async function snapGps() {
		gpsBusy = true;
		gpsMessage = null;
		const result = await trailAssistant.useGpsForMile();
		gpsOk = result.ok;
		gpsMessage = result.ok ? `Updated to mile ${result.mile?.toFixed(1)}.` : result.reason ?? 'Could not update from GPS.';
		gpsBusy = false;
	}

	// number|null: `bind:value` on a number input yields a number (or null when
	// empty), so keep the draft numeric rather than a string.
	let mileDraft = $state<number | null>(null);
	const mileDraftValid = $derived(
		mileDraft !== null && Number.isFinite(mileDraft) && mileDraft >= 0 && mileDraft <= TOTAL_AT_MILES
	);
	async function setMileFromInput() {
		if (!mileDraftValid) return;
		await trailAssistant.updateCurrentMile(mileDraft as number, 'check-in');
		mileDraft = null;
		gpsMessage = null;
	}

	const model = $derived(trailAssistant.modelStatus);
	const dl = $derived(trailAssistant.modelDownload);
	const runtimeUnavailable = $derived(model?.runtimeConfigured === false);
	const pct = $derived(
		dl && dl.totalBytes > 0
			? Math.min(100, Math.round((dl.bytesDownloaded / dl.totalBytes) * 100))
			: null
	);
	const canDownload = $derived(
		!!model &&
			model.downloadConfigured &&
			(model.state === 'needs_download' || model.state === 'present_unverified')
	);
	const fieldPack = $derived(trailAssistant.fieldPack);
	const fieldPackStatus = $derived(trailAssistant.fieldPackStatus);
	const fieldPackMiles = $derived(Math.max(0, fieldPack.frame.endMile - fieldPack.frame.startMile));
	const fieldPackRegion = $derived(fieldPack.downloadedRegions[0] ?? trailAssistant.trailSettings.offlineRegion);
	const fieldPackLoaded = $derived(
		fieldPackStatus.lastLoadedAt
			? new Date(fieldPackStatus.lastLoadedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
			: 'bundled'
	);
</script>

<div class="section-stack">
	<section class="card profile-card">
		<div class="profile-top">
			<div class="avatar">{avatarInitials}</div>
			<div class="profile-copy">
				<p class="eyebrow">{profileEyebrow}</p>
				<h2>{displayName}</h2>
				<p>Day {trailAssistant.dayNumber} · Mile {trailAssistant.currentMile.toFixed(1)}</p>
			</div>
		</div>

		<div class="profile-stats">
			<div>
				<span class="num tabular">{trailAssistant.dayNumber}</span>
				<small>days on trail</small>
			</div>
			<div>
				<span class="num tabular">{trailAssistant.currentMile.toFixed(0)}</span>
				<small>miles done</small>
			</div>
			<div>
				<span class="num tabular">{(2197.4 - trailAssistant.currentMile).toFixed(0)}</span>
				<small>to Katahdin</small>
			</div>
		</div>
	</section>

	<section class="card hike-card">
		<div class="section-heading">
			<p class="eyebrow">My hike</p>
			<h2>Where you are</h2>
			<p>
				Scout keys everything — water, shelters, towns, the day — off this mile. It stays yours; a
				field-pack refresh never moves it. Keep it honest with a check-in or a GPS snap.
			</p>
		</div>

		<div class="mile-now">
			<div class="mile-figure tabular">{trailAssistant.currentMile.toFixed(1)}<span>mi</span></div>
			<div class="mile-meta">
				<span class="mile-src">{mileSourceLabel[profile.mileSource]}</span>
				<span class="mile-dir">{profile.direction} · {(TOTAL_AT_MILES - trailAssistant.currentMile).toFixed(0)} mi to go</span>
			</div>
		</div>

		<div class="mile-set">
			<input
				type="number"
				inputmode="decimal"
				bind:value={mileDraft}
				placeholder="I'm at mile…"
				min="0"
				max={TOTAL_AT_MILES}
				step="0.1"
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						setMileFromInput();
					}
				}}
			/>
			<button class="cta-button compact" onclick={setMileFromInput} disabled={!mileDraftValid}>Set mile</button>
		</div>

		<div class="mile-actions">
			<button class="outline-button compact" onclick={snapGps} disabled={gpsBusy}>
				{gpsBusy ? 'Locating…' : '📍 Update from GPS'}
			</button>
			<button class="outline-button compact" onclick={() => trailAssistant.openHikeSetup()}>Edit hike details</button>
		</div>

		{#if gpsMessage}
			<p class="mile-feedback" class:ok={gpsOk} class:warn={!gpsOk}>{gpsMessage}</p>
		{/if}
		{#if !selfTracked}
			<p class="mile-feedback note">
				You're following Dad's 2026 hike. Setting a mile or GPS snap switches Scout to your own hike.
			</p>
		{/if}
	</section>

	<section class="card pack-card">
		<PackStatus />
	</section>

	<section class="card offline-section">
		<OfflineStatus />
	</section>

	{#if trailAssistant.supportsOnDeviceModel}
		<section class="card model-card">
			<div class="section-heading">
				<p class="eyebrow">On-device AI · Gemma 4</p>
				<h2>Offline brain</h2>
				<p>
					Scout's chat runs on a Gemma 4 model stored on your phone. Download it once on Wi-Fi and
					Scout answers keep working with no signal. The download continues in the background — you
					can leave this screen or lock your phone.
				</p>
			</div>

			{#if dl}
				<div class="model-progress">
					<div class="bar"><div class="fill" style="width:{pct ?? 0}%"></div></div>
					<div class="model-row">
						<span>{pct !== null ? `${pct}%` : 'Downloading…'}</span>
						<span class="tabular">{fmtBytes(dl.bytesDownloaded)} / {fmtBytes(dl.totalBytes)}</span>
					</div>
					<button class="outline-button compact" onclick={() => trailAssistant.cancelModelDownload()}>
						Cancel download
					</button>
				</div>
			{:else if runtimeUnavailable}
				<p class="model-note">
					This iOS build can manage the model file, but the LiteRT-LM runtime is not linked yet.
					Install a runtime-enabled build before testing on-device Scout answers.
				</p>
			{:else if model?.state === 'ready'}
				<p class="model-ready">✓ Installed and verified — Scout works fully offline.</p>
			{:else if trailAssistant.meteredDownloadPrompt}
				<div class="metered-warn">
					<p>
						You're on {trailAssistant.meteredDownloadPrompt.type === 'cellular'
							? 'cellular'
							: 'a metered connection'} — this model is ≈ {fmtBytes(model?.expectedBytes)}. Downloading
						now may use your mobile data.
					</p>
					<div class="metered-actions">
						<button
							class="outline-button compact"
							onclick={() => trailAssistant.dismissMeteredPrompt()}
						>
							Wait for Wi-Fi
						</button>
						<button
							class="cta-button compact"
							onclick={() => trailAssistant.downloadModel({ allowMetered: true })}
						>
							Download anyway
						</button>
					</div>
				</div>
			{:else if canDownload}
				<div class="model-row">
					<span>Model size ≈ {fmtBytes(model?.expectedBytes)}</span>
					<button class="cta-button compact" onclick={() => trailAssistant.downloadModel()}>
						Download model
					</button>
				</div>
			{:else}
				<p class="model-note">
					The on-device model isn't configured in this build yet. Scout uses its offline field-pack
					answers until the model is available.
				</p>
			{/if}

			{#if trailAssistant.modelError}
				<p class="model-error">{trailAssistant.modelError}</p>
			{/if}
		</section>
	{/if}

	<section class="card">
		<div class="section-heading">
			<p class="eyebrow">Trail log automation</p>
			<h2>What Scout writes for you</h2>
			<p>These toggles decide how much of the daily summary Scout drafts from your route, check-ins, and field reports.</p>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Auto-log mileage</strong>
				<span>
					{trailAssistant.autoGpsActive
						? 'Precise location is watching for trail-mile changes.'
						: 'Updates from check-ins; turns on GPS only when Precise location is enabled.'}
				</span>
			</div>
			<button
				class:on={trailAssistant.trailSettings.autoLogMileage}
				class="toggle"
				role="switch"
				aria-checked={trailAssistant.trailSettings.autoLogMileage}
				aria-label="Auto-log mileage"
				onclick={() =>
					trailAssistant.updateTrailSetting(
						'autoLogMileage',
						!trailAssistant.trailSettings.autoLogMileage
					)}
			></button>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Water alerts</strong>
				<span>Highlight reliable sources before dry ridges.</span>
			</div>
			<button
				class:on={trailAssistant.trailSettings.waterAlerts}
				class="toggle"
				role="switch"
				aria-checked={trailAssistant.trailSettings.waterAlerts}
				aria-label="Water alerts"
				onclick={() =>
					trailAssistant.updateTrailSetting(
						'waterAlerts',
						!trailAssistant.trailSettings.waterAlerts
					)}
			></button>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Battery saver</strong>
				<span>Reduce sync behavior to protect charge on long days.</span>
			</div>
			<button
				class:on={trailAssistant.trailSettings.batterySaver}
				class="toggle"
				role="switch"
				aria-checked={trailAssistant.trailSettings.batterySaver}
				aria-label="Battery saver"
				onclick={() =>
					trailAssistant.updateTrailSetting(
						'batterySaver',
						!trailAssistant.trailSettings.batterySaver
					)}
			></button>
		</div>

		<div class="toggle-row">
			<div class="toggle-copy">
				<strong>Low-signal mode</strong>
				<span>Prefer the on-device model and queue everything else.</span>
			</div>
			<button
				class:on={trailAssistant.trailSettings.lowSignalMode}
				class="toggle"
				role="switch"
				aria-checked={trailAssistant.trailSettings.lowSignalMode}
				aria-label="Low-signal mode"
				onclick={() =>
					trailAssistant.updateTrailSetting(
						'lowSignalMode',
						!trailAssistant.trailSettings.lowSignalMode
					)}
			></button>
		</div>
	</section>

	<section class="card">
		<div class="section-heading">
			<p class="eyebrow">Daily habits</p>
			<h2>End-of-day log</h2>
			<p>Tick these off so your trail journal reflects the real day, not just the mileage. Skipping them quietly is how a hard day hides.</p>
		</div>

		<div class="habit-grid">
			<div class="toggle-row habit-row">
				<div class="toggle-copy">
					<strong>Foot care</strong>
					<span>Tape, drain, dry, reset.</span>
				</div>
				<button
					class:on={trailAssistant.trailLogSettings.footCareLogged}
					class="toggle"
					role="switch"
					aria-checked={trailAssistant.trailLogSettings.footCareLogged}
					aria-label="Foot care logged"
					onclick={() =>
						trailAssistant.updateTrailLogSetting(
							'footCareLogged',
							!trailAssistant.trailLogSettings.footCareLogged
						)}
				></button>
			</div>

			<div class="toggle-row habit-row">
				<div class="toggle-copy">
					<strong>Calories</strong>
					<span>Enough fuel in for tomorrow.</span>
				</div>
				<button
					class:on={trailAssistant.trailLogSettings.caloriesLogged}
					class="toggle"
					role="switch"
					aria-checked={trailAssistant.trailLogSettings.caloriesLogged}
					aria-label="Calories logged"
					onclick={() =>
						trailAssistant.updateTrailLogSetting(
							'caloriesLogged',
							!trailAssistant.trailLogSettings.caloriesLogged
						)}
				></button>
			</div>

			<div class="toggle-row habit-row">
				<div class="toggle-copy">
					<strong>Water carry</strong>
					<span>Topped off before dry sections.</span>
				</div>
				<button
					class:on={trailAssistant.trailLogSettings.waterCarryChecked}
					class="toggle"
					role="switch"
					aria-checked={trailAssistant.trailLogSettings.waterCarryChecked}
					aria-label="Water carry checked"
					onclick={() =>
						trailAssistant.updateTrailLogSetting(
							'waterCarryChecked',
							!trailAssistant.trailLogSettings.waterCarryChecked
						)}
				></button>
			</div>

			<div class="toggle-row habit-row">
				<div class="toggle-copy">
					<strong>Stretching</strong>
					<span>Hip flexors + calves.</span>
				</div>
				<button
					class:on={trailAssistant.trailLogSettings.stretchingDone}
					class="toggle"
					role="switch"
					aria-checked={trailAssistant.trailLogSettings.stretchingDone}
					aria-label="Stretching done"
					onclick={() =>
						trailAssistant.updateTrailLogSetting(
							'stretchingDone',
							!trailAssistant.trailLogSettings.stretchingDone
						)}
				></button>
			</div>
		</div>
	</section>

	<section class="card region-card">
		<p class="eyebrow">Offline readiness</p>
		<h3>{fieldPackRegion}</h3>
		<p>
			{fieldPackStatus.label}. Covers miles {fieldPack.frame.startMile.toFixed(1)}-{fieldPack.frame.endMile.toFixed(1)}
			({fieldPackMiles.toFixed(0)} mi) from the {fieldPackStatus.source} pack, loaded {fieldPackLoaded}.
		</p>
		<div class="region-meta">
			<span>{fieldPack.downloadedRegions.length} {fieldPack.downloadedRegions.length === 1 ? 'region' : 'regions'} cached</span>
			<span>{model?.state === 'ready' ? `${fmtBytes(model.expectedBytes)} model on device` : 'Model not downloaded'}</span>
		</div>
	</section>

	<section class="card data-card">
		<div class="section-heading">
			<p class="eyebrow">Data sources</p>
			<h2>What Scout reads from</h2>
			<p>Scout always cites its sources. Tap any to verify or open the source page when online.</p>
		</div>
		<div class="data-grid">
			{#each Object.values(sourceReceipts) as receipt (receipt.id)}
				<SourceChip source={receipt} />
			{/each}
		</div>
	</section>

	<section class="legal-card">
		<p>Hogg Country · Privacy and data use are governed by the privacy policy and on-device controls.</p>
		<div class="legal-links">
			<a class="legal-link" href="https://hoggcountry.com/privacy" target="_blank" rel="noopener">Privacy</a>
			<span>·</span>
			<a class="legal-link" href="https://hoggcountry.com/terms" target="_blank" rel="noopener">Terms</a>
			<span>·</span>
			<a class="legal-link" href="https://hoggcountry.com/data" target="_blank" rel="noopener">Source policy</a>
		</div>
	</section>
</div>

<style>
	.profile-card,
	.pack-card,
	.offline-section,
	.region-card,
	.data-card {
		padding: 14px;
	}

	.profile-card {
		background:
			radial-gradient(circle at top right, rgba(106, 132, 95, 0.18), transparent 40%),
			linear-gradient(180deg, rgba(255, 253, 248, 0.98), rgba(244, 238, 224, 0.96));
		display: grid;
		gap: 12px;
	}

	.profile-top {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.avatar {
		width: 52px;
		height: 52px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: linear-gradient(135deg, var(--forest), #466852);
		color: #f9f3e8;
		font-family: var(--font-display);
		font-weight: 800;
		box-shadow: var(--shadow-soft);
	}

	.profile-copy {
		display: grid;
		gap: 2px;
	}

	.profile-copy h2 {
		font-family: var(--font-display);
		font-size: 1.32rem;
	}

	.profile-copy p:last-child {
		font-size: 0.82rem;
		color: var(--muted);
	}

	.profile-stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}

	.profile-stats div {
		padding: 10px 8px;
		border-radius: 12px;
		background: rgba(47, 75, 53, 0.08);
		text-align: center;
		display: grid;
		gap: 2px;
	}

	.profile-stats .num {
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--forest);
		line-height: 1;
	}

	.profile-stats small {
		font-size: 0.62rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	.hike-card {
		display: grid;
		gap: 12px;
	}

	.mile-now {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 14px;
		border-radius: 13px;
		background: rgba(47, 75, 53, 0.07);
	}

	.mile-figure {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 2.4rem;
		line-height: 1;
		color: var(--forest);
		display: flex;
		align-items: baseline;
		gap: 4px;
	}

	.mile-figure span {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--muted);
	}

	.mile-meta {
		display: grid;
		gap: 3px;
	}

	.mile-src {
		font-size: 0.82rem;
		font-weight: 800;
		color: var(--ink);
	}

	.mile-dir {
		font-size: 0.74rem;
		color: var(--muted);
		font-weight: 700;
	}

	.mile-set {
		display: flex;
		gap: 8px;
		align-items: stretch;
	}

	.mile-set input {
		flex: 1;
		min-width: 0;
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 10px 12px;
		background: var(--surface-strong);
		color: var(--ink);
	}

	.mile-set input:focus {
		outline: none;
		border-color: var(--forest);
		box-shadow: 0 0 0 3px rgba(47, 75, 53, 0.12);
	}

	.mile-set .cta-button.compact {
		flex: none;
	}

	.mile-set .cta-button.compact:disabled {
		opacity: 0.5;
	}

	.mile-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.mile-actions .outline-button.compact {
		width: 100%;
		justify-content: center;
	}

	.mile-feedback {
		font-size: 0.8rem;
		font-weight: 700;
		margin: 0;
	}

	.mile-feedback.ok {
		color: var(--success, #2f6a47);
	}

	.mile-feedback.warn {
		color: var(--clay);
	}

	.mile-feedback.note {
		color: var(--muted);
		font-weight: 600;
		line-height: 1.4;
	}

	.offline-section {
		display: grid;
		gap: 10px;
	}

	.outline-button.compact,
	.cta-button.compact {
		width: auto;
		min-height: 38px;
		padding: 6px 12px;
		font-size: 0.82rem;
		justify-self: start;
	}

	.model-card {
		display: grid;
		gap: 12px;
	}

	.model-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		font-size: 0.85rem;
		color: var(--muted);
	}

	.model-progress {
		display: grid;
		gap: 8px;
	}

	.model-progress .bar {
		height: 8px;
		border-radius: 999px;
		background: var(--line);
		overflow: hidden;
	}

	.model-progress .fill {
		height: 100%;
		background: var(--forest);
		transition: width 0.2s ease;
	}

	.model-ready {
		font-weight: 700;
		color: var(--forest);
		margin: 0;
	}

	.model-note {
		font-size: 0.85rem;
		color: var(--muted);
		margin: 0;
	}

	.model-error {
		font-size: 0.82rem;
		color: var(--danger, #b14a3d);
		margin: 0;
	}

	.metered-warn {
		display: grid;
		gap: 10px;
		padding: 10px 12px;
		border-radius: 12px;
		background: rgba(177, 74, 61, 0.08);
		border: 1px solid rgba(177, 74, 61, 0.2);
	}

	.metered-warn p {
		font-size: 0.84rem;
		color: var(--ink, #2c2a24);
		margin: 0;
	}

	.metered-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.habit-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0 16px;
	}

	.habit-row {
		padding: 10px 0;
	}

	.habit-row + .habit-row {
		border-top: none;
	}

	.habit-row .toggle-copy strong {
		font-size: 0.88rem;
	}

	.habit-row .toggle-copy span {
		font-size: 0.72rem;
	}

	.region-card {
		display: grid;
		gap: 6px;
	}

	.region-card h3 {
		font-family: var(--font-display);
		font-size: 1.05rem;
	}

	.region-card p {
		font-size: 0.84rem;
		color: var(--muted);
	}

	.region-meta {
		display: flex;
		gap: 10px;
		font-size: 0.74rem;
		color: var(--muted);
		font-weight: 700;
	}

	.data-card {
		display: grid;
		gap: 10px;
	}

	.data-grid {
		display: grid;
		gap: 6px;
	}

	.legal-card {
		padding: 14px 4px 8px;
		text-align: center;
		font-size: 0.72rem;
		color: var(--muted);
		display: grid;
		gap: 6px;
	}

	.legal-links {
		display: flex;
		gap: 6px;
		justify-content: center;
	}

	.legal-link {
		color: var(--forest);
		font-weight: 800;
		font-size: inherit;
		padding: 0;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.legal-links span {
		color: rgba(95, 101, 88, 0.4);
	}
</style>
