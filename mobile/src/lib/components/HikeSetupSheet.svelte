<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import { clampMile, TOTAL_AT_MILES, todayISODate } from '$lib/scout/hike-profile';

	// First-run (and re-editable) "My hike" calibration. The app needs to know where
	// the user actually is on the AT before it can be their assistant instead of a
	// demo of Dad's pilot pack. Two honest paths: set up your own hike, or follow the
	// Hogg family's real 2026 thru-hike.

	const profile = $derived(trailAssistant.hikeProfile);
	const calibrated = $derived(profile.calibrated);

	// Prefill from the existing profile when re-editing from Settings. mileText is a
	// number|null because `bind:value` on a number input yields a number (or null
	// when empty) — keeping it numeric avoids string/number coercion bugs.
	let trailName = $state('');
	let direction = $state<'NOBO' | 'SOBO'>('NOBO');
	let startDate = $state(todayISODate());
	let mileText = $state<number | null>(null);
	let touched = $state(false);

	// Seed the form once when the sheet opens (existing profile → prefilled).
	let seeded = $state(false);
	$effect(() => {
		if (trailAssistant.hikeSetupOpen && !seeded) {
			if (profile.mode === 'self') {
				trailName = profile.trailName ?? '';
				direction = profile.direction;
				startDate = profile.startDate ?? todayISODate();
				mileText = profile.currentMile || null;
			}
			seeded = true;
		}
		if (!trailAssistant.hikeSetupOpen) seeded = false;
	});

	const mileValid = $derived(
		mileText !== null && Number.isFinite(mileText) && mileText >= 0 && mileText <= TOTAL_AT_MILES
	);

	let saving = $state(false);

	async function saveSelf() {
		touched = true;
		if (!mileValid || saving) return;
		saving = true;
		try {
			await trailAssistant.calibrateHike({
				mode: 'self',
				trailName,
				direction,
				startDate,
				currentMile: clampMile(mileText as number)
			});
		} finally {
			saving = false;
		}
	}

	async function followDad() {
		if (saving) return;
		saving = true;
		try {
			await trailAssistant.calibrateHike({ mode: 'dad-pilot' });
		} finally {
			saving = false;
		}
	}
</script>

<div class="scrim" role="dialog" aria-modal="true" aria-label="Set up your hike">
	<section class="sheet">
		{#if calibrated}
			<button class="close" aria-label="Close" onclick={() => trailAssistant.closeHikeSetup()}>×</button>
		{/if}

		<header class="sheet-head">
			<span class="logo" aria-hidden="true">HC</span>
			<div>
				<p class="eyebrow">Welcome to Scout</p>
				<h2>Where are you on the trail?</h2>
				<p class="sub">
					Scout works from your real position — water, shelters, towns, and the day all key off your
					current AT mile. Set it once and your check-ins keep it honest.
				</p>
			</div>
		</header>

		<div class="form">
			<label class="field">
				<span class="flabel">Trail name <em>optional</em></span>
				<input type="text" bind:value={trailName} placeholder="e.g. Birdsong" maxlength="40" autocomplete="off" />
			</label>

			<div class="field">
				<span class="flabel">Direction</span>
				<div class="seg">
					<button type="button" class:active={direction === 'NOBO'} onclick={() => (direction = 'NOBO')}>NOBO</button>
					<button type="button" class:active={direction === 'SOBO'} onclick={() => (direction = 'SOBO')}>SOBO</button>
				</div>
			</div>

			<label class="field">
				<span class="flabel">Start date</span>
				<input type="date" bind:value={startDate} max={todayISODate()} />
			</label>

			<label class="field">
				<span class="flabel">Current AT mile</span>
				<input
					type="number"
					inputmode="decimal"
					bind:value={mileText}
					placeholder="0 – {TOTAL_AT_MILES}"
					min="0"
					max={TOTAL_AT_MILES}
					step="0.1"
					class:invalid={touched && !mileValid}
				/>
				<span class="hint">
					{#if touched && !mileValid}
						Enter a mile between 0 and {TOTAL_AT_MILES}.
					{:else}
						NOBO mile from Springer (0) to Katahdin ({TOTAL_AT_MILES}).
					{/if}
				</span>
			</label>
		</div>

		<button class="cta-button" onclick={saveSelf} disabled={saving || (touched && !mileValid)}>
			{saving ? 'Setting up…' : 'Start my hike'}
		</button>

		<div class="or"><span>or</span></div>

		<button class="follow" onclick={followDad} disabled={saving}>
			<strong>Follow Dad's 2026 thru-hike</strong>
			<span>Track the Hogg family's real NOBO from Springer — no setup needed.</span>
		</button>
	</section>
</div>

<style>
	.scrim {
		position: absolute;
		inset: 0;
		z-index: 60;
		background: rgba(31, 36, 29, 0.55);
		backdrop-filter: blur(2px);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 0;
	}

	.sheet {
		position: relative;
		width: 100%;
		max-height: 92%;
		overflow-y: auto;
		background: var(--surface-strong);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		box-shadow: var(--shadow-ridge);
		padding: 20px 18px calc(18px + env(safe-area-inset-bottom, 0px));
		display: grid;
		gap: 14px;
		animation: rise 0.28s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes rise {
		from {
			transform: translateY(14px);
			opacity: 0.4;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.close {
		position: absolute;
		top: 12px;
		right: 14px;
		width: 32px;
		height: 32px;
		border-radius: 999px;
		font-size: 1.3rem;
		line-height: 1;
		color: var(--muted);
		background: rgba(47, 75, 53, 0.07);
	}

	.sheet-head {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.logo {
		width: 40px;
		height: 40px;
		border-radius: 11px;
		background: linear-gradient(135deg, var(--forest), #3a5f43);
		color: #f7f2e8;
		display: grid;
		place-items: center;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 0.82rem;
		flex: none;
		box-shadow: var(--shadow-soft);
	}

	.eyebrow {
		font-size: 0.62rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--moss);
		font-weight: 800;
	}

	.sheet-head h2 {
		font-family: var(--font-display);
		font-size: 1.35rem;
		line-height: 1.15;
		margin: 2px 0 4px;
	}

	.sub {
		font-size: 0.82rem;
		color: var(--muted);
		line-height: 1.45;
	}

	.form {
		display: grid;
		gap: 12px;
	}

	.field {
		display: grid;
		gap: 5px;
	}

	.flabel {
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}

	.flabel em {
		font-style: normal;
		font-weight: 600;
		text-transform: none;
		letter-spacing: 0;
		color: var(--muted);
		opacity: 0.7;
	}

	input {
		width: 100%;
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 11px 12px;
		background: var(--surface-strong);
		color: var(--ink);
	}

	input:focus {
		outline: none;
		border-color: var(--forest);
		box-shadow: 0 0 0 3px rgba(47, 75, 53, 0.12);
	}

	input.invalid {
		border-color: var(--danger);
		box-shadow: 0 0 0 3px rgba(154, 59, 47, 0.12);
	}

	.hint {
		font-size: 0.72rem;
		color: var(--muted);
	}

	.seg {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		padding: 4px;
		background: rgba(47, 75, 53, 0.07);
		border-radius: 12px;
	}

	.seg button {
		min-height: 38px;
		border-radius: 9px;
		font-weight: 800;
		font-size: 0.85rem;
		color: var(--muted);
	}

	.seg button.active {
		background: var(--surface-strong);
		color: var(--forest);
		box-shadow: var(--shadow-soft);
	}

	.cta-button:disabled {
		opacity: 0.5;
	}

	.or {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--muted);
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.or::before,
	.or::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--line);
	}

	.follow {
		display: grid;
		gap: 3px;
		text-align: left;
		padding: 13px 14px;
		border-radius: 13px;
		border: 1px solid var(--line);
		background: var(--surface);
	}

	.follow strong {
		font-size: 0.92rem;
		color: var(--forest);
	}

	.follow span {
		font-size: 0.78rem;
		color: var(--muted);
		line-height: 1.4;
	}

	.follow:disabled {
		opacity: 0.6;
	}
</style>
