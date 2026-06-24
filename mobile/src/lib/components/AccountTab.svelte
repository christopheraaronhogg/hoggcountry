<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import { isSelfTracked, TOTAL_AT_MILES } from '$lib/scout/hike-profile';
	import type { MileSource } from '$lib/scout/hike-profile';
	import { onMount } from 'svelte';
	import PackStatus from './PackStatus.svelte';
	import OfflineStatus from './OfflineStatus.svelte';
	import SourceChip from './SourceChip.svelte';
	import { toUiSourceReceipt } from './source-receipts';
	import { cloudAuth } from '$lib/cloud/auth.svelte';
	import { syncEngine } from '$lib/cloud/syncEngine.svelte';
	import { pushManager } from '$lib/push/push.svelte';

	// Opt-in cloud backup (Phase 0). The app stays fully local + offline until the
	// hiker signs in here.
	let authMode = $state<'signin' | 'signup'>('signin');

	// Live backup state for the signed-in card (driven by the outbox engine).
	function relTime(iso: string | null): string {
		if (!iso) return 'not yet';
		const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
		if (secs < 45) return 'just now';
		const mins = Math.round(secs / 60);
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.round(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const days = Math.round(hrs / 24);
		return days === 1 ? 'yesterday' : `${days}d ago`;
	}
	const backupState = $derived(
		syncEngine.status === 'backing-up' || syncEngine.status === 'restoring'
			? 'is-syncing'
			: syncEngine.status === 'offline' || syncEngine.status === 'error'
				? 'is-waiting'
				: 'is-ok'
	);
	const backupLabel = $derived.by(() => {
		switch (syncEngine.status) {
			case 'restoring':
				return 'Restoring your hike…';
			case 'backing-up':
				return 'Backing up…';
			case 'offline':
				return syncEngine.pendingCount
					? `Saved on this phone · ${syncEngine.pendingCount} waiting for signal`
					: 'Saved on this phone · backs up when online';
			case 'error':
				return 'Backup paused — retrying shortly';
			default:
				return `Backed up · ${relTime(syncEngine.lastBackupAt)}`;
		}
	});
	let authName = $state('');
	let authEmail = $state('');
	let authPassword = $state('');
	const canSubmitAuth = $derived(
		!cloudAuth.busy &&
			authEmail.trim().length > 3 &&
			authPassword.length >= 8 &&
			(authMode === 'signin' || authName.trim().length > 0)
	);
	async function submitAuth() {
		if (!canSubmitAuth) return;
		const ok =
			authMode === 'signup'
				? await cloudAuth.register({ name: authName, email: authEmail, password: authPassword })
				: await cloudAuth.login({ email: authEmail, password: authPassword });
		if (ok) {
			authName = '';
			authEmail = '';
			authPassword = '';
		}
	}
	onMount(() => {
		void cloudAuth.init();
		// Reflect current notification permission/subscription (no prompt, no network
		// on the critical path) so the toggle shows the right state when opened.
		void pushManager.resync();
	});

	async function togglePush() {
		if (pushManager.busy) return;
		if (pushManager.enabled) await pushManager.disable();
		else await pushManager.enable();
	}

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
		manual: 'set manually',
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
		await trailAssistant.updateCurrentMile(mileDraft as number, 'manual');
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
	// One state machine for the model card so the heading pill and the body render
	// from the same truth. Order preserves the original branch priority exactly.
	const modelPhase = $derived(
		dl
			? 'downloading'
			: runtimeUnavailable
				? 'unavailable'
				: model?.state === 'ready'
					? 'ready'
					: trailAssistant.meteredDownloadPrompt
						? 'metered'
						: canDownload
							? 'idle'
							: 'unconfigured'
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
	const fieldPackSourceChips = $derived.by(() =>
		(fieldPack.sourceReceipts ?? []).map((receipt) => toUiSourceReceipt(receipt))
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

	<section class="card backup-card">
		{#if cloudAuth.signedIn}
			<div class="backup-head">
				<div>
					<p class="eyebrow">Cloud backup</p>
					<h2>Backed up to the cloud</h2>
				</div>
				<div class="backup-state {backupState}" aria-live="polite">
					<span class="backup-dot" aria-hidden="true"></span>
					<span>{backupLabel}</span>
				</div>
			</div>
			<p class="backup-sub">
				Signed in as <strong>{cloudAuth.user?.email}</strong>. Your position, check-ins, notes, gear
				and people sync to the cloud, so they survive a lost or dead phone and restore on a new one.
			</p>
			<button class="backup-signout" type="button" onclick={() => cloudAuth.logout()}>Sign out</button>

			<div class="toggle-row push-row">
				<div class="toggle-copy">
					<strong>Trail notifications</strong>
					<span>
						{#if pushManager.unavailableReason}
							{pushManager.unavailableReason}
						{:else if pushManager.permission === 'denied'}
							Blocked in your browser settings — re-enable notifications there to turn this on.
						{:else}
							Get a ping for conditions and (soon) daily readiness + family check-ins. Off by default.
						{/if}
					</span>
				</div>
				<button
					class:on={pushManager.enabled}
					class="toggle"
					role="switch"
					aria-checked={pushManager.enabled}
					aria-label="Trail notifications"
					disabled={!pushManager.available || pushManager.busy}
					onclick={togglePush}
				></button>
			</div>
			{#if pushManager.error}
				<p class="push-error" role="alert">{pushManager.error}</p>
			{/if}
		{:else}
			<div class="backup-head">
				<div>
					<p class="eyebrow">Cloud backup</p>
					<h2>Back up my hike</h2>
				</div>
			</div>
			<p class="backup-sub">
				Optional — the app works fully offline. Sign in to keep your position, check-ins, notes and
				people safe in the cloud and restore them on a new phone.
			</p>

			<div class="auth-tabs" role="tablist" aria-label="Sign in or create an account">
				<button
					class="auth-tab"
					class:active={authMode === 'signin'}
					type="button"
					role="tab"
					aria-selected={authMode === 'signin'}
					onclick={() => (authMode = 'signin')}>Sign in</button
				>
				<button
					class="auth-tab"
					class:active={authMode === 'signup'}
					type="button"
					role="tab"
					aria-selected={authMode === 'signup'}
					onclick={() => (authMode = 'signup')}>Create account</button
				>
			</div>

			<form
				class="auth-form"
				onsubmit={(e) => {
					e.preventDefault();
					submitAuth();
				}}
			>
				{#if authMode === 'signup'}
					<input
						class="auth-input"
						bind:value={authName}
						placeholder="Name"
						autocomplete="name"
						aria-label="Name"
					/>
				{/if}
				<input
					class="auth-input"
					type="email"
					inputmode="email"
					autocomplete="email"
					bind:value={authEmail}
					placeholder="Email"
					aria-label="Email"
				/>
				<input
					class="auth-input"
					type="password"
					autocomplete={authMode === 'signup' ? 'new-password' : 'current-password'}
					bind:value={authPassword}
					placeholder="Password"
					aria-label="Password"
				/>
				<button class="auth-submit" type="submit" disabled={!canSubmitAuth}>
					{cloudAuth.busy ? 'Working…' : authMode === 'signup' ? 'Create account' : 'Sign in'}
				</button>
			</form>

			{#if authMode === 'signup'}
				<p class="auth-note">
					Accounts are invite-only during the family beta. If Chris sent you an invite — an email and
					password — enter those on
					<button class="auth-link" type="button" onclick={() => (authMode = 'signin')}>Sign in</button>.
				</p>
			{/if}

			<button class="auth-apple" type="button" onclick={() => cloudAuth.signInWithApple()}>
				 Sign in with Apple
			</button>

			{#if cloudAuth.error}<p class="auth-error" role="alert">{cloudAuth.error}</p>{/if}
		{/if}
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
				<div class="heading-with-status">
					<h2>Offline brain</h2>
					{#if trailAssistant.modelError}
						<span class="pill pill-danger">Error</span>
					{:else if modelPhase === 'ready'}
						<span class="pill pill-forest">Ready</span>
					{:else if modelPhase === 'downloading'}
						<span class="pill pill-sky">Downloading</span>
					{:else if modelPhase === 'metered'}
						<span class="pill pill-warn">On cellular</span>
					{:else if modelPhase === 'unavailable'}
						<span class="pill pill-warn">Runtime pending</span>
					{/if}
				</div>
				<p>
					Scout's chat runs on a Gemma 4 model stored on your phone. Download it once on Wi-Fi and
					Scout answers keep working with no signal. The download continues in the background — you
					can leave this screen or lock your phone.
				</p>
			</div>

			{#if modelPhase === 'downloading'}
				<div class="model-progress">
					<div class="model-row">
						<span class="model-state-label">{pct !== null ? `${pct}%` : 'Downloading…'}</span>
						<span class="tabular">{fmtBytes(dl?.bytesDownloaded)} / {fmtBytes(dl?.totalBytes)}</span>
					</div>
					<div class="bar"><div class="fill" style="width:{pct ?? 0}%"></div></div>
					<button class="outline-button compact" onclick={() => trailAssistant.cancelModelDownload()}>
						Cancel download
					</button>
				</div>
			{:else if modelPhase === 'unavailable'}
				<p class="model-note">
					This iOS build can manage the model file, but the LiteRT-LM runtime is not linked yet.
					Install a runtime-enabled build before testing on-device Scout answers.
				</p>
			{:else if modelPhase === 'ready'}
				<p class="state-banner state-ok">
					<span class="state-ic" aria-hidden="true">✓</span>
					Installed and verified — Scout works fully offline.
				</p>
			{:else if modelPhase === 'metered'}
				<div class="state-banner state-warn metered">
					<p>
						<span class="state-ic" aria-hidden="true">⚠</span>
						You're on {trailAssistant.meteredDownloadPrompt?.type === 'cellular'
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
			{:else if modelPhase === 'idle'}
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
				<p class="state-banner state-danger" role="alert">
					<span class="state-ic" aria-hidden="true">!</span>
					{trailAssistant.modelError}
				</p>
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
				<span>Prefer local Scout answers; network actions wait until service is available.</span>
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
		<div class="section-heading">
			<p class="eyebrow">Offline readiness</p>
			<h2>{fieldPackRegion}</h2>
			<p>
				{fieldPackStatus.label}. Covers miles {fieldPack.frame.startMile.toFixed(1)}-{fieldPack.frame.endMile.toFixed(1)}
				({fieldPackMiles.toFixed(0)} mi) from the {fieldPackStatus.source} pack, loaded {fieldPackLoaded}.
			</p>
		</div>
		<div class="region-meta">
			<span>{fieldPack.downloadedRegions.length} {fieldPack.downloadedRegions.length === 1 ? 'region' : 'regions'} cached</span>
			<span>{model?.state === 'ready' ? `${fmtBytes(model.expectedBytes)} model on device` : 'Model not downloaded'}</span>
		</div>
		<p class="region-caveat">
			Field packs are planning context, not a basemap. Offline logs stay local until a real upload or
			text leaves this phone.
		</p>
	</section>

	<section class="card data-card">
		<div class="section-heading">
			<p class="eyebrow">Data sources</p>
			<h2>What Scout reads from</h2>
			<p>Scout cites the field pack actually loaded on this phone. Official/live sources appear here only when they are in the pack.</p>
		</div>
		<div class="data-grid">
			{#each fieldPackSourceChips as receipt (receipt.id)}
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
	/* Every section card gets consistent inner padding. (Previously only a
	   hand-listed subset did, so the bare cards — Trail-log automation, Daily
	   habits — plus the hike/model cards rendered their text flush to the edge.) */
	.section-stack .card {
		padding: 14px;
	}

	/* Cloud backup (opt-in) */
	.backup-card {
		display: grid;
		gap: 10px;
	}
	.backup-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px 12px;
		flex-wrap: wrap;
	}
	.backup-head h2 {
		margin-top: 2px;
		font-family: var(--font-display);
		font-size: 1.28rem;
		line-height: 1.08;
	}
	.backup-dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--moss);
		box-shadow: 0 0 0 4px var(--moss-soft);
	}

	/* Live backup status chip (top-right of the signed-in card). One pill, three
	   honest skins: backed up, backing up (pulsing), waiting for signal/retry. */
	.backup-state {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 5px 11px 5px 9px;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 800;
		white-space: nowrap;
		margin-top: 2px;
	}
	.backup-state .backup-dot {
		width: 7px;
		height: 7px;
		box-shadow: none;
	}
	.backup-state.is-ok {
		background: var(--moss-soft);
		color: var(--moss);
	}
	.backup-state.is-ok .backup-dot {
		background: var(--moss);
	}
	.backup-state.is-syncing {
		background: color-mix(in srgb, var(--sky) 16%, transparent);
		color: var(--sky);
	}
	.backup-state.is-syncing .backup-dot {
		background: var(--sky);
		animation: backup-pulse 1s ease-in-out infinite;
	}
	.backup-state.is-waiting {
		background: var(--warn-soft);
		color: #8c5d1f;
	}
	.backup-state.is-waiting .backup-dot {
		background: var(--clay);
	}
	@keyframes backup-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}
	@media (prefers-color-scheme: dark) {
		.backup-state.is-waiting {
			color: var(--warn);
		}
	}

	.auth-note {
		font-size: 0.8rem;
		line-height: 1.45;
		color: var(--muted);
	}
	.auth-link {
		display: inline;
		padding: 0;
		font: inherit;
		font-weight: 800;
		color: var(--forest);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.backup-sub {
		font-size: 0.86rem;
		line-height: 1.45;
		color: var(--muted);
	}
	.backup-sub strong {
		color: var(--ink);
	}
	.auth-tabs {
		display: grid;
		grid-auto-flow: column;
		gap: 6px;
		background: var(--ink-soft);
		border-radius: var(--radius-control);
		padding: 4px;
	}
	.auth-tab {
		min-height: 38px;
		border-radius: var(--radius-xs, 9px);
		font-weight: 800;
		font-size: 0.86rem;
		color: var(--muted);
	}
	.auth-tab.active {
		background: var(--surface-strong);
		color: var(--forest);
		box-shadow: var(--shadow-soft);
	}
	.auth-form {
		display: grid;
		gap: 8px;
	}
	.auth-input {
		min-height: 44px;
		padding: 0 14px;
		border-radius: var(--radius-control);
		border: 1px solid var(--line);
		background: var(--bg);
		color: var(--ink);
		font-size: 0.92rem;
	}
	.auth-input:focus-visible {
		outline: 2px solid var(--forest);
		outline-offset: 1px;
	}
	.auth-submit {
		min-height: 46px;
		border-radius: var(--radius-control);
		background: var(--forest);
		color: var(--on-accent);
		font-weight: 800;
		font-size: 0.95rem;
	}
	.auth-submit:disabled {
		opacity: 0.5;
	}
	.auth-apple {
		min-height: 46px;
		border-radius: var(--radius-control);
		background: #000;
		color: #fff;
		font-weight: 700;
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}
	.auth-error {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--danger);
		line-height: 1.4;
	}
	.backup-signout {
		min-height: 44px;
		border-radius: var(--radius-control);
		background: var(--ink-soft);
		color: var(--ink);
		font-weight: 800;
		justify-self: start;
		padding: 0 18px;
	}

	.profile-card {
		background:
			radial-gradient(circle at top right, var(--moss-soft), transparent 42%),
			var(--surface-strong);
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
		color: var(--on-accent);
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
		background: var(--forest-soft);
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
		font-size: 0.72rem;
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
		background: var(--forest-soft);
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
		min-height: 44px;
		border: 1px solid var(--line);
		border-radius: var(--radius-control);
		padding: 11px 12px;
		background: var(--surface-strong);
		color: var(--ink);
	}

	.mile-set input:focus {
		outline: none;
		border-color: var(--forest);
		box-shadow: 0 0 0 3px var(--forest-soft);
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
		min-height: 44px;
		padding: 9px 14px;
		font-size: 0.84rem;
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

	.heading-with-status {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.model-state-label {
		font-weight: 800;
		color: var(--forest);
	}

	.model-progress .bar {
		height: 8px;
		border-radius: 999px;
		background: var(--forest-soft);
		overflow: hidden;
	}

	.model-progress .fill {
		height: 100%;
		border-radius: 999px;
		background: var(--forest);
		transition: width var(--dur-base) var(--ease-out);
	}

	.model-note {
		font-size: 0.85rem;
		color: var(--muted);
		margin: 0;
	}

	/* One banner primitive, three semantic skins — every one has a dark pair, so
	   "ready / on cellular / something broke" read honestly in both modes. */
	.state-banner {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		margin: 0;
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		font-size: 0.86rem;
		line-height: 1.4;
	}

	.state-banner p {
		margin: 0;
	}

	.state-ic {
		flex-shrink: 0;
		font-weight: 900;
		line-height: 1.4;
	}

	.state-ok {
		background: var(--success-soft);
		color: var(--success);
	}

	.state-warn {
		background: var(--warn-soft);
		color: #8c5d1f;
	}

	.state-danger {
		background: var(--danger-soft);
		color: var(--danger);
	}

	.state-banner.metered {
		flex-direction: column;
		gap: 8px;
	}

	@media (prefers-color-scheme: dark) {
		.state-warn {
			color: var(--warn);
		}
	}

	.metered-actions {
		display: flex;
		gap: 8px;
	}

	.metered-actions > button {
		flex: 1;
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
		gap: 8px;
	}

	.region-caveat {
		font-size: var(--text-xs);
		line-height: 1.4;
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
		color: var(--muted);
		opacity: 0.55;
	}
</style>
