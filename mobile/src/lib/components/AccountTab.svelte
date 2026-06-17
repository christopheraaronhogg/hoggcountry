<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import PackStatus from './PackStatus.svelte';
	import OfflineStatus from './OfflineStatus.svelte';
	import SourceChip from './SourceChip.svelte';
	import { sourceReceipts, offlineModel } from './cockpitData';

	function fmtBytes(n: number | undefined): string {
		if (!n || n < 0) return '—';
		const gb = n / 1e9;
		return gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.round(n / 1e6)} MB`;
	}

	const model = $derived(trailAssistant.modelStatus);
	const dl = $derived(trailAssistant.modelDownload);
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
</script>

<div class="section-stack">
	<section class="card profile-card">
		<div class="profile-top">
			<div class="avatar">HC</div>
			<div class="profile-copy">
				<p class="eyebrow">Account · Pilot member</p>
				<h2>Chris "Hogg"</h2>
				<p>NOBO 2026 · Day {trailAssistant.dayNumber} · Mile {trailAssistant.currentMile.toFixed(1)}</p>
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

	<section class="card pack-card">
		<PackStatus />
	</section>

	<section class="card offline-section">
		<OfflineStatus />
		<button class="outline-button compact">Manage field packs</button>
	</section>

	{#if trailAssistant.supportsOnDeviceModel}
		<section class="card model-card">
			<div class="section-heading">
				<p class="eyebrow">On-device AI · Gemma 4</p>
				<h2>Offline brain</h2>
				<p>
					Scout's chat runs on a Gemma 4 model stored on your phone. Download it once on Wi-Fi and
					Scout answers keep working with no signal.
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
			{:else if model?.state === 'ready'}
				<p class="model-ready">✓ Installed and verified — Scout works fully offline.</p>
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
				<span>Update your day summary from check-ins and route state.</span>
			</div>
			<button
				class:on={trailAssistant.trailSettings.autoLogMileage}
				class="toggle"
				aria-label="Toggle auto-log mileage"
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
				aria-label="Toggle water alerts"
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
				aria-label="Toggle battery saver"
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
				aria-label="Toggle low-signal mode"
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
			<h2>Readiness inputs</h2>
			<p>These behaviors feed the readiness score. Skipping them quietly is how a hard day hides inside the mileage target.</p>
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
					aria-label="Toggle foot care logged"
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
					<span>Fuel debt = readiness drag.</span>
				</div>
				<button
					class:on={trailAssistant.trailLogSettings.caloriesLogged}
					class="toggle"
					aria-label="Toggle calories logged"
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
					aria-label="Toggle water carry checked"
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
					aria-label="Toggle stretching done"
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
		<h3>{trailAssistant.trailSettings.offlineRegion}</h3>
		<p>Primary downloaded region. Field pack rev synced for the next ~120 trail miles.</p>
		<div class="region-meta">
			<span>{offlineModel.regions.length} regions cached</span>
			<span>{(offlineModel.sizeMb / 1024).toFixed(1)} GB on device</span>
		</div>
		<button class="outline-button">Manage downloaded regions</button>
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
		<p>Hogg Country v0.1 (beta) · Privacy and data use are governed by your support circle settings.</p>
		<div class="legal-links">
			<button type="button" class="legal-link">Privacy</button>
			<span>·</span>
			<button type="button" class="legal-link">Terms</button>
			<span>·</span>
			<button type="button" class="legal-link">Source policy</button>
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

	.region-card .outline-button {
		justify-self: start;
		width: auto;
		min-height: 38px;
		padding: 6px 12px;
		font-size: 0.82rem;
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
