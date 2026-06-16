<script lang="ts">
	import { townSnapshot } from '$lib/mockTrailData';
	import SourceChip from './SourceChip.svelte';
	import ConfidenceBadge from './ConfidenceBadge.svelte';
	import { sourceReceipts } from './cockpitData';

	const categorySymbol: Record<string, string> = {
		hostel: '⌂',
		shuttle: '↺',
		resupply: '✦',
		gear: '⚙',
		food: '☕',
		laundry: '○'
	};

	const milesFromHere = 13.6;
	const etaHours = 4.5;
</script>

<div class="section-stack">
	<section class="town-hero card">
		<div class="hero-top">
			<div>
				<p class="eyebrow">Town ops · Next stop</p>
				<h2>{townSnapshot.name}</h2>
				<p class="hero-detail">Mile {townSnapshot.mile.toFixed(1)} · {milesFromHere.toFixed(1)} mi from here</p>
			</div>
			<ConfidenceBadge confidence="high" short />
		</div>

		<div class="town-stats">
			<div>
				<span class="num">{milesFromHere.toFixed(1)}</span>
				<small>miles</small>
			</div>
			<div>
				<span class="num">{etaHours.toFixed(1)} h</span>
				<small>walk pace</small>
			</div>
			<div>
				<span class="num">14:30</span>
				<small>est arrival</small>
			</div>
		</div>

		<div class="town-note">
			<strong>Approach</strong>
			<span>{townSnapshot.hitchNote}</span>
		</div>

		<div class="hero-sources">
			<SourceChip source={sourceReceipts.awol2026} />
			<SourceChip source={sourceReceipts.farout} />
		</div>
	</section>

	<section class="card concierge-card">
		<div class="concierge-head">
			<div>
				<p class="eyebrow">Concierge lane</p>
				<h3>Bed, box, or shuttle confirmed?</h3>
			</div>
			<span class="badge-soft">Live</span>
		</div>
		<p>Hand-off the messy bits: bed availability, shuttle timing, box pickup window. Support replies within ~15 min when you're online.</p>
		<div class="concierge-actions">
			<button class="cta-button">Queue town help</button>
			<button class="outline-button">Draft pickup msg</button>
		</div>
	</section>

	<section class="services-grid">
		{#each townSnapshot.services as service (service.name)}
			<article class="service-card card" data-category={service.category}>
				<div class="service-head">
					<span class="service-icon" aria-hidden="true">{categorySymbol[service.category] ?? '•'}</span>
					<div class="service-meta">
						<span class="category">{service.category}</span>
						<strong>{service.name}</strong>
					</div>
					<ConfidenceBadge confidence={service.category === 'hostel' || service.category === 'resupply' ? 'high' : 'medium'} short />
				</div>
				<p class="service-status">{service.status}</p>
				<p class="service-detail">{service.detail}</p>
			</article>
		{/each}
	</section>

	<section class="card protocol-card">
		<p class="eyebrow">Town protocol</p>
		<h3>Stop pacing rules</h3>
		<ul>
			<li>Foot care + calorie debt before laundry.</li>
			<li>Resupply by 15:30 — Bland PO closes at 16:30.</li>
			<li>Hostel decision before 17:00 so dinner is locked.</li>
			<li>Recovery > making up miles.</li>
		</ul>
		<div class="protocol-sources">
			<SourceChip source={sourceReceipts.hikerProfile} />
		</div>
	</section>
</div>

<style>
	.town-hero,
	.concierge-card,
	.service-card,
	.protocol-card {
		padding: 14px;
	}

	.town-hero {
		display: grid;
		gap: 12px;
		background:
			radial-gradient(circle at top right, rgba(170, 104, 67, 0.16), transparent 38%),
			linear-gradient(180deg, rgba(255, 251, 246, 0.98), rgba(247, 238, 226, 0.98));
	}

	.hero-top {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		align-items: flex-start;
	}

	.hero-top h2 {
		font-family: var(--font-display);
		font-size: 1.55rem;
		margin: 2px 0;
	}

	.hero-detail {
		font-size: 0.84rem;
		color: var(--muted);
	}

	.town-stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}

	.town-stats div {
		display: grid;
		gap: 2px;
		padding: 10px 8px;
		border-radius: 12px;
		background: rgba(170, 104, 67, 0.1);
		text-align: center;
	}

	.town-stats .num {
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--clay);
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.town-stats small {
		font-size: 0.62rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	.town-note {
		display: grid;
		gap: 4px;
		padding: 12px;
		border-radius: 12px;
		background: rgba(47, 75, 53, 0.08);
	}

	.town-note strong {
		font-size: 0.78rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--forest);
	}

	.town-note span {
		font-size: 0.88rem;
		color: var(--ink);
	}

	.hero-sources {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.concierge-card {
		display: grid;
		gap: 8px;
		background: linear-gradient(180deg, rgba(231, 240, 244, 0.6), rgba(255, 253, 248, 1));
	}

	.concierge-head {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		align-items: flex-end;
	}

	.concierge-head h3 {
		font-family: var(--font-display);
		font-size: 1.05rem;
	}

	.concierge-card p {
		font-size: 0.86rem;
		color: var(--muted);
	}

	.concierge-actions {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: 8px;
	}

	.services-grid {
		display: grid;
		gap: 10px;
	}

	.service-card {
		display: grid;
		gap: 6px;
	}

	.service-head {
		display: grid;
		grid-template-columns: 36px 1fr auto;
		gap: 10px;
		align-items: center;
	}

	.service-icon {
		width: 36px;
		height: 36px;
		border-radius: 12px;
		display: grid;
		place-items: center;
		font-size: 1.1rem;
		font-weight: 800;
		background: rgba(170, 104, 67, 0.14);
		color: var(--clay);
	}

	.service-card[data-category='hostel'] .service-icon {
		background: rgba(95, 128, 144, 0.18);
		color: var(--sky);
	}

	.service-card[data-category='shuttle'] .service-icon {
		background: rgba(200, 167, 122, 0.22);
		color: #8c5d1f;
	}

	.service-card[data-category='resupply'] .service-icon,
	.service-card[data-category='food'] .service-icon {
		background: rgba(47, 75, 53, 0.12);
		color: var(--forest);
	}

	.service-meta {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	.category {
		font-size: 0.62rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}

	.service-meta strong {
		font-size: 0.96rem;
	}

	.service-status {
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--forest);
	}

	.service-detail {
		font-size: 0.84rem;
		color: var(--muted);
	}

	.protocol-card {
		display: grid;
		gap: 8px;
		background: linear-gradient(180deg, rgba(255, 253, 248, 1), rgba(247, 242, 230, 1));
	}

	.protocol-card h3 {
		font-family: var(--font-display);
		font-size: 1.05rem;
	}

	.protocol-card ul {
		margin: 0;
		padding-left: 18px;
		display: grid;
		gap: 6px;
		font-size: 0.86rem;
		color: var(--ink);
	}

	.protocol-sources {
		padding-top: 6px;
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
</style>
