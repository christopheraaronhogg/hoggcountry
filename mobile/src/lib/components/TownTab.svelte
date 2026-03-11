<script lang="ts">
	import { townSnapshot } from '$lib/mockTrailData';
</script>

<div class="section-stack">
	<section class="card town-hero">
		<div class="section-heading">
			<p class="eyebrow">Town ops</p>
			<h2>{townSnapshot.name}</h2>
			<p>Mile {townSnapshot.mile.toFixed(1)} · {townSnapshot.eta}</p>
		</div>

		<div class="town-note">
			<strong>Best approach</strong>
			<span>{townSnapshot.hitchNote}</span>
		</div>
	</section>

	<section class="card concierge-card">
		<p class="eyebrow">Concierge lane</p>
		<h3>Need the messy stuff handled?</h3>
		<p>Use support when you need beds, shuttle timing, or box logistics confirmed instead of guessing your way into town.</p>
		<button class="cta-button">Queue town help</button>
	</section>

	<section class="stack-tight">
		{#each townSnapshot.services as service}
			<article class="card service-card">
				<div class="service-top">
					<span class="pill pill-clay">{service.category}</span>
					<span class="service-status">{service.status}</span>
				</div>
				<h3>{service.name}</h3>
				<p>{service.detail}</p>
			</article>
		{/each}
	</section>
</div>

<style>
	.town-hero,
	.concierge-card,
	.service-card {
		padding: 18px;
	}

	.town-hero {
		background:
			radial-gradient(circle at top right, rgba(170, 104, 67, 0.12), transparent 34%),
			linear-gradient(180deg, rgba(255, 251, 246, 0.98), rgba(247, 238, 228, 0.98));
	}

	.town-note {
		margin-top: 10px;
		display: grid;
		gap: 6px;
		padding: 14px;
		border-radius: 14px;
		background: rgba(47, 75, 53, 0.06);
	}

	.town-note strong {
		font-size: 0.85rem;
	}

	.town-note span,
	.concierge-card p,
	.service-card p {
		font-size: 0.88rem;
		color: var(--muted);
	}

	.concierge-card h3,
	.service-card h3 {
		margin: 6px 0 8px;
		font-size: 1rem;
	}

	.service-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.service-status {
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--forest);
	}
</style>
